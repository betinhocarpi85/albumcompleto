'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ALBUMS_REGISTRY, type AlbumId } from '@/data/albums-registry'

const USER = {
  name: 'Carlos Mendes',
  email: 'carlos@email.com',
  city: 'São Paulo, SP',
  avatar: 'CM',
  since: 'Abril 2026',
  rating: 4.8,
  ratings: 127,
  trades: 89,
  sales: 34,
  donations: 12,
  completion: 73,
  badges: [
    { icon: '🥇', label: 'Vendedor Verificado', desc: 'Completou 10+ vendas com avaliação 5★', earned: true },
    { icon: '💜', label: 'Doador Ouro',          desc: 'Realizou 10+ doações',                 earned: true },
    { icon: '⭐', label: 'Top Trocador',          desc: 'Completou 50+ trocas',                 earned: true },
    { icon: '🏆', label: 'Álbum Completo',        desc: 'Completou 100% do álbum',              earned: false },
    { icon: '🔥', label: '100 Trocas',            desc: 'Realize 100 trocas para desbloquear',  earned: false },
    { icon: '💎', label: 'Doador Diamante',       desc: 'Realize 25 doações para desbloquear',  earned: false },
  ],
  history: [
    { type: 'troca',  fig: 'BRA-14 · Vinicius Jr.',  with: 'Ana Lima',   date: '02/05/2026', status: 'concluída' },
    { type: 'venda',  fig: 'ARG-17 · Messi',         with: 'Pedro S.',   date: '01/05/2026', status: 'concluída' },
    { type: 'doacao', fig: 'ESP-15 · Yamal',          with: 'Julia F.',   date: '30/04/2026', status: 'concluída' },
    { type: 'troca',  fig: 'FRA-20 · Mbappé',        with: 'Marcos T.',  date: '29/04/2026', status: 'concluída' },
    { type: 'venda',  fig: 'ENG-18 · Kane',           with: 'Fernanda R.',date: '28/04/2026', status: 'concluída' },
  ],
}

type Section = 'visao-geral' | 'albuns' | 'gamificacao' | 'dados' | 'endereco' | 'historico' | 'seguranca'

const MENU: { key: Section; icon: string; label: string }[] = [
  { key: 'visao-geral', icon: '📊', label: 'Visão Geral' },
  { key: 'albuns',      icon: '📚', label: 'Meus Álbuns' },
  { key: 'gamificacao', icon: '🏆', label: 'Gamificação' },
  { key: 'dados',       icon: '👤', label: 'Meus Dados' },
  { key: 'endereco',    icon: '📍', label: 'Endereço' },
  { key: 'historico',   icon: '📦', label: 'Histórico' },
  { key: 'seguranca',   icon: '🔒', label: 'Segurança' },
]

// Mock: progresso por álbum
const ALBUM_PROGRESS: Record<AlbumId, number> = {
  'copa-2026':               73,
  'brasileirao-masc-2025':   41,
  'brasileirao-fem-2025':    18,
}

const TYPE_CONFIG = {
  troca:  { label: 'Troca',  bg: 'bg-blue-100',   text: 'text-blue-700'   },
  venda:  { label: 'Venda',  bg: 'bg-green-100',  text: 'text-green-700'  },
  doacao: { label: 'Doação', bg: 'bg-purple-100', text: 'text-purple-700' },
}

export default function ContaPage() {
  const [section, setSection] = useState<Section>('visao-geral')
  const [editDados, setEditDados] = useState(false)
  const [editEndereco, setEditEndereco] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeAlbums, setActiveAlbums] = useState<Set<AlbumId>>(new Set(['copa-2026']))
  const [activeAlbumView, setActiveAlbumView] = useState<AlbumId>('copa-2026')

  function toggleAlbum(id: AlbumId) {
    setActiveAlbums(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size === 1) return prev // mínimo 1 álbum
        next.delete(id)
        if (activeAlbumView === id) {
          const remaining = [...next][0]
          setActiveAlbumView(remaining)
        }
      } else {
        next.add(id)
        setActiveAlbumView(id)
      }
      return next
    })
  }

  const activeAlbumsList = ALBUMS_REGISTRY.filter(a => activeAlbums.has(a.id))
  const currentAlbumMeta = ALBUMS_REGISTRY.find(a => a.id === activeAlbumView)!

  return (
    <div className="max-w-5xl mx-auto px-3 py-4 animate-fadein">
      <h1 className="text-xl font-black text-slate-800 mb-4">Minha Conta</h1>

      <div className="flex flex-col md:flex-row gap-4">

        {/* ── SIDEBAR ── */}
        <aside className="md:w-56 flex-shrink-0">
          {/* Mini perfil */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black">{USER.avatar}</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-800 truncate">{USER.name}</p>
              <p className="text-xs text-slate-400">⭐ {USER.rating} · {USER.trades} trocas</p>
              <Link href="/perfil/carlos" className="text-xs text-green-600 font-medium hover:underline">
                Ver perfil público →
              </Link>
            </div>
          </div>

          {/* Menu */}
          <nav className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {MENU.map((item, i) => (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className={[
                  'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left',
                  i < MENU.length - 1 ? 'border-b border-slate-50' : '',
                  section === item.key
                    ? 'bg-green-50 text-green-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 border-t border-slate-100 transition-colors">
              <span>🚪</span> Sair da conta
            </button>
          </nav>
        </aside>

        {/* ── CONTEÚDO ── */}
        <div className="flex-1 min-w-0">

          {/* VISÃO GERAL */}
          {section === 'visao-geral' && (
            <div className="space-y-4 animate-fadein">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Trocas',   value: USER.trades,    color: 'text-blue-600',   bg: 'bg-blue-50',   icon: '🔁' },
                  { label: 'Vendas',   value: USER.sales,     color: 'text-green-600',  bg: 'bg-green-50',  icon: '🟢' },
                  { label: 'Doações',  value: USER.donations, color: 'text-purple-600', bg: 'bg-purple-50', icon: '💜' },
                  { label: 'Avaliações',value: USER.ratings,  color: 'text-amber-600',  bg: 'bg-amber-50',  icon: '⭐' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Progresso dos álbuns */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-slate-800">Meus Álbuns</p>
                  <button onClick={() => setSection('albuns')} className="text-xs text-green-600 font-medium hover:underline">
                    Gerenciar →
                  </button>
                </div>

                {activeAlbumsList.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhum álbum selecionado.</p>
                )}

                <div className="space-y-4">
                  {activeAlbumsList.map(album => {
                    const pct = ALBUM_PROGRESS[album.id] ?? 0
                    const coladas = Math.round(album.totalStickers * pct / 100)
                    return (
                      <div key={album.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{album.emoji}</span>
                            <div>
                              <p className="text-sm font-bold text-slate-800 leading-tight">{album.name}</p>
                              <p className="text-[10px] text-slate-400">{album.subtitle}</p>
                            </div>
                          </div>
                          <span className="text-lg font-black text-green-600">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full bg-gradient-to-r ${album.gradientFrom} ${album.gradientTo} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>{coladas} coladas</span>
                          <span>{album.totalStickers - coladas} faltando</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Link href="/album" className="mt-4 block text-center bg-green-500 hover:bg-green-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors">
                  Ir para meu álbum →
                </Link>
              </div>

              {/* Badges conquistados */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-slate-800">Badges</p>
                  <button onClick={() => setSection('gamificacao')} className="text-xs text-green-600 font-medium hover:underline">Ver todos →</button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {USER.badges.filter(b => b.earned).map(b => (
                    <div key={b.label} title={b.desc} className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-sm font-medium text-slate-700">
                      <span>{b.icon}</span> {b.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Última transação */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-slate-800">Últimas transações</p>
                  <button onClick={() => setSection('historico')} className="text-xs text-green-600 font-medium hover:underline">Ver todas →</button>
                </div>
                <div className="space-y-2">
                  {USER.history.slice(0, 3).map((h, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_CONFIG[h.type as keyof typeof TYPE_CONFIG].bg} ${TYPE_CONFIG[h.type as keyof typeof TYPE_CONFIG].text}`}>
                        {TYPE_CONFIG[h.type as keyof typeof TYPE_CONFIG].label}
                      </span>
                      <span className="text-slate-700 truncate flex-1">{h.fig}</span>
                      <span className="text-slate-400 text-xs flex-shrink-0">{h.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MEUS ÁLBUNS */}
          {section === 'albuns' && (
            <div className="animate-fadein space-y-4">

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="font-bold text-slate-800 mb-1">Escolha seus álbuns</p>
                <p className="text-xs text-slate-400 mb-4">
                  Selecione os álbuns que você está colecionando. Cada álbum terá seu próprio progresso, anúncios e matches.
                </p>

                <div className="space-y-3">
                  {ALBUMS_REGISTRY.map(album => {
                    const isActive = activeAlbums.has(album.id)
                    const pct      = ALBUM_PROGRESS[album.id] ?? 0
                    const coladas  = Math.round(album.totalStickers * pct / 100)

                    return (
                      <div
                        key={album.id}
                        className={[
                          'rounded-2xl border-2 transition-all overflow-hidden',
                          isActive ? 'border-green-400 shadow-sm' : 'border-slate-100',
                        ].join(' ')}
                      >
                        {/* Header do card */}
                        <div className={`bg-gradient-to-r ${album.gradientFrom} ${album.gradientTo} p-4 flex items-center gap-3`}>
                          <span className="text-3xl">{album.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-white text-sm leading-tight">{album.name}</p>
                            <p className="text-white/70 text-[11px]">{album.description}</p>
                          </div>
                          <button
                            onClick={() => toggleAlbum(album.id)}
                            className={[
                              'flex-shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition-all',
                              isActive
                                ? 'bg-white text-slate-700 hover:bg-slate-100'
                                : 'bg-white/20 text-white hover:bg-white/30 border border-white/40',
                            ].join(' ')}
                          >
                            {isActive ? '✓ Colecionando' : '+ Adicionar'}
                          </button>
                        </div>

                        {/* Progresso (só se ativo) */}
                        {isActive && (
                          <div className="px-4 py-3 bg-slate-50">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-slate-500 font-medium">Progresso</span>
                              <span className="text-xs font-black text-green-600">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1">
                              <div
                                className={`h-2 rounded-full bg-gradient-to-r ${album.gradientFrom} ${album.gradientTo} transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>{coladas} de {album.totalStickers} figurinhas</span>
                              <span>{album.totalStickers - coladas} faltando</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Álbuns ativos resumo */}
              {activeAlbums.size > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <p className="text-sm font-bold text-green-800 mb-1">
                    ✓ {activeAlbums.size} álbum{activeAlbums.size > 1 ? 'ns' : ''} ativo{activeAlbums.size > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-green-700">
                    Seus anúncios, matches e histórico são separados por álbum. Acesse o menu Álbum para gerenciar cada um.
                  </p>
                  <Link href="/album" className="mt-3 block text-center bg-green-500 hover:bg-green-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors">
                    Ir para meus álbuns →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* GAMIFICAÇÃO */}
          {section === 'gamificacao' && (
            <div className="animate-fadein space-y-4">
              {/* Ranking */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
                <p className="text-slate-400 text-sm mb-1">Seu ranking este mês</p>
                <div className="text-5xl font-black text-green-400">#247</div>
                <p className="text-slate-400 text-sm mt-1">entre {(12847).toLocaleString('pt-BR')} colecionadores</p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Trocas',  value: USER.trades    },
                    { label: 'Vendas',  value: USER.sales     },
                    { label: 'Doações', value: USER.donations },
                  ].map(s => (
                    <div key={s.label} className="bg-white/10 rounded-xl py-2">
                      <div className="text-xl font-black">{s.value}</div>
                      <div className="text-xs text-slate-400">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="font-bold text-slate-800 mb-4">Badges — {USER.badges.filter(b => b.earned).length}/{USER.badges.length} conquistados</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {USER.badges.map(b => (
                    <div key={b.label} className={[
                      'flex items-center gap-3 p-3 rounded-xl border transition-all',
                      b.earned ? 'border-slate-200 bg-slate-50' : 'border-dashed border-slate-200 opacity-50',
                    ].join(' ')}>
                      <span className="text-2xl">{b.icon}</span>
                      <div>
                        <p className={`text-sm font-bold ${b.earned ? 'text-slate-800' : 'text-slate-400'}`}>{b.label}</p>
                        <p className="text-xs text-slate-400">{b.desc}</p>
                      </div>
                      {b.earned && <span className="ml-auto text-green-500 text-lg">✓</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Próximas conquistas */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="font-bold text-slate-800 mb-3">Próximas conquistas</p>
                <div className="space-y-3">
                  {[
                    { label: '100 Trocas',       icon: '🔥', current: USER.trades,    total: 100 },
                    { label: 'Doador Diamante',  icon: '💎', current: USER.donations, total: 25  },
                    { label: 'Álbum Completo',   icon: '🏆', current: USER.completion,total: 100, suffix: '%' },
                  ].map(c => (
                    <div key={c.label}>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span className="font-medium">{c.icon} {c.label}</span>
                        <span>{c.current}{c.suffix ?? ''} / {c.total}{c.suffix ?? ''}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600" style={{ width: `${Math.min(100, (c.current / c.total) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MEUS DADOS */}
          {section === 'dados' && (
            <div className="animate-fadein">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-5">
                  <p className="font-bold text-slate-800">Dados pessoais</p>
                  <button onClick={() => setEditDados(!editDados)} className="text-sm text-green-600 font-semibold hover:text-green-700">
                    {editDados ? 'Cancelar' : '✏️ Editar'}
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Nome completo', value: USER.name,  type: 'text'  },
                    { label: 'E-mail',        value: USER.email, type: 'email' },
                    { label: 'CPF',           value: '•••.•••.•••-••', type: 'text' },
                    { label: 'Telefone',      value: '(11) 99999-9999', type: 'tel' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">{f.label}</label>
                      {editDados
                        ? <input type={f.type} defaultValue={f.value} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                        : <p className="text-sm text-slate-700 bg-slate-50 px-4 py-2.5 rounded-xl">{f.value}</p>
                      }
                    </div>
                  ))}

                  {editDados && (
                    <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition-colors mt-2">
                      Salvar alterações
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ENDEREÇO */}
          {section === 'endereco' && (
            <div className="animate-fadein">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="font-bold text-slate-800">Endereço de entrega</p>
                    <p className="text-xs text-slate-400 mt-0.5">Usado para envio de figurinhas. Nunca exibido publicamente.</p>
                  </div>
                  <button onClick={() => setEditEndereco(!editEndereco)} className="text-sm text-green-600 font-semibold hover:text-green-700 flex-shrink-0">
                    {editEndereco ? 'Cancelar' : '✏️ Editar'}
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-500 block mb-1">CEP</label>
                      {editEndereco
                        ? <input type="text" defaultValue="01310-100" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                        : <p className="text-sm text-slate-700 bg-slate-50 px-3 py-2.5 rounded-xl">01310-100</p>
                      }
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">UF</label>
                      {editEndereco
                        ? <input type="text" defaultValue="SP" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                        : <p className="text-sm text-slate-700 bg-slate-50 px-3 py-2.5 rounded-xl">SP</p>
                      }
                    </div>
                  </div>
                  {[
                    { label: 'Logradouro',  value: 'Av. Paulista',      col: 'col-span-3' },
                    { label: 'Número',      value: '1000',               col: 'col-span-1' },
                    { label: 'Complemento',value: 'Apto 42',            col: 'col-span-2' },
                    { label: 'Bairro',      value: 'Bela Vista',         col: 'col-span-3' },
                    { label: 'Cidade',      value: 'São Paulo',          col: 'col-span-3' },
                  ].map(f => (
                    <div key={f.label} className={f.col}>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">{f.label}</label>
                      {editEndereco
                        ? <input type="text" defaultValue={f.value} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                        : <p className="text-sm text-slate-700 bg-slate-50 px-3 py-2.5 rounded-xl">{f.value}</p>
                      }
                    </div>
                  ))}

                  {editEndereco && (
                    <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition-colors mt-1">
                      Salvar endereço
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* HISTÓRICO */}
          {section === 'historico' && (
            <div className="animate-fadein">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="font-bold text-slate-800 mb-4">Histórico de transações</p>
                <div className="space-y-3">
                  {USER.history.map((h, i) => {
                    const cfg = TYPE_CONFIG[h.type as keyof typeof TYPE_CONFIG]
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{h.fig}</p>
                          <p className="text-xs text-slate-400">com {h.with}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-slate-400">{h.date}</p>
                          <span className="text-xs text-green-600 font-medium">✓ {h.status}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SEGURANÇA */}
          {section === 'seguranca' && (
            <div className="animate-fadein space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="font-bold text-slate-800 mb-4">Segurança</p>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-left">
                    <span className="text-xl">🔑</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Alterar senha</p>
                      <p className="text-xs text-slate-400">Última alteração há 30 dias</p>
                    </div>
                    <span className="ml-auto text-slate-300">›</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-left">
                    <span className="text-xl">🔔</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Notificações</p>
                      <p className="text-xs text-slate-400">E-mail e push ativados</p>
                    </div>
                    <span className="ml-auto text-slate-300">›</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-left">
                    <span className="text-xl">📱</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Dispositivos conectados</p>
                      <p className="text-xs text-slate-400">1 dispositivo ativo</p>
                    </div>
                    <span className="ml-auto text-slate-300">›</span>
                  </button>
                </div>
              </div>

              {/* Zona de perigo */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <p className="font-bold text-red-700 mb-1">Zona de perigo</p>
                <p className="text-xs text-red-500 mb-4">Ações irreversíveis. Prossiga com cuidado.</p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-white border-2 border-red-300 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  🗑️ Excluir minha conta
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal excluir conta */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-fadein">
            <div className="text-4xl text-center mb-3">⚠️</div>
            <h3 className="font-black text-slate-800 text-center text-lg mb-2">Excluir conta?</h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              Esta ação é <strong>irreversível</strong>. Todos os seus anúncios, histórico e dados serão apagados permanentemente.
            </p>
            <div className="space-y-2">
              <button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                Sim, excluir minha conta
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
