'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { dbGetPropostasRecebidas, type PropostaComPerfil } from '@/lib/db'

const STORAGE_KEY = 'notif_dismissed'

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function saveDismissed(ids: Set<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids])) } catch {}
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (mins < 1)   return 'agora'
    if (mins < 60)  return `${mins}min atrás`
    if (hours < 24) return `${hours}h atrás`
    if (days < 7)   return `${days}d atrás`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  } catch { return iso }
}

const STATUS_CONFIG = {
  pendente: { label: 'Aguardando sua resposta', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-400' },
  aceita:   { label: 'Aceita',                  color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500' },
  recusada: { label: 'Recusada',                color: 'text-slate-400', bg: 'bg-slate-50', dot: 'bg-slate-300' },
}

export default function NotificacoesPage() {
  const [propostas, setPropostas]   = useState<PropostaComPerfil[]>([])
  const [dismissed, setDismissed]   = useState<Set<string>>(new Set())
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const saved = getDismissed()
    setDismissed(saved)
    dbGetPropostasRecebidas().then(data => {
      setPropostas(data)
      setLoading(false)
    })
  }, [])

  function dispensar(id: string) {
    setDismissed(prev => {
      const next = new Set([...prev, id])
      saveDismissed(next)
      return next
    })
  }

  function limparTodas() {
    const ids = new Set(propostas.map(p => p.id))
    saveDismissed(ids)
    setDismissed(ids)
  }

  const visiveis = propostas.filter(p => !dismissed.has(p.id))

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 animate-fadein">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link href="/conta" className="text-sm text-slate-400 hover:text-slate-600">‹</Link>
          <h1 className="text-lg font-black text-slate-800">Notificações</h1>
        </div>
        {visiveis.length > 0 && (
          <button
            onClick={limparTodas}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium"
          >
            Limpar todas
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <span className="w-6 h-6 border-2 border-slate-200 border-t-green-500 rounded-full animate-spin" />
        </div>
      )}

      {!loading && visiveis.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-bold text-slate-700">Tudo em dia</p>
          <p className="text-sm text-slate-400 mt-1">Você não tem novas notificações.</p>
        </div>
      )}

      {!loading && visiveis.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide px-1 mb-3">
            Propostas recebidas
          </p>
          {visiveis.map(p => {
            const st = STATUS_CONFIG[p.status]
            return (
              <div key={p.id} className="relative group">
                <Link
                  href="/propostas"
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors shadow-sm pr-10 ${p.status === 'pendente' ? 'border-amber-200' : ''}`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-black">
                      {p.contraparte_nome.slice(0, 2).toUpperCase()}
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {p.contraparte_nome}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {p.tipo === 'troca' ? '🔄 Proposta de troca' : '🛒 Proposta de compra'} ·{' '}
                      {p.eu_ofereco.length} × {p.eu_recebo.length} figurinha{p.eu_recebo.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Status + hora */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] text-slate-400">{formatDate(p.created_at)}</span>
                    <span className={`flex items-center gap-1 text-[10px] font-semibold ${st.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>
                </Link>

                {/* Botão X */}
                <button
                  onClick={e => { e.preventDefault(); dispensar(p.id) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-500 text-slate-400 flex items-center justify-center text-xs transition-colors opacity-0 group-hover:opacity-100"
                  title="Dispensar notificação"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
