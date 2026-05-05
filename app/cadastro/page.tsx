'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { setLoggedIn } from '@/lib/store'

const STEPS = ['Conta', 'Endereço', 'Pronto!']

interface FormConta {
  nome:  string
  email: string
  senha: string
  conf:  string
}

interface FormEndereco {
  cep:         string
  uf:          string
  logradouro:  string
  numero:      string
  complemento: string
  cidade:      string
}

export default function CadastroPage() {
  const router  = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [conta, setConta] = useState<FormConta>({ nome: '', email: '', senha: '', conf: '' })
  const [end, setEnd]     = useState<FormEndereco>({ cep: '', uf: '', logradouro: '', numero: '', complemento: '', cidade: '' })
  const [erros, setErros] = useState<string[]>([])
  const [showSenha, setShowSenha] = useState(false)

  function validarConta(): string[] {
    const e: string[] = []
    if (conta.nome.trim().split(' ').length < 2)     e.push('Informe nome e sobrenome.')
    if (!conta.email.includes('@'))                   e.push('E-mail inválido.')
    if (conta.senha.length < 8)                      e.push('Senha deve ter ao menos 8 caracteres.')
    if (conta.senha !== conta.conf)                  e.push('As senhas não coincidem.')
    return e
  }

  function validarEndereco(): string[] {
    const e: string[] = []
    if (end.cep.replace(/\D/g,'').length < 8)  e.push('CEP inválido.')
    if (!end.logradouro.trim())                e.push('Informe o logradouro.')
    if (!end.numero.trim())                    e.push('Informe o número.')
    if (!end.cidade.trim())                    e.push('Informe a cidade.')
    return e
  }

  async function irParaEndereco() {
    const e = validarConta()
    if (e.length) { setErros(e); return }
    setErros([])
    setStep(1)
  }

  async function finalizar() {
    const e = validarEndereco()
    if (e.length) { setErros(e); return }
    setErros([])
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoggedIn(true)
    setLoading(false)
    setStep(2)
  }

  function handleGoogle() {
    setLoggedIn(true)
    router.push('/album')
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fadein">

        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-base font-black">AC</span>
            </div>
            <span className="font-black text-white text-xl tracking-tight">
              álbum<span className="text-green-400">completo</span>
            </span>
          </Link>
          <p className="text-slate-400 text-sm">Crie sua conta grátis</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all',
                i < step   ? 'bg-green-500 text-white' :
                i === step  ? 'bg-white text-slate-800' :
                              'bg-white/20 text-slate-400',
              ].join(' ')}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-white' : 'text-slate-500'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-white/20" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">

          {/* Erros */}
          {erros.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              {erros.map(e => <p key={e} className="text-xs text-red-600">• {e}</p>)}
            </div>
          )}

          {/* ── STEP 0: Conta ── */}
          {step === 0 && (
            <div className="animate-fadein">
              <h2 className="font-black text-slate-800 text-lg mb-4">Criar conta</h2>

              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-xl transition-all text-sm mb-4"
              >
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

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome completo</label>
                  <input type="text" placeholder="João da Silva" value={conta.nome}
                    onChange={e => setConta(p => ({ ...p, nome: e.target.value }))}
                    className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">E-mail</label>
                  <input type="email" placeholder="seu@email.com" value={conta.email}
                    onChange={e => setConta(p => ({ ...p, email: e.target.value }))}
                    className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Senha</label>
                  <div className="relative">
                    <input type={showSenha ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                      value={conta.senha} onChange={e => setConta(p => ({ ...p, senha: e.target.value }))}
                      className={inputClass + ' pr-10'} />
                    <button type="button" onClick={() => setShowSenha(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      {showSenha ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Confirmar senha</label>
                  <input type={showSenha ? 'text' : 'password'} placeholder="Repita a senha"
                    value={conta.conf} onChange={e => setConta(p => ({ ...p, conf: e.target.value }))}
                    className={inputClass} />
                </div>
                <button onClick={irParaEndereco}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl text-sm transition-colors">
                  Continuar →
                </button>
              </div>

              <p className="text-center text-xs text-slate-400 mt-4">
                Já tem conta?{' '}
                <Link href="/entrar" className="text-green-600 font-semibold">Entrar</Link>
              </p>
            </div>
          )}

          {/* ── STEP 1: Endereço ── */}
          {step === 1 && (
            <div className="animate-fadein">
              <h2 className="font-black text-slate-800 text-lg mb-1">Seu endereço</h2>
              <p className="text-xs text-slate-400 mb-4">Usado para envio de figurinhas. Nunca público.</p>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">CEP</label>
                    <input type="text" placeholder="00000-000" value={end.cep}
                      onChange={e => setEnd(p => ({ ...p, cep: e.target.value }))}
                      className={inputClass} maxLength={9} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">UF</label>
                    <input type="text" placeholder="SP" maxLength={2} value={end.uf}
                      onChange={e => setEnd(p => ({ ...p, uf: e.target.value.toUpperCase() }))}
                      className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Logradouro</label>
                  <input type="text" placeholder="Rua, Av, Estrada..." value={end.logradouro}
                    onChange={e => setEnd(p => ({ ...p, logradouro: e.target.value }))}
                    className={inputClass} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Número</label>
                    <input type="text" placeholder="123" value={end.numero}
                      onChange={e => setEnd(p => ({ ...p, numero: e.target.value }))}
                      className={inputClass} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Complemento</label>
                    <input type="text" placeholder="Apto, Bloco..." value={end.complemento}
                      onChange={e => setEnd(p => ({ ...p, complemento: e.target.value }))}
                      className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Cidade</label>
                  <input type="text" placeholder="São Paulo" value={end.cidade}
                    onChange={e => setEnd(p => ({ ...p, cidade: e.target.value }))}
                    className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Ponto de referência <span className="text-slate-400 font-normal">(opcional)</span></label>
                  <input type="text" placeholder="Ex: Próximo ao mercado, portão azul..."
                    className={inputClass} />
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setErros([]); setStep(0) }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-3 rounded-xl text-sm transition-colors">
                    ← Voltar
                  </button>
                  <button onClick={finalizar} disabled={loading}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Criando...</>
                      : 'Finalizar →'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Pronto! ── */}
          {step === 2 && (
            <div className="animate-fadein text-center py-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="font-black text-slate-800 text-xl mb-2">Conta criada!</h2>
              <p className="text-slate-500 text-sm mb-6">
                Bem-vindo ao álbum completo, {conta.nome.split(' ')[0]}! Agora marque suas figurinhas e comece a trocar.
              </p>
              <div className="space-y-2">
                <Link href="/album"
                  className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl text-sm transition-colors">
                  📋 Montar meu álbum agora
                </Link>
                <Link href="/matches"
                  className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-colors">
                  🔁 Ver matches disponíveis
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
