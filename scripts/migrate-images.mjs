import { createClient } from '@supabase/supabase-js';

const OLD_SUPABASE_URL = 'https://tsilaaurmpahookyanbe.supabase.co';
const OLD_SERVICE_KEY = process.env.OLD_SUPABASE_SERVICE_KEY;

if (!OLD_SERVICE_KEY) {
  throw new Error('Defina OLD_SUPABASE_SERVICE_KEY antes de executar este script.');
}

const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SERVICE_KEY);

async function listAll() {
  const { data: buckets, error } = await oldSupabase.storage.listBuckets();
  if (error) {
    console.error('Erro ao listar buckets:', error);
    return;
  }
  console.log('Buckets encontrados:', buckets.map(b => b.name));

  for (const b of buckets) {
    const { data: files } = await oldSupabase.storage.from(b.name).list();
    console.log(`Arquivos no bucket "${b.name}":`, files?.map(f => f.name));
  }
}

listAll();