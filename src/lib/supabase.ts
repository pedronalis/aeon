import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
export const supabaseConfigError = isSupabaseConfigured
  ? null
  : 'O servidor de autenticação não está configurado. Entre em contato com o administrador do Reino.';

if (!isSupabaseConfigured) {
  console.error('[Supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidas. Autenticação offline.');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');
