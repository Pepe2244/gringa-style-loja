import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getNationalFallback,
    getShippingFallback,
    normalizeShippingCountry,
    parseShippingOptionPrice,
} from '../lib/shipping-rates.ts';

test('getNationalFallback returns fair regional average for São Paulo (Faixa 1)', () => {
    const options = getNationalFallback('01310-100');
    assert.equal(options.length, 2);

    const pac = options.find((o) => o.id === 1);
    const sedex = options.find((o) => o.id === 2);

    assert.ok(pac);
    assert.ok(sedex);
    assert.equal(pac.price, '23.90');
    assert.equal(sedex.price, '27.90');
    assert.equal(pac.is_estimate, true);
});

test('getNationalFallback returns fair regional average for Sul e Sudeste (Faixa 2)', () => {
    // Rio de Janeiro (20040-020)
    const optionsRJ = getNationalFallback('20040-020');
    assert.equal(optionsRJ.find((o) => o.id === 1)?.price, '29.90');
    assert.equal(optionsRJ.find((o) => o.id === 2)?.price, '54.90');

    // Curitiba / PR (80010-000)
    const optionsPR = getNationalFallback('80010-000');
    assert.equal(optionsPR.find((o) => o.id === 1)?.price, '29.90');
    assert.equal(optionsPR.find((o) => o.id === 2)?.price, '54.90');
});

test('getNationalFallback returns fair regional average for Bahia e Mato Grosso (Faixa 3)', () => {
    // Salvador / BA (40020-010)
    const optionsBA = getNationalFallback('40020-010');
    assert.equal(optionsBA.find((o) => o.id === 1)?.price, '35.90');
    assert.equal(optionsBA.find((o) => o.id === 2)?.price, '69.90');

    // Cuiabá / MT (78005-100)
    const optionsMT = getNationalFallback('78005-100');
    assert.equal(optionsMT.find((o) => o.id === 1)?.price, '35.90');
    assert.equal(optionsMT.find((o) => o.id === 2)?.price, '69.90');
});

test('getNationalFallback returns fair regional average for CE, PE, PA, TO (Faixa 4)', () => {
    // Fortaleza / CE (60060-120)
    const optionsCE = getNationalFallback('60060-120');
    assert.equal(optionsCE.find((o) => o.id === 1)?.price, '55.90');
    assert.equal(optionsCE.find((o) => o.id === 2)?.price, '89.90');

    // Belém / PA (66010-000)
    const optionsPA = getNationalFallback('66010-000');
    assert.equal(optionsPA.find((o) => o.id === 1)?.price, '55.90');
    assert.equal(optionsPA.find((o) => o.id === 2)?.price, '89.90');
});

test('getNationalFallback protects the store against undercharging distant North/Northeast (Faixa 5)', () => {
    // Rio Branco / AC (69900-062)
    const optionsAC = getNationalFallback('69900-062');
    assert.equal(optionsAC.find((o) => o.id === 1)?.price, '74.90');
    assert.equal(optionsAC.find((o) => o.id === 2)?.price, '98.90');

    // Manaus / AM (69005-040)
    const optionsAM = getNationalFallback('69005-040');
    assert.equal(optionsAM.find((o) => o.id === 1)?.price, '74.90');
    assert.equal(optionsAM.find((o) => o.id === 2)?.price, '98.90');
});

test('getNationalFallback adjusts proportionally for packages over 1kg', () => {
    // Pacote de 3kg em SP (2kg extras * 3.50 = +7.00 no PAC, +13.00 no SEDEX)
    const options = getNationalFallback('01310-100', 3.0);
    assert.equal(options.find((o) => o.id === 1)?.price, '30.90');
    assert.equal(options.find((o) => o.id === 2)?.price, '40.90');
});

test('normalizeShippingCountry and parseShippingOptionPrice operate robustly', () => {
    assert.equal(normalizeShippingCountry(undefined), 'BR');
    assert.equal(normalizeShippingCountry('Brasil'), 'BR');
    assert.equal(normalizeShippingCountry('US'), 'US');
    assert.equal(normalizeShippingCountry('pt'), 'PT');

    assert.equal(parseShippingOptionPrice({ price: '25.50' }), 25.5);
    assert.equal(parseShippingOptionPrice({ price: 25.5 }), 25.5);
    assert.equal(parseShippingOptionPrice({ price: '25,50' }), 25.5);
    assert.equal(parseShippingOptionPrice({ custom_price: '30.00', price: '25.00' }), 30);
    assert.equal(parseShippingOptionPrice(null), null);

    const intFallback = getShippingFallback('US');
    assert.equal(intFallback.length, 2);
});
