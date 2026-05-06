'use client'

import Link from 'next/link'

export default function PerfilPublicoPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fadein">
      <p className="text-4xl mb-3">🔍</p>
      <p className="text-lg font-bold text-slate-700 mb-1">Perfis públicos em breve</p>
      <p className="text-sm text-slate-400 mb-6">
        Esta funcionalidade estará disponível quando a rede de usuários estiver ativa.
      </p>
      <Link href="/matches" className="inline-block bg-green-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-green-700 transition-colors">
        ← Voltar para Matches
      </Link>
    </div>
  )
}
