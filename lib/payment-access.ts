import 'server-only';

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_SECONDS = 24 * 60 * 60;

function signature(payload: string) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY é obrigatória para validar o acesso ao pagamento.');
    return createHmac('sha256', key).update(payload).digest('base64url');
}

export function createPaymentAccessToken(participantId: number) {
    const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    const payload = `${participantId}.${expiresAt}.${randomBytes(24).toString('base64url')}`;
    return `${Buffer.from(payload).toString('base64url')}.${signature(payload)}`;
}

export function verifyPaymentAccessToken(participantId: number, token: string) {
    try {
        const [encodedPayload, suppliedSignature, extra] = token.split('.');
        if (!encodedPayload || !suppliedSignature || extra) return false;
        const payload = Buffer.from(encodedPayload, 'base64url').toString();
        const [tokenParticipantId, expiresAt, nonce, invalidExtra] = payload.split('.');
        if (invalidExtra || tokenParticipantId !== String(participantId) || !nonce) return false;
        if (!/^\d+$/.test(expiresAt) || Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;

        const expectedSignature = Buffer.from(signature(payload));
        const actualSignature = Buffer.from(suppliedSignature);
        return expectedSignature.length === actualSignature.length && timingSafeEqual(expectedSignature, actualSignature);
    } catch {
        return false;
    }
}
