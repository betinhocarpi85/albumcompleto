'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getPropostasRecebidas, savePropostasRecebidas,
  getPropostasEnviadas,
  type PropostaRecebida, type PropostaEnviada,
} from '@/lib/store'

type Aba = 'recebidas' | 'enviadas'

const STATUS_CONFIG = {
  pendente:  { label: 'Aguardando',  bg: 'bg-amber-100',  text: 'text-amber-700'  },
  aceita:    { label: 'Aceita',      bg: 'bg-green-100',  text: 'text-green-700'  },
  recusada:  { label: 'Recusada',    bg: 'bg-red-100',    text: 'text-red-700'    },
}

function StickerPill({ num }: { num: number }) {
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg border-2 border-slate-200 bg-slate-50 text-[11px] font-black text-slate-600 flex-shrink-0">
      {num}
    </span>
  )
}

export default function PropostasPage() {
  const [aba, setAba]               = useState<Aba>('recebidas')
  const [recebidas, setRecebidas]   = useState<PropostaRecebida[]>([])
  const [enviadas, setEnviadas]     = useState<PropostaEnviada[]>([])
  const [confirmando, setConfirmando] = useState<{ id: string; acao: 'aceitar' | 'recusar' } | null>(null)

  useEffect(() => {
    setRecebidas(getPropostasRecebidas())
    setEnviadas(getPropostasEnviadas())
  }, [])

  function handleAcao(id: string, acao: 'aceitar' | 'recusar') {
    setConfirmando({ id, acao })
  }

  function confirmar() {
    if (!confirmando) return
    const novoStatus = confirmando.acao === 'aceitar' ? 'aceita' : 'recusada'
    const atualizadas = recebidas.map(p =>
      p.id === confirmando.id ? { ...p, status: novoStatus as PropostaRecebida['status'] } : p
    )
    setRecebidas(atualizadas)
    savePropostasRecebidas(atualizadas)
    setConfirmando(null)
  }

  const pendentesRecebidas = recebidas.filter(p => p.status === 'pendente').length
  const pendentesEnviadas  = enviadas.filter(p => p.status === 'pendente').length

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 animate-fadein">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/matches" className="text-sm text-slate-400 hover:text-slate-600">‹</Link>
        <h1 className="text-lg font-black text-slate-800">Propostas de Troca</h1>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4">
        {([
          { key: 'recebidas', label: 'Recebidas', badge: pendentesRecebidas },
          { key: 'enviadas',  label: 'Enviadas',  badge: pendentesEnviadas  },
        ] as { key: Aba; label: string; badge: number }[]).map(a => (
          <button
            key={a.key}
            onClick={() => setAba(a.key)}
            className={[
              'flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
              aba === a.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {a.label}
            {a.badge > 0 && (
              <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-black flex items-center justify-center">
                {a.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── RECEBIDAS ── */}
      {aba === 'recebidas' && (
        <div className="space-y-3 animate-fadein">
          {recebidas.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-bold text-slate-700">Nenhuma proposta recebida</p>
              <p className="text-sm text-slate-400 mt-1">Quando alguém quiser trocar com você, aparece aqui.</p>
            </div>
          )}

          {recebidas.map(p => {
            const st = STATUS_CONFIG[p.status]
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.deAvatarColor} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-sm font-black">{p.deAvatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/perfil/${p.id.replace('pr','')}`} className="font-bold text-slate-800 text-sm hover:text-green-600 transition-colors">
                        {p.de}
                      </Link>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{p.deCity} · ⭐ {p.deRating} · {p.data}</p>
                  </div>
                </div>

                {/* Ofertas */}
                <div className="grid grid-cols-2 divide-x divide-slate-50">
                  {/* Ele oferece */}
                  <div className="px-3 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      {p.deGender === 'F' ? 'Ela oferece' : 'Ele oferece'} ({p.eleOferece.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.eleOferece.map(n => <StickerPill key={n} num={n} />)}
                    </div>
                  </div>
                  {/* Quer receber */}
                  <div className="px-3 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Quer receber ({p.elePede.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.elePede.map(n => <StickerPill key={n} num={n} />)}
                    </div>
                  </div>
                </div>

                {/* Balanço */}
                <div className={[
                  'mx-3 mb-3 px-3 py-2 rounded-xl text-xs text-center font-semibold',
                  p.eleOferece.length === p.elePede.length
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700',
                ].join(' ')}>
                  {p.eleOferece.length === p.elePede.length
                    ? '✓ Troca exata — mesma quantidade dos dois lados'
                    : `Desequilíbrio: ${p.eleOferece.length} × ${p.elePede.length}`}
                </div>

                {/* Ações */}
                {p.status === 'pendente' && (
                  <div className="flex gap-2 px-3 pb-3">
                    <button
                      onClick={() => handleAcao(p.id, 'recusar')}
                      className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Recusar
                    </button>
                    <button
                      onClick={() => handleAcao(p.id, 'aceitar')}
                      className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors"
                    >
                      ✓ Aceitar troca
                    </button>
                  </div>
                )}
                {p.status === 'aceita' && (
                  <div className="px-3 pb-3">
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                      <p className="text-sm font-bold text-green-700">Troca aceita!</p>
                      <p className="text-xs text-green-600 mt-0.5">Prepare o envio das suas figurinhas. O endereço aparece no histórico.</p>
                    </div>
                  </div>
                )}
                {p.status === 'recusada' && (
                  <div className="px-3 pb-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center">
                      <p className="text-xs text-slate-500">Proposta recusada.</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── ENVIADAS ── */}
      {aba === 'enviadas' && (
        <div className="space-y-3 animate-fadein">
          {enviadas.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📤</p>
              <p className="font-bold text-slate-700">Nenhuma proposta enviada</p>
              <p className="text-sm text-slate-400 mt-1">
                Vá para{' '}
                <Link href="/matches" className="text-green-600 font-semibold">Matches</Link>
                {' '}e envie propostas de troca.
              </p>
            </div>
          )}

          {enviadas.map(p => {
            const st = STATUS_CONFIG[p.status]
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.contraparteAvatarColor} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-sm font-black">{p.contraparteAvatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800 text-sm">{p.contraparte}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{p.data}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-50">
                  <div className="px-3 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Você oferece ({p.euOfereco.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.euOfereco.map(n => <StickerPill key={n} num={n} />)}
                    </div>
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Você recebe ({p.euRecebo.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.euRecebo.map(n => <StickerPill key={n} num={n} />)}
                    </div>
                  </div>
                </div>

                {p.status === 'aceita' && (
                  <div className="px-3 pb-3">
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                      <p className="text-sm font-bold text-green-700">Proposta aceita!</p>
                      <p className="text-xs text-green-600 mt-0.5">Combinado! Prepare o envio. Endereço disponível no histórico.</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal confirmação */}
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmando(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm animate-fadein">
            <p className="text-2xl mb-2">{confirmando.acao === 'aceitar' ? '🤝' : '❌'}</p>
            <p className="font-black text-slate-800 mb-1">
              {confirmando.acao === 'aceitar' ? 'Aceitar proposta?' : 'Recusar proposta?'}
            </p>
            <p className="text-sm text-slate-500 mb-4">
              {confirmando.acao === 'aceitar'
                ? 'Ao aceitar, você se compromete a enviar as figurinhas combinadas em até 3 dias úteis.'
                : 'A proposta será recusada e o colecionador será notificado.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmando(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                className={[
                  'flex-1 py-2.5 rounded-xl text-white text-sm font-bold',
                  confirmando.acao === 'aceitar'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-500 hover:bg-red-600',
                ].join(' ')}
              >
                {confirmando.acao === 'aceitar' ? '✓ Aceitar' : 'Recusar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
