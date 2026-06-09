'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface AnalyticsEvent {
    event: string;
    category: string;
    action: string;
    label?: string;
    value?: number;
    customParameters?: Record<string, any>;
}

interface UserSession {
    sessionId: string;
    startTime: number;
    pageViews: number;
    events: AnalyticsEvent[];
    userAgent: string;
    referrer: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    screenResolution: string;
    timezone: string;
}

interface AdvancedAnalyticsProps {
    children: React.ReactNode;
    gaTrackingId?: string;
    enableHeatmaps?: boolean;
    enableA11yTracking?: boolean;
    enablePerformanceTracking?: boolean;
}

export default function AdvancedAnalytics({
    children,
    gaTrackingId,
    enableHeatmaps = true,
    enableA11yTracking = true,
    enablePerformanceTracking = true
}: AdvancedAnalyticsProps) {
    const [session, setSession] = useState<UserSession | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const initializeAnalytics = () => {
            // Google Analytics 4
            if (gaTrackingId && typeof window !== 'undefined') {
                const script = document.createElement('script');
                script.async = true;
                script.src = `https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`;
                document.head.appendChild(script);

                const dataLayer = (window as any).dataLayer || [];
                (window as any).dataLayer = dataLayer;

                function gtag(...args: any[]) {
                    dataLayer.push(args);
                }

                gtag('js', new Date());
                gtag('config', gaTrackingId, {
                    custom_map: {
                        dimension1: 'user_type',
                        dimension2: 'session_quality',
                        dimension3: 'device_category',
                        metric1: 'page_views_per_session',
                        metric2: 'avg_session_duration'
                    }
                });

                (window as any).gtag = gtag;
            }

            setIsInitialized(true);
        };

        const initializeSession = () => {
            const sessionId = generateSessionId();
            const deviceType = getDeviceType();
            const screenResolution = `${window.screen.width}x${window.screen.height}`;

            const newSession: UserSession = {
                sessionId,
                startTime: Date.now(),
                pageViews: 0,
                events: [],
                userAgent: navigator.userAgent,
                referrer: document.referrer,
                deviceType,
                screenResolution,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            setSession(newSession);
            localStorage.setItem('analytics_session', JSON.stringify(newSession));
        };

        initializeAnalytics();
        initializeSession();
    }, [gaTrackingId]);

    useEffect(() => {
        return () => {
            if (session) {
                saveSessionData(session);
            }
        };
    }, [session]);

    useEffect(() => {
        if (isInitialized && session) {
            trackPageView();
        }
    }, [pathname, searchParams, isInitialized, session]);

    const initializeAnalytics = () => {
        // Google Analytics 4
        if (gaTrackingId && typeof window !== 'undefined') {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`;
            document.head.appendChild(script);

            const dataLayer = (window as any).dataLayer || [];
            (window as any).dataLayer = dataLayer;

            function gtag(...args: any[]) {
                dataLayer.push(args);
            }

            gtag('js', new Date());
            gtag('config', gaTrackingId, {
                custom_map: {
                    dimension1: 'user_type',
                    dimension2: 'session_quality',
                    dimension3: 'device_category',
                    metric1: 'page_views_per_session',
                    metric2: 'avg_session_duration'
                }
            });

            (window as any).gtag = gtag;
        }

        setIsInitialized(true);
    };

    const initializeSession = () => {
        const sessionId = generateSessionId();
        const deviceType = getDeviceType();
        const screenResolution = `${window.screen.width}x${window.screen.height}`;

        const newSession: UserSession = {
            sessionId,
            startTime: Date.now(),
            pageViews: 0,
            events: [],
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            deviceType,
            screenResolution,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        setSession(newSession);
        localStorage.setItem('analytics_session', JSON.stringify(newSession));
    };

    const trackPageView = useCallback(() => {
        const pageUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

        // Google Analytics
        if ((window as any).gtag) {
            (window as any).gtag('config', gaTrackingId, {
                page_path: pageUrl,
                custom_map: {
                    dimension1: session?.deviceType,
                    dimension2: getSessionQuality(),
                    metric1: session?.pageViews || 0
                }
            });
        }

        // Atualizar sessão
        setSession(prev => {
            if (!prev) return null;
            const updated = {
                ...prev,
                pageViews: prev.pageViews + 1,
                events: [...prev.events, {
                    event: 'page_view',
                    category: 'navigation',
                    action: 'view',
                    label: pageUrl,
                    customParameters: {
                        timeOnPage: 0,
                        scrollDepth: 0
                    }
                }]
            };
            localStorage.setItem('analytics_session', JSON.stringify(updated));
            return updated;
        });

        // Rastreamento de performance
        if (enablePerformanceTracking) {
            trackPerformanceMetrics();
        }

        // Heatmaps
        if (enableHeatmaps) {
            initializeHeatmapTracking();
        }

        // Acessibilidade
        if (enableA11yTracking) {
            trackAccessibilityMetrics();
        }
    }, [pathname, searchParams, session, enablePerformanceTracking, enableHeatmaps, enableA11yTracking, gaTrackingId]);

    const trackEvent = (event: Omit<AnalyticsEvent, 'timestamp'>) => {
        const fullEvent: AnalyticsEvent & { timestamp: number } = {
            ...event,
            timestamp: Date.now()
        };

        // Google Analytics
        if ((window as any).gtag) {
            (window as any).gtag('event', event.action, {
                event_category: event.category,
                event_label: event.label,
                value: event.value,
                custom_parameters: event.customParameters
            });
        }

        // Atualizar sessão
        setSession(prev => {
            if (!prev) return null;
            const updated = {
                ...prev,
                events: [...prev.events, fullEvent]
            };
            localStorage.setItem('analytics_session', JSON.stringify(updated));
            return updated;
        });
    };

    const trackPerformanceMetrics = () => {
        if ('performance' in window && 'getEntriesByType' in performance) {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

            if (navigation) {
                trackEvent({
                    event: 'performance',
                    category: 'web_vitals',
                    action: 'page_load',
                    label: 'dom_content_loaded',
                    value: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
                    customParameters: {
                        ttfb: navigation.responseStart - navigation.requestStart,
                        fcp: getFCP(),
                        lcp: getLCP()
                    }
                });
            }
        }
    };

    const initializeHeatmapTracking = () => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const rect = target.getBoundingClientRect();

            trackEvent({
                event: 'interaction',
                category: 'heatmap',
                action: 'click',
                label: `${target.tagName}[${target.className || 'no-class'}]`,
                customParameters: {
                    x: e.clientX,
                    y: e.clientY,
                    elementX: rect.left,
                    elementY: rect.top,
                    elementWidth: rect.width,
                    elementHeight: rect.height,
                    pageX: window.scrollX + e.clientX,
                    pageY: window.scrollY + e.clientY
                }
            });
        };

        const handleScroll = () => {
            const scrollDepth = Math.round(
                ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
            );

            // Debounce scroll tracking
            if (window.scrollTimeout) clearTimeout(window.scrollTimeout);
            window.scrollTimeout = setTimeout(() => {
                trackEvent({
                    event: 'interaction',
                    category: 'engagement',
                    action: 'scroll',
                    label: 'scroll_depth',
                    value: scrollDepth
                });
            }, 100);
        };

        document.addEventListener('click', handleClick);
        window.addEventListener('scroll', handleScroll);

        return () => {
            document.removeEventListener('click', handleClick);
            window.removeEventListener('scroll', handleScroll);
        };
    };

    const trackAccessibilityMetrics = () => {
        // Verificar se há foco visível
        const hasFocusIndicator = document.querySelectorAll('[style*="outline"], [style*="border"], .focus-visible').length > 0;

        // Verificar contraste
        const checkContrast = () => {
            const elements = document.querySelectorAll('*');
            let lowContrastCount = 0;

            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                const color = style.color;
                const backgroundColor = style.backgroundColor;

                if (color && backgroundColor && !isHighContrast(color, backgroundColor)) {
                    lowContrastCount++;
                }
            });

            return lowContrastCount;
        };

        trackEvent({
            event: 'accessibility',
            category: 'usability',
            action: 'focus_indicator',
            label: hasFocusIndicator ? 'present' : 'missing',
            value: hasFocusIndicator ? 1 : 0
        });

        trackEvent({
            event: 'accessibility',
            category: 'usability',
            action: 'contrast_check',
            label: 'low_contrast_elements',
            value: checkContrast()
        });
    };

    const saveSessionData = async (sessionData: UserSession) => {
        try {
            // Enviar dados para o servidor para análise posterior
            await fetch('/api/analytics/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...sessionData,
                    endTime: Date.now(),
                    duration: Date.now() - sessionData.startTime
                })
            });
        } catch (error) {
            console.error('Erro ao salvar dados da sessão:', error);
        }
    };

    // Funções auxiliares
    const generateSessionId = () => {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
        const width = window.innerWidth;
        if (width <= 768) return 'mobile';
        if (width <= 1024) return 'tablet';
        return 'desktop';
    };

    const getSessionQuality = (): string => {
        if (!session) return 'unknown';
        const duration = Date.now() - session.startTime;
        const pageViews = session.pageViews;

        if (duration > 300000 && pageViews > 3) return 'high'; // 5min+ e 3+ páginas
        if (duration > 60000 && pageViews > 1) return 'medium'; // 1min+ e 2+ páginas
        return 'low';
    };

    const getFCP = (): number => {
        const fcpEntry = performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint');
        return fcpEntry ? fcpEntry.startTime : 0;
    };

    const getLCP = (): number => {
        const lcpEntry = performance.getEntriesByType('largest-contentful-paint')[0];
        return lcpEntry ? lcpEntry.startTime : 0;
    };

    const isHighContrast = (color1: string, color2: string): boolean => {
        // Implementação simplificada de verificação de contraste
        // Em produção, use uma biblioteca como color-contrast
        return true; // Placeholder
    };

    // Expor função global para rastreamento manual
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).trackAnalyticsEvent = trackEvent;
        }
    }, []);

    return <>{children}</>;
}

// Hook para usar analytics em componentes
export function useAnalytics() {
    const trackEvent = (event: Omit<AnalyticsEvent, 'timestamp'>) => {
        if (typeof window !== 'undefined' && (window as any).trackAnalyticsEvent) {
            (window as any).trackAnalyticsEvent(event);
        }
    };

    const trackConversion = (conversionType: string, value?: number, currency = 'BRL') => {
        trackEvent({
            event: 'conversion',
            category: 'ecommerce',
            action: conversionType,
            value,
            customParameters: { currency }
        });
    };

    const trackProductView = (productId: string, productName: string, category: string) => {
        trackEvent({
            event: 'product_view',
            category: 'ecommerce',
            action: 'view_product',
            label: productId,
            customParameters: {
                product_name: productName,
                category: category
            }
        });
    };

    const trackAddToCart = (productId: string, quantity: number, price: number) => {
        trackEvent({
            event: 'add_to_cart',
            category: 'ecommerce',
            action: 'add_to_cart',
            label: productId,
            value: price * quantity,
            customParameters: {
                quantity,
                unit_price: price
            }
        });
    };

    return {
        trackEvent,
        trackConversion,
        trackProductView,
        trackAddToCart
    };
}