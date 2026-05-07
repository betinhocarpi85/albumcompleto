'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetSenhaPage() {
  const router = useRouter()
  const [senhaNova, setSenhaNova]   = useState('')
  const [senhaConf, setSenhaConf]   = useState('')
  const [erro, setErro]             = useState('')
  const [salvo, setSalvo]           = useState(false)
  const [loading, setLoading]       = useState(false)
  const [pronto, setPronto]         = useState(false)

  useEffect(() => {
    // Supabase injeta o token via hash fragment — basta aguardar a sessão
    const sb = createClient()
    sb.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPronto(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (senhaNova.length < 8)    { setErro('Senha deve ter ao menos 8 caracteres.'); return }
    if (senhaNova !== senhaConf) { setErro('As senhas não coincidem.'); return }
    setErro('')
    setLoading(true)
    const sb = createClient()
    const { error } = await sb.auth.updateUser({ password: senhaNova })
    setLoading(false)
    if (error) { setErro('Erro ao salvar: ' + error.message); return }
    setSalvo(true)
    setTimeout(() => router.push('/entrar'), 2000)
  }

  if (!pronto) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <span className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin inline-block mb-3" />
        <p className="text-sm text-slate-500">Verificando link de recuperação...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fadein">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-base font-black">C</span>
            </div>
            <span className="font-black text-white text-xl tracking-tight">
              completan<span className="text-green-400">do</span>
            </span>
          </Link>
          <p className="text-slate-400 text-sm mt-1">Redefinir senha</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {salvo ? (
            <div className="text-center py-4">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-black text-slate-800 text-lg mb-2">Senha alterada!</p>
              <p className="text-sm text-slate-400">Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-sm text-slate-500 mb-2">Escolha sua nova senha.</p>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nova senha</label>
                <input type="password" placeholder="Mínimo 8 caracteres" required
                  value={senhaNova} onChange={e => setSenhaNova(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Confirmar senha</label>
                <input type="password" placeholder="••••••••" required
                  value={senhaConf} onChange={e => setSenhaConf(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">{erro}</div>
              )}
              <button type="submit" disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Salvando...</>
                  : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
