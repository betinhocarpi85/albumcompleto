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

  // Busca proposta — garante que o usuário é o destinatário
  const { data: proposta, error: errBusca } = await sb
    .from('propostas')
    .select('id, de_user_id, para_user_id, status')
    .eq('id', id)
    .eq('para_user_id', user.id) // só quem recebeu pode aceitar/recusar
    .eq('status', 'pendente')
    .single()

  if (errBusca || !proposta) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
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

  // Push para quem enviou a proposta (fire-and-forget, sem cooldown pois é evento pontual)
  if (status === 'aceita') {
    pushPropostaAceita(proposta.de_user_id, nomeResp)
      .catch(e => console.error('[propostas/patch] push aceita:', e))
  } else {
    pushPropostaRecusada(proposta.de_user_id, nomeResp)
      .catch(e => console.error('[propostas/patch] push recusada:', e))
  }

  return NextResponse.json({ ok: true })
}
