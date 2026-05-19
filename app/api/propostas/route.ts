import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPropostaEmail } from '@/lib/email'
import { pushNovaPropostas } from '@/lib/push'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const { para_user_id, album_id, eu_ofereco, eu_recebo, tipo, valor_total, valor_original } = body

  if (!para_user_id || !album_id || !eu_ofereco || !eu_recebo || !tipo) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  // Compra exige valor_total > 0 e stickers selecionados
  if (tipo === 'compra') {
    const vt = typeof valor_total === 'number' ? valor_total : parseFloat(valor_total ?? '0')
    if (!vt || vt <= 0 || vt > 99999) {
      return NextResponse.json({ error: 'Valor total inválido' }, { status: 400 })
    }
    if (!Array.isArray(eu_recebo) || eu_recebo.length === 0) {
      return NextResponse.json({ error: 'Selecione ao menos uma figurinha' }, { status: 400 })
    }
  }

  if (user.id === para_user_id) {
    return NextResponse.json({ error: 'Não é possível enviar proposta para si mesmo' }, { status: 400 })
  }

  const sb = createAdminClient()

  // Verifica limite de propostas para usuários free (máx 3 pendentes)
  const { data: perfil } = await sb
    .from('profiles')
    .select('plano, plano_expira_em')
    .eq('id', user.id)
    .single()

  const isPro = perfil?.plano === 'pro' &&
    perfil?.plano_expira_em &&
    new Date(perfil.plano_expira_em) > new Date()

  if (!isPro) {
    const { count } = await sb
      .from('propostas')
      .select('*', { count: 'exact', head: true })
      .eq('de_user_id', user.id)
      .eq('status', 'pendente')

    if ((count ?? 0) >= 1) {
      return NextResponse.json({ error: 'LIMITE_FREE' }, { status: 403 })
    }
  }

  // Bloqueia spam
  const { data: existente } = await sb
    .from('propostas')
    .select('id')
    .eq('de_user_id', user.id)
    .eq('para_user_id', para_user_id)
    .eq('album_id', album_id)
    .eq('tipo', tipo)
    .eq('status', 'pendente')
    .limit(1)

  if (existente && existente.length > 0) {
    return NextResponse.json({ error: 'JA_ENVIADA' }, { status: 409 })
  }

  // Cria a proposta
  const vt = tipo === 'compra'
    ? (typeof valor_total === 'number' ? valor_total : parseFloat(valor_total ?? '0'))
    : null
  const vo = tipo === 'compra' && valor_original != null
    ? (typeof valor_original === 'number' ? valor_original : parseFloat(valor_original ?? '0'))
    : null
  const { error } = await sb.from('propostas').insert({
    de_user_id:     user.id,
    para_user_id,
    album_id,
    eu_ofereco,
    eu_recebo,
    tipo,
    valor_total:    vt,
    valor_original: vo,
    status: 'pendente',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Email de notificação para o destinatário (fire-and-forget)
  const [{ data: destProfile }, { data: deProfile }] = await Promise.all([
    sb.from('profiles').select('nome, email').eq('id', para_user_id).single(),
    sb.from('profiles').select('nome').eq('id', user.id).single(),
  ])

  if (destProfile?.email) {
    sendPropostaEmail({
      to:         destProfile.email,
      userName:   destProfile.nome  ?? 'Usuário',
      remetente:  deProfile?.nome   ?? 'Alguém',
      qtdOferece: (eu_ofereco as number[]).length,
      qtdPede:    (eu_recebo  as number[]).length,
    }).catch(e => console.error('[api/propostas] email:', e))
  }

  // Push notification (fire-and-forget)
  pushNovaPropostas(para_user_id, deProfile?.nome ?? 'Alguém')
    .catch(e => console.error('[api/propostas] push:', e))

  return NextResponse.json({ ok: true })
}
