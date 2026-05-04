import type { Album, StickerType } from './album-copa-2026'

export function stickerIdFem(clubCode: string, number: number): string {
  return `${clubCode}-${number}`
}

function clubStickers(players: string[]): { number: number; name: string; type: StickerType }[] {
  const list: { number: number; name: string; type: StickerType }[] = [
    { number: 1, name: 'Escudo', type: 'escudo' },
  ]
  players.forEach((name, i) => {
    list.push({ number: i + 2, name, type: i < 2 ? 'brilhante' : 'normal' })
  })
  list.push({ number: 16, name: 'Foto do Elenco', type: 'especial' })
  return list
}

export const albumBrasileiraoFem2025: Album = {
  id: 'brasileirao-fem-2025',
  name: 'Campeonato Brasileiro Feminino 2025',
  year: 2025,
  totalStickers: 480,
  categories: [
    // ── INTRO ──────────────────────────────────────────────────
    {
      id: 'brf-intro', code: 'BRF', name: 'Brasileirão Feminino 2025',
      stickers: [
        { number: 1, name: 'Logo Panini',                type: 'brilhante' },
        { number: 2, name: 'Troféu Brasileirão Feminino', type: 'brilhante' },
        { number: 3, name: 'Logo Campeonato',             type: 'especial'  },
        { number: 4, name: 'Cromo Digital My Panini',    type: 'especial'  },
      ],
    },

    // ── CLUBES ─────────────────────────────────────────────────
    {
      id: 'cor-f', code: 'CORF', name: 'Corinthians', flag: '⚫',
      stickers: clubStickers(['Kemelly','Tamires','Giovanna Campiolo','Érika','Paulinha','Grazi','Duda Sampaio','Gabi Portilho','Millena','Victória Albuquerque','Jheniffer','Giovana','Andressinha','Duda Francelino']),
    },
    {
      id: 'fer', code: 'FER', name: 'Ferroviária', flag: '🔴',
      stickers: clubStickers(['Luciana','Katrine','Bia Zaneratto','Pati Maldaner','Rafa Andrade','Paloma','Giovana Queiroz','Aline Milene','Byanca Brasil','Bruna Benites','Mariana','Duda Francelino','Joice','Bri']),
    },
    {
      id: 'pal-f', code: 'PALF', name: 'Palmeiras', flag: '🟢',
      stickers: clubStickers(['Natascha','Antônia','Agustina Barroso','Thaís Guedes','Nicole','Yayá','Duda Stillitano','Flávia','Ary Borges','Amanda Gutierres','Camilinha','Gabi Nunes','Laís Estevam','Luana']),
    },
    {
      id: 'cru-f', code: 'CRUF', name: 'Cruzeiro', flag: '🔵',
      stickers: clubStickers(['Lorena','Vivi Cosaro','Fernanda Palermo','Camila','Daniela','Letícia Ferreira','Kelly','Gabi Zanotti','Daiane','Natiele','Thais','Monalisa','Camilinha','Dudinha']),
    },
    {
      id: 'sao-f', code: 'SAOF', name: 'São Paulo', flag: '🔴⚫',
      stickers: clubStickers(['Carlinha','Thais Ferreira','Érica','Gabi Fernandes','Cacau','Letícia Santos','Rosana','Ingryd','Leticia Costa','Cris Jayielle','Karen Andrades','Priscila','Bianca Lara','Luana Bertolucci']),
    },
    {
      id: 'fla-f', code: 'FLAF', name: 'Flamengo', flag: '🔴',
      stickers: clubStickers(['Bárbara','Bruna Vitória','Daiane','Stefani','Bruninha','Nicole Amorim','Fernanda','Juliana Aguiar','Duda Cristina','Desiree','Mel','Sophia','Rafa Levis','Leandra']),
    },
    {
      id: 'cap-f', code: 'CAPF', name: 'Athletico-PR', flag: '🔴⚫',
      stickers: clubStickers(['Tatiane','Camila','Kátia','Pricila','Giovana','Karina','Ingrid','Júlia Becker','Tâmires','Carla','Adriane','Fernanda Costa','Laura','Andressa']),
    },
    {
      id: 'int-f', code: 'INTF', name: 'Internacional', flag: '🔴⚪',
      stickers: clubStickers(['Jessica','Maiara','Tayla','Alice','Fernanda','Vanessa','Nathiele','Bruna Lugão','Kerolaine','Jéssica Pereira','Drielly','Camila Martins','Milena','Isabela']),
    },
    {
      id: 'rbr', code: 'RBR', name: 'Real Brasília', flag: '🟡',
      stickers: clubStickers(['Maria Eduarda','Tatiana','Cleidiane','Nágila','Sabrina','Nara','Cristiane','Adriana','Brena','Bruna Calderan','Letícia','Jade','Jaqueline','Dani']),
    },
    {
      id: 'san-f', code: 'SANF', name: 'Santos', flag: '⚫',
      stickers: clubStickers(['Thainá','Thais','Bia Alves','Katia','Tamiris','Amanda','Diany','Fabiana','Kely','Adriely','Carine','Milene','Lais','Cris']),
    },
    {
      id: 'kin', code: 'KIN', name: 'Avaí/Kindermann', flag: '🔵',
      stickers: clubStickers(['Ana','Lyandra','Gabi Pires','Priscila Mota','Stefanie','Nathalie','Laís','Tatiana Pinto','Marta Vieira','Luana','Katrine','Bianca','Thais Ferreira','Juliana']),
    },
    {
      id: 'gre-f', code: 'GREF', name: 'Grêmio', flag: '🔵⚫',
      stickers: clubStickers(['Viviane','Giovana','Marina','Ana Clara','Bruna Goulart','Letícia Gomes','Caroline','Beatriz','Jhenifer','Fabi Simões','Luciana','Carol','Camila','Giovana Queiroz']),
    },
    {
      id: 'bah-f', code: 'BAHF', name: 'Bahia', flag: '🔵',
      stickers: clubStickers(['Gabi Souza','Tayla','Marta','Andressa','Kamy','Preta','Micaelly','Duda','Camilinha','Priscila','Fran','Larissa','Vanessa','Luane']),
    },
    {
      id: 'bra-f', code: 'BRAF', name: 'Bragantino', flag: '⚫🔴',
      stickers: clubStickers(['Bia','Sarah','Daiane','Camila','Milene','Fernanda','Raíssa','Rafaela','Tais','Aline','Giovanna','Leticia','Ana Paula','Stephanie']),
    },
    {
      id: 'bot-f', code: 'BOTF', name: 'Botafogo', flag: '⭐',
      stickers: clubStickers(['Ana Flávia','Beatriz','Giovana','Nathaly','Samira','Thainara','Isabela','Natiele','Mara','Monalisa','Cris','Rayssa','Débora','Brenda']),
    },
    {
      id: 'flu-f', code: 'FLUF', name: 'Fluminense', flag: '🎽',
      stickers: clubStickers(['Luisa','Vitória','Jade','Stephani','Brenda','Amanda','Lorena','Luana','Nathalia','Ana Lucia','Mariane','Carol','Ingrid','Giovana']),
    },
  ],
}
