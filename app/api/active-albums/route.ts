import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getUser(request: NextRequest) {
  const admin = createAdminClient()

  // 1) via cookie (fluxo normal)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return user

  // 2) via Bearer token (mobile/manual signup)
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    const { data: { user: u } } = await admin.auth.getUser(token)
    if (u) return u
  }

  return null
}

export async function GET(request: NextRequest) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ albums: [] })

  const admin = createAdminClient()
  const { data } = await admin
    .from('user_preferences')
    .select('active_albums')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ albums: data?.active_albums ?? [] })
}

export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { albums } = await request.json()
  const admin = createAdminClient()

  await admin.from('user_preferences').upsert({
    user_id:       user.id,
    active_albums: albums,
    updated_at:    new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
