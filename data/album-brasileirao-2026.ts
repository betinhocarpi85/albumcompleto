import type { Album, Category, StickerType } from './album-copa-2026'

// Checklist oficial Panini Brasileirão 2026 (512 figurinhas).
// Fonte: Football Cartophilic Info Exchange, 20/09/2026. Numeração idêntica ao álbum físico.

const SERIE_A: [string, string, string, string[]][] = [
  ['fla', 'FLA', 'Flamengo', ['Agustín Rossi','Danilo','Léo Ortiz','Léo Pereira','Alex Sandro','Guillermo Varela','Erick Pulgar','Jorginho','Giorgian de Arrascaeta','Jorge Carrascal','Saúl Ñíguez','Lucas Paquetá','Nicolás de la Cruz','Luiz Araújo','Bruno Henrique','Pedro','Samuel Lino','Everton Cebolinha']],
  ['pal', 'PAL', 'Palmeiras', ['Carlos Miguel','Marcelo Lomba','Murilo Cerqueira','Gustavo Gómez','Bruno Fuchs','Joaquín Piquerez','Agustín Giay','Marlon Freitas','Andreas Pereira','Allan Elias','Lucas Evangelista','Maurício','Felipe Anderson','Jhon Arias','Paulinho','Flaco López','Vitor Roque','Ramón Sosa']],
  ['cru', 'CRU', 'Cruzeiro', ['Cássio','Otávio Costa','Jonathan Jesus','Fabrício Bruno','Lucas Villalba','Gabriel Rojas','Fagner','Gerson','Lucas Romero','Lucas Silva','Matheus Henrique','Matheus Pereira','Gabriel Pec','Wanderson','Keny Arroyo','Luis Sinisterra','Kaio Jorge','Néiser Villarreal']],
  ['mir', 'MIR', 'Mirassol', ['Walter','Alex Muralha','Lucas Oliveira','Willian Machado','João Victor','Reinaldo','Daniel Borges','Igor Formica','Chico Kim','Neto Moura','Eduardo','Aldo Filho','Shaylon','Alesson','Edson Carioca','Antonio Galeano','Negueba','André Luis']],
  ['flu', 'FLU', 'Fluminense', ['Fábio','Jemmes','Juan Pablo Freytes','Thiago Silva','Guilherme Arana','Renê','Samuel Xavier','Guga','Matheus Martinelli','Hércules','PH Ganso','Lucho Acosta','Hulk','Jefferson Savarino','John Kennedy','Kevin Serna','Agustín Canobbio','Germán Cano']],
  ['bot', 'BOT', 'Botafogo', ['Warleson','Nahuel Ferraresi','Alex Telles','Fernando Marçal','Vitinho','Mateo Ponte','Allan','Álvaro Montoro','Cristian Medina','Danilo','Jordan Barrera','Edenilson','Santiago Rodríguez','Arthur Cabral','Kadir Barría','Lucas Villalba','Júnior Santos','Matheus Martins']],
  ['bah', 'BAH', 'Bahia', ['Ronaldo Strada','Kanu','Santiago Ramos Mingo','David Duarte','Luciano Juba','Román Gómez','Jean Lucas','Caio Alexandre','Everton Ribeiro','Rodrigo Nestor','Erick Luis','Nicolás Acevedo','Michel Araújo','Alejo Véliz','Ademir','Willian José','Erick Pulga','Mateo Sanabria']],
  ['sao', 'SAO', 'São Paulo', ['Rafael','Rafael Tolói','Robert Arboleda','José Sabino','Enzo Díaz','Wendell','Lucas Ramon','Pablo Maia','Damián Bobadilla','Marcos Antônio','Danielzinho','Lucas Moura','Luciano','Jonathan Calleri','Ferreirinha','Victor Sá','André Silva','Artur Guimarães']],
  ['gre', 'GRE', 'Grêmio', ['Weverton','Gabriel Grando','Fabián Balbuena','Gustavo Martins','Wagner Leonardo','Walter Kannemann','Marlon Xavier','Marcos Rocha','Mathías Villasanti','Juan Nardoni','Erick Noriega','Miguel Monsalve','Willian','Carlos Vinícius','Francis Amuzu','Martin Braithwaite','Tetê','Cristian Pavón']],
  ['rbb', 'RBB', 'Red Bull Bragantino', ['Cleiton','Tiago Volpi','Alix Vinicius','Guzmán Rodríguez','Juninho Capixaba','José Andrés Hurtado','Gabriel Girotto','Fabinho','Eric Ramires','Matheus Fernandes','Gustavo Neves','Nacho Sosa','Rodriguinho','Fernando','Henry Mosquera','Lucas Barbosa','Eduardo Sasha','Isidro Pitta']],
  ['cam', 'CAM', 'Atlético-MG', ['Éverson','Iván Román','Lyanco','Ruan Tressoldi','Renan Lodi','Angelo Preciado','Natanael','Alexsander','Alan Franco','Maycon','Mamady Cissé','Bernard','Victor Hugo','Reinier','Dudu','Tomás Cuello','Mateo Cassierra','Alan Minda']],
  ['san', 'SAN', 'Santos', ['Gabriel Brazão','Luan Peres','Lucas Veríssimo','Gonzalo Escobar','Igor Vinícius','Gabriel Menino','João Schmidt','Willian Arão','Gustavinho','Gabriel Bontempo','Benjamín Rollheiser','Neymar Jr','Rony','Gabriel Barbosa','Robinho Jr','Álvaro Barreal','Thaciano','Miguelito']],
  ['cor', 'COR', 'Corinthians', ['Hugo Souza','Gustavo Henrique','André Ramalho','Gabriel Paulista','Matheus Bidu','Matheuzinho','Raniele','André Carrillo','Breno Bidon','André Luiz','Rodrigo Garro','Allan','Matheus Pereira','Jesse Lingard','Vitinho','Memphis Depay','Yuri Alberto','Gui Negão']],
  ['vas', 'VAS', 'Vasco da Gama', ['Léo Jardim','Robert Renan','Carlos Cuesta','Alan Saldivia','Cuiabano','Lucas Piton','Paulo Henrique','Puma Rodríguez','Cauan Barros','Thiago Mendes','Tchê Tchê','Johan Rojas','David Corrêa','Nuno Moreira','Andrés Gómez','Brenner','Marino Hinestroza','Claudio Spinelli']],
  ['vit', 'VIT', 'Vitória', ['Lucas Arcanjo','Cacá','Edenilson','Ramon','Luan Cândido','Jamerson','Nathan Mendes','Emmanuel Martínez','Matheuzinho','Gabriel Baralhas','Zé Vitor','Caíque Gonçalves','Marinho','Osvaldo Filho','Diego Tarzia','Erick Arruda','Renato Kayzer','Carlos Renê']],
  ['int', 'INT', 'Internacional', ['Sergio Rochet','Anthoni','Gabriel Mercado','Victor Gabriel','Félix Torres','Guillermo Maripán','Bernabei','Bruno Gomes','Thiago Maia','Alan Rodríguez','Bruno Henrique','Alan Patrick','Ronaldo Souza','Paulinho Paula','Rodrigo Villagra','Vitinho','Johan Carbonero','Alerrandro']],
  ['cfc', 'CFC', 'Coritiba', ['Pedro Morisco','Pedro Rangel','Maicon','Jacy Maranhão','Tiago Cóser','Bruno Melo','João Almeida','Felipe Jonathan','Tinga','Sebastián Gómez','Josué Pesqueira','Thiago Santos','Vini Paulista','Lucas Ronier','Breno Lopes','Pedro Rocha','Joaquín Lavega','Keno']],
  ['cap', 'CAP', 'Athletico-PR', ['Aderbar Santos','Mycael Pontes','Juan Felipe Aguirre','Carlos Terán','Arthur Dias','Lucas Esquivel','Léo Derik','Claudinho','Gastón Benavídez','Juan Portilla','Luiz Gustavo','Dudu Kogitzki','João Cruz','Bruno Zapelli','Jadson','Stiven Mendoza','Leozinho','Kevin Viveros']],
  ['cha', 'CHA', 'Chapecoense', ['Anderson Paixão','Eduardo Doma','Rafael Thyere','Victor Caetano','João Paulo','Bruno Pacheco','Fernando Bueno','Everton','Bruno Tubarão','Rafael Carvalheira','Bruno Matias','David Antunes','Camilo','Giovanni Augusto','Max Alves','Yannick Bolasie','Marcinho','Rubens']],
  ['rem', 'REM', 'Remo', ['Ivan Quaresma','Marcelo Rangel','Duplexe Tchamba','Marllon','Mayk','Matheus Alexandre','Marcelinho','Leonel Picco','Patrick Bezerra','Zé Welison','Zé Ricardo','Vitor Bueno','David Braga','Gabriel Poveda','Jajá','Alef Manga','Yago Pikachu','Gabriel Taliari']],
]

// Ordem dos escudos E21–E40 e das panorâmicas 361–400
const SERIE_B = [
  'Ceará','Fortaleza','Juventude','Sport','Criciúma','Goiás','Novorizontino','CRB','Avaí','Cuiabá',
  'Atlético-GO','Operário-PR','Vila Nova','América-MG','Athletic','Botafogo-SP','Ponte Preta','Londrina','Náutico','São Bernardo',
]

const MASCOTES = [
  'Flamengo','Corinthians','Red Bull Bragantino','Internacional','Bahia','Palmeiras','Atlético-MG','Fluminense','Grêmio','Athletico-PR',
  'Vasco da Gama','Chapecoense','Botafogo','Santos','Cruzeiro','Vitória','São Paulo','Coritiba','Remo','Mirassol',
]

const ESPECIAIS: [string, StickerType][] = [
  ['Troféu Brasileirão Série A', 'brilhante'],
  ['Escudo CBF', 'brilhante'],
  ...([
    'Hugo Souza (Corinthians)','Léo Pereira (Flamengo)','Joaquín Piquerez (Palmeiras)','Gustavo Gómez (Palmeiras)','Guillermo Varela (Flamengo)',
    'Danilo (Botafogo)','Memphis Depay (Corinthians)','Neymar Jr (Santos)','Lucas Paquetá (Flamengo)','Jhon Arias (Palmeiras)','Yuri Alberto (Corinthians)',
  ].map(n => [`São eles! · ${n}`, 'especial'] as [string, StickerType])),
  ...([
    'Danilo (Botafogo)','Luciano Juba (Bahia)','Gustavo Neves (Red Bull Bragantino)','Neymar Jr (Santos)','Kaio Jorge (Cruzeiro)','Jajá (Remo)',
    'Bernard (Atlético-MG)','Hugo Souza (Corinthians)','Flaco López (Palmeiras)','Cuiabano (Vasco da Gama)','Giorgian de Arrascaeta (Flamengo)',
  ].map(n => [`Jogão · ${n}`, 'especial'] as [string, StickerType])),
  ...([
    'Luciano (São Paulo)','Pedro (Flamengo)','Lavega (Coritiba)','Canobbio (Fluminense)','Mendoza (Athletico-PR)','Viveros (Athletico-PR)',
    'Carlos Vinícius (Grêmio)','Jean Lucas (Bahia)','Pitta (Red Bull Bragantino)','Ferreirinha (São Paulo)',
  ].map(n => [`Homens-Gol · ${n}`, 'especial'] as [string, StickerType])),
]

const FEMININO = [
  'Weber (Atlético-MG)','Luciana (Ferroviária)','Gabi Barbieri (Internacional)','Raissa (Grêmio)','Aila (Bahia)','Mimi (América-MG)',
  'G. Zanotti (Corinthians)','Duda Calazans (Juventude)','Bárbara Dantas (Vitória)','Shasha (Botafogo)','Byanca Brasil (Cruzeiro)','Cristiane (Flamengo)',
  'Luana Índia (Mixto)','Zaneratto (Palmeiras)','Pelé (Fluminense)','Miria (Red Bull Bragantino)','Ketlen (Santos)','Crivelari (São Paulo)',
]

const serieA: Category[] = SERIE_A.map(([id, code, name, players], i) => ({
  id, code, name,
  stickers: players.map((p, j) => ({ number: i * 18 + j + 1, name: p, type: 'normal' as StickerType })),
}))

export const albumBrasileirao2026: Album = {
  id: 'brasileirao-2026',
  name: 'Brasileirão 2026',
  year: 2026,
  totalStickers: 512,
  categories: [
    {
      id: 'cb', code: 'CB', name: 'Brasileirão 2026 · Especiais',
      stickers: ESPECIAIS.map(([n, t], i) => ({ number: i + 1, name: n, type: t })),
    },
    {
      id: 'esc-a', code: 'E', name: 'Escudos · Série A',
      stickers: SERIE_A.map(([, , club], i) => ({ number: i + 1, name: `Escudo ${club}`, type: 'escudo' as StickerType })),
    },
    ...serieA,
    {
      id: 'masc', code: 'M', name: 'Mascotes',
      stickers: MASCOTES.map((c, i) => ({ number: i + 1, name: `Mascote ${c}`, type: 'especial' as StickerType })),
    },
    {
      id: 'esc-b', code: 'E', name: 'Escudos · Série B',
      stickers: SERIE_B.map((c, i) => ({ number: i + 21, name: `Escudo ${c}`, type: 'escudo' as StickerType })),
    },
    {
      id: 'serie-b', code: 'SB', name: 'Série B · Times',
      stickers: SERIE_B.flatMap((c, i) => [
        { number: 361 + i * 2, name: `${c} · Time (1/2)`, type: 'normal' as StickerType },
        { number: 362 + i * 2, name: `${c} · Time (2/2)`, type: 'normal' as StickerType },
      ]),
    },
    {
      id: 'fem', code: 'FEM', name: 'Brasileirão Feminino',
      stickers: FEMININO.map((n, i) => ({ number: 401 + i, name: n, type: 'normal' as StickerType })),
    },
  ],
}
