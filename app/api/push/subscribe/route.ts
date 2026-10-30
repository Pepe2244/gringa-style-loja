import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
        }

        const endpoint = typeof body.endpoint === 'string' ? body.endpoint.trim() : '';
        const auth = typeof body.auth === 'string' ? body.auth.trim() : '';
        const p256dh = typeof body.p256dh === 'string' ? body.p256dh.trim() : '';
        const userAgent = typeof body.userAgent === 'string' ? body.userAgent.slice(0, 250) : null;

        if (!endpoint || !endpoint.startsWith('https://') || endpoint.length > 2048) {
            return NextResponse.json({ error: 'Endpoint de push inválido.' }, { status: 400 });
        }

        if (!auth || !p256dh || auth.length > 500 || p256dh.length > 500) {
            return NextResponse.json({ error: 'Chaves criptográficas de push inválidas.' }, { status: 400 });
        }

        const supabase = createSupabaseAdminClient();

        // Upsert por endpoint para garantir idempotência e evitar duplicações
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert(
                {
                    endpoint,
                    auth,
                    p256dh,
                    user_agent: userAgent,
                },
                { onConflict: 'endpoint' }
            );

        if (error) {
            console.error('[Push Subscribe] Erro ao salvar inscrição no Supabase:', error);
            return NextResponse.json({ error: 'Erro ao registrar notificação.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Push Subscribe] Erro inesperado:', err);
        return NextResponse.json({ error: 'Erro interno ao processar inscrição.' }, { status: 500 });
    }
}

