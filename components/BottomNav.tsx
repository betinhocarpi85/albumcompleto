'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/',          icon: '🏠', label: 'Início'   },
  { href: '/album',    icon: '📋', label: 'Álbum'    },
  { href: '/anuncios', icon: '📢', label: 'Anúncios' },
  { href: '/matches',  icon: '🔁', label: 'Matches'  },
  { href: '/conta',    icon: '👤', label: 'Perfil'   },
]

export default function BottomNav() {
  const path = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {ITEMS.map((item) => {
          const active = path === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[52px]',
                active ? 'text-green-600' : 'text-slate-400',
              ].join(' ')}
            >
              <span className={['text-xl transition-transform', active ? 'scale-110' : ''].join(' ')}>
                {item.icon}
              </span>
              <span className={['text-[10px] font-medium', active ? 'text-green-600' : 'text-slate-400'].join(' ')}>
                {item.label}
              </span>
              {active && (
                <span className="absolute -top-0.5 w-1 h-1 rounded-full bg-green-500" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
