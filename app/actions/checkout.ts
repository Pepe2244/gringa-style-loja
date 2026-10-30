'use server';

import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export interface CreateOrderInput {
    clienteNome: string;
    clienteTelefone?: string;
    clienteEmail?: string;
    enderecoEntrega?: {
        rua?: string;
        numero?: string;
        complemento?: string;
        bairro?: string;
        cidade?: string;
        estado?: string;
        cep?: string;
        pais?: string;
        freteEscolhido?: string;
        prazoDias?: number;
    } | null;
    itens: Array<{
        produto_id: number;
        nome: string;
        quantidade: number;
        preco_unitario: number;
        total_item: number;
        variante?: { tipo: string; opcao: string } | null;
    }>;
    subtotal: number;
    desconto: number;
    frete: number;
    total: number;
    metodoPagamento: string;
    cupomCodigo?: string | null;
}

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

/**
 * Cria o registro do pedido no banco de dados Supabase (tabela pedidos)
 * e aciona atomicamente o incremento do cupom caso utilizado.
 */
export async function createOrderRecord(input: CreateOrderInput): Promise<{ success: boolean; codigoPedido: string; error?: string }> {
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const codigoPedido = `GS-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    try {
        const client = createSupabaseAdminClient();
        const nomeCliente = (input.clienteNome || 'Cliente WhatsApp').trim().slice(0, 150);
        const telefoneCliente = (input.clienteTelefone || '').trim().slice(0, 40) || 'Não informado';
        const emailCliente = (input.clienteEmail || '').trim().slice(0, 150) || null;

        const payload = {
            codigo_pedido: codigoPedido,
            cliente_nome: nomeCliente,
            cliente_email: emailCliente,
            cliente_telefone: telefoneCliente,
            endereco_entrega: input.enderecoEntrega || null,
            itens: input.itens || [],
            subtotal: Number(input.subtotal) || 0,
            desconto: Number(input.desconto) || 0,
            frete: Number(input.frete) || 0,
            total: Number(input.total) || 0,
            metodo_pagamento: input.metodoPagamento || 'PIX',
            status_pagamento: 'pendente',
            cupom_aplicado: input.cupomCodigo ? input.cupomCodigo.toUpperCase().trim() : null
        };

        const { error: insertError } = await client.from('pedidos').insert(payload);
        if (insertError) {
            console.error('[Checkout] Falha ao registrar pedido na tabela pedidos:', insertError);
            // Prossegue mesmo se a inserção falhar para não bloquear a finalização no WhatsApp
        }

        // Se houver cupom aplicado, incrementa seu contador no banco
        if (input.cupomCodigo) {
            await incrementCouponUsage(input.cupomCodigo).catch(err => {
                console.error('[Checkout] Falha ao registrar uso de cupom:', err);
            });
        }

        return { success: true, codigoPedido };
    } catch (err: any) {
        console.error('[Checkout] Erro inesperado ao criar registro de pedido:', err);
        return { success: true, codigoPedido };
    }
}
