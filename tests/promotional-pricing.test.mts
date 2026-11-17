import assert from 'node:assert/strict';
import test from 'node:test';
import {
    calculateCouponDiscount,
    getUnitPrice,
    getUnitPriceWithCampaign,
    isDateWithinRange,
    isProductPromoActive,
    type ActiveCampaignForPricing,
    type CouponForCheckout,
    type PricedProduct,
} from '../lib/checkout-pricing.ts';

const baseProduct: PricedProduct = {
    id: 1,
    preco: 200,
    preco_promocional: 150,
    preco_pix: 140,
    em_estoque: true,
    inicio_promocao: '2026-11-10T00:00:00Z',
    fim_promocao: '2026-11-20T23:59:59Z',
};

test('isDateWithinRange handles nulls, boundaries and out-of-range dates', () => {
    const mid = Date.parse('2026-11-15T12:00:00Z');
    const before = Date.parse('2026-11-05T00:00:00Z');
    const after = Date.parse('2026-11-25T00:00:00Z');

    assert.equal(isDateWithinRange(null, null, mid), true);
    assert.equal(isDateWithinRange(undefined, undefined, mid), true);
    assert.equal(isDateWithinRange('2026-11-10T00:00:00Z', '2026-11-20T23:59:59Z', mid), true);
    assert.equal(isDateWithinRange('2026-11-10T00:00:00Z', '2026-11-20T23:59:59Z', before), false);
    assert.equal(isDateWithinRange('2026-11-10T00:00:00Z', '2026-11-20T23:59:59Z', after), false);
    assert.equal(isDateWithinRange('invalid-date', null, mid), false);
});

test('produto com promoção pontual válida no período', () => {
    const now = Date.parse('2026-11-15T12:00:00Z');
    assert.equal(isProductPromoActive(baseProduct, now), true);

    const price = getUnitPriceWithCampaign(baseProduct, 'cartao_credito', null, now);
    assert.equal(price, 150);
});

test('produto com promoção pontual antes do início (preço normal)', () => {
    const now = Date.parse('2026-11-05T00:00:00Z');
    assert.equal(isProductPromoActive(baseProduct, now), false);

    const price = getUnitPriceWithCampaign(baseProduct, 'cartao_credito', null, now);
    assert.equal(price, 200);
});

test('produto com promoção pontual depois do fim (preço normal)', () => {
    const now = Date.parse('2026-11-25T00:00:00Z');
    assert.equal(isProductPromoActive(baseProduct, now), false);

    const price = getUnitPriceWithCampaign(baseProduct, 'cartao_credito', null, now);
    assert.equal(price, 200);
});

test('produto sem datas de promoção (comportamento legado mantido se preco_promocional existir)', () => {
    const legacyProduct: PricedProduct = {
        id: 2,
        preco: 100,
        preco_promocional: 80,
        preco_pix: null,
        em_estoque: true,
        inicio_promocao: null,
        fim_promocao: null,
    };

    assert.equal(isProductPromoActive(legacyProduct), true);
    assert.equal(getUnitPrice(legacyProduct, 'cartao_credito'), 80);
});

test('campanha ativa com desconto percentual em produto aplicável', () => {
    const productA: PricedProduct = { id: 10, preco: 200, preco_promocional: null, preco_pix: null, em_estoque: true };
    const productB: PricedProduct = { id: 20, preco: 200, preco_promocional: null, preco_pix: null, em_estoque: true };

    const campaign: ActiveCampaignForPricing = {
        id: 1,
        data_inicio: '2026-11-01T00:00:00Z',
        data_fim: '2026-11-30T23:59:59Z',
        tipo_desconto: 'percentual',
        valor_desconto: 20, // 20%
        produtos_aplicaveis: [10],
        aplicar_em_todos: false,
    };

    const now = Date.parse('2026-11-17T12:00:00Z');
    // Produto 10 recebe 20% de desconto (200 - 40 = 160)
    assert.equal(getUnitPriceWithCampaign(productA, 'cartao_credito', campaign, now), 160);
    // Produto 20 não está na lista aplicável, mantém preço integral
    assert.equal(getUnitPriceWithCampaign(productB, 'cartao_credito', campaign, now), 200);
});

test('campanha ativa com desconto fixo', () => {
    const product: PricedProduct = { id: 10, preco: 150, preco_promocional: null, preco_pix: null, em_estoque: true };

    const campaign: ActiveCampaignForPricing = {
        id: 2,
        data_inicio: '2026-11-01T00:00:00Z',
        data_fim: '2026-11-30T23:59:59Z',
        tipo_desconto: 'fixo',
        valor_desconto: 35,
        produtos_aplicaveis: [10],
        aplicar_em_todos: false,
    };

    const now = Date.parse('2026-11-17T12:00:00Z');
    assert.equal(getUnitPriceWithCampaign(product, 'cartao_credito', campaign, now), 115);

    // Desconto fixo maior que o valor do produto deve respeitar o mínimo de 0.01
    const bigDiscountCampaign: ActiveCampaignForPricing = {
        ...campaign,
        valor_desconto: 300,
    };
    assert.equal(getUnitPriceWithCampaign(product, 'cartao_credito', bigDiscountCampaign, now), 0.01);
});

test('campanha fora do prazo (não aplica desconto)', () => {
    const product: PricedProduct = { id: 10, preco: 100, preco_promocional: null, preco_pix: null, em_estoque: true };

    const futureCampaign: ActiveCampaignForPricing = {
        id: 3,
        data_inicio: '2026-12-01T00:00:00Z',
        data_fim: '2026-12-31T23:59:59Z',
        tipo_desconto: 'percentual',
        valor_desconto: 50,
        aplicar_em_todos: true,
    };

    const pastCampaign: ActiveCampaignForPricing = {
        id: 4,
        data_inicio: '2026-10-01T00:00:00Z',
        data_fim: '2026-10-31T23:59:59Z',
        tipo_desconto: 'percentual',
        valor_desconto: 50,
        aplicar_em_todos: true,
    };

    const now = Date.parse('2026-11-17T12:00:00Z');
    assert.equal(getUnitPriceWithCampaign(product, 'cartao_credito', futureCampaign, now), 100);
    assert.equal(getUnitPriceWithCampaign(product, 'cartao_credito', pastCampaign, now), 100);
});

test('campanha para toda a loja (aplicar_em_todos: true)', () => {
    const product1: PricedProduct = { id: 101, preco: 100, preco_promocional: null, preco_pix: null, em_estoque: true };
    const product2: PricedProduct = { id: 102, preco: 300, preco_promocional: null, preco_pix: null, em_estoque: true };

    const campaign: ActiveCampaignForPricing = {
        id: 5,
        tipo_desconto: 'percentual',
        valor_desconto: 15, // 15%
        aplicar_em_todos: true,
        produtos_aplicaveis: [], // Vazio, mas aplicar_em_todos prevalece
    };

    assert.equal(getUnitPriceWithCampaign(product1, 'cartao_credito', campaign), 85);
    assert.equal(getUnitPriceWithCampaign(product2, 'cartao_credito', campaign), 255);
});

test('produto com AMBAS as promoções ativas (deve escolher o maior desconto / menor preço)', () => {
    const product: PricedProduct = {
        id: 1,
        preco: 100,
        preco_promocional: 85, // Preço promocional pontual = 85
        preco_pix: null,
        em_estoque: true,
        inicio_promocao: '2026-11-01T00:00:00Z',
        fim_promocao: '2026-11-30T23:59:59Z',
    };
    const now = Date.parse('2026-11-17T12:00:00Z');

    // Caso A: Campanha oferece 20% (preço 80) -> Campanha dá desconto maior que promo (85)
    const strongCampaign: ActiveCampaignForPricing = {
        tipo_desconto: 'percentual',
        valor_desconto: 20,
        aplicar_em_todos: true,
    };
    assert.equal(getUnitPriceWithCampaign(product, 'cartao_credito', strongCampaign, now), 80);

    // Caso B: Campanha oferece 10% (preço 90) -> Promo pontual dá desconto maior (85)
    const weakCampaign: ActiveCampaignForPricing = {
        tipo_desconto: 'percentual',
        valor_desconto: 10,
        aplicar_em_todos: true,
    };
    assert.equal(getUnitPriceWithCampaign(product, 'cartao_credito', weakCampaign, now), 85);
});

test('desconto PIX junto com promoção', () => {
    const product: PricedProduct = {
        id: 1,
        preco: 100,
        preco_promocional: 90,
        preco_pix: 85,
        em_estoque: true,
    };

    // Sem campanha:
    // No cartão paga preço promocional (90)
    assert.equal(getUnitPrice(product, 'cartao_credito'), 90);
    // No PIX paga o menor entre PIX (85) e Promo (90) -> 85
    assert.equal(getUnitPrice(product, 'pix'), 85);

    // Com campanha mais agressiva (preço 75, menor que PIX 85):
    const aggressiveCampaign: ActiveCampaignForPricing = {
        tipo_desconto: 'fixo',
        valor_desconto: 25, // 100 - 25 = 75
        aplicar_em_todos: true,
    };
    // No PIX, garante que o cliente receba o melhor preço entre PIX e Promoção obtida (min(85, 75) = 75)
    assert.equal(getUnitPriceWithCampaign(product, 'pix', aggressiveCampaign), 75);

    // Com campanha menos agressiva que PIX (preço 88):
    const mildCampaign: ActiveCampaignForPricing = {
        tipo_desconto: 'fixo',
        valor_desconto: 12, // 100 - 12 = 88
        aplicar_em_todos: true,
    };
    // No PIX, min(85, 88) = 85
    assert.equal(getUnitPriceWithCampaign(product, 'pix', mildCampaign), 85);
});

test('calculateCouponDiscount aplica cupom sobre preços já reduzidos por campanha ativa', () => {
    const product: PricedProduct = {
        id: 10,
        preco: 200,
        preco_promocional: null,
        preco_pix: null,
        em_estoque: true,
    };
    const campaign: ActiveCampaignForPricing = {
        tipo_desconto: 'percentual',
        valor_desconto: 50, // 50% de desconto -> unitário = 100
        aplicar_em_todos: true,
    };
    const coupon: CouponForCheckout = {
        codigo: 'EXTRA10',
        ativo: true,
        tipo_desconto: 'percentual',
        valor_desconto: 10, // 10% adicional
    };
    const items = [{ produto_id: 10, quantidade: 2 }];

    const result = calculateCouponDiscount(coupon, items, [product], 'cartao_credito', campaign);
    // Subtotal com campanha = 100 * 2 = 200
    assert.equal(result.subtotal, 200);
    // Desconto de 10% do cupom sobre 200 = 20
    assert.equal(result.discount, 20);
});

test('campanha com descontos individuais independentes por produto (R$ 50 em um e 50% em outro)', () => {
    const prodCaro: PricedProduct = {
        id: 101,
        preco: 1000,
        preco_promocional: null,
        preco_pix: null,
        em_estoque: true,
    };
    const prodBarato: PricedProduct = {
        id: 102,
        preco: 100,
        preco_promocional: null,
        preco_pix: null,
        em_estoque: true,
    };
    const prodPrecoFixo: PricedProduct = {
        id: 103,
        preco: 250,
        preco_promocional: null,
        preco_pix: null,
        em_estoque: true,
    };
    const prodGeral: PricedProduct = {
        id: 104,
        preco: 80,
        preco_promocional: null,
        preco_pix: null,
        em_estoque: true,
    };

    const campaign: ActiveCampaignForPricing = {
        tipo_desconto: 'percentual',
        valor_desconto: 10, // 10% geral como fallback
        aplicar_em_todos: true,
        produtos_descontos: [
            { produto_id: 101, tipo: 'fixo', valor: 50 }, // Tira 50 reais de um de 1000 -> 950
            { produto_id: 102, tipo: 'percentual', valor: 50 }, // Tira 50% de um de 100 -> 50
            { produto_id: 103, tipo: 'preco_fixo', valor: 199.90 }, // Preço fixo direto na campanha -> 199.90
        ],
    };

    // Prod 101: R$ 50 de desconto fixo sobre R$ 1000 = R$ 950
    assert.equal(getUnitPriceWithCampaign(prodCaro, 'cartao_credito', campaign), 950);

    // Prod 102: 50% de desconto sobre R$ 100 = R$ 50
    assert.equal(getUnitPriceWithCampaign(prodBarato, 'cartao_credito', campaign), 50);

    // Prod 103: Preço fixo de R$ 199.90 sobre R$ 250 = R$ 199.90
    assert.equal(getUnitPriceWithCampaign(prodPrecoFixo, 'cartao_credito', campaign), 199.9);

    // Prod 104: Não tem regra individual, recebe a regra geral de 10% de R$ 80 = R$ 72
    assert.equal(getUnitPriceWithCampaign(prodGeral, 'cartao_credito', campaign), 72);
});

test('isProductPromoActive lida com campos opcionais ou parciais', () => {
    assert.equal(isProductPromoActive({ preco: 100, preco_promocional: undefined }), false);
    assert.equal(isProductPromoActive({ preco: 100, preco_promocional: null }), false);
    assert.equal(isProductPromoActive({ preco: 100, preco_promocional: 80 }), true);
    assert.equal(
        isProductPromoActive(
            { preco: 100, preco_promocional: 80, inicio_promocao: '2026-11-20T00:00:00Z' },
            Date.parse('2026-11-15T00:00:00Z')
        ),
        false
    );
});
