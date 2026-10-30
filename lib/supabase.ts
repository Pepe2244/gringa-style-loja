import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://evgabdhvekmdhfvzteow.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key-placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey);
