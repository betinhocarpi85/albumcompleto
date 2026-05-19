'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { albumCopa2026, buildGlobalNumberMap, type Album } from '@/data/album-copa-2026'
import { albumBrasileiraoMasc2026 } from '@/data/album-brasileirao-masc-2025'
import { albumBrasileiraoFem2026 } from '@/data/album-brasileirao-fem-2025'
import type { AlbumId } from '@/data/albums-registry'
import { ALBUMS_REGISTRY } from '@/data/albums-registry'

// totalStickers por álbum para filtrar categorias extras do mapa de info
const ALBUM_MAX_GNUMS: Record<string, number> = Object.fromEntries(
  ALBUMS_REGISTRY.map(a => [a.id, a.totalStickers])
)
import StickerSquare from '@/components/StickerSquare'
import { getSession, dbGetActiveAlbums, dbGetProfile, dbGetColadas, dbGetMatches, dbEnviarProposta, dbGetPlano } from '@/lib/db'
import BannerMenorDeIdade from '@/components/BannerMenorDeIdade'
import UpgradeModal from '@/components/UpgradeModal'

// ─── Mapas por álbum ─────────────────────────────────────────────────────────
interface StickerInfo { name: string; code: string; tipo: string; localNum: number }

function buildAlbumMaps(album: Album) {
  const sidToGlobal = buildGlobalNumberMap(album)
  const maxGnum     = ALBUM_MAX_GNUMS[album.id] ?? Infinity
  // Inclui apenas gnums dentro do total oficial — exclui XGOLD/XSILVER/etc.
  const globalInfo  = new Map<number, StickerInfo>()
  let counter = 1
  for (const cat of album.categories) {
    for (const s of cat.stickers) {
      if (counter <= maxGnum) {
        globalInfo.set(counter, { name: s.name, code: cat.code, tipo: s.type, localNum: s.number })
      }
      counter++
    }
  }
  return { globalInfo, sidToGlobal }
}

const ALBUM_MAPS: Record<string, ReturnType<typeof buildAlbumMaps>> = {
  'copa-2026':              buildAlbumMaps(albumCopa2026),
  'brasileirao-masc-2026': buildAlbumMaps(albumBrasileiraoMasc2026),
  'brasileirao-fem-2026':  buildAlbumMaps(albumBrasileiraoFem2026),
}

// Fallback Copa (para evitar undefined)
const { globalInfo: globalInfoMap, sidToGlobal } = ALBUM_MAPS['copa-2026']

function pronome(gender: 'M' | 'F') {
  return {
    ele:  gender === 'F' ? 'Ela'  : 'Ele',
    dele: gender === 'F' ? 'dela' : 'dele',
  }
}

type StickerTipo = 'normal' | 'brilhante' | 'escudo' | 'especial'
type MatchType   = 'exato' | 'parcial'
type Gender      = 'M' | 'F'

interface MatchUser    { name: string; city: string; avatar: string; avatarColor: string; rating: number; trades: number; gender: Gender }
interface VendaUser    { name: string; city: string; avatar: string; avatarColor: string; rating: number }
interface MatchRecord  { id: string; user: MatchUser; type: MatchType; temParaMim: number[]; euTenhoPara: number[]; balance: number }
interface VendaRecord  { id: string; user: VendaUser; items: { num: number; preco: number; tipo: StickerTipo }[] }

const AVATAR_COLORS = [
  'from-green-400 to-blue-500', 'from-purple-400 to-pink-500',
  'from-orange-400 to-red-500', 'from-cyan-400 to-teal-500',
  'from-indigo-400 to-purple-500', 'from-rose-400 to-orange-500',
]

function toMatchUser(u: { id: string; nome: string; cidade: string }): MatchUser {
  const parts = (u.nome ?? '').trim().split(' ').filter(Boolean)
  const avatar = ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase() || '?'
  const colorIdx = u.id.charCodeAt(0) % AVATAR_COLORS.length
  return { name: u.nome || 'Usuário', city: u.cidade || '', avatar, avatarColor: AVATAR_COLORS[colorIdx], rating: 5.0, trades: 0, gender: 'M' as Gender }
}

function toVendaUser(u: { id: string; nome: string; cidade: string }): VendaUser {
  const m = toMatchUser(u)
  return { name: m.name, city: m.city, avatar: m.avatar, avatarColor: m.avatarColor, rating: m.rating }
}

const POR_PAGINA = 10

type Tab        = 'trocas' | 'vendas'
type FiltroTipo = 'todos' | 'brilhante' | 'escudo' | 'especial'
type OrdemVenda = 'padrao' | 'preco-asc' | 'preco-desc' | 'avaliacao'
type FiltroTroca = 'todos' | 'exato' | 'parcial'

export default function MatchesPage() {
  const [tab, setTab]           = useState<Tab>('trocas')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [removidos,     setRemovidos]     = useState<Record<string, Set<number>>>({})
  const [removidosDele, setRemovidosDele] = useState<Record<string, Set<number>>>({})
  const [pagina, setPagina]         = useState(0)
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const [ordemVenda, setOrdemVenda] = useState<OrdemVenda>('padrao')
  const [filtroTroca, setFiltroTroca] = useState<FiltroTroca>('todos')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [propostaDuplicada, setPropostaDuplicada] = useState(false)
  const [propostaSucesso, setPropostaSucesso] = useState<{ nome: string } | null>(null)
  const [interesseEnviado, setInteresseEnviado] = useState<Record<string, boolean>>({})
  const [adulto, setAdulto]         = useState(true)
  const [isPro, setIsPro]           = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [meuTenhoSet,   setMeuTenhoSet]   = useState<Set<number>>(new Set())
  const [meuPrecisoSet, setMeuPrecisoSet] = useState<Set<number>>(new Set())
  const [matches,  setMatches]  = useState<MatchRecord[]>([])
  const [vendas,   setVendas]   = useState<VendaRecord[]>([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [albumId,      setAlbumId]      = useState<AlbumId>('copa-2026')
  const [activeAlbums, setActiveAlbums] = useState<AlbumId[]>([])
  const [mostrarSeletor, setMostrarSeletor] = useState(false)

  function trocarAlbum(id: AlbumId) {
    setAlbumId(id)
    setMostrarSeletor(false)
    setMatches([]); setVendas([])
    setLoadingMatches(true)
    carregarMatches(id)
  }

  function processarResultado(id: AlbumId, coladas: string[], result: { trocas: unknown[]; vendas: unknown[] }) {
    const maps = ALBUM_MAPS[id] ?? ALBUM_MAPS['copa-2026']
    const coladasSet = new Set(coladas)
    const tenho = new Set<number>(); const preciso = new Set<number>()
    for (const [sid, gnum] of maps.sidToGlobal) {
      if (coladasSet.has(sid)) tenho.add(gnum); else preciso.add(gnum)
    }
    setMeuTenhoSet(tenho); setMeuPrecisoSet(preciso)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMatches((result.trocas as any[]).map((t: any) => ({
      id: t.id, user: toMatchUser(t),
      type: (t.tem_para_mim.length === t.eu_tenho_para.length ? 'exato' : 'parcial') as MatchType,
      temParaMim: t.tem_para_mim, euTenhoPara: t.eu_tenho_para,
      balance: t.eu_tenho_para.length - t.tem_para_mim.length,
    })))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setVendas((result.vendas as any[]).map((v: any) => ({
      id: v.id, user: toVendaUser(v),
      items: v.items.map((i: any) => ({ num: i.gnum, preco: i.preco, tipo: (i.tipo ?? 'normal') as StickerTipo })),
    })))
    setLoadingMatches(false)
  }

  async function carregarMatches(id: AlbumId) {
    const [coladas, result] = await Promise.all([dbGetColadas(id), dbGetMatches(id)])
    processarResultado(id, coladas, result)
  }

  useEffect(() => {
    getSession().then(session => {
      if (!session) { setAdulto(true); setLoadingMatches(false); return }
      dbGetProfile().then(p => setAdulto(!!p.maior18))
      dbGetPlano().then(({ plano }) => setIsPro(plano === 'pro'))
      dbGetActiveAlbums().then(ids => {
        setActiveAlbums(ids)
        const id = ids[0] ?? 'copa-2026'
        setAlbumId(id)
        Promise.all([dbGetColadas(id), dbGetMatches(id)]).then(([coladas, result]) => {
          processarResultado(id, coladas, result)
        })
      })
    })
  }, [])

  const vendasFiltradas = useMemo(() => {
    let lista = [...vendas]
    if (filtroTipo !== 'todos') lista = lista.filter(v => v.items.some(i => i.tipo === filtroTipo))
    if (ordemVenda === 'preco-asc')  lista.sort((a, b) => Math.min(...a.items.map(i => i.preco)) - Math.min(...b.items.map(i => i.preco)))
    if (ordemVenda === 'preco-desc') lista.sort((a, b) => Math.max(...b.items.map(i => i.preco)) - Math.max(...a.items.map(i => i.preco)))
    if (ordemVenda === 'avaliacao')  lista.sort((a, b) => b.user.rating - a.user.rating)
    return lista
  }, [filtroTipo, ordemVenda, vendas])

  const totalPaginas = Math.ceil(vendasFiltradas.length / POR_PAGINA)
  const vendaPagina  = vendasFiltradas.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)

  function toggleRemovido(matchId: string, num: number) {
    setRemovidos(prev => {
      const next = new Set(prev[matchId] ?? [])
      if (next.has(num)) next.delete(num); else next.add(num)
      return { ...prev, [matchId]: next }
    })
  }
  function toggleRemovidoDele(matchId: string, num: number) {
    setRemovidosDele(prev => {
      const next = new Set(prev[matchId] ?? [])
      if (next.has(num)) next.delete(num); else next.add(num)
      return { ...prev, [matchId]: next }
    })
  }

  async function enviarProposta(match: MatchRecord, oferta: number[], recebe: number[]) {
    const { error } = await dbEnviarProposta(match.id, albumId, oferta, recebe, 'troca')
    if (error === 'JA_ENVIADA') { setPropostaDuplicada(true); return }
    if (error) { alert('Não foi possível enviar a proposta. Tente novamente.'); return }
    setPropostaSucesso({ nome: match.user.name.split(' ')[0] })
  }

  async function enviarInteresse(userId: string, nome: string, stickers: number[], tipo: 'compra') {
    const { error } = await dbEnviarProposta(userId, albumId, [], stickers, tipo)
    if (error === 'JA_ENVIADA') { setPropostaDuplicada(true); return }
    if (error) { alert('Não foi possível enviar. Tente novamente.'); return }
    setInteresseEnviado(prev => ({ ...prev, [userId]: true }))
    setPropostaSucesso({ nome: nome.split(' ')[0] })
  }

  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // ── Seletor de álbum (helper inline) ────────────────────────────────────────
  function AlbumSelector() {
    if (activeAlbums.length <= 1) return null
    const meta = ALBUMS_REGISTRY.find(a => a.id === albumId)!
    return (
      <div className="mb-4">
        <button onClick={() => setMostrarSeletor(s => !s)}
          className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 hover:bg-slate-50 transition-colors shadow-sm">
          <span className="text-2xl">{meta.emoji}</span>
          <div className="flex-1 text-left min-w-0">
            <p className="font-black text-sm text-slate-800 truncate">{meta.name}</p>
            <p className="text-xs text-slate-400">{meta.description}</p>
          </div>
          <span className="text-slate-400 text-xs flex-shrink-0">Trocar ▼</span>
        </button>
        {mostrarSeletor && (
          <div className="mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden animate-fadein">
            {ALBUMS_REGISTRY.filter(a => activeAlbums.includes(a.id)).map(a => (
              <button key={a.id} onClick={() => trocarAlbum(a.id)}
                className={['w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-slate-50 last:border-0',
                  a.id === albumId ? 'bg-green-50' : 'hover:bg-slate-50'].join(' ')}>
                <span className="text-xl">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{a.name}</p>
                  <p className="text-xs text-slate-400">{a.description}</p>
                </div>
                {a.id === albumId && <span className="text-green-500 text-sm flex-shrink-0">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Mapa de info do álbum atual (para renderizar nomes de figurinhas)
  const currentGlobalInfo = ALBUM_MAPS[albumId]?.globalInfo ?? globalInfoMap

  return (
    <div className="max-w-2xl mx-auto py-4 animate-fadein">
      <BannerMenorDeIdade />

      {/* Modal upgrade PRO */}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <div className="px-3">

        {/* Modal proposta duplicada */}
        {propostaDuplicada && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setPropostaDuplicada(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadein text-center">
              <p className="text-4xl mb-2">⏳</p>
              <p className="font-black text-slate-800 text-lg mb-1">Proposta já enviada</p>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                Você já tem uma proposta <strong>pendente</strong> com este usuário para este álbum.
                Aguarde a resposta antes de enviar outra.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPropostaDuplicada(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Fechar
                </button>
                <Link
                  href="/propostas"
                  onClick={() => setPropostaDuplicada(false)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold text-center transition-colors"
                >
                  Ver propostas →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Modal proposta/interesse enviado */}
        {propostaSucesso && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setPropostaSucesso(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadein">

              {/* Header */}
              <div className="text-center mb-4">
                <p className="text-4xl mb-2">🤝</p>
                <p className="font-black text-slate-800 text-lg">Proposta enviada!</p>
                <p className="text-sm text-slate-500 mt-1">
                  <strong>{propostaSucesso.nome}</strong> receberá sua proposta e poderá aceitar ou recusar.
                  Quando aceita, vocês recebem o contato um do outro para combinar a troca diretamente.
                </p>
              </div>

              {/* Aguarde */}
              <div className="bg-blue-50 rounded-xl px-4 py-3 mb-3">
                <p className="text-xs font-bold text-blue-700 mb-1.5">⏳ O que acontece agora?</p>
                {[
                  'Aguarde a resposta — você será notificado quando aceitar ou recusar',
                  'Não envie múltiplas propostas para o mesmo usuário',
                  'Você pode acompanhar em "Propostas" a qualquer momento',
                ].map(t => (
                  <p key={t} className="text-xs text-blue-600 leading-relaxed">• {t}</p>
                ))}
              </div>

              {/* Segurança */}
              <div className="bg-amber-50 rounded-xl px-4 py-3 mb-4">
                <p className="text-xs font-bold text-amber-700 mb-1.5">🔒 Sua segurança em primeiro lugar</p>
                {[
                  'Combine a troca somente após a confirmação na plataforma',
                  'Prefira locais públicos e movimentados para a entrega',
                  'Não envie figurinhas antes de receber as suas',
                  'Em caso de problema, use o botão de denúncia no perfil',
                ].map(t => (
                  <p key={t} className="text-xs text-amber-700 leading-relaxed">• {t}</p>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPropostaSucesso(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Fechar
                </button>
                <Link
                  href="/propostas"
                  onClick={() => setPropostaSucesso(null)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold text-center transition-colors"
                >
                  Ver propostas →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-black text-slate-800">Matches</h1>
          <p className="text-sm text-slate-500">Colecionadores com figurinhas do seu interesse</p>
        </div>

        {/* Seletor de álbum */}
        <AlbumSelector />

        {/* Banner de status */}
        {loadingMatches ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-5 mb-4 text-center">
            <span className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin inline-block mb-2" />
            <p className="text-sm text-slate-400">Buscando matches...</p>
          </div>
        ) : matches.length + vendas.length > 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-sm font-bold text-green-800">{matches.length + vendas.length} matches encontrados!</p>
              <p className="text-xs text-green-600">Trocas e vendas com figurinhas que você precisa</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-5 mb-4 text-center">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-bold text-slate-700 mb-1">Nenhum match ainda</p>
            <p className="text-xs text-slate-500 mb-3">Marque suas figurinhas no álbum e publique anúncios para o sistema encontrar matches automaticamente.</p>
            <div className="flex gap-2 justify-center">
              <a href="/album" className="text-xs bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-xl transition-colors">📋 Marcar álbum</a>
              <a href="/anuncios" className="text-xs bg-slate-700 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition-colors">📢 Publicar anúncio</a>
            </div>
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-1.5 mb-4">
          {([
            { key: 'trocas', label: `🔁 Trocas (${matches.length})` },
            { key: 'vendas', label: `💰 Vendas (${vendas.length})` },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={['flex-1 py-2.5 rounded-xl text-xs font-bold transition-all', tab === t.key ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TROCAS ── */}
        {tab === 'trocas' && (
          <div className="space-y-3 animate-fadein">
            <div className="flex gap-1.5">
              {([
                { key: 'todos',   label: 'Todos' },
                { key: 'exato',   label: '✓ Match exato' },
                { key: 'parcial', label: '≈ Match parcial' },
              ] as { key: FiltroTroca; label: string }[]).map(f => (
                <button key={f.key} onClick={() => setFiltroTroca(f.key)}
                  className={['px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all', filtroTroca === f.key ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'].join(' ')}>
                  {f.label}
                </button>
              ))}
            </div>

            {matches.filter(match => {
              const rem    = removidos[match.id]     ?? new Set<number>()
              const remDel = removidosDele[match.id] ?? new Set<number>()
              const bal    = match.euTenhoPara.filter(n => !rem.has(n)).length - match.temParaMim.filter(n => !remDel.has(n)).length
              if (filtroTroca === 'exato')   return bal === 0
              if (filtroTroca === 'parcial') return bal !== 0
              return true
            }).map(match => {
              const rem         = removidos[match.id]     ?? new Set<number>()
              const remDele     = removidosDele[match.id] ?? new Set<number>()
              const oferta      = match.euTenhoPara.filter(n => !rem.has(n))
              const deles       = match.temParaMim.filter(n => !remDele.has(n))
              const dynBalance  = oferta.length - deles.length
              const equilibrado = dynBalance === 0
              const isOpen      = expanded === match.id
              const p           = pronome(match.user.gender)

              return (
                <div key={match.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 flex items-center gap-3">
                    <Link href={`/perfil/${match.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${match.user.avatarColor} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-xs font-black">{match.user.avatar}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-slate-800">{match.user.name}</p>
                          <span className={['text-[10px] font-bold px-2 py-0.5 rounded-full', equilibrado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'].join(' ')}>
                            {equilibrado ? '✓ Match exato' : '≈ Match parcial'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{match.user.city} · ⭐ {match.user.rating}</p>
                      </div>
                    </Link>
                    <button onClick={() => setExpanded(isOpen ? null : match.id)} className="text-slate-400 text-sm px-2 flex-shrink-0">
                      {isOpen ? '▲' : '▼'}
                    </button>
                  </div>

                  <div className="px-4 pb-3 flex items-center gap-3 text-xs text-slate-500">
                    <span><span className="text-blue-500 font-bold">{p.ele} tem:</span> <span className="font-semibold text-slate-700">{deles.length} fig. suas</span></span>
                    <span className="text-slate-300">·</span>
                    <span><span className="text-green-500 font-bold">Você tem:</span> <span className="font-semibold text-slate-700">{oferta.length} fig. {p.dele}</span></span>
                    {!equilibrado && <><span className="text-slate-300">·</span><span className="text-amber-600 font-medium">{dynBalance > 0 ? `${dynBalance} a mais` : `${Math.abs(dynBalance)} a menos`}</span></>}
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-slate-50 pt-3 animate-fadein">
                      <p className="text-[11px] text-slate-400 text-center mb-3">Toque em qualquer figurinha para removê-la da proposta</p>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs font-semibold text-blue-600 mb-2">🔵 Para você</p>
                          <div className="flex flex-wrap gap-1.5">
                            {match.temParaMim.map(num => {
                              const info = currentGlobalInfo.get(num)
                              const removido = remDele.has(num)
                              return (
                                <button key={num} onClick={() => toggleRemovidoDele(match.id, num)}
                                  title={info ? `${info.code}-${info.localNum} · ${info.name}` : `#${num}`}
                                  className={['w-9 h-9 rounded-lg border-2 flex flex-col items-center justify-center gap-0 transition-all active:scale-90',
                                    removido ? 'bg-slate-100 border-slate-200 text-slate-300 opacity-50' : 'bg-blue-50 border-blue-300 text-blue-700 hover:border-red-300 hover:bg-red-50'].join(' ')}>
                                  {removido ? (
                                    <span className="text-[10px] font-bold leading-none">✕</span>
                                  ) : info ? (
                                    <>
                                      {info.code.length <= 4 && <span className="text-[7px] font-bold leading-none opacity-60">{info.code}</span>}
                                      <span className="text-[10px] font-black leading-none">{info.localNum}</span>
                                    </>
                                  ) : (
                                    <span className="text-[10px] font-bold leading-none">{num}</span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-green-600 mb-2">🟢 Sua oferta</p>
                          <div className="flex flex-wrap gap-1.5">
                            {match.euTenhoPara.map(num => {
                              const info = currentGlobalInfo.get(num)
                              const removido = rem.has(num)
                              return (
                                <button key={num} onClick={() => toggleRemovido(match.id, num)}
                                  title={info ? `${info.code}-${info.localNum} · ${info.name}` : `#${num}`}
                                  className={['w-9 h-9 rounded-lg border-2 flex flex-col items-center justify-center gap-0 transition-all active:scale-90',
                                    removido ? 'bg-slate-100 border-slate-200 text-slate-300 opacity-50' : 'bg-green-50 border-green-300 text-green-700 hover:border-red-300 hover:bg-red-50'].join(' ')}>
                                  {removido ? (
                                    <span className="text-[10px] font-bold leading-none">✕</span>
                                  ) : info ? (
                                    <>
                                      {info.code.length <= 4 && <span className="text-[7px] font-bold leading-none opacity-60">{info.code}</span>}
                                      <span className="text-[10px] font-black leading-none">{info.localNum}</span>
                                    </>
                                  ) : (
                                    <span className="text-[10px] font-bold leading-none">{num}</span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Info da proporção */}
                      {oferta.length > 0 && deles.length > 0 && (
                        <div className={['rounded-xl px-3 py-2.5 mb-3 text-xs font-semibold text-center',
                          equilibrado
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : 'bg-blue-50 border border-blue-200 text-blue-700',
                        ].join(' ')}>
                          {equilibrado
                            ? `✅ Troca ${oferta.length}×${deles.length} — mesma quantidade dos dois lados`
                            : `✨ Troca ${oferta.length}×${deles.length} — proporção personalizada`}
                        </div>
                      )}
                      {(oferta.length === 0 || deles.length === 0) && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-3 text-xs text-red-600 text-center">
                          ⚠️ Adicione ao menos 1 figurinha de cada lado
                        </div>
                      )}

                      {adulto ? (
                        <button
                          disabled={oferta.length === 0 || deles.length === 0}
                          onClick={() => {
                            if (oferta.length === 0 || deles.length === 0) return
                            isPro ? enviarProposta(match, oferta, deles) : setShowUpgrade(true)
                          }}
                          className={['w-full font-bold py-3 rounded-xl text-sm transition-colors',
                            oferta.length > 0 && deles.length > 0
                              ? 'bg-blue-500 hover:bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                          ].join(' ')}>
                          🔁 Enviar proposta {oferta.length}×{deles.length}
                        </button>
                      ) : (
                        <div className="w-full py-3 rounded-xl text-sm text-center bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
                          🔒 Trocas disponíveis apenas para maiores de 18
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── VENDAS ── */}
        {tab === 'vendas' && (
          <div className="animate-fadein">
            {/* Filtros */}
            <div className="mb-3">
              <button onClick={() => setMostrarFiltros(f => !f)}
                className={['flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all mb-2', mostrarFiltros || filtroTipo !== 'todos' || ordemVenda !== 'padrao' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'].join(' ')}>
                🔽 Filtrar e ordenar
                {(filtroTipo !== 'todos' || ordemVenda !== 'padrao') && (
                  <span className="w-4 h-4 rounded-full bg-green-500 text-[9px] text-white flex items-center justify-center font-black">
                    {(filtroTipo !== 'todos' ? 1 : 0) + (ordemVenda !== 'padrao' ? 1 : 0)}
                  </span>
                )}
              </button>
              {mostrarFiltros && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 animate-fadein">
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-2">Tipo de figurinha</p>
                    <div className="flex flex-wrap gap-1.5">
                      {([
                        { key: 'todos', label: 'Todas' }, { key: 'brilhante', label: '✨ Brilhante' },
                        { key: 'escudo', label: '🛡 Escudo' }, { key: 'especial', label: '⭐ Especial' },
                      ] as { key: FiltroTipo; label: string }[]).map(f => (
                        <button key={f.key} onClick={() => { setFiltroTipo(f.key); setPagina(0) }}
                          className={['px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', filtroTipo === f.key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'].join(' ')}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-2">Ordenar por</p>
                    <div className="flex flex-wrap gap-1.5">
                      {([
                        { key: 'padrao', label: 'Padrão' }, { key: 'preco-asc', label: '💰 Menor preço' },
                        { key: 'preco-desc', label: '💰 Maior preço' }, { key: 'avaliacao', label: '⭐ Melhor avaliação' },
                      ] as { key: OrdemVenda; label: string }[]).map(o => (
                        <button key={o.key} onClick={() => { setOrdemVenda(o.key); setPagina(0) }}
                          className={['px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', ordemVenda === o.key ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'].join(' ')}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(filtroTipo !== 'todos' || ordemVenda !== 'padrao') && (
                    <button onClick={() => { setFiltroTipo('todos'); setOrdemVenda('padrao'); setPagina(0) }} className="text-xs text-red-500 font-semibold">× Limpar filtros</button>
                  )}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-center mb-3">
              <p className="text-xs text-blue-600">📱 Ao manifestar interesse, o vendedor recebe sua solicitação. Se aceitar, ambos recebem o contato para combinar diretamente.</p>
            </div>
            <p className="text-xs text-slate-400 text-center mb-3">
              {vendasFiltradas.length} vendedor{vendasFiltradas.length !== 1 ? 'es' : ''} encontrado{vendasFiltradas.length !== 1 ? 's' : ''}
              {filtroTipo !== 'todos' ? ` com figurinhas ${filtroTipo}` : ''}
            </p>

            <div className="space-y-3">
              {vendaPagina.map(v => {
                const isOpen    = expanded === v.id
                const jaEnviou  = interesseEnviado[v.id] ?? false
                const itensNeed = meuTenhoSet.size > 0 ? v.items.filter(i => !meuTenhoSet.has(i.num)) : v.items
                const precos    = itensNeed.length > 0 ? itensNeed.map(i => i.preco) : v.items.map(i => i.preco)
                const pMin = Math.min(...precos), pMax = Math.max(...precos)
                const faixa = pMin === pMax ? fmtBRL(pMin) : `${fmtBRL(pMin)} – ${fmtBRL(pMax)}`

                return (
                  <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <button onClick={() => setExpanded(isOpen ? null : v.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                      <Link href={`/perfil/${v.id}`} onClick={e => e.stopPropagation()} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${v.user.avatarColor} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-xs font-black">{v.user.avatar}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-800">{v.user.name}</p>
                          <p className="text-xs text-slate-400">{v.user.city} · ⭐ {v.user.rating}</p>
                        </div>
                      </Link>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 text-right">
                        <span className="text-[10px] font-semibold text-slate-500">{itensNeed.length} fig. que você precisa</span>
                        <span className="text-[10px] text-slate-400">{faixa}</span>
                      </div>
                      <span className="text-slate-400 text-xs ml-1">{isOpen ? '▲' : '▼'}</span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-50 px-4 pt-3 pb-4 animate-fadein">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {v.items.map(item => {
                            const jaColada    = meuTenhoSet.size > 0 && meuTenhoSet.has(item.num)
                            const isBrilhante = item.tipo === 'brilhante'
                            const isEscudo    = item.tipo === 'escudo'
                            const info        = currentGlobalInfo.get(item.num)
                            return (
                              <div key={item.num}
                                title={info ? `${info.code}-${info.localNum} · ${info.name} · ${fmtBRL(item.preco)}${jaColada ? ' · Já colada!' : ''}` : `#${item.num}`}
                                className={['w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center gap-0 select-none',
                                  jaColada ? 'bg-slate-50 border-slate-100 text-slate-300 opacity-40'
                                    : isBrilhante ? 'bg-amber-50 border-amber-300 text-amber-700'
                                    : isEscudo ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                    : 'bg-white border-slate-200 text-slate-600'].join(' ')}>
                                {jaColada ? (
                                  <span className="text-[10px] font-bold leading-none">✓</span>
                                ) : (
                                  <>
                                    {info && info.code.length <= 4 && <span className="text-[7px] font-bold leading-none opacity-60">{info.code}</span>}
                                    <span className="text-[10px] font-black leading-none">{info ? info.localNum : item.num}</span>
                                    <span className="text-[8px] leading-none font-semibold opacity-75">{fmtBRL(item.preco).replace('R$ ', 'R$')}</span>
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>
                        {meuTenhoSet.size > 0 && v.items.some(i => meuTenhoSet.has(i.num)) && (
                          <p className="text-[10px] text-slate-400 text-center -mt-2 mb-3">Figurinhas acinzentadas já estão no seu álbum</p>
                        )}
                        {adulto ? (
                          jaEnviou ? (
                            <div className="w-full py-3 rounded-xl text-sm text-center bg-green-50 border border-green-200 text-green-700 font-bold">
                              ✓ Interesse enviado! Aguardando {v.user.name.split(' ')[0]} aceitar.
                            </div>
                          ) : (
                            <button onClick={() => enviarInteresse(v.id, v.user.name, v.items.map(i => i.num), 'compra')}
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                              💬 Tenho interesse — contatar vendedor
                            </button>
                          )
                        ) : (
                          <div className="w-full py-3 rounded-xl text-sm text-center bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
                            🔒 Compras disponíveis apenas para maiores de 18
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-4">
                <button onClick={() => { setPagina(p => Math.max(0, p - 1)); setExpanded(null) }} disabled={pagina === 0}
                  className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 text-sm disabled:opacity-30 hover:bg-slate-50 transition-colors">‹</button>
                {Array.from({ length: totalPaginas }, (_, i) => (
                  <button key={i} onClick={() => { setPagina(i); setExpanded(null) }}
                    className={['w-9 h-9 rounded-xl text-sm font-bold transition-all', pagina === i ? 'bg-slate-800 text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'].join(' ')}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => { setPagina(p => Math.min(totalPaginas - 1, p + 1)); setExpanded(null) }} disabled={pagina === totalPaginas - 1}
                  className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 text-sm disabled:opacity-30 hover:bg-slate-50 transition-colors">›</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
