import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/utils/slugify';

export const revalidate = 300; // Revalida a cada 5 minutos para refletir estoque rapidamente

export async function GET() {
  try {
    // JOIN com a tabela de categorias para obter a taxonomia real da loja
    const { data: produtos, error } = await supabase
      .from('produtos')
      .select(`
        *,
        categorias (
          nome
        )
      `)
      .eq('em_estoque', true);

    if (error) {
      console.error('Erro na DB ao gerar Feed:', error);
      throw error;
    }

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gringastylebr.com.br';

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

    const formatImageUrl = (url: unknown): string | null => {
      if (!url || typeof url !== 'string') return null;
      const trimmed = url.trim();
      if (!trimmed) return null;
      // Ignora vídeos
      if (/\.(mp4|webm|mov|ogg|avi|mkv)($|\?)/i.test(trimmed)) return null;
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
      return `${SITE_URL}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
    };

    let itemsXml = '';

    (produtos || []).forEach((produto: any) => {
      // Coleta imagens de media_urls e imagens descartando vídeos e duplicatas (até 4 fotos)
      const rawMediaList = [
        ...(Array.isArray(produto.media_urls) ? produto.media_urls : []),
        ...(Array.isArray(produto.imagens) ? produto.imagens : []),
      ];

      const validImages: string[] = [];
      const seenImages = new Set<string>();

      for (const raw of rawMediaList) {
        const formatted = formatImageUrl(raw);
        if (formatted && !seenImages.has(formatted)) {
          seenImages.add(formatted);
          validImages.push(formatted);
          if (validImages.length >= 4) break; // Limite de 4 imagens automáticas
        }
      }

      if (validImages.length === 0) return;

      const mainImage = validImages[0];
      const additionalImages = validImages.slice(1);

      const canonicalSlug = (produto.slug && String(produto.slug).trim().length > 0)
        ? String(produto.slug).trim()
        : slugify(produto.nome) || String(produto.id);
      const productUrl = `${SITE_URL}/produto/${canonicalSlug}`;

      const precoBase = (produto.preco || 0).toFixed(2);
      const salePrice = (produto.preco_promocional && produto.preco_promocional < produto.preco)
        ? produto.preco_promocional.toFixed(2)
        : null;

      const descricaoText = produto.descricao?.trim() || produto.nome;
      
      // Extração de dados dinâmicos e taxonomia Google
      const categoriaNome = produto.categorias?.nome || 'Diversos';
      const brandName = produto.marca || 'Gringa Style';
      const mpnCode = `GS-${String(produto.id).padStart(3, '0')}`;
      const rawGtin = produto.gtin13 ? String(produto.gtin13).trim() : '';
      const hasValidGtin = /^\d{8,14}$/.test(rawGtin);

      // Taxonomia oficial do Google Product Category
      let googleCategory = '926'; // Hardware > Tools > Welding & Soldering
      const catLower = categoriaNome.toLowerCase();
      if (catLower.includes('boné') || catLower.includes('bone')) {
        googleCategory = '173'; // Apparel & Accessories > Clothing Accessories > Hats
      } else if (catLower.includes('camisa') || catLower.includes('vestu')) {
        googleCategory = '212'; // Apparel & Accessories > Clothing > Shirts & Tops
      } else if (catLower.includes('máscara') || catLower.includes('mascara')) {
        googleCategory = '926'; // Welding Helmets
      }

      const additionalImagesXml = additionalImages
        .map((img) => `\n            <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`)
        .join('');

      itemsXml += `
        <item>
            <g:id>${produto.id}</g:id>
            <g:title>${escapeXml(produto.nome)}</g:title>
            <g:description>${escapeXml(descricaoText)}</g:description>
            <g:link>${escapeXml(productUrl)}</g:link>
            <g:image_link>${escapeXml(mainImage)}</g:image_link>${additionalImagesXml}
            <g:condition>new</g:condition>
            <g:availability>in_stock</g:availability>
            <g:price>${precoBase} BRL</g:price>
            <g:google_product_category>${googleCategory}</g:google_product_category>
            <g:product_type>${escapeXml(`Equipamentos > ${categoriaNome}`)}</g:product_type>
            <g:brand>${escapeXml(brandName)}</g:brand>
            <g:mpn>${escapeXml(mpnCode)}</g:mpn>`;
      
      // Validação de Identificadores (Conforme diretrizes oficiais do Google Merchant Center)
      if (hasValidGtin) {
          itemsXml += `\n            <g:gtin>${escapeXml(rawGtin)}</g:gtin>`;
          itemsXml += `\n            <g:identifier_exists>yes</g:identifier_exists>`;
      } else {
          // Produtos artesanais/personalizados sem código de barras EAN/GTIN de fábrica
          itemsXml += `\n            <g:identifier_exists>no</g:identifier_exists>`;
      }

      // Frete base alinhado com o checkout real (evita suspensão por divergência de frete)
      itemsXml += `
            <g:shipping>
                <g:country>BR</g:country>
                <g:service>Correios PAC</g:service>
                <g:price>28.90 BRL</g:price>
            </g:shipping>`;

      if (salePrice) {
        const priceEffectiveStart = new Date().toISOString().split('.')[0] + 'Z';
        const priceEffectiveEnd = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('.')[0] + 'Z';
        itemsXml += `
            <g:sale_price>${salePrice} BRL</g:sale_price>
            <g:price_effective_date>${priceEffectiveStart}/${priceEffectiveEnd}</g:price_effective_date>`;
      }

      itemsXml += `
        </item>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
    <channel>
        <title>Gringa Style</title>
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