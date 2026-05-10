import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase com service_role — bypassa RLS.
 * Use APENAS em código server-side (API routes, Server Components).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
