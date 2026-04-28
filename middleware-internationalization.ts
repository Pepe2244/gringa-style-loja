import { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Verificar se a requisição é para uma rota de API ou arquivo estático
    if (
        request.nextUrl.pathname.startsWith('/api') ||
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.includes('.')
    ) {
        return;
    }

    // Detectar idioma do navegador ou usar português como padrão
    const acceptLanguage = request.headers.get('accept-language') || '';
    const preferredLanguage = acceptLanguage.startsWith('pt') ? 'pt' : 'en';

    // Se não há locale na URL, redirecionar para pt-BR
    if (!request.nextUrl.pathname.startsWith('/pt') && !request.nextUrl.pathname.startsWith('/en')) {
        const newUrl = new URL(`/pt${request.nextUrl.pathname}`, request.url);
        newUrl.search = request.nextUrl.search;
        return Response.redirect(newUrl);
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};