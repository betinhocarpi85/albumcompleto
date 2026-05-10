'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSession, dbGetProfile, dbSaveProfile } from '@/lib/db'

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

export default function CompletarCadastroPage() {
  const router = useRouter()
  const [nome,      setNome]      = useState('')
  const [telefone,  setTelefone]  = useState('')
  const [cep,       setCep]       = useState('')
  const [cidade,    setCidade]    = useState('')
  const [uf,        setUf]        = useState('')
  const [cepOk,     setCepOk]     = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [aceitouTermos,      setAceitouTermos]      = useState(false)
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [erros,     setErros]     = useState<string[]>([])
  const [concluido, setConcluido] = useState(false)
  const [primeiroNome, setPrimeiroNome] = useState('')

  useEffect(() => {
    getSession().then(session => {
      if (!session) { router.replace('/entrar'); return }
      dbGetProfile().then(p => {
        if (p.telefone && p.cep && p.aceitouTermos && p.aceitouPrivacidade) {
          router.replace('/album'); return
        }
        if (p.nome) {
          setNome(p.nome)
          setPrimeiroNome(p.nome.trim().split(' ')[0])
        }
        if (p.telefone) setTelefone(formatTelefone(p.telefone))
        if (p.cep) { setCep(formatCEP(p.cep)); buscarCEP(p.cep.replace(/\D/g, '')) }
        if (p.aceitouTermos)      setAceitouTermos(true)
        if (p.aceitouPrivacidade) setAceitouPrivacidade(true)
      })
    })
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

  async function handleSubmit() {
    const e: string[] = []
    if (nome.trim().split(' ').filter(Boolean).length < 2) e.push('Informe nome e sobrenome.')
    if (telefone.replace(/\D/g, '').length < 10)           e.push('Informe um WhatsApp/telefone válido.')
    if (!cepOk)                                             e.push('CEP inválido ou não encontrado.')
    if (!aceitouTermos)                                     e.push('Aceite os Termos de Uso para continuar.')
    if (!aceitouPrivacidade)                                e.push('Aceite a Política de Privacidade para continuar.')
    if (e.length) { setErros(e); return }
    setErros([])
    setLoading(true)
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
    setConcluido(true)
    setLoading(false)
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
        </div>

        {/* Tela de sucesso */}
        {concluido && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 text-center animate-fadein">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="font-black text-slate-800 text-xl mb-2">
              Tudo pronto{primeiroNome ? `, ${primeiroNome}` : ''}!
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Seu cadastro está completo. Agora marque suas figurinhas e comece a trocar e vender.
            </p>
            <Link href="/album"
              className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl text-sm transition-colors">
              📋 Montar meu álbum agora
            </Link>
          </div>
        )}

        {/* Formulário */}
        {!concluido && (
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="font-black text-slate-800 text-lg mb-0.5">Quase lá!</h2>
            <p className="text-xs text-slate-400 mb-5">
              Só precisamos de mais alguns dados para ativar sua conta.
            </p>

            {erros.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                {erros.map(e => <p key={e} className="text-xs text-red-600">• {e}</p>)}
              </div>
            )}

            <div className="space-y-4">

              {/* Nome */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome completo</label>
                <input
                  type="text"
                  placeholder="João da Silva"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className={inp}
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  WhatsApp / Telefone
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={e => setTelefone(formatTelefone(e.target.value))}
                  className={inp}
                  maxLength={16}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  📱 Revelado à outra parte apenas quando ambos aceitarem a troca ou venda.
                </p>
              </div>

              {/* CEP */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  CEP <span className="text-slate-400 font-normal text-[10px]">(para encontrar matches próximos)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="00000-000"
                    value={cep}
                    onChange={e => handleCEP(e.target.value)}
                    className={inp}
                    maxLength={9}
                  />
                  {cepLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                {cepOk && cidade && (
                  <p className="text-[11px] text-green-600 font-semibold mt-1">
                    📍 {cidade} — {uf}
                  </p>
                )}
              </div>

              {/* Termos */}
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

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Salvando...</>
                ) : 'Finalizar cadastro →'}
              </button>
            </div>
          </div>
        )}

        {!concluido && (
          <p className="text-center text-xs text-slate-500 mt-4">
            Prefere fazer depois?{' '}
            <Link href="/album" className="text-slate-300 underline">Entrar sem completar</Link>
          </p>
        )}
      </div>
    </div>
  )
}
