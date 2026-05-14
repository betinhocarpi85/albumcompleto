'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signUp, signInWithGoogle, getSession } from '@/lib/db'

export default function CadastroPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [erros,   setErros]   = useState<string[]>([])
  const [email,   setEmail]   = useState('')
  const [senha,   setSenha]   = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenha,      setMostrarSenha]      = useState(false)
  const [mostrarConfirmar,  setMostrarConfirmar]  = useState(false)

  // Redireciona usuário já logado direto para o álbum
  useEffect(() => {
    Promise.race([
      getSession().catch(() => null),
      new Promise<null>(r => setTimeout(() => r(null), 3000)),
    ]).then(session => {
      if (session) router.replace('/album')
    })
  }, [router])

  async function handleSubmit() {
    const e: string[] = []
    if (!email.includes('@'))       e.push('E-mail inválido.')
    if (senha.length < 6)           e.push('A senha deve ter pelo menos 6 caracteres.')
    if (senha !== confirmar)         e.push('As senhas não coincidem.')
    if (e.length) { setErros(e); return }
    setErros([])
    setLoading(true)

    const { data, error } = await signUp(email.trim(), senha)

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setErros(['Este e-mail já está cadastrado. Tente entrar.'])
      } else {
        setErros([error.message])
      }
      setLoading(false)
      return
    }

    if (data.session) {
      // Email confirm desativado no Supabase → sessão imediata
      // window.location garante reload completo para sincronizar cookies da sessão
      await fetch('/api/set-pending', { method: 'POST' })
      window.location.href = '/completar-cadastro'
    } else {
      // Email confirm ativado → raro neste projeto, mas trata
      setErros(['Confirme seu e-mail antes de continuar.'])
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    await signInWithGoogle()
  }

  const inp = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fadein">

        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-2">
            <Image src="/logo.png" alt="Completando" width={200} height={56} className="h-12 w-auto" priority />
          </Link>
          <p className="text-slate-400 text-sm">Crie sua conta grátis</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h2 className="font-black text-slate-800 text-lg mb-4">Criar conta</h2>

          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-xl transition-all text-sm mb-4 disabled:opacity-60">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Cadastrar com Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">ou com e-mail</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {erros.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3">
              {erros.map(e => <p key={e} className="text-xs text-red-600">• {e}</p>)}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">E-mail</label>
              <input type="email" placeholder="seu@email.com" value={email}
                onChange={e => setEmail(e.target.value)} className={inp} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className={inp + ' pr-10'}
                />
                <button type="button" onClick={() => setMostrarSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                  {mostrarSenha ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Confirmar senha</label>
              <div className="relative">
                <input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  className={inp + ' pr-10'}
                />
                <button type="button" onClick={() => setMostrarConfirmar(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                  {mostrarConfirmar ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-1">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Criando conta...</>
                : 'Criar conta →'}
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Já tem conta?{' '}
            <Link href="/entrar" className="text-green-600 font-semibold">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
