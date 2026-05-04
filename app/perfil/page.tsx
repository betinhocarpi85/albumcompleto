'use client'

import { useState } from 'react'
import { albumCopa2026, STICKER_PRICES } from '@/data/album-copa-2026'
import FilterTabs from '@/components/FilterTabs'
import type { FilterType } from '@/components/FilterTabs'
import StickerSquare from '@/components/StickerSquare'
import type { StickerStatus } from '@/components/StickerSquare'

// Dados mockados do usuário anunciante
const PROFILE = {
  name: 'Carlos Mendes',
  city: 'São Paulo, SP',
  since: 'Abril 2026',
  avatar: 'CM',
  rating: 4.8,
  ratings: 127,
  trades: 89,
  sales: 34,
  donations: 12,
  badges: ['🥇 Vendedor Verificado', '💜 Doador Ouro', '⭐ Top Trocador'],
  completion: 73,
}

// Figurinhas do anunciante
const ANUNCIO_STICKERS: Record<number, StickerStatus[]> = {
  17:  ['venda'],
  22:  ['troca', 'venda'],
  29:  ['troca'],
  33:  ['doacao'],
  45:  ['venda'],
  67:  ['troca'],
  89:  ['venda', 'troca'],
  16:  ['troca'],
  52:  ['venda'],
  64:  ['troca', 'doacao'],
  18:  ['venda'],
  30:  ['troca'],
  41:  ['doacao'],
  100: ['venda'],
  112: ['troca'],
  125: ['venda'],
  137: ['troca'],
  149: ['venda'],
  161: ['troca'],
  173: ['doacao'],
}

const PRECISO_STICKERS: number[] = [19, 21, 28, 40, 42, 53, 65, 76, 78, 88, 90, 101, 113, 124, 136, 148, 160, 172, 184, 196]

const allStickers = albumCopa2026.categories.flatMap(c =>
  c.stickers.map(s => ({ ...s, categoryName: c.name, categoryFlag: c.flag }))
)

export default function PerfilPage() {
  const [tab, setTab]       = useState<'anuncio' | 'preciso'>('anuncio')
  const [filter, setFilter] = useState<FilterType>('todos')
  const [proposal, setProposal] = useState<number | null>(null)

  // Figurinhas filtradas para aba Anúncio
  const anuncioFiltered = allStickers.filter(s => {
    const statuses = ANUNCIO_STICKERS[s.number] ?? []
    if (!statuses.length) return false
    if (filter === 'todos') return true
    return statuses.includes(filter as StickerStatus)
  })

  // Contagens
  const counts: Partial<Record<FilterType, number>> = { todos: 0 }
  Object.values(ANUNCIO_STICKERS).forEach(statuses => {
    statuses.forEach(s => {
      counts[s as FilterType] = (counts[s as FilterType] ?? 0) + 1
    })
    counts.todos = (counts.todos ?? 0) + 1
  })

  const precisoStickers = allStickers.filter(s => PRECISO_STICKERS.includes(s.number))

  const stickerInfo = proposal ? allStickers.find(s => s.number === proposal) : null

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 animate-fadein">

      {/* ── CARD DE PERFIL ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-black">{PROFILE.avatar}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-lg font-black text-slate-800">{PROFILE.name}</h1>
                <p className="text-sm text-slate-500">{PROFILE.city} · desde {PROFILE.since}</p>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex-shrink-0">
                <span className="text-amber-500 text-sm">⭐</span>
                <span className="font-black text-slate-700 text-sm">{PROFILE.rating}</span>
                <span className="text-slate-400 text-xs">({PROFILE.ratings})</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PROFILE.badges.map(b => (
                <span key={b} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-50">
          {[
            { value: PROFILE.trades,    label: 'Trocas',  color: 'text-blue-600' },
            { value: PROFILE.sales,     label: 'Vendas',  color: 'text-green-600' },
            { value: PROFILE.donations, label: 'Doações', color: 'text-purple-600' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Progresso */}
        <div className="mt-4 pt-4 border-t border-slate-50">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Progresso do álbum</span>
            <span className="font-bold text-green-600">{PROFILE.completion}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
              style={{ width: `${PROFILE.completion}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── ABAS ── */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'anuncio', label: `Anúncios (${Object.keys(ANUNCIO_STICKERS).length})` },
          { key: 'preciso', label: `Preciso (${PRECISO_STICKERS.length})` },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
              tab === t.key
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ABA: ANÚNCIOS ── */}
      {tab === 'anuncio' && (
        <div className="animate-fadein">
          <div className="mb-3">
            <FilterTabs active={filter} onChange={setFilter} counts={counts} />
          </div>

          {/* Grid por categoria */}
          {albumCopa2026.categories.map(category => {
            const catStickers = anuncioFiltered.filter(s => s.categoryName === category.name)
            if (!catStickers.length) return null

            return (
              <div key={category.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-3 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2">
                  <span className="text-base">{category.flag ?? '📌'}</span>
                  <span className="font-bold text-sm text-slate-800">{category.name}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-auto">
                    {catStickers.length} figurinha{catStickers.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-4">
                  {/* Figurinhas em lista com tipo e ação */}
                  <div className="space-y-2">
                    {catStickers.map(sticker => {
                      const statuses = ANUNCIO_STICKERS[sticker.number] ?? []
                      const price = STICKER_PRICES[sticker.type]
                      return (
                        <div
                          key={sticker.number}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <StickerSquare
                            number={sticker.number}
                            stickerType={sticker.type}
                            status={statuses}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{sticker.name}</p>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              {statuses.map(s => (
                                <span
                                  key={s}
                                  className={[
                                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white',
                                    s === 'venda'  ? 'bg-green-500' :
                                    s === 'troca'  ? 'bg-blue-500'  :
                                    s === 'doacao' ? 'bg-purple-500': 'bg-red-500',
                                  ].join(' ')}
                                >
                                  {s === 'venda' ? 'Venda' : s === 'troca' ? 'Troca' : s === 'doacao' ? 'Doação' : 'Preciso'}
                                </span>
                              ))}
                              {statuses.includes('venda') && (
                                <span className="text-[10px] text-slate-400">
                                  R$ {price.min},00 – R$ {price.max},00
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setProposal(sticker.number)}
                            className="flex-shrink-0 text-xs bg-green-50 border border-green-200 text-green-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            {statuses.includes('venda') ? 'Comprar' : statuses.includes('troca') ? 'Trocar' : 'Quero'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── ABA: PRECISO ── */}
      {tab === 'preciso' && (
        <div className="animate-fadein">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-500 mb-3">
              {PROFILE.name.split(' ')[0]} precisa destas figurinhas para completar o álbum:
            </p>
            {albumCopa2026.categories.map(category => {
              const catPreciso = precisoStickers.filter(s => s.categoryName === category.name)
              if (!catPreciso.length) return null
              return (
                <div key={category.id} className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm">{category.flag ?? '📌'}</span>
                    <span className="text-xs font-bold text-slate-600">{category.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {catPreciso.map(s => (
                      <StickerSquare
                        key={s.number}
                        number={s.number}
                        name={s.name}
                        stickerType={s.type}
                        status="preciso"
                        size="sm"
                      />
                    ))}
                  </div>
                </div>
              )
            })}

            {/* CTA: Tenho figurinhas que ele precisa */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Você tem alguma figurinha que {PROFILE.name.split(' ')[0]} precisa?
              </p>
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                🔁 Propor uma troca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PROPOSTA ── */}
      {proposal !== null && stickerInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setProposal(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fadein max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-black text-slate-800">Figurinha #{stickerInfo.number}</h3>
              <p className="text-sm text-slate-500">{stickerInfo.name}</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {ANUNCIO_STICKERS[proposal]?.includes('comprar' as StickerStatus) && (
                <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                  💳 Comprar esta figurinha
                </button>
              )}
              {ANUNCIO_STICKERS[proposal]?.includes('troca') && (
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                  🔁 Propor troca — ver meu álbum
                </button>
              )}
              {ANUNCIO_STICKERS[proposal]?.includes('doacao') && (
                <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                  💜 Solicitar esta doação
                </button>
              )}
              <button
                onClick={() => setProposal(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
