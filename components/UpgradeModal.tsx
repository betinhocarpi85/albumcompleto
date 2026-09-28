'use client'

import { useEffect, useState } from 'react'
import { dbGetPlano } from '@/lib/db'

interface Props {
  onClose: () => void
}

type Plano = 'mensal' | 'anual'
interface Pix { codigo: string; qrUrl: string; expiraEm: string; valor: number }

const fmtBRL = (centavos: number) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function mascaraCpf(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function mascaraTel(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`
}

export default function UpgradeModal({ onClose }: Props) {
  const [loading, setLoading] = useState<Plano | null>(null)
  const [erro, setErro]       = useState<string | null>(null)
  const [plano, setPlano]     = useState<Plano | null>(null)
  const [pedirCpf, setPedirCpf] = useState(false)
  const [pedirTel, setPedirTel] = useState(false)
  const [cpf, setCpf]         = useState('')
  const [tel, setTel]         = useState('')
  const [pix, setPix]         = useState<Pix | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [pago, setPago]       = useState(false)

  // Webhook do Pagar.me ativa o plano; aqui só acompanhamos
  useEffect(() => {
    if (!pix || pago) return
    const id = setInterval(async () => {
      const { plano: p } = await dbGetPlano()
      if (p === 'pro') setPago(true)
    }, 4000)
    return () => clearInterval(id)
  }, [pix, pago])

  async function assinar(escolhido: Plano) {
    setLoading(escolhido)
    setPlano(escolhido)
    setErro(null)
    try {
      const res  = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plano: escolhido,
          ...(pedirCpf ? { cpf } : {}),
          ...(pedirTel ? { telefone: tel } : {}),
        }),
      })
      const data = await res.json()
      if (data.pix) {
        setPix(data.pix)
      } else if (data.error === 'DADOS_PIX') {
        setPedirCpf(p => p || data.faltaCpf)
        setPedirTel(p => p || data.faltaTelefone)
        if (pedirCpf && data.faltaCpf) setErro('CPF inválido. Confira os números.')
        else if (pedirTel && data.faltaTelefone) setErro('Telefone inválido. Use DDD + número.')
      } else {
        setErro(data.error ?? 'Erro ao iniciar pagamento. Tente novamente.')
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    }
    setLoading(null)
  }

  async function copiar() {
    if (!pix) return
    try {
      await navigator.clipboard.writeText(pix.codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setErro('Não foi possível copiar. Selecione o código e copie manualmente.')
    }
  }

  if (pago) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadein text-center">
          <p className="text-5xl mb-3">🎉</p>
          <h2 className="text-xl font-black text-slate-800 mb-1">Pagamento confirmado!</h2>
          <p className="text-sm text-slate-500 mb-5">Seu plano PRO já está ativo.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    )
  }

  if (pix) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadein text-center max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-black text-slate-800">Pague com Pix</h2>
          <p className="text-sm text-slate-500 mb-4">
            Plano {plano === 'anual' ? 'Anual' : 'Mensal'} · <strong className="text-green-600">{fmtBRL(pix.valor)}</strong>
          </p>

          {pix.qrUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pix.qrUrl} alt="QR Code Pix" className="w-52 h-52 mx-auto mb-4 rounded-xl border border-slate-100" />
          )}

          <p className="text-xs text-slate-500 mb-2">Ou use o Pix copia e cola:</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-3 text-[10px] text-slate-600 break-all font-mono max-h-20 overflow-y-auto select-all">
            {pix.codigo}
          </div>
          <button
            onClick={copiar}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors mb-4"
          >
            {copiado ? '✓ Código copiado!' : '📋 Copiar código Pix'}
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-1">
            <span className="w-3.5 h-3.5 border-2 border-slate-200 border-t-green-500 rounded-full animate-spin" />
            Aguardando pagamento…
          </div>
          <p className="text-[11px] text-slate-400 mb-4">
            O PRO é ativado automaticamente assim que o Pix cair. Válido até{' '}
            {new Date(pix.expiraEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
          </p>

          {erro && <p className="text-xs text-red-500 mb-3">{erro}</p>}

          <button onClick={onClose} className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors">
            Fechar
          </button>
        </div>
      </div>
    )
  }

  if ((pedirCpf || pedirTel) && plano) {
    const cpfOk = !pedirCpf || cpf.replace(/\D/g, '').length === 11
    const telOk = !pedirTel || tel.replace(/\D/g, '').length >= 10
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/50" onClick={() => { if (!loading) onClose() }} />
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadein">
          <h2 className="text-lg font-black text-slate-800 text-center mb-1">Dados para o Pix</h2>
          <p className="text-xs text-slate-500 text-center mb-4">
            O banco exige esses dados para gerar a cobrança Pix.
          </p>
          <form
            onSubmit={e => { e.preventDefault(); if (cpfOk && telOk) assinar(plano) }}
            className="space-y-3"
          >
            {pedirCpf && (
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">CPF</span>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  value={cpf}
                  onChange={e => setCpf(mascaraCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </label>
            )}
            {pedirTel && (
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Celular com DDD</span>
                <input
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={tel}
                  onChange={e => setTel(mascaraTel(e.target.value))}
                  placeholder="(11) 91234-5678"
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </label>
            )}
            {erro && <p className="text-xs text-red-500 text-center">{erro}</p>}
            <button
              type="submit"
              disabled={!cpfOk || !telOk || !!loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Gerando Pix…' : 'Gerar Pix'}
            </button>
          </form>
          <button
            onClick={() => { setPedirCpf(false); setPedirTel(false); setPlano(null); setErro(null) }}
            disabled={!!loading}
            className="w-full py-2 mt-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    )
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
            Usuários <strong>PRO</strong> aparecem nos matches uns dos outros, veem o contato e enviam propostas.
            No gratuito você cria anúncios e vê matches, mas não aparece para outros PRO.
          </p>
        </div>

        {/* Benefícios */}
        <div className="bg-green-50 rounded-xl px-4 py-3 mb-4 space-y-1.5">
          {[
            '✅ Apareça nos matches de outros usuários PRO',
            '✅ Veja o contato dos seus matches',
            '✅ Envie propostas de troca ilimitadas',
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
              <p className="text-xs text-slate-400 mt-0.5 line-through">de R$ 4,99/mês</p>
              <p className="text-xs text-green-600 font-semibold">🏆 Promoção Copa</p>
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
              <p className="text-xs text-slate-400 mt-0.5 line-through">de R$ 49,99/ano</p>
              <p className="text-xs text-green-600 font-semibold">🏆 Promoção Copa · ≈ R$ 1,25/mês</p>
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

        <p className="text-[11px] text-slate-400 text-center mb-3">💠 Pagamento via Pix · ativação automática</p>

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
