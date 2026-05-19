import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('id')
  if (!userId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = createAdminClient()

  const [profileRes, avalRes] = await Promise.all([
    sb.from('profiles').select('nome, bairro, cidade, uf').eq('id', userId).single(),
    // Filtra apenas avaliações deste usuário — evita carregar tabela inteira
    sb.from('avaliacoes')
      .select('proposta_id, de_user_id, para_user_id, nota')
      .or(`de_user_id.eq.${userId},para_user_id.eq.${userId}`),
  ])

  const p = profileRes.data

  // Trocas confirmadas = propostas com 2 avaliações envolvendo este usuário
  const allAval = avalRes.data ?? []
  const countByProposta = new Map<string, number>()
  for (const a of allAval) {
    countByProposta.set(a.proposta_id, (countByProposta.get(a.proposta_id) ?? 0) + 1)
  }
  const tradeCount = [...countByProposta.values()].filter(n => n >= 2).length

  // Rating médio (avaliações recebidas)
  const received = allAval.filter(a => a.para_user_id === userId)
  const ratingMedia = received.length > 0
    ? received.reduce((s, r) => s + r.nota, 0) / received.length
    : null

  return NextResponse.json({
    nome:        p?.nome ?? 'Usuário',
    localidade:  [p?.bairro, p?.cidade, p?.uf].filter(Boolean).join(', '),
    tradeCount,
    ratingMedia,
    ratingCount: received.length,
  })
}
