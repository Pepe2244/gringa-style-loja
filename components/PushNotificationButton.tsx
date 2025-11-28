'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Check } from 'lucide-react';

const VAPID_PUBLIC_KEY = 'BBADPd_a1fbfvFIxY2ZlJfO9CQZ1OO_11Zn-2uu_2WvWN-nLG_ZaVk0PJJrRJ8WnCLSRw-8oMjx8FnhUxExgidw';

export default function PushNotificationButton() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            registerServiceWorker();
        } else {
            setLoading(false);
        }
    }, []);

    const registerServiceWorker = async () => {
        try {
            const swReg = await navigator.serviceWorker.register('/sw.js');
            const subscription = await swReg.pushManager.getSubscription();
            if (subscription) {
                setIsSubscribed(true);
            }
        } catch (error) {
            console.error('Erro ao registrar SW:', error);
        } finally {
            setLoading(false);
        }
    };

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const handleSubscribe = async () => {
        if (isSubscribed) return;

        try {
            const swReg = await navigator.serviceWorker.ready;
            const subscription = await swReg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            await saveSubscription(subscription);
            setIsSubscribed(true);
        } catch (error) {
            console.error('Falha ao inscrever:', error);
            alert('Erro ao ativar notificações. Verifique se você permitiu no navegador.');
        }
    };

    const saveSubscription = async (subscription: PushSubscription) => {
        const subscriptionJson = subscription.toJSON();
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                endpoint: subscriptionJson.endpoint,
                keys: subscriptionJson.keys,
                user_agent: navigator.userAgent
            }, { onConflict: 'endpoint' });

        if (error) {
            console.error('Erro ao salvar inscrição no Supabase:', error);
        }
    };

    if (!isSupported) return null;

    if (loading) return null; // Or a spinner

    return (
        <div className="push-subscribe-container">
            <button
                id="push-subscribe-button"
                className={isSubscribed ? 'inscrito' : ''}
                onClick={handleSubscribe}
                disabled={isSubscribed}
            >
                {isSubscribed ? (
                    <>
                        <Check size={18} />
                        <span>Notificações Ativas</span>
                    </>
                ) : (
                    <>
                        <Bell size={18} />
                        <span>Ativar Notificações</span>
                    </>
                )}
            </button>
        </div>
    );
}
