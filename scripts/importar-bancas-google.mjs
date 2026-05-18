#!/usr/bin/env node
/**
 * importar-bancas-google.mjs
 * Execução única — importa bancas de jornal do Google Maps para o Completando.
 * Todas entram com ativa: false. Admin ativa manualmente conforme contatá-las.
 *
 * Uso: node scripts/importar-bancas-google.mjs
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const GOOGLE_API_KEY = 'AIzaSyCGK9mPYJWMk9Ps9t9Uj8eFyAtJZya1C4c'
const SUPABASE_URL   = 'https://lafonveklbmpffwladrd.supabase.co'
const SUPABASE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZm9udmVrbGJtcGZmd2xhZHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA4MjY0MiwiZXhwIjoyMDkzNjU4NjQyfQ.6rqB4g-z-ZOWaq3llhrhTRB5rC-EZAfKygQGad5q9oI'

const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

const SEARCH_TERMS = ['banca de jornal', 'banca de revistas', 'banca de jornais']
const RADIUS_M     = 25000  // 25km por ponto

// ─── Pontos de busca cobrindo o Brasil inteiro ────────────────────────────────
const PONTOS = [
  // ── São Paulo (capital — múltiplos pontos pela densidade) ──
  { nome: 'São Paulo - Centro',    lat: -23.5505, lng: -46.6333, uf: 'SP' },
  { nome: 'São Paulo - Norte',     lat: -23.4712, lng: -46.6263, uf: 'SP' },
  { nome: 'São Paulo - Sul',       lat: -23.6273, lng: -46.6588, uf: 'SP' },
  { nome: 'São Paulo - Leste',     lat: -23.5501, lng: -46.4751, uf: 'SP' },
  { nome: 'São Paulo - Oeste',     lat: -23.5489, lng: -46.7193, uf: 'SP' },
  { nome: 'Guarulhos',             lat: -23.4543, lng: -46.5332, uf: 'SP' },
  { nome: 'Campinas',              lat: -22.9068, lng: -47.0626, uf: 'SP' },
  { nome: 'São Bernardo do Campo', lat: -23.6939, lng: -46.5650, uf: 'SP' },
  { nome: 'Santo André',           lat: -23.6639, lng: -46.5383, uf: 'SP' },
  { nome: 'Osasco',                lat: -23.5322, lng: -46.7919, uf: 'SP' },
  { nome: 'São José dos Campos',   lat: -23.1791, lng: -45.8872, uf: 'SP' },
  { nome: 'Ribeirão Preto',        lat: -21.1775, lng: -47.8103, uf: 'SP' },
  { nome: 'Sorocaba',              lat: -23.5015, lng: -47.4526, uf: 'SP' },
  { nome: 'Santos',                lat: -23.9608, lng: -46.3336, uf: 'SP' },
  { nome: 'Mogi das Cruzes',       lat: -23.5222, lng: -46.1861, uf: 'SP' },
  { nome: 'Jundiaí',               lat: -23.1864, lng: -46.8842, uf: 'SP' },
  { nome: 'Piracicaba',            lat: -22.7253, lng: -47.6492, uf: 'SP' },
  { nome: 'Bauru',                 lat: -22.3147, lng: -49.0608, uf: 'SP' },
  { nome: 'São José do Rio Preto', lat: -20.8113, lng: -49.3758, uf: 'SP' },
  { nome: 'Presidente Prudente',   lat: -22.1255, lng: -51.3883, uf: 'SP' },
  { nome: 'São Carlos',            lat: -21.9799, lng: -47.8909, uf: 'SP' },
  { nome: 'Araraquara',            lat: -21.7845, lng: -48.1754, uf: 'SP' },
  { nome: 'Franca',                lat: -20.5386, lng: -47.4008, uf: 'SP' },
  { nome: 'Americana',             lat: -22.7389, lng: -47.3317, uf: 'SP' },
  { nome: 'Diadema',               lat: -23.6862, lng: -46.6218, uf: 'SP' },
  { nome: 'Carapicuíba',           lat: -23.5228, lng: -46.8358, uf: 'SP' },

  // ── Rio de Janeiro ──
  { nome: 'Rio de Janeiro - Centro',    lat: -22.9068, lng: -43.1729, uf: 'RJ' },
  { nome: 'Rio de Janeiro - Zona Norte',lat: -22.8727, lng: -43.2693, uf: 'RJ' },
  { nome: 'Rio de Janeiro - Zona Sul',  lat: -22.9519, lng: -43.1729, uf: 'RJ' },
  { nome: 'Rio de Janeiro - Zona Oeste',lat: -22.9068, lng: -43.3900, uf: 'RJ' },
  { nome: 'São Gonçalo',               lat: -22.8269, lng: -43.0539, uf: 'RJ' },
  { nome: 'Duque de Caxias',           lat: -22.7856, lng: -43.3117, uf: 'RJ' },
  { nome: 'Nova Iguaçu',               lat: -22.7592, lng: -43.4512, uf: 'RJ' },
  { nome: 'Niterói',                   lat: -22.8832, lng: -43.1036, uf: 'RJ' },
  { nome: 'Belford Roxo',              lat: -22.7639, lng: -43.3992, uf: 'RJ' },
  { nome: 'Petrópolis',                lat: -22.5050, lng: -43.1784, uf: 'RJ' },
  { nome: 'Volta Redonda',             lat: -22.5232, lng: -44.1041, uf: 'RJ' },
  { nome: 'Macaé',                     lat: -22.3711, lng: -41.7869, uf: 'RJ' },
  { nome: 'Campos dos Goytacazes',     lat: -21.7542, lng: -41.3244, uf: 'RJ' },

  // ── Minas Gerais ──
  { nome: 'Belo Horizonte',          lat: -19.9167, lng: -43.9345, uf: 'MG' },
  { nome: 'BH - Região Norte',       lat: -19.8200, lng: -43.9600, uf: 'MG' },
  { nome: 'Uberlândia',              lat: -18.9186, lng: -48.2772, uf: 'MG' },
  { nome: 'Contagem',                lat: -19.9320, lng: -44.0536, uf: 'MG' },
  { nome: 'Juiz de Fora',            lat: -21.7642, lng: -43.3503, uf: 'MG' },
  { nome: 'Betim',                   lat: -19.9678, lng: -44.1981, uf: 'MG' },
  { nome: 'Montes Claros',           lat: -16.7286, lng: -43.8617, uf: 'MG' },
  { nome: 'Uberaba',                 lat: -19.7482, lng: -47.9317, uf: 'MG' },
  { nome: 'Governador Valadares',    lat: -18.8511, lng: -41.9494, uf: 'MG' },
  { nome: 'Ipatinga',                lat: -19.4687, lng: -42.5361, uf: 'MG' },
  { nome: 'Divinópolis',             lat: -20.1390, lng: -44.8855, uf: 'MG' },
  { nome: 'Sete Lagoas',             lat: -19.4633, lng: -44.2478, uf: 'MG' },
  { nome: 'Ribeirão das Neves',      lat: -19.7703, lng: -44.0828, uf: 'MG' },

  // ── Bahia ──
  { nome: 'Salvador',               lat: -12.9714, lng: -38.5014, uf: 'BA' },
  { nome: 'Salvador - Periferia',   lat: -12.9000, lng: -38.4200, uf: 'BA' },
  { nome: 'Feira de Santana',       lat: -12.2666, lng: -38.9663, uf: 'BA' },
  { nome: 'Vitória da Conquista',   lat: -14.8619, lng: -40.8443, uf: 'BA' },
  { nome: 'Camaçari',               lat: -12.6998, lng: -38.3246, uf: 'BA' },
  { nome: 'Itabuna',                lat: -14.7869, lng: -39.2799, uf: 'BA' },
  { nome: 'Ilhéus',                 lat: -14.7887, lng: -39.0505, uf: 'BA' },
  { nome: 'Juazeiro',               lat: -9.4239,  lng: -40.5031, uf: 'BA' },

  // ── Rio Grande do Sul ──
  { nome: 'Porto Alegre',    lat: -30.0346, lng: -51.2177, uf: 'RS' },
  { nome: 'Caxias do Sul',   lat: -29.1680, lng: -51.1790, uf: 'RS' },
  { nome: 'Pelotas',         lat: -31.7726, lng: -52.3384, uf: 'RS' },
  { nome: 'Canoas',          lat: -29.9178, lng: -51.1839, uf: 'RS' },
  { nome: 'Santa Maria',     lat: -29.6842, lng: -53.8069, uf: 'RS' },
  { nome: 'Gravataí',        lat: -29.9407, lng: -51.0000, uf: 'RS' },
  { nome: 'Novo Hamburgo',   lat: -29.6870, lng: -51.1307, uf: 'RS' },
  { nome: 'Passo Fundo',     lat: -28.2625, lng: -52.4069, uf: 'RS' },
  { nome: 'Rio Grande',      lat: -32.0351, lng: -52.0990, uf: 'RS' },

  // ── Santa Catarina ──
  { nome: 'Florianópolis', lat: -27.5954, lng: -48.5480, uf: 'SC' },
  { nome: 'Joinville',     lat: -26.3044, lng: -48.8487, uf: 'SC' },
  { nome: 'Blumenau',      lat: -26.9194, lng: -49.0661, uf: 'SC' },
  { nome: 'Criciúma',      lat: -28.6778, lng: -49.3689, uf: 'SC' },
  { nome: 'Chapecó',       lat: -27.0953, lng: -52.6122, uf: 'SC' },
  { nome: 'Itajaí',        lat: -26.9078, lng: -48.6658, uf: 'SC' },

  // ── Paraná ──
  { nome: 'Curitiba',       lat: -25.4284, lng: -49.2733, uf: 'PR' },
  { nome: 'Curitiba - Sul', lat: -25.5200, lng: -49.2900, uf: 'PR' },
  { nome: 'Londrina',       lat: -23.3045, lng: -51.1696, uf: 'PR' },
  { nome: 'Maringá',        lat: -23.4210, lng: -51.9331, uf: 'PR' },
  { nome: 'Ponta Grossa',   lat: -25.0945, lng: -50.1633, uf: 'PR' },
  { nome: 'Cascavel',       lat: -24.9578, lng: -53.4596, uf: 'PR' },
  { nome: 'Foz do Iguaçu',  lat: -25.5469, lng: -54.5882, uf: 'PR' },
  { nome: 'São José dos Pinhais', lat: -25.5352, lng: -49.2083, uf: 'PR' },

  // ── Pernambuco ──
  { nome: 'Recife',              lat: -8.0539,  lng: -34.8811, uf: 'PE' },
  { nome: 'Olinda',              lat: -7.9994,  lng: -34.8473, uf: 'PE' },
  { nome: 'Jaboatão',           lat: -8.1131,  lng: -35.0145, uf: 'PE' },
  { nome: 'Caruaru',             lat: -8.2837,  lng: -35.9761, uf: 'PE' },
  { nome: 'Petrolina',           lat: -9.3891,  lng: -40.5028, uf: 'PE' },

  // ── Ceará ──
  { nome: 'Fortaleza',           lat: -3.7172,  lng: -38.5433, uf: 'CE' },
  { nome: 'Fortaleza - Zona Sul',lat: -3.7900,  lng: -38.5500, uf: 'CE' },
  { nome: 'Caucaia',             lat: -3.7364,  lng: -38.6625, uf: 'CE' },
  { nome: 'Juazeiro do Norte',   lat: -7.2137,  lng: -39.3153, uf: 'CE' },
  { nome: 'Sobral',              lat: -3.6881,  lng: -40.3497, uf: 'CE' },
  { nome: 'Maracanaú',           lat: -3.8722,  lng: -38.6275, uf: 'CE' },

  // ── Amazonas ──
  { nome: 'Manaus - Centro', lat: -3.1019,  lng: -60.0250, uf: 'AM' },
  { nome: 'Manaus - Leste',  lat: -3.0833,  lng: -59.9333, uf: 'AM' },
  { nome: 'Parintins',       lat: -2.6298,  lng: -56.7358, uf: 'AM' },

  // ── Pará ──
  { nome: 'Belém',      lat: -1.4558,  lng: -48.5044, uf: 'PA' },
  { nome: 'Ananindeua', lat: -1.3656,  lng: -48.3726, uf: 'PA' },
  { nome: 'Santarém',   lat: -2.4482,  lng: -54.7079, uf: 'PA' },
  { nome: 'Marabá',     lat: -5.3686,  lng: -49.1178, uf: 'PA' },

  // ── Maranhão ──
  { nome: 'São Luís',    lat: -2.5387,  lng: -44.2825, uf: 'MA' },
  { nome: 'Imperatriz',  lat: -5.5244,  lng: -47.4763, uf: 'MA' },
  { nome: 'Caxias',      lat: -4.8650,  lng: -43.3600, uf: 'MA' },

  // ── Goiás ──
  { nome: 'Goiânia',              lat: -16.6869, lng: -49.2648, uf: 'GO' },
  { nome: 'Aparecida de Goiânia', lat: -16.8234, lng: -49.2435, uf: 'GO' },
  { nome: 'Anápolis',             lat: -16.3281, lng: -48.9535, uf: 'GO' },

  // ── Mato Grosso ──
  { nome: 'Cuiabá',        lat: -15.5989, lng: -56.0949, uf: 'MT' },
  { nome: 'Várzea Grande', lat: -15.6469, lng: -56.1325, uf: 'MT' },
  { nome: 'Rondonópolis',  lat: -16.4726, lng: -54.6350, uf: 'MT' },

  // ── Mato Grosso do Sul ──
  { nome: 'Campo Grande', lat: -20.4697, lng: -54.6201, uf: 'MS' },
  { nome: 'Dourados',     lat: -22.2211, lng: -54.8056, uf: 'MS' },

  // ── Distrito Federal ──
  { nome: 'Brasília',    lat: -15.7801, lng: -47.9292, uf: 'DF' },
  { nome: 'Ceilândia',   lat: -15.8218, lng: -48.1114, uf: 'DF' },
  { nome: 'Taguatinga',  lat: -15.8310, lng: -48.0509, uf: 'DF' },

  // ── Espírito Santo ──
  { nome: 'Vitória',     lat: -20.3155, lng: -40.3128, uf: 'ES' },
  { nome: 'Serra',       lat: -20.1286, lng: -40.3069, uf: 'ES' },
  { nome: 'Vila Velha',  lat: -20.3297, lng: -40.2920, uf: 'ES' },
  { nome: 'Cariacica',   lat: -20.2634, lng: -40.4167, uf: 'ES' },

  // ── Rio Grande do Norte ──
  { nome: 'Natal',    lat: -5.7945,  lng: -35.2110, uf: 'RN' },
  { nome: 'Mossoró', lat: -5.1878,  lng: -37.3441, uf: 'RN' },

  // ── Paraíba ──
  { nome: 'João Pessoa',    lat: -7.1195,  lng: -34.8450, uf: 'PB' },
  { nome: 'Campina Grande', lat: -7.2306,  lng: -35.8811, uf: 'PB' },

  // ── Alagoas ──
  { nome: 'Maceió',    lat: -9.6658,  lng: -35.7350, uf: 'AL' },
  { nome: 'Arapiraca', lat: -9.7523,  lng: -36.6601, uf: 'AL' },

  // ── Sergipe ──
  { nome: 'Aracaju', lat: -10.9472, lng: -37.0731, uf: 'SE' },

  // ── Piauí ──
  { nome: 'Teresina', lat: -5.0892,  lng: -42.8019, uf: 'PI' },
  { nome: 'Parnaíba', lat: -2.9050,  lng: -41.7767, uf: 'PI' },

  // ── Rondônia ──
  { nome: 'Porto Velho', lat: -8.7612,  lng: -63.9039, uf: 'RO' },
  { nome: 'Ji-Paraná',   lat: -10.8820, lng: -61.9497, uf: 'RO' },

  // ── Acre ──
  { nome: 'Rio Branco', lat: -9.9754,  lng: -67.8249, uf: 'AC' },

  // ── Amapá ──
  { nome: 'Macapá', lat: 0.0356,   lng: -51.0705, uf: 'AP' },

  // ── Roraima ──
  { nome: 'Boa Vista', lat: 2.8235,   lng: -60.6758, uf: 'RR' },

  // ── Tocantins ──
  { nome: 'Palmas',     lat: -10.2491, lng: -48.3243, uf: 'TO' },
  { nome: 'Araguaína',  lat: -7.1908,  lng: -48.2043, uf: 'TO' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function gerarSlug(nome, id) {
  const base = nome
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base}-${id.slice(0, 6)}`
}

function parseAddress(formatted_address) {
  // Remove "Brasil" e CEP
  const clean = formatted_address
    .replace(/,?\s*Brasil\s*$/i, '')
    .replace(/,?\s*\d{5}-?\d{3}/, '')
    .trim()

  const parts = clean.split(',').map(p => p.trim()).filter(Boolean)
  const lastPart = parts[parts.length - 1] ?? ''

  // Extrai UF (2 letras maiúsculas no final)
  const ufMatch = lastPart.match(/[-–]\s*([A-Z]{2})$/) || lastPart.match(/\b([A-Z]{2})$/)
  const uf      = ufMatch ? ufMatch[1] : ''
  const cidade  = lastPart.replace(/\s*[-–]\s*[A-Z]{2}$/, '').trim()
  const bairro  = parts.length >= 3 ? parts[parts.length - 2] : null
  const endereco = parts.slice(0, Math.max(1, parts.length - 2)).join(', ') || clean

  return { endereco, bairro, cidade, uf }
}

async function buscarPaginas(query, lat, lng) {
  const results = []
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json` +
    `?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${RADIUS_M}&key=${GOOGLE_API_KEY}`

  for (let page = 0; page < 3; page++) {
    const res = await fetch(url).then(r => r.json())

    if (res.status === 'REQUEST_DENIED') throw new Error(res.error_message ?? 'API key inválida')
    if (res.status === 'OVER_QUERY_LIMIT') { await sleep(5000); continue }
    if (res.results) results.push(...res.results)
    if (!res.next_page_token) break

    await sleep(2500) // obrigatório pelo Google antes de usar o next_page_token
    url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${res.next_page_token}&key=${GOOGLE_API_KEY}`
  }

  return results
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🗺️  Importação de bancas do Google Maps → Completando')
  console.log(`📍 ${PONTOS.length} pontos × ${SEARCH_TERMS.length} termos\n`)

  // Carrega place_ids já no banco para deduplicação
  const { data: existentes } = await sb.from('bancas').select('cep')
  const urlsExistentes = new Set((existentes ?? []).map(b => b.cep).filter(Boolean))
  const placeIdsVistos  = new Set()

  let totalInseridas   = 0
  let totalDuplicatas  = 0
  let totalErros       = 0
  let totalEncontradas = 0
  let chamadas         = 0

  for (const ponto of PONTOS) {
    for (const termo of SEARCH_TERMS) {
      process.stdout.write(`  🔍 ${ponto.nome.padEnd(32)} "${termo}"... `)

      try {
        const places = await buscarPaginas(termo, ponto.lat, ponto.lng)
        chamadas++
        totalEncontradas += places.length
        let inseridas = 0

        for (const place of places) {
          const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`

          // Deduplicação por place_id
          if (urlsExistentes.has(mapsUrl) || placeIdsVistos.has(place.place_id)) {
            totalDuplicatas++
            continue
          }
          placeIdsVistos.add(place.place_id)

          const addr = parseAddress(place.formatted_address ?? '')
          const id   = crypto.randomUUID()
          const slug = gerarSlug(place.name, id)

          const { error } = await sb.from('bancas').insert({
            id,
            slug,
            user_id:      null,
            nome:         place.name,
            responsavel:  null,
            telefone:     null,
            email:        null,
            endereco:     addr.endereco,
            bairro:       addr.bairro,
            cidade:       addr.cidade,
            uf:           addr.uf || ponto.uf,
            cep:          mapsUrl,
            horario:      null,
            descricao:    null,
            servicos:     [],
            lat:          place.geometry?.location?.lat ?? null,
            lng:          place.geometry?.location?.lng ?? null,
            ativa:        false,
            destaque:     false,
            total_trocas: 0,
          })

          if (error) {
            if (!error.message.includes('duplicate')) totalErros++
          } else {
            inseridas++
            totalInseridas++
            urlsExistentes.add(mapsUrl)
          }

          await sleep(30)
        }

        console.log(`${String(places.length).padStart(3)} encontradas → ${inseridas} inseridas`)
      } catch (err) {
        console.log(`❌ ${err.message}`)
        totalErros++
      }

      await sleep(400) // pausa entre chamadas
    }
  }

  console.log('\n' + '═'.repeat(52))
  console.log(`  ✅ Concluído!`)
  console.log(`  📊 Resultados do Google Maps: ${totalEncontradas}`)
  console.log(`  ✅ Inseridas no banco:        ${totalInseridas}`)
  console.log(`  ♻️  Duplicatas ignoradas:      ${totalDuplicatas}`)
  console.log(`  ❌ Erros:                     ${totalErros}`)
  console.log(`  📡 Chamadas à API:            ${chamadas}`)
  console.log(`  💰 Custo estimado:            ~$${(chamadas * 0.032).toFixed(2)}`)
  console.log('═'.repeat(52))
  console.log('\n  Todas as bancas estão com ativa: false.')
  console.log('  Vá em /admin → Bancas para revisar e ativar.\n')
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message)
  process.exit(1)
})
