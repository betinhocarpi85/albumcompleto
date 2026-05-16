import { createAdminClient } from '@/lib/supabase/admin'

const APP_ID  = 'dadf445f-31b6-464b-b829-818baaf9f850'
const API_KEY = process.env.ONESIGNAL_API_KEY ?? ''

const COOLDOWN_PROPOSTA_MS = 60 * 60 * 1000      // 1 hora
const COOLDOWN_MATCH_MS    = 4 * 60 * 60 * 1000  // 4 horas

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
  }).catch(e => console.error('[push] erro:', e))
}

// ─── Cooldown helpers ─────────────────────────────────────────────────────────

type CooldownColumn = 'notif_push_last_at' | 'notif_match_last_at'

async function checkCooldown(userId: string, col: CooldownColumn, ms: number): Promise<boolean> {
  const sb = createAdminClient()
  const { data } = await sb.from('profiles').select(col).eq('id', userId).single()
  const last = (data as Record<string, string | null> | null)?.[col] ?? null
  if (last && Date.now() - new Date(last).getTime() < ms) return false // em cooldown

  await sb.from('profiles').update({ [col]: new Date().toISOString() }).eq('id', userId)
  return true
}

// ─── Eventos ─────────────────────────────────────────────────────────────────

/** Nova proposta recebida — cooldown 1h */
export async function pushNovaPropostas(userId: string, remetente: string) {
  const pode = await checkCooldown(userId, 'notif_push_last_at', COOLDOWN_PROPOSTA_MS)
  if (!pode) return
  return sendPush({
    userId,
    title: '📩 Nova proposta de troca!',
    body:  `${remetente} te enviou uma proposta. Veja agora!`,
    url:   'https://completando.com.br/conta?s=propostas',
  })
}

/** Proposta aceita — sempre envia */
export async function pushPropostaAceita(userId: string, quemAceitou: string) {
  return sendPush({
    userId,
    title: '✅ Proposta aceita!',
    body:  `${quemAceitou} aceitou sua proposta. Combine a troca agora!`,
    url:   'https://completando.com.br/conta?s=propostas',
  })
}

/** Proposta recusada — sempre envia */
export async function pushPropostaRecusada(userId: string, quemRecusou: string) {
  return sendPush({
    userId,
    title: '❌ Proposta recusada',
    body:  `${quemRecusou} recusou sua proposta. Tente outro match!`,
    url:   'https://completando.com.br/matches',
  })
}

/** Novo match — cooldown 4h, agrupa múltiplos em 1 push */
export async function pushNovoMatch(userId: string, qtd: number) {
  const pode = await checkCooldown(userId, 'notif_match_last_at', COOLDOWN_MATCH_MS)
  if (!pode) return
  return sendPush({
    userId,
    title: '🤝 Você tem novos matches!',
    body:  qtd === 1
      ? 'Um colecionador tem as figurinhas que você precisa. Veja agora!'
      : `${qtd} colecionadores têm figurinhas que você precisa. Veja agora!`,
    url:   'https://completando.com.br/matches',
  })
}
