import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCanonicalProductSlug } from '@/utils/slugify';
import { getProductTaxonomy } from '@/lib/taxonomy';
import { buildStorageUrl, isLegacyDeadStorageUrl } from '@/lib/site-config';

export const revalidate = 300; // Cache de 5 minutos na borda

export async function GET() {
  try {
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
      console.error('[Meta Feed] Erro no banco de dados:', error);
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
      if (!trimmed || isLegacyDeadStorageUrl(trimmed)) return null;
      if (/\.(mp4|webm|mov|ogg|avi|mkv)($|\?)/i.test(trimmed)) return null;
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
      const resolved = buildStorageUrl(trimmed);
      if (resolved.startsWith('http://') || resolved.startsWith('https://')) return resolved;
      return `${SITE_URL}${resolved.startsWith('/') ? resolved : `/${resolved}`}`;
    };

    let itemsXml = '';

    (produtos || []).forEach((produto: any) => {
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
          if (validImages.length >= 5) break;
        }
      }

      if (validImages.length === 0) return;

      const mainImage = validImages[0];
      const additionalImages = validImages.slice(1);

      const canonicalSlug = getCanonicalProductSlug(produto);
      const productUrl = `${SITE_URL}/produto/${canonicalSlug}`;

      const precoBase = (produto.preco || 0).toFixed(2);
      const salePrice = (produto.preco_promocional && produto.preco_promocional < produto.preco)
        ? produto.preco_promocional.toFixed(2)
        : null;

      const descricaoText = produto.descricao?.replace(/<[^>]*>?/gm, '').trim() || produto.nome;
      const categoriaNome = produto.categorias?.nome || 'Equipamentos';
      const brandName = produto.marca || 'Gringa Style';
      const mpnCode = `GS-${String(produto.id).padStart(3, '0')}`;
      const rawGtin = produto.gtin13 ? String(produto.gtin13).trim() : '';
      const hasValidGtin = /^\d{8,14}$/.test(rawGtin);

      // Taxonomia de produto Meta / Google padronizada
      const taxonomy = getProductTaxonomy(produto.nome, categoriaNome);

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
            <g:availability>in stock</g:availability>
            <g:price>${precoBase} BRL</g:price>
            <g:brand>${escapeXml(brandName)}</g:brand>
            <g:google_product_category>${escapeXml(taxonomy.googleCategoryPath)}</g:google_product_category>
            <g:product_type>${escapeXml(taxonomy.productType)}</g:product_type>
            <g:mpn>${escapeXml(mpnCode)}</g:mpn>
            <g:custom_label_0>${produto.em_estoque ? 'Pronta Entrega' : 'Sob Encomenda'}</g:custom_label_0>`;

      if (hasValidGtin) {
        itemsXml += `\n            <g:gtin>${escapeXml(rawGtin)}</g:gtin>`;
      } else {
        itemsXml += `\n            <g:identifier_exists>no</g:identifier_exists>`;
      }

      if (salePrice) {
        itemsXml += `\n            <g:sale_price>${salePrice} BRL</g:sale_price>`;
      }

      itemsXml += `
            <g:shipping>
                <g:country>BR</g:country>
                <g:service>Correios PAC</g:service>
                <g:price>28.90 BRL</g:price>
            </g:shipping>
        </item>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
    <channel>
        <title>Gringa Style - Catálogo Meta Commerce</title>
        <link>${SITE_URL}</link>
        <description>Catálogo de Produtos Gringa Style para Instagram Shop, Facebook e WhatsApp</description>
${itemsXml}
    </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[Meta Feed] Erro crítico ao gerar feed:', error);
    return new NextResponse('Erro interno ao gerar o feed do Meta Commerce.', { status: 500 });
  }
}
