'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const BancasMap = dynamic(() => import('@/components/BancasMap'), { ssr: false, loading: () => (
  <div className="w-full h-80 bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-sm">
    Carregando mapa...
  </div>
) })

interface Banca {
  id: string; slug: string; nome: string; responsavel?: string | null
  telefone?: string | null; endereco: string; bairro?: string | null
  cidade: string; uf: string; cep?: string | null; horario?: string | null
  descricao?: string | null; foto_url?: string | null
  destaque: boolean; total_trocas: number; lat?: number | null; lng?: number | null
}

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function BancasPage() {
  const [bancas,     setBancas]     = useState<Banca[]>([])
  const [loading,    setLoading]    = useState(true)
  const [view,       setView]       = useState<'mapa' | 'lista'>('mapa')
  const [filtroUF,   setFiltroUF]   = useState('')
  const [busca,      setBusca]      = useState('')
  const [focusBanca, setFocusBanca] = useState<{ lat: number; lng: number; slug: string } | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/bancas')
      .then(r => r.json())
      .then(d => { setBancas(d.bancas ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtradas = useMemo(() => bancas.filter(b => {
    if (filtroUF && b.uf !== filtroUF) return false
    if (busca) {
      const q = busca.toLowerCase()
      return b.nome.toLowerCase().includes(q) || b.cidade.toLowerCase().includes(q) || (b.bairro ?? '').toLowerCase().includes(q)
    }
    return true
  }), [bancas, filtroUF, busca])

  const destaques = filtradas.filter(b => b.destaque)
  const demais    = filtradas.filter(b => !b.destaque)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-8">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🗺️</span>
          <h1 className="text-2xl font-bold text-slate-800">Pontos de Troca</h1>
        </div>
        <p className="text-sm text-slate-500">
          Bancas parceiras onde você pode comprar, vender e trocar figurinhas com segurança.
        </p>
      </div>

      {/* Banner parceria */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-4 mb-6 text-white flex items-center gap-3">
        <span className="text-3xl">🏆</span>
        <div>
          <p className="font-bold text-sm">Pontos Oficiais Completando</p>
          <p className="text-xs text-green-100">Locais verificados e seguros para realizar suas trocas presencialmente</p>
        </div>
      </div>

      {/* Filtros + toggle view */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou cidade..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <select value={filtroUF} onChange={e => setFiltroUF(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
          <option value="">Todos os estados</option>
          {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
        </select>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button onClick={() => setView('mapa')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'mapa' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>
            🗺️ Mapa
          </button>
          <button onClick={() => setView('lista')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'lista' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>
            📋 Lista
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Carregando bancas...</div>
      ) : bancas.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-slate-500 font-medium">Nenhuma banca cadastrada ainda</p>
          <p className="text-slate-400 text-sm mt-1">Em breve teremos parceiros na sua cidade!</p>
        </div>
      ) : (
        <>
          {/* Mapa */}
          {view === 'mapa' && (
            <div ref={mapContainerRef} className="rounded-2xl overflow-hidden border border-slate-200 mb-6 h-52 md:h-[420px]">
              <BancasMap bancas={filtradas} zoom={filtradas.length === 1 ? 14 : 5} focusBanca={focusBanca} />
            </div>
          )}

          {/* Destaques */}
          {destaques.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">⭐ Em destaque</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {destaques.map(b => (
                  <BancaCard key={b.id} banca={b} destaque onVerNoMapa={b.lat && b.lng ? () => {
                    setView('mapa')
                    setFocusBanca({ lat: b.lat!, lng: b.lng!, slug: b.slug })
                    setTimeout(() => mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
                  } : undefined} />
                ))}
              </div>
            </div>
          )}

          {/* Lista */}
          <div>
            {destaques.length > 0 && demais.length > 0 && (
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">Todas as bancas</h2>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              {demais.map(b => (
                <BancaCard key={b.id} banca={b} onVerNoMapa={b.lat && b.lng ? () => {
                  setView('mapa')
                  setFocusBanca({ lat: b.lat!, lng: b.lng!, slug: b.slug })
                  setTimeout(() => mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
                } : undefined} />
              ))}
            </div>
          </div>

          {filtradas.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
              Nenhuma banca encontrada para essa busca.
            </div>
          )}
        </>
      )}

      {/* CTA cadastrar banca */}
      <div className="mt-10 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 text-center">
        <p className="text-2xl mb-2">🏪</p>
        <p className="font-bold text-slate-700 mb-1">Tem uma banca de figurinhas?</p>
        <p className="text-sm text-slate-500 mb-4">
          Cadastre-se gratuitamente, apareça no mapa e receba colecionadores da sua região!
        </p>
        <Link
          href="/minha-banca"
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg shadow-green-500/20"
        >
          📍 Cadastrar minha banca grátis
        </Link>
      </div>
    </div>
  )
}

function BancaCard({ banca: b, destaque, onVerNoMapa }: { banca: Banca; destaque?: boolean; onVerNoMapa?: () => void }) {
  return (
    <div className={`rounded-2xl border p-4 transition-all hover:shadow-md ${destaque ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          {destaque && (
            <span className="inline-block bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
              ⭐ DESTAQUE
            </span>
          )}
          <p className="font-bold text-slate-800 text-sm leading-tight truncate">{b.nome}</p>
        </div>
        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg shrink-0">{b.uf}</span>
      </div>

      {/* Endereço e horário */}
      <p className="text-xs text-slate-500 mb-0.5">📍 {b.endereco}{b.bairro ? `, ${b.bairro}` : ''}</p>
      <p className="text-xs text-slate-500 mb-2">{b.cidade}</p>
      {b.horario && <p className="text-xs text-slate-400 mb-2">🕐 {b.horario}</p>}

      {/* Trocas */}
      {b.total_trocas > 0 ? (
        <p className="text-xs text-green-600 font-medium mb-3">🔁 {b.total_trocas} trocas realizadas</p>
      ) : (
        <p className="text-xs text-slate-300 mb-3">Novo parceiro</p>
      )}

      {/* Botões */}
      <div className="flex gap-2">
        <Link href={`/bancas/${b.slug}`}
          className="flex-1 text-center text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl transition-colors">
          Ver perfil
        </Link>
        {onVerNoMapa ? (
          <button onClick={onVerNoMapa}
            className="flex-1 text-xs font-bold bg-slate-100 hover:bg-green-100 hover:text-green-700 text-slate-600 py-2 rounded-xl transition-colors">
            📍 Ver no mapa
          </button>
        ) : (
          <span className="flex-1 text-center text-xs text-slate-300 py-2 rounded-xl bg-slate-50">
            Sem localização
          </span>
        )}
      </div>
    </div>
  )
}
