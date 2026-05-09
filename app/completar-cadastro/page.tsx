'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSession, dbGetProfile, dbSaveProfile } from '@/lib/db'

// ─── Utilitários ──────────────────────────────────────────────────────────────

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function formatCEP(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(d[i]) * (10 - i)
  let r = (soma * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(d[9])) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(d[i]) * (11 - i)
  r = (soma * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(d[10])
}

// Data máxima aceita para o input (hoje)
const hoje = new Date().toISOString().split('T')[0]

// ─── Checkbox customizado ─────────────────────────────────────────────────────

function Checkbox({
  checked, onChange, children, highlight,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: React.ReactNode
  highlight?: boolean
}) {
  return (
    <label className={[
      'flex items-start gap-3 rounded-xl px-3 py-3 cursor-pointer transition-colors border',
      checked
        ? highlight
          ? 'bg-amber-50 border-amber-200'
          : 'bg-green-50 border-green-200'
        : 'bg-slate-50 border-slate-200 hover:bg-slate-100',
    ].join(' ')}>
      <div className={[
        'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
        checked
          ? highlight
            ? 'bg-amber-400 border-amber-400'
            : 'bg-green-500 border-green-500'
          : 'border-slate-300 bg-white',
      ].join(' ')}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className="text-xs text-slate-600 leading-relaxed">{children}</span>
    </label>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

function formatTelefone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

interface FormData {
  nome:           string
  cpf:            string
  dataNascimento: string
  telefone:       string
  cep:            string
  uf:             string
  logradouro:     string
  numero:         string
  complemento:    string
  cidade:         string
}

export default function CompletarCadastroPage() {
  const router = useRouter()
  const [loading, setLoading]     = useState(false)
  const [erros, setErros]         = useState<string[]>([])
  const [concluido, setConcluido] = useState(false)
  const [nomeUsuario, setNomeUsuario] = useState('')

  const [form, setForm] = useState<FormData>({
    nome: '', cpf: '', dataNascimento: '', telefone: '', cep: '', uf: '',
    logradouro: '', numero: '', complemento: '', cidade: '',
  })

  const [maior18,            setMaior18]            = useState(false)
  const [aceitouTermos,      setAceitouTermos]      = useState(false)
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false)

  // Guard + pré-carrega perfil
  useEffect(() => {
    getSession().then(session => {
      if (!session) { router.replace('/entrar'); return }
      dbGetProfile().then(p => {
        // Se perfil já completo, redireciona para conta
        if (p.aceitouTermos && p.aceitouPrivacidade && p.cpf && p.cep) {
          router.replace('/conta')
          return
        }
        setForm(prev => ({
          nome:           p.nome           ?? prev.nome,
          cpf:            p.cpf            ?? prev.cpf,
          dataNascimento: p.dataNascimento ?? prev.dataNascimento,
          telefone:       p.telefone       ?? prev.telefone,
          cep:            p.cep            ?? prev.cep,
          uf:             p.uf             ?? prev.uf,
          logradouro:     p.logradouro     ?? prev.logradouro,
          numero:         p.numero         ?? prev.numero,
          complemento:    p.complemento    ?? prev.complemento,
          cidade:         p.cidade         ?? prev.cidade,
        }))
        if (p.maior18)            setMaior18(true)
        if (p.aceitouTermos)      setAceitouTermos(true)
        if (p.aceitouPrivacidade) setAceitouPrivacidade(true)
      })
    })
  }, [router])

  function set(field: keyof FormData, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  function validar(): string[] {
    const e: string[] = []
    if (form.nome.trim().split(' ').length < 2)      e.push('Informe nome e sobrenome.')
    if (!validarCPF(form.cpf))                       e.push('CPF inválido.')
    if (!form.dataNascimento)                        e.push('Informe sua data de nascimento.')
    if (form.cep.replace(/\D/g, '').length < 8)     e.push('CEP inválido.')
    if (!form.logradouro.trim())                     e.push('Informe o logradouro.')
    if (!form.numero.trim())                         e.push('Informe o número.')
    if (!form.cidade.trim())                         e.push('Informe a cidade.')
    if (!form.uf.trim())                             e.push('Informe o estado (UF).')
    if (form.telefone.replace(/\D/g, '').length < 10) e.push('Informe um WhatsApp/telefone válido.')
    if (!aceitouTermos)                              e.push('Aceite os Termos de Uso para continuar.')
    if (!aceitouPrivacidade)                         e.push('Aceite a Política de Privacidade para continuar.')
    return e
  }

  async function handleSubmit() {
    const e = validar()
    if (e.length) { setErros(e); return }
    setErros([])
    setLoading(true)
    await dbSaveProfile({
      ...form,
      nome:               form.nome.trim(),
      telefone:           form.telefone.replace(/\D/g, ''),
      maior18,
      aceitouTermos,
      aceitouPrivacidade,
    })

    setNomeUsuario(form.nome.trim().split(' ')[0])
    setConcluido(true)
  }

  const inp = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fadein">

        {/* Logo */}
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

        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-xs font-black text-white">✓</div>
            <span className="text-xs text-green-400 font-semibold hidden sm:block">Conta</span>
          </div>
          <div className="w-8 h-px bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs font-black text-slate-800">2</div>
            <span className="text-xs text-white font-semibold hidden sm:block">Seus dados</span>
          </div>
          <div className="w-8 h-px bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-black text-slate-400">3</div>
            <span className="text-xs text-slate-500 hidden sm:block">Pronto!</span>
          </div>
        </div>

        {/* Card — Pronto! */}
        {concluido && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 text-center animate-fadein">
            {/* Progress concluído */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {['Conta', 'Seus dados', 'Pronto!'].map((label, i, arr) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-xs font-black text-white">✓</div>
                  <span className="text-xs text-green-700 font-semibold hidden sm:block">{label}</span>
                  {i < arr.length - 1 && <div className="w-6 h-px bg-green-200" />}
                </div>
              ))}
            </div>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="font-black text-slate-800 text-xl mb-2">Cadastro completo!</h2>
            <p className="text-slate-500 text-sm mb-6">
              Bem-vindo ao Completando{nomeUsuario ? `, ${nomeUsuario}` : ''}!<br />
              Agora marque suas figurinhas e comece a trocar.
            </p>
            {!maior18 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-left">
                <p className="text-xs text-amber-700 font-semibold mb-0.5">⚠️ Acesso parcial ativo</p>
                <p className="text-xs text-amber-600">Você pode usar o álbum, mas trocas, vendas e compras estão bloqueadas. Para liberar, confirme sua maioridade na conta.</p>
              </div>
            )}
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

        {/* Card — Formulário */}
        {!concluido && (
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h2 className="font-black text-slate-800 text-lg mb-0.5">Complete seu cadastro</h2>
          <p className="text-xs text-slate-400 mb-5">
            Precisamos de mais alguns dados para ativar sua conta.
          </p>

          {/* Erros */}
          {erros.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              {erros.map(e => <p key={e} className="text-xs text-red-600">• {e}</p>)}
            </div>
          )}

          <div className="space-y-3">

            {/* Nome completo */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome completo</label>
              <input
                type="text"
                placeholder="João da Silva"
                value={form.nome}
                onChange={e => set('nome', e.target.value)}
                className={inp}
              />
            </div>

            {/* CPF + Data de nascimento */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  CPF <span className="text-slate-400 font-normal text-[10px]">(privado)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={e => set('cpf', formatCPF(e.target.value))}
                  className={inp}
                  maxLength={14}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nascimento</label>
                <input
                  type="date"
                  max={hoje}
                  value={form.dataNascimento}
                  onChange={e => set('dataNascimento', e.target.value)}
                  className={inp + ' text-slate-700'}
                />
              </div>
            </div>

            {/* Telefone / WhatsApp */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                WhatsApp / Telefone <span className="text-slate-400 font-normal text-[10px]">(compartilhado só em trocas aceitas)</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="(11) 99999-9999"
                value={form.telefone}
                onChange={e => set('telefone', formatTelefone(e.target.value))}
                className={inp}
                maxLength={16}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                📱 Seu número só é revelado à outra parte quando ambos aceitarem a troca/venda.
              </p>
            </div>

            {/* Endereço */}
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Cidade (para encontrar matches próximos)</p>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">CEP</label>
                  <input
                    type="text" inputMode="numeric" placeholder="00000-000"
                    value={form.cep}
                    onChange={e => set('cep', formatCEP(e.target.value))}
                    className={inp} maxLength={9}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">UF</label>
                  <input
                    type="text" placeholder="SP" maxLength={2}
                    value={form.uf}
                    onChange={e => set('uf', e.target.value.toUpperCase())}
                    className={inp}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Logradouro</label>
                <input
                  type="text" placeholder="Rua, Av, Estrada..."
                  value={form.logradouro}
                  onChange={e => set('logradouro', e.target.value)}
                  className={inp}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Número</label>
                  <input
                    type="text" placeholder="123"
                    value={form.numero}
                    onChange={e => set('numero', e.target.value)}
                    className={inp}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Complemento <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text" placeholder="Apto, Bloco..."
                    value={form.complemento}
                    onChange={e => set('complemento', e.target.value)}
                    className={inp}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Cidade</label>
                <input
                  type="text" placeholder="São Paulo"
                  value={form.cidade}
                  onChange={e => set('cidade', e.target.value)}
                  className={inp}
                />
              </div>
            </div>

            {/* ── Checkboxes ── */}
            <div className="border-t border-slate-100 pt-3 space-y-2">

              {/* Termos obrigatórios */}
              <Checkbox checked={aceitouTermos} onChange={setAceitouTermos}>
                Li e aceito os{' '}
                <Link href="/termos" target="_blank" className="text-green-600 font-semibold underline underline-offset-2">
                  Termos de Uso
                </Link>
                {' '}do Completando. <span className="text-red-400 font-semibold">*</span>
              </Checkbox>

              <Checkbox checked={aceitouPrivacidade} onChange={setAceitouPrivacidade}>
                Li e aceito a{' '}
                <Link href="/privacidade" target="_blank" className="text-green-600 font-semibold underline underline-offset-2">
                  Política de Privacidade
                </Link>
                , incluindo o uso dos meus dados para verificação e frete. <span className="text-red-400 font-semibold">*</span>
              </Checkbox>

              {/* Maioridade — opcional, mas restringe acesso */}
              <Checkbox checked={maior18} onChange={setMaior18} highlight>
                <span className="font-semibold text-slate-700">Confirmo que tenho 18 anos ou mais.</span>
                {!maior18 && (
                  <span className="block text-[10px] text-amber-600 mt-0.5">
                    ⚠️ Sem essa confirmação você poderá usar apenas o álbum — trocas, vendas e compras ficarão indisponíveis.
                  </span>
                )}
                {maior18 && (
                  <span className="block text-[10px] text-green-600 mt-0.5">
                    ✓ Acesso completo liberado — trocas, vendas e compras disponíveis.
                  </span>
                )}
              </Checkbox>

              <p className="text-[10px] text-slate-400 pl-1">
                <span className="text-red-400">*</span> obrigatório para concluir o cadastro
              </p>
            </div>

            {/* Botão */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : 'Finalizar cadastro →'}
            </button>
          </div>
        </div>

        )} {/* fim !concluido card formulário */}

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
