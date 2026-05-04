'use client'

import { useState, useMemo } from 'react'
import { albumCopa2026, STICKER_PRICES, buildGlobalNumberMap, stickerId } from '@/data/album-copa-2026'
import type { StickerType } from '@/data/album-copa-2026'

type TipoAnuncio = 'venda' | 'troca' | 'doacao'

interface TipoConfig {
  ativo:        boolean
  tipoAnuncio:  TipoAnuncio
  preco:        string
  // seleção independente por ação
  selecionadas: Record<TipoAnuncio, Set<string>>
  expandido:    boolean
}

const ANUNCIO_CONFIG = {
  venda:  { label: 'Venda',  bg: 'bg-green-100',  text: 'text-green-700',  btn: 'bg-green-500 border-green-500'   },
  troca:  { label: 'Troca',  bg: 'bg-blue-100',   text: 'text-blue-700',   btn: 'bg-blue-500 border-blue-500'     },
  doacao: { label: 'Doação', bg: 'bg-purple-100', text: 'text-purple-700', btn: 'bg-purple-500 border-purple-500' },
}

const globalNumbers = buildGlobalNumberMap(albumCopa2026)

const TIPOS = [
  { key: 'normal'   as StickerType, label: 'Normais',   desc: 'Jogadores comuns',         icon: '⬜' },
  { key: 'escudo'   as StickerType, label: 'Escudos',   desc: 'Escudo de cada seleção',   icon: '🛡️' },
  { key: 'brilhante'as StickerType, label: 'Brilhantes',desc: 'Figurinhas foil especiais', icon: '✨' },
  { key: 'especial' as StickerType, label: 'Especiais', desc: 'Fotos de time e intro',    icon: '⭐' },
]

// Mock anúncios ativos
const ATIVOS_MOCK = [
  { id: 'BRA-14', nome: 'Vinicius Jr.',  seleção: '🇧🇷 Brasil',    tipo: 'brilhante', anuncio: 'venda', preco: 'R$ 15,00', qtd: 2 },
  { id: 'ARG-10', nome: 'Lionel Messi',  seleção: '🇦🇷 Argentina', tipo: 'brilhante', anuncio: 'venda', preco: 'R$ 20,00', qtd: 1 },
  { id: 'FRA-10', nome: 'Kylian Mbappé', seleção: '🇫🇷 França',    tipo: 'brilhante', anuncio: 'troca', preco: '—',        qtd: 1 },
]

type Tab = 'configurar' | 'ativos'

export default function AnunciosPage() {
  const [tab, setTab] = useState<Tab>('configurar')

  const emptySel = (): Record<TipoAnuncio, Set<string>> => ({
    venda: new Set(), troca: new Set(), doacao: new Set(),
  })

  const [configs, setConfigs] = useState<Record<StickerType, TipoConfig>>({
    normal:    { ativo: false, tipoAnuncio: 'troca', preco: '', selecionadas: emptySel(), expandido: false },
    escudo:    { ativo: false, tipoAnuncio: 'troca', preco: '', selecionadas: emptySel(), expandido: false },
    brilhante: { ativo: false, tipoAnuncio: 'venda', preco: '', selecionadas: emptySel(), expandido: false },
    especial:  { ativo: false, tipoAnuncio: 'troca', preco: '', selecionadas: emptySel(), expandido: false },
  })

  // Abre/fecha categorias dentro do seletor
  const [openCats, setOpenCats] = useState<Set<string>>(new Set())

  function update<K extends keyof TipoConfig>(tipo: StickerType, field: K, value: TipoConfig[K]) {
    setConfigs(prev => ({ ...prev, [tipo]: { ...prev[tipo], [field]: value } }))
  }

  function toggleSticker(tipo: StickerType, sid: string) {
    setConfigs(prev => {
      const acao = prev[tipo].tipoAnuncio
      const next = new Set(prev[tipo].selecionadas[acao])
      next.has(sid) ? next.delete(sid) : next.add(sid)
      return {
        ...prev,
        [tipo]: {
          ...prev[tipo],
          selecionadas: { ...prev[tipo].selecionadas, [acao]: next },
        },
      }
    })
  }

  function toggleCat(id: string) {
    setOpenCats(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Stickers por tipo, agrupados por categoria
  const stickersPorTipo = useMemo(() => {
    const map: Record<StickerType, { cat: typeof albumCopa2026.categories[0]; stickers: typeof albumCopa2026.categories[0]['stickers'] }[]> = {
      normal: [], escudo: [], brilhante: [], especial: [],
    }
    for (const cat of albumCopa2026.categories) {
      for (const tipo of Object.keys(map) as StickerType[]) {
        const filtered = cat.stickers.filter(s => s.type === tipo)
        if (filtered.length) map[tipo].push({ cat, stickers: filtered })
      }
    }
    return map
  }, [])

  const totalSelecionado = Object.values(configs).reduce((acc, c) => {
    if (!c.ativo) return acc
    return acc + c.selecionadas.venda.size + c.selecionadas.troca.size + c.selecionadas.doacao.size
  }, 0)

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 animate-fadein">

      <div className="mb-4">
        <h1 className="text-xl font-black text-slate-800">Anúncios</h1>
        <p className="text-sm text-slate-500">Escolha quais figurinhas repetidas deseja anunciar</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Selecionadas', value: totalSelecionado,  bg: 'bg-green-50',  text: 'text-green-700' },
          { label: 'Ativas',       value: ATIVOS_MOCK.length, bg: 'bg-blue-50',   text: 'text-blue-700'  },
          { label: 'Matches',      value: 4,                  bg: 'bg-amber-50',  text: 'text-amber-700' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-3 py-3 text-center`}>
            <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'configurar', label: '⚙️ Configurar' },
          { key: 'ativos',     label: `📋 Ativos (${ATIVOS_MOCK.length})` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={['flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
              tab === t.key ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ABA CONFIGURAR ── */}
      {tab === 'configurar' && (
        <div className="space-y-3 animate-fadein">

          {TIPOS.map(({ key, label, desc, icon }) => {
            const cfg  = configs[key]
            const preco = STICKER_PRICES[key]
            const grupos = stickersPorTipo[key]

            return (
              <div key={key}
                className={['bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all',
                  cfg.ativo ? 'border-green-300' : 'border-slate-100'].join(' ')}>

                {/* Header do tipo */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                  {cfg.ativo && (cfg.selecionadas.venda.size + cfg.selecionadas.troca.size + cfg.selecionadas.doacao.size) > 0 && (
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      {cfg.selecionadas.venda.size + cfg.selecionadas.troca.size + cfg.selecionadas.doacao.size} fig.
                    </span>
                  )}
                  <button
                    onClick={() => update(key, 'ativo', !cfg.ativo)}
                    className={['w-12 h-6 rounded-full transition-all relative', cfg.ativo ? 'bg-green-500' : 'bg-slate-200'].join(' ')}
                  >
                    <span className={['absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all',
                      cfg.ativo ? 'left-6' : 'left-0.5'].join(' ')} />
                  </button>
                </div>

                {/* Corpo (só se ativo) */}
                {cfg.ativo && (
                  <div className="border-t border-slate-50">

                    {/* Ação + preço */}
                    <div className="px-4 pt-3 pb-3 space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1.5">Quero</label>
                        <div className="flex gap-2">
                          {(['venda', 'troca', 'doacao'] as TipoAnuncio[]).map(tipo => (
                            <button key={tipo}
                              onClick={() => update(key, 'tipoAnuncio', tipo)}
                              className={['flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all',
                                cfg.tipoAnuncio === tipo
                                  ? `${ANUNCIO_CONFIG[tipo].btn} text-white`
                                  : 'border-slate-200 text-slate-500 hover:border-slate-300'].join(' ')}>
                              {tipo === 'venda' ? '💰 Venda' : tipo === 'troca' ? '🔁 Troca' : '💜 Doação'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {cfg.tipoAnuncio === 'venda' && (
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Preço por figurinha</label>
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-green-400">
                            <span className="text-sm font-semibold text-slate-400">R$</span>
                            <input
                              type="number" min={preco.min} step={0.5}
                              placeholder={`${preco.min},00`}
                              value={cfg.preco}
                              onChange={e => update(key, 'preco', e.target.value)}
                              className="flex-1 bg-transparent text-sm font-bold text-slate-800 focus:outline-none"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">Sugerido: R$ {preco.min},00 – R$ {preco.max},00</p>
                        </div>
                      )}
                    </div>

                    {/* Seletor de figurinhas */}
                    <div className="border-t border-slate-100">
                      <button
                        onClick={() => update(key, 'expandido', !cfg.expandido)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <span className="text-sm font-semibold text-slate-700">
                          {(() => {
                            const n = cfg.selecionadas[cfg.tipoAnuncio].size
                            return n === 0
                              ? 'Selecionar figurinhas'
                              : `${n} figurinha${n > 1 ? 's' : ''} selecionada${n > 1 ? 's' : ''} para ${cfg.tipoAnuncio}`
                          })()}
                        </span>
                        <span className={`text-slate-400 text-xs transition-transform ${cfg.expandido ? 'rotate-180' : ''}`}>▼</span>
                      </button>

                      {cfg.expandido && (
                        <div className="px-4 pb-4 space-y-2 max-h-96 overflow-y-auto">
                          {grupos.map(({ cat, stickers }) => {
                            const catId   = `${key}-${cat.id}`
                            const isOpen  = openCats.has(catId)
                            const selQty  = stickers.filter(s => cfg.selecionadas[cfg.tipoAnuncio].has(stickerId(cat.code, s.number))).length

                            return (
                              <div key={cat.id} className="border border-slate-100 rounded-xl overflow-hidden">
                                <button
                                  onClick={() => toggleCat(catId)}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                                >
                                  <span className="text-base">{cat.flag ?? '📌'}</span>
                                  <span className="flex-1 text-sm font-semibold text-slate-700">{cat.name}</span>
                                  {selQty > 0 && (
                                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                                      {selQty}✓
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-400">{isOpen ? '▲' : '▼'}</span>
                                </button>

                                {isOpen && (
                                  <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1.5 border-t border-slate-50">
                                    {stickers.map(s => {
                                      const sid      = stickerId(cat.code, s.number)
                                      const selected = cfg.selecionadas[cfg.tipoAnuncio].has(sid)
                                      const gNum     = globalNumbers.get(sid) ?? s.number
                                      return (
                                        <button
                                          key={sid}
                                          onClick={() => toggleSticker(key, sid)}
                                          title={`#${gNum} · ${s.name}`}
                                          className={[
                                            'w-11 h-11 rounded-lg border-2 flex flex-col items-center justify-center transition-all text-[10px] font-bold',
                                            'active:scale-90 hover:scale-105',
                                            selected
                                              ? cfg.tipoAnuncio === 'venda'
                                                ? 'bg-green-600 border-green-700 text-white'
                                                : cfg.tipoAnuncio === 'troca'
                                                  ? 'bg-blue-500 border-blue-600 text-white'
                                                  : 'bg-purple-500 border-purple-600 text-white'
                                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400',
                                          ].join(' ')}
                                        >
                                          {selected ? '✓' : gNum}
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Publicar */}
          {totalSelecionado > 0 && (
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl text-sm transition-colors shadow-sm">
              📢 Publicar {totalSelecionado} figurinha{totalSelecionado > 1 ? 's' : ''} agora
            </button>
          )}
        </div>
      )}

      {/* ── ABA ATIVOS ── */}
      {tab === 'ativos' && (
        <div className="animate-fadein space-y-2">
          {ATIVOS_MOCK.map(item => {
            const cfg = ANUNCIO_CONFIG[item.anuncio as TipoAnuncio]
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-slate-500">{item.id.split('-')[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{item.nome}</p>
                  <p className="text-xs text-slate-400">{item.seleção}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                  <span className="text-xs text-slate-500">{item.preco !== '—' ? item.preco : ''} · {item.qtd}x</span>
                </div>
                <button className="text-slate-300 hover:text-red-400 transition-colors ml-1 text-lg">×</button>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
