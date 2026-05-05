'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SenhaPage() {
  const [email, setEmail]   = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setEnviado(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fadein">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-base font-black">AC</span>
            </div>
            <span className="font-black text-white text-xl tracking-tight">
              álbum<span className="text-green-400">completo</span>
            </span>
          </Link>
          <p className="text-slate-400 text-sm mt-1">Recuperar senha</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {!enviado ? (
            <>
              <p className="text-sm text-slate-500 mb-4">
                Informe o e-mail cadastrado e enviaremos um link para redefinir sua senha.
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">E-mail</label>
                  <input
                    type="email" placeholder="seu@email.com" required
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando...</>
                    : 'Enviar link de recuperação'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-4xl mb-3">📬</p>
              <p className="font-black text-slate-800 text-lg mb-2">E-mail enviado!</p>
              <p className="text-sm text-slate-500 mb-5">
                Verifique a caixa de entrada de <span className="font-semibold">{email}</span> e siga as instruções para redefinir sua senha.
              </p>
              <p className="text-xs text-slate-400">Não recebeu? Cheque o spam ou</p>
              <button onClick={() => setEnviado(false)} className="text-xs text-green-600 font-semibold hover:underline">
                tente novamente
              </button>
            </div>
          )}

          <p className="text-center text-xs text-slate-400 mt-5">
            Lembrou a senha?{' '}
            <Link href="/entrar" className="text-green-600 font-semibold hover:text-green-700">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
