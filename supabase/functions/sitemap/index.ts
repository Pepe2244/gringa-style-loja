import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const BASE_URL = 'https://gringa-style.netlify.app';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: produtos, error: produtosError } = await supabaseClient
      .from('produtos')
      .select('id')
      .eq('emEstoque', true);

    if (produtosError) throw produtosError;

    const { data: rifas, error: rifasError } = await supabaseClient
      .from('rifas')
      .select('id')
      .eq('status', 'ativa');

    if (rifasError) throw rifasError;

    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    const staticPages = [
     { loc: '', priority: '1.00' },
     { loc: 'rifa.html', priority: '0.80' },
     { loc: 'historico.html', priority: '0.70' },
     { loc: 'privacidade.html', priority: '0.50' },
     { loc: 'carrinho.html', priority: '0.60' },
    ];

    for (const page of staticPages) {
      sitemapContent += `  <url>\n`;
      sitemapContent += `    <loc>${BASE_URL}/${page.loc}</loc>\n`;
      sitemapContent += `    <priority>${page.priority}</priority>\n`;
      sitemapContent += `  </url>\n`;
    }

    for (const produto of produtos) {
      sitemapContent += `  <url>\n`;
      sitemapContent += `    <loc>${BASE_URL}/produto.html?id=${produto.id}</loc>\n`;
      sitemapContent += `    <priority>0.90</priority>\n`;
      sitemapContent += `  </url>\n`;
    }

    for (const rifa of rifas) {
      sitemapContent += `  <url>\n`;
      sitemapContent += `    <loc>${BASE_URL}/acompanhar_rifa.html?id=${rifa.id}</loc>\n`;
      sitemapContent += `    <priority>0.80</priority>\n`;
      sitemapContent += `  </url>\n`;
    }

    sitemapContent += `</urlset>`;

    const headers = { 
      ...corsHeaders, 
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    };

    return new Response(sitemapContent, { headers: headers, status: 200 });

  } catch (error) {
    console.error('Erro ao gerar sitemap:', error.message);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao gerar sitemap', details: error.message }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
