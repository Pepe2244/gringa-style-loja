import assert from 'node:assert/strict';
import test from 'node:test';
import { slugify, getCanonicalProductSlug } from '../utils/slugify.ts';
import { buildCanonicalUrl, buildStorageUrl, isLegacyDeadStorageUrl } from '../lib/site-config.ts';

function normalizeSlug(str: string): string {
    return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function normalizeSearchText(str: string): string {
    return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

test('slugify produces clean, URL-safe slugs for portuguese text', () => {
    assert.equal(
        slugify('Máscara de Solda Gringa Style - Linha Sand Croco'),
        'mascara-de-solda-gringa-style-linha-sand-croco'
    );
    assert.equal(
        slugify('Boné Snapback Gringa Style - Bordado 3D'),
        'bone-snapback-gringa-style-bordado-3d'
    );
    assert.equal(
        slugify('Óculos Steelflex Neon — Proteção'),
        'oculos-steelflex-neon-protecao'
    );
});

test('getCanonicalProductSlug maps all legacy and HTML-entity slugs to canonical slugs', () => {
    assert.equal(
        getCanonicalProductSlug({ nome: 'Camiseta Gringa Style &quot;Oudopanda&quot; Premium - Edição Soldador' }),
        'camiseta-gringa-style-oudopanda-premium-edicao-soldador'
    );
    assert.equal(
        getCanonicalProductSlug({ slug: 'camiseta-gringa-style-quotoudopandaquot-premium-edicao-soldador' }),
        'camiseta-gringa-style-oudopanda-premium-edicao-soldador'
    );
    assert.equal(
        getCanonicalProductSlug({ slug: 'lente-de-solda-passiva-oudopanda-classe-optica-1111-profissional' }),
        'lente-de-solda-passiva-oudopanda-classe-optica-1-1-1-1-profissional'
    );
    assert.equal(
        getCanonicalProductSlug({ slug: 'mascara-de-solda-gringa-style-croco-green-sand' }),
        'mascara-de-solda-gringa-style-linha-sand-croco'
    );
    assert.equal(
        getCanonicalProductSlug({ slug: 'mascara-de-solda-personalizada-gringa-style-couro-legitimo-e-alta-performance' }),
        'mascara-de-solda-personalizada-gringa-style-couro-legitimo-alta-performance'
    );
});

test('isLegacyDeadStorageUrl detects dead Supabase project and buildStorageUrl sanitizes it', () => {
    const deadUrl = 'https://tsilaaurmpahookyanbe.supabase.co/storage/v1/object/public/produtos/foto.webp';
    assert.equal(isLegacyDeadStorageUrl(deadUrl), true);
    assert.equal(buildStorageUrl(deadUrl), '/imagens/logo_gringa_style.webp');
});

test('normalizeSlug matches accented and unaccented product names and slugs', () => {
    const canonicalName = 'Máscara de Solda Gringa Style';
    const legacySlugWithoutVowel = 'mscara-de-solda-gringa-style';
    const normalSlug = 'mascara-de-solda-gringa-style';

    assert.equal(normalizeSlug(canonicalName), 'mascaradesoldagringastyle');
    assert.equal(normalizeSlug(normalSlug), 'mascaradesoldagringastyle');
    // Legacy without vowels has similar root
    assert.ok(normalizeSlug(canonicalName).includes(normalizeSlug(legacySlugWithoutVowel).replace('mscara', 'mascara')));
});

test('normalizeSearchText finds products regardless of accentuation or casing', () => {
    const products = [
        { id: 1, nome: 'Máscara de Solda Profissional', tags: ['solda', 'tig', 'fibra'] },
        { id: 2, nome: 'Boné Snapback Preto', tags: ['streetwear', 'bone'] },
        { id: 3, nome: 'Óculos Neon Proteção', tags: ['epi', 'oculos'] },
    ];

    const search = (query: string) => {
        const termNorm = normalizeSearchText(query);
        const tokens = termNorm.split(/\s+/).filter(t => t.length > 0 && !['de', 'da', 'do', 'e'].includes(t));

        return products.filter(p => {
            const combined = `${normalizeSearchText(p.nome)} ${(p.tags || []).map(normalizeSearchText).join(' ')}`;
            if (combined.includes(termNorm)) return true;
            return tokens.length > 0 && tokens.every(t => combined.includes(t));
        });
    };

    // User types without accent
    assert.equal(search('mascara').length, 1);
    assert.equal(search('mascara de solda').length, 1);
    assert.equal(search('bone').length, 1);
    assert.equal(search('oculos').length, 1);

    // User types with accent
    assert.equal(search('Máscara').length, 1);
    assert.equal(search('Boné').length, 1);
    assert.equal(search('Óculos').length, 1);

    // Multi-token search with different word order
    assert.equal(search('solda profissional mascara').length, 1);
});

test('buildCanonicalUrl always generates absolute https URLs without trailing slash', () => {
    assert.ok(buildCanonicalUrl('/loja').startsWith('https://'));
    assert.ok(buildCanonicalUrl('/loja').endsWith('/loja'));
    assert.ok(!buildCanonicalUrl('/loja/').endsWith('/loja/'));
    assert.equal(buildCanonicalUrl('/produto/mascara-1'), 'https://gringastylebr.com.br/produto/mascara-1');
});

test('buildStorageUrl resolves Supabase storage paths correctly', () => {
    assert.ok(buildStorageUrl('produtos/foto.jpg').includes('storage/v1/object/public'));
    assert.equal(buildStorageUrl('https://example.com/foto.jpg'), 'https://example.com/foto.jpg');
    assert.equal(buildStorageUrl('blob:http://localhost:3000/123-abc'), 'blob:http://localhost:3000/123-abc');
    assert.equal(buildStorageUrl('data:image/png;base64,abc'), 'data:image/png;base64,abc');
});

test('feed formatImageUrl correctly handles relative storage paths vs site assets', () => {
    const SITE_URL = 'https://gringastylebr.com.br';
    const formatImageUrl = (url: unknown): string | null => {
        if (!url || typeof url !== 'string') return null;
        const trimmed = url.trim();
        if (!trimmed) return null;
        if (/\.(mp4|webm|mov|ogg|avi|mkv)($|\?)/i.test(trimmed)) return null;
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
        const resolved = buildStorageUrl(trimmed);
        if (resolved.startsWith('http://') || resolved.startsWith('https://')) return resolved;
        return `${SITE_URL}${resolved.startsWith('/') ? resolved : `/${resolved}`}`;
    };

    assert.ok(formatImageUrl('produtos/banner.png')?.startsWith('https://'));
    assert.ok(formatImageUrl('produtos/banner.png')?.includes('storage/v1/object/public'));
    assert.equal(formatImageUrl('/imagens/logo.png'), 'https://gringastylebr.com.br/imagens/logo.png');
    assert.equal(formatImageUrl('video.mp4'), null);
});

test('mask detection logic identifies welding masks regardless of casing and accents', () => {
    const isMask = (name: string) => {
        const n = (name || '').toLowerCase();
        return n.includes('mascara') || n.includes('máscara');
    };

    assert.equal(isMask('Máscara de Solda Gringa'), true);
    assert.equal(isMask('MASCARA DE FIBRA TIG'), true);
    assert.equal(isMask('mascara soldador'), true);
    assert.equal(isMask('Boné Snapback 3D'), false);
    assert.equal(isMask('Camisa Streetwear'), false);
});

test('slug starting with numbers does not falsely match as numeric id', () => {
    const isPureNumericId = (val: string) => /^\d+$/.test(val);
    assert.equal(isPureNumericId('23'), true);
    assert.equal(isPureNumericId('104'), true);
    assert.equal(isPureNumericId('3m-mascara-de-solda'), false);
    assert.equal(isPureNumericId('12-eletrodos-de-tungstenio'), false);
    assert.equal(isPureNumericId('90-graus-esquadro'), false);
});

test('b2b asset id detection differentiates pure integers from uuids starting with numbers', () => {
    const isPureInteger = (val: string) => /^\d+$/.test(val);
    assert.equal(isPureInteger('123'), true);
    assert.equal(isPureInteger('456789'), true);
    // UUIDs starting with numbers must NOT be treated as pure integers
    assert.equal(isPureInteger('15796ac1-ec1f-470f-9116-0d4c5ac93251'), false);
    assert.equal(isPureInteger('e84088ad-e3c9-4d1d-88e2-6ffe7004844d'), false);
    assert.equal(isPureInteger('b74ee4fa-4164-46d0-81d5-7fe4f95014c8'), false);
});
