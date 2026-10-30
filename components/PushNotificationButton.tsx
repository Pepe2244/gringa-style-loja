'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function syncSubscriptionWithServer(subscription: PushSubscription) {
    try {
        const subJson = subscription.toJSON();
        if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: subJson.endpoint,
                    p256dh: subJson.keys.p256dh,
                    auth: subJson.keys.auth,
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
                }),
            });
        }
    } catch (err) {
        console.error('[PWA] Erro ao sincronizar push subscription com servidor:', err);
    }
}

export default function PushNotificationButton() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
            setIsSupported(true);

            navigator.serviceWorker.register('/sw.js')
                .then((registration) => registration.pushManager.getSubscription())
                .then((subscription) => {
                    if (subscription) {
                        setIsSubscribed(true);
                        // Garante que a inscrição existente esteja sincronizada com o banco
                        syncSubscriptionWithServer(subscription);
                    }
                })
                .catch((error) => {
                    console.warn('[PWA] Service Worker não registrado:', error);
                });
        }
    }, []);

    const handleSubscribe = async () => {
        if (!isSupported || loading || isSubscribed) return;
        setLoading(true);

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Permissão de notificações não concedida no navegador.');
                return;
            }

            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout ao aguardar Service Worker')), 5000))
            ]);

            // Verifica se já existe subscription ativa
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                await syncSubscriptionWithServer(existingSubscription);
                setIsSubscribed(true);
                return;
            }

            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (vapidKey) {
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey),
                });
                if (subscription) {
                    await syncSubscriptionWithServer(subscription);
                    setIsSubscribed(true);
                }
            } else {
                // Notificações locais permitidas no navegador
                setIsSubscribed(true);
            }
        } catch (error) {
            console.error('Erro ao ativar notificações:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isSupported) {
        return null;
    }

    return (
        <button
            onClick={handleSubscribe}
            disabled={isSubscribed || loading}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: isSubscribed ? '#10b981' : 'var(--cor-destaque)',
                color: isSubscribed ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubscribed || loading ? 'default' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background-color 0.3s',
            }}
            className="hover:opacity-90"
        >
            <Bell size={16} />
            {loading ? 'Ativando...' : isSubscribed ? 'Notificações Ativadas' : 'Ativar Notificações'}
        </button>
    );
}
