import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { pushContraProposta } from '@/lib/push'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: { eu_ofereco: number[]; eu_recebo: number[] } | null = null
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { eu_ofereco, eu_recebo } = body!

  if (!Array.isArray(eu_ofereco) || !Array.isArray(eu_recebo)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }
  if (eu_ofereco.length === 0 && eu_recebo.length === 0) {
    return NextResponse.json({ error: 'Contra-proposta não pode ser vazia' }, { status: 400 })
  }

  const sb = createAdminClient()

  const { data: proposta, error: errBusca } = await sb
    .from('propostas')
    .select('id, de_user_id, para_user_id, status, contra_feita_por, contra2_feita_por')
    .eq('id', id)
    .eq('status', 'pendente')
    .single()

  if (errBusca || !proposta) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  // Rodada 1: para_user_id faz contra (proposta ainda sem contra)
  if (user.id === proposta.para_user_id && !proposta.contra_feita_por) {
    const { error } = await sb.from('propostas').update({
      contra_eu_ofereco: eu_ofereco,
      contra_eu_recebo:  eu_recebo,
      contra_feita_por:  user.id,
      updated_at:        new Date().toISOString(),
    }).eq('id', id)

    if (error) {
      console.error('[propostas/contra] round1 error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Notifica o remetente original (de_user_id) que recebeu uma contra-proposta
    const { data: perfil } = await sb.from('profiles').select('nome').eq('id', user.id).single()
    pushContraProposta(proposta.de_user_id, perfil?.nome ?? 'Alguém')
      .catch(e => console.error('[propostas/contra] push round1:', e))

    return NextResponse.json({ ok: true, round: 1 })
  }

  // Rodada 2: de_user_id faz contra (já existe contra do para_user_id, ainda sem contra2)
  if (user.id === proposta.de_user_id && proposta.contra_feita_por && !proposta.contra2_feita_por) {
    const { error } = await sb.from('propostas').update({
      contra2_eu_ofereco: eu_ofereco,
      contra2_eu_recebo:  eu_recebo,
      contra2_feita_por:  user.id,
      updated_at:         new Date().toISOString(),
    }).eq('id', id)

    if (error) {
      console.error('[propostas/contra] round2 error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Notifica o destinatário (para_user_id) que recebeu a contra-proposta da rodada 2
    const { data: perfil } = await sb.from('profiles').select('nome').eq('id', user.id).single()
    pushContraProposta(proposta.para_user_id, perfil?.nome ?? 'Alguém')
      .catch(e => console.error('[propostas/contra] push round2:', e))

    return NextResponse.json({ ok: true, round: 2 })
  }

  return NextResponse.json({ error: 'Sem permissão ou limite de contra-propostas atingido' }, { status: 403 })
}
