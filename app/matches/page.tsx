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
    type: 'exato' as const,
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

type Tab = 'trocas' | 'doacoes'

export default function MatchesPage() {
  const [tab, setTab] = useState<Tab>('trocas')
  const [expanded, setExpanded] = useState<string | null>(null)

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
          <p className="text-sm font-bold text-green-800">{MATCHES.length} novos matches encontrados!</p>
          <p className="text-xs text-green-600">Baseado nas suas figurinhas de troca e na lista de preciso</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'trocas',  label: `Trocas (${MATCHES.length})` },
          { key: 'doacoes', label: `Doações (${DOACOES.length})` },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
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
            const isOpen = expanded === match.id
            const isExato = match.type === 'exato'
            const p = pronome(match.user.gender)

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
                        isExato ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
                      ].join(' ')}>
                        {isExato ? '✓ Match exato' : '≈ Match parcial'}
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
                    <span className="text-green-500 font-bold">Você tem:</span>
                    <span className="font-semibold text-slate-700">{match.euTenhoPara.length} fig. {p.dele}</span>
                  </span>
                  {match.balance !== 0 && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-amber-600 font-medium">
                        {match.balance > 0 ? `+${match.balance} a mais` : `${Math.abs(match.balance)} a menos`}
                      </span>
                    </>
                  )}
                </div>

                {/* Detalhes expandidos */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-slate-50 pt-3 animate-fadein">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-blue-600 mb-2">🔵 {p.ele} tem para você:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {match.temParaMim.map(num => {
                            const s = allStickers.find(x => x.number === num)
                            return <StickerSquare key={num} number={num} name={s?.name} stickerType={s?.type} status="troca" size="sm" />
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-green-600 mb-2">🟢 Você oferece:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {match.euTenhoPara.map(num => {
                            const s = allStickers.find(x => x.number === num)
                            return <StickerSquare key={num} number={num} name={s?.name} stickerType={s?.type} status="troca" size="sm" />
                          })}
                        </div>
                      </div>
                    </div>

                    {match.balance !== 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-3 text-xs text-amber-700">
                        {match.balance > 0
                          ? `⚠️ Você oferece ${match.balance} figurinha(s) a mais. ${p.ele} precisará remover ${match.balance} da proposta ou você pode complementar com pagamento.`
                          : `⚠️ Você precisará remover ${Math.abs(match.balance)} figurinha(s) da sua oferta para equilibrar a troca.`
                        }
                      </div>
                    )}

                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                      🔁 Enviar proposta de troca
                    </button>
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
