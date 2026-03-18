import { NextResponse, type NextRequest } from 'next/server';

// Lista de User-Agents de bots agressivos, scrapers e IAs
const BLOCKED_BOTS = [
    'AhrefsBot', 'DotBot', 'SemrushBot', 'MJ12bot', 'Cyberscan',
    'PetalBot', 'Baiduspider', 'YandexBot', 'DataForSeoBot',
    'GPTBot', 'ChatGPT-User', 'CCBot', 'Omgilibot', 'FacebookBot', 
    'PerplexityBot', 'ClaudeBot', 'anthropic-ai', 'Barkrowler', 
    'MegaIndex', 'SeekportBot', 'Serpstatbot', 'Bytespider', 
    'Amazonbot', 'TurnitinBot', 'Scrapy', 'python-requests', 
    'curl', 'wget'
];

// Lista de caminhos frequentemente escaneados por hackers (WAF Básico)
const MALICIOUS_PATHS = [
    '.env', '.git', 'wp-admin', 'wp-login.php', '.env.local', 
    'config.json', 'phpinfo.php', 'xmlrpc.php'
];

export function middleware(request: NextRequest) {
    const userAgent = request.headers.get('user-agent') || '';
    const pathname = request.nextUrl.pathname;

    // 1. Bloqueia paths maliciosos diretos no Edge
    const isMaliciousPath = MALICIOUS_PATHS.some(path => pathname.includes(path));

    // 2. Verifica se o User-Agent contém algum bot da lista negra ou se está vazio (scripts)
    const isBadBot = !userAgent || BLOCKED_BOTS.some(bot =>
        userAgent.toLowerCase().includes(bot.toLowerCase())
    );

    if (isBadBot || isMaliciousPath) {
        // Retorna um erro 403 (Proibido) instantâneo
        return new NextResponse('Edge Firewall Blocked Request', { status: 403 });
    }

    return NextResponse.next();
}

// Executa o middleware em todas as rotas, exceto arquivos estáticos
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};