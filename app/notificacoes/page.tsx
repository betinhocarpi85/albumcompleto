'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MOCK_NOTIFICACOES, getNotifsSeen, markNotifSeen } from '@/lib/store'

export default function NotificacoesPage() {
  const [vistas, setVistas] = useState<string[]>([])

  useEffect(() => {
    setVistas(getNotifsSeen())
  }, [])

  function marcarTodas() {
    MOCK_NOTIFICACOES.forEach(n => markNotifSeen(n.id))
    setVistas(MOCK_NOTIFICACOES.map(n => n.id))
  }

  function marcar(id: string) {
    markNotifSeen(id)
    setVistas(prev => [...prev, id])
  }

  const naoVistas = MOCK_NOTIFICACOES.filter(n => !vistas.includes(n.id)).length

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 animate-fadein">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link href="/conta" className="text-sm text-slate-400 hover:text-slate-600">‹</Link>
          <h1 className="text-lg font-black text-slate-800">Notificações</h1>
          {naoVistas > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
              {naoVistas}
            </span>
          )}
        </div>
        {naoVistas > 0 && (
          <button
            onClick={marcarTodas}
            className="text-xs text-green-600 font-semibold hover:text-green-700"
          >
            Marcar todas como vistas
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="space-y-1">
        {MOCK_NOTIFICACOES.map(n => {
          const vista = vistas.includes(n.id)
          return (
            <Link
              key={n.id}
              href={n.link}
              onClick={() => marcar(n.id)}
              className={[
                'flex items-start gap-3 px-4 py-3.5 rounded-2xl border transition-all',
                vista
                  ? 'bg-white border-slate-100'
                  : 'bg-green-50 border-green-200',
              ].join(' ')}
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-bold ${vista ? 'text-slate-700' : 'text-slate-800'}`}>
                    {n.titulo}
                  </p>
                  {!vista && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{n.desc}</p>
                <p className="text-[10px] text-slate-400 mt-1">{n.data}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {MOCK_NOTIFICACOES.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-bold text-slate-700">Tudo em dia</p>
          <p className="text-sm text-slate-400 mt-1">Você não tem novas notificações.</p>
        </div>
      )}
    </div>
  )
}
