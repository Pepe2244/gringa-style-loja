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
    children?: React.ReactNode;
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

    // Rastreamento seguro de fim de sessão (Abandono de página / fechamento)
    useEffect(() => {
        let lastBeaconTime = 0;

        const sendSessionBeacon = () => {
            if (!sessionRef.current) return;
            const now = Date.now();
            // Evita disparos repetidos sucessivos em alternância rápida de abas (intervalo mínimo de 5s)
            if (now - lastBeaconTime < 5000) return;
            lastBeaconTime = now;

            const sessionData = sessionRef.current;
            const safeEvents = Array.isArray(sessionData.events)
                ? sessionData.events.slice(-80)
                : [];
            const payload = JSON.stringify({
                ...sessionData,
                events: safeEvents,
                endTime: now,
                duration: Math.max(0, now - sessionData.startTime)
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
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                sendSessionBeacon();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', sendSessionBeacon);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', sendSessionBeacon);
        };
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

        // Grava na sessão local (mantém no máximo os 80 eventos mais recentes)
        setSession(prev => {
            if (!prev) return null;
            const updatedEvents = [...prev.events, fullEvent];
            return {
                ...prev,
                events: updatedEvents.length > 80 ? updatedEvents.slice(-80) : updatedEvents
            };
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
        if (isInitialized) {
            trackPageView();
        }
    }, [isInitialized, trackPageView]);

    // Rastreamento de Rolagem e Heatmap Otimizado
    useEffect(() => {
        if (!enableHeatmaps) return;

        const reachedMilestones = new Set<number>();
        let scrollTimeout: NodeJS.Timeout;

        const handleScroll = () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (totalHeight <= 0) return;
                const scrollDepth = Math.round((window.scrollY / totalHeight) * 100);

                const milestones = [25, 50, 75, 100];
                for (const m of milestones) {
                    if (scrollDepth >= m && !reachedMilestones.has(m)) {
                        reachedMilestones.add(m);
                        trackEvent({
                            event: 'interaction',
                            category: 'engagement',
                            action: 'scroll',
                            label: 'scroll_depth',
                            value: m
                        });
                    }
                }
            }, 300);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [enableHeatmaps, trackEvent]);

    return children ? <>{children}</> : null;
}

export function useAnalytics() {
    const trackEvent = useCallback((event: Omit<AnalyticsEvent, 'timestamp'>) => {
        if (typeof window !== 'undefined') {
            if ((window as any).trackAnalyticsEvent) {
                (window as any).trackAnalyticsEvent(event);
            } else if ((window as any).gtag) {
                (window as any).gtag('event', event.action, {
                    event_category: event.category,
                    event_label: event.label,
                    value: event.value,
                    ...event.customParameters
                });
            }
        }
    }, []);

    const trackConversion = useCallback((conversionType: string, value?: number, currency = 'BRL', transactionId?: string) => {
        trackEvent({
            event: 'conversion',
            category: 'ecommerce',
            action: conversionType,
            value,
            customParameters: { currency, transaction_id: transactionId }
        });
    }, [trackEvent]);

    const trackProductView = useCallback((productId: string, productName: string, category: string, price?: number) => {
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
    }, [trackEvent]);

    const trackAddToCart = useCallback((productId: string, productName: string, quantity: number, price: number) => {
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
    }, [trackEvent]);

    return { trackEvent, trackConversion, trackProductView, trackAddToCart };
}