import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl mb-4">😅</div>
      <h1 className="text-4xl font-bold text-slate-800 mb-2">404</h1>
      <p className="text-lg text-slate-600 mb-1">Página não encontrada</p>
      <p className="text-sm text-slate-400 mb-8">
        Essa página não existe ou foi removida.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Ir para o início
        </Link>
        <Link
          href="/album"
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Meu álbum
        </Link>
      </div>
    </div>
  )
}
