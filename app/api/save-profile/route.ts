import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { nome, telefone, cep, bairro, cidade, uf, aceitouTermos, aceitouPrivacidade } = body

  if (!nome || !telefone || !cep || !aceitouTermos || !aceitouPrivacidade) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  // Verifica duplicidade de telefone (exclui o próprio usuário)
  const admin = createAdminClient()
  const { data: dup } = await admin
    .from('profiles')
    .select('id')
    .eq('telefone', telefone)
    .neq('id', user.id)
    .limit(1)

  if (dup && dup.length > 0) {
    return NextResponse.json({ error: 'telefone_duplicado' }, { status: 409 })
  }

  const { error } = await admin.from('profiles').upsert({
    id:                  user.id,
    nome,
    telefone,
    cep,
    bairro,
    cidade,
    uf,
    maior_18:            true,
    aceitou_termos:      aceitouTermos,
    aceitou_privacidade: aceitouPrivacidade,
    updated_at:          new Date().toISOString(),
  })

  if (error) {
    console.error('[save-profile] erro:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Limpa o cookie de cadastro pendente
  const res = NextResponse.json({ ok: true })
  res.cookies.set('profile_pending', '', {
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   0,
  })
  return res
}
