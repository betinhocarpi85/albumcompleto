'use client'

import { useState } from 'react'
import { albumCopa2026 } from '@/data/album-copa-2026'
import StickerSquare from '@/components/StickerSquare'
import FilterTabs from '@/components/FilterTabs'
import type { FilterType } from '@/components/FilterTabs'
import type { StickerStatus } from '@/components/StickerSquare'

const MOCK_USERS = [
  {
    id: '1', name: 'Carlos M.', city: 'São Paulo, SP', avatar: 'CM',
    rating: 4.8, trades: 89, avatarColor: 'from-green-400 to-blue-500',
    stickers: { 17: ['venda'], 22: ['troca'], 29: ['troca'], 16: ['troca'], 52: ['venda'], 64: ['doacao'] } as Record<number, StickerStatus[]>,
  },
  {
    id: '2', name: 'Ana Lima', city: 'Rio de Janeiro, RJ', avatar: 'AL',
    rating: 4.9, trades: 142, avatarColor: 'from-pink-400 to-purple-500',
    stickers: { 41: ['venda'], 53: ['troca'], 77: ['doacao'], 89: ['venda'], 100: ['troca'], 125: ['venda'] } as Record<number, StickerStatus[]>,
  },
  {
    id: '3', name: 'Pedro S.', city: 'Curitiba, PR', avatar: 'PS',
    rating: 4.6, trades: 57, avatarColor: 'from-orange-400 to-red-500',
    stickers: { 28: ['troca'], 40: ['venda'], 76: ['troca'], 88: ['doacao'], 112: ['venda'] } as Record<number, StickerStatus[]>,
  },
  {
    id: '4', name: 'Julia F.', city: 'Belo Horizonte, MG', avatar: 'JF',
    rating: 5.0, trades: 203, avatarColor: 'from-teal-400 to-green-500',
    stickers: { 33: ['doacao'], 45: ['troca'], 67: ['venda'], 99: ['troca'], 137: ['venda'], 161: ['doacao'] } as Record<number, StickerStatus[]>,
  },
  {
    id: '5', name: 'Marcos T.', city: 'Fortaleza, CE', avatar: 'MT',
    rating: 4.7, trades: 31, avatarColor: 'from-blue-400 to-indigo-500',
    stickers: { 18: ['venda'], 30: ['troca'], 42: ['venda'], 54: ['troca'], 78: ['doacao'] } as Record<number, StickerStatus[]>,
  },
  {
    id: '6', name: 'Fernanda R.', city: 'Porto Alegre, RS', avatar: 'FR',
    rating: 4.5, trades: 78, avatarColor: 'from-violet-400 to-pink-500',
    stickers: { 19: ['troca'], 31: ['venda'], 65: ['troca'], 101: ['doacao'], 149: ['venda'] } as Record<number, StickerStatus[]>,
  },
]

const allStickers = albumCopa2026.categories.flatMap(c => c.stickers)

export default function ExplorarPage() {
  const [filter, setFilter] = useState<FilterType>('todos')
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const filteredUsers = MOCK_USERS.filter(user => {
    const matchName = user.name.toLowerCase().includes(search.toLowerCase()) ||
                      user.city.toLowerCase().includes(search.toLowerCase())
    const hasFilter = filter === 'todos' ||
      Object.values(user.stickers).some(s => s.includes(filter as StickerStatus))
    return matchName && hasFilter
  })

  return (
    <div className="max-w-6xl mx-auto px-3 py-4 animate-fadein">
      <div className="mb-4">
        <h1 className="text-xl font-black text-slate-800">Explorar</h1>
        <p className="text-sm text-slate-500">Encontre colecionadores com figurinhas que você precisa</p>
      </div>

      {/* Busca */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Buscar colecionador ou cidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* Filtros */}
      <div className="mb-4">
        <FilterTabs active={filter} onChange={setFilter} />
      </div>

      {/* Grid de usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredUsers.map(user => {
          const userStickers = Object.entries(user.stickers)
            .filter(([, s]) => filter === 'todos' || s.includes(filter as StickerStatus))
            .slice(0, 6)

          return (
            <div key={user.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
              {/* Header usuário */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${user.avatarColor} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-sm font-black">{user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.city}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <span className="text-amber-400">⭐</span>
                  <span className="font-bold">{user.rating}</span>
                  <span className="text-slate-300">·</span>
                  <span>{user.trades} trocas</span>
                </div>
              </div>

              {/* Mini grid de figurinhas */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {userStickers.map(([num, statuses]) => {
                  const sticker = allStickers.find(s => s.number === Number(num))
                  return (
                    <StickerSquare
                      key={num}
                      number={Number(num)}
                      name={sticker?.name}
                      stickerType={sticker?.type ?? 'normal'}
                      status={statuses}
                      size="sm"
                    />
                  )
                })}
                {Object.keys(user.stickers).length > 6 && (
                  <div className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400 font-bold">
                    +{Object.keys(user.stickers).length - 6}
                  </div>
                )}
              </div>

              {/* Contadores */}
              <div className="flex gap-2 mb-3 text-xs">
                {(['venda', 'troca', 'doacao'] as StickerStatus[]).map(s => {
                  const count = Object.values(user.stickers).filter(st => st.includes(s)).length
                  if (!count) return null
                  return (
                    <span key={s} className={[
                      'px-2 py-0.5 rounded-full font-medium',
                      s === 'venda'  ? 'bg-green-100 text-green-700' :
                      s === 'troca'  ? 'bg-blue-100 text-blue-700'   :
                                       'bg-purple-100 text-purple-700',
                    ].join(' ')}>
                      {count} {s === 'venda' ? 'venda' : s === 'troca' ? 'troca' : 'doação'}
                    </span>
                  )
                })}
              </div>

              <a
                href="/perfil"
                className="block w-full text-center bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                Ver álbum completo →
              </a>
            </div>
          )
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-semibold">Nenhum colecionador encontrado</p>
          <p className="text-sm mt-1">Tente outro filtro ou cidade</p>
        </div>
      )}
    </div>
  )
}
