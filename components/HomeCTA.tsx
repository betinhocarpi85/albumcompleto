'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getSession } from '@/lib/db'

export default function HomeCTA() {
  const [logado, setLogado] = useState(false)

  useEffect(() => {
    getSession().catch(() => null).then(s => { if (s) setLogado(true) })
  }, [])

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
