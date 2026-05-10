'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getSession } from '@/lib/db'

export default function HomeCTA() {
  const [logado, setLogado] = useState(false)

  useEffect(() => {
    getSession().then(s => setLogado(!!s))
  }, [])

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
      <Link href="/cadastro" className="bg-green-500 hover:bg-green-400 text-white font-bold px-6 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-green-500/25">
        Começar grátis 🚀
      </Link>
    </div>
  )
}
