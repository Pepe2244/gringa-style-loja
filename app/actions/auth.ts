'use server';

import { headers } from 'next/headers';
import {
    clearAdminSession,
    createAdminSession,
    isAdminAuthenticated,
    isValidAdminPassword,
} from '@/lib/admin-auth';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const distributedAdminLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(MAX_LOGIN_ATTEMPTS, '15 m'),
        prefix: 'gringa-style:admin-login-action',
    })
    : null;

async function checkActionRateLimit(ip: string): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
    if (distributedAdminLimiter) {
        try {
            const { success, reset } = await distributedAdminLimiter.limit(`admin_action:${ip}`);
            if (!success) {
                const remaining = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
                return { allowed: false, retryAfterSeconds: remaining };
            }
            return { allowed: true, retryAfterSeconds: 0 };
        } catch (err) {
            console.warn('[RateLimit] Upstash indisponível na Server Action; usando fallback local:', err);
        }
    }

    const now = Date.now();
    const entry = loginAttempts.get(ip);
    if (!entry || now > entry.resetTime) {
        loginAttempts.set(ip, { count: 1, resetTime: now + LOGIN_WINDOW_MS });
        return { allowed: true, retryAfterSeconds: 0 };
    }
    if (entry.count >= MAX_LOGIN_ATTEMPTS) {
        const remaining = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
        return { allowed: false, retryAfterSeconds: remaining };
    }
    entry.count++;
    return { allowed: true, retryAfterSeconds: 0 };
}

export async function loginAction(formData: FormData) {
    const headerList = await headers();
    const forwarded = headerList.get('x-forwarded-for');
    const realIP = headerList.get('x-real-ip');
    const cfIP = headerList.get('cf-connecting-ip');
    const ip = cfIP || (forwarded ? forwarded.split(',')[0].trim() : (realIP || '127.0.0.1'));

    const rateLimit = await checkActionRateLimit(ip);
    if (!rateLimit.allowed) {
        return {
            success: false,
            message: `Muitas tentativas. Bloqueio temporário ativo por mais ${rateLimit.retryAfterSeconds} segundos.`
        };
    }

    const password = formData.get('password') as string;

    if (!process.env.ADMIN_PASSWORD) {
        console.error("ERRO CRÍTICO DE SEGURANÇA: A variável ADMIN_PASSWORD não está configurada no painel do servidor.");
        return { success: false, message: 'Erro de configuração no servidor. Contate o suporte.' };
    }

    if (isValidAdminPassword(password)) {
        loginAttempts.delete(ip);
        await createAdminSession();
        return { success: true };
    }

    await new Promise((res) => setTimeout(res, 800));
    return { success: false, message: 'Senha incorreta' };
}

export async function logoutAction() {
    await clearAdminSession();
}

export async function checkAuth() {
    return isAdminAuthenticated();
}