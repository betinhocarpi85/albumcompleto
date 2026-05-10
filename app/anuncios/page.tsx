'use client'

import { useState, useMemo, useEffect } from 'react'
import { albumCopa2026, buildGlobalNumberMap, stickerId } from '@/data/album-copa-2026'
import type { StickerType } from '@/data/album-copa-2026'
import type { AlbumId } from '@/data/albums-registry'
import { dbGetActiveAlbums, dbGetAnuncios, dbSaveAnuncios, dbGetColadas, getSession } from '@/lib/db'
import BannerMenorDeIdade from '@/components/BannerMenorDeIdade'

type TipoAnuncio = 'venda' | 'troca'
type Tab = 'disponiveis' | 'anunciadas'

interface AnuncioLocal {
  sid:     string
  gNum:    number
  nome:    string
  catName: string
  tipo:    StickerType
  acao:    TipoAnuncio
  preco:   string
  qty:     number
}

interface QtyModal {
  sid:    string
  gNum:   number
  nome:   string
  tipo:   StickerType
  acao:   TipoAnuncio
  preco:  string
  qty:    number
  isNew:  boolean
}

const globalNumbers = buildGlobalNumberMap(albumCopa2026)

const PRECO_SUGERIDO: Record<StickerType, string> = {
  normal: '3.00', escudo: '4.00', brilhante: '8.00', especial: '5.00',
}

const TIPO_ICON: Record<StickerType, string> = {
  normal: '', escudo: '🛡️', brilhante: '✨', especial: '⭐',
}

const allStickersFlat = albumCopa2026.categories.flatMap(cat =>
  cat.stickers.map(s => ({
    sid:     stickerId(cat.code, s.number),
    gNum:    globalNumbers.get(stickerId(cat.code, s.number)) ?? 0,
    nome:    s.name,
    catName: cat.name,
    catFlag: cat.flag ?? '📌',
    catId:   cat.id,
    tipo:    s.type as StickerType,
  }))
)

// Agrupa stickers por categoria
const stickersPorCat = albumCopa2026.categories.map(cat => ({
  id:      cat.id,
  name:    cat.name,
  flag:    cat.flag ?? '📌',
  stickers: cat.stickers.map(s => ({
    sid:  stickerId(cat.code, s.number),
    gNum: globalNumbers.get(stickerId(cat.code, s.number)) ?? 0,
    nome: s.name,
    tipo: s.type as StickerType,
  })),
}))

export default function AnunciosPage() {
  const [albumId,  setAlbumId]  = useState<AlbumId>('copa-2026')
  const [adulto,   setAdulto]   = useState(true)
  const [coladas,  setColadas]  = useState<Set<string>>(new Set())
  const [anuncios, setAnuncios] = useState<AnuncioLocal[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<Tab>('disponiveis')
  const [modal,    setModal]    = useState<QtyModal | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [salvo,    setSalvo]    = useState(false)
  const [busca,    setBusca]    = useState('')
  const [filtroAcao, setFiltroAcao] = useState<'todos' | TipoAnuncio>('todos')
  const [openCats, setOpenCats] = useState<Set<string>>(new Set())

  useEffect(() => {
    getSession().then(session => {
      if (!session) { setLoading(false); return }
      dbGetActiveAlbums().then(ids => {
        const id = ids[0] ?? 'copa-2026'
        setAlbumId(id)
        Promise.all([dbGetColadas(id), dbGetAnuncios(id, 'tenho')]).then(([col, saved]) => {
          const coladasSet = new Set(col)
          setColadas(coladasSet)
          setAnuncios(saved.map(a => {
            const info = allStickersFlat.find(s => s.sid === a.sid)
            return {
              sid:     a.sid,
              gNum:    typeof a.gNum === 'number' ? a.gNum : Number(a.gNum) || 0,
              nome:    a.nome,
              catName: info?.catName ?? '',
              tipo:    a.tipo as StickerType,
              acao:    a.preco != null && a.preco > 0 ? 'venda' : 'troca',
              preco:   a.preco != null && a.preco > 0 ? String(a.preco.toFixed(2)) : '',
              qty:     a.qty,
            }
          }))
          // Abre todas as categorias que têm coladas
          const catsComColadas = new Set(
            allStickersFlat.filter(s => coladasSet.has(s.sid)).map(s => s.catId)
          )
          setOpenCats(catsComColadas)
          setLoading(false)
        })
      })
    })
  }, [])

  const anunciadosSet = useMemo(() => new Set(anuncios.map(a => a.sid)), [anuncios])

  // Stickers colados ainda não anunciados, agrupados por categoria
  const catsDisponiveis = useMemo(() =>
    stickersPorCat
      .map(cat => ({
        ...cat,
        stickers: cat.stickers.filter(s => coladas.has(s.sid) && !anunciadosSet.has(s.sid)),
      }))
      .filter(cat => cat.stickers.length > 0),
    [coladas, anunciadosSet]
  )

  const totalDisponiveis = useMemo(() =>
    catsDisponiveis.reduce((acc, c) => acc + c.stickers.length, 0),
    [catsDisponiveis]
  )

  const anunciosFiltrados = useMemo(() => {
    let lista = anuncios
    if (filtroAcao !== 'todos') lista = lista.filter(a => a.acao === filtroAcao)
    if (busca.trim()) {
      const q = busca.toLowerCase()
      lista = lista.filter(a =>
        a.nome.toLowerCase().includes(q) ||
        String(a.gNum).includes(q) ||
        a.catName.toLowerCase().includes(q)
      )
    }
    return lista
  }, [anuncios, filtroAcao, busca])

  function toggleCat(id: string) {
    setOpenCats(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function abrirModal(s: { sid: string; gNum: number; nome: string; tipo: StickerType }) {
    if (!adulto) return
    setModal({ sid: s.sid, gNum: s.gNum, nome: s.nome, tipo: s.tipo,
      acao: 'troca', preco: PRECO_SUGERIDO[s.tipo], qty: 1, isNew: true })
  }

  function editarModal(a: AnuncioLocal) {
    setModal({ sid: a.sid, gNum: a.gNum, nome: a.nome, tipo: a.tipo,
      acao: a.acao, preco: a.preco || PRECO_SUGERIDO[a.tipo], qty: a.qty, isNew: false })
  }

  async function confirmarModal() {
    if (!modal) return
    const novo: AnuncioLocal = {
      sid:     modal.sid,
      gNum:    modal.gNum,
      nome:    modal.nome,
      catName: allStickersFlat.find(s => s.sid === modal.sid)?.catName ?? '',
      tipo:    modal.tipo,
      acao:    modal.acao,
      preco:   modal.acao === 'venda' ? modal.preco : '',
      qty:     modal.qty,
    }
    const next = modal.isNew
      ? [...anuncios, novo]
      : anuncios.map(a => a.sid === modal.sid ? novo : a)
    setAnuncios(next)
    await salvar(next)
    setModal(null)
    if (modal.isNew) setTab('anunciadas')
  }

  async function remover(sid: string) {
    const next = anuncios.filter(a => a.sid !== sid)
    setAnuncios(next)
    await salvar(next)
  }

  async function removerModal() {
    if (!modal) return
    const next = anuncios.filter(a => a.sid !== modal.sid)
    setAnuncios(next)
    await salvar(next)
    setModal(null)
  }

  async function salvar(lista: AnuncioLocal[]) {
    setSalvando(true)
    await dbSaveAnuncios(albumId, 'tenho', lista.map(a => ({
      sid:   a.sid,
      gNum:  a.gNum,
      nome:  a.nome,
      qty:   a.qty,
      tipo:  a.tipo,
      preco: a.acao === 'venda' && a.preco ? parseFloat(a.preco) : undefined,
    })))
    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-3 py-10 text-center">
      <span className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin inline-block" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 animate-fadein">
      <BannerMenorDeIdade />

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadein">
            <p className="text-xs text-slate-400 mb-0.5">Figurinha #{modal.gNum} {TIPO_ICON[modal.tipo]}</p>
            <p className="font-black text-slate-800 text-lg leading-tight mb-4">{modal.nome}</p>

            {/* Venda / Troca */}
            <p className="text-xs font-semibold text-slate-500 mb-2">Tipo de anúncio</p>
            <div className="flex gap-2 mb-4">
              {(['troca', 'venda'] as TipoAnuncio[]).map(tipo => (
                <button key={tipo}
                  onClick={() => setModal(m => m ? { ...m, acao: tipo } : m)}
                  className={['flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all',
                    modal.acao === tipo
                      ? tipo === 'venda' ? 'bg-green-500 border-green-500 text-white' : 'bg-blue-500 border-blue-500 text-white'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'].join(' ')}>
                  {tipo === 'venda' ? '💰 Venda' : '🔁 Troca'}
                </button>
              ))}
            </div>

            {/* Preço */}
            {modal.acao === 'venda' && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">Preço por unidade</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-green-400">
                  <span className="text-sm font-semibold text-slate-400">R$</span>
                  <input type="number" min="0.50" step="0.50"
                    value={modal.preco}
                    onChange={e => setModal(m => m ? { ...m, preco: e.target.value } : m)}
                    className="flex-1 bg-transparent text-sm font-bold text-slate-800 focus:outline-none"
                    placeholder="0,00" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Sugerido: R$ {PRECO_SUGERIDO[modal.tipo].replace('.', ',')}</p>
              </div>
            )}

            {/* Quantidade */}
            <p className="text-xs font-semibold text-slate-500 mb-2">Quantas repetidas você tem?</p>
            <div className="flex items-center justify-center gap-5 mb-6">
              <button onClick={() => setModal(m => m ? { ...m, qty: Math.max(1, m.qty - 1) } : m)}
                disabled={modal.qty <= 1}
                className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-3xl font-black text-slate-700 transition-colors flex items-center justify-center">−</button>
              <div className="text-center">
                <span className="text-5xl font-black text-slate-800">{modal.qty}</span>
                <p className="text-xs text-slate-400 mt-1">unidade{modal.qty > 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setModal(m => m ? { ...m, qty: m.qty + 1 } : m)}
                className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-3xl font-black text-slate-700 transition-colors flex items-center justify-center">+</button>
            </div>

            <div className="flex gap-2">
              {!modal.isNew && (
                <button onClick={removerModal}
                  className="px-4 py-3 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors">
                  Remover
                </button>
              )}
              <button onClick={() => setModal(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold">
                Cancelar
              </button>
              <button onClick={confirmarModal}
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-black transition-colors">
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
          <span className={['text-xs font-semibold px-3 py-1.5 rounded-full transition-all',
            salvando ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'].join(' ')}>
            {salvando ? 'Salvando...' : '✓ Salvo'}
          </span>
        )}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-green-50 rounded-2xl px-4 py-3 text-center">
          <p className="text-2xl font-black text-green-700">{totalDisponiveis}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Disponíveis</p>
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
          {/* Abas */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab('disponiveis')}
              className={['flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
                tab === 'disponiveis' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'].join(' ')}>
              📋 Disponíveis ({totalDisponiveis})
            </button>
            <button onClick={() => setTab('anunciadas')}
              className={['flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
                tab === 'anunciadas' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'].join(' ')}>
              📢 Anunciadas ({anuncios.length})
            </button>
          </div>

          {/* ── ABA DISPONÍVEIS (grade como álbum) ── */}
          {tab === 'disponiveis' && (
            <div className="animate-fadein">
              {!adulto && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 text-center font-semibold">
                  🔒 Anúncios disponíveis apenas para maiores de 18
                </div>
              )}

              {catsDisponiveis.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="font-bold text-slate-700 text-sm">Todas as figurinhas já estão anunciadas!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {catsDisponiveis.map(cat => {
                    const isOpen = openCats.has(cat.id)
                    return (
                      <div key={cat.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Header da categoria */}
                        <button
                          onClick={() => toggleCat(cat.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                          <span className="text-xl">{cat.flag}</span>
                          <span className="flex-1 font-bold text-sm text-slate-800">{cat.name}</span>
                          <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            {cat.stickers.length} fig.
                          </span>
                          <span className="text-slate-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                        </button>

                        {/* Grade de figurinhas */}
                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 border-t border-slate-50">
                            <div className="flex flex-wrap gap-2">
                              {cat.stickers.map(s => (
                                <button
                                  key={s.sid}
                                  onClick={() => abrirModal(s)}
                                  title={`#${s.gNum} · ${s.nome}`}
                                  className="w-12 h-12 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-green-400 hover:bg-green-50 active:scale-90 transition-all flex flex-col items-center justify-center gap-0.5 group">
                                  <span className="text-[11px] font-black text-slate-500 group-hover:text-green-700 leading-none">{s.gNum}</span>
                                  {TIPO_ICON[s.tipo] && (
                                    <span className="text-[8px] leading-none">{TIPO_ICON[s.tipo]}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 text-center">
                              Toque em uma figurinha para anunciá-la
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ABA ANUNCIADAS ── */}
          {tab === 'anunciadas' && (
            <div className="animate-fadein space-y-3">
              {anuncios.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="font-bold text-slate-700 text-sm mb-1">Nenhum anúncio ainda</p>
                  <p className="text-xs text-slate-400">Vá para a aba Disponíveis e selecione figurinhas para anunciar.</p>
                </div>
              ) : (
                <>
                  {/* Filtros */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {(['todos', 'troca', 'venda'] as const).map(f => (
                        <button key={f} onClick={() => setFiltroAcao(f)}
                          className={['px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                            filtroAcao === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'].join(' ')}>
                          {f === 'todos' ? 'Todas' : f === 'venda' ? '💰 Venda' : '🔁 Troca'}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                      <input type="text" placeholder="Buscar..." value={busca}
                        onChange={e => setBusca(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
                    </div>
                  </div>

                  {anunciosFiltrados.map(a => (
                    <div key={a.sid} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex items-center gap-3">
                      <div className={['w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border-2',
                        a.acao === 'venda' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'].join(' ')}>
                        <span className="text-xs font-black leading-none">{a.gNum}</span>
                        {TIPO_ICON[a.tipo] && <span className="text-[8px] leading-none mt-0.5">{TIPO_ICON[a.tipo]}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 truncate">{a.nome}</p>
                        <p className="text-xs text-slate-400">{a.catName}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={['text-[10px] font-bold px-2 py-0.5 rounded-full',
                          a.acao === 'venda' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'].join(' ')}>
                          {a.acao === 'venda'
                            ? `R$ ${parseFloat(a.preco || '0').toFixed(2).replace('.', ',')}`
                            : '🔁 Troca'}
                        </span>
                        <span className="text-[10px] text-slate-400">{a.qty} unid.</span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => editarModal(a)}
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs transition-colors flex items-center justify-center">
                          ✏️
                        </button>
                        <button onClick={() => remover(a.sid)}
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 text-lg transition-colors flex items-center justify-center">
                          ×
                        </button>
                      </div>
                    </div>
                  ))}

                  {anunciosFiltrados.length === 0 && (
                    <p className="text-center text-sm text-slate-400 py-4">Nenhum resultado</p>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
