import { createAdminClient } from '@/lib/supabase/admin'

const APP_ID  = 'dadf445f-31b6-464b-b829-818baaf9f850'
const API_KEY = process.env.ONESIGNAL_API_KEY ?? ''

const COOLDOWN_NOVA_PROPOSTA_MS = 10 * 60 * 1000 // 10 minutos

interface PushPayload {
  userId: string
  title:  string
  body:   string
  url?:   string
}

async function sendPush({ userId, title, body, url }: PushPayload) {
  if (!API_KEY) {
    console.warn('[push] ONESIGNAL_API_KEY não configurada')
    return
  }

  await fetch('https://onesignal.com/api/v1/notifications', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Key ${API_KEY}`,
    },
    body: JSON.stringify({
      app_id:           APP_ID,
      include_aliases:  { external_id: [userId] },
      target_channel:   'push',
      headings:         { en: title, pt: title },
      contents:         { en: body,  pt: body  },
      url:              url ?? 'https://completando.com.br/conta?s=propostas',
      chrome_web_icon:  'https://completando.com.br/icon.png',
      firefox_icon:     'https://completando.com.br/icon.png',
    }),
  }).catch(e => console.error('[push] erro ao enviar:', e))
}

// ─── Cooldown: verifica e atualiza notif_push_last_at ────────────────────────

async function checkAndSetCooldown(userId: string): Promise<boolean> {
  const sb = createAdminClient()
  const { data } = await sb
    .from('profiles')
    .select('notif_push_last_at')
    .eq('id', userId)
    .single()

  const last = data?.notif_push_last_at as string | null
  if (last && Date.now() - new Date(last).getTime() < COOLDOWN_NOVA_PROPOSTA_MS) {
    return false // ainda em cooldown, não envia
  }

  // Atualiza o timestamp
  await sb
    .from('profiles')
    .update({ notif_push_last_at: new Date().toISOString() })
    .eq('id', userId)

  return true // pode enviar
}

// ─── Eventos públicos ─────────────────────────────────────────────────────────

/** Nova proposta recebida — com cooldown de 10 min */
export async function pushNovaPropostas(userId: string, remetente: string) {
  const pode = await checkAndSetCooldown(userId)
  if (!pode) return // silencioso — usuário já foi notificado recentemente

  return sendPush({
    userId,
    title: '📩 Nova proposta de troca!',
    body:  `${remetente} te enviou uma proposta. Veja agora!`,
    url:   'https://completando.com.br/conta?s=propostas',
  })
}

/** Proposta aceita — sempre envia (usuário quer saber) */
export async function pushPropostaAceita(userId: string, quemAceitou: string) {
  return sendPush({
    userId,
    title: '✅ Proposta aceita!',
    body:  `${quemAceitou} aceitou sua proposta. Combine a troca agora!`,
    url:   'https://completando.com.br/conta?s=propostas',
  })
}

/** Proposta recusada — sempre envia (usuário quer saber) */
export async function pushPropostaRecusada(userId: string, quemRecusou: string) {
  return sendPush({
    userId,
    title: '❌ Proposta recusada',
    body:  `${quemRecusou} recusou sua proposta. Tente outro match!`,
    url:   'https://completando.com.br/matches',
  })
}

/** Novo match — com cooldown de 10 min */
export async function pushNovoMatch(userId: string, qtd: number) {
  const pode = await checkAndSetCooldown(userId)
  if (!pode) return

  return sendPush({
    userId,
    title: '🤝 Você tem novos matches!',
    body:  `${qtd} colecionador${qtd > 1 ? 'es têm' : ' tem'} as figurinhas que você precisa!`,
    url:   'https://completando.com.br/matches',
  })
}
