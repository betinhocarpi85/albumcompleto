const APP_ID  = 'dadf445f-31b6-464b-b829-818baaf9f850'
const API_KEY = process.env.ONESIGNAL_API_KEY ?? ''

interface PushPayload {
  userId: string   // Supabase user ID (external_id no OneSignal)
  title:  string
  body:   string
  url?:   string
  icon?:  string
}

export async function sendPush({ userId, title, body, url, icon }: PushPayload) {
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
      url:              url  ?? 'https://completando.com.br/conta?s=propostas',
      chrome_web_icon:  icon ?? 'https://completando.com.br/icon.png',
      firefox_icon:     icon ?? 'https://completando.com.br/icon.png',
    }),
  }).catch(e => console.error('[push] erro ao enviar:', e))
}

// ─── Helpers prontos para usar ────────────────────────────────────────────────

export async function pushNovaPropostas(userId: string, remetente: string) {
  return sendPush({
    userId,
    title: '📩 Nova proposta de troca!',
    body:  `${remetente} te enviou uma proposta de troca. Veja agora!`,
    url:   'https://completando.com.br/conta?s=propostas',
  })
}

export async function pushPropostaAceita(userId: string, remetente: string) {
  return sendPush({
    userId,
    title: '✅ Proposta aceita!',
    body:  `${remetente} aceitou sua proposta. Combine a troca agora!`,
    url:   'https://completando.com.br/conta?s=propostas',
  })
}

export async function pushPropostaRecusada(userId: string, remetente: string) {
  return sendPush({
    userId,
    title: '❌ Proposta recusada',
    body:  `${remetente} recusou sua proposta. Tente outro match!`,
    url:   'https://completando.com.br/matches',
  })
}

export async function pushNovoMatch(userId: string, qtd: number) {
  return sendPush({
    userId,
    title: '🤝 Você tem novos matches!',
    body:  `${qtd} colecionador${qtd > 1 ? 'es têm' : ' tem'} as figurinhas que você precisa. Veja agora!`,
    url:   'https://completando.com.br/matches',
  })
}
