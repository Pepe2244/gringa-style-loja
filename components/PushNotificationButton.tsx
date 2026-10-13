'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

export default function PushNotificationButton() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
            setIsSupported(true);

            navigator.serviceWorker.register('/sw-v2.js')
                .then((registration) => registration.pushManager.getSubscription())
                .then((subscription) => {
                    if (subscription) {
                        setIsSubscribed(true);
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
                setIsSubscribed(true);
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
            });

            if (subscription) {
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
