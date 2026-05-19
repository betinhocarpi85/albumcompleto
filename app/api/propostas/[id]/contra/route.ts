import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  // Busca proposta — confirma que caller é o destinatário e proposta está pendente
  const { data: proposta, error: errBusca } = await sb
    .from('propostas')
    .select('id, de_user_id, para_user_id, status, contra_feita_por')
    .eq('id', id)
    .eq('para_user_id', user.id)
    .eq('status', 'pendente')
    .single()

  if (errBusca || !proposta) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  if (proposta.contra_feita_por) {
    return NextResponse.json({ error: 'Contra-proposta já enviada' }, { status: 409 })
  }

  const { error } = await sb
    .from('propostas')
    .update({
      contra_eu_ofereco: eu_ofereco,
      contra_eu_recebo:  eu_recebo,
      contra_feita_por:  user.id,
      updated_at:        new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[propostas/contra] update error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
