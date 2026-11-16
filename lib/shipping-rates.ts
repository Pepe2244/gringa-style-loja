export interface ShippingQuoteOption {
    id: number;
    name: string;
    price: string | number;
    delivery_time: number;
    is_estimate: boolean;
    [key: string]: unknown;
}

export class ShippingInputError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.name = 'ShippingInputError';
        this.status = status;
    }
}

interface RegionalRate {
    pac: number;
    sedex: number;
    pacDays: number;
    sedexDays: number;
    pacRange: { min: number; max: number };
    sedexRange: { min: number; max: number };
}

/**
 * Mapeia o CEP de destino (pelas faixas oficiais do Brasil) para taxas médias realistas
 * calculadas a partir de cotações reais da SuperFrete saindo da nossa base (Itapetininga/SP).
 * Assim, caso a API caia, nem o cliente de SP é cobrado excessivamente (ex: R$ 50),
 * nem a loja toma prejuízo enviando para o Norte/Nordeste por valor irreal (ex: R$ 28).
 */
export function getRegionFromCep(cleanCep: string): RegionalRate {
    if (!cleanCep || cleanCep.length < 2) {
        // Fallback genérico ponderado nacional
        return {
            pac: 32.90,
            sedex: 52.90,
            pacDays: 6,
            sedexDays: 2,
            pacRange: { min: 5, max: 8 },
            sedexRange: { min: 1, max: 3 },
        };
    }

    const prefix2 = parseInt(cleanCep.substring(0, 2), 10);
    const prefix5 = parseInt(cleanCep.substring(0, 5), 10);

    // Faixa 1: SP (01000 a 19999) - Origem Itapetininga/SP
    if (prefix2 >= 1 && prefix2 <= 19) {
        return {
            pac: 23.90,
            sedex: 27.90,
            pacDays: 5,
            sedexDays: 1,
            pacRange: { min: 3, max: 5 },
            sedexRange: { min: 1, max: 2 },
        };
    }

    // Faixa 2: RJ (20-28), ES (29), MG (30-39), PR (80-87), SC (88-89), RS (90-99), DF/GO (70-76), MS (79)
    if (
        (prefix2 >= 20 && prefix2 <= 39) ||
        (prefix2 >= 80 && prefix2 <= 99) ||
        (prefix2 >= 70 && prefix2 <= 76) ||
        prefix2 === 79
    ) {
        return {
            pac: 29.90,
            sedex: 54.90,
            pacDays: 6,
            sedexDays: 2,
            pacRange: { min: 5, max: 7 },
            sedexRange: { min: 2, max: 3 },
        };
    }

    // Faixa 3: Bahia (40-48), Mato Grosso (78000 a 78899)
    if ((prefix2 >= 40 && prefix2 <= 48) || (prefix5 >= 78000 && prefix5 <= 78899)) {
        return {
            pac: 35.90,
            sedex: 69.90,
            pacDays: 7,
            sedexDays: 3,
            pacRange: { min: 6, max: 8 },
            sedexRange: { min: 2, max: 4 },
        };
    }

    // Faixa 4: PE (50-56), CE (60-63), PA (66-68), TO (77)
    if (
        (prefix2 >= 50 && prefix2 <= 56) ||
        (prefix2 >= 60 && prefix2 <= 63) ||
        (prefix2 >= 66 && prefix2 <= 68) ||
        prefix2 === 77
    ) {
        return {
            pac: 55.90,
            sedex: 89.90,
            pacDays: 8,
            sedexDays: 3,
            pacRange: { min: 6, max: 9 },
            sedexRange: { min: 2, max: 4 },
        };
    }

    // Faixa 5: Norte e Nordeste distantes (AC, AL, AP, AM, MA, PB, PI, RN, RO, RR, SE)
    return {
        pac: 74.90,
        sedex: 98.90,
        pacDays: 10,
        sedexDays: 4,
        pacRange: { min: 7, max: 15 },
        sedexRange: { min: 3, max: 6 },
    };
}

// Fallback Inteligente Nacional (Garante checkout justo se a SuperFrete falhar)
export function getNationalFallback(destinationCep?: string, weightKg?: number): ShippingQuoteOption[] {
    const cleanCep = (destinationCep || '').replace(/\D/g, '');
    const regional = getRegionFromCep(cleanCep);

    // Ajuste proporcional para pacotes com mais de 1kg (adiciona valor médio proporcional)
    const extraWeight = weightKg && weightKg > 1 ? (weightKg - 1) : 0;
    const extraPricePac = Math.min(60, extraWeight * 3.50);
    const extraPriceSedex = Math.min(90, extraWeight * 6.50);

    const pacPrice = (regional.pac + extraPricePac).toFixed(2);
    const sedexPrice = (regional.sedex + extraPriceSedex).toFixed(2);

    return [
        {
            id: 1,
            name: 'PAC (Correios)',
            is_estimate: true,
            price: pacPrice,
            discount: '0.00',
            currency: 'R$',
            delivery_time: regional.pacDays,
            delivery_range: regional.pacRange,
            packages: [],
            additional_services: { receipt: false, own_hand: false, collect: false },
            company: { id: 1, name: 'Correios', picture: 'https://app.superfrete.com/images/correios.png' },
            has_error: false,
        },
        {
            id: 2,
            name: 'SEDEX (Correios)',
            is_estimate: true,
            price: sedexPrice,
            discount: '0.00',
            currency: 'R$',
            delivery_time: regional.sedexDays,
            delivery_range: regional.sedexRange,
            packages: [],
            additional_services: { receipt: false, own_hand: false, collect: false },
            company: { id: 1, name: 'Correios', picture: 'https://app.superfrete.com/images/correios.png' },
            has_error: false,
        },
    ];
}

export function getInternationalFallback(): ShippingQuoteOption[] {
    return [
        { id: 991, name: 'Exporta Fácil Econômico (est.)', is_estimate: true, price: '320.00', delivery_time: 20 },
        { id: 992, name: 'Exporta Fácil Expresso EMS (est.)', is_estimate: true, price: '400.00', delivery_time: 8 },
    ];
}

export function getShippingFallback(country: string, destinationPostalCode?: string, weightKg?: number): ShippingQuoteOption[] {
    return country === 'BR' ? getNationalFallback(destinationPostalCode, weightKg) : getInternationalFallback();
}

export function estimateItemWeightKg(name: string): number {
    const lower = (name || '').toLowerCase();

    // Kits combinados (ex: Máscara + Botina ou Kit Guerreiro)
    if (lower.includes('kit') && (lower.includes('botina') || lower.includes('bota') || lower.includes('guerreiro'))) {
        return 2.20;
    }

    // Calçados e botas pesadas de segurança
    if (
        lower.includes('bota') ||
        lower.includes('botina') ||
        lower.includes('coturno') ||
        lower.includes('calcado') ||
        lower.includes('calçado')
    ) {
        return 1.40;
    }

    // Tochas TIG completas e cabos pesados
    if (
        lower.includes('tocha') ||
        lower.includes('cabo') ||
        lower.includes('porta eletrodo') ||
        lower.includes('garra')
    ) {
        return 1.20;
    }

    // Mochilas e bolsas
    if (lower.includes('mochila') || lower.includes('bolsa')) {
        return 0.90;
    }

    // Máscaras de solda e caldeiraria
    if (lower.includes('mascara') || lower.includes('máscara')) {
        return 0.70;
    }

    // Vestuário leve e acessórios têxteis
    if (
        lower.includes('bone') ||
        lower.includes('boné') ||
        lower.includes('camiseta') ||
        lower.includes('camisa') ||
        lower.includes('touca') ||
        lower.includes('luva')
    ) {
        return 0.30;
    }

    // Lentes, consumíveis, óculos, carneiras e peças pequenas
    if (
        lower.includes('lente') ||
        lower.includes('consumivel') ||
        lower.includes('consumível') ||
        lower.includes('bico') ||
        lower.includes('difusor') ||
        lower.includes('eletrodo') ||
        lower.includes('escova') ||
        lower.includes('oculos') ||
        lower.includes('óculos') ||
        lower.includes('carneira')
    ) {
        return 0.25;
    }

    // Valor padrão para produtos gerais sem categoria específica
    return 0.80;
}

export function isMaskName(name: string): boolean {
    const n = (name || '').toLowerCase();
    return n.includes('mascara') || n.includes('máscara');
}

export function normalizeShippingCountry(raw: unknown): string {
    if (raw == null) return 'BR';
    if (typeof raw !== 'string') throw new ShippingInputError('País de destino inválido.');
    const trimmed = raw.trim();
    if (!trimmed || trimmed.toLowerCase() === 'brasil') return 'BR';
    const country = trimmed.toUpperCase();
    if (country !== 'INT' && !/^[A-Z]{2}$/.test(country)) {
        throw new ShippingInputError('País de destino inválido.');
    }
    return country;
}

export function parseShippingOptionPrice(option: { price?: unknown; custom_price?: unknown } | null | undefined): number | null {
    if (!option) return null;
    const value = Number(String(option.custom_price ?? option.price ?? '').replace(',', '.'));
    return Number.isFinite(value) && value >= 0 ? value : null;
}
