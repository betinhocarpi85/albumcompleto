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
import { albumCopa2026, buildGlobalNumberMap, type Album } from '@/data/album-copa-2026'
import { albumBrasileiraoMasc2026 } from '@/data/album-brasileirao-masc-2025'
import { albumBrasileiraoFem2026 } from '@/data/album-brasileirao-fem-2025'
import { ALBUMS_REGISTRY } from '@/data/albums-registry'
import BannerMenorDeIdade from '@/components/BannerMenorDeIdade'

// Mapa gNum → { code, localNum } por álbum
function buildGnumToLocal(album: Album) {
  const maxGnum = ALBUMS_REGISTRY.find(a => a.id === album.id)?.totalStickers ?? Infinity
  const map = new Map<number, { code: string; localNum: number }>()
  let counter = 1
  for (const cat of album.categories) {
    for (const s of cat.stickers) {
      if (counter <= maxGnum) map.set(counter, { code: cat.code, localNum: s.number })
      counter++
    }
  }
  return map
}

const GNUM_TO_LOCAL: Record<string, Map<number, { code: string; localNum: number }>> = {
  'copa-2026':              buildGnumToLocal(albumCopa2026),
  'brasileirao-masc-2026': buildGnumToLocal(albumBrasileiraoMasc2026),
  'brasileirao-fem-2026':  buildGnumToLocal(albumBrasileiraoFem2026),
}

type Aba    = 'recebidas' | 'enviadas'
type Filtro = 'todos' | 'troca' | 'compra'

interface BancaProxima {
  slug: string; nome: string; endereco: string; cidade: string; uf: string
  cep: string | null; distanciaKm: number
}

type Proposta = PropostaComPerfil & { telefone?: string; avaliado?: boolean; bancaProxima?: BancaProxima | null }

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

function StickerPill({ num, albumId }: { num: number; albumId: string }) {
  const info = (GNUM_TO_LOCAL[albumId] ?? GNUM_TO_LOCAL['copa-2026']).get(num)
  return (
    <span className="inline-flex flex-col items-center justify-center w-9 h-9 rounded-lg border-2 border-slate-200 bg-slate-50 text-slate-600 flex-shrink-0 gap-0">
      {info ? (
        <>
          {info.code.length <= 4 && <span className="text-[7px] font-bold leading-none opacity-50">{info.code}</span>}
          <span className="text-[11px] font-black leading-none">{info.localNum}</span>
        </>
      ) : (
        <span className="text-[11px] font-black leading-none">{num}</span>
      )}
    </span>
  )
}

function BancaCard({ banca }: { banca: BancaProxima }) {
  const mapsUrl = banca.cep?.startsWith('http')
    ? banca.cep
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${banca.endereco}, ${banca.cidade}, ${banca.uf}`)}`
  return (
    <div className="border border-blue-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50">
        <span className="text-base">🗺️</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-blue-800">Banca sugerida para o encontro</p>
          <p className="text-xs text-blue-600 font-medium truncate">{banca.nome}</p>
        </div>
        <span className="text-xs font-bold text-blue-500 shrink-0">{banca.distanciaKm} km</span>
      </div>
      <div className="px-4 py-2.5 bg-blue-50 border-t border-blue-100 space-y-2">
        <p className="text-xs text-blue-700">📍 {banca.endereco} — {banca.cidade}/{banca.uf}</p>
        <div className="flex gap-2">
          <a
            href={`/bancas/${banca.slug}`}
            className="flex-1 text-center text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded-lg transition-colors"
          >
            Ver banca
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-bold bg-white border border-blue-300 hover:bg-blue-50 text-blue-600 py-1.5 rounded-lg transition-colors"
          >
            📍 Abrir no Maps
          </a>
        </div>
      </div>
    </div>
  )
}

function PhoneCard({ phone, nome }: { phone: string; nome: string }) {
  const [aberto, setAberto] = useState(false)
  const digits = phone.replace(/\D/g, '')
  const waLink = `https://wa.me/55${digits}`
  return (
    <div className="border border-green-200 rounded-xl overflow-hidden">
      {/* Header — sempre visível */}
      <button
        onClick={() => setAberto(a => !a)}
        className="w-full flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📞</span>
          <span className="text-sm font-bold text-green-800">Contato de {nome}</span>
        </div>
        <span className={`text-green-600 text-sm transition-transform ${aberto ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* Conteúdo expansível */}
      {aberto && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-100 space-y-3 animate-fadein">
          <p className="text-xl font-black text-green-900 tracking-wide">{formatPhone(phone)}</p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <span>💬</span> Chamar no WhatsApp
          </a>
          <p className="text-[11px] text-green-600">
            Combine data, local e horário diretamente com {nome}.
          </p>
          <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <span className="text-base leading-none mt-0.5">🛡️</span>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              <strong>Dica de segurança:</strong> prefira se encontrar em locais públicos e movimentados — shoppings, praças, lanchonetes. Evite endereços residenciais com pessoas que não conhece.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

type AvaliacaoModal = { proposta: PropostaComPerfil; nota: number; comentario: string }

async function fetchBancaProxima(): Promise<BancaProxima | null> {
  try {
    const res = await fetch('/api/bancas/nearest', { credentials: 'include' })
    if (!res.ok) return null
    const { banca } = await res.json()
    return banca ?? null
  } catch {
    return null
  }
}

export default function PropostasPage() {
  const [aba, setAba]             = useState<Aba>('recebidas')
  const [filtro, setFiltro]       = useState<Filtro>('todos')
  const [ocultarIds, setOcultarIds] = useState<Set<string>>(new Set())
  const [recebidas, setRecebidas] = useState<Proposta[]>([])
  const [enviadas, setEnviadas]   = useState<Proposta[]>([])
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
      setAdulto(!!prof.maior18)

      // Para propostas aceitas, carrega telefone, avaliação e banca mais próxima
      const aceitas = [...rec, ...env].filter(p => p.status === 'aceita')
      const [extras, bancaProxima] = await Promise.all([
        aceitas.length > 0
          ? Promise.all(aceitas.map(async p => {
              const [phone, avaliado] = await Promise.all([
                dbGetPhoneForProposta(p.id),
                dbJaAvaliou(p.id),
              ])
              return { id: p.id, telefone: phone ?? undefined, avaliado }
            }))
          : Promise.resolve([]),
        aceitas.length > 0 ? fetchBancaProxima() : Promise.resolve(null),
      ])

      const extrasMap = new Map(extras.map(e => [e.id, e]))
      const enrich = (p: PropostaComPerfil): Proposta => {
        const ex = extrasMap.get(p.id)
        return ex
          ? { ...p, telefone: ex.telefone, avaliado: ex.avaliado, bancaProxima }
          : p
      }

      setRecebidas(rec.map(enrich))
      setEnviadas(env.map(enrich))
    })
  }, [])

  async function salvarAvaliacao() {
    if (!avalModal || avalSalvando) return
    setAvalSalvando(true)
    const propostaId    = avalModal.proposta.id
    const contraparteId = avalModal.proposta.de_user_id === (await import('@/lib/db').then(m => m.getUserId()))
      ? avalModal.proposta.para_user_id
      : avalModal.proposta.de_user_id
    await dbAvaliar(propostaId, contraparteId, avalModal.nota, avalModal.comentario)
    // Marca avaliado diretamente na proposta — não usa estado separado
    const marcar = (p: Proposta) => p.id === propostaId ? { ...p, avaliado: true } : p
    setRecebidas(prev => prev.map(marcar))
    setEnviadas(prev => prev.map(marcar))
    setAvalSalvando(false)
    setAvalModal(null)
  }

  async function apagar(id: string) {
    setOcultarIds(prev => new Set([...prev, id]))
    await fetch(`/api/propostas/${id}`, { method: 'DELETE', credentials: 'include' })
  }

  async function confirmar() {
    if (!confirmando || loading) return
    const { id, acao } = confirmando
    const novoStatus: 'aceita' | 'recusada' = acao === 'aceitar' ? 'aceita' : 'recusada'

    // Atualiza UI imediatamente (optimistic update)
    setConfirmando(null)
    if (novoStatus === 'recusada') {
      setOcultarIds(prev => new Set([...prev, id]))
    } else {
      const patch = (p: PropostaComPerfil) => p.id === id ? { ...p, status: novoStatus } : p
      setRecebidas(prev => prev.map(patch))
      setEnviadas(prev => prev.map(patch))
    }

    // Persiste no banco + dispara push via API
    setLoading(true)
    try {
      await fetch(`/api/propostas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novoStatus }),
      })
      if (acao === 'aceitar') {
        const [phone, bancaProxima] = await Promise.all([
          dbGetPhoneForProposta(id),
          fetchBancaProxima(),
        ])
        const addExtras = (p: Proposta) =>
          p.id === id ? { ...p, telefone: phone ?? p.telefone, bancaProxima } : p
        setRecebidas(prev => prev.map(addExtras))
        setEnviadas(prev => prev.map(addExtras))
      }
    } finally {
      setLoading(false)
    }
  }

  const pendentesRecebidas = recebidas.filter(p => p.status === 'pendente').length
  const pendentesEnviadas  = enviadas.filter(p => p.status === 'pendente').length

  const recebidasFiltradas = (filtro === 'todos' ? recebidas : recebidas.filter(p => p.tipo === filtro))
    .filter(p => !ocultarIds.has(p.id))
  const enviadasFiltradas  = (filtro === 'todos' ? enviadas  : enviadas.filter(p => p.tipo === filtro))
    .filter(p => !ocultarIds.has(p.id))

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

      {/* Filtro por tipo */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'todos',  label: 'Todos'  },
          { key: 'troca',  label: '🔄 Troca'  },
          { key: 'compra', label: '🛒 Compra' },
        ] as { key: Filtro; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-semibold transition-all border',
              filtro === f.key
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white text-slate-500 border-slate-200 hover:border-green-300 hover:text-green-600',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── RECEBIDAS ── */}
      {aba === 'recebidas' && (
        <div className="space-y-3 animate-fadein">
          {recebidasFiltradas.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-bold text-slate-700">
                {filtro === 'todos' ? 'Nenhuma proposta recebida' : `Nenhuma proposta de ${filtro} recebida`}
              </p>
              <p className="text-sm text-slate-400 mt-1">Quando alguém quiser trocar com você, aparece aqui.</p>
            </div>
          )}

          {recebidasFiltradas.map(p => {
            const st    = STATUS_CONFIG[p.status]
            const tipo  = TIPO_CONFIG[p.tipo]
            const phone = p.telefone
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
                      {p.eu_ofereco.map(n => <StickerPill key={n} num={n} albumId={p.album_id} />)}
                    </div>
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Quer receber ({p.eu_recebo.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.eu_recebo.map(n => <StickerPill key={n} num={n} albumId={p.album_id} />)}
                    </div>
                  </div>
                </div>

                {/* Balanço (só trocas) */}
                {p.tipo === 'troca' && (
                  <div className={[
                    'mx-3 mb-3 px-3 py-2 rounded-xl text-xs text-center font-semibold',
                    p.eu_ofereco.length === p.eu_recebo.length
                      ? 'bg-green-50 text-green-700'
                      : 'bg-blue-50 text-blue-700',
                  ].join(' ')}>
                    {p.eu_ofereco.length === p.eu_recebo.length
                      ? `✓ Troca ${p.eu_ofereco.length}×${p.eu_recebo.length} — mesma quantidade`
                      : `✨ Troca ${p.eu_ofereco.length}×${p.eu_recebo.length} — proporção personalizada`}
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

                {/* Aceita — revelar telefone + banca + avaliar */}
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
                    {p.bancaProxima && (
                      <BancaCard banca={p.bancaProxima} />
                    )}
                    {p.avaliado ? (
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
                  <div className="px-3 pb-3 flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center">
                      <p className="text-xs text-slate-500">Proposta recusada.</p>
                    </div>
                    <button onClick={() => apagar(p.id)}
                      className="shrink-0 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 text-xs font-semibold transition-colors">
                      🗑️ Apagar
                    </button>
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
          {enviadasFiltradas.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📤</p>
              <p className="font-bold text-slate-700">
                {filtro === 'todos' ? 'Nenhuma proposta enviada' : `Nenhuma proposta de ${filtro} enviada`}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Vá para{' '}
                <Link href="/matches" className="text-green-600 font-semibold">Matches</Link>
                {' '}e envie propostas.
              </p>
            </div>
          )}

          {enviadasFiltradas.map(p => {
            const st    = STATUS_CONFIG[p.status]
            const tipo  = TIPO_CONFIG[p.tipo]
            const phone = p.telefone
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
                      {p.eu_ofereco.map(n => <StickerPill key={n} num={n} albumId={p.album_id} />)}
                    </div>
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                      Você recebe ({p.eu_recebo.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.eu_recebo.map(n => <StickerPill key={n} num={n} albumId={p.album_id} />)}
                    </div>
                  </div>
                </div>

                {/* Aceita — revelar telefone + banca + avaliar */}
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
                    {p.bancaProxima && (
                      <BancaCard banca={p.bancaProxima} />
                    )}
                    {p.avaliado ? (
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
                  <div className="px-3 pb-3 flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center">
                      <p className="text-xs text-slate-500">{p.contraparte_nome} recusou esta proposta.</p>
                    </div>
                    <button onClick={() => apagar(p.id)}
                      className="shrink-0 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 text-xs font-semibold transition-colors">
                      🗑️ Apagar
                    </button>
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
