import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600; // Revalida a cada 1 hora

export async function GET() {
  try {
    const { data: produtos, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('em_estoque', true)
      .not('media_urls', 'is', null);

    if (error) {
      console.error('Erro na DB ao gerar Feed:', error);
      throw error;
    }

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gringa-style.netlify.app';

    const escapeXml = (unsafe: string | null | undefined) => {
      if (!unsafe) return '';
      return String(unsafe).replace(/[<>&'"]/g, (c) => {
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

    let itemsXml = '';

    (produtos || []).forEach((produto) => {
      if (!Array.isArray(produto.media_urls) || produto.media_urls.length === 0) return;
      const rawImage = produto.media_urls[0];
      if (!rawImage || typeof rawImage !== 'string' || !rawImage.trim()) return;

      const productUrl = `${SITE_URL}/produto/${produto.slug || produto.id}`;
      const imageLink = rawImage.startsWith('http')
        ? rawImage
        : `${SITE_URL}${rawImage.startsWith('/') ? rawImage : `/${rawImage}`}`;

      const precoBase = (produto.preco || 0).toFixed(2);
      const salePrice = (produto.preco_promocional && produto.preco_promocional < produto.preco)
        ? produto.preco_promocional.toFixed(2)
        : null;

      const descricaoText = produto.descricao?.trim() || produto.nome;

      itemsXml += `
        <item>
            <g:id>${produto.id}</g:id>
            <g:title>${escapeXml(produto.nome)}</g:title>
            <g:description>${escapeXml(descricaoText)}</g:description>
            <g:link>${escapeXml(productUrl)}</g:link>
            <g:image_link>${escapeXml(imageLink)}</g:image_link>
            <g:condition>new</g:condition>
            <g:availability>${produto.em_estoque ? 'in_stock' : 'out_of_stock'}</g:availability>
            <g:price>${precoBase} BRL</g:price>
            <g:google_product_category>Apparel &amp; Accessories &gt; Safety Apparel</g:google_product_category>
            <g:product_type>Equipamentos de Solda &gt; Máscaras de Solda</g:product_type>
            <g:brand>Gringa Style</g:brand>
            <g:mpn>${escapeXml(produto.slug || String(produto.id))}</g:mpn>
            <g:shipping>
                <g:country>BR</g:country>
                <g:service>Standard</g:service>
                <g:price>0.00 BRL</g:price>
            </g:shipping>`;

      if (salePrice) {
        const priceEffectiveStart = new Date().toISOString().split('.')[0] + 'Z';
        const priceEffectiveEnd = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('.')[0] + 'Z';
        itemsXml += `
            <g:sale_price>${salePrice} BRL</g:sale_price>
            <g:price_effective_date>${priceEffectiveStart}/${priceEffectiveEnd}</g:price_effective_date>`;
      }

      itemsXml += `
            <g:identifier_exists>false</g:identifier_exists>
        </item>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
    <channel>
        <title>Gringa Style - Equipamentos TIG</title>
        <link>${SITE_URL}</link>
        <description>Catálogo Oficial de Produtos Gringa Style</description>
${itemsXml}
    </channel>
</rss>`;

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