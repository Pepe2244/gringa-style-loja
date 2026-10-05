import assert from 'node:assert/strict';
import test from 'node:test';
import {
    aggregateCartItems,
    calculateCouponDiscount,
    getCouponFailure,
    getUnitPrice,
    normalizePaymentMethod,
    type CouponForCheckout,
    type PricedProduct,
} from '../lib/checkout-pricing.ts';

const products: PricedProduct[] = [
    { id: 1, preco: 100, preco_promocional: 90, preco_pix: 85, em_estoque: true },
    { id: 2, preco: 50, preco_promocional: null, preco_pix: null, em_estoque: true },
];

const coupon: CouponForCheckout = {
    codigo: 'TESTE',
    ativo: true,
    data_validade: null,
    limite_uso: 10,
    usos_atuais: 2,
    metodo_pagamento_restrito: null,
    valor_minimo: null,
    tipo_aplicacao: 'geral',
    produtos_aplicaveis: null,
    tipo_desconto: 'percentual',
    valor_desconto: 10,
    tipo: null,
    valor: null,
};

test('combines duplicate products and enforces the aggregate quantity cap', () => {
    assert.deepEqual(
        aggregateCartItems([
            { produto_id: 1, quantidade: 2 },
            { produto_id: 1, quantidade: 3 },
        ]),
        [{ produto_id: 1, quantidade: 5 }],
    );
    assert.throws(
        () => aggregateCartItems([
            { produto_id: 1, quantidade: 50 },
            { produto_id: 1, quantidade: 50 },
        ]),
        /não pode exceder 99/,
    );
    assert.throws(() => aggregateCartItems([{ produto_id: 1, quantidade: 0 }]), /inválida/);
    assert.deepEqual(
        aggregateCartItems([
            { produto_id: 1, quantidade: 1, variante: { tipo: 'Tamanho', opcao: 'P' } },
            { produto_id: 1, quantidade: 2, variante: { tipo: 'Tamanho', opcao: 'P' } },
            { produto_id: 1, quantidade: 1, variante: { tipo: 'Tamanho', opcao: 'M' } },
        ]),
        [
            { produto_id: 1, quantidade: 3, variante: { tipo: 'Tamanho', opcao: 'P' } },
            { produto_id: 1, quantidade: 1, variante: { tipo: 'Tamanho', opcao: 'M' } },
        ],
    );
});

test('uses only server prices and selects PIX pricing when appropriate', () => {
    assert.equal(getUnitPrice(products[0], 'pix'), 85);
    assert.equal(getUnitPrice(products[0], 'cartao_credito'), 90);
    assert.equal(getUnitPrice(products[1], 'pix'), 50);
    assert.equal(normalizePaymentMethod('PIX'), 'pix');
    assert.throws(() => normalizePaymentMethod('unknown'), /Método de pagamento inválido/);
});

test('checks coupon expiry, usage limit, minimum and payment restriction', () => {
    const now = Date.parse('2026-10-05T12:00:00.000Z');
    assert.equal(
        getCouponFailure({ ...coupon, data_validade: '2026-10-04T23:59:59.000Z' }, 100, 'pix', now),
        'Este cupom está expirado.',
    );
    assert.equal(
        getCouponFailure({ ...coupon, usos_atuais: 10 }, 100, 'pix', now),
        'Este cupom atingiu o limite de utilizações.',
    );
    assert.match(
        getCouponFailure({ ...coupon, valor_minimo: 200 }, 100, 'pix', now) || '',
        /Valor mínimo/,
    );
    assert.match(
        getCouponFailure({ ...coupon, metodo_pagamento_restrito: 'pix' }, 100, 'cartao_credito', now) || '',
        /apenas para PIX/,
    );
});

test('calculates discounts from current prices and only applicable products', () => {
    const productCoupon = {
        ...coupon,
        tipo_aplicacao: 'produto',
        produtos_aplicaveis: [1],
    } satisfies CouponForCheckout;
    const result = calculateCouponDiscount(
        productCoupon,
        [{ produto_id: 1, quantidade: 2 }, { produto_id: 2, quantidade: 1 }],
        products,
        'pix',
    );
    assert.deepEqual(result, { subtotal: 220, discount: 17 });
});

test('applies a fixed product coupon once per eligible product', () => {
    const productCoupon = {
        ...coupon,
        tipo_aplicacao: 'produto',
        produtos_aplicaveis: [1, 2],
        tipo_desconto: 'fixo',
        valor_desconto: 10,
    } satisfies CouponForCheckout;
    const result = calculateCouponDiscount(
        productCoupon,
        [{ produto_id: 1, quantidade: 3 }, { produto_id: 2, quantidade: 1 }],
        products,
        'pix',
    );
    assert.deepEqual(result, { subtotal: 305, discount: 20 });
});
