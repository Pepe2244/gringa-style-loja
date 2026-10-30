import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

// OBRIGATÓRIO: Garante que o dashboard do admin leia dados reais e não o cache de ontem.
export const dynamic = 'force-dynamic';

interface SessionData {
    sessionId: string;
    startTime: number;
    endTime: number;
    duration: number;
    pageViews: number;
    events: any[];
    userAgent: string;
    referrer: string;
    deviceType: string;
    screenResolution: string;
    timezone: string;
}

function getBrazilDateString(d: Date = new Date()): string {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = formatter.formatToParts(d);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
}

export async function POST(request: NextRequest) {
    try {
        const body: unknown = await request.json();
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return NextResponse.json({ error: 'Dados da sessão inválidos' }, { status: 400 });
        }
        const sessionData = body as SessionData;

        // Validar dados obrigatórios
        if (
            typeof sessionData.sessionId !== 'string' ||
            !/^[a-zA-Z0-9_-]{1,128}$/.test(sessionData.sessionId) ||
            !Number.isFinite(sessionData.startTime) ||
            !Number.isFinite(sessionData.endTime) ||
            sessionData.startTime < 0 ||
            sessionData.endTime < sessionData.startTime ||
            sessionData.endTime > Date.now() + 5 * 60 * 1000 ||
            !Number.isFinite(sessionData.duration) ||
            sessionData.duration < 0 ||
            sessionData.duration > 7 * 24 * 60 * 60 * 1000 ||
            !Number.isSafeInteger(sessionData.pageViews) ||
            sessionData.pageViews < 0 ||
            sessionData.pageViews > 500 ||
            !Array.isArray(sessionData.events) ||
            sessionData.events.length > 100 ||
            !sessionData.events.every((event) =>
                event && typeof event === 'object' &&
                typeof event.event === 'string' && event.event.length <= 100 &&
                typeof event.category === 'string' && event.category.length <= 100 &&
                typeof event.action === 'string' && event.action.length <= 100 &&
                (event.label == null || (typeof event.label === 'string' && event.label.length <= 500)) &&
                (event.value == null || (typeof event.value === 'number' && Number.isFinite(event.value) && Math.abs(event.value) <= 1_000_000)) &&
                (event.timestamp == null || (typeof event.timestamp === 'number' && Number.isFinite(event.timestamp))) &&
                (event.customParameters == null ||
                    (typeof event.customParameters === 'object' &&
                        JSON.stringify(event.customParameters).length <= 4096))
            ) ||
            typeof sessionData.userAgent !== 'string' || sessionData.userAgent.length > 512 ||
            typeof sessionData.referrer !== 'string' || sessionData.referrer.length > 2048 ||
            !['mobile', 'tablet', 'desktop'].includes(sessionData.deviceType) ||
            typeof sessionData.screenResolution !== 'string' || sessionData.screenResolution.length > 64 ||
            typeof sessionData.timezone !== 'string' || sessionData.timezone.length > 100
        ) {
            return NextResponse.json(
                { error: 'Dados da sessão inválidos' },
                { status: 400 }
            );
        }
        const supabase = createSupabaseAdminClient();

        // Verificar se a sessão já foi registrada anteriormente (ex: eventos de visibilitychange ou heartbeat)
        const { data: existingSession } = await supabase
            .from('analytics_sessions')
            .select('session_id')
            .eq('session_id', sessionData.sessionId)
            .maybeSingle();

        const isNewSession = !existingSession;

        // Inserir ou atualizar dados da sessão (upsert com onConflict previne falha de chave duplicada)
        const { error: sessionError } = await supabase
            .from('analytics_sessions')
            .upsert({
                session_id: sessionData.sessionId,
                start_time: new Date(sessionData.startTime).toISOString(),
                end_time: new Date(sessionData.endTime).toISOString(),
                duration: sessionData.duration,
                page_views: sessionData.pageViews,
                user_agent: sessionData.userAgent,
                referrer: sessionData.referrer,
                device_type: sessionData.deviceType,
                screen_resolution: sessionData.screenResolution,
                timezone: sessionData.timezone,
                created_at: new Date().toISOString()
            }, { onConflict: 'session_id' });

        if (sessionError) {
            console.error('Erro ao salvar sessão:', sessionError);
        }

        // Processar eventos da sessão apenas na criação ou quando houver eventos novos
        if (isNewSession && sessionData.events && sessionData.events.length > 0) {
            await processSessionEvents(supabase, sessionData.sessionId, sessionData.events);
        }

        // Calcular métricas agregadas (evitando inflar total_sessions em múltiplas chamadas da mesma sessão)
        await updateAggregatedMetrics(supabase, sessionData, isNewSession);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro na API de analytics:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// Processar eventos individuais da sessão
async function processSessionEvents(supabase: ReturnType<typeof createSupabaseAdminClient>, sessionId: string, events: any[]) {
    try {
        const eventsToInsert = events.map(event => ({
            session_id: sessionId,
            event_type: event.event,
            event_category: event.category,
            event_action: event.action,
            event_label: event.label,
            event_value: event.value || 0, // Proteção contra valores nulos em cálculos matemáticos
            custom_parameters: event.customParameters || {},
            timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString(),
            created_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('analytics_events')
            .insert(eventsToInsert);

        if (error) {
            console.error('Erro ao salvar eventos:', error);
        }
    } catch (error) {
        console.error('Erro ao processar eventos:', error);
    }
}

// Atualizar métricas agregadas com proteção contra race conditions e retry exponencial
async function updateAggregatedMetrics(
    supabase: ReturnType<typeof createSupabaseAdminClient>,
    sessionData: SessionData,
    isNewSession: boolean = true
) {
    // 1. Tenta execução atômica direta via RPC PostgreSQL
    try {
        const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
        const pagesList = sessionData.events
            .filter(e => e.event === 'page_view')
            .map(e => String(e.label || 'unknown').slice(0, 150).trim())
            .filter(p => !FORBIDDEN_KEYS.has(p) && p.length > 0);

        const hasConversion = sessionData.events.some(e =>
            e.category === 'ecommerce' && ['purchase', 'add_to_cart', 'checkout'].includes(e.action)
        );

        const { error: rpcError } = await (supabase as any).rpc('increment_daily_metrics', {
            p_date: getBrazilDateString(),
            p_is_new_session: isNewSession,
            p_page_views: Number(sessionData.pageViews) || 1,
            p_duration: Number(sessionData.duration) || 0,
            p_device_type: sessionData.deviceType || 'desktop',
            p_has_conversion: hasConversion,
            p_pages: pagesList,
        });

        if (!rpcError) {
            return;
        }
    } catch {
        // Fallback gracioso para o algoritmo local caso a RPC ainda não esteja provisionada
    }

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const date = getBrazilDateString(); // YYYY-MM-DD no fuso de Brasília

            // Buscar métricas existentes para o dia usando maybeSingle para evitar erro PGRST116 quando não há registro
            const { data: existingMetrics, error: fetchError } = await supabase
                .from('analytics_daily_metrics')
                .select('*')
                .eq('date', date)
                .maybeSingle();

            if (fetchError) {
                console.error('Erro ao buscar métricas existentes:', fetchError);
                return;
            }

            const metrics = existingMetrics ? { ...existingMetrics } : {
                date,
                total_sessions: 0,
                total_page_views: 0,
                total_duration: 0,
                unique_users: 0,
                bounce_rate: 0,
                device_types: {},
                top_pages: {},
                conversion_rate: 0,
                avg_session_duration: 0,
                total_revenue: 0
            };

            // Garantir que os objetos de mapeamento existem
            metrics.device_types = { ...(metrics.device_types || {}) };
            metrics.top_pages = { ...(metrics.top_pages || {}) };

            // Se for uma sessão já existente, apenas atualiza duração e dados adicionais sem duplicar o total de sessões
            if (isNewSession) {
                metrics.total_sessions = (Number(metrics.total_sessions) || 0) + 1;
                metrics.total_page_views = (Number(metrics.total_page_views) || 0) + (Number(sessionData.pageViews) || 0);
                metrics.total_duration = (Number(metrics.total_duration) || 0) + (Number(sessionData.duration) || 0);

                // Atualizar tipos de dispositivo
                metrics.device_types[sessionData.deviceType] =
                    (metrics.device_types[sessionData.deviceType] || 0) + 1;
            } else {
                // Sessão continuada: apenas acumula eventual duração adicional
                metrics.total_duration = Math.max(Number(metrics.total_duration) || 0, Number(sessionData.duration) || 0);
            }

            const currentTotalSessions = Math.max(1, Number(metrics.total_sessions) || 1);

            // Calcular médias
            metrics.avg_session_duration = metrics.total_duration / currentTotalSessions;

            if (isNewSession) {
                // Calcular bounce rate (sessões com apenas 1 page view)
                const bounceSessions = sessionData.pageViews === 1 ? 1 : 0;
                metrics.bounce_rate = (((Number(metrics.bounce_rate) || 0) * (currentTotalSessions - 1)) + bounceSessions) / currentTotalSessions;
            }

            // Extrair páginas visitadas com proteção contra prototype pollution
            const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
            const pageEvents = sessionData.events.filter(e => e.event === 'page_view');
            pageEvents.forEach(event => {
                const rawPage = String(event.label || 'unknown').slice(0, 150).trim();
                const page = FORBIDDEN_KEYS.has(rawPage) ? 'safe_unknown' : (rawPage || 'unknown');
                metrics.top_pages[page] = (Number(metrics.top_pages[page]) || 0) + 1;
            });

            // Verificar conversões de funil (calculado ponderadamente sobre o total de sessões)
            const hasConversion = sessionData.events.some(e =>
                e.category === 'ecommerce' && ['purchase', 'add_to_cart', 'checkout'].includes(e.action)
            );
            const conversionScore = hasConversion ? 1 : 0;
            metrics.conversion_rate = (((Number(metrics.conversion_rate) || 0) * (metrics.total_sessions - 1)) + conversionScore) / metrics.total_sessions;

            // Salvar ou atualizar métricas
            const { error: upsertError } = await supabase
                .from('analytics_daily_metrics')
                .upsert(metrics, { onConflict: 'date' });

            if (upsertError) {
                if (attempt < maxRetries) {
                    await new Promise(res => setTimeout(res, 50 * attempt + Math.floor(Math.random() * 50)));
                    continue;
                }
                console.error('Erro ao salvar métricas agregadas:', upsertError);
            }
            break;
        } catch (error) {
            if (attempt < maxRetries) {
                await new Promise(res => setTimeout(res, 50 * attempt + Math.floor(Math.random() * 50)));
                continue;
            }
            console.error('Erro ao atualizar métricas agregadas:', error);
            break;
        }
    }
}

// Endpoint para buscar métricas (para dashboard admin)
export async function GET(request: NextRequest) {
    if (!await isAdminAuthenticated()) {
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const requestedDays = Number(searchParams.get('days') || '7');
        if (!Number.isSafeInteger(requestedDays) || requestedDays < 1 || requestedDays > 365) {
            return NextResponse.json({ error: 'Período inválido.' }, { status: 400 });
        }
        const days = requestedDays;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const supabase = createSupabaseAdminClient();
        const { data, error } = await supabase
            .from('analytics_daily_metrics')
            .select('*')
            .gte('date', getBrazilDateString(startDate))
            .order('date', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ metrics: data || [] });
    } catch (error) {
        console.error('Erro ao buscar métricas:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar métricas' },
            { status: 500 }
        );
    }
}
