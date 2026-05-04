'use client'

import { useState, useMemo } from 'react'
import { albumCopa2026, STICKER_PRICES, buildGlobalNumberMap, stickerId } from '@/data/album-copa-2026'
import type { StickerType } from '@/data/album-copa-2026'

type TipoAnuncio = 'venda' | 'troca' | 'doacao'

// selecionadas: sid → quantidade (Map em vez de Set)
interface TipoConfig {
  ativo:        boolean
  tipoAnuncio:  TipoAnuncio
  preco:        string
  selecionadas: Record<TipoAnuncio, Map<string, number>>
  expandido:    boolean
}

const ANUNCIO_CONFIG = {
  venda:  { label: 'Venda',  bg: 'bg-green-100',  text: 'text-green-700',  btn: 'bg-green-500 border-green-500'   },
  troca:  { label: 'Troca',  bg: 'bg-blue-100',   text: 'text-blue-700',   btn: 'bg-blue-500 border-blue-500'     },
  doacao: { label: 'Doação', bg: 'bg-purple-100', text: 'text-purple-700', btn: 'bg-purple-500 border-purple-500' },
}

const globalNumbers = buildGlobalNumberMap(albumCopa2026)

const TIPOS = [
  { key: 'normal'    as StickerType, label: 'Normais',    desc: 'Jogadores comuns',          icon: '⬜' },
  { key: 'escudo'    as StickerType, label: 'Escudos',    desc: 'Escudo de cada seleção',    icon: '🛡️' },
  { key: 'brilhante' as StickerType, label: 'Brilhantes', desc: 'Figurinhas foil especiais',  icon: '✨' },
  { key: 'especial'  as StickerType, label: 'Especiais',  desc: 'Fotos de time e intro',     icon: '⭐' },
]

interface AtivoItem {
  id: string; nome: string; seleção: string; tipo: string
  anuncio: string; preco: string; qtd: number
}

const ATIVOS_INICIAL: AtivoItem[] = [
  { id: 'BRA-14', nome: 'Vinicius Jr.',  seleção: '🇧🇷 Brasil',    tipo: 'brilhante', anuncio: 'venda', preco: 'R$ 15,00', qtd: 2 },
  { id: 'ARG-10', nome: 'Lionel Messi',  seleção: '🇦🇷 Argentina', tipo: 'brilhante', anuncio: 'venda', preco: 'R$ 20,00', qtd: 1 },
  { id: 'FRA-10', nome: 'Kylian Mbappé', seleção: '🇫🇷 França',    tipo: 'brilhante', anuncio: 'troca', preco: '—',        qtd: 1 },
]

type Tab = 'configurar' | 'ativos'

const emptySel = (): Record<TipoAnuncio, Map<string, number>> => ({
  venda: new Map(), troca: new Map(), doacao: new Map(),
})

interface QtyModal {
  tipo:  StickerType
  sid:   string
  gNum:  number | string
  nome:  string
  qtdAtual: number  // 0 = ainda não selecionado
}

export default function AnunciosPage() {
  const [tab, setTab]       = useState<Tab>('configurar')
  const [ativos, setAtivos] = useState<AtivoItem[]>(ATIVOS_INICIAL)
  const [modal, setModal]   = useState<QtyModal | null>(null)
  const [modalQty, setModalQty] = useState(1)

  const [configs, setConfigs] = useState<Record<StickerType, TipoConfig>>({
    normal:    { ativo: false, tipoAnuncio: 'troca', preco: '', selecionadas: emptySel(), expandido: false },
    escudo:    { ativo: false, tipoAnuncio: 'troca', preco: '', selecionadas: emptySel(), expandido: false },
    brilhante: { ativo: false, tipoAnuncio: 'venda', preco: '', selecionadas: emptySel(), expandido: false },
    especial:  { ativo: false, tipoAnuncio: 'troca', preco: '', selecionadas: emptySel(), expandido: false },
  })

  const [openCats, setOpenCats] = useState<Set<string>>(new Set())

  function update<K extends keyof TipoConfig>(tipo: StickerType, field: K, value: TipoConfig[K]) {
    setConfigs(prev => ({ ...prev, [tipo]: { ...prev[tipo], [field]: value } }))
  }

  // Toca no quadradinho → abre modal de quantidade
  function abrirModal(tipo: StickerType, sid: string, gNum: number | string, nome: string) {
    const qtdAtual = configs[tipo].selecionadas[configs[tipo].tipoAnuncio].get(sid) ?? 0
    setModal({ tipo, sid, gNum, nome, qtdAtual })
    setModalQty(qtdAtual > 0 ? qtdAtual : 1)
  }

  // Confirma a quantidade no modal
  function confirmarModal() {
    if (!modal) return
    setConfigs(prev => {
      const acao = prev[modal.tipo].tipoAnuncio
      const next = new Map(prev[modal.tipo].selecionadas[acao])
      if (modalQty <= 0) { next.delete(modal.sid) } else { next.set(modal.sid, modalQty) }
      return { ...prev, [modal.tipo]: { ...prev[modal.tipo], selecionadas: { ...prev[modal.tipo].selecionadas, [acao]: next } } }
    })
    setModal(null)
  }

  // Remove figurinha direto (sem passar pelo modal)
  function removerSticker(tipo: StickerType, sid: string) {
    setConfigs(prev => {
      const acao = prev[tipo].tipoAnuncio
      const next = new Map(prev[tipo].selecionadas[acao])
      next.delete(sid)
      return { ...prev, [tipo]: { ...prev[tipo], selecionadas: { ...prev[tipo].selecionadas, [acao]: next } } }
    })
  }

  function toggleCat(id: string) {
    setOpenCats(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Atualiza qty de um ativo (aba Ativos)
  function setAtivoQty(id: string, delta: number) {
    setAtivos(prev => prev.map(a =>
      a.id === id ? { ...a, qtd: Math.max(1, a.qtd + delta) } : a
    ))
  }
  function removeAtivo(id: string) {
    setAtivos(prev => prev.filter(a => a.id !== id))
  }

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

  // Total de figurinhas (soma de quantidades)
  const totalSelecionado = Object.values(configs).reduce((acc, c) => {
    if (!c.ativo) return acc
    for (const m of Object.values(c.selecionadas)) for (const qty of m.values()) acc += qty
    return acc
  }, 0)

  // Total de IDs únicos selecionados (para o badge)
  const totalUnicos = Object.values(configs).reduce((acc, c) => {
    if (!c.ativo) return acc
    for (const m of Object.values(c.selecionadas)) acc += m.size
    return acc
  }, 0)

  const allStickersFlat = useMemo(() =>
    albumCopa2026.categories.flatMap(c => c.stickers.map(s => ({ ...s, catCode: c.code, catName: c.name }))), [])

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 animate-fadein">

      {/* ── MODAL DE QUANTIDADE ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadein">

            {/* Info figurinha */}
            <p className="text-xs text-slate-400 mb-1">Figurinha #{modal.gNum}</p>
            <p className="font-black text-slate-800 text-lg leading-tight mb-4">{modal.nome}</p>

            {/* Pergunta */}
            <p className="text-sm text-slate-600 mb-4">
              Quantas unidades você tem{modal.qtdAtual > 0 ? ' (toque para atualizar)' : ''} disponíveis para anunciar?
            </p>

            {/* Stepper grande */}
            <div className="flex items-center justify-center gap-5 mb-6">
              <button
                onClick={() => setModalQty(q => Math.max(1, q - 1))}
                disabled={modalQty <= 1}
                className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-3xl font-black text-slate-700 transition-colors flex items-center justify-center"
              >
                −
              </button>
              <div className="text-center">
                <span className="text-5xl font-black text-slate-800">{modalQty}</span>
                <p className="text-xs text-slate-400 mt-1">unidade{modalQty > 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => setModalQty(q => q + 1)}
                className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-3xl font-black text-slate-700 transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              {modal.qtdAtual > 0 && (
                <button
                  onClick={() => { removerSticker(modal.tipo, modal.sid); setModal(null) }}
                  className="px-4 py-3 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors"
                >
                  Remover
                </button>
              )}
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarModal}
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-black transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h1 className="text-xl font-black text-slate-800">Anúncios</h1>
        <p className="text-sm text-slate-500">Escolha quais figurinhas repetidas deseja anunciar</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Selecionadas', value: totalUnicos,    bg: 'bg-green-50',  text: 'text-green-700' },
          { label: 'Ativas',       value: ativos.length,  bg: 'bg-blue-50',   text: 'text-blue-700'  },
          { label: 'Matches',      value: 4,              bg: 'bg-amber-50',  text: 'text-amber-700' },
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
          { key: 'ativos',     label: `📋 Ativos (${ativos.length})` },
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
            const cfg    = configs[key]
            const preco  = STICKER_PRICES[key]
            const grupos = stickersPorTipo[key]
            const selMap = cfg.selecionadas[cfg.tipoAnuncio]
            const selIds = [...selMap.keys()]

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
                  {cfg.ativo && selIds.length > 0 && (
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      {selIds.length} fig. · {[...selMap.values()].reduce((a, b) => a + b, 0)} unid.
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
                          {selIds.length === 0
                            ? 'Selecionar figurinhas'
                            : `${selIds.length} figurinha${selIds.length > 1 ? 's' : ''} selecionada${selIds.length > 1 ? 's' : ''}`}
                        </span>
                        <span className={`text-slate-400 text-xs transition-transform ${cfg.expandido ? 'rotate-180' : ''}`}>▼</span>
                      </button>

                      {cfg.expandido && (
                        <div className="px-4 pb-4 space-y-2 max-h-[28rem] overflow-y-auto">

                          {/* Grid por categoria */}
                          {grupos.map(({ cat, stickers }) => {
                            const catId  = `${key}-${cat.id}`
                            const isOpen = openCats.has(catId)
                            const selQty = stickers.filter(s => selMap.has(stickerId(cat.code, s.number))).length

                            return (
                              <div key={cat.id} className="border border-slate-100 rounded-xl overflow-hidden">
                                <button
                                  onClick={() => toggleCat(catId)}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                                >
                                  <span className="text-base">{cat.flag ?? '📌'}</span>
                                  <span className="flex-1 text-sm font-semibold text-slate-700">{cat.name}</span>
                                  {selQty > 0 && (
                                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">{selQty}✓</span>
                                  )}
                                  <span className="text-xs text-slate-400">{isOpen ? '▲' : '▼'}</span>
                                </button>

                                {isOpen && (
                                  <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1.5 border-t border-slate-50">
                                    {stickers.map(s => {
                                      const sid      = stickerId(cat.code, s.number)
                                      const qty      = selMap.get(sid) ?? 0
                                      const selected = qty > 0
                                      const gNum     = globalNumbers.get(sid) ?? s.number

                                      const btnColor = selected
                                        ? cfg.tipoAnuncio === 'venda'  ? 'bg-green-600 border-green-700 text-white'
                                        : cfg.tipoAnuncio === 'troca'  ? 'bg-blue-500 border-blue-600 text-white'
                                        :                                 'bg-purple-500 border-purple-600 text-white'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'

                                      return (
                                        <button
                                          key={sid}
                                          onClick={() => abrirModal(key, sid, gNum, s.name)}
                                          title={selected ? `#${gNum} · ${s.name} · ${qty} unid. (toque para editar)` : `#${gNum} · ${s.name} · toque para adicionar`}
                                          className={[
                                            'w-11 h-11 rounded-lg border-2 flex flex-col items-center justify-center transition-all text-[10px] font-bold active:scale-90 hover:scale-105',
                                            btnColor,
                                          ].join(' ')}
                                        >
                                          {selected ? (
                                            <>
                                              <span className="text-[13px] font-black leading-none">{qty}×</span>
                                            </>
                                          ) : gNum}
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}

                          {/* Dica */}
                          {selIds.length > 0 && (
                            <p className="text-[10px] text-slate-400 text-center pt-1">
                              Toque em qualquer figurinha selecionada para editar a quantidade
                            </p>
                          )}
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
              📢 Publicar {totalUnicos} figurinha{totalUnicos > 1 ? 's' : ''} · {totalSelecionado} unidade{totalSelecionado > 1 ? 's' : ''} no total
            </button>
          )}
        </div>
      )}

      {/* ── ABA ATIVOS ── */}
      {tab === 'ativos' && (
        <div className="animate-fadein space-y-2">
          {ativos.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">Nenhum anúncio ativo</p>
            </div>
          )}
          {ativos.map(item => {
            const cfg = ANUNCIO_CONFIG[item.anuncio as TipoAnuncio]
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  {/* Num */}
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-slate-500">{item.id.split('-')[1]}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">{item.nome}</p>
                    <p className="text-xs text-slate-400">{item.seleção}</p>
                  </div>

                  {/* Tipo + preço */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    {item.preco !== '—' && <span className="text-xs font-semibold text-slate-500">{item.preco}</span>}
                  </div>

                  {/* Remover */}
                  <button
                    onClick={() => removeAtivo(item.id)}
                    className="text-slate-300 hover:text-red-400 transition-colors ml-1 text-lg flex-shrink-0"
                  >
                    ×
                  </button>
                </div>

                {/* Quantidade — só para venda e troca */}
                {item.anuncio !== 'doacao' && (
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Quantidade disponível</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAtivoQty(item.id, -1)}
                        disabled={item.qtd <= 1}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 font-black text-base transition-colors flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-base font-black text-slate-800">{item.qtd}</span>
                      <button
                        onClick={() => setAtivoQty(item.id, +1)}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-base transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                      <span className="text-xs text-slate-400 ml-1">unid.</span>
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
