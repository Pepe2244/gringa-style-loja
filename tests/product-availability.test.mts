import assert from 'node:assert/strict';
import test from 'node:test';
import {
    PRONTA_ENTREGA_TAG,
    isProntaEntrega,
    stripAvailabilityTags,
    applyProntaEntregaToTags,
    getSearchableAvailabilityText,
} from '../utils/productAvailability.ts';

test('isProntaEntrega defaults to false and recognizes sentinel or legacy tags', () => {
    assert.equal(isProntaEntrega(null), false);
    assert.equal(isProntaEntrega({ tags: [] }), false);
    assert.equal(isProntaEntrega({ tags: ['tig', 'fibra'] }), false);
    assert.equal(isProntaEntrega({ tags: [PRONTA_ENTREGA_TAG] }), true);
    assert.equal(isProntaEntrega({ tags: ['Pronta Entrega'] }), true);
    assert.equal(isProntaEntrega({ tags: ['pronta-entrega'] }), true);
    assert.equal(isProntaEntrega({ tags: ['pronta_entrega'] }), true);
    assert.equal(isProntaEntrega({ tags: [PRONTA_ENTREGA_TAG], pronta_entrega: false }), false);
    assert.equal(isProntaEntrega({ tags: [], pronta_entrega: true }), true);
});

test('stripAvailabilityTags removes technical and legacy availability tags while keeping user tags', () => {
    const cleaned = stripAvailabilityTags([
        'tig',
        PRONTA_ENTREGA_TAG,
        'Pronta Entrega',
        'pronta-entrega',
        'pronta_entrega',
        'mascara',
    ]);
    assert.deepEqual(cleaned, ['tig', 'mascara']);
    assert.deepEqual(stripAvailabilityTags(null), []);
});

test('applyProntaEntregaToTags toggles sentinel tag without duplicates and respects the 50-tag limit', () => {
    assert.deepEqual(applyProntaEntregaToTags(['tig', PRONTA_ENTREGA_TAG], true), [
        'tig',
        PRONTA_ENTREGA_TAG,
    ]);
    assert.deepEqual(applyProntaEntregaToTags(['tig', PRONTA_ENTREGA_TAG, 'pronta-entrega'], false), [
        'tig',
    ]);

    const fiftyTags = Array.from({ length: 50 }, (_, i) => `tag-${i + 1}`);
    const withProntaEntrega = applyProntaEntregaToTags(fiftyTags, true);
    assert.equal(withProntaEntrega.length, 50);
    assert.equal(withProntaEntrega[49], PRONTA_ENTREGA_TAG);
    assert.equal(withProntaEntrega.includes('tag-49'), true);
    assert.equal(withProntaEntrega.includes('tag-50'), false);

    const fiftyOneTags = Array.from({ length: 55 }, (_, i) => `tag-${i + 1}`);
    assert.equal(applyProntaEntregaToTags(fiftyOneTags, false).length, 50);
});

test('getSearchableAvailabilityText avoids leaking sentinel tag and exposes availability keywords only when in stock', () => {
    const sobEncomenda = getSearchableAvailabilityText({
        em_estoque: true,
        tags: ['tig', 'mascara'],
    });
    assert.equal(sobEncomenda.includes(PRONTA_ENTREGA_TAG), false);
    assert.equal(sobEncomenda.includes('__'), false);
    assert.equal(sobEncomenda.includes('sob encomenda'), true);
    assert.equal(sobEncomenda.includes('pronta entrega'), false);

    const prontaEntrega = getSearchableAvailabilityText({
        em_estoque: true,
        tags: ['tig', PRONTA_ENTREGA_TAG],
    });
    assert.equal(prontaEntrega.includes(PRONTA_ENTREGA_TAG), false);
    assert.equal(prontaEntrega.includes('__'), false);
    assert.equal(prontaEntrega.includes('pronta entrega'), true);
    assert.equal(prontaEntrega.includes('pronta-entrega'), true);
    assert.equal(prontaEntrega.includes('sob encomenda'), false);

    const outOfStock = getSearchableAvailabilityText({
        em_estoque: false,
        tags: ['tig', PRONTA_ENTREGA_TAG],
    });
    assert.equal(outOfStock, 'tig');
});
