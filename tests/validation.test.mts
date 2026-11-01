import assert from 'node:assert/strict';
import test from 'node:test';
import {
    cleanDigits,
    formatCpf,
    isValidCpf,
} from '../lib/validation.ts';

test('cleanDigits removes all non-numeric characters', () => {
    assert.equal(cleanDigits('123.456.789-00'), '12345678900');
    assert.equal(cleanDigits('abc-123_xyz'), '123');
    assert.equal(cleanDigits(''), '');
    assert.equal(cleanDigits(null), '');
});

test('formatCpf formats partial and full CPFs with mask', () => {
    assert.equal(formatCpf(''), '');
    assert.equal(formatCpf('1'), '1');
    assert.equal(formatCpf('123'), '123');
    assert.equal(formatCpf('1234'), '123.4');
    assert.equal(formatCpf('123456'), '123.456');
    assert.equal(formatCpf('1234567'), '123.456.7');
    assert.equal(formatCpf('123456789'), '123.456.789');
    assert.equal(formatCpf('1234567890'), '123.456.789-0');
    assert.equal(formatCpf('12345678901'), '123.456.789-01');
    assert.equal(formatCpf('123.456.789-01 extra'), '123.456.789-01');
});

test('isValidCpf validates valid and rejects invalid CPFs', () => {
    // Valid standard CPF (52998224725)
    assert.equal(isValidCpf('52998224725'), true);
    assert.equal(isValidCpf('529.982.247-25'), true);

    // Repeated digits must be rejected
    assert.equal(isValidCpf('00000000000'), false);
    assert.equal(isValidCpf('11111111111'), false);
    assert.equal(isValidCpf('22222222222'), false);
    assert.equal(isValidCpf('99999999999'), false);

    // Invalid length
    assert.equal(isValidCpf('123'), false);
    assert.equal(isValidCpf('5299822472'), false);
    assert.equal(isValidCpf('529982247250'), false);
    assert.equal(isValidCpf(''), false);
    assert.equal(isValidCpf(null), false);

    // Tampered check digits
    assert.equal(isValidCpf('52998224720'), false);
    assert.equal(isValidCpf('52998224705'), false);
});

