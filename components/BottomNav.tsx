'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSession } from '@/lib/db'

export default function BottomNav() {
  const path = usePathname()
  const notifCount = 0
  const [logado, setLogado] = useState<boolean | null>(null)

  useEffect(() => {
    getSession().then(s => setLogado(!!s))
  }, [])

  const ITEMS_LOGADO = [
    { href: '/',              icon: '🏠', label: 'Início'   },
    { href: '/album',        icon: '📋', label: 'Álbum'    },
    { href: '/anuncios',     icon: '📢', label: 'Anúncios' },
    { href: '/matches',      icon: '🔁', label: 'Matches'  },
    { href: '/notificacoes', icon: '🔔', label: 'Avisos', badge: notifCount },
    { href: '/conta',        icon: '👤', label: 'Perfil'   },
  ]

  const ITEMS_NAO_LOGADO = [
    { href: '/',        icon: '🏠', label: 'Início'  },
    { href: '/album',   icon: '📋', label: 'Álbum'   },
    { href: '/matches', icon: '🔁', label: 'Matches' },
    { href: '/entrar',  icon: '🔑', label: 'Entrar'  },
  ]

  // Enquanto carrega, renderiza a nav logada (evita flash)
  const ITEMS = logado === false ? ITEMS_NAO_LOGADO : ITEMS_LOGADO

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-bottom">
      {/* Banner "Começar grátis" para não logados */}
      {logado === false && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 flex items-center justify-between">
          <span className="text-white text-xs font-semibold">Novo por aqui?</span>
          <Link
            href="/cadastro"
            className="bg-white text-green-600 font-bold text-xs px-3 py-1.5 rounded-lg"
          >
            Começar grátis 🚀
          </Link>
        </div>
      )}
      <div className="flex items-center justify-around px-1 py-1">
        {ITEMS.map((item) => {
          const active = path === item.href || (item.href !== '/' && path.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'relative flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all min-w-[44px]',
                active ? 'text-green-600' : 'text-slate-400',
              ].join(' ')}
            >
              <span className={['text-lg transition-transform', active ? 'scale-110' : ''].join(' ')}>
                {item.icon}
              </span>
              <span className={['text-[9px] font-medium', active ? 'text-green-600' : 'text-slate-400'].join(' ')}>
                {item.label}
              </span>
              {(item as { badge?: number }).badge != null && (item as { badge?: number }).badge! > 0 && (
                <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                  {(item as { badge?: number }).badge! > 9 ? '9+' : (item as { badge?: number }).badge}
                </span>
              )}
              {active && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-500" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
