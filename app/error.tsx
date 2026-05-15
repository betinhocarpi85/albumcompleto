'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/error]', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Algo deu errado</h1>
      <p className="text-sm text-slate-400 mb-8 max-w-sm">
        Ocorreu um erro inesperado. Tente novamente ou volte para o início.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Tentar novamente
        </button>
        <a
          href="/"
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Ir para o início
        </a>
      </div>
    </div>
  )
}
