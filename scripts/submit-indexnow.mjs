import fs from 'fs';
import path from 'path';

// Lê variáveis de ambiente do .env.local
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split(/\r?\n/)) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=', 2)[1].trim().replace(/^["']|["']$/g, '');
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=', 2)[1].trim().replace(/^["']|["']$/g, '');
    }
  }
} catch (err) {
  console.warn('Não foi possível ler .env.local:', err.message);
}

const HOST = 'gringastylebr.com.br';
const BASE_URL = `https://${HOST}`;
const INDEXNOW_KEY = '2bf56f9cae5145ab99c206739f1d1122';
const KEY_LOCATION = `${BASE_URL}/${INDEXNOW_KEY}.txt`;

const STATIC_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/loja`,
  `${BASE_URL}/rifa`,
  `${BASE_URL}/historico`,
  `${BASE_URL}/sobre`,
  `${BASE_URL}/gs-servicos-industriais`,
  `${BASE_URL}/soldas-especiais`,
  `${BASE_URL}/devolucao-e-reembolso`,
  `${BASE_URL}/privacidade`,
  `${BASE_URL}/busca`
];

async function fetchDynamicUrls() {
  const dynamicUrls = [];

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase não configurado no .env.local, enviando apenas URLs estáticas.');
    return dynamicUrls;
  }

  try {
    // 1. Categorias
    const catRes = await fetch(`${supabaseUrl}/rest/v1/categorias?select=id`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    });
    if (catRes.ok) {
      const cats = await catRes.json();
      for (const c of cats) {
        dynamicUrls.push(`${BASE_URL}/categoria/${c.id}`);
      }
    }

    // 2. Produtos
    const prodRes = await fetch(`${supabaseUrl}/rest/v1/produtos?select=id,slug,nome`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    });
    if (prodRes.ok) {
      const prods = await prodRes.json();
      for (const p of prods) {
        const slug = p.slug || p.id;
        dynamicUrls.push(`${BASE_URL}/produto/${slug}`);
      }
    }
  } catch (err) {
    console.error('Erro ao buscar URLs dinâmicas do Supabase:', err.message);
  }

  return dynamicUrls;
}

async function submitToIndexNow(endpoint, payload) {
  console.log(`Enviando ${payload.urlList.length} URLs para ${endpoint}...`);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    console.log(`Status ${endpoint}: ${res.status} ${res.statusText}`);
    const text = await res.text();
    if (text) console.log(`Resposta: ${text}`);

    return res.status === 200 || res.status === 202;
  } catch (err) {
    console.error(`Falha no envio para ${endpoint}:`, err.message);
    return false;
  }
}

async function main() {
  const dynamicUrls = await fetchDynamicUrls();
  const allUrls = Array.from(new Set([...STATIC_URLS, ...dynamicUrls]));

  console.log(`=== INDEXNOW BATCH SUBMITTER ===`);
  console.log(`Host: ${HOST}`);
  console.log(`Key: ${INDEXNOW_KEY}`);
  console.log(`Total de URLs a submeter: ${allUrls.length}`);

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: allUrls
  };

  const okIndexNow = await submitToIndexNow('https://api.indexnow.org/IndexNow', payload);
  const okBing = await submitToIndexNow('https://www.bing.com/IndexNow', payload);

  if (okIndexNow || okBing) {
    console.log('\n✅ Submissão concluída com sucesso!');
  } else {
    console.error('\n❌ Erro na submissão ao IndexNow.');
  }
}

main();
