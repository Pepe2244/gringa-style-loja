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
            const rawImage = produto.media_urls[0]; // Pega sempre a primeira imagem real do produto
            const imageLink = rawImage.startsWith('http') ? rawImage : `${SITE_URL}${rawImage.startsWith('/') ? rawImage : `/${rawImage}`}`;
            const precoBase = produto.preco.toFixed(2);
            const salePrice = produto.preco_promocional && produto.preco_promocional < produto.preco ? produto.preco_promocional.toFixed(2) : null;
            const priceEffectiveStart = new Date().toISOString().split('.')[0] + 'Z';
            const priceEffectiveEnd = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('.')[0] + 'Z';

            xml += `
        <item>
            <g:id>${produto.id}</g:id>
            <g:title>${escapeXml(produto.nome)}</g:title>
            <g:description>${escapeXml(produto.descricao)}</g:description>
            <g:link>${escapeXml(productUrl)}</g:link>
            <g:image_link>${escapeXml(imageLink)}</g:image_link>
            <g:condition>new</g:condition>
            <g:availability>${produto.em_estoque ? 'in_stock' : 'out_of_stock'}</g:availability>
            <g:price>${precoBase} BRL</g:price>
            <g:google_product_category>${escapeXml('Apparel & Accessories > Safety Apparel')}</g:google_product_category>
            <g:product_type>${escapeXml('Equipamentos de Solda > Máscaras de Solda')}</g:product_type>
            <g:brand>${escapeXml('Gringa Style')}</g:brand>
            <g:mpn>${escapeXml(produto.slug || String(produto.id))}</g:mpn>
            <g:shipping>
                <g:country>BR</g:country>
                <g:service>Standard</g:service>
                <g:price>0.00 BRL</g:price>
            </g:shipping>`;

            // Lógica de Preço Promocional
            if (salePrice) {
                xml += `
            <g:sale_price>${salePrice} BRL</g:sale_price>
            <g:price_effective_date>${priceEffectiveStart}/${priceEffectiveEnd}</g:price_effective_date>`;
            }

            xml += `
            <g:identifier_exists>true</g:identifier_exists>
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

