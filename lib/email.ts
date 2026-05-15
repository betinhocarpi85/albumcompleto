/**
 * Email transacional via Resend
 * Docs: https://resend.com/docs
 *
 * Variável necessária: RESEND_API_KEY
 * Domínio remetente:   RESEND_FROM  (ex: "Completando <noreply@completando.com.br>")
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const RESEND_FROM    = process.env.RESEND_FROM    ?? 'Completando <noreply@completando.com.br>'
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completando.com.br'

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY não configurada — email não enviado:', subject)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[email] erro ao enviar:', err)
  }
}

// ── Templates ──────────────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Completando</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e293b,#166534);padding:28px 32px;text-align:center;">
            <p style="margin:0;color:#4ade80;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;">completando.com.br</p>
            <p style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:700;">🏆 Completando</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f1f5f9;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              Você recebeu este email porque está cadastrado no Completando.<br>
              <a href="${APP_URL}/conta" style="color:#22c55e;">Gerenciar preferências</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Match encontrado ──────────────────────────────────────────────────────────

export async function sendMatchEmail(opts: {
  to:           string
  userName:     string
  matchName:    string
  matchCidade:  string
  qtdTroca:     number
  qtdVenda:     number
}): Promise<void> {
  const { to, userName, matchName, matchCidade, qtdTroca, qtdVenda } = opts

  const lines: string[] = []
  if (qtdTroca > 0) lines.push(`<li><strong>${qtdTroca}</strong> figurinha${qtdTroca > 1 ? 's' : ''} para <strong>troca</strong></li>`)
  if (qtdVenda > 0) lines.push(`<li><strong>${qtdVenda}</strong> figurinha${qtdVenda > 1 ? 's' : ''} à <strong>venda</strong></li>`)

  const html = baseTemplate(`
    <p style="margin:0 0 8px;font-size:22px;text-align:center;">🎉</p>
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e293b;text-align:center;">Você tem um match!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center;">
      Olá, <strong>${userName}</strong>! Encontramos alguém que tem o que você precisa.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#15803d;">${matchName}</p>
      <p style="margin:0 0 12px;font-size:13px;color:#64748b;">📍 ${matchCidade || 'Localização não informada'}</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#166534;">
        ${lines.join('')}
      </ul>
    </div>
    <div style="text-align:center;">
      <a href="${APP_URL}/matches" style="display:inline-block;background:#22c55e;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
        Ver meus matches →
      </a>
    </div>
  `)

  await sendEmail(to, '🎉 Você tem um match no Completando!', html)
}

// ── Proposta recebida ─────────────────────────────────────────────────────────

export async function sendPropostaEmail(opts: {
  to:           string
  userName:     string
  remetente:    string
  qtdOferece:   number
  qtdPede:      number
}): Promise<void> {
  const { to, userName, remetente, qtdOferece, qtdPede } = opts

  const html = baseTemplate(`
    <p style="margin:0 0 8px;font-size:22px;text-align:center;">🔁</p>
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e293b;text-align:center;">Nova proposta de troca!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center;">
      Olá, <strong>${userName}</strong>! <strong>${remetente}</strong> enviou uma proposta para você.
    </p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align:center;padding:8px;">
            <p style="margin:0;font-size:28px;font-weight:800;color:#1d4ed8;">${qtdOferece}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b;">figurinha${qtdOferece > 1 ? 's' : ''} que ele oferece</p>
          </td>
          <td style="text-align:center;color:#94a3b8;font-size:20px;">⇄</td>
          <td style="text-align:center;padding:8px;">
            <p style="margin:0;font-size:28px;font-weight:800;color:#1d4ed8;">${qtdPede}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b;">figurinha${qtdPede > 1 ? 's' : ''} que ele pede</p>
          </td>
        </tr>
      </table>
    </div>
    <p style="margin:0 0 20px;font-size:13px;color:#64748b;text-align:center;">
      Aceite ou recuse a proposta diretamente no app.
    </p>
    <div style="text-align:center;">
      <a href="${APP_URL}/propostas" style="display:inline-block;background:#3b82f6;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
        Ver proposta →
      </a>
    </div>
  `)

  await sendEmail(to, `🔁 ${remetente} enviou uma proposta de troca!`, html)
}

// ── Boas-vindas ───────────────────────────────────────────────────────────────

export async function sendBoasVindasEmail(opts: {
  to:   string
  nome: string
}): Promise<void> {
  const { to, nome } = opts

  const html = baseTemplate(`
    <p style="margin:0 0 8px;font-size:22px;text-align:center;">👋</p>
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e293b;text-align:center;">Bem-vindo ao Completando!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center;">
      Olá, <strong>${nome}</strong>! Sua conta foi criada com sucesso.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#15803d;">Como começar:</p>
      <ol style="margin:0;padding-left:20px;font-size:14px;color:#166534;line-height:1.8;">
        <li>Monte seu álbum marcando as figurinhas que você tem</li>
        <li>Anuncie suas repetidas para troca ou venda</li>
        <li>Receba matches automáticos com quem tem o que você precisa</li>
        <li>Combine o encontro e complete seu álbum!</li>
      </ol>
    </div>
    <div style="text-align:center;">
      <a href="${APP_URL}/album" style="display:inline-block;background:#22c55e;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
        Montar meu álbum →
      </a>
    </div>
  `)

  await sendEmail(to, '👋 Bem-vindo ao Completando!', html)
}

// ── Pagamento confirmado ──────────────────────────────────────────────────────

export async function sendPagamentoEmail(opts: {
  to:     string
  nome:   string
  plano:  string
  expira: Date
}): Promise<void> {
  const { to, nome, plano, expira } = opts
  const planoLabel = plano === 'anual' ? 'Anual' : 'Mensal'
  const expiraStr  = expira.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const html = baseTemplate(`
    <p style="margin:0 0 8px;font-size:22px;text-align:center;">⭐</p>
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e293b;text-align:center;">Assinatura PRO ativada!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center;">
      Olá, <strong>${nome}</strong>! Seu pagamento foi confirmado.
    </p>
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#92400e;">Plano <strong>PRO ${planoLabel}</strong></p>
      <p style="margin:8px 0 0;font-size:13px;color:#92400e;">Válido até <strong>${expiraStr}</strong></p>
    </div>
    <div style="text-align:center;">
      <a href="${APP_URL}/matches" style="display:inline-block;background:#22c55e;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
        Ver meus matches PRO →
      </a>
    </div>
  `)

  await sendEmail(to, '⭐ Assinatura PRO ativada com sucesso!', html)
}
