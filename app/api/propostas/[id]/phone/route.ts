import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verifica autenticação server-side (sem depender de auth.uid() no SQL)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createAdminClient()

  // Busca a proposta
  const { data: proposta } = await sb
    .from('propostas')
    .select('de_user_id, para_user_id, status')
    .eq('id', id)
    .single()

  if (!proposta) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })

  // Só revela se aceita e o caller é parte da proposta
  if (proposta.status !== 'aceita') {
    return NextResponse.json({ error: 'Proposta não aceita' }, { status: 403 })
  }
  if (user.id !== proposta.de_user_id && user.id !== proposta.para_user_id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Telefone da contraparte
  const otherId = user.id === proposta.de_user_id ? proposta.para_user_id : proposta.de_user_id
  const { data: profile } = await sb
    .from('profiles')
    .select('telefone')
    .eq('id', otherId)
    .single()

  return NextResponse.json({ telefone: profile?.telefone ?? null })
}
