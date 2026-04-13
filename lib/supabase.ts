import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gagtrlmtofcywziufplo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Limpar flag legado de sessões anteriores onde a tabela não existia
localStorage.removeItem('agrosuste_profiles_missing');

export const supabaseTableStates = {
  profilesMissing: false
};