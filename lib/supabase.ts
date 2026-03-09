import { createClient } from '@supabase/supabase-js';

// INSTRUÇÕES:
// 1. Project URL -> Coloque em 'supabaseUrl'
// 2. AnonKey -> Coloque em 'supabaseAnonKey'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cmmvcpmmffciqqjgxttv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});