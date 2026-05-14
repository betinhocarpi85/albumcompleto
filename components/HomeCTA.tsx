'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getSession } from '@/lib/db'

export default function HomeCTA() {
  const [logado, setLogado] = useState<boolean | null>(null)

  useEffect(() => {
    Promise.race([
      getSession().catch(() => null),
      new Promise<null>(r => setTimeout(() => r(null), 3000)),
    ]).then(s => setLogado(!!s))
  }, [])

  // Enquanto verifica, mostra placeholder invisível para não ter layout shift
  if (logado === null) {
    return <div className="h-12" />
  }

  if (logado) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
        <Link
          href="/album"
          className="bg-green-500 hover:bg-green-400 text-white font-bold px-6 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-green-500/25"
        >
          Acessar meu álbum →
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
      <Link
        href="/cadastro"
        className="bg-green-500 hover:bg-green-400 text-white font-bold px-6 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-green-500/25"
      >
        Começar grátis 🚀
      </Link>
    </div>
  )
}
