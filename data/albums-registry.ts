export type AlbumId = 'copa-2026' | 'brasileirao-masc-2025' | 'brasileirao-fem-2025'

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
    id: 'brasileirao-masc-2025',
    name: 'Brasileirão Masculino 2025',
    subtitle: 'Panini · Série A',
    emoji: '🇧🇷',
    totalStickers: 685,
    totalTeams: 20,
    year: 2025,
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-green-600',
    description: '685 figurinhas · 20 clubes · Série A',
    available: true,
  },
  {
    id: 'brasileirao-fem-2025',
    name: 'Brasileirão Feminino 2025',
    subtitle: 'Panini · Série A1',
    emoji: '⚽',
    totalStickers: 480,
    totalTeams: 16,
    year: 2025,
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-purple-600',
    description: '480 figurinhas · 16 clubes · Série A1',
    available: true,
  },
]
