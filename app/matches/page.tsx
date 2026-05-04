'use client'

import { useState } from 'react'
import { albumCopa2026 } from '@/data/album-copa-2026'
import StickerSquare from '@/components/StickerSquare'

const allStickers = albumCopa2026.categories.flatMap(c => c.stickers)

// Meus preciso (simulado)
const MEU_PRECISO = [19, 21, 28, 40, 42, 53, 65, 76, 78, 88, 90, 101]
// Tenho para troca (simulado)
const MEU_TENHO = [17, 22, 29, 33, 45, 67, 89]

// Pronomes por gênero
function pronome(gender: 'M' | 'F') {
  return {
    ele:  gender === 'F' ? 'Ela'  : 'Ele',
    dele: gender === 'F' ? 'dela' : 'dele',
    tem:  gender === 'F' ? 'Ela tem' : 'Ele tem',
  }
}

const MATCHES = [
  {
    id: '1',
    user: { name: 'Ana Lima',  city: 'Rio de Janeiro, RJ', avatar: 'AL', avatarColor: 'from-pink-400 to-purple-500', rating: 4.9, trades: 142, gender: 'F' as const },
    type: 'parcial' as const,
    temParaMim: [28, 42, 53],
    euTenhoPara: [17, 29],
    balance: -1,
  },
  {
    id: '2',
    user: { name: 'Pedro S.',  city: 'Curitiba, PR',        avatar: 'PS', avatarColor: 'from-orange-400 to-red-500',  rating: 4.6, trades: 57,  gender: 'M' as const },
    type: 'parcial' as const,
    temParaMim: [19, 65],
    euTenhoPara: [22, 45, 67],
    balance: 1,
  },
  {
    id: '3',
    user: { name: 'Julia F.',  city: 'Belo Horizonte, MG',  avatar: 'JF', avatarColor: 'from-teal-400 to-green-500', rating: 5.0, trades: 203, gender: 'F' as const },
    type: 'exato' as const,
    temParaMim: [40, 76, 78],
    euTenhoPara: [33, 89, 22],
    balance: 0,
  },
  {
    id: '4',
    user: { name: 'Carlos M.', city: 'São Paulo, SP',        avatar: 'CM', avatarColor: 'from-green-400 to-blue-500', rating: 4.8, trades: 89,  gender: 'M' as const },
    type: 'parcial' as const,
    temParaMim: [88],
    euTenhoPara: [67],
    balance: 0,
  },
]

const DOACOES = [
  {
    id: 'd1',
    user: { name: 'Fernanda R.', city: 'Porto Alegre, RS', avatar: 'FR', avatarColor: 'from-violet-400 to-pink-500', rating: 4.5, trades: 78,  gender: 'F' as const },
    stickers: [21, 101],
  },
  {
    id: 'd2',
    user: { name: 'Marcos T.',   city: 'Fortaleza, CE',    avatar: 'MT', avatarColor: 'from-blue-400 to-indigo-500', rating: 4.7, trades: 31,  gender: 'M' as const },
    stickers: [90],
  },
]

// Vendedores com figurinhas que você precisa
const VENDAS = [
  {
    id: 'v1',
    user: { name: 'Ricardo B.', city: 'São Paulo, SP',       avatar: 'RB', avatarColor: 'from-green-400 to-teal-500',  rating: 4.8, sales: 64, gender: 'M' as const },
    items: [
      { num: 19, preco: 'R$ 2,00',  tipo: 'normal'    as const },
      { num: 21, preco: 'R$ 2,00',  tipo: 'normal'    as const },
      { num: 40, preco: 'R$ 12,00', tipo: 'brilhante' as const },
    ],
  },
  {
    id: 'v2',
    user: { name: 'Camila T.',  city: 'Belo Horizonte, MG', avatar: 'CT', avatarColor: 'from-rose-400 to-pink-500',   rating: 5.0, sales: 128, gender: 'F' as const },
    items: [
      { num: 65, preco: 'R$ 2,00',  tipo: 'normal'    as const },
      { num: 76, preco: 'R$ 8,00',  tipo: 'escudo'    as const },
      { num: 88, preco: 'R$ 2,00',  tipo: 'normal'    as const },
      { num: 90, preco: 'R$ 15,00', tipo: 'brilhante' as const },
    ],
  },
  {
    id: 'v3',
    user: { name: 'Leandro P.', city: 'Recife, PE',          avatar: 'LP', avatarColor: 'from-amber-400 to-orange-500', rating: 4.6, sales: 33, gender: 'M' as const },
    items: [
      { num: 101, preco: 'R$ 2,00', tipo: 'normal' as const },
      { num: 78,  preco: 'R$ 5,00', tipo: 'escudo' as const },
    ],
  },
]

type Tab = 'trocas' | 'doacoes' | 'vendas'

export default function MatchesPage() {
  const [tab, setTab]           = useState<Tab>('trocas')
  const [expanded, setExpanded] = useState<string | null>(null)
  // Trocas: figurinhas removidas da oferta por match
  const [removidos, setRemovidos] = useState<Record<string, Set<number>>>({})
  // Vendas: figurinhas selecionadas no carrinho por vendedor
  const [carrinho, setCarrinho] = useState<Record<string, Set<number>>>({})

  function toggleRemovido(matchId: string, num: number) {
    setRemovidos(prev => {
      const next = new Set(prev[matchId] ?? [])
      next.has(num) ? next.delete(num) : next.add(num)
      return { ...prev, [matchId]: next }
    })
  }

  function toggleCarrinho(vendaId: string, num: number) {
    setCarrinho(prev => {
      const next = new Set(prev[vendaId] ?? [])
      next.has(num) ? next.delete(num) : next.add(num)
      return { ...prev, [vendaId]: next }
    })
  }

  function selecionarTudo(vendaId: string, nums: number[]) {
    setCarrinho(prev => ({ ...prev, [vendaId]: new Set(nums) }))
  }

  function limparCarrinho(vendaId: string) {
    setCarrinho(prev => ({ ...prev, [vendaId]: new Set() }))
  }

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 animate-fadein">
      <div className="mb-4">
        <h1 className="text-xl font-black text-slate-800">Matches</h1>
        <p className="text-sm text-slate-500">Colecionadores com figurinhas do seu interesse</p>
      </div>

      {/* Aviso de match */}
      <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
        <span className="text-2xl">🔥</span>
        <div>
          <p className="text-sm font-bold text-green-800">{MATCHES.length + VENDAS.length + DOACOES.length} matches encontrados!</p>
          <p className="text-xs text-green-600">Trocas, vendas e doações com figurinhas que você precisa</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1.5 mb-4">
        {([
          { key: 'trocas',  label: `🔁 Trocas (${MATCHES.length})` },
          { key: 'vendas',  label: `💰 Vendas (${VENDAS.length})` },
          { key: 'doacoes', label: `💜 Doações (${DOACOES.length})` },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all',
              tab === t.key
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-500 border border-slate-200',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TROCAS ── */}
      {tab === 'trocas' && (
        <div className="space-y-3 animate-fadein">
          {MATCHES.map(match => {
            const rem        = removidos[match.id] ?? new Set<number>()
            const oferta     = match.euTenhoPara.filter(n => !rem.has(n))
            const dynBalance = oferta.length - match.temParaMim.length
            const equilibrado = dynBalance === 0
            const isOpen     = expanded === match.id
            const isExato    = equilibrado && oferta.length === match.temParaMim.length && rem.size === 0 && match.balance === 0
            const p          = pronome(match.user.gender)

            return (
              <div key={match.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${match.user.avatarColor} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-black">{match.user.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-800">{match.user.name}</p>
                      <span className={[
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        equilibrado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
                      ].join(' ')}>
                        {equilibrado ? '✓ Match exato' : '≈ Match parcial'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{match.user.city} · ⭐ {match.user.rating}</p>
                  </div>
                  <button
                    onClick={() => setExpanded(isOpen ? null : match.id)}
                    className="text-slate-400 text-sm px-2"
                  >
                    {isOpen ? '▲' : '▼'}
                  </button>
                </div>

                {/* Resumo rápido */}
                <div className="px-4 pb-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="text-blue-500 font-bold">{p.ele} tem:</span>
                    <span className="font-semibold text-slate-700">{match.temParaMim.length} fig. suas</span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1">
                    <span className="text-green-500 font-bold">Você oferece:</span>
                    <span className="font-semibold text-slate-700">{oferta.length} fig. {p.dele}</span>
                  </span>
                  {!equilibrado && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-amber-600 font-medium">
                        {dynBalance > 0 ? `${dynBalance} a mais` : `${Math.abs(dynBalance)} a menos`}
                      </span>
                    </>
                  )}
                </div>

                {/* Detalhes expandidos */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-slate-50 pt-3 animate-fadein">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      {/* Figurinhas que ele tem pra mim */}
                      <div>
                        <p className="text-xs font-semibold text-blue-600 mb-2">🔵 {p.ele} tem para você:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {match.temParaMim.map(num => {
                            const s = allStickers.find(x => x.number === num)
                            return <StickerSquare key={num} number={num} name={s?.name} stickerType={s?.type} status="troca" size="sm" />
                          })}
                        </div>
                      </div>

                      {/* Minha oferta — clicável para remover */}
                      <div>
                        <p className="text-xs font-semibold text-green-600 mb-1">🟢 Você oferece:</p>
                        {dynBalance !== 0 && (
                          <p className="text-[10px] text-slate-400 mb-1.5">Toque para remover da oferta</p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {match.euTenhoPara.map(num => {
                            const s        = allStickers.find(x => x.number === num)
                            const removido = rem.has(num)
                            return (
                              <button
                                key={num}
                                onClick={() => toggleRemovido(match.id, num)}
                                title={removido ? `Recolocar #${num}` : `Remover #${num} da oferta`}
                                className={[
                                  'w-9 h-9 rounded-lg border-2 flex flex-col items-center justify-center transition-all active:scale-90',
                                  removido
                                    ? 'bg-slate-100 border-slate-200 text-slate-300 line-through opacity-50'
                                    : 'bg-blue-50 border-blue-300 text-blue-700 hover:border-red-300 hover:bg-red-50',
                                ].join(' ')}
                              >
                                <span className="text-[10px] font-bold leading-none">{removido ? '✕' : num}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Aviso de desequilíbrio */}
                    {!equilibrado && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-3 text-xs text-amber-700">
                        {dynBalance > 0
                          ? `⚠️ Você oferece ${dynBalance} figurinha(s) a mais — remova ${dynBalance} da sua oferta para equilibrar.`
                          : `⚠️ Faltam ${Math.abs(dynBalance)} figurinha(s) na sua oferta para equilibrar a troca.`
                        }
                      </div>
                    )}

                    {equilibrado && rem.size > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 mb-3 text-xs text-green-700">
                        ✅ Troca equilibrada! Você pode enviar a proposta agora.
                      </div>
                    )}

                    <button
                      disabled={!equilibrado}
                      className={[
                        'w-full font-bold py-3 rounded-xl text-sm transition-colors',
                        equilibrado
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                      ].join(' ')}
                    >
                      🔁 {equilibrado ? 'Enviar proposta de troca' : `Ajuste a oferta para enviar`}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── VENDAS ── */}
      {tab === 'vendas' && (
        <div className="space-y-3 animate-fadein">
          <p className="text-xs text-slate-400 text-center mb-1">
            Vendedores com figurinhas que você ainda não tem — toque nas que quer comprar
          </p>
          {VENDAS.map(v => {
            const isOpen     = expanded === v.id
            const sel        = carrinho[v.id] ?? new Set<number>()
            const precoNum   = (p: string) => parseFloat(p.replace('R$ ', '').replace(',', '.'))
            const totalSel   = v.items.filter(i => sel.has(i.num)).reduce((a, i) => a + precoNum(i.preco), 0)
            const precoMin   = Math.min(...v.items.map(i => precoNum(i.preco)))
            const precoMax   = Math.max(...v.items.map(i => precoNum(i.preco)))
            const faixaPreco = precoMin === precoMax
              ? `R$ ${precoMin.toFixed(2).replace('.', ',')}`
              : `R$ ${precoMin.toFixed(2).replace('.', ',')} – R$ ${precoMax.toFixed(2).replace('.', ',')}`

            return (
              <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* Header — sempre visível */}
                <button
                  onClick={() => setExpanded(isOpen ? null : v.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${v.user.avatarColor} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-black">{v.user.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-800">{v.user.name}</p>
                      {sel.size > 0 && (
                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          {sel.size} no carrinho
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {v.user.city} · ⭐ {v.user.rating} · {v.user.sales} vendas
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className="text-[10px] font-semibold text-slate-500">{v.items.length} fig. disponíveis</span>
                    <span className="text-[10px] text-slate-400">{faixaPreco}</span>
                  </div>
                  <span className="text-slate-400 text-xs ml-1">{isOpen ? '▲' : '▼'}</span>
                </button>

                {/* Grid expandido */}
                {isOpen && (
                  <div className="border-t border-slate-50 px-4 pt-3 pb-4 animate-fadein">

                    {/* Ações rápidas */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => selecionarTudo(v.id, v.items.map(i => i.num))}
                        className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        Selecionar tudo
                      </button>
                      {sel.size > 0 && (
                        <button
                          onClick={() => limparCarrinho(v.id)}
                          className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    {/* Grid de quadradinhos */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {v.items.map(item => {
                        const selecionado = sel.has(item.num)
                        const isBrilhante = item.tipo === 'brilhante'
                        const isEscudo    = item.tipo === 'escudo'
                        return (
                          <button
                            key={item.num}
                            onClick={() => toggleCarrinho(v.id, item.num)}
                            title={`#${item.num} · ${allStickers.find(x => x.number === item.num)?.name ?? ''} · ${item.preco}`}
                            className={[
                              'w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 hover:scale-105 select-none',
                              selecionado
                                ? 'bg-green-600 border-green-700 text-white shadow-sm'
                                : isBrilhante
                                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                                  : isEscudo
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-green-300',
                            ].join(' ')}
                          >
                            {selecionado ? (
                              <span className="text-base leading-none">✓</span>
                            ) : (
                              <>
                                <span className="text-[10px] font-black leading-none">{item.num}</span>
                                <span className="text-[8px] leading-none font-semibold opacity-75">
                                  {item.preco.replace('R$ ', 'R$')}
                                </span>
                                {isBrilhante && <span className="text-[7px] leading-none">✨</span>}
                                {isEscudo    && <span className="text-[7px] leading-none">🛡</span>}
                              </>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Carrinho dinâmico */}
                    {sel.size > 0 ? (
                      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-green-800">
                            {sel.size} figurinha{sel.size > 1 ? 's' : ''} selecionada{sel.size > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-green-600">
                            Total: <span className="font-black">{totalSel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </p>
                        </div>
                        <button className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors flex-shrink-0">
                          🛒 Comprar
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center">
                        Toque nas figurinhas que quer comprar
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── DOAÇÕES ── */}
      {tab === 'doacoes' && (
        <div className="space-y-3 animate-fadein">
          {DOACOES.map(d => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${d.user.avatarColor} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-black">{d.user.avatar}</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800">{d.user.name}</p>
                  <p className="text-xs text-slate-400">{d.user.city} · ⭐ {d.user.rating}</p>
                </div>
                <span className="ml-auto text-xs bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded-full">
                  💜 Doação
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {d.stickers.map(num => {
                  const s = allStickers.find(x => x.number === num)
                  return <StickerSquare key={num} number={num} name={s?.name} stickerType={s?.type} status="doacao" size="sm" />
                })}
              </div>

              <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                💜 Solicitar doação
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
