import type { Album, StickerType } from './album-copa-2026'

// Helper
export function stickerId(clubCode: string, number: number): string {
  return `${clubCode}-${number}`
}

// 20 stickers por clube: 1=escudo, 2-19=jogadores, 20=foto do elenco
function clubStickers(players: string[]): { number: number; name: string; type: StickerType }[] {
  const list: { number: number; name: string; type: StickerType }[] = [
    { number: 1, name: 'Escudo', type: 'escudo' },
  ]
  players.forEach((name, i) => {
    list.push({ number: i + 2, name, type: i < 3 ? 'brilhante' : 'normal' })
  })
  list.push({ number: 20, name: 'Foto do Elenco', type: 'especial' })
  return list
}

export const albumBrasileiraoMasc2026: Album = {
  id: 'brasileirao-masc-2026',
  name: 'Campeonato Brasileiro Masculino 2026',
  year: 2026,
  totalStickers: 685,
  categories: [
    // ── INTRO ──────────────────────────────────────────────────
    {
      id: 'bra-intro', code: 'BRM', name: 'Brasileirão 2026',
      stickers: [
        { number: 1, name: 'Logo Panini',             type: 'brilhante' },
        { number: 2, name: 'Troféu Brasileirão',       type: 'brilhante' },
        { number: 3, name: 'Logo Campeonato',          type: 'especial'  },
        { number: 4, name: 'Cromo Digital My Panini', type: 'especial'  },
        { number: 5, name: 'Paninipedia',              type: 'normal'    },
      ],
    },

    // ── CLUBES ─────────────────────────────────────────────────
    {
      id: 'bot', code: 'BOT', name: 'Botafogo', flag: '⭐',
      stickers: clubStickers(['John','Damián Suárez','Adryelson','Bastos','Cuiabano','Marlon Freitas','Gregore','Thiago Almada','Luiz Henrique','Igor Jesus','Matheus Martins','Savarino','Tiquinho Soares','Allan','Carlos Eduardo']),
    },
    {
      id: 'pal', code: 'PAL', name: 'Palmeiras', flag: '🟢',
      stickers: clubStickers(['Weverton','Marcos Rocha','Gustavo Gómez','Murilo','Piquerez','Aníbal Moreno','Zé Rafael','Raphael Veiga','Felipe Anderson','Flaco López','Rony','Vitor Reis','Estêvão','Richard Ríos','Gabriel Menino']),
    },
    {
      id: 'fla', code: 'FLA', name: 'Flamengo', flag: '🔴',
      stickers: clubStickers(['Rossi','Varela','Léo Ortiz','David Luiz','Ayrton Lucas','Gerson','De la Cruz','Arrascaeta','Éverton Cebolinha','Pedro','Bruno Henrique','Michael','Luiz Araújo','Allan','Plata']),
    },
    {
      id: 'atm', code: 'ATM', name: 'Atlético-MG', flag: '🦓',
      stickers: clubStickers(['Everson','Saravia','Junior Alonso','Guilherme Arana','Rubens','Otávio','Fausto Vera','Paulinho','Deyverson','Hulk','Bernard','Igor Gomes','Alan Kardec','Rômulo','Mariano']),
    },
    {
      id: 'flu', code: 'FLU', name: 'Fluminense', flag: '🎽',
      stickers: clubStickers(['Fábio','Samuel Xavier','Thiago Santos','Felipe Melo','Marcelo','André','Ganso','Lima','Jhon Arias','Germán Cano','Keno','Martinelli','Alexsander','Jan Lucumí','Lelê']),
    },
    {
      id: 'sao', code: 'SAO', name: 'São Paulo', flag: '🔴⚫',
      stickers: clubStickers(['Rafael','Rafinha','Diego Costa','Arboleda','Welington','Alisson','Bobadilla','Luciano','James Rodríguez','Calleri','Ferreirinha','Galoppo','Michel Araújo','Wellington Rato','Giuliano']),
    },
    {
      id: 'cru', code: 'CRU', name: 'Cruzeiro', flag: '🔵',
      stickers: clubStickers(['Cássio','William','João Marcelo','Lucas Villalba','Marcelinho','Lucas Silva','Ramiro','Mateus Vital','Lautaro Díaz','Kaio Jorge','Gabriel Veron','Ronald','Rafa Silva','Eduardo','Walace']),
    },
    {
      id: 'vas', code: 'VAS', name: 'Vasco', flag: '⚫',
      stickers: clubStickers(['Léo Jardim','Paulo Henrique','João Victor','Léo','Lucas Piton','Hugo Moura','Mateus Carvalho','Payet','Vegetti','GB','Emerson Rodríguez','Adson','Maxime Dominguez','Rossi','Praxedes']),
    },
    {
      id: 'int', code: 'INT', name: 'Internacional', flag: '🔴⚪',
      stickers: clubStickers(['Rochet','Bustos','Vitão','Mercado','Renê','Fernando','Bruno Tabata','Alan Patrick','Wesley','Enner Valencia','Wanderson','Gustavo Prado','Hyoran','Bruno Gomes','Thiago Maia']),
    },
    {
      id: 'gre', code: 'GRE', name: 'Grêmio', flag: '🔵⚫',
      stickers: clubStickers(['Grando','João Pedro','Rodrigo Ely','Kannemann','Reinaldo','Villasanti','Pepê','Cristaldo','Nathan Fernandes','Braithwaite','Soteldo','Diego Costa','Edenilson','Du Queiroz','Carballo']),
    },
    {
      id: 'bah', code: 'BAH', name: 'Bahia', flag: '🔵',
      stickers: clubStickers(['Adriel','Gilberto','Gabriel Xavier','Kanu','Luciano Juba','Caio Alexandre','Jean Lucas','Everton Ribeiro','Thaciano','Everaldo','Ademir','Biel','Óscar Estupiñán','Rezende','Cauly']),
    },
    {
      id: 'for', code: 'FOR', name: 'Fortaleza', flag: '🦁',
      stickers: clubStickers(['João Ricardo','Tinga','Brítez','Titi','Felipe Jonathan','Zé Welison','Hércules','Pochettino','Moisés','Lucero','Breno Lopes','Yago Pikachu','Renato Kayzer','Calebe','Kervin Andrade']),
    },
    {
      id: 'juve', code: 'JUV', name: 'Juventude', flag: '🟢',
      stickers: clubStickers(['Gabriel','João Lucas','Danilo Boza','Marcos Paulo','Alan Ruschel','Caíque','Jadson','Mandaca','Gilberto','Erick Farias','Lucas Barbosa','Nenê','Bruninho','Zé Marcos','Isidro Pitta']),
    },
    {
      id: 'cap', code: 'CAP', name: 'Athletico-PR', flag: '🔴⚫',
      stickers: clubStickers(['Mycael','Erick','Thiago Heleno','Kaique Rocha','Fernando','Erick Pulgar','Christian','Canobbio','Julimar','Pablo','Mastriani','Cuello','Vitor Bueno','Zapelli','Léo Linck']),
    },
    {
      id: 'cui', code: 'CUI', name: 'Cuiabá', flag: '🟡',
      stickers: clubStickers(['Walter','Matheus Alexandre','Marllon','Alan Empereur','Ramon','Denilson','Filipe Augusto','Max','Jonathan Cafu','Clayson','Isidro Pitta','Derik Lacerda','Gabriel Rodrigues','Elton','Pepê Rodrigues']),
    },
    {
      id: 'cor', code: 'COR', name: 'Corinthians', flag: '⚫',
      stickers: clubStickers(['Hugo Souza','Fagner','Gil','Cacá','Hugo','Raniele','Charles','Garro','Wesley','Memphis Depay','Yuri Alberto','Igor Coronado','Rodrigo Garro','Romero','André Ramalho']),
    },
    {
      id: 'vit', code: 'VIT', name: 'Vitória', flag: '🔴⚫',
      stickers: clubStickers(['Lucas Arcanjo','Claudinho','Edu','Wagner Leonardo','Patric','Léo Naldi','Ricardo Ryller','Willean Lepo','Osvaldo','Janderson','Gustavo Mosquito','Fabrício Daniel','Zé Hugo','Jean Mota','Dudu']),
    },
    {
      id: 'ago', code: 'AGO', name: 'Atlético-GO', flag: '🔴',
      stickers: clubStickers(['Pedro Rangel','Maguinho','Adriano Martins','Alix','Guilherme Romão','Roni','Jair','Rhaldney','Alejo Cruz','Luiz Fernando','Derek','Emiliano Rodríguez','Shaylon','Baralhas','Hayner']),
    },
    {
      id: 'spo', code: 'SPO', name: 'Sport', flag: '🔴⚫',
      stickers: clubStickers(['Caíque França','Eduardo','Rafael Thyere','Chico','Felipinho','Fábio Matheus','Luciano Castán','Romarinho','Gustavo Coutinho','Barletta','Zé Love','Claudinho','Chrystian Barletta','Dodô','Jorginho']),
    },
    {
      id: 'mir', code: 'MIR', name: 'Mirassol', flag: '🟡',
      stickers: clubStickers(['Alex Muralha','Raphael','Luiz Otávio','Eduardo Doma','Reinaldo','Gabriel','Neto Moura','Danielzinho','Chico Kim','Iury Castilho','Alex Silva','Fernandinho','Zé Ricardo','Aloísio','Kevin']),
    },
  ],
}
