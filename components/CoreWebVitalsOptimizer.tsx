'use client';

import { useEffect } from 'react';

// Core Web Vitals tracking
export function useCoreWebVitals() {
    useEffect(() => {
        // Verificar se estamos no browser
        if (typeof window === 'undefined') return;

        // Função para enviar métricas para analytics
        const reportWebVitals = (metric: any) => {
            // Enviar para Google Analytics 4
            const gtag = (window as any).gtag;
            if (typeof gtag !== 'undefined') {
                gtag('event', metric.name, {
                    event_category: 'Web Vitals',
                    event_label: metric.id,
                    value: Math.round(metric.value),
                    custom_map: { metric_value: metric.value }
                });
            }

            // Log no console em desenvolvimento
            if (process.env.NODE_ENV === 'development') {
                console.log('Web Vitals:', metric);
            }
        };

        // Importar web-vitals dinamicamente
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
            // Cumulative Layout Shift (CLS)
            getCLS(reportWebVitals);

            // First Input Delay (FID)
            getFID(reportWebVitals);

            // First Contentful Paint (FCP)
            getFCP(reportWebVitals);

            // Largest Contentful Paint (LCP)
            getLCP(reportWebVitals);

            // Time to First Byte (TTFB)
            getTTFB(reportWebVitals);
        }).catch((error) => {
            console.warn('Failed to load web-vitals:', error);
        });

        // Monitorar Largest Contentful Paint manualmente como fallback
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'largest-contentful-paint') {
                    reportWebVitals({
                        name: 'LCP',
                        value: entry.startTime,
                        id: 'v3-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
                    });
                }
            }
        });

        try {
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (error) {
            console.warn('LCP observation not supported:', error);
        }

        return () => {
            observer.disconnect();
        };
    }, []);
}

// Hook para otimizar imagens automaticamente
export function useImageOptimization() {
    useEffect(() => {
        // Verificar suporte a WebP
        const checkWebPSupport = () => {
            return new Promise<boolean>((resolve) => {
                const webP = new Image();
                webP.onload = webP.onerror = () => {
                    resolve(webP.height === 2);
                };
                webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
            });
        };

        // Verificar conexão do usuário
        const getConnectionInfo = () => {
            const connection = (navigator as any).connection ||
                             (navigator as any).mozConnection ||
                             (navigator as any).webkitConnection;

            if (!connection) return { effectiveType: '4g', saveData: false };

            return {
                effectiveType: connection.effectiveType || '4g',
                saveData: connection.saveData || false
            };
        };

        // Aplicar otimizações baseadas na conexão
        const applyOptimizations = async () => {
            const supportsWebP = await checkWebPSupport();
            const connection = getConnectionInfo();

            // Adicionar classe ao body baseada na conexão
            const connectionClass = connection.saveData ? 'save-data' :
                                  connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' ? 'slow-connection' :
                                  connection.effectiveType === '3g' ? 'medium-connection' : 'fast-connection';

            document.body.classList.add(connectionClass);

            // Configurar lazy loading global
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target as HTMLImageElement;
                            if (img.dataset.src) {
                                img.src = img.dataset.src;
                                img.classList.remove('lazy');
                                imageObserver.unobserve(img);
                            }
                        }
                    });
                }, {
                    rootMargin: '50px 0px',
                    threshold: 0.01
                });

                // Observar todas as imagens com lazy loading
                document.querySelectorAll('img[data-src]').forEach(img => {
                    imageObserver.observe(img);
                });
            }

            // Otimizar loading de recursos baseado na conexão
            if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                // Reduzir qualidade de imagens
                document.documentElement.style.setProperty('--image-quality', '60');

                // Desabilitar animações não essenciais
                document.documentElement.style.setProperty('--animation-duration', '0.1s');

                // Reduzir preload de recursos
                const links = document.querySelectorAll('link[rel="preload"]');
                links.forEach(link => {
                    if (!link.hasAttribute('data-critical')) {
                        link.remove();
                    }
                });
            }
        };

        applyOptimizations();
    }, []);
}

// Hook para otimizar Cumulative Layout Shift (CLS)
export function useCLSOptimization() {
    useEffect(() => {
        // Reservar espaço para imagens antes do carregamento
        const reserveImageSpace = () => {
            const images = document.querySelectorAll<HTMLImageElement>('img:not([width]):not([height])');

            images.forEach(img => {
                if (!img.hasAttribute('width') && !img.hasAttribute('height')) {
                    // Estimar dimensões baseado no aspect ratio se disponível
                    const aspectRatio = img.getAttribute('data-aspect-ratio');
                    if (aspectRatio) {
                        const [width, height] = aspectRatio.split('/').map(Number);
                        const containerWidth = img.parentElement?.clientWidth || 300;
                        const calculatedHeight = (height / width) * containerWidth;

                        // Aplicar dimensões mínimas para evitar CLS
                        img.style.minHeight = `${calculatedHeight}px`;
                        img.style.aspectRatio = aspectRatio;
                    } else {
                        // Fallback: definir altura mínima
                        img.style.minHeight = '200px';
                    }
                }
            });
        };

        // Executar após o DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', reserveImageSpace);
        } else {
            reserveImageSpace();
        }

        // Monitorar mudanças no DOM que podem causar CLS
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element;
                        if (element.tagName === 'IMG') {
                            reserveImageSpace();
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => {
            observer.disconnect();
        };
    }, []);
}

// Hook para otimizar First Input Delay (FID)
export function useFIDOptimization() {
    useEffect(() => {
        // Reduzir JavaScript blocking
        const deferNonCriticalJS = () => {
            const scripts = document.querySelectorAll('script[src]:not([defer]):not([async])');

            scripts.forEach(script => {
                if (!script.hasAttribute('data-critical')) {
                    script.setAttribute('defer', '');
                }
            });
        };

        // Otimizar event listeners
        const optimizeEventListeners = () => {
            // Throttle scroll events
            let scrollTimeout: NodeJS.Timeout;
            const handleScroll = () => {
                if (!scrollTimeout) {
                    scrollTimeout = setTimeout(() => {
                        // Processar scroll
                        scrollTimeout = undefined as any;
                    }, 16); // ~60fps
                }
            };

            // Throttle resize events
            let resizeTimeout: NodeJS.Timeout;
            const handleResize = () => {
                if (!resizeTimeout) {
                    resizeTimeout = setTimeout(() => {
                        // Processar resize
                        resizeTimeout = undefined as any;
                    }, 16);
                }
            };

            window.addEventListener('scroll', handleScroll, { passive: true });
            window.addEventListener('resize', handleResize, { passive: true });
        };

        deferNonCriticalJS();
        optimizeEventListeners();
    }, []);
}

// Componente principal que combina todas as otimizações
export default function CoreWebVitalsOptimizer() {
    useCoreWebVitals();
    useImageOptimization();
    useCLSOptimization();
    useFIDOptimization();

    return null; // Componente invisível
}