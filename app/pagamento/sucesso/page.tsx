'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { dbGetPlano } from '@/lib/db'

type Estado = 'aguardando' | 'confirmado' | 'timeout'

function SucessoInner() {
  const searchParams = useSearchParams()
  const plano = searchParams.get('plano') ?? 'mensal'
  const [estado, setEstado] = useState<Estado>('aguardando')
  const [tentativas, setTentativas] = useState(0)
  const [segundos, setSegundos] = useState(5)

  // Polling: verifica se o plano foi ativado no banco
  useEffect(() => {
    let cancelado = false
    const MAX = 12 // até ~24s (12 × 2s)

    async function verificar() {
      if (cancelado) return
      const { plano: p } = await dbGetPlano()
      if (p === 'pro') {
        setEstado('confirmado')
        return
      }
      setTentativas(t => {
        const prox = t + 1
        if (prox >= MAX) {
          setEstado('timeout')
          return prox
        }
        setTimeout(verificar, 2000)
        return prox
      })
    }

    // Primeira verificação após 2s (tempo para o webhook chegar)
    const timer = setTimeout(verificar, 2000)
    return () => { cancelado = true; clearTimeout(timer) }
  }, [])

  // Countdown de redirecionamento após confirmação
  useEffect(() => {
    if (estado !== 'confirmado') return
    const iv = setInterval(() => {
      setSegundos(s => {
        if (s <= 1) { clearInterval(iv); window.location.href = '/matches' }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [estado])

  /* ── Aguardando webhook ── */
  if (estado === 'aguardando') return (
    <div className="max-w-md mx-auto px-4 py-16 text-center animate-fadein">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin inline-block" />
      </div>
      <h1 className="text-xl font-black text-slate-800 mb-2">Confirmando pagamento…</h1>
      <p className="text-slate-500 text-sm">
        Aguardando confirmação do Pagar.me. Isso leva alguns segundos.
      </p>
      <div className="mt-6 flex justify-center gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={['w-2 h-2 rounded-full transition-colors',
            i < tentativas ? 'bg-green-500' : 'bg-slate-200'].join(' ')} />
        ))}
      </div>
    </div>
  )

  /* ── Timeout: webhook demorou (pode ter caído ou atrasado) ── */
  if (estado === 'timeout') return (
    <div className="max-w-md mx-auto px-4 py-16 text-center animate-fadein">
      <div className="text-5xl mb-4">⏳</div>
      <h1 className="text-xl font-black text-slate-800 mb-2">Pagamento em processamento</h1>
      <p className="text-slate-500 text-sm mb-6">
        Seu pagamento foi recebido pelo Pagar.me. A ativação do PRO pode levar até alguns minutos.
        Você receberá o acesso assim que for confirmado.
      </p>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 text-left space-y-1.5">
        <p className="text-xs text-amber-800 font-semibold">O que pode acontecer:</p>
        <p className="text-xs text-amber-700">• Pix: confirmação em até 1 minuto</p>
        <p className="text-xs text-amber-700">• Cartão: confirmação imediata</p>
        <p className="text-xs text-amber-700">• Se não ativar em 5 min, fale com o suporte</p>
      </div>
      <Link
        href="/matches"
        className="inline-block bg-slate-700 hover:bg-slate-800 text-white font-bold px-8 py-3 rounded-2xl transition-colors mb-2"
      >
        Ir para Matches →
      </Link>
      <p className="text-xs text-slate-400 mt-2">
        Recarregue a página em alguns minutos para verificar
      </p>
    </div>
  )

  /* ── Confirmado ── */
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center animate-fadein">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-2xl font-black text-slate-800 mb-2">PRO ativado!</h1>
      <p className="text-slate-500 mb-6">
        Seu plano <strong>{plano === 'anual' ? 'Anual' : 'Mensal'}</strong> está ativo.
        Agora você pode enviar propostas de troca ilimitadas.
      </p>

      <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4 mb-6 space-y-2">
        {[
          '✅ Propostas de troca ilimitadas',
          '✅ Badge PRO no perfil',
          '✅ Histórico completo',
        ].map(b => (
          <p key={b} className="text-sm text-green-800 font-medium">{b}</p>
        ))}
      </div>

      <Link
        href="/matches"
        className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-2xl transition-colors mb-3"
      >
        Ir para Matches →
      </Link>

      <p className="text-xs text-slate-400">
        Redirecionando automaticamente em {segundos}s…
      </p>
    </div>
  )
}

export default function PagamentoSucessoPage() {
  return (
    <Suspense>
      <SucessoInner />
    </Suspense>
  )
}
