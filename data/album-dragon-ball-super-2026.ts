import type { Album, StickerType } from './album-copa-2026'

// Gera stickers numerados sequencialmente
function stickers(from: number, to: number, type: StickerType = 'normal') {
  return Array.from({ length: to - from + 1 }, (_, i) => ({
    number: from + i,
    name:   `Figurinha ${from + i}`,
    type,
  }))
}

// Folder stickers F01–F32
function folderStickers(): { number: number; name: string; type: StickerType }[] {
  return Array.from({ length: 32 }, (_, i) => ({
    number: i + 1,
    name:   `Folder F${String(i + 1).padStart(2, '0')}`,
    type:   'especial' as StickerType,
  }))
}

export const albumDragonBallSuper2026: Album = {
  id:            'dragon-ball-super-2026',
  name:          'Dragon Ball Super — A Coleção Suprema de Figurinhas',
  year:          2026,
  totalStickers: 192,
  categories: [
    // ── FIGURINHAS NORMAIS 1–160 ─────────────────────────────────
    // Capa da saga Beerus até Torneio do Poder
    // Tipos: brilhante nas posições conhecidas como especiais (1, cada 20)
    {
      id:   'dbs-main',
      code: 'DBS',
      name: 'Dragon Ball Super',
      stickers: [
        ...stickers(1,   1,  'brilhante'),  // capa
        ...stickers(2,   20, 'normal'),
        ...stickers(21,  21, 'brilhante'),  // especial de saga
        ...stickers(22,  40, 'normal'),
        ...stickers(41,  41, 'brilhante'),
        ...stickers(42,  60, 'normal'),
        ...stickers(61,  61, 'brilhante'),
        ...stickers(62,  80, 'normal'),
        ...stickers(81,  81, 'brilhante'),
        ...stickers(82, 100, 'normal'),
        ...stickers(101, 101,'brilhante'),
        ...stickers(102, 120,'normal'),
        ...stickers(121, 121,'brilhante'),
        ...stickers(122, 140,'normal'),
        ...stickers(141, 141,'brilhante'),
        ...stickers(142, 160,'normal'),
      ],
    },

    // ── FOLDER F01–F32 ──────────────────────────────────────────
    {
      id:   'dbs-folder',
      code: 'F',
      name: 'Folder',
      stickers: folderStickers(),
    },
  ],
}
