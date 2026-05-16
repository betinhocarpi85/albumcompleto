'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function SplashScreen() {
  const [visible,  setVisible]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [fadeOut,  setFadeOut]  = useState(false)

  useEffect(() => {
    // Só aparece no modo PWA (standalone)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true
    if (!isPWA) return

    setVisible(true)

    // Anima a barra de progresso
    let p = 0
    const interval = setInterval(() => {
      p += 6
      setProgress(Math.min(p, 95))
      if (p >= 95) clearInterval(interval)
    }, 60)

    // Completa e some
    const done = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setFadeOut(true)
        setTimeout(() => setVisible(false), 400)
      }, 200)
    }, 1200)

    return () => { clearInterval(interval); clearTimeout(done) }
  }, [])

  if (!visible) return null

  return (
    <div
      className={[
        'fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center transition-opacity duration-400',
        fadeOut ? 'opacity-0' : 'opacity-100',
      ].join(' ')}
    >
      {/* Logo */}
      <Image
        src="/logo.png"
        alt="Completando"
        width={180}
        height={40}
        className="h-10 w-auto mb-2"
        priority
      />

      {/* Tagline */}
      <p className="text-xs text-slate-400 font-medium mb-10 tracking-wide">
        Troque e venda figurinhas
      </p>

      {/* Barra de progresso */}
      <div className="w-36 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
