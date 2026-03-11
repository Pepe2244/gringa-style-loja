import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // 1. Busca rigorosa: Apenas produtos em stock E com pelo menos uma imagem (media_urls não nulo)
        const { data: produtos, error } = await supabase
            .from('produtos')
            .select('*')
            .eq('em_estoque', true)
            .not('media_urls', 'is', null);

        if (error) {
            console.error('Erro na DB ao gerar Feed:', error);
            throw error;
        }

        // 2. URL Dinâmica: Usa variável de ambiente, com fallback seguro para produção
        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gringa-style.netlify.app';

        // 3. Cabeçalho XML padrão obrigatório
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
    <channel>
        <title>Gringa Style - Equipamentos TIG</title>
        <link>${SITE_URL}</link>
        <description>Catálogo Oficial de Produtos Gringa Style</description>`;

        // 4. Segurança XML (Escape de caracteres)
        const escapeXml = (unsafe: string) => {
            if (!unsafe) return '';
            return unsafe.replace(/[<>&'"]/g, (c) => {
                switch (c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case '\'': return '&apos;';
                    case '"': return '&quot;';
                    default: return c;
                }
            });
        };

        // 5. Construção dos Itens
        produtos.forEach((produto) => {
            // Filtro adicional de segurança: Garante que o array de imagens não está vazio
            if (!produto.media_urls || produto.media_urls.length === 0) return;

            const productUrl = `${SITE_URL}/produto/${produto.id}-${produto.slug}`;
            const imageLink = produto.media_urls[0]; // Pega sempre a primeira imagem real do produto
            const precoBase = produto.preco.toFixed(2);

            xml += `
        <item>
            <g:id>${produto.id}</g:id>
            <g:title>${escapeXml(produto.nome)}</g:title>
            <g:description>${escapeXml(produto.descricao)}</g:description>
            <g:link>${productUrl}</g:link>
            <g:image_link>${escapeXml(imageLink)}</g:image_link>
            <g:condition>new</g:condition>
            <g:availability>in_stock</g:availability>
            <g:price>${precoBase} BRL</g:price>`;

            // Lógica de Preço Promocional
            if (produto.preco_promocional && produto.preco_promocional < produto.preco) {
                xml += `
            <g:sale_price>${produto.preco_promocional.toFixed(2)} BRL</g:sale_price>`;
            }

            xml += `
            <g:brand>Gringa Style</g:brand>
        </item>`;
        });

        // 6. Fechamento
        xml += `
    </channel>
</rss>`;

        // 7. Resposta otimizada com cache para não sobrecarregar o Supabase
        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 's-maxage=3600, stale-while-revalidate',
            },
        });
    } catch (error) {
        console.error('ERRO CRÍTICO AO GERAR FEED XML:', error);
        return new NextResponse('Erro interno ao gerar o feed do Google Merchant.', { status: 500 });
    }
}

