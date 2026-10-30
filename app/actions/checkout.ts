'use server';

import { createSupabaseAdminClient } from '@/lib/supabase-admin';

/**
 * Incrementa com segurança o contador de utilizações de um cupom
 * quando um pedido é concluído/encaminhado ao checkout.
 */
export async function incrementCouponUsage(couponCode: string) {
    if (!couponCode || typeof couponCode !== 'string') {
        return { success: false, error: 'Código inválido.' };
    }
    const cleanCode = couponCode.toUpperCase().trim();
    if (!cleanCode || !/^[\p{L}\p{N}_-]{1,64}$/u.test(cleanCode)) {
        return { success: false, error: 'Código de cupom em formato inválido.' };
    }

    try {
        const client = createSupabaseAdminClient();
        const { data: rpcResult, error: rpcError } = await client.rpc('increment_coupon_usage', {
            p_codigo: cleanCode
        });

        if (!rpcError && rpcResult && typeof rpcResult === 'object') {
            const res = rpcResult as { success?: boolean; error?: string; count?: number };
            return { success: res.success ?? false, error: res.error, count: res.count };
        }

        // Fallback direto caso a RPC ainda não esteja disponível no banco
        const { data: coupon, error } = await client
            .from('cupons')
            .select('id, quantidade_usos, usos_atuais, limite_uso, limite_usos, ativo, data_validade')
            .eq('codigo', cleanCode)
            .maybeSingle();

        if (error || !coupon) {
            return { success: false, error: error?.message || 'Cupom não encontrado.' };
        }

        if (coupon.ativo === false) {
            return { success: false, error: 'Este cupom está inativo.' };
        }

        if (coupon.data_validade) {
            const expiration = Date.parse(coupon.data_validade);
            if (!Number.isFinite(expiration) || expiration < Date.now()) {
                return { success: false, error: 'Este cupom está expirado.' };
            }
        }

        const usageLimit = coupon.limite_uso ?? coupon.limite_usos ?? null;
        const currentUses = coupon.usos_atuais ?? coupon.quantidade_usos ?? 0;

        if (usageLimit !== null && usageLimit > 0 && currentUses >= usageLimit) {
            return { success: false, error: 'Limite de utilização do cupom atingido.' };
        }

        const nextCount = currentUses + 1;

        let query = client
            .from('cupons')
            .update({
                usos_atuais: nextCount,
                quantidade_usos: nextCount,
            })
            .eq('id', coupon.id);

        if (usageLimit !== null && usageLimit > 0) {
            query = query.lte('usos_atuais', currentUses);
        }

        const { error: updateError } = await query;
        if (updateError) throw updateError;

        return { success: true, count: nextCount };
    } catch (err: any) {
        console.error('[Checkout] Erro ao incrementar uso de cupom:', err);
        return { success: false, error: err.message };
    }
}

