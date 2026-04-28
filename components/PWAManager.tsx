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
    children: React.ReactNode;
}

export default function PWAManager({ children }: PWAManagerProps) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Verificar se já está instalado
        const checkInstalled = () => {
            if (typeof window !== 'undefined') {
                const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
                const isInWebAppiOS = (window.navigator as any).standalone === true;
                setIsInstalled(isStandalone || isInWebAppiOS);
            }
        };

        checkInstalled();

        // Listener para o evento beforeinstallprompt
        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);

            // Mostrar prompt automaticamente após alguns segundos se o usuário estiver engajado
            setTimeout(() => {
                if (!isInstalled && !localStorage.getItem('installPromptDismissed')) {
                    setShowInstallPrompt(true);
                }
            }, 3000);
        };

        // Listener para quando o app é instalado
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setShowInstallPrompt(false);
            setDeferredPrompt(null);

            // Rastrear instalação
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'app_install', {
                    event_category: 'engagement',
                    event_label: 'pwa_install'
                });
            }
        };

        // Listeners de conectividade
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isInstalled]);

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
            console.error('Erro ao instalar PWA:', error);
        }
    };

    const dismissInstallPrompt = () => {
        setShowInstallPrompt(false);
        localStorage.setItem('installPromptDismissed', 'true');

        // Rastrear dismiss
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'install_prompt_dismissed', {
                event_category: 'engagement'
            });
        }
    };

    return (
        <>
            {children}

            {/* Prompt de instalação */}
            {showInstallPrompt && !isInstalled && (
                <div className="pwa-install-prompt">
                    <div className="pwa-install-content">
                        <div className="pwa-install-icon">📱</div>
                        <div className="pwa-install-text">
                            <h3>Instale o Gringa Style</h3>
                            <p>Acesse nossos produtos mais rapidamente com o app!</p>
                            <div className="pwa-install-features">
                                <span>🛍️ Compras rápidas</span>
                                <span>🔔 Notificações</span>
                                <span>📱 Experiência nativa</span>
                            </div>
                        </div>
                        <div className="pwa-install-actions">
                            <button
                                className="pwa-install-button"
                                onClick={handleInstallClick}
                            >
                                Instalar
                            </button>
                            <button
                                className="pwa-dismiss-button"
                                onClick={dismissInstallPrompt}
                            >
                                Agora não
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Indicador de offline */}
            {!isOnline && (
                <div className="offline-indicator">
                    <div className="offline-content">
                        <span className="offline-icon">📶</span>
                        <span>Você está offline. Algumas funcionalidades podem não estar disponíveis.</span>
                    </div>
                </div>
            )}

            {/* Compartilhar botão (PWA) */}
            {isInstalled && (
                <ShareButton />
            )}

            <style jsx>{`
                .pwa-install-prompt {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    z-index: 1000;
                    animation: slideUp 0.3s ease-out;
                }

                .pwa-install-content {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border: 1px solid var(--cor-borda, #e9ecef);
                }

                .pwa-install-icon {
                    font-size: 2rem;
                    flex-shrink: 0;
                }

                .pwa-install-text {
                    flex: 1;
                }

                .pwa-install-text h3 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--cor-texto, #333);
                }

                .pwa-install-text p {
                    margin: 0 0 0.75rem 0;
                    font-size: 0.9rem;
                    color: var(--cor-texto-secundario, #666);
                }

                .pwa-install-features {
                    display: flex;
                    gap: 0.75rem;
                    font-size: 0.8rem;
                    color: var(--cor-texto-secundario, #666);
                }

                .pwa-install-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .pwa-install-button {
                    background: var(--cor-destaque, #ff6b35);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }

                .pwa-install-button:hover {
                    background: var(--cor-destaque-hover, #e55a2b);
                }

                .pwa-dismiss-button {
                    background: transparent;
                    color: var(--cor-texto-secundario, #666);
                    border: none;
                    padding: 0.25rem 0.5rem;
                    font-size: 0.8rem;
                    cursor: pointer;
                    text-decoration: underline;
                }

                .offline-indicator {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    background: #ff6b35;
                    color: white;
                    padding: 0.5rem;
                    text-align: center;
                    animation: slideDown 0.3s ease-out;
                }

                .offline-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                }

                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @media (max-width: 768px) {
                    .pwa-install-content {
                        flex-direction: column;
                        text-align: center;
                        gap: 1rem;
                    }

                    .pwa-install-actions {
                        flex-direction: row;
                        width: 100%;
                    }

                    .pwa-install-button,
                    .pwa-dismiss-button {
                        flex: 1;
                    }
                }
            `}</style>
        </>
    );
}

// Componente para compartilhamento (PWA)
function ShareButton() {
    const [canShare, setCanShare] = useState(false);

    useEffect(() => {
        setCanShare(typeof navigator !== 'undefined' && 'share' in navigator);
    }, []);

    const handleShare = async () => {
        if (!canShare) return;

        try {
            await navigator.share({
                title: 'Gringa Style - Moda Feminina',
                text: 'Confira esta loja incrível de moda feminina!',
                url: window.location.href
            });
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
        }
    };

    if (!canShare) return null;

    return (
        <button
            className="share-button"
            onClick={handleShare}
            aria-label="Compartilhar"
        >
            📤
        </button>
    );
}