'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const BancasMap = dynamic(() => import('@/components/BancasMap'), {
  ssr: false,
  loading: () => <div className="w-full h-48 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400 text-sm">Carregando mapa...</div>,
})

interface BancaForm {
  nome: string
  responsavel: string
  telefone: string
  email: string
  cep: string
  logradouro: string
  numero: string
  bairro: string
  cidade: string
  uf: string
  horario: string
  descricao: string
  servicos: string[]
}

interface Banca {
  id: string; slug: string; nome: string; responsavel?: string | null
  telefone?: string | null; email?: string | null; endereco: string
  bairro?: string | null; cidade: string; uf: string; cep?: string | null
  horario?: string | null; descricao?: string | null; servicos?: string[] | null
  ativa: boolean; destaque: boolean; total_trocas: number
  lat?: number | null; lng?: number | null
}

const SERVICOS_OPCOES = [
  { id: 'troca',  label: '🔁 Troca de figurinhas' },
  { id: 'venda',  label: '💰 Venda avulsa' },
  { id: 'compra', label: '🛒 Compra de repetidas' },
  { id: 'album',  label: '📖 Venda de álbuns' },
  { id: 'pacote', label: '📦 Venda de pacotinhos' },
]

const EMPTY: BancaForm = {
  nome: '', responsavel: '', telefone: '', email: '',
  cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '',
  horario: '', descricao: '', servicos: [],
}

export default function MinhaBancaPage() {
  const [banca,      setBanca]      = useState<Banca | null>(null)
  const [form,       setForm]       = useState<BancaForm>(EMPTY)
  const [loading,    setLoading]    = useState(true)
  const [cepLoading, setCepLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [erro,       setErro]       = useState('')
  const [sucesso,    setSucesso]    = useState('')
  const [coords,     setCoords]     = useState<{ lat: number; lng: number } | null>(null)
  const [editando,   setEditando]   = useState(false)

  // Carrega banca existente
  useEffect(() => {
    fetch('/api/minha-banca')
      .then(r => r.json())
      .then(d => {
        if (d.banca) {
          const b = d.banca as Banca
          setBanca(b)
          // Pre-popula form a partir dos dados existentes
          const [logr, ...resto] = (b.endereco ?? '').split(', ')
          setForm({
            nome:        b.nome        ?? '',
            responsavel: b.responsavel ?? '',
            telefone:    b.telefone    ?? '',
            email:       b.email       ?? '',
            cep:         b.cep         ?? '',
            logradouro:  logr          ?? '',
            numero:      resto.join(', ') ?? '',
            bairro:      b.bairro      ?? '',
            cidade:      b.cidade      ?? '',
            uf:          b.uf          ?? '',
            horario:     b.horario     ?? '',
            descricao:   b.descricao   ?? '',
            servicos:    b.servicos    ?? [],
          })
          if (b.lat && b.lng) setCoords({ lat: b.lat, lng: b.lng })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // CEP → ViaCEP
  const buscarCep = useCallback(async (cep: string) => {
    const raw = cep.replace(/\D/g, '')
    if (raw.length !== 8) return
    setCepLoading(true)
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm(f => ({
          ...f,
          logradouro: data.logradouro ?? f.logradouro,
          bairro:     data.bairro     ?? '',
          cidade:     data.localidade ?? '',
          uf:         data.uf         ?? '',
        }))
        // Foca no campo número automaticamente
        document.getElementById('numero')?.focus()
      }
    } catch { /* ignora */ } finally {
      setCepLoading(false)
    }
  }, [])

  // Endereço completo → Nominatim preview
  const previewMapa = useCallback(async () => {
    if (!form.logradouro || !form.cidade || !form.uf) return
    setGeoLoading(true)
    setCoords(null)
    try {
      const end = form.numero ? `${form.logradouro}, ${form.numero}` : form.logradouro
      const q   = encodeURIComponent(`${end}, ${form.cidade}, ${form.uf}, Brasil`)
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`).then(r => r.json())
      if (geo?.[0]) setCoords({ lat: parseFloat(geo[0].lat), lng: parseFloat(geo[0].lon) })
      else setErro('Endereço não encontrado. Verifique e tente novamente.')
    } catch { setErro('Erro ao buscar coordenadas.') } finally {
      setGeoLoading(false)
    }
  }, [form.logradouro, form.numero, form.cidade, form.uf])

  const toggleServico = (id: string) => {
    setForm(f => ({
      ...f,
      servicos: f.servicos.includes(id) ? f.servicos.filter(s => s !== id) : [...f.servicos, id],
    }))
  }

  const handleCep = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8)
    const fmt = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw
    setForm(f => ({ ...f, cep: fmt }))
    if (raw.length === 8) buscarCep(raw)
  }

  const salvar = async () => {
    setErro(''); setSucesso(''); setSaving(true)
    try {
      const method  = banca ? 'PATCH' : 'POST'
      const payload = {
        nome:        form.nome,
        responsavel: form.responsavel || undefined,
        telefone:    form.telefone    || undefined,
        email:       form.email       || undefined,
        cep:         form.cep         || undefined,
        endereco:    form.logradouro,
        numero:      form.numero      || undefined,
        bairro:      form.bairro      || undefined,
        cidade:      form.cidade,
        uf:          form.uf,
        horario:     form.horario     || undefined,
        descricao:   form.descricao   || undefined,
        servicos:    form.servicos,
      }
      const res = await fetch('/api/minha-banca', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? 'Erro ao salvar.'); return }

      setSucesso(banca
        ? 'Dados atualizados! Aguarde revisão das alterações.'
        : 'Banca cadastrada! Em até 24h nossa equipe ativa no mapa.')
      if (!banca && data.banca) setBanca(data.banca)
      setEditando(false)
    } catch { setErro('Erro de conexão.') } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center text-slate-400">Carregando...</div>
  )

  const modoLeitura = banca && !editando

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24 md:pb-8">

      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/bancas" className="text-slate-400 hover:text-slate-600 text-sm">← Bancas</Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Minha Banca</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {banca ? 'Gerencie o perfil da sua banca' : 'Cadastre sua banca de figurinhas gratuitamente'}
          </p>
        </div>
        {banca && !editando && (
          <Link href={`/bancas/${banca.slug}`} target="_blank"
            className="text-xs text-blue-500 hover:text-blue-700 font-medium shrink-0 mt-1">
            Ver perfil público →
          </Link>
        )}
      </div>

      {/* Status da banca */}
      {banca && (
        <div className={`rounded-2xl p-4 mb-5 flex items-center gap-3 ${
          banca.ativa ? 'bg-green-50 border border-green-100' : 'bg-yellow-50 border border-yellow-100'
        }`}>
          <span className="text-2xl">{banca.ativa ? '✅' : '⏳'}</span>
          <div>
            <p className="font-bold text-sm text-slate-800">
              {banca.ativa ? 'Banca ativa no mapa!' : 'Aguardando aprovação'}
            </p>
            <p className="text-xs text-slate-500">
              {banca.ativa
                ? `${banca.total_trocas} troca${banca.total_trocas !== 1 ? 's' : ''} realizadas · ${banca.destaque ? '⭐ Destaque' : 'Parceiro'}`
                : 'Em até 24h nossa equipe revisa e ativa sua banca no mapa.'}
            </p>
          </div>
        </div>
      )}

      {/* Erros / Sucesso */}
      {erro    && <div className="bg-red-50   border border-red-100   text-red-700   text-sm rounded-xl p-3 mb-4">{erro}</div>}
      {sucesso && <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl p-3 mb-4">✅ {sucesso}</div>}

      {/* Modo leitura */}
      {modoLeitura ? (
        <div className="space-y-4">
          <InfoCard label="Nome da banca" value={banca.nome} />
          <InfoCard label="Responsável"   value={banca.responsavel} />
          <InfoCard label="Telefone / WhatsApp" value={banca.telefone} />
          <InfoCard label="E-mail"        value={banca.email} />
          <InfoCard label="Endereço"      value={`${banca.endereco}${banca.bairro ? `, ${banca.bairro}` : ''} — ${banca.cidade}/${banca.uf}${banca.cep ? ` · ${banca.cep}` : ''}`} />
          <InfoCard label="Horário"       value={banca.horario} />
          <InfoCard label="Descrição"     value={banca.descricao} />
          {banca.servicos && banca.servicos.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">Serviços oferecidos</p>
              <div className="flex flex-wrap gap-2">
                {banca.servicos.map(s => {
                  const op = SERVICOS_OPCOES.find(o => o.id === s)
                  return op ? <span key={s} className="text-xs bg-green-50 text-green-700 font-medium px-3 py-1 rounded-full border border-green-100">{op.label}</span> : null
                })}
              </div>
            </div>
          )}
          {coords && (
            <div className="rounded-2xl overflow-hidden border border-slate-200" style={{ height: 200 }}>
              <BancasMap bancas={[{ ...banca, lat: coords.lat, lng: coords.lng }]} centro={[coords.lat, coords.lng]} zoom={16} />
            </div>
          )}
          <button onClick={() => setEditando(true)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors">
            ✏️ Editar dados da banca
          </button>
        </div>
      ) : (
        /* Formulário */
        <div className="space-y-5">

          {/* Dados básicos */}
          <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
            <h2 className="font-black text-slate-800 text-sm uppercase tracking-wide">📋 Dados da banca</h2>

            <Field label="Nome da banca *" required>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Banca do João" className={inputCls} />
            </Field>

            <Field label="Responsável">
              <input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}
                placeholder="Seu nome" className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefone / WhatsApp">
                <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                  placeholder="(21) 99999-0000" inputMode="tel" className={inputCls} />
              </Field>
              <Field label="E-mail">
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="contato@email.com" type="email" className={inputCls} />
              </Field>
            </div>
          </section>

          {/* Endereço */}
          <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
            <h2 className="font-black text-slate-800 text-sm uppercase tracking-wide">📍 Endereço</h2>

            {/* CEP */}
            <Field label="CEP *" required>
              <div className="relative">
                <input
                  value={form.cep}
                  onChange={e => handleCep(e.target.value)}
                  placeholder="00000-000"
                  inputMode="numeric"
                  maxLength={9}
                  className={inputCls}
                />
                {cepLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Preencha o CEP — endereço e cidade serão preenchidos automaticamente.</p>
            </Field>

            {/* Rua (preenchida pelo CEP) */}
            <Field label="Logradouro *" required>
              <input value={form.logradouro} onChange={e => setForm(f => ({ ...f, logradouro: e.target.value }))}
                placeholder="Rua, Avenida, Praça..." className={inputCls} />
            </Field>

            {/* Número */}
            <Field label="Número *" required>
              <input id="numero" value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
                placeholder="Ex: 123 ou S/N" className={inputCls} />
            </Field>

            {/* Bairro / Cidade / UF — vêm do CEP */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field label="Bairro">
                  <input value={form.bairro} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))}
                    placeholder="Bairro" className={inputCls} />
                </Field>
              </div>
              <Field label="UF">
                <input value={form.uf} onChange={e => setForm(f => ({ ...f, uf: e.target.value.toUpperCase().slice(0, 2) }))}
                  placeholder="SP" maxLength={2} className={inputCls} />
              </Field>
            </div>

            <Field label="Cidade *" required>
              <input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}
                placeholder="São Paulo" className={inputCls} />
            </Field>

            {/* Preview no mapa */}
            <button
              type="button"
              onClick={previewMapa}
              disabled={!form.logradouro || !form.cidade || geoLoading}
              className="w-full border-2 border-dashed border-green-300 text-green-700 font-semibold py-3 rounded-xl text-sm hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {geoLoading ? '🔍 Buscando localização...' : '🗺️ Visualizar pino no mapa'}
            </button>

            {coords && (
              <div>
                <p className="text-xs text-green-700 font-semibold mb-2">✅ Localização encontrada!</p>
                <div className="rounded-xl overflow-hidden border border-green-200" style={{ height: 200 }}>
                  <BancasMap
                    bancas={[{ id: 'preview', slug: '', nome: form.nome || 'Minha banca', responsavel: null, telefone: null, endereco: form.logradouro, bairro: form.bairro || null, cidade: form.cidade, uf: form.uf, cep: form.cep || null, horario: null, descricao: null, foto_url: null, destaque: false, total_trocas: 0, lat: coords.lat, lng: coords.lng }]}
                    centro={[coords.lat, coords.lng]}
                    zoom={16}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 text-center">O pino aparecerá assim no mapa público após aprovação.</p>
              </div>
            )}
          </section>

          {/* Funcionamento */}
          <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
            <h2 className="font-black text-slate-800 text-sm uppercase tracking-wide">🕐 Funcionamento</h2>

            <Field label="Horário de atendimento">
              <input value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))}
                placeholder="Ex: Seg–Sex 8h–18h · Sáb 8h–12h" className={inputCls} />
            </Field>

            <Field label="Descrição da banca">
              <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Conte um pouco sobre sua banca: o que vende, há quanto tempo está no mercado, se tem catálogo, etc."
                rows={3} className={`${inputCls} resize-none`} />
            </Field>
          </section>

          {/* Serviços */}
          <section className="bg-white border border-slate-100 rounded-2xl p-5">
            <h2 className="font-black text-slate-800 text-sm uppercase tracking-wide mb-3">💼 Serviços oferecidos</h2>
            <p className="text-xs text-slate-400 mb-4">Selecione tudo que sua banca oferece</p>
            <div className="space-y-2">
              {SERVICOS_OPCOES.map(s => (
                <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  form.servicos.includes(s.id)
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={form.servicos.includes(s.id)}
                    onChange={() => toggleServico(s.id)}
                    className="accent-green-500 w-4 h-4"
                  />
                  <span className="text-sm text-slate-700 font-medium">{s.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Info legal */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>Informações sobre cadastro:</strong> Ao cadastrar sua banca, você confirma que tem autorização para divulgar o local e os dados de contato.
              Sua banca será revisada pela nossa equipe em até 24h antes de aparecer no mapa.
              Você pode editar ou remover seus dados a qualquer momento.
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            {editando && (
              <button onClick={() => { setEditando(false); setErro('') }}
                className="flex-1 border border-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
            )}
            <button onClick={salvar} disabled={saving || !form.nome || !form.logradouro || !form.cidade}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl text-sm transition-colors">
              {saving ? 'Salvando...' : banca ? 'Salvar alterações' : 'Cadastrar minha banca'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 block mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4">
      <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  )
}

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white'
