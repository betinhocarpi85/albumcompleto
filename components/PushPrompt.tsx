'use client'

import { useEffect, useState } from 'react'

export default function PushPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Só mostra se ainda não decidiu
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'default') return
    if (localStorage.getItem('push_prompt_dismissed')) return

    // Aparece após 10 segundos
    const t = setTimeout(() => setVisible(true), 10_000)
    return () => clearTimeout(t)
  }, [])

  async function ativar() {
    setVisible(false)
    try {
      const w = window as any
      if (w.OneSignal) {
        await w.OneSignal.Notifications.requestPermission()
      } else {
        await Notification.requestPermission()
      }
    } catch {}
  }

  function dispensar() {
    setVisible(false)
    localStorage.setItem('push_prompt_dismissed', '1')
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-fadein">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xl">🔔</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm leading-snug mb-0.5">
            Ative as notificações
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Saiba na hora quando alguém enviar uma proposta ou surgir um novo match!
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={ativar}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 rounded-xl transition-colors"
            >
              Ativar 🔔
            </button>
            <button
              onClick={dispensar}
              className="px-3 py-2 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
