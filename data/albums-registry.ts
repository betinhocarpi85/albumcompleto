export type AlbumId = 'copa-2026' | 'brasileirao-2026' | 'dragon-ball-super-2026'

export interface AlbumMeta {
  id: AlbumId
  name: string
  subtitle: string
  emoji: string
  totalStickers: number
  totalTeams: number
  year: number
  gradientFrom: string
  gradientTo: string
  description: string
  available: boolean
}

export const ALBUMS_REGISTRY: AlbumMeta[] = [
  {
    id: 'copa-2026',
    name: 'Copa do Mundo FIFA 2026™',
    subtitle: 'Panini · USA, CAN & MEX',
    emoji: '🏆',
    totalStickers: 980,
    totalTeams: 48,
    year: 2026,
    gradientFrom: 'from-green-500',
    gradientTo: 'to-blue-600',
    description: '980 figurinhas · 48 seleções · 112 páginas',
    available: true,
  },
  {
    id: 'brasileirao-2026',
    name: 'Brasileirão 2026',
    subtitle: 'Panini · Série A, Série B e Feminino',
    emoji: '⚽',
    totalStickers: 512,
    totalTeams: 20,
    year: 2026,
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-green-600',
    description: '512 figurinhas · 20 clubes da Série A · inclui Feminino',
    available: true,
  },
  {
    id: 'dragon-ball-super-2026',
    name: 'Dragon Ball Super',
    subtitle: 'Panini · A Coleção Suprema',
    emoji: '🐉',
    totalStickers: 192,
    totalTeams: 0,
    year: 2026,
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-yellow-400',
    description: '192 figurinhas · 160 normais + 32 folder',
    available: true,
  },
]
