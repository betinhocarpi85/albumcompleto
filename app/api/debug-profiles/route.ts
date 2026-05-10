import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const sb = createAdminClient()

  const { data: profiles, error: profilesError } = await sb
    .from('profiles')
    .select('id, nome, bairro, cidade, uf, telefone, updated_at')

  const { data: authData, error: authError } = await sb.auth.admin.listUsers({ perPage: 100 })

  return NextResponse.json({
    profilesError: profilesError?.message ?? null,
    profiles,
    authError: authError?.message ?? null,
    authUsers: authData?.users?.map(u => ({
      id: u.id,
      email: u.email,
      metadata: u.user_metadata,
    })),
  })
}
