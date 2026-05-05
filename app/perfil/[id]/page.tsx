'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'

const ACAO_CONFIG = {
  venda:  { label: 'Venda',  bg: 'bg-green-100',  text: 'text-green-700'  },
  troca:  { label: 'Troca',  bg: 'bg-blue-100',   text: 'text-blue-700'   },
  doacao: { label: 'Doação', bg: 'bg-purple-100', text: 'text-purple-700' },
}

const TIPO_CONFIG = {
  brilhante: { icon: '✨', bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-700'  },
  escudo:    { icon: '🛡',  bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' },
  normal:    { icon: '⬜',  bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-600'  },
  especial:  { icon: '⭐',  bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
}

const USUARIOS: Record<string, {
  name: string; city: string; avatar: string; avatarColor: string
  rating: number; ratings: number; trades: number; sales: number; donations: number
  since: string; completion: number; gender: 'M' | 'F'
  badges: { icon: string; label: string }[]
  anuncios: { num: number; nome: string; tipo: keyof typeof TIPO_CONFIG; acao: keyof typeof ACAO_CONFIG; preco?: string; qtd: number }[]
}> = {
  '1': {
    name: 'Ana Lima', city: 'Rio de Janeiro, RJ', avatar: 'AL',
    avatarColor: 'from-pink-400 to-purple-500', rating: 4.9, ratings: 98,
    trades: 142, sales: 38, donations: 12, since: 'Jan 2026',
    gender: 'F', completion: 61,
    badges: [
      { icon: '🔁', label: 'Trocadora Ativa' },
      { icon: '⭐', label: 'Avaliação 5★' },
      { icon: '🤝', label: 'Confiável' },
    ],
    anuncios: [
      { num: 28,  nome: 'Vinicius Jr.',  tipo: 'brilhante', acao: 'troca',  qtd: 1 },
      { num: 42,  nome: 'Rodrygo',       tipo: 'normal',    acao: 'troca',  qtd: 2 },
      { num: 53,  nome: 'Messi',         tipo: 'brilhante', acao: 'venda',  preco: 'R$ 18,00', qtd: 1 },
      { num: 76,  nome: 'Brasil Escudo', tipo: 'escudo',    acao: 'troca',  qtd: 1 },
      { num: 101, nome: 'Endrick',       tipo: 'normal',    acao: 'doacao', qtd: 3 },
    ],
  },
  '2': {
    name: 'Pedro S.', city: 'Curitiba, PR', avatar: 'PS',
    avatarColor: 'from-orange-400 to-red-500', rating: 4.6, ratings: 41,
    trades: 57, sales: 14, donations: 3, since: 'Fev 2026',
    gender: 'M', completion: 44,
    badges: [
      { icon: '🔁', label: 'Trocador' },
      { icon: '📦', label: '50+ trocas' },
    ],
    anuncios: [
      { num: 19,  nome: 'Mbappé',        tipo: 'brilhante', acao: 'venda', preco: 'R$ 15,00', qtd: 1 },
      { num: 65,  nome: 'Haaland',       tipo: 'normal',    acao: 'troca', qtd: 3 },
      { num: 22,  nome: 'Bellingham',    tipo: 'normal',    acao: 'troca', qtd: 1 },
    ],
  },
  '3': {
    name: 'Julia F.', city: 'Belo Horizonte, MG', avatar: 'JF',
    avatarColor: 'from-teal-400 to-green-500', rating: 5.0, ratings: 203,
    trades: 203, sales: 61, donations: 47, since: 'Dez 2025',
    gender: 'F', completion: 89,
    badges: [
      { icon: '🏆', label: 'Top Colecionadora' },
      { icon: '💜', label: 'Doadora Ouro' },
      { icon: '⭐', label: 'Avaliação 5★' },
      { icon: '🤝', label: 'Confiável' },
    ],
    anuncios: [
      { num: 40,  nome: 'Neymar',        tipo: 'brilhante', acao: 'venda',  preco: 'R$ 20,00', qtd: 1 },
      { num: 76,  nome: 'França Escudo', tipo: 'escudo',    acao: 'troca',  qtd: 1 },
      { num: 78,  nome: 'Bellingham',    tipo: 'normal',    acao: 'doacao', qtd: 2 },
    ],
  },
  '4': {
    name: 'Carlos M.', city: 'São Paulo, SP', avatar: 'CM',
    avatarColor: 'from-green-400 to-blue-500', rating: 4.8, ratings: 67,
    trades: 89, sales: 22, donations: 5, since: 'Jan 2026',
    gender: 'M', completion: 52,
    badges: [
      { icon: '💰', label: 'Vendedor Ativo' },
      { icon: '📦', label: '80+ trocas' },
    ],
    anuncios: [
      { num: 88,  nome: 'Pedri',          tipo: 'normal',  acao: 'venda', preco: 'R$ 3,00', qtd: 2 },
      { num: 67,  nome: 'Espanha Escudo', tipo: 'escudo',  acao: 'venda', preco: 'R$ 7,00', qtd: 1 },
    ],
  },
}

export default function PerfilPublicoPage() {
  const { id } = useParams<{ id: string }>()
  const u = USUARIOS[id]

  if (!u) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fadein">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-lg font-bold text-slate-700 mb-1">Usuário não encontrado</p>
        <p className="text-sm text-slate-400 mb-6">Este perfil não existe ou foi removido.</p>
        <Link href="/matches" className="inline-block bg-green-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-green-700 transition-colors">
          ← Voltar para Matches
        </Link>
      </div>
    )
  }

  const totalAnuncios = u.anuncios.length
  const vendas  = u.anuncios.filter(a => a.acao === 'venda')
  const trocas  = u.anuncios.filter(a => a.acao === 'troca')
  const doacoes = u.anuncios.filter(a => a.acao === 'doacao')

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 animate-fadein">

      {/* Voltar */}
      <Link href="/matches" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">
        ‹ Voltar para Matches
      </Link>

      {/* ── CARD PERFIL ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${u.avatarColor} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-xl font-black">{u.avatar}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-slate-800">{u.name}</h1>
            <p className="text-sm text-slate-500">{u.city} · desde {u.since}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-amber-500">⭐ {u.rating}</span>
              <span className="text-slate-300 text-xs">·</span>
              <span className="text-xs text-slate-400">{u.ratings} avaliações</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-50">
          {[
            { label: 'Trocas',  value: u.trades,    color: 'text-blue-600'   },
            { label: 'Vendas',  value: u.sales,     color: 'text-green-600'  },
            { label: 'Doações', value: u.donations, color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 rounded-xl py-3 text-center">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progresso do álbum */}
        <div className="mt-4 pt-4 border-t border-slate-50">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Progresso do álbum</span>
            <span className="font-bold text-green-600">{u.completion}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all" style={{ width: `${u.completion}%` }} />
          </div>
        </div>

        {/* Badges */}
        {u.badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50">
            {u.badges.map(b => (
              <span key={b.label} className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── ANÚNCIOS ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-800">Anúncios ativos</p>
            <p className="text-xs text-slate-400">{totalAnuncios} figurinha{totalAnuncios !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-1.5">
            {vendas.length  > 0 && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{vendas.length} venda</span>}
            {trocas.length  > 0 && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{trocas.length} troca</span>}
            {doacoes.length > 0 && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{doacoes.length} doação</span>}
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {u.anuncios.map(a => {
            const tipo = TIPO_CONFIG[a.tipo]
            const acao = ACAO_CONFIG[a.acao]
            return (
              <div key={a.num} className="flex items-center gap-3 px-4 py-3">
                {/* Mini quadradinho */}
                <div className={`w-10 h-10 rounded-xl border-2 flex flex-col items-center justify-center flex-shrink-0 ${tipo.bg} ${tipo.border}`}>
                  <span className="text-[10px] font-black leading-none">{a.num}</span>
                  <span className="text-[8px] leading-none mt-0.5">{tipo.icon}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{a.nome}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${acao.bg} ${acao.text}`}>{acao.label}</span>
                    {a.preco && <span className="text-[10px] font-bold text-slate-600">{a.preco}</span>}
                    <span className="text-[10px] text-slate-400">{a.qtd}× disponível</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── CTA — sem chat, tudo pelo sistema ── */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
        <p className="text-xs text-slate-500 mb-3">
          Todas as trocas e compras são feitas pela plataforma com pagamento protegido.
        </p>
        <Link
          href="/matches"
          className="inline-block w-full bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-xl text-sm transition-colors"
        >
          🔁 Ver meu match com {u.name.split(' ')[0]}
        </Link>
      </div>

    </div>
  )
}
