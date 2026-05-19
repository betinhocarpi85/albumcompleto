'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, signInWithGoogle, getSession, dbGetProfile } from '@/lib/db'
import { Suspense } from 'react'

function EntrarForm() {
  const router = useRouter()
  const params = useSearchParams()
  const ALLOWED = ['/album', '/matches', '/propostas', '/anuncios', '/conta', '/bancas', '/notificacoes']
  const nextRaw = params.get('next') ?? '/album'
  const next    = ALLOWED.includes(nextRaw) ? nextRaw : '/album'

  const [email,   setEmail]   = useState('')
  const [senha,   setSenha]   = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [erro,    setErro]    = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSession().then(s => { if (s) router.replace(next) })
  }, [router, next])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErro('E-mail inválido.'); return }
    if (!senha)                { setErro('Informe a senha.'); return }
    setErro('')
    setLoading(true)

    const { data, error } = await signIn(email.trim(), senha)

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('invalid') || msg.includes('credentials')) {
        setErro('E-mail ou senha incorretos.')
      } else {
        setErro(error.message)
      }
      setLoading(false)
      return
    }

    if (data.session) {
      // Verifica se o perfil está completo
      const p = await dbGetProfile()
      if (!p.telefone || !p.cep || !p.aceitouTermos || !p.aceitouPrivacidade) {
        await fetch('/api/set-pending', { method: 'POST' })
        window.location.href = '/completar-cadastro'
      } else {
        window.location.href = next
      }
    }
  }

  async function handleGoogle() {
    setLoading(true)
    await signInWithGoogle()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 flex items-center justify-center px-4 py-12 pb-32">
      <div className="w-full max-w-sm animate-fadein">

        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-2">
            <Image src="/logo.png" alt="Completando" width={200} height={56} className="h-12 w-auto" priority />
          </Link>
          <p className="text-slate-400 text-sm mt-1">Entre na sua conta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">

          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-xl transition-all text-sm mb-4 disabled:opacity-60">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">ou use seu e-mail</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">E-mail</label>
              <input type="email" placeholder="seu@email.com" value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                required />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600">Senha</label>
                <a href="/senha" className="text-xs text-green-600 hover:text-green-700 font-medium">
                  Esqueci minha senha
                </a>
              </div>
              <div className="relative">
                <input
                  type={mostrar ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  required
                />
                <button type="button" onClick={() => setMostrar(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                  {mostrar ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
                {erro}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Entrando...</>
                : 'Entrar →'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-5">
            Não tem conta?{' '}
            <Link href="/cadastro" className="text-green-600 font-semibold hover:text-green-700">
              Criar grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function EntrarPage() {
  return (
    <Suspense>
      <EntrarForm />
    </Suspense>
  )
}
