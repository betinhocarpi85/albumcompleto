// ─── Helpers para processar links do Google Maps ─────────────────────────────

export function parseLatLng(url: string): { lat: number; lng: number } | null {
  // 1. Coordenadas exatas do lugar nos dados internos do Maps (!3d<lat>!4d<lng>)
  //    São as mais precisas — representam o pin do estabelecimento
  const dataMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (dataMatch) return { lat: parseFloat(dataMatch[1]), lng: parseFloat(dataMatch[2]) }

  // 2. Parâmetro q=lat,lng (links de busca por coordenada)
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) }

  // 3. Parâmetro ll= (formato legado)
  const llMatch = url.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) }

  // 4. @lat,lng — centro do viewport (menos preciso, mas útil como fallback)
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) }

  return null
}

export async function resolveUrl(url: string): Promise<string> {
  if (!url.includes('goo.gl') && !url.includes('bit.ly')) return url
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return res.url || url
  } catch {
    return url
  }
}

export interface GeoInfo {
  endereco: string
  bairro:   string | null
  cidade:   string
  uf:       string
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoInfo> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'completando.com.br/1.0' } }
    ).then(r => r.json())

    const a = res.address ?? {}
    return {
      endereco: [a.road, a.house_number].filter(Boolean).join(', ') || res.display_name || '',
      bairro:   a.suburb ?? a.neighbourhood ?? a.quarter ?? null,
      cidade:   a.city ?? a.town ?? a.village ?? a.municipality ?? '',
      uf:       (a.state_code ?? a.ISO3166_2_lvl4 ?? '').replace('BR-', '').slice(0, 2),
    }
  } catch {
    return { endereco: '', bairro: null, cidade: '', uf: '' }
  }
}

/** Geocodifica um CEP brasileiro → { lat, lng } via Nominatim (gratuito) */
export async function geocodeCep(cep: string): Promise<{ lat: number; lng: number } | null> {
  const clean = cep.replace(/\D/g, '')
  if (clean.length !== 8) return null
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${clean}&country=Brazil&format=json&limit=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'completando.com.br/1.0' },
    }).then(r => r.json())
    if (!res?.[0]) return null
    return { lat: parseFloat(res[0].lat), lng: parseFloat(res[0].lon) }
  } catch {
    return null
  }
}

/**
 * Geocodifica CEP com estratégia robusta:
 * 1. Nominatim por CEP
 * 2. ViaCEP → endereço → Nominatim por endereço
 * 3. ViaCEP → cidade/UF → Nominatim por cidade (coordenada aproximada)
 */
export async function geocodeCepRobusto(cep: string): Promise<{ lat: number; lng: number } | null> {
  const clean = cep.replace(/\D/g, '')
  if (clean.length !== 8) return null

  // Tentativa 1: Nominatim direto pelo CEP
  const direct = await geocodeCep(clean)
  if (direct) return direct

  // Tentativa 2 e 3: ViaCEP para obter endereço completo
  try {
    const via = await fetch(`https://viacep.com.br/ws/${clean}/json/`).then(r => r.json())
    if (via?.erro) return null

    const nominatim = async (q: string) => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'completando.com.br/1.0' } }
        ).then(r => r.json())
        return r?.[0] ? { lat: parseFloat(r[0].lat), lng: parseFloat(r[0].lon) } : null
      } catch { return null }
    }

    // Tentativa 2: endereço + bairro + cidade + UF
    if (via.logradouro) {
      const q = [via.logradouro, via.bairro, via.localidade, via.uf, 'Brasil'].filter(Boolean).join(', ')
      const coords = await nominatim(q)
      if (coords) return coords
    }

    // Tentativa 3: só cidade + UF (coordenada aproximada do centro)
    if (via.localidade) {
      const q = `${via.localidade}, ${via.uf}, Brasil`
      return await nominatim(q)
    }
  } catch { /* ignora */ }

  return null
}

/** Haversine: distância em km entre dois pontos */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    = Math.sin(dLat / 2) ** 2
             + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Processa um maps_url e retorna os campos para salvar no banco */
export async function processMapsUrl(mapsUrl: string) {
  const fullUrl = await resolveUrl(mapsUrl.trim())
  const coords  = parseLatLng(fullUrl)
  if (!coords) return null

  const geo = await reverseGeocode(coords.lat, coords.lng)
  return {
    cep:      fullUrl,           // campo cep guarda o link original
    lat:      coords.lat,
    lng:      coords.lng,
    endereco: geo.endereco || fullUrl,
    bairro:   geo.bairro,
    cidade:   geo.cidade,
    uf:       geo.uf,
  }
}
