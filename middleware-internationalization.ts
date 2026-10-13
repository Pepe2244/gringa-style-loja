import { NextRequest } from 'next/server';

// Este projeto é monolíngue em pt-BR. O redirecionamento forçado para /pt ou /en
// quebrava a indexação e gerava conflitos de canonicalização/redirect em páginas públicas.
// Portanto, o middleware foi desativado para não interferir em crawl e snippets do Google.
export function middleware(_request: NextRequest) {
    return;
}

export const config = {
    matcher: [],
};