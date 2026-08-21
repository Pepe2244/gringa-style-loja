'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
    enableA11yTracking = false, // Desativado por padrão em e-commerce para focar em performance
    enablePerformanceTracking = true
}: AdvancedAnalyticsProps) {
    const [session, setSession] = useState<UserSession | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    // Usamos ref para rastrear a sessão atual dentro de event listeners sem problemas de closure
    const sessionRef = useRef<UserSession | null>(null);

    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    useEffect(() => {
        const initAnalytics = () => {
            // Inicialização do Google Analytics 4
            if (gaTrackingId && typeof window !== 'undefined' && !(window as any).gtag) {
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

            // Inicialização da Sessão
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const width = window.innerWidth;
            const deviceType = width <= 768 ? 'mobile' : width <= 1024 ? 'tablet' : 'desktop';

            const newSession: UserSession = {
                sessionId,
                startTime: Date.now(),
                pageViews: 0,
                events: [],
                userAgent: navigator.userAgent,
                referrer: document.referrer,
                deviceType,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            setSession(newSession);
            setIsInitialized(true);
        };

        initAnalytics();
    }, [gaTrackingId]);

    // Rastreamento infalível de fim de sessão (Abandono de página)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && sessionRef.current) {
                const sessionData = sessionRef.current;
                const payload = JSON.stringify({
                    ...sessionData,
                    endTime: Date.now(),
                    duration: Date.now() - sessionData.startTime
                });

                // sendBeacon garante que o dado chegue ao servidor mesmo com a aba fechando
                if (navigator.sendBeacon) {
                    navigator.sendBeacon('/api/analytics/session', payload);
                } else {
                    fetch('/api/analytics/session', {
                        method: 'POST',
                        body: payload,
                        keepalive: true, // Flag crucial de sobrevivência do request
                        headers: { 'Content-Type': 'application/json' }
                    }).catch(console.error);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const trackEvent = useCallback((event: Omit<AnalyticsEvent, 'timestamp'>) => {
        const fullEvent = { ...event, timestamp: Date.now() };

        // Dispara para o GA4
        if ((window as any).gtag) {
            (window as any).gtag('event', event.action, {
                event_category: event.category,
                event_label: event.label,
                value: event.value,
                ...event.customParameters
            });
        }

        // Grava na sessão local
        setSession(prev => {
            if (!prev) return null;
            return { ...prev, events: [...prev.events, fullEvent] };
        });
    }, []);

    // Expõe globalmente de forma segura
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).trackAnalyticsEvent = trackEvent;
        }
    }, [trackEvent]);

    const trackPageView = useCallback(() => {
        const pageUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

        if ((window as any).gtag) {
            (window as any).gtag('config', gaTrackingId, {
                page_path: pageUrl,
            });
        }

        setSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                pageViews: prev.pageViews + 1,
                events: [...prev.events, {
                    event: 'page_view',
                    category: 'navigation',
                    action: 'view',
                    label: pageUrl,
                    customParameters: { timeOnPage: 0, scrollDepth: 0 },
                    timestamp: Date.now()
                }]
            };
        });

        if (enablePerformanceTracking && 'performance' in window) {
            setTimeout(() => {
                const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                const paint = performance.getEntriesByType('paint');
                const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;

                if (nav) {
                    trackEvent({
                        event: 'performance',
                        category: 'web_vitals',
                        action: 'page_load',
                        value: Math.round(nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart),
                        customParameters: { fcp: Math.round(fcp) }
                    });
                }
            }, 3000); // Aguarda a página assentar
        }
    }, [pathname, searchParams, trackEvent, gaTrackingId, enablePerformanceTracking]);

    useEffect(() => {
        if (isInitialized && session) {
            trackPageView();
        }
    }, [pathname, searchParams, isInitialized, trackPageView]);

    // Rastreamento de Rolagem e Heatmap Otimizado
    useEffect(() => {
        if (!enableHeatmaps) return;

        let scrollTimeout: NodeJS.Timeout;
        const handleScroll = () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollDepth = Math.round(((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100);
                // Só registra se passou de marcos importantes (25%, 50%, 75%, 100%) para não floodar o banco
                if ([25, 50, 75, 100].includes(Math.round(scrollDepth / 25) * 25)) {
                    trackEvent({
                        event: 'interaction',
                        category: 'engagement',
                        action: 'scroll',
                        label: 'scroll_depth',
                        value: scrollDepth
                    });
                }
            }, 500);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [enableHeatmaps, trackEvent]);

    return <>{children}</>;
}

export function useAnalytics() {
    const trackEvent = (event: Omit<AnalyticsEvent, 'timestamp'>) => {
        if (typeof window !== 'undefined' && (window as any).trackAnalyticsEvent) {
            (window as any).trackAnalyticsEvent(event);
        }
    };

    const trackConversion = (conversionType: string, value?: number, currency = 'BRL', transactionId?: string) => {
        trackEvent({
            event: 'conversion',
            category: 'ecommerce',
            action: conversionType,
            value,
            customParameters: { currency, transaction_id: transactionId }
        });
    };

    const trackProductView = (productId: string, productName: string, category: string, price?: number) => {
        trackEvent({
            event: 'view_item',
            category: 'ecommerce',
            action: 'view_item',
            label: productId,
            value: price,
            customParameters: {
                items: [{ item_id: productId, item_name: productName, item_category: category, price }]
            }
        });
    };

    const trackAddToCart = (productId: string, productName: string, quantity: number, price: number) => {
        trackEvent({
            event: 'add_to_cart',
            category: 'ecommerce',
            action: 'add_to_cart',
            label: productId,
            value: price * quantity,
            customParameters: {
                currency: 'BRL',
                items: [{ item_id: productId, item_name: productName, price, quantity }]
            }
        });
    };

    return { trackEvent, trackConversion, trackProductView, trackAddToCart };
}