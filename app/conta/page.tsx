'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ALBUMS_REGISTRY, type AlbumId } from '@/data/albums-registry'
import {
  getPedidos, getPropostasRecebidas,
  savePedidos, getCarrinho, saveCarrinho,
  type Pedido, type CarrinhoItem, type UserProfile,
} from '@/lib/store'
import { signOut, dbGetProfile, dbSaveProfile, dbGetColadas, dbGetActiveAlbums, dbSaveActiveAlbums, getUserId, dbUpdatePassword } from '@/lib/db'


type Section = 'visao-geral' | 'albuns' | 'carrinho' | 'propostas' | 'gamificacao' | 'dados' | 'endereco' | 'historico' | 'seguranca'

const MENU_ITEMS: { key: Section; icon: string; label: string; badge?: number }[] = [
  { key: 'visao-geral', icon: '📊', label: 'Visão Geral' },
  { key: 'albuns',      icon: '📚', label: 'Meus Álbuns' },
  { key: 'carrinho',    icon: '🛒', label: 'Meu Carrinho' },
  { key: 'propostas',   icon: '🔁', label: 'Propostas' },
  { key: 'gamificacao', icon: '🏆', label: 'Gameficação' },
  { key: 'historico',   icon: '📦', label: 'Histórico' },
  { key: 'dados',       icon: '👤', label: 'Meus Dados' },
  { key: 'endereco',    icon: '📍', label: 'Endereço' },
  { key: 'seguranca',   icon: '🔒', label: 'Segurança' },
]


// Progresso real por álbum a partir do localStorage
const ALBUM_PROGRESS_FALLBACK: Record<AlbumId, number> = {
  'copa-2026':               0,
  'brasileirao-masc-2026':   0,
  'brasileirao-fem-2026':    0,
}

const TYPE_CONFIG = {
  troca:  { label: 'Troca',  bg: 'bg-blue-100',   text: 'text-blue-700'   },
  venda:  { label: 'Venda',  bg: 'bg-green-100',  text: 'text-green-700'  },
  doacao: { label: 'Doação', bg: 'bg-purple-100', text: 'text-purple-700' },
}

function ContaPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [section, setSection]   = useState<Section>('visao-geral')
  const [pedidos, setPedidos]   = useState<Pedido[]>([])
  const [propostasPendentes, setPropostasPendentes] = useState(0)
  const [notifNaoVistas, setNotifNaoVistas]         = useState(0)
  const [carrinho, setCarrinho]         = useState<CarrinhoItem[]>([])
  const [filtroPedido, setFiltroPedido] = useState<'todos' | 'troca' | 'venda' | 'doacao'>('todos')
  const [avaliacaoModal, setAvaliacaoModal] = useState<Pedido | null>(null)
  const [estrelas, setEstrelas] = useState(5)
  const [avaliacaoEnviada, setAvaliacaoEnviada] = useState<string | null>(null)
  const [albumProgress, setAlbumProgress] = useState<Record<AlbumId, number>>(ALBUM_PROGRESS_FALLBACK)

  async function sair() {
    await signOut()
    router.push('/entrar')
  }

  function enviarAvaliacao() {
    if (!avaliacaoModal) return
    const atualizados = pedidos.map(p =>
      p.id === avaliacaoModal.id ? { ...p, status: 'concluido' as const } : p
    )
    setPedidos(atualizados)
    savePedidos(atualizados)
    setAvaliacaoEnviada(avaliacaoModal.id)
    setAvaliacaoModal(null)
  }

  useEffect(() => {
    const s = searchParams.get('s') as Section | null
    const valid: Section[] = ['visao-geral','albuns','carrinho','propostas','gamificacao','dados','endereco','historico','seguranca']
    if (s && valid.includes(s)) setSection(s)
  }, [searchParams])

  useEffect(() => {
    setPedidos(getPedidos())
    setCarrinho(getCarrinho())
    const rec = getPropostasRecebidas()
    setPropostasPendentes(rec.filter(p => p.status === 'pendente').length)
    dbGetProfile().then(p => { setPerfil(p); setPerfilEdit(p) })
    getUserId().then(id => setUserId(id))
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

  const carrinhoItens = carrinho.reduce((a, v) => a + v.stickers.length, 0)
  const MENU = MENU_ITEMS.map(m => {
    if (m.key === 'propostas') return { ...m, badge: propostasPendentes }
    if (m.key === 'carrinho')  return { ...m, badge: carrinhoItens > 0 ? carrinhoItens : undefined }
    return m
  })

  const [editDados, setEditDados] = useState(false)
  const [editEndereco, setEditEndereco] = useState(false)
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

  const nTrocas  = pedidos.filter(p => p.tipo === 'troca').length
  const nVendas  = pedidos.filter(p => p.tipo === 'venda').length
  const nDoacoes = pedidos.filter(p => p.tipo === 'doacao').length

  const BADGE_DEFS = [
    { icon: '🥇', label: 'Vendedor Verificado', desc: 'Complete 10+ vendas',       earned: nVendas  >= 10  },
    { icon: '💜', label: 'Doador Ouro',          desc: 'Realize 10+ doações',       earned: nDoacoes >= 10  },
    { icon: '⭐', label: 'Top Trocador',          desc: 'Complete 50+ trocas',       earned: nTrocas  >= 50  },
    { icon: '🔥', label: '100 Trocas',            desc: 'Realize 100 trocas',        earned: nTrocas  >= 100 },
    { icon: '💎', label: 'Doador Diamante',       desc: 'Realize 25 doações',        earned: nDoacoes >= 25  },
    { icon: '🏆', label: 'Álbum Completo',        desc: 'Complete 100% do álbum',    earned: false           },
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
              <p className="font-bold text-sm text-slate-800 truncate">{perfil.nome || 'Minha Conta'}</p>
              <p className="text-xs text-slate-400">{[perfil.cidade, perfil.uf].filter(Boolean).join(', ') || 'Complete seu perfil'}</p>
              {userId && (
                <Link href={`/perfil/${userId}`} className="text-xs text-green-600 font-medium hover:underline">
                  Ver perfil público →
                </Link>
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
                  <span className="text-[10px] font-black bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
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
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Trocas',    value: pedidos.filter(p => p.tipo === 'troca').length,   color: 'text-blue-600',   bg: 'bg-blue-50',   icon: '🔁' },
                  { label: 'Vendas',    value: pedidos.filter(p => p.tipo === 'venda').length,   color: 'text-green-600',  bg: 'bg-green-50',  icon: '🟢' },
                  { label: 'Doações',   value: pedidos.filter(p => p.tipo === 'doacao').length,  color: 'text-purple-600', bg: 'bg-purple-50', icon: '💜' },
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
                {pedidos.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhuma transação ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {pedidos.slice(0, 3).map((p) => (
                      <div key={p.id} className="flex items-center gap-3 text-sm">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_CONFIG[p.tipo].bg} ${TYPE_CONFIG[p.tipo].text}`}>
                          {TYPE_CONFIG[p.tipo].label}
                        </span>
                        <span className="text-slate-700 truncate flex-1">{p.fig}</span>
                        <span className="text-slate-400 text-xs flex-shrink-0">{p.data}</span>
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

          {/* CARRINHO */}
          {section === 'carrinho' && (
            <div className="animate-fadein space-y-4">
              {carrinho.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-14 text-center">
                  <p className="text-4xl mb-3">🛒</p>
                  <p className="font-bold text-slate-700 mb-1">Carrinho vazio</p>
                  <p className="text-sm text-slate-400 mb-4">Adicione figurinhas a partir dos matches ou anúncios.</p>
                  <Link href="/matches" className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                    Ver matches →
                  </Link>
                </div>
              ) : (
                <>
                  {/* Resumo */}
                  {(() => {
                    const totalItens = carrinho.reduce((a, v) => a + v.stickers.length, 0)
                    const totalValor = carrinho.reduce((a, v) => a + v.stickers.reduce((b, s) => b + s.preco, 0), 0)
                    return (
                      <div className="bg-slate-800 rounded-2xl p-5 text-white flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-slate-400 text-xs mb-0.5">Total no carrinho</p>
                          <p className="text-3xl font-black text-green-400">
                            {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {totalItens} figurinha{totalItens !== 1 ? 's' : ''} · {carrinho.length} vendedor{carrinho.length !== 1 ? 'es' : ''}
                          </p>
                        </div>
                        <Link
                          href="/checkout"
                          className="bg-green-600 hover:bg-green-500 text-white font-black px-5 py-3 rounded-xl text-sm transition-colors flex-shrink-0"
                        >
                          Finalizar compra →
                        </Link>
                      </div>
                    )
                  })()}

                  {/* Por vendedor */}
                  {carrinho.map(v => {
                    const subtotal = v.stickers.reduce((a, s) => a + s.preco, 0)
                    function removeSticker(num: number) {
                      const novoCarrinho = carrinho
                        .map(c => c.vendaId === v.vendaId
                          ? { ...c, stickers: c.stickers.filter(s => s.num !== num) }
                          : c
                        )
                        .filter(c => c.stickers.length > 0)
                      setCarrinho(novoCarrinho)
                      saveCarrinho(novoCarrinho)
                    }
                    return (
                      <div key={v.vendaId} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Header vendedor */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${v.avatarColor} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-xs font-black">{v.avatar}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-800">{v.vendedor}</p>
                            <p className="text-xs text-slate-400">{v.cidade} · ⭐ {v.rating}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-slate-400">{v.stickers.length} fig.</p>
                            <p className="text-sm font-black text-green-700">
                              {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                          </div>
                        </div>

                        {/* Itens */}
                        <div className="divide-y divide-slate-50">
                          {v.stickers.map(item => (
                            <div key={item.num} className="flex items-center gap-3 px-4 py-2.5">
                              <div className={[
                                'w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-black',
                                item.tipo === 'brilhante' ? 'bg-amber-50 border-amber-300 text-amber-700'
                                : item.tipo === 'escudo'  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                : 'bg-slate-50 border-slate-200 text-slate-600',
                              ].join(' ')}>
                                {item.num}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">#{item.num} · {item.nome}</p>
                                <p className="text-[11px] text-slate-400">
                                  {item.tipo === 'brilhante' ? '✨ Brilhante' : item.tipo === 'escudo' ? '🛡 Escudo' : '⬜ Normal'}
                                </p>
                              </div>
                              <p className="text-sm font-black text-slate-700 flex-shrink-0">
                                {item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </p>
                              <button
                                onClick={() => removeSticker(item.num)}
                                className="text-slate-300 hover:text-red-400 transition-colors text-lg ml-1 flex-shrink-0"
                              >×</button>
                            </div>
                          ))}
                        </div>

                        {/* Botão por vendedor */}
                        <div className="px-4 py-3 bg-slate-50">
                          <Link
                            href="/checkout"
                            className="block text-center bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                          >
                            🛒 Comprar de {v.vendedor.split(' ')[0]} · {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}

          {/* GAMEFICAÇÃO */}
          {section === 'gamificacao' && (
            <div className="animate-fadein space-y-4">
              {/* Ranking */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
                <p className="text-slate-400 text-sm mb-1">Seu ranking este mês</p>
                <div className="text-5xl font-black text-green-400">#247</div>
                <p className="text-slate-400 text-sm mt-1">entre {(12847).toLocaleString('pt-BR')} colecionadores</p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Trocas',  value: pedidos.filter(p => p.tipo === 'troca').length  },
                    { label: 'Vendas',  value: pedidos.filter(p => p.tipo === 'venda').length  },
                    { label: 'Doações', value: pedidos.filter(p => p.tipo === 'doacao').length },
                  ].map(s => (
                    <div key={s.label} className="bg-white/10 rounded-xl py-2">
                      <div className="text-xl font-black">{s.value}</div>
                      <div className="text-xs text-slate-400">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges por categoria */}
              {[
                {
                  label: 'Vendas', icon: '💰', value: pedidos.filter(p => p.tipo === 'venda').length,
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
                  label: 'Trocas', icon: '🔁', value: pedidos.filter(p => p.tipo === 'troca').length,
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
                {
                  label: 'Doações', icon: '💜', value: pedidos.filter(p => p.tipo === 'doacao').length,
                  color: { bar: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500', dotOff: 'bg-slate-200' },
                  levels: [
                    { nome: 'Estreante',  meta: 1    },
                    { nome: 'Bronze',     meta: 5    },
                    { nome: 'Prata',      meta: 10   },
                    { nome: 'Ouro',       meta: 20   },
                    { nome: 'Platina',    meta: 40   },
                    { nome: 'Diamante',   meta: 75   },
                    { nome: 'Mestre',     meta: 150  },
                    { nome: 'Elite',      meta: 300  },
                    { nome: 'Lendário',   meta: 600  },
                    { nome: 'Anjo',       meta: 1500 },
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
                  <button onClick={() => { setEditDados(!editDados); setPerfilEdit(perfil) }} className="text-sm text-green-600 font-semibold hover:text-green-700">
                    {editDados ? 'Cancelar' : '✏️ Editar'}
                  </button>
                </div>
                <div className="space-y-4">
                  {([
                    { label: 'Nome completo',    field: 'nome'           as keyof UserProfile, type: 'text'  },
                    { label: 'E-mail',           field: 'email'          as keyof UserProfile, type: 'email' },
                    { label: 'Data de nascimento', field: 'dataNascimento' as keyof UserProfile, type: 'date'  },
                  ] as { label: string; field: keyof UserProfile; type: string }[]).map(f => (
                    <div key={f.label}>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">{f.label}</label>
                      {editDados
                        ? <input type={f.type}
                            value={String(perfilEdit[f.field] ?? '')}
                            onChange={e => setPerfilEdit(p => ({ ...p, [f.field]: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                        : <p className="text-sm text-slate-700 bg-slate-50 px-4 py-2.5 rounded-xl">
                            {String(perfil[f.field] || '—')}
                          </p>
                      }
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">CPF</label>
                    <p className="text-sm text-slate-700 bg-slate-50 px-4 py-2.5 rounded-xl">
                      {perfil.cpf ? '•••.•••.' + perfil.cpf.slice(-6) : '—'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">CPF não pode ser alterado. Entre em contato se precisar corrigir.</p>
                  </div>
                  {editDados && (
                    <button
                      onClick={() => { dbSaveProfile({ ...perfil, ...perfilEdit }); setPerfil({ ...perfil, ...perfilEdit }); setEditDados(false) }}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition-colors mt-2"
                    >
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
                  <button onClick={() => { setEditEndereco(!editEndereco); setPerfilEdit(perfil) }} className="text-sm text-green-600 font-semibold hover:text-green-700 flex-shrink-0">
                    {editEndereco ? 'Cancelar' : '✏️ Editar'}
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { label: 'CEP', field: 'cep' as keyof UserProfile, col: 'col-span-2' },
                      { label: 'UF',  field: 'uf'  as keyof UserProfile, col: 'col-span-1' },
                    ] as { label: string; field: keyof UserProfile; col: string }[]).map(f => (
                      <div key={f.label} className={f.col}>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">{f.label}</label>
                        {editEndereco
                          ? <input type="text"
                              value={String(perfilEdit[f.field] ?? '')}
                              onChange={e => setPerfilEdit(p => ({ ...p, [f.field]: e.target.value }))}
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                          : <p className="text-sm text-slate-700 bg-slate-50 px-3 py-2.5 rounded-xl">{String(perfil[f.field] || '—')}</p>
                        }
                      </div>
                    ))}
                  </div>
                  {([
                    { label: 'Logradouro',  field: 'logradouro'  as keyof UserProfile, col: 'col-span-3' },
                    { label: 'Número',      field: 'numero'      as keyof UserProfile, col: 'col-span-1' },
                    { label: 'Complemento', field: 'complemento' as keyof UserProfile, col: 'col-span-2' },
                    { label: 'Cidade',      field: 'cidade'      as keyof UserProfile, col: 'col-span-3' },
                  ] as { label: string; field: keyof UserProfile; col: string }[]).map(f => (
                    <div key={f.label} className={f.col}>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">{f.label}</label>
                      {editEndereco
                        ? <input type="text"
                            value={String(perfilEdit[f.field] ?? '')}
                            onChange={e => setPerfilEdit(p => ({ ...p, [f.field]: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                        : <p className="text-sm text-slate-700 bg-slate-50 px-3 py-2.5 rounded-xl">{String(perfil[f.field] || '—')}</p>
                      }
                    </div>
                  ))}
                  {editEndereco && (
                    <button
                      onClick={() => { dbSaveProfile({ ...perfil, ...perfilEdit }); setPerfil({ ...perfil, ...perfilEdit }); setEditEndereco(false) }}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition-colors mt-1"
                    >
                      Salvar endereço
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
                  { key: 'todos',  label: 'Todos'   },
                  { key: 'troca',  label: '🔁 Trocas' },
                  { key: 'venda',  label: '💰 Vendas' },
                  { key: 'doacao', label: '💜 Doações' },
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
                  <p className="text-xs text-slate-400">{pedidos.filter(p => filtroPedido === 'todos' || p.tipo === filtroPedido).length} registros</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {pedidos
                    .filter(p => filtroPedido === 'todos' || p.tipo === filtroPedido)
                    .map(p => {
                      const cfg = TYPE_CONFIG[p.tipo]
                      const statusCfg = p.status === 'concluido'
                        ? { label: 'Concluído', color: 'text-green-600' }
                        : p.status === 'pendente'
                        ? { label: 'Pendente',  color: 'text-amber-600' }
                        : { label: 'Cancelado', color: 'text-red-500'   }
                      return (
                        <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{p.fig}</p>
                            <p className="text-xs text-slate-400">com {p.contraparte}</p>
                            {p.enderecoEntrega && (
                              <p className="text-[10px] text-slate-300 truncate mt-0.5">📍 {p.enderecoEntrega}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-slate-400">{p.data}</p>
                            <p className={`text-xs font-medium ${statusCfg.color}`}>{statusCfg.label}</p>
                            {p.valor && <p className="text-xs font-bold text-green-600">R$ {p.valor.toFixed(2).replace('.',',')}</p>}
                            {p.status === 'concluido' && !avaliacaoEnviada?.includes(p.id) && (
                              <button
                                onClick={() => { setAvaliacaoModal(p); setEstrelas(5) }}
                                className="text-[10px] text-amber-600 font-semibold hover:underline mt-0.5 block"
                              >
                                ⭐ Avaliar
                              </button>
                            )}
                            {avaliacaoEnviada?.includes(p.id) && (
                              <p className="text-[10px] text-green-600 font-medium mt-0.5">✓ Avaliado</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
                {pedidos.filter(p => filtroPedido === 'todos' || p.tipo === filtroPedido).length === 0 && (
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

      {/* Modal avaliação */}
      {avaliacaoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAvaliacaoModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadein">
            <p className="font-black text-slate-800 text-lg mb-1">Avaliar transação</p>
            <p className="text-sm text-slate-500 mb-4">
              Como foi sua experiência com <span className="font-semibold">{avaliacaoModal.contraparte}</span>?
            </p>
            <div className="flex justify-center gap-2 mb-4">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setEstrelas(n)}
                  className={`text-3xl transition-all ${n <= estrelas ? 'opacity-100 scale-110' : 'opacity-30'}`}>
                  ⭐
                </button>
              ))}
            </div>
            <textarea
              placeholder="Comentário opcional..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setAvaliacaoModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600">
                Cancelar
              </button>
              <button onClick={enviarAvaliacao}
                className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold">
                Enviar avaliação
              </button>
            </div>
          </div>
        </div>
      )}

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
              <button onClick={async () => { await signOut(); router.push('/') }}
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
