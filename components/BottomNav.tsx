'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { getSession, getUserId } from '@/lib/db'
import { createClient } from '@/lib/supabase/client'

export default function BottomNav() {
  const path = usePathname()
  const [logado, setLogado]         = useState<boolean | null>(null)
  const [notifCount, setNotifCount] = useState(0)
  const [toast, setToast]           = useState<string | null>(null)
  const toastTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    getSession().then(s => setLogado(!!s))
  }, [])

  // Realtime: escuta novas propostas recebidas
  useEffect(() => {
    if (!logado) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any

    getUserId().then(uid => {
      if (!uid) return
      const sb = createClient()

      // Conta propostas pendentes iniciais
      sb.from('propostas')
        .select('id', { count: 'exact', head: true })
        .eq('para_user_id', uid)
        .eq('status', 'pendente')
        .then(({ count }) => setNotifCount(count ?? 0))

      // Realtime: nova proposta recebida
      channel = sb
        .channel(`notif-propostas-${uid}`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('postgres_changes' as any, {
            event:  'INSERT',
            schema: 'public',
            table:  'propostas',
            filter: `para_user_id=eq.${uid}`,
          },
          () => {
            setNotifCount(prev => prev + 1)
            showToast('📬 Nova proposta recebida!')
          }
        )
        .subscribe()
    })

    return () => {
      if (channel) createClient().removeChannel(channel)
    }
  }, [logado])

  const ITEMS_LOGADO = [
    { href: '/',              icon: '🏠', label: 'Início'   },
    { href: '/album',         icon: '📋', label: 'Álbum'    },
    { href: '/matches',       icon: '🔁', label: 'Matches'  },
    { href: '/bancas',        icon: '📍', label: 'Bancas'   },
    { href: '/notificacoes',  icon: '🔔', label: 'Avisos',  badge: notifCount },
    { href: '/conta',         icon: '👤', label: 'Perfil'   },
  ]

  const ITEMS_NAO_LOGADO = [
    { href: '/',        icon: '🏠', label: 'Início'   },
    { href: '/album',   icon: '📋', label: 'Álbum'    },
    { href: '/matches', icon: '🔁', label: 'Matches'  },
    { href: '/bancas',  icon: '🗺️', label: 'Bancas'   },
    { href: '/entrar',  icon: '🔑', label: 'Entrar'   },
  ]

  const ITEMS = logado === false ? ITEMS_NAO_LOGADO : ITEMS_LOGADO

  return (
    <>
      {/* Toast de notificação */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fadein"
          onClick={() => setToast(null)}
        >
          <div className="bg-slate-800 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 cursor-pointer">
            <span>{toast}</span>
            <span className="text-slate-400 text-xs">✕</span>
          </div>
        </div>
      )}

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
                onClick={() => {
                  // Zera o badge ao entrar em notificações
                  if (item.href === '/notificacoes') setNotifCount(0)
                }}
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
    </>
  )
}
