'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSession, dbGetProfile } from '@/lib/db'

function iniciais(nome?: string) {
  if (!nome) return '?'
  const p = nome.trim().split(' ').filter(Boolean)
  return (p[0]?.[0] ?? '') + (p[p.length - 1]?.[0] ?? '')
}

export default function Navbar() {
  const path = usePathname()
  const [notifCount, setNotifCount] = useState(0)
  const [logado, setLogado]         = useState(false)
  const [nomeUsuario, setNomeUsuario] = useState('')

  useEffect(() => {
    getSession().then(session => {
      setLogado(!!session)
      if (session) dbGetProfile().then(p => setNomeUsuario(p.nome ?? ''))
    })
  }, [])

  const links = [
    { href: '/',          label: 'Início'      },
    { href: '/album',    label: 'Álbum'       },
    { href: '/anuncios', label: 'Anúncios'    },
    { href: '/matches',  label: 'Matches'     },
    { href: '/conta',    label: 'Minha Conta' },
  ]

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto w-full px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-black">C</span>
          </div>
          <span className="font-black text-slate-800 text-lg tracking-tight">
            completan<span className="text-green-500">do</span>
          </span>
        </Link>

        {/* Links */}
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                path === l.href
                  ? 'bg-green-50 text-green-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
              ].join(' ')}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* CTA + sino */}
        <div className="flex items-center gap-3">
          <Link href="/notificacoes" className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <span className="text-xl">🔔</span>
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </Link>
          {logado ? (
            <Link
              href="/conta"
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-green-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                <span className="text-white text-xs font-black">{iniciais(nomeUsuario) || 'EU'}</span>
              </div>
              {nomeUsuario ? nomeUsuario.split(' ')[0] : 'Minha Conta'}
            </Link>
          ) : (
            <>
              <Link
                href="/entrar"
                className="text-sm text-slate-600 hover:text-slate-900 font-medium"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="text-sm bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Começar grátis
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
