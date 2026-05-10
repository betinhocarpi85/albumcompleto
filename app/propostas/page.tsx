'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getSession, dbGetProfile,
  dbGetPropostasRecebidas, dbGetPropostasEnviadas,
  dbUpdateProposta, dbGetPhoneForProposta,
  dbAvaliar, dbJaAvaliou,
  type PropostaComPerfil, type TipoProposta,
} from '@/lib/db'
import BannerMenorDeIdade from '@/components/BannerMenorDeIdade'

type Aba = 'recebidas' | 'enviadas'

const STATUS_CONFIG = {
  pendente: { label: 'Aguardando', bg: 'bg-amber-100',  text: 'text-amber-700'  },
  aceita:   { label: 'Aceita',     bg: 'bg-green-100',  text: 'text-green-700'  },
  recusada: { label: 'Recusada',   bg: 'bg-red-100',    text: 'text-red-700'    },
}

const TIPO_CONFIG: Record<TipoProposta, { label: string; emoji: string }> = {
  troca:  { label: 'Troca',  emoji: '🔄' },
  compra: { label: 'Compra', emoji: '🛒' },
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch { return iso }
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return raw
}

function StickerPill({ num }: { num: number }) {
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg border-2 border-slate-200 bg-slate-50 text-[11px] font-black text-slate-600 flex-shrink-0">
      {num}
    </span>
  )
}

function PhoneCard({ phone, nome }: { phone: string; nome: string }) {
  const digits = phone.replace(/\D/g, '')
  const waLink = `https://wa.me/55${digits}`
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
      <p className="text-xs font-bold text-green-800 mb-1">📞 Telefone de {nome}</p>
      <p className="text-lg font-black text-green-900 tracking-wide mb-2">{formatPhone(phone)}</p>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
      >
        <span>💬</span> Chamar no WhatsApp
      </a>
      <p className="text-[11px] text-green-600 mt-2">
        Combine data, local e horário diretamente com {nome}.
      </p>
    </div>
  )
}

type AvaliacaoModal = { proposta: PropostaComPerfil; nota: number; comentario: string }

export default function PropostasPage() {
  const [aba, setAba]             = useState<Aba>('recebidas')
  const [recebidas, setRecebidas] = useState<PropostaComPerfil[]>([])
  const [enviadas, setEnviadas]   = useState<PropostaComPerfil[]>([])
  const [phones, setPhones]       = useState<Record<string, string>>({})
  const [jaAvaliou, setJaAvaliou] = useState<Record<string, boolean>>({})
  const [confirmando, setConfirmando] = useState<{ id: string; acao: 'aceitar' | 'recusar' } | null>(null)
  const [avalModal, setAvalModal] = useState<AvaliacaoModal | null>(null)
  const [avalSalvando, setAvalSalvando] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [adulto, setAdulto]       = useState(true)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) return
      const [rec, env, prof] = await Promise.all([
        dbGetPropostasRecebidas(),
        dbGetPropostasEnviadas(),
        dbGetProfile(),
      ])
      setRecebidas(rec)
      setEnviadas(env)
      setAdulto(!!prof.maior18)

      // Fetch phones for all already-accepted proposals
      const aceitas = [...rec, ...env].filter(p => p.status === 'aceita')
      if (aceitas.length === 0) return
      const entries = await Promise.all(
        aceitas.map(async p => {
          const phone = await dbGetPhoneForProposta(p.id)
          return [p.id, phone] as [string, string | null]
        })
      )
      const newPhones: Record<string, string> = {}
      entries.forEach(([id, phone]) => { if (phone) newPhones[id] = phone })
      setPhones(newPhones)

      // Verifica quais já foram avaliadas
      const avalChecks = await Promise.all(
        aceitas.map(async p => [p.id, await dbJaAvaliou(p.id)] as [string, boolean])
      )
      const avalMap: Record<string, boolean> = {}
      avalChecks.forEach(([id, done]) => { avalMap[id] = done })
      setJaAvaliou(avalMap)
    })
  }, [])

  async function salvarAvaliacao() {
    if (!avalModal || avalSalvando) return
    setAvalSalvando(true)
    const contraparte_id = avalModal.proposta.de_user_id === (await import('@/lib/db').then(m => m.getUserId()))
      ? avalModal.proposta.para_user_id
      : avalModal.proposta.de_user_id
    await dbAvaliar(avalModal.proposta.id, contraparte_id, avalModal.nota, avalModal.comentario)
    setJaAvaliou(prev => ({ ...prev, [avalModal.proposta.id]: true }))
    setAvalSalvando(false)
    setAvalModal(null)
  }

  async function confirmar() {
    if (!confirmando || loading) return
    setLoading(true)
    try {
      const { id, acao } = confirmando
      const novoStatus: 'aceita' | 'recusada' = acao === 'aceitar' ? 'aceita' : 'recusada'
      await dbUpdateProposta(id, { status: novoStatus })

      // Update local state for both lists
      const patch = (p: PropostaComPerfil) => p.id === id ? { ...p, status: novoStatus } : p
      setRecebidas(prev => prev.map(patch))
      setEnviadas(prev => prev.map(patch))

      // Reveal phone if accepted
      if (acao === 'aceitar') {
        const phone = await dbGetPhoneForProposta(id)
        if (phone) setPhones(prev => ({ ...prev, [id]: phone }))
      }
    } finally {
      setLoading(false)
      setConfirmando(null)
    }
  }

  const pendentesRecebidas = recebidas.filter(p => p.status === 'pendente').length
  const pendentesEnviadas  = enviadas.filter(p => p.status === 'pendente').length

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 animate-fadein">

      <BannerMenorDeIdade />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/matches" className="text-sm text-slate-400 hover:text-slate-600">‹</Link>
        <h1 className="text-lg font-black text-slate-800">Propostas</h1>
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
            const st    = STATUS_CONFIG[p.status]
            const tipo  = TIPO_CONFIG[p.tipo]
            const phone = phones[p.id]
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* Header do card */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-black">
                      {p.contraparte_nome.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-800 text-sm">{p.contraparte_nome}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {tipo.emoji} {tipo.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {p.contraparte_localidade} · {formatDate(p.created_at)}
                    </p>
                  </div>
                </div>

                {/* Figurinhas */}
                <div className="grid grid-cols-2 divide-x divide-slate-50">
                  <div className="px-3 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Ele/ela oferece ({p.eu_ofereco.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.eu_ofereco.map(n => <StickerPill key={n} num={n} />)}
                    </div>
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Quer receber ({p.eu_recebo.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.eu_recebo.map(n => <StickerPill key={n} num={n} />)}
                    </div>
                  </div>
                </div>

                {/* Balanço (só trocas) */}
                {p.tipo === 'troca' && (
                  <div className={[
                    'mx-3 mb-3 px-3 py-2 rounded-xl text-xs text-center font-semibold',
                    p.eu_ofereco.length === p.eu_recebo.length
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700',
                  ].join(' ')}>
                    {p.eu_ofereco.length === p.eu_recebo.length
                      ? '✓ Troca exata — mesma quantidade dos dois lados'
                      : `Desequilíbrio: ${p.eu_ofereco.length} × ${p.eu_recebo.length}`}
                  </div>
                )}

                {/* Ações — pendente */}
                {p.status === 'pendente' && (
                  <div className="flex gap-2 px-3 pb-3">
                    <button
                      onClick={() => setConfirmando({ id: p.id, acao: 'recusar' })}
                      className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Recusar
                    </button>
                    {adulto ? (
                      <button
                        onClick={() => setConfirmando({ id: p.id, acao: 'aceitar' })}
                        className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors"
                      >
                        ✓ Aceitar
                      </button>
                    ) : (
                      <div className="flex-1 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold flex items-center justify-center">
                        🔒 +18 obrigatório
                      </div>
                    )}
                  </div>
                )}

                {/* Aceita — revelar telefone + avaliar */}
                {p.status === 'aceita' && (
                  <div className="px-3 pb-3 space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <p className="text-sm font-bold text-green-700">
                        {p.tipo === 'troca'  && 'Troca aceita!'}
                        {p.tipo === 'compra' && 'Interesse confirmado!'}
                        {' '}Combine diretamente com {p.contraparte_nome}.
                      </p>
                    </div>
                    {phone
                      ? <PhoneCard phone={phone} nome={p.contraparte_nome} />
                      : (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-2">
                          <span className="text-slate-400 text-sm">⏳</span>
                          <p className="text-xs text-slate-500">
                            Carregando contato de {p.contraparte_nome}…
                          </p>
                        </div>
                      )}
                    {jaAvaliou[p.id] ? (
                      <p className="text-xs text-center text-slate-400 py-1">⭐ Avaliação enviada</p>
                    ) : (
                      <button
                        onClick={() => setAvalModal({ proposta: p, nota: 5, comentario: '' })}
                        className="w-full py-2 rounded-xl border border-yellow-300 bg-yellow-50 text-yellow-700 text-xs font-semibold hover:bg-yellow-100 transition-colors"
                      >
                        ⭐ Avaliar {p.contraparte_nome}
                      </button>
                    )}
                  </div>
                )}

                {/* Recusada */}
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
                {' '}e envie propostas.
              </p>
            </div>
          )}

          {enviadas.map(p => {
            const st    = STATUS_CONFIG[p.status]
            const tipo  = TIPO_CONFIG[p.tipo]
            const phone = phones[p.id]
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-black">
                      {p.contraparte_nome.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-800 text-sm">{p.contraparte_nome}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {tipo.emoji} {tipo.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {p.contraparte_localidade} · {formatDate(p.created_at)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-50">
                  <div className="px-3 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Você oferece ({p.eu_ofereco.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.eu_ofereco.map(n => <StickerPill key={n} num={n} />)}
                    </div>
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Você recebe ({p.eu_recebo.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.eu_recebo.map(n => <StickerPill key={n} num={n} />)}
                    </div>
                  </div>
                </div>

                {/* Aceita — revelar telefone + avaliar */}
                {p.status === 'aceita' && (
                  <div className="px-3 pb-3 space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <p className="text-sm font-bold text-green-700">
                        {p.contraparte_nome} aceitou! Combine diretamente.
                      </p>
                    </div>
                    {phone
                      ? <PhoneCard phone={phone} nome={p.contraparte_nome} />
                      : (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-2">
                          <span className="text-slate-400 text-sm">⏳</span>
                          <p className="text-xs text-slate-500">
                            Carregando contato de {p.contraparte_nome}…
                          </p>
                        </div>
                      )}
                    {jaAvaliou[p.id] ? (
                      <p className="text-xs text-center text-slate-400 py-1">⭐ Avaliação enviada</p>
                    ) : (
                      <button
                        onClick={() => setAvalModal({ proposta: p, nota: 5, comentario: '' })}
                        className="w-full py-2 rounded-xl border border-yellow-300 bg-yellow-50 text-yellow-700 text-xs font-semibold hover:bg-yellow-100 transition-colors"
                      >
                        ⭐ Avaliar {p.contraparte_nome}
                      </button>
                    )}
                  </div>
                )}

                {/* Pendente */}
                {p.status === 'pendente' && (
                  <div className="px-3 pb-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-center">
                      <p className="text-xs text-slate-500">
                        Aguardando resposta de {p.contraparte_nome}…
                      </p>
                    </div>
                  </div>
                )}

                {/* Recusada */}
                {p.status === 'recusada' && (
                  <div className="px-3 pb-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center">
                      <p className="text-xs text-slate-500">
                        {p.contraparte_nome} recusou esta proposta.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal avaliação */}
      {avalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if (!avalSalvando) setAvalModal(null) }} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm animate-fadein">
            <p className="text-2xl mb-2">⭐</p>
            <p className="font-black text-slate-800 mb-1">Avaliar {avalModal.proposta.contraparte_nome}</p>
            <p className="text-xs text-slate-400 mb-4">Como foi a experiência desta troca?</p>

            {/* Estrelas */}
            <div className="flex justify-center gap-3 mb-4">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  onClick={() => setAvalModal(prev => prev ? { ...prev, nota: i } : prev)}
                  className={`text-3xl transition-transform hover:scale-110 ${i <= avalModal.nota ? 'text-yellow-400' : 'text-slate-200'}`}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Comentário opcional */}
            <textarea
              placeholder="Comentário opcional…"
              value={avalModal.comentario}
              onChange={e => setAvalModal(prev => prev ? { ...prev, comentario: e.target.value } : prev)}
              rows={2}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none mb-4"
            />

            <div className="flex gap-2">
              <button
                disabled={avalSalvando}
                onClick={() => setAvalModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                disabled={avalSalvando}
                onClick={salvarAvaliacao}
                className="flex-1 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-900 text-sm font-bold transition-colors disabled:opacity-50"
              >
                {avalSalvando ? '…' : 'Enviar avaliação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmação */}
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => { if (!loading) setConfirmando(null) }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm animate-fadein">
            <p className="text-2xl mb-2">{confirmando.acao === 'aceitar' ? '🤝' : '❌'}</p>
            <p className="font-black text-slate-800 mb-1">
              {confirmando.acao === 'aceitar' ? 'Aceitar proposta?' : 'Recusar proposta?'}
            </p>
            {confirmando.acao === 'aceitar' ? (
              <div className="mb-4 space-y-2">
                <p className="text-sm text-slate-500">
                  Ao aceitar, ambos recebem o telefone um do outro para combinar diretamente.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex gap-2">
                  <span className="text-lg leading-none mt-0.5">🛡️</span>
                  <div>
                    <p className="text-xs font-bold text-amber-800 mb-0.5">Dica de segurança</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Prefira se encontrar em <strong>locais públicos e movimentados</strong> — shoppings, praças, lanchonetes. Evite endereços residenciais com pessoas que não conhece.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-4">
                A proposta será recusada e o colecionador será notificado.
              </p>
            )}
            <div className="flex gap-2">
              <button
                disabled={loading}
                onClick={() => setConfirmando(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                disabled={loading}
                onClick={confirmar}
                className={[
                  'flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50',
                  confirmando.acao === 'aceitar'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-500 hover:bg-red-600',
                ].join(' ')}
              >
                {loading ? '…' : confirmando.acao === 'aceitar' ? '✓ Aceitar' : 'Recusar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
