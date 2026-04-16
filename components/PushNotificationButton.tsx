'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

export default function PushNotificationButton() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Verificar se o navegador suporta notificações push
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
        }
    }, []);

    const handleSubscribe = async () => {
        if (!isSupported) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
            });
            setIsSubscribed(true);
            console.log('Notificações ativadas:', subscription);
        } catch (error) {
            console.error('Erro ao ativar notificações:', error);
        }
    };

    if (!isSupported) {
        return null;
    }

    return (
        <button
            onClick={handleSubscribe}
            disabled={isSubscribed}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: isSubscribed ? '#10b981' : 'var(--cor-destaque)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubscribed ? 'default' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.3s',
            }}
            className="hover:opacity-90"
        >
            <Bell size={16} />
            {isSubscribed ? 'Notificações Ativadas' : 'Ativar Notificações'}
        </button>
    );
}
