const LEGACY_SLUG_MAP: Record<string, string> = {
    'culos-steelflex-neon--proteo-ocular-e-estilo-streetwear': 'oculos-steelflex-neon-protecao-ocular-e-estilo-streetwear',
    'bota-de-segurana-detroit-pro-bracol---cano-mdio-preto-e-vermelho': 'bota-de-seguranca-detroit-pro-bracol-cano-medio-preto-e-vermelho',
    'lente-de-solda-passiva-oudopanda---classe-ptica-1111-profissional': 'lente-de-solda-passiva-oudopanda-classe-optica-1-1-1-1-profissional',
    'lente-de-solda-passiva-oudopanda-classe-optica-1111-profissional': 'lente-de-solda-passiva-oudopanda-classe-optica-1-1-1-1-profissional',
    'bon-gringa-style-classic-aba-curva---casual-preto': 'bone-gringa-style-classic-aba-curva-casual-preto',
    'tocha-tig-wp-26-profissional-alta-amperagem---punho-ergonmico-': 'tocha-tig-wp-26-profissional-alta-amperagem-punho-ergonomico',
    'camisa-de-soldador-gringa-style-manga-longa---tecido-retardante-a-chamas': 'camisa-de-soldador-gringa-style-manga-longa-tecido-retardante-a-chamas',
    'kit-consumveis-tig-completo-para-tochas--estojo': 'kit-consumiveis-tig-completo-para-tochas-estojo',
    'camiseta-gringa-style--oudopanda---premium-edio-soldador': 'camiseta-gringa-style-oudopanda-premium-edicao-soldador',
    'camiseta-gringa-style-quotoudopandaquot-premium-edicao-soldador': 'camiseta-gringa-style-oudopanda-premium-edicao-soldador',
    'kit-guerreiro-gtaw---gringa-style': 'kit-guerreiro-gtaw-gringa-style',
    'kit-guerreiro-gtaw-': 'kit-guerreiro-gtaw-gringa-style',
    'kit-gringa-style-air--mscara-minimalista-white--botina-miura-premium': 'kit-gringa-style-air-mascara-minimalista-white-botina-miura-premium',
    'bon-snapback-gringa-style---bordado-3d-em-alto-relevo': 'bone-snapback-gringa-style-bordado-3d-em-alto-relevo',
    'estilo-tropical---mscara-de-solda-em-fibra-de-vidro-personalizada': 'estilo-tropical-mascara-de-solda-em-fibra-de-vidro-personalizada',
    'mscara-de-solda-profissional-em-fibra-de-vidro': 'mascara-de-solda-profissional-em-fibra-de-vidro',
    'mscara-de-solda---air-model': 'mascara-de-solda-air-model',
    'camisa-gringa-style---copa-do-mundo-': 'camisa-gringa-style-copa-do-mundo',
    'mochila-bfalo-cwb-tech--safe---resistncia-urbana': 'mochila-bufalo-cwb-tech-safe-resistencia-urbana',
    'camiseta-gringa-style-artist-series---estampas-exclusivas-autorais': 'camiseta-gringa-style-artist-series-estampas-exclusivas-autorais',
    'bon-gringa-style-aba-curva': 'bone-gringa-style-aba-curva',
    'lente-automtica-lake-michigan-tefuwane--gringa-style': 'lente-automatica-lake-michigan-tefuwane-gringa-style',
    'cabo-de-madeira-anatmico-para-tocha-tig---gringa-style': 'cabo-de-madeira-anatomico-para-tocha-tig-gringa-style',
    'mscara-de-solda-personalizada-gringa-style---couro-legtimo--alta-performance': 'mascara-de-solda-personalizada-gringa-style-couro-legitimo-alta-performance',
    'mascara-de-solda-personalizada-gringa-style-couro-legitimo-e-alta-performance': 'mascara-de-solda-personalizada-gringa-style-couro-legitimo-alta-performance',
    'mscara-de-solda-gringa-style---croco-green--sand': 'mascara-de-solda-gringa-style-linha-sand-croco',
    'mascara-de-solda-gringa-style-croco-green-sand': 'mascara-de-solda-gringa-style-linha-sand-croco',
    'botina-miura-premium-em-couro-nobuck---conforto-ttico-e-resistncia-extrema': 'botina-miura-premium-em-couro-nobuck-conforto-tatico-e-resistencia-extrema',
    '8-bon-gringa-style-aba-curva': 'bone-gringa-style-aba-curva',
    '12-bon-snapback-gringa-style---bordado-3d-em-alto-relevo': 'bone-snapback-gringa-style-bordado-3d-em-alto-relevo',
};

/**
 * Normaliza e gera slugs URL-friendly em português
 * Remove entidades HTML, acentos (diacríticos) via NFD antes de remover caracteres especiais.
 * Exemplo: "Óculos Steelflex Proteção" -> "oculos-steelflex-protecao"
 */
export function slugify(text: string | null | undefined): string {
    if (!text) return '';

    const raw = text.toString().trim();
    if (LEGACY_SLUG_MAP[raw]) {
        return LEGACY_SLUG_MAP[raw];
    }

    const decoded = raw
        .replace(/&quot;|&#34;|&apos;|&#39;/gi, '')
        .replace(/&amp;/gi, ' ');

    const normalized = decoded
        .normalize('NFD') // Decompõe caracteres acentuados (ex: "ó" -> "o" + acento)
        .replace(/[\u0300-\u036f]/g, '') // Remove todos os acentos
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-') // Substitui qualquer caractere não-alfanumérico por traço
        .replace(/^-+|-+$/g, ''); // Remove traços no início e no fim

    return LEGACY_SLUG_MAP[normalized] || normalized;
}

export function getCanonicalProductSlug(product: { id?: number | string; nome?: string | null; slug?: string | null }): string {
    const rawSlug = product.slug?.trim();
    if (rawSlug) {
        if (LEGACY_SLUG_MAP[rawSlug]) {
            return LEGACY_SLUG_MAP[rawSlug];
        }
        const cleaned = slugify(rawSlug);
        if (cleaned) return cleaned;
    }

    const fromName = slugify(product.nome);
    if (fromName) return fromName;

    return String(product.id || '');
}
