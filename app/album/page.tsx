'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { albumCopa2026, buildGlobalNumberMap, stickerId, type Album } from '@/data/album-copa-2026'
import { albumBrasileiraoMasc2026 } from '@/data/album-brasileirao-masc-2025'
import { albumBrasileiraoFem2026 } from '@/data/album-brasileirao-fem-2025'
import { type AlbumId } from '@/lib/store'
import { dbGetColadas, dbColaSticker, dbDescolaSticker, dbGetActiveAlbums, dbSaveActiveAlbums } from '@/lib/db'
import { ALBUMS_REGISTRY } from '@/data/albums-registry'

type ColadasSet = Set<string>

// Mapa de todos os álbuns disponíveis
const ALBUM_DATA: Record<string, Album> = {
  'copa-2026':              albumCopa2026,
  'brasileirao-masc-2026': albumBrasileiraoMasc2026,
  'brasileirao-fem-2026':  albumBrasileiraoFem2026,
}

// Sids oficiais por álbum (gnums ≤ totalStickers do registry)
// Exclui categorias extra (XGOLD, XSILVER, etc.) que vão além do álbum oficial
function buildOfficialSids(album: Album, maxGnum: number): Set<string> {
  const gnumMap = buildGlobalNumberMap(album)
  return new Set([...gnumMap.entries()].filter(([, g]) => g <= maxGnum).map(([sid]) => sid))
}

const OFFICIAL_SIDS: Record<string, Set<string>> = {
  'copa-2026':              buildOfficialSids(albumCopa2026,              980),
  'brasileirao-masc-2026':  buildOfficialSids(albumBrasileiraoMasc2026,   685),
  'brasileirao-fem-2026':   buildOfficialSids(albumBrasileiraoFem2026,    480),
}

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
        {ALBUMS_REGISTRY.filter(a => a.available).map(a => (
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

function AlbumPageInner() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const escolher     = searchParams.get('escolher') === '1'
  const [loading, setLoading]           = useState(true)
  const [albumId, setAlbumId]           = useState<AlbumId | null>(null)
  const [activeAlbums, setActiveAlbums] = useState<AlbumId[]>([])
  const [coladas, setColadas]           = useState<ColadasSet>(new Set())
  const [mostrarSeletor, setMostrarSeletor] = useState(false)
  const [search, setSearch]             = useState('')
  const [openCats, setOpenCats]         = useState<Set<string>>(new Set(['fwc']))
  const [mostrarFaltando, setMostrarFaltando] = useState(false)

  // Carrega álbum ativo do usuário
  useEffect(() => {
    // Se ?escolher=1 → mostra o picker (usuário quer trocar)
    if (escolher) {
      setLoading(false)
      return
    }

    // Filtra apenas álbuns disponíveis
    const availableIds = new Set(ALBUMS_REGISTRY.filter(a => a.available).map(a => a.id))

    // Tenta localStorage primeiro (instantâneo, sem depender de auth/rede)
    try {
      const local = localStorage.getItem('cdo_active_albums')
      if (local) {
        const ids = (JSON.parse(local) as AlbumId[]).filter(id => availableIds.has(id))
        if (ids.length > 0) {
          setAlbumId(ids[0])
          setActiveAlbums(ids)
          setLoading(false)
          return
        }
      }
    } catch { /* ignora */ }

    // Tenta DB em background
    dbGetActiveAlbums().then(ativos => {
      const ativosDisponiveis = ativos.filter(id => availableIds.has(id))
      if (ativosDisponiveis.length > 0) {
        const ativos = ativosDisponiveis
        setAlbumId(ativos[0])
        setActiveAlbums(ativos)
        // Garante que está no localStorage para próximas visitas
        try { localStorage.setItem('cdo_active_albums', JSON.stringify(ativos)) } catch { /* ignora */ }
      } else {
        // Nenhum álbum salvo em lugar nenhum → default para copa-2026
        const fallback: AlbumId[] = ['copa-2026']
        setAlbumId(fallback[0])
        setActiveAlbums(fallback)
        try { localStorage.setItem('cdo_active_albums', JSON.stringify(fallback)) } catch { /* ignora */ }
      }
      setLoading(false)
    })
  }, [escolher])

  // Carrega coladas quando albumId muda
  useEffect(() => {
    if (!albumId) return
    dbGetColadas(albumId).then(saved => {
      setColadas(new Set(saved))
    })
    // Abre a primeira categoria do álbum selecionado
    const firstCatId = (ALBUM_DATA[albumId]?.categories[0]?.id) ?? 'fwc'
    queueMicrotask(() => setOpenCats(new Set([firstCatId])))
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

  // Picker aparece quando ?escolher=1 E sem albumId, ou sem nenhum album disponível
  if (!albumId) {
    return <EscolherAlbum onEscolher={id => {
      try { localStorage.setItem('cdo_active_albums', JSON.stringify([id])) } catch { /* ignora */ }
      setAlbumId(id)
      setActiveAlbums([id])
      // Remove ?escolher=1 do histórico do browser para que o botão Voltar
      // não retorne para o picker novamente
      router.replace('/album')
    }} />
  }

  const albumMeta     = ALBUMS_REGISTRY.find(a => a.id === albumId)!
  const currentAlbum  = ALBUM_DATA[albumId] ?? albumCopa2026
  // Total oficial do álbum (ignora categorias extra como XGOLD/XSILVER/etc.)
  const total         = albumMeta.totalStickers
  // Conta apenas coladas de stickers oficiais para o progresso
  const officialSids  = OFFICIAL_SIDS[albumId] ?? new Set<string>()
  const nColadas      = [...coladas].filter(sid => officialSids.has(sid)).length
  const nFaltando = total - nColadas
  const progress  = Math.round((nColadas / total) * 100)

  return (
    <div className="max-w-4xl mx-auto px-3 py-4 animate-fadein">

      {/* ── SELETOR DE ÁLBUM (só aparece com 2+ álbuns ativos) ── */}
      {activeAlbums.length > 1 && (
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
      )}

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

      {/* ── BUSCA + FILTRO ── */}
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

      <p className="text-xs text-slate-400 text-center mb-4">
        Toque na figurinha para marcar como colada · toque de novo para desmarcar
      </p>

      {/* ── CATEGORIAS (genérico para qualquer álbum) ── */}
      <div className="space-y-2">
        {currentAlbum.categories.map(cat => {
          const isOpen = openCats.has(cat.id)

          // Código curto para exibição (ex: "BRA", "FWC") — só para códigos ≤4 chars
          const showCatCode = cat.code.length <= 4

          const filtered = cat.stickers.filter(s => {
            const sid       = stickerId(cat.code, s.number)
            const stickerCode = `${cat.code} ${s.number}`
            const matchSearch = search === ''
              || String(s.number).includes(search)
              || stickerCode.toLowerCase().includes(search.toLowerCase())
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
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800">{cat.name.replace(/^[^\p{L}\p{N}]+/u, '')}</p>
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
                      const isBrilhante    = s.type === 'brilhante'
                      const isEscudo       = s.type === 'escudo'
                      const isEspecial     = s.type === 'especial'
                      const isExtraGold    = s.type === 'extra-gold'
                      const isExtraSilver  = s.type === 'extra-silver'
                      const isExtraBronze  = s.type === 'extra-bronze'
                      const isExtraPurple  = s.type === 'extra-purple'
                      const isCocaCola     = s.type === 'coca-cola'

                      const stickerClass = isColada
                        ? 'bg-green-600 border-green-700 text-white shadow-sm'
                        : isBrilhante
                          ? 'bg-amber-50 border-amber-300 text-amber-700 sticker-brilhante'
                          : isEscudo
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                            : isEspecial
                              ? 'bg-orange-50 border-orange-200 text-orange-600'
                              : isExtraGold
                                ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                                : isExtraSilver
                                  ? 'bg-slate-100 border-slate-400 text-slate-600'
                                  : isExtraBronze
                                    ? 'bg-orange-100 border-orange-400 text-orange-800'
                                    : isExtraPurple
                                      ? 'bg-purple-50 border-purple-400 text-purple-700'
                                      : isCocaCola
                                        ? 'bg-red-50 border-red-400 text-red-700'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-green-300'

                      const stickerIcon = isBrilhante ? '✨'
                        : isEscudo       ? '🛡'
                        : isEspecial     ? '⭐'
                        : isExtraGold    ? '🟡'
                        : isExtraSilver  ? '⚪'
                        : isExtraBronze  ? '🟠'
                        : isExtraPurple  ? '🟣'
                        : isCocaCola     ? '🔴'
                        : null

                      return (
                        <button
                          key={sid}
                          onClick={() => toggleColada(sid)}
                          title={`${cat.code} ${s.number} · ${s.name}`}
                          className={[
                            'w-11 h-11 rounded-lg border-2 flex flex-col items-center justify-center select-none',
                            'transition-all duration-150 active:scale-90 hover:scale-105',
                            stickerClass,
                          ].join(' ')}
                        >
                          {isColada
                            ? <span className="text-base">✓</span>
                            : (
                              <>
                                {showCatCode
                                  ? <>
                                      <span className="text-[7px] font-bold leading-none opacity-60">{cat.code}</span>
                                      <span className="text-[10px] font-bold leading-none">{s.number}</span>
                                    </>
                                  : <span className="text-[10px] font-bold leading-none">{s.number}</span>
                                }
                                {stickerIcon && <span className="text-[7px] leading-none">{stickerIcon}</span>}
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

    </div>
  )
}

export default function AlbumPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="w-7 h-7 border-2 border-slate-200 border-t-green-500 rounded-full animate-spin" />
      </div>
    }>
      <AlbumPageInner />
    </Suspense>
  )
}
