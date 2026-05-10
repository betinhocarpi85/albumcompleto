import { NextResponse } from 'next/server'
import { isAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  if (!await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const sb = createAdminClient()
  const { data, error } = await sb.from('site_settings').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const settings: Record<string, string> = {}
  for (const row of data ?? []) {
    settings[row.key] = row.value
  }

  return NextResponse.json({ settings })
}

export async function POST(request: Request) {
  if (!await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { key, value } = await request.json()
  if (!key) return NextResponse.json({ error: 'key obrigatório' }, { status: 400 })

  const sb = createAdminClient()

  const { error } = await sb.from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await sb.from('admin_logs').insert({
    action: 'update_setting',
    target_id: key,
    details: `${key} = ${value}`,
  })

  return NextResponse.json({ ok: true })
}
