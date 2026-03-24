import { createClient } from '@supabase/supabase-js'

// O Vite busca as chaves que você colocou no .env usando esse comando:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)