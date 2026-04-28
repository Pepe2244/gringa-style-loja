import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

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

export async function POST(request: NextRequest) {
    try {
        const sessionData: SessionData = await request.json();

        // Validar dados obrigatórios
        if (!sessionData.sessionId || !sessionData.startTime) {
            return NextResponse.json(
                { error: 'Dados da sessão inválidos' },
                { status: 400 }
            );
        }

        // Inserir dados da sessão
        const { error: sessionError } = await supabase
            .from('analytics_sessions')
            .insert({
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
            });

        if (sessionError) {
            console.error('Erro ao salvar sessão:', sessionError);
            // Não retornar erro para não quebrar a experiência do usuário
        }

        // Processar eventos da sessão
        if (sessionData.events && sessionData.events.length > 0) {
            await processSessionEvents(sessionData.sessionId, sessionData.events);
        }

        // Calcular métricas agregadas
        await updateAggregatedMetrics(sessionData);

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
async function processSessionEvents(sessionId: string, events: any[]) {
    try {
        const eventsToInsert = events.map(event => ({
            session_id: sessionId,
            event_type: event.event,
            event_category: event.category,
            event_action: event.action,
            event_label: event.label,
            event_value: event.value,
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

// Atualizar métricas agregadas
async function updateAggregatedMetrics(sessionData: SessionData) {
    try {
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Buscar métricas existentes para o dia
        const { data: existingMetrics, error: fetchError } = await supabase
            .from('analytics_daily_metrics')
            .select('*')
            .eq('date', date)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
            console.error('Erro ao buscar métricas existentes:', fetchError);
            return;
        }

        const metrics = existingMetrics || {
            date,
            total_sessions: 0,
            total_page_views: 0,
            total_duration: 0,
            unique_users: 0,
            bounce_rate: 0,
            device_types: {},
            top_pages: {},
            conversion_rate: 0,
            avg_session_duration: 0
        };

        // Atualizar contadores
        metrics.total_sessions += 1;
        metrics.total_page_views += sessionData.pageViews;
        metrics.total_duration += sessionData.duration;

        // Atualizar tipos de dispositivo
        metrics.device_types[sessionData.deviceType] =
            (metrics.device_types[sessionData.deviceType] || 0) + 1;

        // Calcular médias
        metrics.avg_session_duration = metrics.total_duration / metrics.total_sessions;

        // Calcular bounce rate (sessões com apenas 1 page view)
        const bounceSessions = sessionData.pageViews === 1 ? 1 : 0;
        metrics.bounce_rate = ((metrics.bounce_rate * (metrics.total_sessions - 1)) + bounceSessions) / metrics.total_sessions;

        // Extrair páginas visitadas
        const pageEvents = sessionData.events.filter(e => e.event === 'page_view');
        pageEvents.forEach(event => {
            const page = event.label || 'unknown';
            metrics.top_pages[page] = (metrics.top_pages[page] || 0) + 1;
        });

        // Verificar conversões
        const hasConversion = sessionData.events.some(e =>
            e.category === 'ecommerce' && ['purchase', 'add_to_cart', 'checkout'].includes(e.action)
        );
        if (hasConversion) {
            metrics.conversion_rate = ((metrics.conversion_rate * (metrics.total_sessions - 1)) + 1) / metrics.total_sessions;
        }

        // Salvar ou atualizar métricas
        const { error: upsertError } = await supabase
            .from('analytics_daily_metrics')
            .upsert(metrics, { onConflict: 'date' });

        if (upsertError) {
            console.error('Erro ao salvar métricas agregadas:', upsertError);
        }
    } catch (error) {
        console.error('Erro ao atualizar métricas agregadas:', error);
    }
}

// Endpoint para buscar métricas (para dashboard admin)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '7');

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('analytics_daily_metrics')
            .select('*')
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ metrics: data });
    } catch (error) {
        console.error('Erro ao buscar métricas:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar métricas' },
            { status: 500 }
        );
    }
}