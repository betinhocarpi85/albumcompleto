'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { isLoggedIn } from '@/lib/store'

export default function HomeCTA() {
  const [logado, setLogado] = useState(false)

  useEffect(() => {
    setLogado(isLoggedIn())
  }, [])

  if (logado) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
        <Link href="/matches" className="bg-green-500 hover:bg-green-400 text-white font-bold px-6 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-green-500/25">
          🔁 Ver meus matches
        </Link>
        <Link href="/album" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-xl text-base transition-colors border border-white/20">
          📋 Meu álbum
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
      <Link href="/cadastro" className="bg-green-500 hover:bg-green-400 text-white font-bold px-6 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-green-500/25">
        Começar grátis 🚀
      </Link>
      <Link href="/album" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-xl text-base transition-colors border border-white/20">
        Ver o álbum
      </Link>
    </div>
  )
}
