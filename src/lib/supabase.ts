import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
// Publishable (anon) key only — safe in the browser because RLS enforces access.
// Never use the service-role key in frontend code.
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url || !key) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local.',
  )
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
})
