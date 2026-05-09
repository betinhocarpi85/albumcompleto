'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUp, signInWithGoogle, getSession, dbSaveProfile } from '@/lib/db'

function formatTelefone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function formatCEP(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading]     = useState(false)
  const [erros, setErros]         = useState<string[]>([])
  const [showSenha, setShowSenha] = useState(false)
  const [nome,      setNome]      = useState('')
  const [email,     setEmail]     = useState('')
  const [senha,     setSenha]     = useState('')
  const [conf,      setConf]      = useState('')
  const [telefone,  setTelefone]  = useState('')
  const [cep,       setCep]       = useState('')
  const [cidade,    setCidade]    = useState('')
  const [uf,        setUf]        = useState('')
  const [cepOk,     setCepOk]     = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [aceitouTermos,      setAceitouTermos]      = useState(false)
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false)

  useEffect(() => {
    getSession().then(s => { if (s) router.replace('/album') })
  }, [router])

  async function buscarCEP(digits: string) {
    if (digits.length !== 8) { setCepOk(false); setCidade(''); setUf(''); return }
    setCepLoading(true)
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) { setCepOk(false); setCidade(''); setUf('') }
      else { setCidade(data.localidade); setUf(data.uf); setCepOk(true) }
    } catch { setCepOk(false) }
    finally { setCepLoading(false) }
  }

  function handleCEP(v: string) {
    const fmt = formatCEP(v)
    setCep(fmt)
    const digits = v.replace(/\D/g, '')
    if (digits.length === 8) buscarCEP(digits)
    else { setCepOk(false); setCidade(''); setUf('') }
  }

  function validar(): string[] {
    const e: string[] = []
    if (nome.trim().split(' ').length < 2)           e.push('Informe nome e sobrenome.')
    if (!email.includes('@'))                         e.push('E-mail inválido.')
    if (senha.length < 8)                             e.push('Senha deve ter ao menos 8 caracteres.')
    if (senha !== conf)                               e.push('As senhas não coincidem.')
    if (telefone.replace(/\D/g, '').length < 10)     e.push('Informe um WhatsApp/telefone válido.')
    if (!cepOk)                                       e.push('CEP inválido ou não encontrado.')
    if (!aceitouTermos)                               e.push('Aceite os Termos de Uso para continuar.')
    if (!aceitouPrivacidade)                          e.push('Aceite a Política de Privacidade para continuar.')
    return e
  }

  async function handleSubmit() {
    const e = validar()
    if (e.length) { setErros(e); return }
    setErros([])
    setLoading(true)
    const { error } = await signUp(email, senha)
    if (error) {
      setErros([error.message === 'User already registered'
        ? 'Este e-mail já está cadastrado. Tente entrar.'
        : error.message])
      setLoading(false)
      return
    }
    await dbSaveProfile({
      nome:               nome.trim(),
      telefone:           telefone.replace(/\D/g, ''),
      cep:                cep.replace(/\D/g, ''),
      cidade,
      uf,
      maior18:            true,
      aceitouTermos,
      aceitouPrivacidade,
    })
    router.push('/album')
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
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-base font-black">C</span>
            </div>
            <span className="font-black text-white text-xl tracking-tight">
              completan<span className="text-green-400">do</span>
            </span>
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
            <span className="text-xs text-slate-400">ou e-mail</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {erros.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3">
              {erros.map(e => <p key={e} className="text-xs text-red-600">• {e}</p>)}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome completo</label>
              <input type="text" placeholder="João da Silva" value={nome}
                onChange={e => setNome(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">E-mail</label>
              <input type="email" placeholder="seu@email.com" value={email}
                onChange={e => setEmail(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Senha</label>
              <div className="relative">
                <input type={showSenha ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                  value={senha} onChange={e => setSenha(e.target.value)}
                  className={inp + ' pr-10'} />
                <button type="button" onClick={() => setShowSenha(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  {showSenha ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Confirmar senha</label>
              <input type={showSenha ? 'text' : 'password'} placeholder="Repita a senha"
                value={conf} onChange={e => setConf(e.target.value)} className={inp} />
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Contato e localização</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">WhatsApp / Telefone</label>
              <input type="tel" inputMode="numeric" placeholder="(11) 99999-9999"
                value={telefone} onChange={e => setTelefone(formatTelefone(e.target.value))}
                className={inp} maxLength={16} />
              <p className="text-[10px] text-slate-400 mt-1">
                📱 Revelado apenas quando ambos aceitarem a troca ou venda.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                CEP <span className="text-slate-400 font-normal text-[10px]">(para encontrar matches próximos)</span>
              </label>
              <div className="relative">
                <input type="text" inputMode="numeric" placeholder="00000-000"
                  value={cep} onChange={e => handleCEP(e.target.value)}
                  className={inp} maxLength={9} />
                {cepLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              {cepOk && cidade && (
                <p className="text-[11px] text-green-600 font-semibold mt-1">📍 {cidade} — {uf}</p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2">
              <label className="flex items-start gap-3 rounded-xl px-3 py-3 cursor-pointer border transition-colors bg-slate-50 border-slate-200 hover:bg-slate-100">
                <input type="checkbox" checked={aceitouTermos} onChange={e => setAceitouTermos(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-green-500 flex-shrink-0" />
                <span className="text-xs text-slate-600 leading-relaxed">
                  Li e aceito os{' '}
                  <Link href="/termos" target="_blank" className="text-green-600 font-semibold underline underline-offset-2">Termos de Uso</Link>
                  {' '}do Completando. <span className="text-red-400">*</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl px-3 py-3 cursor-pointer border transition-colors bg-slate-50 border-slate-200 hover:bg-slate-100">
                <input type="checkbox" checked={aceitouPrivacidade} onChange={e => setAceitouPrivacidade(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-green-500 flex-shrink-0" />
                <span className="text-xs text-slate-600 leading-relaxed">
                  Li e aceito a{' '}
                  <Link href="/privacidade" target="_blank" className="text-green-600 font-semibold underline underline-offset-2">Política de Privacidade</Link>
                  . <span className="text-red-400">*</span>
                </span>
              </label>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Criando conta...</>
              ) : 'Criar conta →'}
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
