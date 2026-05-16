'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getSession } from '@/lib/db'

export default function HomeCTA() {
  const [logado,       setLogado]       = useState(false)
  const [podeInstalar, setPodeInstalar] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    getSession().catch(() => null).then(s => { if (s) setLogado(true) })

    // Detecta se o browser tem o evento de instalação PWA
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setPodeInstalar(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Se já está instalado (standalone), esconde o botão
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPodeInstalar(false)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function instalar() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setPodeInstalar(false)
    setDeferredPrompt(null)
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
    <div className="flex flex-col gap-3 justify-center md:justify-start">
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/cadastro"
          className="bg-green-500 hover:bg-green-400 text-white font-bold px-6 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-green-500/25 text-center"
        >
          Começar grátis 🚀
        </Link>
      </div>

      {podeInstalar && (
        <button
          onClick={instalar}
          className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          <span>📲</span> Instalar o app
        </button>
      )}
    </div>
  )
}
