import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'

const PLANOS = {
  mensal: { amount: 199,  description: 'Completando PRO — Mensal', meses: 1  },
  anual:  { amount: 1499, description: 'Completando PRO — Anual',  meses: 12 },
} as const

const PIX_EXPIRA_SEG = 3600

function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false
  const dv = (len: number) => {
    let soma = 0
    for (let i = 0; i < len; i++) soma += Number(cpf[i]) * (len + 1 - i)
    const r = (soma * 10) % 11
    return r === 10 ? 0 : r
  }
  return dv(9) === Number(cpf[9]) && dv(10) === Number(cpf[10])
}

// Aceita "(11) 91234-5678", "+55 11 912345678" etc.
function parseTelefone(tel: string): { area_code: string; number: string } | null {
  let d = tel.replace(/\D/g, '')
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2)
  if (d.length !== 10 && d.length !== 11) return null
  return { area_code: d.slice(0, 2), number: d.slice(2) }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  if (!await checkRateLimit(`checkout:${user.id}`, 3, 60)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 })
  }

  const body = await request.json() as { plano?: string; cpf?: string; telefone?: string }
  const plano = body.plano
  if (!plano || !(plano in PLANOS)) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  }
  const p = PLANOS[plano as keyof typeof PLANOS]

  const sb = createAdminClient()
  const { data: profile } = await sb
    .from('profiles')
    .select('nome, cpf, telefone')
    .eq('id', user.id)
    .single()

  const cpf      = (body.cpf ?? profile?.cpf ?? '').replace(/\D/g, '')
  const telefone = body.telefone ?? profile?.telefone ?? ''
  const fone     = parseTelefone(telefone)

  if (!cpfValido(cpf) || !fone) {
    return NextResponse.json({
      error:        'DADOS_PIX',
      faltaCpf:      !cpfValido(cpf),
      faltaTelefone: !fone,
    }, { status: 400 })
  }

  // CPF fica salvo para não pedir de novo. Telefone não: o perfil tem checagem de unicidade própria.
  if (body.cpf && cpf !== profile?.cpf) await sb.from('profiles').update({ cpf }).eq('id', user.id)

  const apiKey = process.env.PAGARME_API_KEY
  if (!apiKey) {
    console.error('[checkout] PAGARME_API_KEY não definida')
    return NextResponse.json({ error: 'Configuração de pagamento ausente' }, { status: 500 })
  }

  const nome = profile?.nome || user.email?.split('@')[0] || 'Usuário'

  const res = await fetch('https://api.pagar.me/core/v5/orders', {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer: {
        name:          nome,
        email:         user.email,
        type:          'individual',
        document:      cpf,
        document_type: 'CPF',
        phones: { mobile_phone: { country_code: '55', ...fone } },
      },
      items: [{ amount: p.amount, description: p.description, quantity: 1, code: `plano-${plano}` }],
      metadata: { user_id: user.id, plano },
      payments: [{ payment_method: 'pix', pix: { expires_in: PIX_EXPIRA_SEG } }],
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('[checkout] pagar.me error status:', res.status, 'body:', JSON.stringify(data))
    return NextResponse.json({ error: data.message ?? 'Erro ao criar pagamento' }, { status: 502 })
  }

  const tx = data?.charges?.[0]?.last_transaction
  if (!tx?.qr_code) {
    console.error('[checkout] pix sem qr_code:', JSON.stringify(data))
    const motivo = tx?.gateway_response?.errors?.[0]?.message
    return NextResponse.json({ error: motivo ?? 'Não foi possível gerar o Pix. Tente novamente.' }, { status: 502 })
  }

  return NextResponse.json({
    pix: {
      codigo:   tx.qr_code as string,
      qrUrl:    tx.qr_code_url as string,
      expiraEm: (tx.expires_at as string) ?? new Date(Date.now() + PIX_EXPIRA_SEG * 1000).toISOString(),
      valor:    p.amount,
    },
  })
}
