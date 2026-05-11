import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PLANOS = {
  mensal: { amount: 199,  description: 'Completando PRO — Mensal', meses: 1  },
  anual:  { amount: 1499, description: 'Completando PRO — Anual',  meses: 12 },
} as const

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { plano } = await request.json() as { plano: string }
  if (!plano || !(plano in PLANOS)) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  }

  const p = PLANOS[plano as keyof typeof PLANOS]

  // Busca nome do perfil
  const sb = createAdminClient()
  const { data: profile } = await sb.from('profiles').select('nome').eq('id', user.id).single()
  const nome = profile?.nome || user.email?.split('@')[0] || 'Usuário'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'
  const apiKey = process.env.PAGARME_API_KEY
  if (!apiKey) {
    console.error('[checkout] PAGARME_API_KEY não definida')
    return NextResponse.json({ error: 'Configuração de pagamento ausente' }, { status: 500 })
  }
  console.log('[checkout] key prefix:', apiKey.slice(0, 10))
  const auth   = Buffer.from(`${apiKey}:`).toString('base64')

  const body = {
    customer: {
      name:  nome,
      email: user.email,
      type:  'individual',
    },
    items: [{
      amount:      p.amount,
      description: p.description,
      quantity:    1,
      code:        `plano-${plano}`,
    }],
    metadata: {
      user_id: user.id,
      plano,
    },
    payments: [{
      payment_method: 'checkout',
      checkout: {
        expires_in:               120,
        billing_address_editable: false,
        customer_editable:        false,
        accepted_payment_methods: ['credit_card', 'pix', 'boleto'],
        pix: { expires_in: 1440 },
        boleto: { instructions: 'Pague este boleto para ativar seu plano PRO no Completando.', due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
        success_url: `${appUrl}/pagamento/sucesso?plano=${plano}`,
      },
    }],
  }

  const res = await fetch('https://api.pagar.me/core/v5/orders', {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('[checkout] pagar.me error status:', res.status, 'body:', JSON.stringify(data))
    return NextResponse.json({ error: data.message ?? 'Erro ao criar checkout' }, { status: 502 })
  }

  // Pagar.me v5: URL do checkout fica em checkouts[0].payment_url
  const url = data?.checkouts?.[0]?.payment_url as string | undefined
  if (!url) {
    console.error('[checkout] no url in response:', JSON.stringify(data))
    return NextResponse.json({ error: 'URL de checkout não encontrada' }, { status: 502 })
  }

  return NextResponse.json({ url })
}
