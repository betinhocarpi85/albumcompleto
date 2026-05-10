'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SucessoInner() {
  const searchParams = useSearchParams()
  const plano = searchParams.get('plano') ?? 'mensal'
  const [segundos, setSegundos] = useState(5)

  useEffect(() => {
    const iv = setInterval(() => {
      setSegundos(s => {
        if (s <= 1) { clearInterval(iv); window.location.href = '/matches' }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center animate-fadein">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-2xl font-black text-slate-800 mb-2">Bem-vindo ao PRO!</h1>
      <p className="text-slate-500 mb-6">
        Seu plano <strong>{plano === 'anual' ? 'Anual' : 'Mensal'}</strong> foi ativado com sucesso.
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
