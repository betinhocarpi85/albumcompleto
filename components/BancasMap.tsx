'use client'

import { useEffect, useRef } from 'react'
// CSS do Leaflet importado no layout Server Component de /bancas (app/bancas/layout.tsx)
// para scoping por rota — não polui o bundle CSS global

interface Banca {
  id: string
  slug: string
  nome: string
  endereco: string
  bairro?: string | null
  cidade: string
  uf: string
  telefone?: string | null
  horario?: string | null
  destaque: boolean
  total_trocas: number
  lat?: number | null
  lng?: number | null
}

interface Props {
  bancas:      Banca[]
  centro?:     [number, number]
  zoom?:       number
  onSelect?:   (b: Banca) => void
  focusBanca?: { lat: number; lng: number; slug: string } | null
}

export default function BancasMap({ bancas, centro = [-22.9068, -43.1729], zoom = 5, onSelect, focusBanca }: Props) {
  const mapRef      = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<unknown>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef  = useRef<Record<string, any>>({})

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return

    // Lazy import do Leaflet (evita SSR crash)
    import('leaflet').then(L => {
      if (!mapRef.current || instanceRef.current) return

      // Fix ícones padrão do Leaflet com webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView(centro, zoom)
      instanceRef.current = map

      // Garante que o mapa recalcula dimensões após montagem no DOM
      setTimeout(() => map.invalidateSize(), 50)

      // Enquadra automaticamente todas as bancas com coordenadas
      const comCoords = bancas.filter(b => b.lat && b.lng)
      if (comCoords.length > 0) {
        const bounds = L.latLngBounds(comCoords.map(b => [b.lat!, b.lng!] as [number, number]))
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
      }

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      const iconDestaque = L.divIcon({
        html: '<div style="background:#22c55e;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',
        iconSize:   [32, 32],
        iconAnchor: [16, 32],
        className:  '',
      })
      const iconNormal = L.divIcon({
        html: '<div style="background:#3b82f6;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',
        iconSize:   [26, 26],
        iconAnchor: [13, 26],
        className:  '',
      })

      bancas.forEach(b => {
        if (!b.lat || !b.lng) return
        const marker = L.marker([b.lat, b.lng], { icon: b.destaque ? iconDestaque : iconNormal })

        const popup = `
          <div style="font-family:sans-serif;min-width:180px">
            ${b.destaque ? '<span style="background:#22c55e;color:#fff;font-size:10px;padding:2px 6px;border-radius:10px;font-weight:600">⭐ Destaque</span><br>' : ''}
            <strong style="font-size:14px">${b.nome}</strong><br>
            <span style="color:#64748b;font-size:12px">${b.endereco}${b.bairro ? ', ' + b.bairro : ''}</span><br>
            <span style="color:#64748b;font-size:12px">${b.cidade} — ${b.uf}</span>
            ${b.horario ? `<br><span style="font-size:12px">🕐 ${b.horario}</span>` : ''}
            ${b.telefone ? `<br><a href="https://wa.me/55${b.telefone.replace(/\D/g,'')}" style="color:#22c55e;font-size:12px;font-weight:600" target="_blank">📱 WhatsApp</a>` : ''}
            ${b.total_trocas > 0 ? `<br><span style="font-size:11px;color:#94a3b8">🔁 ${b.total_trocas} troca${b.total_trocas !== 1 ? 's' : ''} realizadas aqui</span>` : ''}
            <br><a href="/bancas/${b.slug}" style="color:#3b82f6;font-size:12px;font-weight:600">Ver perfil →</a>
          </div>`

        marker.bindPopup(popup)
        if (onSelect) marker.on('click', () => onSelect(b))
        marker.addTo(map)
        markersRef.current[b.slug] = marker
      })
    })

    return () => {
      if (instanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(instanceRef.current as any).remove()
        instanceRef.current = null
        markersRef.current  = {}
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Voa até a banca selecionada e abre o popup
  useEffect(() => {
    if (!focusBanca || !instanceRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = instanceRef.current as any
    map.flyTo([focusBanca.lat, focusBanca.lng], 16, { animate: true, duration: 0.7 })
    const marker = markersRef.current[focusBanca.slug]
    if (marker) setTimeout(() => marker.openPopup(), 750)
  }, [focusBanca])

  return <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 320, zIndex: 0 }} />
}
