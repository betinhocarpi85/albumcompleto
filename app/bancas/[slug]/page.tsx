'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { QRCodeSVG } from 'qrcode.react'

const BancasMap = dynamic(() => import('@/components/BancasMap'), { ssr: false })

interface Banca {
  id: string; slug: string; nome: string; responsavel?: string | null
  telefone?: string | null; email?: string | null; endereco: string
  bairro?: string | null; cidade: string; uf: string; cep?: string | null
  horario?: string | null; descricao?: string | null; foto_url?: string | null
  destaque: boolean; total_trocas: number; lat?: number | null; lng?: number | null
}

export default function BancaPerfilPage() {
  const { slug }          = useParams<{ slug: string }>()
  const [banca, setBanca] = useState<Banca | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrAberto, setQrAberto] = useState(false)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://completando.com.br'
  const bancaUrl = `${appUrl}/bancas/${slug}`

  useEffect(() => {
    fetch('/api/bancas')
      .then(r => r.json())
      .then(d => {
        const encontrada = (d.bancas ?? []).find((b: Banca) => b.slug === slug)
        setBanca(encontrada ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-400">Carregando...</div>
  )

  if (!banca) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-3">😕</p>
      <p className="text-slate-600 font-medium">Banca não encontrada</p>
      <Link href="/bancas" className="text-green-600 text-sm mt-2 inline-block">← Ver todas as bancas</Link>
    </div>
  )

  const whatsapp = banca.telefone
    ? `https://wa.me/55${banca.telefone.replace(/\D/g, '')}?text=Olá! Vi o perfil da ${banca.nome} no Completando e gostaria de saber mais sobre figurinhas.`
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">

      {/* Breadcrumb */}
      <Link href="/bancas" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-4">
        ← Pontos de Troca
      </Link>

      {/* Header da banca */}
      <div className={`rounded-2xl p-5 mb-4 ${banca.destaque ? 'bg-gradient-to-br from-green-600 to-emerald-500 text-white' : 'bg-white border border-slate-200'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            {banca.destaque && (
              <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
                ⭐ PONTO OFICIAL COMPLETANDO
              </span>
            )}
            <h1 className={`text-xl font-bold ${banca.destaque ? 'text-white' : 'text-slate-800'}`}>{banca.nome}</h1>
            {banca.responsavel && (
              <p className={`text-sm mt-0.5 ${banca.destaque ? 'text-green-100' : 'text-slate-500'}`}>
                👤 {banca.responsavel}
              </p>
            )}
          </div>
          <button
            onClick={() => setQrAberto(true)}
            className={`shrink-0 p-2 rounded-xl transition-colors ${banca.destaque ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            title="Ver QR Code"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        {banca.total_trocas > 0 && (
          <div className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${banca.destaque ? 'text-green-100' : 'text-green-600'}`}>
            🔁 {banca.total_trocas} troca{banca.total_trocas !== 1 ? 's' : ''} realizadas aqui
          </div>
        )}
      </div>

      {/* Descricao */}
      {banca.descricao && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
          <p className="text-sm text-slate-600 leading-relaxed">{banca.descricao}</p>
        </div>
      )}

      {/* Infos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">📍</span>
          <div>
            <p className="text-sm font-medium text-slate-700">{banca.endereco}{banca.bairro ? `, ${banca.bairro}` : ''}</p>
            <p className="text-xs text-slate-400">{banca.cidade} — {banca.uf}{banca.cep ? ` · CEP ${banca.cep}` : ''}</p>
          </div>
        </div>

        {banca.horario && (
          <div className="flex items-center gap-3">
            <span className="text-lg">🕐</span>
            <p className="text-sm text-slate-700">{banca.horario}</p>
          </div>
        )}

        {banca.telefone && (
          <div className="flex items-center gap-3">
            <span className="text-lg">📱</span>
            <p className="text-sm text-slate-700">{banca.telefone}</p>
          </div>
        )}
      </div>

      {/* Mapa mini */}
      {banca.lat && banca.lng && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 mb-4" style={{ height: 200 }}>
          <BancasMap bancas={[banca]} centro={[banca.lat, banca.lng]} zoom={15} />
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Chamar no WhatsApp
          </a>
        )}
        <Link href="/matches"
          className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors">
          🔁 Ver meus matches
        </Link>
      </div>

      {/* Modal QR Code */}
      {qrAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setQrAberto(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-slate-800 mb-1">{banca.nome}</p>
            <p className="text-xs text-slate-400 mb-4">Compartilhe este QR Code na banca!</p>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={bancaUrl} size={200} level="H"
                imageSettings={{ src: '/icon.png', width: 40, height: 40, excavate: true }} />
            </div>
            <p className="text-[10px] text-slate-400 break-all mb-3">{bancaUrl}</p>
            <button onClick={() => navigator.clipboard?.writeText(bancaUrl)}
              className="text-xs text-blue-500 hover:text-blue-600 font-medium mr-4">
              📋 Copiar link
            </button>
            <button onClick={() => setQrAberto(false)}
              className="text-xs text-slate-400 hover:text-slate-600">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
