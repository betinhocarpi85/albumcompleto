'use client'

import { useState } from 'react'

interface Props {
  onClose: () => void
}

export default function UpgradeModal({ onClose }: Props) {
  const [loading, setLoading] = useState<'mensal' | 'anual' | null>(null)
  const [erro, setErro]       = useState<string | null>(null)

  async function assinar(plano: 'mensal' | 'anual') {
    setLoading(plano)
    setErro(null)
    try {
      const res  = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plano }),
      })
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer')
      } else {
        setErro(data.error ?? 'Erro ao iniciar pagamento. Tente novamente.')
        setLoading(null)
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => { if (!loading) onClose() }} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadein">

        {/* Header */}
        <div className="text-center mb-5">
          <p className="text-4xl mb-2">🏆</p>
          <h2 className="text-xl font-black text-slate-800">Seja PRO</h2>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Para enviar propostas de troca você precisa de uma conta <strong>PRO</strong>.
            Ver matches é sempre gratuito!
          </p>
        </div>

        {/* Benefícios */}
        <div className="bg-green-50 rounded-xl px-4 py-3 mb-4 space-y-1.5">
          {[
            '✅ Envie propostas de troca ilimitadas',
            '✅ Apareça em mais matches',
            '✅ Histórico completo de trocas',
            '✅ Badge PRO no seu perfil',
          ].map(b => (
            <p key={b} className="text-xs text-green-800 font-medium">{b}</p>
          ))}
        </div>

        {/* Planos */}
        <div className="space-y-3 mb-4">

          {/* Mensal */}
          <button
            disabled={!!loading}
            onClick={() => assinar('mensal')}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all disabled:opacity-60 text-left"
          >
            <div>
              <p className="font-bold text-slate-800">Plano Mensal</p>
              <p className="text-xs text-slate-400 mt-0.5">Cancele quando quiser</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xl font-black text-green-600">R$ 1,99</p>
                <p className="text-xs text-slate-400">/mês</p>
              </div>
              {loading === 'mensal' && (
                <span className="w-4 h-4 border-2 border-slate-200 border-t-green-500 rounded-full animate-spin flex-shrink-0" />
              )}
            </div>
          </button>

          {/* Anual */}
          <button
            disabled={!!loading}
            onClick={() => assinar('anual')}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 border-green-500 bg-green-50 hover:bg-green-100 transition-all disabled:opacity-60 relative overflow-hidden text-left"
          >
            <span className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-bl-xl">
              ECONOMIZE 37%
            </span>
            <div>
              <p className="font-bold text-slate-800">Plano Anual</p>
              <p className="text-xs text-slate-500 mt-0.5">≈ R$ 1,25/mês • melhor valor</p>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="text-right">
                <p className="text-xl font-black text-green-600">R$ 14,99</p>
                <p className="text-xs text-slate-400">/ano</p>
              </div>
              {loading === 'anual' && (
                <span className="w-4 h-4 border-2 border-slate-200 border-t-green-500 rounded-full animate-spin flex-shrink-0" />
              )}
            </div>
          </button>
        </div>

        {erro && (
          <p className="text-xs text-red-500 text-center mb-3">{erro}</p>
        )}

        <button
          onClick={onClose}
          disabled={!!loading}
          className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
        >
          Agora não
        </button>
      </div>
    </div>
  )
}
