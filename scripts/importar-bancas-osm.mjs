#!/usr/bin/env node
/**
 * importar-bancas-osm.mjs
 * Importa bancas de jornal do OpenStreetMap (Overpass API) → Completando.
 * Gratuito, sem API key, sem billing.
 * Todas entram com ativa: false. Admin ativa manualmente.
 *
 * Uso: node scripts/importar-bancas-osm.mjs
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const SUPABASE_URL = 'https://lafonveklbmpffwladrd.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZm9udmVrbGJtcGZmd2xhZHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA4MjY0MiwiZXhwIjoyMDkzNjU4NjQyfQ.6rqB4g-z-ZOWaq3llhrhTRB5rC-EZAfKygQGad5q9oI'

const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

// Mirrors do Overpass API — tenta cada um em sequência
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
]

// Mapeamento de estados brasileiros para pesquisa
const UF_MAP = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
  'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
  'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
  'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
  'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins',
}

// Slug único para cada banca
function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80)
}

function generateSlug(nome, cidade, uf) {
  const base = slugify(`${nome}-${cidade}-${uf}`)
  const hash = crypto.randomBytes(3).toString('hex')
  return `${base}-${hash}`
}

// Extrai UF a partir dos dados de endereço OSM
function extractUF(tags, lat, lng) {
  // Tenta extrair do campo addr:state
  const state = tags['addr:state'] || tags['addr:state_code'] || ''

  // Busca por sigla direta
  if (state && state.length === 2) return state.toUpperCase()

  // Busca por nome do estado
  for (const [uf, nome] of Object.entries(UF_MAP)) {
    if (state.toLowerCase().includes(nome.toLowerCase())) return uf
  }

  return 'BR' // fallback
}

// Extrai cidade dos tags OSM
function extractCidade(tags) {
  return tags['addr:city'] || tags['is_in:city'] || tags['addr:municipality'] || ''
}

// Extrai endereço dos tags OSM
function extractEndereco(tags) {
  const street  = tags['addr:street']  || ''
  const housenr = tags['addr:housenumber'] || ''
  if (street) return housenr ? `${street}, ${housenr}` : street
  return tags['addr:full'] || tags['address'] || ''
}

// Extrai bairro dos tags OSM
function extractBairro(tags) {
  return tags['addr:suburb'] || tags['addr:neighbourhood'] || tags['addr:district'] || ''
}

// Gera URL do Google Maps a partir do OSM ID e coordenadas
function mapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

// Consulta Overpass API tentando cada mirror
async function queryOverpass(query) {
  for (let m = 0; m < OVERPASS_MIRRORS.length; m++) {
    const mirror = OVERPASS_MIRRORS[m]
    console.log(`   Tentando: ${mirror}`)
    try {
      const url = `${mirror}?data=${encodeURIComponent(query)}`
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(120000), // 2min por mirror
      })

      if (res.status === 429 || res.status === 503 || res.status === 504) {
        console.log(`   ⚠️  ${mirror} sobrecarregado (${res.status}) — próximo mirror...`)
        await new Promise(r => setTimeout(r, 3000))
        continue
      }

      if (!res.ok) {
        console.log(`   ⚠️  ${mirror} erro ${res.status} — próximo mirror...`)
        continue
      }

      return await res.json()
    } catch (err) {
      console.log(`   ⚠️  ${mirror} falhou: ${err.message} — próximo mirror...`)
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  throw new Error('Todos os mirrors do Overpass falharam.')
}

async function main() {
  console.log('🗺️  Importação de bancas via OpenStreetMap → Completando')
  console.log('📡 Gratuito · Sem API key · Sem billing\n')

  // Busca slugs e osm_ids já existentes no banco para deduplicar
  console.log('📋 Buscando bancas já cadastradas...')
  const { data: bancasExistentes } = await sb
    .from('bancas')
    .select('slug, cep')
    .limit(10000)

  const osmUrlsExistentes = new Set(
    (bancasExistentes ?? [])
      .map(b => b.cep)
      .filter(Boolean)
  )
  console.log(`   ${osmUrlsExistentes.size} bancas já no banco\n`)

  // ─── Query Overpass ───────────────────────────────────────────────────────
  // Busca todo shop=newsagent no Brasil usando bounding box
  // Brasil: lat -33.75 a 5.27, lng -73.99 a -34.79
  const query = `
[out:json][timeout:180];
(
  node["shop"="newsagent"](-33.75,-73.99,5.27,-34.79);
  node["amenity"="newsagent"](-33.75,-73.99,5.27,-34.79);
  node["shop"="kiosk"](-33.75,-73.99,5.27,-34.79);
);
out body;
  `.trim()

  console.log('🔍 Consultando Overpass API (OpenStreetMap)...')
  console.log('   Isso pode levar 30–60 segundos...\n')

  let data
  try {
    data = await queryOverpass(query)
  } catch (err) {
    console.error('❌ Falha ao consultar Overpass API:', err.message)
    process.exit(1)
  }

  const elementos = data.elements ?? []
  console.log(`✅ ${elementos.length} elementos encontrados no OSM\n`)

  // ─── Processamento ────────────────────────────────────────────────────────
  const novos    = []
  const duplaOs  = new Set() // deduplicação dentro do run
  let ignorados  = 0

  for (const el of elementos) {
    // Só nodes (ways podem aparecer como nó central)
    if (el.type !== 'node') continue

    const tags    = el.tags ?? {}
    const nome    = tags.name || tags['name:pt'] || ''
    const lat     = el.lat
    const lng     = el.lon

    if (!lat || !lng) continue

    // Filtra: precisa ter nome OU ser explicitamente newsagent
    const isNewsagent = tags.shop === 'newsagent' || tags.amenity === 'newsagent'
    const temBanca    = nome.toLowerCase().includes('banca')
    if (!isNewsagent && !temBanca) { ignorados++; continue }

    // Usa nome genérico se não tiver
    const nomeReal = nome || `Banca de Jornal (OSM ${el.id})`

    // Deduplicação por posição aproximada (arredonda pra 4 casas ~11m)
    const posKey = `${lat.toFixed(4)},${lng.toFixed(4)}`
    if (duplaOs.has(posKey)) { ignorados++; continue }
    duplaOs.add(posKey)

    const url = mapsUrl(lat, lng)
    if (osmUrlsExistentes.has(url)) { ignorados++; continue }

    const cidade   = extractCidade(tags)
    const uf       = extractUF(tags, lat, lng)
    const endereco = extractEndereco(tags)
    const bairro   = extractBairro(tags)
    const telefone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || null
    const horario  = tags.opening_hours || null
    const website  = tags.website || tags['contact:website'] || null

    novos.push({
      slug:        generateSlug(nomeReal, cidade || 'br', uf),
      nome:        nomeReal,
      endereco:    endereco || `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`,
      bairro:      bairro   || null,
      cidade:      cidade   || 'Brasil',
      uf,
      cep:         url,          // campo reutilizado para URL do Maps
      lat,
      lng,
      telefone,
      horario,
      descricao:   website ? `Website: ${website}` : null,
      destaque:    false,
      ativa:       false,
      user_id:     null,
      total_trocas: 0,
    })
  }

  console.log(`📊 Resultado do processamento:`)
  console.log(`   ${novos.length} bancas novas para inserir`)
  console.log(`   ${ignorados} ignoradas (duplicadas ou sem dados)\n`)

  if (novos.length === 0) {
    console.log('ℹ️  Nenhuma banca nova para inserir.')
    return
  }

  // ─── Inserção em lotes ────────────────────────────────────────────────────
  const BATCH = 100
  let inseridos = 0
  let erros     = 0

  console.log(`💾 Inserindo em lotes de ${BATCH}...`)

  for (let i = 0; i < novos.length; i += BATCH) {
    const lote   = novos.slice(i, i + BATCH)
    const progresso = Math.round(((i + lote.length) / novos.length) * 100)
    process.stdout.write(`   Lote ${Math.ceil((i + 1) / BATCH)} — ${progresso}%... `)

    const { error } = await sb.from('bancas').insert(lote)
    if (error) {
      console.log(`❌ ${error.message}`)
      erros += lote.length
    } else {
      console.log(`✅`)
      inseridos += lote.length
    }

    // Pequena pausa entre lotes
    if (i + BATCH < novos.length) await new Promise(r => setTimeout(r, 200))
  }

  // ─── Relatório final ──────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50))
  console.log(`✅ Importação concluída!`)
  console.log(`   Inseridas: ${inseridos}`)
  console.log(`   Erros:     ${erros}`)
  console.log(`   Ignoradas: ${ignorados}`)
  console.log(`   Custo:     R$ 0,00 💚`)
  console.log('═'.repeat(50))
  console.log('\nPróximos passos:')
  console.log('  1. Acesse o admin → aba Bancas')
  console.log('  2. Revise as sugestões pendentes')
  console.log('  3. Ative as que quiser → vão aparecer no mapa')
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
