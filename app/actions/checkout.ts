'use server';

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import {
    aggregateCartItems,
    calculateCouponDiscount,
    getUnitPrice,
    normalizePaymentMethod,
    roundCurrency,
    type CouponForCheckout,
    type PricedProduct,
} from '@/lib/checkout-pricing';

export interface CreateOrderInput {
    clienteNome: string;
    clienteCpf?: string;
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
        cpf?: string;
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
            query = query.or(`usos_atuais.is.null,usos_atuais.lte.${currentUses}`);
        }

        const { data: updatedRows, error: updateError } = await query.select('id');
        if (updateError) throw updateError;
        if (!updatedRows || updatedRows.length === 0) {
            return { success: false, error: 'Limite de utilização do cupom atingido.' };
        }

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

        const aggregatedItems = aggregateCartItems(input.itens);
        const basePaymentMethod = (input.metodoPagamento || 'PIX').replace(/\s*\(.*\)\s*$/, '').trim();
        const paymentMethod = normalizePaymentMethod(basePaymentMethod);

        const productIds = Array.from(new Set(aggregatedItems.map((item) => item.produto_id)));
        const { data: products, error: productsError } = await client
            .from('produtos')
            .select('id, nome, preco, preco_promocional, preco_pix, em_estoque, variants')
            .in('id', productIds);

        if (productsError) {
            console.error('[Checkout] Erro ao consultar produtos para validação do pedido:', productsError);
            return { success: false, codigoPedido, error: 'Erro ao validar produtos do pedido.' };
        }
        if (!products || products.length !== productIds.length) {
            return { success: false, codigoPedido, error: 'Um ou mais produtos não estão disponíveis.' };
        }
        if (products.some((p) => p.em_estoque !== true)) {
            return { success: false, codigoPedido, error: 'Um ou mais produtos estão fora de estoque.' };
        }

        const productMap = new Map((products as Array<PricedProduct & { nome: string; variants?: unknown }>).map((p) => [p.id, p]));
        const validatedItems = aggregatedItems.map((item) => {
            const product = productMap.get(item.produto_id);
            if (!product) {
                throw new Error('Um ou mais produtos não estão disponíveis.');
            }
            const rawVariants = product.variants;
            const variants = rawVariants && typeof rawVariants === 'object' && !Array.isArray(rawVariants)
                ? rawVariants as { tipo?: unknown; opcoes?: unknown }
                : null;
            const options = variants && Array.isArray(variants.opcoes) ? variants.opcoes : [];
            if (options.length > 0) {
                if (
                    !item.variante ||
                    item.variante.tipo !== variants?.tipo ||
                    !options.includes(item.variante.opcao)
                ) {
                    throw new Error(`Selecione uma opção válida para o produto ${product.nome}.`);
                }
            } else if (item.variante) {
                throw new Error(`O produto ${product.nome} não possui opções selecionáveis.`);
            }
            const unitPrice = roundCurrency(getUnitPrice(product, paymentMethod));
            return {
                produto_id: item.produto_id,
                nome: product.nome,
                quantidade: item.quantidade,
                preco_unitario: unitPrice,
                total_item: roundCurrency(unitPrice * item.quantidade),
                ...(item.variante ? { variante: item.variante } : {}),
            };
        });

        const serverSubtotal = roundCurrency(validatedItems.reduce((sum, item) => sum + item.total_item, 0));

        let serverDiscount = 0;
        const cleanCouponCode = input.cupomCodigo ? input.cupomCodigo.toUpperCase().trim() : null;
        if (cleanCouponCode) {
            if (!/^[\p{L}\p{N}_-]{1,64}$/u.test(cleanCouponCode)) {
                return { success: false, codigoPedido, error: 'Código de cupom inválido.' };
            }
            const { data: coupon, error: couponError } = await client
                .from('cupons')
                .select('*')
                .eq('codigo', cleanCouponCode)
                .maybeSingle();

            if (couponError) {
                console.error('[Checkout] Erro ao consultar cupom:', couponError);
                return { success: false, codigoPedido, error: 'Erro ao validar cupom.' };
            }
            if (!coupon) {
                return { success: false, codigoPedido, error: 'Cupom não encontrado.' };
            }

            const calculation = calculateCouponDiscount(
                coupon as CouponForCheckout,
                aggregatedItems,
                products as PricedProduct[],
                paymentMethod,
            );
            serverDiscount = roundCurrency(calculation.discount);
        }

        const parsedFrete = Number(input.frete);
        const serverFrete = Number.isFinite(parsedFrete) && parsedFrete >= 0 ? roundCurrency(parsedFrete) : 0;
        const serverTotal = roundCurrency(Math.max(0, serverSubtotal - serverDiscount) + serverFrete);

        const enderecoEntrega = input.enderecoEntrega
            ? { ...input.enderecoEntrega, ...(input.clienteCpf ? { cpf: input.clienteCpf.trim() } : {}) }
            : (input.clienteCpf ? { cpf: input.clienteCpf.trim() } : null);

        const payload = {
            codigo_pedido: codigoPedido,
            cliente_nome: nomeCliente,
            cliente_email: emailCliente,
            cliente_telefone: telefoneCliente,
            endereco_entrega: enderecoEntrega,
            itens: validatedItems,
            subtotal: serverSubtotal,
            desconto: serverDiscount,
            frete: serverFrete,
            total: serverTotal,
            metodo_pagamento: input.metodoPagamento || 'PIX',
            status_pagamento: 'pendente',
            cupom_aplicado: cleanCouponCode,
        };

        const { error: insertError } = await client.from('pedidos').insert(payload);
        if (insertError) {
            console.error('[Checkout] Falha ao registrar pedido na tabela pedidos:', insertError);
            return { success: false, codigoPedido, error: insertError.message || 'Erro ao registrar pedido.' };
        }

        // Se houver cupom aplicado, incrementa seu contador no banco
        if (cleanCouponCode) {
            const incResult = await incrementCouponUsage(cleanCouponCode);
            if (!incResult.success) {
                console.error('[Checkout] Falha ao registrar uso de cupom:', {
                    codigoPedido,
                    cupom: cleanCouponCode,
                    error: incResult.error,
                });
            }
        }

        return { success: true, codigoPedido };
    } catch (err: any) {
        console.error('[Checkout] Erro inesperado ao criar registro de pedido:', err);
        return { success: false, codigoPedido, error: err?.message || 'Erro inesperado ao criar registro de pedido.' };
    }
}
