import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBoasVindasEmail } from '@/lib/email'
import { geocodeCep } from '@/lib/maps-utils'

export async function POST(request: NextRequest) {
  const admin = createAdminClient()

  // Tenta autenticar via cookie (fluxo OAuth/desktop)
  let user: { id: string } | null = null
  const supabase = await createClient()
  const { data: { user: cookieUser } } = await supabase.auth.getUser()
  user = cookieUser

  // Fallback: autenticar via Bearer token no header (mobile/manual signup)
  if (!user) {
    const authHeader = request.headers.get('authorization') ?? ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (token) {
      const { data: { user: tokenUser } } = await admin.auth.getUser(token)
      user = tokenUser
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { nome, telefone, cep, bairro, cidade, uf, aceitouTermos, aceitouPrivacidade } = body

  if (!nome || !telefone || !cep || !aceitouTermos || !aceitouPrivacidade) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  // Verifica duplicidade de telefone (exclui o próprio usuário)
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

  // Geocodifica CEP → lat/lng (fire-and-forget, não bloqueia a resposta)
  if (cep) {
    geocodeCep(cep).then(coords => {
      if (!coords) return
      admin.from('profiles').update({ lat: coords.lat, lng: coords.lng }).eq('id', user!.id)
        .then(({ error }) => { if (error) console.error('[save-profile] geocode update:', error.message) })
    }).catch(e => console.error('[save-profile] geocodeCep:', e))
  }

  // Email de boas-vindas (fire-and-forget, não bloqueia a resposta)
  const userEmail = (await admin.auth.admin.getUserById(user.id)).data?.user?.email
  if (userEmail) {
    sendBoasVindasEmail({ to: userEmail, nome }).catch(e =>
      console.error('[save-profile] email boas-vindas:', e)
    )
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
