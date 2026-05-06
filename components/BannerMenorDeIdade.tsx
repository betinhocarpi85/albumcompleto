'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getSession, dbGetProfile } from '@/lib/db'

/**
 * Exibe um banner de bloqueio para usuários menores de idade
 * (ou que não confirmaram maioridade no cadastro).
 * Retorna null se o usuário for maior ou não estiver logado.
 */
export default function BannerMenorDeIdade() {
  const [bloqueado, setBloqueado] = useState(false)

  useEffect(() => {
    getSession().then(session => {
      if (!session) return
      dbGetProfile().then(p => setBloqueado(!p.maior18))
    })
  }, [])

  if (!bloqueado) return null

  return (
    <div className="mx-3 mt-4 mb-2 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-4 flex items-start gap-3">
      <span className="text-2xl flex-shrink-0">⚠️</span>
      <div className="flex-1">
        <p className="font-black text-amber-800 text-sm mb-1">Acesso restrito</p>
        <p className="text-xs text-amber-700 leading-relaxed mb-3">
          Esta funcionalidade é disponível apenas para maiores de 18 anos.
          Confirme sua maioridade no cadastro para desbloquear trocas, vendas e compras.
        </p>
        <Link
          href="/completar-cadastro"
          className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
        >
          Confirmar maioridade →
        </Link>
      </div>
    </div>
  )
}
