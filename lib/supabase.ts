import { createClient } from '@supabase/supabase-js';

// INSTRUÇÕES:
// 1. Project URL -> Coloque em 'supabaseUrl'
// 2. AnonKey -> Coloque em 'supabaseAnonKey'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cmmvcpmmffciqqjgxttv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Melancolia de conexão: Se o URL for o padrão e estiver a falhar, avisamos na consola
if (supabaseUrl.includes('cmmvcpmmffciqqjgxttv')) {
  console.warn('[SUPABASE] Utilizando URL padrão que pode estar inativo. Verifique VITE_SUPABASE_URL.');
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

if (!supabase) {
  console.error('[SUPABASE ERROR] Supabase não inicializado. Verifique as chaves no ficheiro .env');
}

// Global flag para silenciar erros de tabelas que sabemos estarem em falta (com persistência no localStorage)
const PROFILES_MISSING_KEY = 'agrosuste_profiles_missing';

export const supabaseTableStates = {
  get profilesMissing(): boolean {
    return localStorage.getItem(PROFILES_MISSING_KEY) === 'true';
  },
  set profilesMissing(value: boolean) {
    if (value) {
      localStorage.setItem(PROFILES_MISSING_KEY, 'true');
    } else {
      localStorage.removeItem(PROFILES_MISSING_KEY);
    }
  }
};