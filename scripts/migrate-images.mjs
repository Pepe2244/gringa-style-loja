import { createClient } from '@supabase/supabase-js';

const OLD_SUPABASE_URL = 'https://tsilaaurmpahookyanbe.supabase.co';
const OLD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzaWxhYXVybXBhaG9va3lhbmJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU3NzkyNCwiZXhwIjoyMDg4MTUzOTI0fQ.6SsJHkYKSmRZwuSuTVe8EcLzS3YaAv_FOzbk8hD8gH0';

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