'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { albumCopa2026, TOTAL_STICKERS, buildGlobalNumberMap, stickerId } from '@/data/album-copa-2026'
import { type AlbumId } from '@/lib/store'
import { dbGetColadas, dbColaSticker, dbDescolaSticker, dbGetActiveAlbums, dbSaveActiveAlbums } from '@/lib/db'
import { ALBUMS_REGISTRY } from '@/data/albums-registry'

type ColadasSet = Set<string>

const globalNumbers = buildGlobalNumberMap(albumCopa2026)

// ── Tela de escolha inicial ───────────────────────────────────────────────────

function EscolherAlbum({ onEscolher }: { onEscolher: (id: AlbumId) => void }) {
  const [salvando, setSalvando] = useState<AlbumId | null>(null)

  async function escolher(id: AlbumId) {
    setSalvando(id)
    await dbSaveActiveAlbums([id])
    onEscolher(id)
  }

  return (
    <div className="max-w-lg mx-auto px-3 py-8 animate-fadein">
      <div className="text-center mb-8">
        <p className="text-4xl mb-3">📚</p>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Escolha seu álbum</h1>
        <p className="text-sm text-slate-500">Selecione o álbum que você está montando para começar a marcar suas figurinhas.</p>
      </div>

      <div className="space-y-3">
        {ALBUMS_REGISTRY.map(a => (
          <button
            key={a.id}
            onClick={() => escolher(a.id)}
            disabled={salvando !== null}
            className={[
              'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all',
              salvando === a.id
                ? 'border-green-500 bg-green-50'
                : 'border-slate-200 bg-white hover:border-green-300 hover:bg-green-50 hover:shadow-sm',
              salvando !== null && salvando !== a.id ? 'opacity-40' : '',
            ].join(' ')}
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.gradientFrom} ${a.gradientTo} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <span className="text-2xl">{a.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-800 text-sm leading-tight">{a.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{a.subtitle}</p>
              <p className="text-xs text-slate-400 mt-1">{a.description}</p>
            </div>
            {salvando === a.id
              ? <span className="w-5 h-5 border-2 border-green-400 border-t-green-600 rounded-full animate-spin flex-shrink-0" />
              : <span className="text-slate-300 text-lg flex-shrink-0">›</span>
            }
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">
        Você pode adicionar mais álbuns depois em <span className="font-semibold">Minha Conta → Meus Álbuns</span>
      </p>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AlbumPage() {
  const [loading, setLoading]           = useState(true)
  const [albumId, setAlbumId]           = useState<AlbumId | null>(null)
  const [coladas, setColadas]           = useState<ColadasSet>(new Set())
  const [mostrarSeletor, setMostrarSeletor] = useState(false)
  const [search, setSearch]             = useState('')
  const [openCats, setOpenCats]         = useState<Set<string>>(new Set(['fwc']))
  const [mostrarFaltando, setMostrarFaltando] = useState(false)

  // Carrega álbum ativo do usuário
  useEffect(() => {
    dbGetActiveAlbums().then(ativos => {
      if (ativos.length > 0) {
        setAlbumId(ativos[0])
      }
      setLoading(false)
    })
  }, [])

  // Carrega coladas quando albumId muda
  useEffect(() => {
    if (!albumId) return
    dbGetColadas(albumId).then(saved => {
      setColadas(new Set(saved))
    })
    queueMicrotask(() => setOpenCats(new Set(['fwc'])))
    queueMicrotask(() => setSearch(''))
  }, [albumId])

  function toggleColada(id: string) {
    if (!albumId) return
    setColadas(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        dbDescolaSticker(albumId, id)
      } else {
        next.add(id)
        dbColaSticker(albumId, id)
      }
      return next
    })
  }

  function toggleCat(id: string) {
    setOpenCats(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function trocarAlbum(id: AlbumId) {
    setAlbumId(id)
    setMostrarSeletor(false)
    // Adiciona aos ativos se não estiver
    const ativos = await dbGetActiveAlbums()
    if (!ativos.includes(id)) {
      await dbSaveActiveAlbums([...ativos, id])
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="w-7 h-7 border-2 border-slate-200 border-t-green-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Sem álbum escolhido → tela de onboarding
  if (!albumId) {
    return <EscolherAlbum onEscolher={id => setAlbumId(id)} />
  }

  const albumMeta = ALBUMS_REGISTRY.find(a => a.id === albumId)!
  const total     = albumId === 'copa-2026' ? TOTAL_STICKERS : albumMeta.totalStickers
  const nColadas  = coladas.size
  const nFaltando = total - nColadas
  const progress  = Math.round((nColadas / total) * 100)

  return (
    <div className="max-w-4xl mx-auto px-3 py-4 animate-fadein">

      {/* ── SELETOR DE ÁLBUM ── */}
      <div className="mb-4">
        <button
          onClick={() => setMostrarSeletor(s => !s)}
          className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <span className="text-2xl">{albumMeta.emoji}</span>
          <div className="flex-1 text-left min-w-0">
            <p className="font-black text-sm text-slate-800 truncate">{albumMeta.name}</p>
            <p className="text-xs text-slate-400">{albumMeta.description}</p>
          </div>
          <span className="text-slate-400 text-xs flex-shrink-0">Trocar ▼</span>
        </button>

        {mostrarSeletor && (
          <div className="mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden animate-fadein">
            {ALBUMS_REGISTRY.map(a => (
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

      {/* ── CABEÇALHO ── */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{albumMeta.emoji}</span>
        <div>
          <h1 className="text-lg font-black text-slate-800 leading-tight">{albumMeta.name}</h1>
          <p className="text-xs text-slate-500">{albumMeta.description}</p>
        </div>
      </div>

      {/* ── PROGRESSO ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">Progresso</span>
          <span className="text-sm font-black text-green-600">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-3">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-50 rounded-xl px-3 py-2 text-center">
            <p className="text-lg font-black text-green-600">{nColadas}</p>
            <p className="text-[11px] text-slate-500">coladas</p>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-2 text-center">
            <p className="text-lg font-black text-slate-500">{nFaltando}</p>
            <p className="text-[11px] text-slate-500">faltando</p>
          </div>
        </div>
      </div>

      {/* ── ÁLBUM NÃO DISPONÍVEL ── */}
      {albumId !== 'copa-2026' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <p className="text-5xl mb-4">{albumMeta.emoji}</p>
          <p className="font-black text-slate-800 text-lg mb-2">Em breve!</p>
          <p className="text-sm text-slate-500 mb-1">
            O catálogo digital do <span className="font-semibold">{albumMeta.name}</span> está sendo preparado.
          </p>
          <p className="text-xs text-slate-400 mb-6">
            Você já pode anunciar e trocar figurinhas deste álbum agora.
          </p>
          <Link href="/anuncios" className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
            Anunciar figurinhas →
          </Link>
        </div>
      )}

      {/* ── BUSCA + FILTRO ── */}
      {albumId === 'copa-2026' && (
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Buscar número ou nome..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={() => setMostrarFaltando(f => !f)}
            className={[
              'px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all whitespace-nowrap',
              mostrarFaltando
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200',
            ].join(' ')}
          >
            {mostrarFaltando ? '👁 Todas' : '❌ Faltando'}
          </button>
        </div>
      )}

      {/* ── DICA ── */}
      {albumId === 'copa-2026' && (
        <p className="text-xs text-slate-400 text-center mb-4">
          Toque na figurinha para marcar como colada · toque de novo para desmarcar
        </p>
      )}

      {/* ── CATEGORIAS ── */}
      {albumId === 'copa-2026' && (
        <div className="space-y-2">
          {albumCopa2026.categories.map(cat => {
            const isOpen = openCats.has(cat.id)

            const filtered = cat.stickers.filter(s => {
              const sid  = stickerId(cat.code, s.number)
              const gNum = globalNumbers.get(sid) ?? s.number
              const matchSearch = search === ''
                || String(gNum).includes(search)
                || s.name.toLowerCase().includes(search.toLowerCase())
              const matchFiltro = mostrarFaltando ? !coladas.has(sid) : true
              return matchSearch && matchFiltro
            })

            if (filtered.length === 0) return null

            const catColadas  = cat.stickers.filter(s => coladas.has(stickerId(cat.code, s.number))).length
            const catTotal    = cat.stickers.length
            const catProgress = Math.round((catColadas / catTotal) * 100)

            return (
              <div key={cat.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleCat(cat.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="text-lg">{cat.flag ?? '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800">{cat.name.replace(/^[^\p{L}]+/u, '')}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full bg-green-500 transition-all" style={{ width: `${catProgress}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{catColadas}/{catTotal}</span>
                    </div>
                  </div>
                  <span className={`text-slate-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-50">
                    <div className="flex flex-wrap gap-2">
                      {filtered.map(s => {
                        const sid         = stickerId(cat.code, s.number)
                        const isColada    = coladas.has(sid)
                        const globalN     = globalNumbers.get(sid) ?? s.number
                        const isBrilhante = s.type === 'brilhante'
                        const isEscudo    = s.type === 'escudo'
                        const isEspecial  = s.type === 'especial'

                        return (
                          <button
                            key={sid}
                            onClick={() => toggleColada(sid)}
                            title={`#${globalN} · ${s.name}`}
                            className={[
                              'w-11 h-11 rounded-lg border-2 flex flex-col items-center justify-center select-none',
                              'transition-all duration-150 active:scale-90 hover:scale-105',
                              isColada
                                ? 'bg-green-600 border-green-700 text-white shadow-sm'
                                : isBrilhante
                                  ? 'bg-amber-50 border-amber-300 text-amber-700 sticker-brilhante'
                                  : isEscudo
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                    : isEspecial
                                      ? 'bg-orange-50 border-orange-200 text-orange-600'
                                      : 'bg-white border-slate-200 text-slate-500 hover:border-green-300',
                            ].join(' ')}
                          >
                            {isColada
                              ? <span className="text-base">✓</span>
                              : (
                                <>
                                  <span className="text-[10px] font-bold leading-none">{globalN}</span>
                                  {isBrilhante && <span className="text-[7px] leading-none">✨</span>}
                                  {isEscudo    && <span className="text-[7px] leading-none">🛡</span>}
                                  {isEspecial  && <span className="text-[7px] leading-none">⭐</span>}
                                </>
                              )
                            }
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
