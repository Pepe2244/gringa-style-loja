'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

interface PWAManagerProps {
    children?: React.ReactNode;
}

export default function PWAManager({ children }: PWAManagerProps) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 1. Registro ultra-otimizado do Service Worker (ZERO impacto no PageSpeed / FCP / LCP)
        // Só registra quando o navegador estiver 100% ocioso após o carregamento da página
        if ('serviceWorker' in navigator) {
            const registerServiceWorker = () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((reg) => {
                        // Verifica atualizações em background de forma silenciosa
                        if (reg && reg.update) {
                            reg.update().catch(() => {});
                        }
                    })
                    .catch((error) => {
                        console.warn('[PWA] Service Worker não registrado:', error);
                    });
            };

            if (document.readyState === 'complete') {
                if ('requestIdleCallback' in window) {
                    (window as any).requestIdleCallback(registerServiceWorker);
                } else {
                    setTimeout(registerServiceWorker, 2000);
                }
            } else {
                window.addEventListener(
                    'load',
                    () => {
                        if ('requestIdleCallback' in window) {
                            (window as any).requestIdleCallback(registerServiceWorker);
                        } else {
                            setTimeout(registerServiceWorker, 2000);
                        }
                    },
                    { once: true }
                );
            }
        }

        // 2. Verificar se o app já está rodando em modo standalone
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
        setIsInstalled(isStandalone);

        let installTimer: ReturnType<typeof setTimeout> | null = null;

        // 3. Listener do prompt de instalação nativo
        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Não exibe imediatamente para não poluir a tela no primeiro segundo (evita queda no PageSpeed / CLS)
            // Aguarda 10 segundos de engajamento do usuário
            if (installTimer) clearTimeout(installTimer);
            installTimer = setTimeout(() => {
                const dismissedAt = localStorage.getItem('pwa_dismissed_at');
                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                const wasRecentlyDismissed = dismissedAt && Date.now() - Number(dismissedAt) < sevenDays;

                if (!isStandalone && !wasRecentlyDismissed) {
                    setShowInstallPrompt(true);
                }
            }, 10000);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowInstallPrompt(false);
            setDeferredPrompt(null);
            if ((window as any).gtag) {
                (window as any).gtag('event', 'app_install', {
                    event_category: 'engagement',
                    event_label: 'pwa_installed',
                });
            }
        };

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            if (installTimer) clearTimeout(installTimer);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setIsInstalled(true);
            }
            setDeferredPrompt(null);
            setShowInstallPrompt(false);
        } catch (error) {
            console.error('[PWA] Erro ao instalar:', error);
        }
    };

    const dismissInstallPrompt = () => {
        setShowInstallPrompt(false);
        try {
            localStorage.setItem('pwa_dismissed_at', String(Date.now()));
        } catch {}
    };

    return (
        <>
            {children}

            {/* Aviso de Offline */}
            {!isOnline && (
                <div
                    role="status"
                    aria-live="polite"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        background: '#e11d48',
                        color: '#ffffff',
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    }}
                >
                    📶 Você está offline no momento. O catálogo salvo em cache continua acessível.
                </div>
            )}

            {/* Prompt de Instalação PWA Responsivo */}
            {showInstallPrompt && !isInstalled && (
                <div
                    role="dialog"
                    aria-label="Instalar aplicativo Gringa Style"
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 'calc(100% - 32px)',
                        maxWidth: '480px',
                        zIndex: 9998,
                        background: '#1F1F1F',
                        border: '1px solid #333333',
                        borderLeft: '4px solid #FFA500',
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                        color: '#FFFFFF',
                        fontFamily: 'inherit',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '10px',
                                background: '#FFA500',
                                color: '#111',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '22px',
                                flexShrink: 0,
                                fontWeight: 'bold',
                            }}
                        >
                            ⚡
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: '#FFFFFF' }}>
                                Instalar App Gringa Style
                            </h4>
                            <p style={{ margin: 0, fontSize: '12px', color: '#AAAAAA', lineHeight: '1.4' }}>
                                Acesso ultrarrápido às máscaras de solda, rifas ativas e ofertas exclusivas direto na sua tela inicial.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={dismissInstallPrompt}
                            type="button"
                            style={{
                                background: 'transparent',
                                border: '1px solid #444',
                                color: '#AAA',
                                padding: '8px 14px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                cursor: 'pointer',
                                fontWeight: '500',
                            }}
                        >
                            Agora não
                        </button>
                        <button
                            onClick={handleInstallClick}
                            type="button"
                            style={{
                                background: '#FFA500',
                                border: 'none',
                                color: '#111111',
                                padding: '8px 18px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                cursor: 'pointer',
                                fontWeight: '700',
                            }}
                        >
                            Instalar App
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}