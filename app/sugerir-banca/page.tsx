'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface BancaForm {
  nome:     string
  maps_url: string
  telefone: string
  horario:  string
}

const EMPTY: BancaForm = { nome: '', maps_url: '', horario: '', telefone: '' }

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white'

export default function SugerirBancaPage() {
  const router = useRouter()
  const [form,    setForm]    = useState<BancaForm>(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [erro,    setErro]    = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [logado,  setLogado]  = useState<boolean | null>(null)

  useEffect(() => {
    import('@/lib/db').then(({ getSession }) =>
      getSession().then(s => setLogado(!!s)).catch(() => setLogado(false))
    )
  }, [])

  const set = (k: keyof BancaForm, v: string) => setForm(f => ({ ...f, [k]: v }))

  const enviar = async () => {
    setErro(''); setSaving(true)
    try {
      const res = await fetch('/api/minha-banca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome:     form.nome.trim(),
          maps_url: form.maps_url.trim(),
          telefone: form.telefone.trim() || undefined,
          horario:  form.horario.trim()  || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? 'Erro ao enviar sugestão.'); return }
      setSucesso(true)
    } catch { setErro('Erro de conexão.') } finally { setSaving(false) }
  }

  /* Loading auth */
  if (logado === null) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center text-slate-400">Carregando...</div>
  )

  /* Não logado */
  if (!logado) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-4">🔒</p>
      <p className="font-bold text-slate-700 mb-2">Faça login para sugerir uma banca</p>
      <p className="text-sm text-slate-500 mb-6">Você precisa estar logado para enviar sugestões.</p>
      <Link href="/entrar" className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
        Entrar
      </Link>
    </div>
  )

  /* Sucesso */
  if (sucesso) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-4">✅</p>
      <p className="font-black text-slate-800 text-xl mb-2">Sugestão enviada!</p>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        Nossa equipe vai analisar e, se aprovada, a banca aparecerá no mapa em até 24h.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => { setForm(EMPTY); setSucesso(false) }}
          className="border border-slate-200 text-slate-600 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors"
        >
          Sugerir outra
        </button>
        <Link href="/bancas" className="bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
          Ver bancas
        </Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-8">

      <div className="mb-6">
        <Link href="/bancas" className="text-slate-400 hover:text-slate-600 text-sm">← Bancas</Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">Sugerir banca de jornal</h1>
        <p className="text-sm text-slate-500 mt-1">
          Conhece uma banca de jornal que vende figurinhas? Indique aqui — nossa equipe analisa e coloca no mapa.
        </p>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3 mb-4">{erro}</div>
      )}

      <div className="space-y-5">

        {/* Dados */}
        <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
          <h2 className="font-black text-slate-800 text-sm uppercase tracking-wide">📰 Dados da banca</h2>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Nome da banca *</label>
            <input
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Banca do João"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Link do Google Maps *</label>
            <input
              value={form.maps_url}
              onChange={e => set('maps_url', e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              type="url"
              className={inputCls}
            />
            <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-700 font-semibold mb-1">Como pegar o link:</p>
              <ol className="text-xs text-blue-600 space-y-0.5 list-decimal list-inside">
                <li>Abra o Google Maps e encontre a banca de jornal</li>
                <li>Toque no nome do local → <strong>Compartilhar</strong></li>
                <li>Copie o link e cole aqui</li>
              </ol>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Telefone / WhatsApp <span className="font-normal text-slate-400">(opcional)</span></label>
            <input
              value={form.telefone}
              onChange={e => set('telefone', e.target.value)}
              placeholder="(21) 99999-0000"
              inputMode="tel"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Horário de funcionamento <span className="font-normal text-slate-400">(opcional)</span></label>
            <input
              value={form.horario}
              onChange={e => set('horario', e.target.value)}
              placeholder="Ex: Seg–Sex 8h–18h · Sáb 8h–12h"
              className={inputCls}
            />
          </div>
        </section>

        {/* Aviso */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Ao enviar, você confirma que é uma banca de jornal real. Nossa equipe revisa antes de publicar no mapa.
            Sugestões incorretas ou duplicadas serão recusadas.
          </p>
        </div>

        <button
          onClick={enviar}
          disabled={saving || !form.nome.trim() || !form.maps_url.trim()}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl text-sm transition-colors"
        >
          {saving ? '⏳ Enviando...' : '📰 Enviar sugestão'}
        </button>

      </div>
    </div>
  )
}
