import { NextResponse, type NextRequest } from 'next/server';

// Lista de User-Agents de bots agressivos e scrapers
const BLOCKED_BOTS = [
    'AhrefsBot', 'DotBot', 'SemrushBot', 'MJ12bot', 'Cyberscan',
    'PetalBot', 'Baiduspider', 'YandexBot', 'DataForSeoBot'
];

export function middleware(request: NextRequest) {
    const userAgent = request.headers.get('user-agent') || '';

    // Verifica se o User-Agent contém algum bot da lista negra
    const isBadBot = BLOCKED_BOTS.some(bot =>
        userAgent.toLowerCase().includes(bot.toLowerCase())
    );

    if (isBadBot) {
        // Retorna um erro 403 (Proibido) imediatamente, sem gastar Egress do banco
        return new NextResponse(null, { status: 403 });
    }

    return NextResponse.next();
}

// Executa o middleware em todas as rotas, exceto arquivos estáticos
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};