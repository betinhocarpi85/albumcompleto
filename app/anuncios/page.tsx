'use client'

import { useState, useMemo, useEffect } from 'react'
import { albumCopa2026, buildGlobalNumberMap, stickerId, type Album } from '@/data/album-copa-2026'
import type { StickerType } from '@/data/album-copa-2026'
import { albumBrasileiraoMasc2026 } from '@/data/album-brasileirao-masc-2025'
import { albumBrasileiraoFem2026 } from '@/data/album-brasileirao-fem-2025'
import type { AlbumId } from '@/data/albums-registry'
import { dbGetActiveAlbums, dbGetAnuncios, dbSaveAnuncios, dbGetColadas, getSession } from '@/lib/db'
import { ALBUMS_REGISTRY } from '@/data/albums-registry'

// totalStickers por álbum para excluir categorias extras da tela de anúncios
const ALBUM_MAX_GNUMS: Record<string, number> = Object.fromEntries(
  ALBUMS_REGISTRY.map(a => [a.id, a.totalStickers])
)
import BannerMenorDeIdade from '@/components/BannerMenorDeIdade'

type TipoAnuncio = 'venda' | 'troca'
type Tab         = 'disponiveis' | 'anunciadas'
type SubTab      = TipoAnuncio

interface AnuncioLocal {
  key:     string   // sid__acao
  sid:     string
  gNum:    number
  nome:    string
  catName: string
  tipo:    StickerType
  acao:    TipoAnuncio
  preco:   string
}

// Modal apenas para venda (definir preço)
interface VendaModal {
  key:   string
  sid:   string
  gNum:  number
  nome:  string
  tipo:  StickerType
  preco: string
  isNew: boolean
}

// ─── Dados de figurinhas por álbum ──────────────────────────────────────────

export interface StickerFlat {
  sid: string; gNum: number; localNum: number; catCode: string; nome: string; catName: string
  catId: string; catFlag: string; tipo: StickerType
}

function buildAlbumData(album: Album) {
  const gNums  = buildGlobalNumberMap(album)
  const maxGnum = ALBUM_MAX_GNUMS[album.id] ?? Infinity
  // Filtra apenas stickers oficiais (gnums ≤ totalStickers) — exclui XGOLD/XSILVER/etc.
  const flat: StickerFlat[] = album.categories.flatMap(cat =>
    cat.stickers
      .map(s => ({
        sid:      stickerId(cat.code, s.number),
        gNum:     gNums.get(stickerId(cat.code, s.number)) ?? 0,
        localNum: s.number,
        catCode:  cat.code,
        nome:     s.name,
        catName:  cat.name,
        catId:    cat.id,
        catFlag:  cat.flag ?? '📌',
        tipo:     s.type as StickerType,
      }))
      .filter(s => s.gNum > 0 && s.gNum <= maxGnum)
  )
  const porTipo: Record<StickerType, { catId: string; catName: string; catFlag: string; stickers: StickerFlat[] }[]> = {
    normal: [], escudo: [], brilhante: [], especial: [],
    'extra-gold': [], 'extra-silver': [], 'extra-bronze': [], 'extra-purple': [], 'coca-cola': [],
  }
  for (const cat of album.categories) {
    for (const tipo of Object.keys(porTipo) as StickerType[]) {
      const stickers = flat.filter(s => s.catId === cat.id && s.tipo === tipo)
      if (stickers.length) porTipo[tipo].push({ catId: cat.id, catName: cat.name, catFlag: cat.flag ?? '📌', stickers })
    }
  }
  return { flat, porTipo, album }
}

const ALBUM_DATA: Record<string, ReturnType<typeof buildAlbumData>> = {
  'copa-2026':              buildAlbumData(albumCopa2026),
  'brasileirao-masc-2026': buildAlbumData(albumBrasileiraoMasc2026),
  'brasileirao-fem-2026':  buildAlbumData(albumBrasileiraoFem2026),
}

const PRECO_SUGERIDO: Record<StickerType, string> = {
  normal: '3.00', escudo: '4.00', brilhante: '8.00', especial: '5.00',
  'extra-gold': '80.00', 'extra-silver': '30.00', 'extra-bronze': '15.00', 'extra-purple': '8.00',
  'coca-cola': '20.00',
}

const TIPO_META: { key: StickerType; label: string; icon: string; desc: string }[] = [
  { key: 'normal',        label: 'Normais',         icon: '⬜', desc: 'Jogadores comuns'              },
  { key: 'escudo',        label: 'Escudos',         icon: '🛡️', desc: 'Escudo de cada seleção'       },
  { key: 'brilhante',     label: 'Brilhantes',      icon: '✨', desc: 'Figurinhas foil especiais'      },
  { key: 'especial',      label: 'Especiais',       icon: '⭐', desc: 'Fotos de time e intro'          },
  { key: 'coca-cola',     label: 'Coca-Cola',       icon: '🔴', desc: 'Exclusivas Coca-Cola (tampinha)'},
  { key: 'extra-gold',    label: 'Extra Dourada',   icon: '🟡', desc: '20 estrelas — versão ouro'     },
  { key: 'extra-silver',  label: 'Extra Prateada',  icon: '⚪', desc: '20 estrelas — versão prata'    },
  { key: 'extra-bronze',  label: 'Extra Bronze',    icon: '🟠', desc: '20 estrelas — versão bronze'   },
  { key: 'extra-purple',  label: 'Extra Roxa',      icon: '🟣', desc: '20 estrelas — versão roxa'     },
]

const TIPO_ICON: Record<StickerType, string> = {
  normal: '', escudo: '🛡️', brilhante: '✨', especial: '⭐',
  'coca-cola': '🔴', 'extra-gold': '🟡', 'extra-silver': '⚪', 'extra-bronze': '🟠', 'extra-purple': '🟣',
}

function makeKey(sid: string, acao: TipoAnuncio) { return `${sid}__${acao}` }

export default function AnunciosPage() {
  const [albumId,       setAlbumId]       = useState<AlbumId>('copa-2026')
  const [activeAlbums,  setActiveAlbums]  = useState<AlbumId[]>([])
  const [mostrarSeletor, setMostrarSeletor] = useState(false)
  const [adulto,   setAdulto]   = useState(true)
  const [coladas,  setColadas]  = useState<Set<string>>(new Set())
  const [anuncios, setAnuncios] = useState<AnuncioLocal[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<Tab>('disponiveis')
  const [subTab,   setSubTab]   = useState<SubTab>('troca')
  const [modal,    setModal]    = useState<VendaModal | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [salvo,    setSalvo]    = useState(false)
  const [filtroAcao, setFiltroAcao]   = useState<TipoAnuncio>('troca')
  // disponíveis
  const [openTipos, setOpenTipos]     = useState<Set<StickerType>>(new Set(['normal']))
  const [openCats,  setOpenCats]      = useState<Set<string>>(new Set())
  // anunciadas
  const [openTiposAn, setOpenTiposAn] = useState<Set<StickerType>>(new Set(['normal']))
  const [openCatsAn,  setOpenCatsAn]  = useState<Set<string>>(new Set())

  // Dados do álbum atual (derivados do albumId, sem hook)
  const { flat: allStickersFlat, porTipo: porTipoECat } = ALBUM_DATA[albumId] ?? ALBUM_DATA['copa-2026']

  useEffect(() => {
    getSession().then(session => {
      if (!session) { setLoading(false); return }
      dbGetActiveAlbums().then(ids => {
        setActiveAlbums(ids)
        const id = ids[0] ?? 'copa-2026'
        setAlbumId(id)
        Promise.all([dbGetColadas(id), dbGetAnuncios(id, 'tenho')]).then(([col, saved]) => {
          const coladasSet = new Set(col)
          setColadas(coladasSet)
          setAnuncios(saved.map(a => {
            // limpa chaves compostas legadas (sid__troca → sid)
            const rawSid = a.sid.replace(/__(?:troca|venda)$/, '')
            const acao: TipoAnuncio = a.preco != null && a.preco > 0 ? 'venda' : 'troca'
            const info = allStickersFlat.find(s => s.sid === rawSid)
            return {
              key:     makeKey(rawSid, acao),
              sid:     rawSid,
              gNum:    typeof a.gNum === 'number' ? a.gNum : Number(a.gNum) || 0,
              nome:    a.nome,
              catName: info?.catName ?? '',
              tipo:    a.tipo as StickerType,
              acao,
              preco:   a.preco != null && a.preco > 0 ? String(a.preco.toFixed(2)) : '',
            }
          }))
          setLoading(false)
        })
      })
    })
  }, [])

  const anunciadosKeys = useMemo(() => new Set(anuncios.map(a => a.key)), [anuncios])

  // Contagem total disponível por sub-aba
  const countDisp = (acao: TipoAnuncio) =>
    allStickersFlat.filter(s => coladas.has(s.sid) && !anunciadosKeys.has(makeKey(s.sid, acao))).length

  function toggleTipo(t: StickerType) {
    setOpenTipos(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n })
  }
  function toggleCat(id: string) {
    setOpenCats(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleTipoAn(t: StickerType) {
    setOpenTiposAn(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n })
  }
  function toggleCatAn(id: string) {
    setOpenCatsAn(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function trocarAlbum(id: AlbumId) {
    setAlbumId(id)
    setMostrarSeletor(false)
    setAnuncios([])
    setColadas(new Set())
    setLoading(true)
    const flat = ALBUM_DATA[id]?.flat ?? ALBUM_DATA['copa-2026'].flat
    const [col, saved] = await Promise.all([dbGetColadas(id), dbGetAnuncios(id, 'tenho')])
    const coladasSet = new Set(col)
    setColadas(coladasSet)
    setAnuncios(saved.map(a => {
      const rawSid = a.sid.replace(/__(?:troca|venda)$/, '')
      const acao: TipoAnuncio = a.preco != null && a.preco > 0 ? 'venda' : 'troca'
      const info = flat.find(s => s.sid === rawSid)
      return {
        key: makeKey(rawSid, acao), sid: rawSid,
        gNum: typeof a.gNum === 'number' ? a.gNum : Number(a.gNum) || 0,
        nome: a.nome, catName: info?.catName ?? '',
        tipo: a.tipo as StickerType, acao,
        preco: a.preco != null && a.preco > 0 ? String(a.preco.toFixed(2)) : '',
      }
    }))
    setLoading(false)
  }

  // Troca: toggle direto sem modal
  async function toggleTroca(s: StickerFlat) {
    if (!adulto) return
    const key = makeKey(s.sid, 'troca')
    const jaAnunciado = anunciadosKeys.has(key)
    const next = jaAnunciado
      ? anuncios.filter(a => a.key !== key)
      : [...anuncios, {
          key, sid: s.sid, gNum: s.gNum, nome: s.nome,
          catName: s.catName, tipo: s.tipo, acao: 'troca' as TipoAnuncio, preco: '',
        }]
    setAnuncios(next)
    await salvar(next)
  }

  // Venda: abre modal só para definir preço
  function abrirModalVenda(s: typeof allStickersFlat[0]) {
    if (!adulto) return
    setModal({ key: makeKey(s.sid, 'venda'), sid: s.sid, gNum: s.gNum, nome: s.nome,
      tipo: s.tipo, preco: PRECO_SUGERIDO[s.tipo], isNew: true })
  }

  function editarModalVenda(a: AnuncioLocal) {
    setModal({ key: a.key, sid: a.sid, gNum: a.gNum, nome: a.nome,
      tipo: a.tipo, preco: a.preco || PRECO_SUGERIDO[a.tipo], isNew: false })
  }

  async function confirmarModal() {
    if (!modal) return
    const novo: AnuncioLocal = {
      key: modal.key, sid: modal.sid, gNum: modal.gNum, nome: modal.nome,
      catName: allStickersFlat.find(s => s.sid === modal.sid)?.catName ?? '',
      tipo: modal.tipo, acao: 'venda', preco: modal.preco,
    }
    const next = modal.isNew ? [...anuncios, novo] : anuncios.map(a => a.key === modal.key ? novo : a)
    setAnuncios(next)
    await salvar(next)
    setModal(null)
  }

  async function remover(key: string) {
    const next = anuncios.filter(a => a.key !== key)
    setAnuncios(next)
    await salvar(next)
  }

  async function removerModal() {
    if (!modal) return
    const next = anuncios.filter(a => a.key !== modal.key)
    setAnuncios(next)
    await salvar(next)
    setModal(null)
  }

  async function salvar(lista: AnuncioLocal[]) {
    setSalvando(true)
    try {
      const res = await fetch('/api/anuncios/save', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          albumId,
          tipo:  'tenho',
          items: lista.map(a => ({
            sid:   a.sid,
            gNum:  a.gNum,
            nome:  a.nome,
            qty:   1,
            tipo:  a.tipo,
            preco: a.acao === 'venda' && a.preco ? parseFloat(a.preco) : undefined,
            acao:  a.acao,
          })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[anuncios] save error:', res.status, err)
      }
    } catch (e) {
      console.error('[anuncios] save fetch error:', e)
    }
    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  const anunciosFiltrados = useMemo(() =>
    anuncios.filter(a => a.acao === filtroAcao)
  , [anuncios, filtroAcao])

  // Agrupa anúncios filtrados por tipo → por categoria (para a aba Anunciadas)
  const anunciadosPorTipoECat = useMemo(() => {
    const result: Record<StickerType, { catId: string; catName: string; catFlag: string; items: AnuncioLocal[] }[]> = {
      normal: [], escudo: [], brilhante: [], especial: [],
      'extra-gold': [], 'extra-silver': [], 'extra-bronze': [], 'extra-purple': [], 'coca-cola': [],
    }
    const currentAlbum = (ALBUM_DATA[albumId] ?? ALBUM_DATA['copa-2026']).album
    const currentFlat  = (ALBUM_DATA[albumId] ?? ALBUM_DATA['copa-2026']).flat
    for (const cat of currentAlbum.categories) {
      for (const tipo of Object.keys(result) as StickerType[]) {
        const items = anunciosFiltrados.filter(a =>
          a.tipo === tipo && currentFlat.find(s => s.sid === a.sid)?.catId === cat.id
        )
        if (items.length) result[tipo].push({ catId: cat.id, catName: cat.name, catFlag: cat.flag ?? '📌', items })
      }
    }
    return result
  }, [anunciosFiltrados, albumId])

  if (loading) return (
    <div className="max-w-2xl mx-auto px-3 py-10 text-center">
      <span className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin inline-block" />
    </div>
  )

  const isVenda  = subTab === 'venda'
  const subColor = isVenda ? { border: 'border-green-300', bg: 'bg-green-500', light: 'bg-green-50', badge: 'bg-green-100 text-green-700', sticker: 'border-green-200 bg-green-50 hover:border-green-400 hover:bg-green-100 text-green-600' }
                           : { border: 'border-blue-300',  bg: 'bg-blue-500',  light: 'bg-blue-50',  badge: 'bg-blue-100 text-blue-700',   sticker: 'border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 text-blue-600'  }

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 animate-fadein">
      <BannerMenorDeIdade />

      {/* ── MODAL VENDA (só preço) ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadein">
            <p className="text-xs text-slate-400 mb-0.5">Figurinha #{modal.gNum} {TIPO_ICON[modal.tipo]}</p>
            <p className="font-black text-slate-800 text-lg leading-tight mb-3">{modal.nome}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold mb-5 bg-green-100 text-green-700">
              💰 Venda
            </div>
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-500 mb-2">Preço</p>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-green-400">
                <span className="text-sm font-semibold text-slate-400">R$</span>
                <input type="number" min="0.50" step="0.50" value={modal.preco}
                  onChange={e => setModal(m => m ? { ...m, preco: e.target.value } : m)}
                  className="flex-1 bg-transparent text-sm font-bold text-slate-800 focus:outline-none" placeholder="0,00" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Sugerido: R$ {PRECO_SUGERIDO[modal.tipo].replace('.', ',')}</p>
            </div>
            <div className="flex gap-2">
              {!modal.isNew && (
                <button onClick={removerModal} className="px-4 py-3 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors">
                  Remover
                </button>
              )}
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold">Cancelar</button>
              <button onClick={confirmarModal} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-black transition-colors">
                {modal.isNew ? 'Anunciar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black text-slate-800">Anúncios</h1>
          <p className="text-sm text-slate-500">Anuncie suas figurinhas repetidas</p>
        </div>
        {(salvando || salvo) && (
          <span className={['text-xs font-semibold px-3 py-1.5 rounded-full',
            salvando ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'].join(' ')}>
            {salvando ? 'Salvando...' : '✓ Salvo'}
          </span>
        )}
      </div>

      {/* ── ÁLBUM ATIVO (sempre visível; clicável se tiver 2+ álbuns) ── */}
      {(() => {
        const meta = ALBUMS_REGISTRY.find(a => a.id === albumId)
        if (!meta) return null
        return (
          <div className="mb-4">
            <button
              onClick={() => activeAlbums.length > 1 && setMostrarSeletor(s => !s)}
              className={[
                'w-full flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm transition-colors',
                activeAlbums.length > 1 ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default',
              ].join(' ')}
            >
              <span className="text-2xl">{meta.emoji}</span>
              <div className="flex-1 text-left min-w-0">
                <p className="font-black text-sm text-slate-800 truncate">{meta.name}</p>
                <p className="text-xs text-slate-400">{meta.description}</p>
              </div>
              {activeAlbums.length > 1 && <span className="text-slate-400 text-xs flex-shrink-0">Trocar ▼</span>}
            </button>
            {mostrarSeletor && activeAlbums.length > 1 && (
              <div className="mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden animate-fadein">
                {ALBUMS_REGISTRY.filter(a => activeAlbums.includes(a.id)).map(a => (
                  <button
                    key={a.id}
                    onClick={() => trocarAlbum(a.id)}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-slate-50 last:border-0',
                      a.id === albumId ? 'bg-green-50' : 'hover:bg-slate-50',
                    ].join(' ')}
                  >
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
      })()}

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-slate-50 rounded-2xl px-4 py-3 text-center">
          <p className="text-2xl font-black text-slate-700">{coladas.size}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">No álbum</p>
        </div>
        <div className="bg-blue-50 rounded-2xl px-4 py-3 text-center">
          <p className="text-2xl font-black text-blue-700">{anuncios.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Anunciadas</p>
        </div>
      </div>

      {coladas.size === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-black text-slate-800 text-base mb-1">Álbum vazio</p>
          <p className="text-sm text-slate-500 mb-4">Marque suas figurinhas no álbum primeiro.</p>
          <a href="/album" className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
            📋 Ir para o álbum →
          </a>
        </div>
      ) : (
        <>
          {/* Abas principais */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab('disponiveis')}
              className={['flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
                tab === 'disponiveis' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'].join(' ')}>
              📋 Disponíveis
            </button>
            <button onClick={() => { setTab('anunciadas'); setFiltroAcao('troca') }}
              className={['flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
                tab === 'anunciadas' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'].join(' ')}>
              📢 Anunciadas
            </button>
          </div>

          {/* ── ABA DISPONÍVEIS ── */}
          {tab === 'disponiveis' && (
            <div className="animate-fadein">

              {/* Sub-abas Troca / Venda */}
              <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-xl">
                <button onClick={() => setSubTab('troca')}
                  className={['flex-1 py-2 rounded-lg text-sm font-bold transition-all',
                    subTab === 'troca' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'].join(' ')}>
                  🔁 Troca
                </button>
                <button onClick={() => setSubTab('venda')}
                  className={['flex-1 py-2 rounded-lg text-sm font-bold transition-all',
                    subTab === 'venda' ? 'bg-green-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'].join(' ')}>
                  💰 Venda
                </button>
              </div>

              {!adulto && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 text-center font-semibold">
                  🔒 Anúncios disponíveis apenas para maiores de 18
                </div>
              )}

              {/* Quadros por tipo */}
              <div className="space-y-3">
                {TIPO_META.map(({ key: tipoKey, label, icon, desc }) => {
                  const grupos = porTipoECat[tipoKey]
                  // mostra todos os colados — anunciados aparecem destacados e clicáveis para desanunciar
                  const gruposFiltrados = grupos.map(g => ({
                    ...g,
                    stickers: g.stickers.filter(s => coladas.has(s.sid)),
                  })).filter(g => g.stickers.length > 0)

                  const totalTipo      = gruposFiltrados.reduce((a, g) => a + g.stickers.length, 0)
                  const totalAnunciado = gruposFiltrados.reduce((a, g) => a + g.stickers.filter(s => anunciadosKeys.has(makeKey(s.sid, subTab))).length, 0)
                  const isOpen    = openTipos.has(tipoKey)

                  return (
                    <div key={tipoKey}
                      className={['bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all',
                        isOpen && totalTipo > 0 ? subColor.border : 'border-slate-100'].join(' ')}>

                      {/* Header do tipo */}
                      <button onClick={() => toggleTipo(tipoKey)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                        <span className="text-2xl">{icon}</span>
                        <div className="flex-1">
                          <p className="font-bold text-slate-800 text-sm">{label}</p>
                          <p className="text-xs text-slate-400">{desc}</p>
                        </div>
                        {totalTipo > 0 && (
                          <span className={['text-xs font-bold px-2 py-0.5 rounded-full', subColor.badge].join(' ')}>
                            {totalAnunciado}/{totalTipo}
                          </span>
                        )}
                        {totalTipo === 0 && (
                          <span className="text-xs text-slate-300 font-medium">nenhuma</span>
                        )}
                        <span className="text-slate-400 text-xs ml-1">{isOpen ? '▲' : '▼'}</span>
                      </button>

                      {/* Categorias dentro do tipo */}
                      {isOpen && totalTipo > 0 && (
                        <div className="border-t border-slate-50 px-4 pb-4 pt-2 space-y-2">
                          {gruposFiltrados.map(g => {
                            const catKey = `${tipoKey}__${g.catId}`
                            const catOpen = openCats.has(catKey)
                            return (
                              <div key={g.catId} className="border border-slate-100 rounded-xl overflow-hidden">
                                <button onClick={() => toggleCat(catKey)}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors text-left">
                                  <span className="flex-1 text-sm font-semibold text-slate-700">{g.catName.replace(/^[^\p{L}\p{N}]+/u, '')}</span>
                                  <span className={['text-[10px] font-bold px-1.5 py-0.5 rounded-full', subColor.badge].join(' ')}>
                                    {g.stickers.length}✓
                                  </span>
                                  <span className="text-xs text-slate-400">{catOpen ? '▲' : '▼'}</span>
                                </button>

                                {catOpen && (
                                  <div className="px-3 pb-3 pt-1 border-t border-slate-50 flex flex-wrap gap-2">
                                    {g.stickers.map(s => {
                                      const jaAnunciado = anunciadosKeys.has(makeKey(s.sid, subTab))
                                      return (
                                        <button key={s.sid}
                                          onClick={() => subTab === 'troca' ? toggleTroca(s) : (jaAnunciado ? remover(makeKey(s.sid, 'venda')) : abrirModalVenda(s))}
                                          title={`#${s.gNum} · ${s.nome}${jaAnunciado ? ' — clique para desanunciar' : ' — clique para anunciar'}`}
                                          className={[
                                            'w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all',
                                            jaAnunciado
                                              ? subTab === 'troca'
                                                ? 'bg-blue-500 border-blue-600 text-white'
                                                : 'bg-green-500 border-green-600 text-white'
                                              : `border-dashed ${subColor.sticker}`,
                                          ].join(' ')}>
                                          <>
                                            {s.catCode.length <= 4 && (
                                              <span className="text-[7px] font-bold leading-none opacity-60">{s.catCode}</span>
                                            )}
                                            <span className="text-[10px] font-black leading-none">{s.localNum}</span>
                                            {jaAnunciado
                                              ? <span className="text-[9px] leading-none">✓</span>
                                              : TIPO_ICON[s.tipo] ? <span className="text-[8px] leading-none">{TIPO_ICON[s.tipo]}</span> : null
                                            }
                                          </>
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                          <p className="text-[10px] text-slate-400 text-center pt-1">
                            ✓ anunciada · toque para anunciar ou desanunciar
                          </p>
                        </div>
                      )}

                      {isOpen && totalTipo === 0 && (
                        <div className="border-t border-slate-50 px-4 py-3 text-center">
                          <p className="text-xs text-slate-400">Nenhuma figurinha {label.toLowerCase()} disponível para {subTab === 'troca' ? 'troca' : 'venda'}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── ABA ANUNCIADAS ── */}
          {tab === 'anunciadas' && (
            <div className="animate-fadein">
              {anuncios.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="font-bold text-slate-700 text-sm mb-1">Nenhum anúncio ainda</p>
                  <p className="text-xs text-slate-400">Vá para Disponíveis e selecione figurinhas.</p>
                </div>
              ) : (
                <>
                  {/* Filtro Troca / Venda */}
                  <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-xl">
                    {(['troca', 'venda'] as const).map(f => (
                      <button key={f} onClick={() => setFiltroAcao(f)}
                        className={['flex-1 py-2 rounded-lg text-sm font-bold transition-all',
                          filtroAcao === f
                            ? f === 'venda' ? 'bg-green-500 text-white shadow-sm' : 'bg-blue-500 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'].join(' ')}>
                        {f === 'venda' ? '💰 Venda' : '🔁 Troca'}
                      </button>
                    ))}
                  </div>

                  {/* Quadros por tipo */}
                  <div className="space-y-3">
                    {TIPO_META.map(({ key: tipoKey, label, icon, desc }) => {
                      const grupos = anunciadosPorTipoECat[tipoKey]
                      const totalTipo = grupos.reduce((a, g) => a + g.items.length, 0)
                      const isOpen = openTiposAn.has(tipoKey)

                      return (
                        <div key={tipoKey}
                          className={['bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all',
                            isOpen && totalTipo > 0 ? 'border-slate-300' : 'border-slate-100'].join(' ')}>

                          {/* Header do tipo */}
                          <button onClick={() => toggleTipoAn(tipoKey)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                            <span className="text-2xl">{icon}</span>
                            <div className="flex-1">
                              <p className="font-bold text-slate-800 text-sm">{label}</p>
                              <p className="text-xs text-slate-400">{desc}</p>
                            </div>
                            {totalTipo > 0 && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {totalTipo} anúncio{totalTipo > 1 ? 's' : ''}
                              </span>
                            )}
                            {totalTipo === 0 && (
                              <span className="text-xs text-slate-300 font-medium">nenhuma</span>
                            )}
                            <span className="text-slate-400 text-xs ml-1">{isOpen ? '▲' : '▼'}</span>
                          </button>

                          {/* Categorias dentro do tipo */}
                          {isOpen && totalTipo > 0 && (
                            <div className="border-t border-slate-50 px-4 pb-4 pt-2 space-y-2">
                              {grupos.map(g => {
                                const catKey = `an__${tipoKey}__${g.catId}`
                                const catOpen = openCatsAn.has(catKey)
                                return (
                                  <div key={g.catId} className="border border-slate-100 rounded-xl overflow-hidden">
                                    <button onClick={() => toggleCatAn(catKey)}
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors text-left">
                                      <span className="flex-1 text-sm font-semibold text-slate-700">{g.catName.replace(/^[^\p{L}\p{N}]+/u, '')}</span>
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                        {g.items.length}✓
                                      </span>
                                      <span className="text-xs text-slate-400">{catOpen ? '▲' : '▼'}</span>
                                    </button>

                                    {catOpen && (
                                      <div className="px-3 pb-3 pt-1 border-t border-slate-50 flex flex-wrap gap-2">
                                        {g.items.map(a => (
                                          <button key={a.key}
                                            onClick={() => a.acao === 'venda' ? editarModalVenda(a) : remover(a.key)}
                                            title={`#${a.gNum} · ${a.nome} · ${a.acao === 'venda' ? `R$ ${parseFloat(a.preco||'0').toFixed(2)}` : 'Troca — toque para remover'}`}
                                            className={['w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all',
                                              a.acao === 'venda'
                                                ? 'border-green-300 bg-green-50 hover:border-green-500 hover:bg-green-100 text-green-700'
                                                : 'border-blue-300 bg-blue-50 hover:border-red-300 hover:bg-red-50 text-blue-700'].join(' ')}>
                                            <span className="text-[11px] font-black leading-none">{a.gNum}</span>
                                            {TIPO_ICON[a.tipo] && <span className="text-[8px] leading-none">{TIPO_ICON[a.tipo]}</span>}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                              <p className="text-[10px] text-slate-400 text-center pt-1">
                                Toque para editar ou remover
                              </p>
                            </div>
                          )}

                          {isOpen && totalTipo === 0 && (
                            <div className="border-t border-slate-50 px-4 py-3 text-center">
                              <p className="text-xs text-slate-400">Nenhum anúncio {label.toLowerCase()}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
