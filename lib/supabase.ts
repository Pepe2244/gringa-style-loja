import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://evgabdhvekmdhfvzteow.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2Z2FiZGh2ZWttZGhmdnp0ZW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDIzNTgsImV4cCI6MjEwMjcxODM1OH0.oy3G65gw5cWvljjyt0LoZSXk7cnzEQ2BJ9IYtuHtnck';

export const supabase = createClient(supabaseUrl, supabaseKey);

