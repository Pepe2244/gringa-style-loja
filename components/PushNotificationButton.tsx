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

async function syncSubscriptionWithServer(subscription: PushSubscription): Promise<boolean> {
    try {
        const subJson = subscription.toJSON();
        if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
            return false;
        }
        const res = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: subJson.endpoint,
                p256dh: subJson.keys.p256dh,
                auth: subJson.keys.auth,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            }),
        });
        if (!res.ok) {
            console.error('[PWA] Falha ao sincronizar push subscription:', res.status);
            return false;
        }
        return true;
    } catch (err) {
        console.error('[PWA] Erro ao sincronizar push subscription com servidor:', err);
        return false;
    }
}

export default function PushNotificationButton() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
            setIsSupported(true);

            navigator.serviceWorker.register('/sw.js')
                .then((registration) => registration.pushManager.getSubscription())
                .then(async (subscription) => {
                    if (subscription) {
                        const synced = await syncSubscriptionWithServer(subscription);
                        if (synced) {
                            setIsSubscribed(true);
                        }
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
        setErrorMessage(null);

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setErrorMessage('Permissão de notificações não concedida no navegador.');
                return;
            }

            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout ao aguardar Service Worker')), 5000))
            ]);

            // Verifica se já existe subscription ativa
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                const synced = await syncSubscriptionWithServer(existingSubscription);
                if (!synced) {
                    setErrorMessage('Não foi possível sincronizar a inscrição de notificações.');
                    return;
                }
                setIsSubscribed(true);
                return;
            }

            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidKey) {
                setErrorMessage('Notificações push não configuradas no momento.');
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });
            if (!subscription) {
                setErrorMessage('Não foi possível criar a inscrição de notificações.');
                return;
            }

            const synced = await syncSubscriptionWithServer(subscription);
            if (!synced) {
                setErrorMessage('Não foi possível salvar sua inscrição no servidor.');
                return;
            }
            setIsSubscribed(true);
        } catch (error) {
            console.error('Erro ao ativar notificações:', error);
            setErrorMessage('Erro ao ativar notificações. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (!isSupported) {
        return null;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
            {errorMessage && (
                <p role="alert" style={{ margin: 0, fontSize: '12px', color: '#ef4444' }}>
                    {errorMessage}
                </p>
            )}
        </div>
    );
}
