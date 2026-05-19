import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { pushPropostaAceita, pushPropostaRecusada } from '@/lib/push'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { status } = await request.json() as { status: 'aceita' | 'recusada' }
  if (status !== 'aceita' && status !== 'recusada') {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const sb = createAdminClient()

  // Busca proposta — qualquer parte pode aceitar/recusar quando tem contra-proposta
  const { data: proposta, error: errBusca } = await sb
    .from('propostas')
    .select('id, de_user_id, para_user_id, status, contra_feita_por')
    .eq('id', id)
    .eq('status', 'pendente')
    .single()

  if (errBusca || !proposta) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  // para_user_id pode sempre aceitar/recusar
  // de_user_id só pode quando recebeu uma contra-proposta do para_user_id
  const isPara = proposta.para_user_id === user.id
  const isDe   = proposta.de_user_id   === user.id && !!proposta.contra_feita_por

  if (!isPara && !isDe) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Atualiza status
  const { error } = await sb
    .from('propostas')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Busca nome de quem está respondendo (para o push)
  const { data: respProfile } = await sb
    .from('profiles')
    .select('nome')
    .eq('id', user.id)
    .single()

  const nomeResp = respProfile?.nome ?? 'Alguém'

  // Notifica a contraparte
  const contraparteId = proposta.de_user_id === user.id
    ? proposta.para_user_id
    : proposta.de_user_id

  if (status === 'aceita') {
    pushPropostaAceita(contraparteId, nomeResp)
      .catch(e => console.error('[propostas/patch] push aceita:', e))
  } else {
    pushPropostaRecusada(contraparteId, nomeResp)
      .catch(e => console.error('[propostas/patch] push recusada:', e))
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createAdminClient()

  // Só pode apagar se for o remetente ou destinatário
  const { error } = await sb
    .from('propostas')
    .delete()
    .eq('id', id)
    .or(`de_user_id.eq.${user.id},para_user_id.eq.${user.id}`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
