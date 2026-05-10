'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { dbGetPublicProfile, type PublicProfileData } from '@/lib/db'

function StarRating({ media, count }: { media: number | null; count: number }) {
  if (media === null || count === 0) {
    return <span className="text-xs text-slate-400">Sem avaliações ainda</span>
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <span
            key={i}
            className={`text-sm ${i <= Math.round(media) ? 'text-yellow-400' : 'text-slate-200'}`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-xs font-bold text-slate-700">{media.toFixed(1)}</span>
      <span className="text-xs text-slate-400">({count} avaliação{count !== 1 ? 'ões' : ''})</span>
    </div>
  )
}

export default function PerfilPublicoPage() {
  const { id } = useParams<{ id: string }>()
  const [perfil, setPerfil] = useState<PublicProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!id) return
    dbGetPublicProfile(id).then(data => {
      setPerfil(data)
      setLoading(false)
    })
  }, [id])

  function copiarLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="w-7 h-7 border-2 border-slate-200 border-t-green-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fadein">
        <p className="text-4xl mb-3">😕</p>
        <p className="text-lg font-bold text-slate-700">Perfil não encontrado</p>
        <Link href="/matches" className="mt-6 inline-block text-sm text-green-600 font-semibold hover:underline">
          ← Voltar para Matches
        </Link>
      </div>
    )
  }

  const initials = perfil.nome.slice(0, 2).toUpperCase()

  return (
    <div className="max-w-xl mx-auto px-3 py-4 animate-fadein">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/matches" className="text-sm text-slate-400 hover:text-slate-600">‹ Voltar</Link>
        <button
          onClick={copiarLink}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-colors"
        >
          {copiado ? '✓ Copiado!' : '🔗 Compartilhar'}
        </button>
      </div>

      {/* Card do perfil */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-4">
        <div className="flex items-center gap-4 mb-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-xl font-black">{initials}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-slate-800 leading-tight">{perfil.nome}</h1>
            {perfil.localidade && (
              <p className="text-sm text-slate-500 mt-0.5">📍 {perfil.localidade}</p>
            )}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-50 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-black text-green-600">{perfil.tradeCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">troca{perfil.tradeCount !== 1 ? 's' : ''} realizada{perfil.tradeCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl px-4 py-3 text-center">
            {perfil.ratingMedia !== null ? (
              <>
                <p className="text-2xl font-black text-yellow-500">{perfil.ratingMedia.toFixed(1)}</p>
                <p className="text-xs text-slate-500 mt-0.5">avaliação média</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-slate-300">—</p>
                <p className="text-xs text-slate-400 mt-0.5">sem avaliações</p>
              </>
            )}
          </div>
        </div>

        {/* Stars */}
        <div className="flex justify-center">
          <StarRating media={perfil.ratingMedia} count={perfil.ratingCount} />
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/matches"
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-3 rounded-2xl transition-colors shadow-sm"
      >
        🔁 Ver matches e propor troca
      </Link>
    </div>
  )
}
