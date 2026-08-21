import { NextRequest, NextResponse } from 'next/server';

// ==========================================
// 1. CONFIGURAÇÕES DE FIREWALL (EDGE)
// ==========================================
const BLOCKED_BOTS = [
    'AhrefsBot', 'DotBot', 'SemrushBot', 'MJ12bot', 'Cyberscan',
    'PetalBot', 'Baiduspider', 'YandexBot', 'DataForSeoBot',
    'GPTBot', 'ChatGPT-User', 'CCBot', 'Omgilibot', 'FacebookBot', 
    'PerplexityBot', 'ClaudeBot', 'anthropic-ai', 'Barkrowler', 
    'MegaIndex', 'SeekportBot', 'Serpstatbot', 'Bytespider', 
    'Amazonbot', 'TurnitinBot', 'Scrapy', 'python-requests', 
    'curl', 'wget'
];

const MALICIOUS_PATHS = [
    '.env', '.git', 'wp-admin', 'wp-login.php', '.env.local', 
    'config.json', 'phpinfo.php', 'xmlrpc.php'
];

// ==========================================
// 2. CONFIGURAÇÕES DE RATE LIMITING
// ==========================================
const RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
    '/api/auth/login': { maxRequests: 5, windowMs: 15 * 60 * 1000 },
    '/api/auth/register': { maxRequests: 3, windowMs: 60 * 60 * 1000 },
    '/api/pagamento': { maxRequests: 10, windowMs: 60 * 60 * 1000 },
    '/api/validate-coupon': { maxRequests: 20, windowMs: 60 * 60 * 1000 },
    '/api/produtos': { maxRequests: 100, windowMs: 60 * 1000 },
    '/api/calculate-total': { maxRequests: 50, windowMs: 60 * 1000 },
    '/api/shipping': { maxRequests: 30, windowMs: 60 * 1000 },
    'default': { maxRequests: 1000, windowMs: 60 * 60 * 1000 }
};

const requestCounts = new Map<string, { count: number; resetTime: number }>();

function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfIP = request.headers.get('cf-connecting-ip');

    if (cfIP) return cfIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    if (realIP) return realIP;

    return 'unknown';
}

function shouldSkipRateLimit(path: string, method: string): boolean {
    if (method === 'GET' && !path.startsWith('/api/')) return true;
    if (path.includes('.') && !path.startsWith('/api/')) return true;

    const skipPaths = [
        '/api/webhook',
        '/_next',
        '/favicon.ico',
        '/robots.txt',
        '/sitemap.xml'
    ];

    return skipPaths.some(skipPath => path.startsWith(skipPath));
}

function getRateLimitConfig(path: string) {
    if (RATE_LIMITS[path]) return RATE_LIMITS[path];

    for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
        if (pattern !== 'default' && path.startsWith(pattern)) {
            return config;
        }
    }
    return RATE_LIMITS.default;
}

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

// ==========================================
// 3. FUNÇÃO PRINCIPAL EXPORTADA COMO PROXY
// ==========================================
export function proxy(request: NextRequest) {
    const userAgent = request.headers.get('user-agent') || '';
    const pathname = request.nextUrl.pathname;
    const method = request.method;

    // --- ETAPA 1: FIREWALL (Bloqueio de Bots e Paths Maliciosos) ---
    const isMaliciousPath = MALICIOUS_PATHS.some(path => pathname.includes(path));
    const isBadBot = !userAgent || BLOCKED_BOTS.some(bot =>
        userAgent.toLowerCase().includes(bot.toLowerCase())
    );

    if (isBadBot || isMaliciousPath) {
        return new NextResponse('Edge Firewall Blocked Request', { status: 403 });
    }

    // --- ETAPA 2: RATE LIMITING ---
    if (shouldSkipRateLimit(pathname, method)) {
        return NextResponse.next();
    }

    const ip = getClientIP(request);
    const key = `${ip}:${pathname}`;
    const config = getRateLimitConfig(pathname);
    const now = Date.now();

    let counter = requestCounts.get(key);
    if (!counter || now > counter.resetTime) {
        counter = {
            count: 0,
            resetTime: now + config.windowMs
        };
    }

    counter.count++;

    if (counter.count > config.maxRequests) {
        const resetTime = new Date(counter.resetTime);
        const remainingTime = Math.ceil((counter.resetTime - now) / 1000);

        return NextResponse.json(
            {
                error: 'Rate limit exceeded',
                message: `Too many requests. Try again in ${remainingTime} seconds.`,
                retryAfter: remainingTime,
            },
            {
                status: 429,
                headers: {
                    'Retry-After': remainingTime.toString(),
                    'X-RateLimit-Limit': config.maxRequests.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': resetTime.toISOString(),
                }
            }
        );
    }

    requestCounts.set(key, counter);

    if (Math.random() < 0.01) {
        cleanupExpiredCounters();
    }

    const response = NextResponse.next();
    const remaining = Math.max(0, config.maxRequests - counter.count);

    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(counter.resetTime).toISOString());

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};