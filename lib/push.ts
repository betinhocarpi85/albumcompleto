import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  ?? ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? ''
const VAPID_EMAIL   = process.env.VAPID_EMAIL       ?? 'mailto:contato@completando.com.br'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)
}

const COOLDOWN_PROPOSTA_MS = 60 * 60 * 1000      // 1 hora
const COOLDOWN_MATCH_MS    = 4 * 60 * 60 * 1000  // 4 horas

interface PushPayload { title: string; body: string; url?: string }

async function sendToUser(userId: string, payload: PushPayload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn('[push] VAPID keys não configuradas')
    return
  }
  const sb = createAdminClient()
  const { data: subs } = await sb
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs?.length) return

  const notification = JSON.stringify({
    title: payload.title,
    body:  payload.body,
    url:   payload.url ?? 'https://completando.com.br/conta?s=propostas',
    icon:  'https://completando.com.br/icon.png',
  })

  await Promise.allSettled(
    subs.map(s =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        notification
      ).catch(async err => {
        // Remove subscription inválida (410 = expirou)
        if (err.statusCode === 410) {
          await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        }
      })
    )
  )
}

// ─── Cooldown helpers ─────────────────────────────────────────────────────────

type CooldownCol = 'notif_push_last_at' | 'notif_match_last_at'

async function checkCooldown(userId: string, col: CooldownCol, ms: number): Promise<boolean> {
  const sb = createAdminClient()
  const { data } = await sb.from('profiles').select(col).eq('id', userId).single()
  const last = (data as Record<string, string | null> | null)?.[col] ?? null
  if (last && Date.now() - new Date(last).getTime() < ms) return false
  await sb.from('profiles').update({ [col]: new Date().toISOString() }).eq('id', userId)
  return true
}

// ─── Eventos ─────────────────────────────────────────────────────────────────

export async function pushNovaPropostas(userId: string, remetente: string) {
  const pode = await checkCooldown(userId, 'notif_push_last_at', COOLDOWN_PROPOSTA_MS)
  if (!pode) return
  return sendToUser(userId, {
    title: '📩 Nova proposta de troca!',
    body:  `${remetente} te enviou uma proposta. Veja agora!`,
    url:   'https://completando.com.br/conta?s=propostas',
  })
}

export async function pushPropostaAceita(userId: string, quemAceitou: string) {
  return sendToUser(userId, {
    title: '✅ Proposta aceita!',
    body:  `${quemAceitou} aceitou sua proposta. Combine a troca agora!`,
    url:   'https://completando.com.br/conta?s=propostas',
  })
}

export async function pushPropostaRecusada(userId: string, quemRecusou: string) {
  return sendToUser(userId, {
    title: '❌ Proposta recusada',
    body:  `${quemRecusou} recusou sua proposta. Tente outro match!`,
    url:   'https://completando.com.br/matches',
  })
}

export async function pushContraProposta(userId: string, quemFez: string) {
  return sendToUser(userId, {
    title: '🔄 Nova contra-proposta!',
    body:  `${quemFez} fez uma contra-proposta. Veja e responda!`,
    url:   'https://completando.com.br/propostas',
  })
}

export async function pushNovoMatch(userId: string, qtd: number) {
  const pode = await checkCooldown(userId, 'notif_match_last_at', COOLDOWN_MATCH_MS)
  if (!pode) return
  return sendToUser(userId, {
    title: '🤝 Você tem novos matches!',
    body:  qtd === 1
      ? 'Um colecionador tem as figurinhas que você precisa!'
      : `${qtd} colecionadores têm figurinhas que você precisa!`,
    url:   'https://completando.com.br/matches',
  })
}
