'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ALBUMS_REGISTRY, type AlbumId } from '@/data/albums-registry'
import {
  type UserProfile,
} from '@/lib/store'
import { signOut, getSession, dbGetProfile, dbSaveProfile, dbGetColadas, dbGetActiveAlbums, dbSaveActiveAlbums, getUserId, dbUpdatePassword, dbDeleteAccount, dbGetPropostasRecebidas, dbGetTradeCount, dbGetPlano, dbGetHistorico, type HistoricoItem } from '@/lib/db'
import UpgradeModal from '@/components/UpgradeModal'


type Section = 'visao-geral' | 'albuns' | 'propostas' | 'gamificacao' | 'dados' | 'historico' | 'seguranca'

const MENU_ITEMS: { key: Section; icon: string; label: string; badge?: number }[] = [
  { key: 'visao-geral', icon: '📊', label: 'Visão Geral' },
  { key: 'albuns',      icon: '📚', label: 'Meus Álbuns' },
  { key: 'propostas',   icon: '🔁', label: 'Propostas' },
  { key: 'gamificacao', icon: '🏆', label: 'Gameficação' },
  { key: 'historico',   icon: '📦', label: 'Histórico' },
  { key: 'dados',       icon: '👤', label: 'Meus Dados' },
  { key: 'seguranca',   icon: '🔒', label: 'Segurança' },
]


// Progresso real por álbum a partir do localStorage
const ALBUM_PROGRESS_FALLBACK: Record<AlbumId, number> = {
  'copa-2026':               0,
  'brasileirao-masc-2026':   0,
  'brasileirao-fem-2026':    0,
}


function ContaPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [section, setSection]   = useState<Section>('visao-geral')
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [propostasPendentes, setPropostasPendentes] = useState(0)
  const [tradeCount, setTradeCount] = useState(0)
  const [notifNaoVistas, setNotifNaoVistas]         = useState(0)
  const [filtroPedido, setFiltroPedido] = useState<'todos' | 'troca' | 'compra'>('todos')
  const [albumProgress, setAlbumProgress] = useState<Record<AlbumId, number>>(ALBUM_PROGRESS_FALLBACK)
  const [editDados, setEditDados] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [perfil, setPerfil] = useState<Partial<UserProfile>>({})
  const [perfilEdit, setPerfilEdit] = useState<Partial<UserProfile>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSenhaModal, setShowSenhaModal]       = useState(false)
  const [senhaAtual, setSenhaAtual]               = useState('')
  const [senhaNova, setSenhaNova]                 = useState('')
  const [senhaConf, setSenhaConf]                 = useState('')
  const [senhaErro, setSenhaErro]                 = useState('')
  const [senhaSalva, setSenhaSalva]               = useState(false)
  const [activeAlbums, setActiveAlbums] = useState<Set<AlbumId>>(new Set())
  const [activeAlbumView, setActiveAlbumView] = useState<AlbumId>('copa-2026')
  const [userId, setUserId] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [planoExpira, setPlanoExpira] = useState<Date | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  async function sair() {
    await signOut()
    await fetch('/auth/signout', { method: 'POST' })
    window.location.href = '/entrar'
  }


  useEffect(() => {
    const s = searchParams.get('s') as Section | null
    const valid: Section[] = ['visao-geral','albuns','propostas','gamificacao','dados','historico','seguranca']
    if (s && valid.includes(s)) queueMicrotask(() => setSection(s))
  }, [searchParams])

  useEffect(() => {
    dbGetHistorico().then(setHistorico)
    dbGetPropostasRecebidas().then(rec => {
      const pend = rec.filter(p => p.status === 'pendente').length
      setPropostasPendentes(pend)
    })
    Promise.all([dbGetProfile(), getSession()]).then(async ([p, session]) => {
      const email = session?.user?.email ?? ''
      let merged = { ...p, email }
      // Se tem CEP mas bairro vazio, busca automaticamente no ViaCEP
      if (p.cep && !p.bairro) {
        const raw = String(p.cep).replace(/\D/g, '')
        if (raw.length === 8) {
          try {
            const res  = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
            const data = await res.json()
            if (!data.erro) {
              merged = { ...merged, bairro: data.bairro ?? '', cidade: data.localidade, uf: data.uf }
              // Salva no banco para próximas visitas
              dbSaveProfile({ cep: p.cep, bairro: data.bairro ?? '', cidade: data.localidade, uf: data.uf })
            }
          } catch { /* silently ignore */ }
        }
      }
      setPerfil(merged)
      setPerfilEdit(merged)
    })
    getUserId().then(id => {
      setUserId(id)
      if (id) dbGetTradeCount(id).then(setTradeCount)
    })
    dbGetPlano().then(({ plano, expira_em }) => {
      setIsPro(plano === 'pro')
      setPlanoExpira(expira_em ? new Date(expira_em) : null)
    })
    dbGetActiveAlbums().then(ids => {
      setActiveAlbums(new Set(ids))
      if (ids.length > 0) setActiveAlbumView(ids[0])
    })
    // Progresso real dos álbuns (carrega coladas do DB em paralelo)
    import('@/data/albums-registry').then(async ({ ALBUMS_REGISTRY }) => {
      const prog: Record<string, number> = {}
      await Promise.all(ALBUMS_REGISTRY.map(async a => {
        const coladas = await dbGetColadas(a.id as AlbumId)
        prog[a.id] = a.totalStickers > 0 ? Math.round(coladas.length / a.totalStickers * 100) : 0
      }))
      setAlbumProgress(prog as Record<AlbumId, number>)
    })
  }, [])

  const MENU = MENU_ITEMS.map(m => {
    if (m.key === 'propostas') return { ...m, badge: propostasPendentes }
    return m
  })

  const nVendas  = historico.filter(p => p.tipo === 'compra').length

  // tradeCount = trocas confirmadas por avaliação mútua (fonte confiável para ranking/badges)
  const BADGE_DEFS = [
    { icon: '🥇', label: 'Vendedor Verificado', desc: 'Complete 10+ vendas',    earned: nVendas    >= 10  },
    { icon: '⭐', label: 'Primeiro Troco',       desc: 'Realize 1 troca',        earned: tradeCount >= 1   },
    { icon: '🔁', label: 'Top Trocador',         desc: 'Complete 50+ trocas',    earned: tradeCount >= 50  },
    { icon: '🔥', label: '100 Trocas',           desc: 'Realize 100 trocas',     earned: tradeCount >= 100 },
    { icon: '🏆', label: 'Álbum Completo',       desc: 'Complete 100% do álbum', earned: false             },
  ]

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
      dbSaveActiveAlbums([...next] as AlbumId[])
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
              <span className="text-white font-black text-sm">
                {(() => { const n = (perfil.nome ?? '?').trim().split(' ').filter(Boolean); return (n[0]?.[0] ?? '?') + (n[n.length-1]?.[0] ?? '') })()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="font-bold text-sm text-slate-800 truncate">{perfil.nome || 'Minha Conta'}</p>
                {/* badge só no mobile — no desktop aparece no Navbar */}
                <span className="md:hidden">
                  {isPro
                    ? <span className="text-[10px] font-black bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full flex-shrink-0">PRO</span>
                    : <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full flex-shrink-0">Grátis</span>
                  }
                </span>
              </div>
              <p className="text-xs text-slate-400">{[perfil.bairro, perfil.cidade, perfil.uf].filter(Boolean).join(', ') || 'Complete seu perfil'}</p>
              {userId && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Link href={`/perfil/${userId}`} className="text-xs text-green-600 font-medium hover:underline">
                    Ver perfil →
                  </Link>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/perfil/${userId}`)
                    }}
                    title="Copiar link do perfil"
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    🔗
                  </button>
                </div>
              )}
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
                <span className="flex-1">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="text-[10px] font-black bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
            <button onClick={sair} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 border-t border-slate-100 transition-colors">
              <span>🚪</span> Sair da conta
            </button>
          </nav>
        </aside>

        {/* ── CONTEÚDO ── */}
        <div className="flex-1 min-w-0">

          {/* VISÃO GERAL */}
          {section === 'visao-geral' && (
            <div className="space-y-4 animate-fadein">

              {/* Card de plano */}
              {isPro ? (
                <div className="bg-gradient-to-r from-amber-400 to-yellow-300 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <span className="text-3xl">🏆</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-amber-900 text-sm">Plano PRO ativo</p>
                    <p className="text-amber-800 text-xs mt-0.5">
                      {planoExpira
                        ? `Válido até ${planoExpira.toLocaleDateString('pt-BR')}`
                        : 'Acesso vitalício'}
                    </p>
                  </div>
                  <span className="text-[11px] font-black bg-amber-900/20 text-amber-900 px-2 py-1 rounded-full flex-shrink-0">ATIVO</span>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-4 flex items-center gap-4">
                  <span className="text-3xl">⭐</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-sm">Plano Grátis</p>
                    <p className="text-slate-400 text-xs mt-0.5">Seja PRO para enviar propostas ilimitadas</p>
                  </div>
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="text-xs font-black bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-xl transition-colors flex-shrink-0"
                  >
                    Upgrade →
                  </button>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Trocas',    value: tradeCount,                                       color: 'text-blue-600',   bg: 'bg-blue-50',   icon: '🔁' },
                  { label: 'Vendas',    value: historico.filter(p => p.tipo === 'compra').length,   color: 'text-green-600',  bg: 'bg-green-50',  icon: '🟢' },
                  { label: 'Avaliações',value: 0,                                                color: 'text-amber-600',  bg: 'bg-amber-50',  icon: '⭐' },
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
                    const pct = albumProgress[album.id] ?? 0
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
                  {BADGE_DEFS.filter(b => b.earned).length === 0 && (
                    <p className="text-sm text-slate-400">Complete transações para ganhar badges</p>
                  )}
                  {BADGE_DEFS.filter(b => b.earned).map(b => (
                    <div key={b.label} title={b.desc} className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-sm font-medium text-slate-700">
                      <span>{b.icon}</span> {b.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Últimas transações */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-slate-800">Últimas transações</p>
                  <button onClick={() => setSection('historico')} className="text-xs text-green-600 font-medium hover:underline">Ver todas →</button>
                </div>
                {historico.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhuma transação ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {historico.slice(0, 3).map((p) => (
                      <div key={p.id} className="flex items-center gap-3 text-sm">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.tipo === 'troca' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {p.tipo === 'troca' ? '🔄 Troca' : '🛒 Compra'}
                        </span>
                        <span className="text-slate-700 truncate flex-1">com {p.contraparte}</span>
                        <span className="text-slate-400 text-xs flex-shrink-0">
                          {new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
                    const pct      = albumProgress[album.id] ?? 0
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

          {/* GAMEFICAÇÃO */}
          {section === 'gamificacao' && (
            <div className="animate-fadein space-y-4">

              {/* Badges por categoria */}
              {[
                {
                  label: 'Vendas', icon: '💰', value: historico.filter(p => p.tipo === 'compra').length,
                  color: { bar: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500', dotOff: 'bg-slate-200' },
                  levels: [
                    { nome: 'Estreante',  meta: 1    },
                    { nome: 'Bronze',     meta: 5    },
                    { nome: 'Prata',      meta: 15   },
                    { nome: 'Ouro',       meta: 30   },
                    { nome: 'Platina',    meta: 60   },
                    { nome: 'Diamante',   meta: 100  },
                    { nome: 'Mestre',     meta: 200  },
                    { nome: 'Elite',      meta: 500  },
                    { nome: 'Lendário',   meta: 1000 },
                    { nome: 'Supremo',    meta: 2500 },
                  ],
                },
                {
                  label: 'Trocas', icon: '🔁', value: tradeCount,
                  color: { bar: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', dotOff: 'bg-slate-200' },
                  levels: [
                    { nome: 'Estreante',  meta: 1    },
                    { nome: 'Bronze',     meta: 10   },
                    { nome: 'Prata',      meta: 25   },
                    { nome: 'Ouro',       meta: 50   },
                    { nome: 'Platina',    meta: 100  },
                    { nome: 'Diamante',   meta: 200  },
                    { nome: 'Mestre',     meta: 400  },
                    { nome: 'Elite',      meta: 750  },
                    { nome: 'Lendário',   meta: 1500 },
                    { nome: 'Supremo',    meta: 3000 },
                  ],
                },
              ].map(cat => {
                const currentLevel = cat.levels.filter(l => cat.value >= l.meta).length
                const nivel        = cat.levels[currentLevel - 1]
                const proximo      = cat.levels[currentLevel]
                const pctProximo   = proximo
                  ? Math.round(((cat.value - (nivel?.meta ?? 0)) / (proximo.meta - (nivel?.meta ?? 0))) * 100)
                  : 100

                return (
                  <div key={cat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl ${cat.color.bg} ${cat.color.border} border flex items-center justify-center text-2xl flex-shrink-0`}>
                        {cat.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-800">{cat.label}</p>
                        <p className={`text-sm font-bold ${cat.color.text}`}>
                          Nível {currentLevel} — {nivel?.nome ?? 'Sem nível'}
                        </p>
                      </div>
                      <div className={`${cat.color.bg} ${cat.color.border} border px-3 py-1.5 rounded-xl text-center`}>
                        <p className={`text-xl font-black ${cat.color.text}`}>{cat.value}</p>
                        <p className="text-[10px] text-slate-400">{cat.label.toLowerCase()}</p>
                      </div>
                    </div>

                    {/* Dots de nível */}
                    <div className="flex items-center gap-1 mb-3">
                      {cat.levels.map((l, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className={[
                            'w-full h-2 rounded-full transition-all',
                            i < currentLevel ? cat.color.bar : cat.color.dotOff,
                          ].join(' ')} />
                          {i === currentLevel - 1 && (
                            <span className="text-[8px] font-bold text-slate-500">{l.nome}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Progresso pro próximo nível */}
                    {proximo ? (
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Próximo: <span className="font-bold">{proximo.nome}</span></span>
                          <span>{cat.value} / {proximo.meta}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className={`h-2 rounded-full ${cat.color.bar} transition-all`} style={{ width: `${pctProximo}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Faltam {proximo.meta - cat.value} {cat.label.toLowerCase()} para o próximo nível
                        </p>
                      </div>
                    ) : (
                      <p className={`text-xs font-bold ${cat.color.text} text-center py-1`}>🏆 Nível máximo atingido!</p>
                    )}

                    {/* Lista todos os níveis */}
                    <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-1.5">
                      {cat.levels.map((l, i) => {
                        const earned = cat.value >= l.meta
                        return (
                          <div key={i} className={[
                            'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all',
                            earned ? `${cat.color.bg}` : 'bg-slate-50 opacity-50',
                          ].join(' ')}>
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${earned ? cat.color.bar : 'bg-slate-300'}`} />
                            <span className={`font-semibold ${earned ? cat.color.text : 'text-slate-400'}`}>Nível {i + 1}</span>
                            <span className={`ml-auto ${earned ? 'text-slate-500' : 'text-slate-400'}`}>{l.meta >= 1000 ? `${l.meta / 1000}k` : l.meta}</span>
                            {earned && <span className="text-[10px]">✓</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* MEUS DADOS */}
          {section === 'dados' && (
            <div className="animate-fadein space-y-3">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-5">
                  <p className="font-bold text-slate-800">Dados pessoais</p>
                  <button onClick={async () => {
                    if (editDados) { setEditDados(false); return }
                    const edit = { ...perfil }
                    setPerfilEdit(edit)
                    setEditDados(true)
                    // Se tem CEP mas não tem bairro, busca automaticamente
                    if (perfil.cep && !perfil.bairro) {
                      const raw = String(perfil.cep).replace(/\D/g, '')
                      if (raw.length === 8) {
                        setCepLoading(true)
                        try {
                          const res  = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
                          const data = await res.json()
                          if (!data.erro) {
                            setPerfilEdit(p => ({ ...p, bairro: data.bairro ?? '', cidade: data.localidade, uf: data.uf }))
                          }
                        } catch { /* ignore */ }
                        finally { setCepLoading(false) }
                      }
                    }
                  }}
                    className="text-sm text-green-600 font-semibold hover:text-green-700">
                    {editDados ? 'Cancelar' : '✏️ Editar'}
                  </button>
                </div>
                <div className="space-y-4">

                  {/* Nome — sempre read-only */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Nome completo</label>
                    <p className="text-sm text-slate-700 bg-slate-50 px-4 py-2.5 rounded-xl">{perfil.nome || '—'}</p>
                  </div>

                  {/* E-mail — sempre read-only */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">E-mail</label>
                    <p className="text-sm text-slate-700 bg-slate-50 px-4 py-2.5 rounded-xl">{perfil.email || '—'}</p>
                  </div>

                  {/* Telefone — editável */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">WhatsApp / Telefone</label>
                    {editDados
                      ? <input type="tel" value={String(perfilEdit.telefone ?? '')}
                          onChange={e => setPerfilEdit(p => ({ ...p, telefone: e.target.value }))}
                          placeholder="(11) 99999-9999"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                      : <p className="text-sm text-slate-700 bg-slate-50 px-4 py-2.5 rounded-xl">{perfil.telefone || '—'}</p>
                    }
                    <p className="text-[11px] text-slate-400 mt-1">Compartilhado apenas após aceitação mútua de proposta.</p>
                  </div>

                  {/* CEP — editável com ViaCEP */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">CEP</label>
                    {editDados ? (
                      <div className="relative">
                        <input type="text" inputMode="numeric" maxLength={9}
                          value={String(perfilEdit.cep ?? '')}
                          onChange={async e => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
                            const fmt = raw.length > 5 ? `${raw.slice(0,5)}-${raw.slice(5)}` : raw
                            setPerfilEdit(p => ({ ...p, cep: fmt }))
                            if (raw.length === 8) {
                              setCepLoading(true)
                              try {
                                const res  = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
                                const data = await res.json()
                                if (!data.erro) setPerfilEdit(p => ({ ...p, bairro: data.bairro ?? '', cidade: data.localidade, uf: data.uf }))
                              } finally { setCepLoading(false) }
                            }
                          }}
                          placeholder="00000-000"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 pr-10" />
                        {cepLoading && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-700 bg-slate-50 px-4 py-2.5 rounded-xl">{perfil.cep || '—'}</p>
                    )}
                  </div>

                  {/* Bairro / Cidade / Estado — somente leitura, vem do CEP */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Bairro — Cidade — Estado</label>
                    <p className={['text-sm px-4 py-2.5 rounded-xl',
                      editDados ? 'text-slate-500 bg-slate-50 border border-dashed border-slate-200' : 'text-slate-700 bg-slate-50'].join(' ')}>
                      {(() => {
                        const b = editDados ? perfilEdit.bairro : perfil.bairro
                        const c = editDados ? perfilEdit.cidade : perfil.cidade
                        const u = editDados ? perfilEdit.uf     : perfil.uf
                        return [b, c, u].filter(Boolean).join(' — ') || '—'
                      })()}
                    </p>
                    {editDados && <p className="text-[11px] text-slate-400 mt-1">Preenchido automaticamente pelo CEP.</p>}
                  </div>

                  {editDados && (
                    <button
                      onClick={async () => {
                        const tel = String(perfilEdit.telefone ?? '').replace(/\D/g, '')
                        if (tel.length >= 10) {
                          const res = await fetch(`/api/check-phone?tel=${tel}&exclude=${userId ?? ''}`)
                          const { available } = await res.json()
                          if (!available) {
                            alert('Este telefone já está cadastrado em outra conta.')
                            return
                          }
                        }
                        const novo = { ...perfil, ...perfilEdit }
                        dbSaveProfile(novo)
                        setPerfil(novo)
                        setEditDados(false)
                      }}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition-colors mt-2"
                    >
                      Salvar alterações
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PROPOSTAS */}
          {section === 'propostas' && (
            <div className="animate-fadein space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-800">Propostas de troca</p>
                <Link href="/propostas" className="text-xs text-green-600 font-semibold hover:underline">
                  Ver todas →
                </Link>
              </div>

              {propostasPendentes > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl">🔔</span>
                  <div className="flex-1">
                    <p className="font-bold text-amber-800 text-sm">
                      {propostasPendentes} proposta{propostasPendentes > 1 ? 's' : ''} aguardando resposta
                    </p>
                    <p className="text-xs text-amber-600">Responda em até 48h para não perder o match</p>
                  </div>
                  <Link href="/propostas"
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors flex-shrink-0">
                    Responder
                  </Link>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50">
                  <p className="font-semibold text-slate-700 text-sm">Acesso rápido</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {[
                    { icon: '📥', label: 'Propostas recebidas', desc: `${propostasPendentes} pendente${propostasPendentes !== 1 ? 's' : ''}`, href: '/propostas' },
                    { icon: '📤', label: 'Propostas enviadas',  desc: 'Ver respostas', href: '/propostas' },
                  ].map(item => (
                    <Link key={item.label} href={item.href}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                      <span className="text-slate-300 text-sm">›</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* HISTÓRICO */}
          {section === 'historico' && (
            <div className="animate-fadein space-y-3">
              {/* Filtros */}
              <div className="flex gap-1.5 flex-wrap">
                {([
                  { key: 'todos', label: 'Todos'      },
                  { key: 'troca', label: '🔁 Trocas'  },
                  { key: 'venda', label: '💰 Vendas'  },
                ] as { key: typeof filtroPedido; label: string }[]).map(f => (
                  <button key={f.key} onClick={() => setFiltroPedido(f.key)}
                    className={[
                      'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                      filtroPedido === f.key
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
                    ].join(' ')}>
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                  <p className="font-bold text-slate-800 text-sm">Transações</p>
                  <p className="text-xs text-slate-400">{historico.filter(p => filtroPedido === 'todos' || p.tipo === filtroPedido).length} registros</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {historico
                    .filter(p => filtroPedido === 'todos' || p.tipo === filtroPedido)
                    .map(p => {
                      const emoji = p.tipo === 'troca' ? '🔄' : '🛒'
                      const label = p.tipo === 'troca' ? 'Troca' : 'Compra'
                      const bg    = p.tipo === 'troca' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      const data  = new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                      return (
                        <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${bg}`}>
                            {emoji} {label}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">com {p.contraparte}</p>
                            <p className="text-xs text-slate-400 truncate">
                              {p.figurinhas.length} figurinha{p.figurinhas.length !== 1 ? 's' : ''}
                              {p.figurinhas.length <= 5 && ` · #${p.figurinhas.join(', #')}`}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-slate-400">{data}</p>
                            <p className="text-xs font-medium text-green-600">✓ Confirmada</p>
                          </div>
                        </div>
                      )
                    })}
                </div>
                {historico.filter(p => filtroPedido === 'todos' || p.tipo === filtroPedido).length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-3xl mb-2">📭</p>
                    <p className="text-sm text-slate-500">Nenhum registro encontrado</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEGURANÇA */}
          {section === 'seguranca' && (
            <div className="animate-fadein space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="font-bold text-slate-800 mb-4">Segurança</p>
                <div className="space-y-3">
                  <button onClick={() => { setShowSenhaModal(true); setSenhaErro(''); setSenhaSalva(false); setSenhaAtual(''); setSenhaNova(''); setSenhaConf('') }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-left">
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

      {/* Modal alterar senha */}
      {showSenhaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-fadein">
            <div className="text-3xl text-center mb-3">🔑</div>
            <h3 className="font-black text-slate-800 text-center text-lg mb-4">Alterar senha</h3>
            {senhaSalva ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-semibold text-green-700 mb-1">Senha alterada com sucesso!</p>
                <p className="text-xs text-slate-400 mb-4">Use sua nova senha no próximo acesso.</p>
                <button onClick={() => setShowSenhaModal(false)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                  Fechar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {senhaErro && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600">{senhaErro}</div>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Nova senha</label>
                  <input type="password" value={senhaNova} onChange={e => setSenhaNova(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Confirmar nova senha</label>
                  <input type="password" value={senhaConf} onChange={e => setSenhaConf(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowSenhaModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600">
                    Cancelar
                  </button>
                  <button onClick={async () => {
                    if (senhaNova.length < 8)    { setSenhaErro('Nova senha deve ter ao menos 8 caracteres.'); return }
                    if (senhaNova !== senhaConf) { setSenhaErro('As senhas não coincidem.'); return }
                    setSenhaErro('')
                    const { error } = await dbUpdatePassword(senhaNova)
                    if (error) { setSenhaErro('Erro ao alterar: ' + error); return }
                    setSenhaSalva(true)
                  }} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors">
                    Salvar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* Modal excluir conta */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-fadein">
            <div className="text-4xl text-center mb-3">⚠️</div>
            <h3 className="font-black text-slate-800 text-center text-lg mb-2">Excluir conta?</h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              Esta ação é <strong>irreversível</strong>. Seus dados serão removidos e o acesso será encerrado.
            </p>
            <div className="space-y-2">
              <button onClick={async () => {
                const { error } = await dbDeleteAccount()
                if (error) {
                  alert(`Não foi possível excluir agora: ${error}`)
                  return
                }
                await signOut()
                window.location.href = '/'
              }}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
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

export default function ContaPage() {
  return (
    <Suspense fallback={null}>
      <ContaPageInner />
    </Suspense>
  )
}
