'use client'

import Link from 'next/link'

export default function NotificacoesPage() {
  return (
    <div className="max-w-2xl mx-auto px-3 py-4 animate-fadein">

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/conta" className="text-sm text-slate-400 hover:text-slate-600">‹</Link>
        <h1 className="text-lg font-black text-slate-800">Notificações</h1>
      </div>

      <div className="text-center py-16">
        <p className="text-4xl mb-3">🔔</p>
        <p className="font-bold text-slate-700">Tudo em dia</p>
        <p className="text-sm text-slate-400 mt-1">Você não tem novas notificações.</p>
      </div>
    </div>
  )
}
