import 'server-only';
import { supabase } from '@/lib/supabase';
import { siteConfig } from '@/lib/site-config';
import {
    getNationalFallback,
    getInternationalFallback,
    getShippingFallback,
    estimateItemWeightKg,
    isMaskName,
    normalizeShippingCountry,
    parseShippingOptionPrice,
    ShippingInputError,
    type ShippingQuoteOption,
} from '@/lib/shipping-rates';

export {
    getNationalFallback,
    getInternationalFallback,
    getShippingFallback,
    estimateItemWeightKg,
    isMaskName,
    normalizeShippingCountry,
    parseShippingOptionPrice,
    ShippingInputError,
    type ShippingQuoteOption,
};

const SUPERFRETE_URL = 'https://api.superfrete.com/api/v0/calculator';
// A SuperFrete exige User-Agent no formato "Nome e versão (email de contato)".
const SUPERFRETE_USER_AGENT = `GringaStyle Loja 1.0 (${siteConfig.supportEmail})`;

const ORIGIN_CEP = '18207185'; // Itapetininga Centro
const MASKS_ORIGIN_CEP = '18207185'; // Máscaras saem de Itapetininga/SP

const CORREIOS_SERVICOS = [
    { codigo: '45209', nome: 'Exporta Fácil Econômico' },
    { codigo: '45110', nome: 'Exporta Fácil Expresso (EMS)' },
];

const COUNTRY_CODES: Record<string, string> = {
    US: '249',
    PT: '620',
    DE: '276',
    ES: '724',
    FR: '250',
    IT: '380',
    GB: '826',
    NL: '528',
    BE: '056',
    AR: '032',
    CL: '152',
    MX: '484',
    JP: '392',
    AU: '036',
    CA: '124',
    INT: '249',
};

export interface ShippingQuoteInput {
    to_postal_code?: unknown;
    country?: unknown;
    product_id?: unknown;
    product_ids?: unknown;
    items?: unknown;
}

async function computePackage(input: ShippingQuoteInput) {
    let isMask = false;
    let totalCalculatedWeight = 0;

    if (Array.isArray(input.items) && input.items.length > 0) {
        const validItems = input.items.filter(
            (item): item is { produto_id: number; quantidade?: number } =>
                typeof item === 'object' &&
                item !== null &&
                Number.isSafeInteger((item as { produto_id?: unknown }).produto_id) &&
                Number((item as { produto_id?: unknown }).produto_id) > 0
        );

        if (validItems.length > 0) {
            const ids = validItems.map(i => i.produto_id);
            const { data: products, error } = await supabase
                .from('produtos')
                .select('id, nome')
                .in('id', ids);

            if (error) {
                console.error('[Shipping] Erro ao consultar produtos (items):', error);
                throw error;
            }

            const productMap = new Map((products || []).map(p => [p.id, p.nome || '']));
            for (const item of validItems) {
                const name = productMap.get(item.produto_id) || '';
                if (isMaskName(name)) isMask = true;
                const qty = Math.max(1, Math.min(99, Number(item.quantidade) || 1));
                totalCalculatedWeight += estimateItemWeightKg(name) * qty;
            }
        }
    } else if (Array.isArray(input.product_ids) && input.product_ids.length > 0) {
        const validIds = input.product_ids.filter((id: unknown) => Number.isSafeInteger(id) && Number(id) > 0);
        if (validIds.length > 0) {
            const { data: products, error } = await supabase
                .from('produtos')
                .select('nome')
                .in('id', validIds);

            if (error) {
                console.error('[Shipping] Erro ao consultar produtos (product_ids):', error);
                throw error;
            }

            for (const p of products || []) {
                if (isMaskName(p.nome || '')) isMask = true;
                totalCalculatedWeight += estimateItemWeightKg(p.nome || '');
            }
        }
    } else if (input.product_id != null) {
        if (!Number.isSafeInteger(input.product_id) || Number(input.product_id) <= 0) {
            throw new ShippingInputError('Produto inválido para cotação.');
        }
        const { data: product, error } = await supabase
            .from('produtos')
            .select('nome')
            .eq('id', Number(input.product_id))
            .maybeSingle();
        if (error) throw error;
        if (!product) throw new ShippingInputError('Produto não encontrado.', 404);
        isMask = isMaskName(product.nome || '');
        totalCalculatedWeight = estimateItemWeightKg(product.nome || '');
    }

    const weight = Math.min(30.0, Math.max(0.30, totalCalculatedWeight || 0.80));
    return {
        weight,
        // Mínimos dos Correios para caixa (PAC/SEDEX): C 24cm, L 16cm, A 4cm.
        length: Math.min(60, Math.max(24, Math.round(20 + weight * 3))),
        height: Math.min(60, Math.max(15, Math.round(15 + weight * 2))),
        width: Math.min(60, Math.max(16, Math.round(15 + weight * 2))),
        originCep: isMask ? MASKS_ORIGIN_CEP : ORIGIN_CEP,
    };
}

async function quoteNational(destinationCep: string, pkg: Awaited<ReturnType<typeof computePackage>>): Promise<ShippingQuoteOption[]> {
    const token = process.env.SUPERFRETE_TOKEN || '';
    if (!token) return getNationalFallback(destinationCep, pkg.weight);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
        const res = await fetch(SUPERFRETE_URL, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'User-Agent': SUPERFRETE_USER_AGENT,
            },
            signal: controller.signal,
            cache: 'no-store',
            body: JSON.stringify({
                from: { postal_code: pkg.originCep },
                to: { postal_code: destinationCep },
                services: '1,2', // 1 = PAC, 2 = SEDEX
                options: { own_hand: false, receipt: false, insurance_value: 0, use_insurance_value: false },
                package: { weight: pkg.weight, length: pkg.length, height: pkg.height, width: pkg.width },
            }),
        });

        if (!res.ok) {
            console.warn(`[Shipping] SuperFrete respondeu HTTP ${res.status}. Usando fallback inteligente por região.`);
            return getNationalFallback(destinationCep, pkg.weight);
        }

        const data: unknown = await res.json();
        const valid = Array.isArray(data)
            ? data.filter((option) =>
                option &&
                typeof option === 'object' &&
                !(option as { has_error?: unknown }).has_error &&
                parseShippingOptionPrice(option as { price?: unknown }) !== null
            )
            : [];

        if (valid.length === 0) {
            console.warn('[Shipping] SuperFrete sem opções válidas para o destino. Usando fallback inteligente por região.');
            return getNationalFallback(destinationCep, pkg.weight);
        }

        return valid.map((option) => ({ ...(option as ShippingQuoteOption), is_estimate: false }));
    } catch {
        console.warn('[Shipping] Timeout/Falha na SuperFrete. Acionando fallback inteligente por região.');
        return getNationalFallback(destinationCep, pkg.weight);
    } finally {
        clearTimeout(timeoutId);
    }
}

async function quoteInternational(country: string, pkg: Awaited<ReturnType<typeof computePackage>>): Promise<ShippingQuoteOption[]> {
    const token = process.env.CORREIOS_TOKEN || '';
    const cartao = process.env.CORREIOS_CARTAO || '';
    if (!token) return getInternationalFallback();

    const coPaisDestino = COUNTRY_CODES[country] ?? COUNTRY_CODES.INT;

    const resultados = await Promise.all(
        CORREIOS_SERVICOS.map(async (servico, idx): Promise<ShippingQuoteOption | null> => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            try {
                const res = await fetch('https://api.correios.com.br/preco/v1/internacional', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    signal: controller.signal,
                    cache: 'no-store',
                    body: JSON.stringify({
                        coPaisDestino,
                        nuCepOrigem: pkg.originCep,
                        nuCartaoPostagem: cartao,
                        psObjeto: Math.min(30000, Math.max(300, Math.round(pkg.weight * 1000))).toString(),
                        tpObjeto: '2',
                        comprimento: String(pkg.length),
                        largura: String(pkg.width),
                        altura: String(pkg.height),
                        coServico: servico.codigo,
                    }),
                });

                if (!res.ok) return null;
                const data = await res.json();
                const preco = data.pcFinal ?? data.vlTotal ?? data.preco;
                const prazo = data.prazoEntrega ?? data.nuPrazoEntrega ?? 20;
                if (!preco) return null;

                return {
                    id: 991 + idx,
                    name: servico.nome,
                    is_estimate: false,
                    price: String(preco).replace(',', '.'),
                    delivery_time: parseInt(String(prazo), 10),
                };
            } catch {
                return null;
            } finally {
                clearTimeout(timeoutId);
            }
        })
    );

    const validos = resultados.filter((r): r is ShippingQuoteOption => r !== null);
    return validos.length > 0 ? validos : getInternationalFallback();
}

/**
 * Calcula as opções de frete. Lança ShippingInputError para entradas
 * inválidas; falhas de provedores externos retornam o fallback estimado.
 */
export async function quoteShipping(input: ShippingQuoteInput): Promise<ShippingQuoteOption[]> {
    const country = normalizeShippingCountry(input.country);
    const rawPostal = input.to_postal_code;

    if (typeof rawPostal !== 'string' || !rawPostal.trim()) {
        throw new ShippingInputError('CEP/Postal Code de destino não fornecido');
    }

    if (country === 'BR') {
        const cleanDestinationCep = rawPostal.replace(/\D/g, '');
        if (cleanDestinationCep.length !== 8) {
            throw new ShippingInputError('CEP de destino inválido');
        }
        const pkg = await computePackage(input);
        return quoteNational(cleanDestinationCep, pkg);
    }

    if (rawPostal.trim().length < 3) {
        throw new ShippingInputError('Código postal internacional inválido.');
    }
    const pkg = await computePackage(input);
    return quoteInternational(country, pkg);
}
