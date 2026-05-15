'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSession, dbGetProfile, dbGetPlano } from '@/lib/db'

function iniciais(nome?: string) {
  if (!nome) return '?'
  const p = nome.trim().split(' ').filter(Boolean)
  return (p[0]?.[0] ?? '') + (p[p.length - 1]?.[0] ?? '')
}

export default function Navbar() {
  const path = usePathname()
  const [notifCount, setNotifCount] = useState(0)
  const [logado, setLogado]           = useState(false)
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [isPro, setIsPro]             = useState(false)

  useEffect(() => {
    getSession().then(session => {
      setLogado(!!session)
      if (session) {
        dbGetProfile().then(p => setNomeUsuario(p.nome ?? ''))
        dbGetPlano().then(({ plano }) => setIsPro(plano === 'pro'))
      }
    })
  }, [])

  const links = [
    { href: '/',          label: 'Início'      },
    { href: '/album',    label: 'Álbum'       },
    { href: '/anuncios', label: 'Anúncios'    },
    { href: '/matches',  label: 'Matches'     },
    { href: '/bancas',   label: 'Bancas'      },
    { href: '/suporte',  label: 'Suporte'     },
    { href: '/conta',    label: 'Minha Conta' },
  ]

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto w-full px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Image src="/logo.png" alt="Completando" height={28} width={126} className="h-7 w-auto" priority />
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
              <span>{nomeUsuario ? nomeUsuario.split(' ')[0] : 'Minha Conta'}</span>
              {isPro
                ? <span className="text-[10px] font-black bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full">PRO</span>
                : <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">Grátis</span>
              }
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
