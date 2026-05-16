import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? '' })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { endpoint, keys } = await request.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Subscription inválida' }, { status: 400 })
  }

  const sb = createAdminClient()
  await sb.from('push_subscriptions').upsert({
    user_id:  user.id,
    endpoint,
    p256dh:   keys.p256dh,
    auth:     keys.auth,
  }, { onConflict: 'user_id,endpoint' })

  return NextResponse.json({ ok: true })
}

// DELETE — cancela todas as subscriptions do usuário
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createAdminClient()
  await sb.from('push_subscriptions').delete().eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
