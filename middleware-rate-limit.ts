import { NextRequest, NextResponse } from 'next/server';

// Configurações de rate limiting
const RATE_LIMITS = {
    // API endpoints
    '/api/auth/login': { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 tentativas por 15 min
    '/api/auth/register': { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 registros por hora
    '/api/pagamento': { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 pagamentos por hora
    '/api/validate-coupon': { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 validações por hora

    // Páginas públicas
    '/api/produtos': { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requisições por minuto
    '/api/calculate-total': { maxRequests: 50, windowMs: 60 * 1000 }, // 50 cálculos por minuto
    '/api/shipping': { maxRequests: 30, windowMs: 60 * 1000 }, // 30 cálculos de frete por minuto

    // Padrão para outras rotas
    default: { maxRequests: 1000, windowMs: 60 * 60 * 1000 } // 1000 por hora
};

// Store simples em memória (em produção, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(request: NextRequest) {
    const ip = getClientIP(request);
    const path = request.nextUrl.pathname;
    const method = request.method;

    // Pular rate limiting para métodos seguros ou caminhos específicos
    if (shouldSkipRateLimit(path, method)) {
        return null;
    }

    const key = `${ip}:${path}`;
    const config = getRateLimitConfig(path);
    const now = Date.now();

    // Obter ou criar contador para esta chave
    let counter = requestCounts.get(key);
    if (!counter || now > counter.resetTime) {
        counter = {
            count: 0,
            resetTime: now + config.windowMs
        };
    }

    // Incrementar contador
    counter.count++;

    // Verificar se excedeu o limite
    if (counter.count > config.maxRequests) {
        const resetTime = new Date(counter.resetTime);
        const remainingTime = Math.ceil((counter.resetTime - now) / 1000);

        return NextResponse.json(
            {
                error: 'Rate limit exceeded',
                message: `Too many requests. Try again in ${remainingTime} seconds.`,
                retryAfter: remainingTime,
                limit: config.maxRequests,
                remaining: 0,
                resetTime: resetTime.toISOString()
            },
            {
                status: 429,
                headers: {
                    'Retry-After': remainingTime.toString(),
                    'X-RateLimit-Limit': config.maxRequests.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': resetTime.toISOString(),
                    'X-RateLimit-Window': config.windowMs.toString()
                }
            }
        );
    }

    // Atualizar contador no store
    requestCounts.set(key, counter);

    // Limpar contadores expirados periodicamente
    if (Math.random() < 0.01) { // 1% de chance a cada requisição
        cleanupExpiredCounters();
    }

    // Adicionar headers informativos
    const response = NextResponse.next();
    const remaining = Math.max(0, config.maxRequests - counter.count);

    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(counter.resetTime).toISOString());
    response.headers.set('X-RateLimit-Window', config.windowMs.toString());

    return response;
}

// Obter IP do cliente
function getClientIP(request: NextRequest): string {
    // Tentar várias fontes de IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfIP = request.headers.get('cf-connecting-ip');

    if (cfIP) return cfIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    if (realIP) return realIP;

    // Fallback para IP do socket (pode não funcionar em todos os ambientes)
    return request.ip || 'unknown';
}

// Verificar se deve pular rate limiting
function shouldSkipRateLimit(path: string, method: string): boolean {
    // Pular para métodos GET em páginas públicas
    if (method === 'GET' && !path.startsWith('/api/')) {
        return true;
    }

    // Pular para arquivos estáticos
    if (path.includes('.') && !path.startsWith('/api/')) {
        return true;
    }

    // Pular para webhooks ou endpoints específicos
    const skipPaths = [
        '/api/webhook',
        '/_next',
        '/favicon.ico',
        '/robots.txt',
        '/sitemap.xml'
    ];

    return skipPaths.some(skipPath => path.startsWith(skipPath));
}

// Obter configuração de rate limit para o caminho
function getRateLimitConfig(path: string) {
    // Verificar correspondências exatas primeiro
    if (RATE_LIMITS[path]) {
        return RATE_LIMITS[path];
    }

    // Verificar padrões
    for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
        if (pattern !== 'default' && path.startsWith(pattern)) {
            return config;
        }
    }

    return RATE_LIMITS.default;
}

// Limpar contadores expirados
function cleanupExpiredCounters() {
    const now = Date.now();
    const toDelete: string[] = [];

    requestCounts.forEach((counter, key) => {
        if (now > counter.resetTime) {
            toDelete.push(key);
        }
    });

    toDelete.forEach(key => requestCounts.delete(key));
}

// Middleware principal
export function middleware(request: NextRequest) {
    // Aplicar rate limiting
    const rateLimitResponse = rateLimitMiddleware(request);
    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};