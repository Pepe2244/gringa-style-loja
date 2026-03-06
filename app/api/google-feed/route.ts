import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // 1. Busca no banco de dados apenas os produtos que estão em estoque
        // O Google pune severamente lojas que enviam produtos esgotados no feed
        const { data: produtos, error } = await supabase
            .from('produtos')
            .select('*')
            .eq('em_estoque', true);

        if (error) throw error;

        // 2. Definição da URL oficial da sua loja na Netlify
        // Esta URL deve ser IDÊNTICA à reivindicada no Google Merchant Center
        const SITE_URL = 'https://gringa-style.netlify.app';

        // 3. Cabeçalho padrão obrigatório exigido pelo Google Merchant
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
    <channel>
        <title>Gringa Style - Equipamentos TIG</title>
        <link>${SITE_URL}</link>
        <description>Catálogo Oficial de Produtos Gringa Style</description>`;

        // 4. Tratamento de segurança: O XML quebra se houver caracteres especiais soltos
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

        // 5. Montagem dinâmica de cada produto no formato do Google Shopping
        produtos.forEach((produto) => {
            const productUrl = `${SITE_URL}/produto/${produto.id}-${produto.slug}`;

            // Pega a primeira imagem válida ou usa o logo como fallback de segurança
            const imageLink = produto.media_urls && produto.media_urls.length > 0 
                ? produto.media_urls[0] 
                : `${SITE_URL}/imagens/logo_gringa_style.png`;

            // O Google exige o formato 150.00 BRL
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

            // Se houver preço promocional menor que o normal, aciona a tag de Oferta no Google
            if (produto.preco_promocional && produto.preco_promocional < produto.preco) {
                xml += `
            <g:sale_price>${produto.preco_promocional.toFixed(2)} BRL</g:sale_price>`;
            }

            // A marca é obrigatória para a maioria das categorias no Google Shopping
            xml += `
            <g:brand>Gringa Style</g:brand>
        </item>`;
        });

        // 6. Fechamento do arquivo XML
        xml += `
    </channel>
</rss>`;

        // 7. Retorna o XML formatado dizendo ao navegador/robô que este é um arquivo de dados, não uma página web
        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                // Mantém em cache no servidor por 1 hora para evitar sobrecarga no banco se o Google fizer muitas requisições
                'Cache-Control': 's-maxage=3600, stale-while-revalidate',
            },
        });
    } catch (error) {
        console.error('ERRO CRÍTICO AO GERAR FEED XML:', error);
        return new NextResponse('Erro interno ao gerar o feed do Google Merchant.', { status: 500 });
    }
}


