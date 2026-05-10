'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

type User = {
  id: string
  email: string
  created_at: string
  last_sign_in: string | null
  provider: string
  nome: string
  telefone: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  aceitou_termos: boolean
  aceitou_privacidade: boolean
  profile_complete: boolean
  banned: boolean
  banned_at: string | null
  banned_reason: string | null
  plano: string
  plano_expira: string | null
  plano_expirado: boolean
}

type Stats = {
  totalUsers: number
  totalAnuncios: number
  totalColadas: number
  totalPropostas: number
  totalPedidos: number
  completeProfiles: number
  bannedUsers: number
  onlineHoje: number
}

type Anuncio = {
  id: string
  user_id: string
  user_nome: string
  tipo: string
  album_id: string
  sid: string
  nome: string | null
  preco: number | null
  created_at: string
}

type Proposta = {
  id: string
  de_user_id: string
  para_user_id: string
  de_nome: string
  para_nome: string
  status: string
  created_at: string
}

type AdminLog = {
  id: string
  action: string
  target_id: string | null
  details: string | null
  created_at: string
}

type Props = {
  users: User[]
  stats: Stats
  anuncios: Anuncio[]
  propostas: Proposta[]
  cadastrosPorDia: Record<string, number>
  ufDistrib: { uf: string; count: number }[]
  adminLogs: AdminLog[]
  siteSettings: Record<string, string>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function fmtDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function PlanoBadge({ plano, expirado }: { plano: string; expirado: boolean }) {
  if (plano === 'anual') {
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${expirado ? 'bg-slate-500/20 text-slate-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
        {expirado ? 'anual expirado' : '★ anual'}
      </span>
    )
  }
  if (plano === 'mensal') {
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${expirado ? 'bg-slate-500/20 text-slate-400' : 'bg-blue-500/20 text-blue-400'}`}>
        {expirado ? 'mensal expirado' : '● mensal'}
      </span>
    )
  }
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
      free
    </span>
  )
}

function BanBadge() {
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
      🚫 banido
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pendente:  'bg-yellow-500/20 text-yellow-400',
    aceita:    'bg-green-500/20 text-green-400',
    recusada:  'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-slate-600/20 text-slate-400'}`}>
      {status}
    </span>
  )
}

function Avatar({ name, email }: { name: string; email: string }) {
  return (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
      <span className="text-white text-xs font-black">
        {(name || email).slice(0, 1).toUpperCase()}
      </span>
    </div>
  )
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
}

// ─── Bar chart CSS ────────────────────────────────────────────────────────────

function BarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).slice(-14)
  const max = Math.max(...entries.map(([, v]) => v), 1)
  return (
    <div className="flex items-end gap-0.5 h-24 w-full">
      {entries.map(([day, count]) => (
        <div key={day} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div
            className="w-full rounded-t bg-orange-500/70 group-hover:bg-orange-500 transition-colors"
            style={{ height: `${(count / max) * 88}px` }}
          />
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            {day.slice(5)}: {count}
          </div>
        </div>
      ))}
    </div>
  )
}

function HBarChart({ data }: { data: { uf: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="space-y-2">
      {data.map(({ uf, count }) => (
        <div key={uf} className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-6 flex-shrink-0 text-right font-bold">{uf}</span>
          <div className="flex-1 h-5 bg-slate-800 rounded-lg overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-lg transition-all"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 w-6 flex-shrink-0">{count}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Tab button ───────────────────────────────────────────────────────────────

type TabKey = 'overview' | 'users' | 'anuncios' | 'propostas' | 'settings'

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
        active
          ? 'bg-orange-500 text-white'
          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AdminDashboard({
  users,
  stats,
  anuncios,
  propostas,
  cadastrosPorDia,
  ufDistrib,
  adminLogs,
  siteSettings,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('overview')

  // Users tab state
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editTelefone, setEditTelefone] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [planUser, setPlanUser] = useState<User | null>(null)
  const [planValue, setPlanValue] = useState('free')
  const [planMeses, setPlanMeses] = useState(1)
  const [planLoading, setPlanLoading] = useState(false)
  const [banLoading, setBanLoading] = useState<string | null>(null)
  const [banModal, setBanModal] = useState<User | null>(null)
  const [banReason, setBanReason] = useState('')

  // Anuncios tab state
  const [anuncioFilter, setAnuncioFilter] = useState<'todos' | 'tenho' | 'preciso'>('todos')
  const [anuncioAlbum, setAnuncioAlbum] = useState('')
  const [deletingAnuncio, setDeletingAnuncio] = useState<string | null>(null)

  // Settings tab state
  const [maintenance, setMaintenance] = useState(siteSettings.maintenance_mode === 'true')
  const [announcement, setAnnouncement] = useState(siteSettings.global_announcement ?? '')
  const [announcementActive, setAnnouncementActive] = useState(siteSettings.announcement_active === 'true')
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [credCurrentPass, setCredCurrentPass] = useState('')
  const [credNewUser, setCredNewUser] = useState('')
  const [credNewPass, setCredNewPass] = useState('')
  const [credLoading, setCredLoading] = useState(false)
  const [credMsg, setCredMsg] = useState('')

  // ── Logout ──
  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  // ── Delete user ──
  async function deleteUser(user: User) {
    setDeleting(user.id)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      if (res.ok) {
        setConfirmDelete(null)
        router.refresh()
      } else {
        alert('Erro ao deletar usuário.')
      }
    } finally {
      setDeleting(null)
    }
  }

  // ── Edit user ──
  function openEditUser(user: User) {
    setEditUser(user)
    setEditNome(user.nome)
    setEditEmail(user.email)
    setEditTelefone(user.telefone)
  }

  async function submitEditUser() {
    if (!editUser) return
    setEditLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editUser.id, nome: editNome, email: editEmail, telefone: editTelefone }),
      })
      if (res.ok) {
        setEditUser(null)
        router.refresh()
      } else {
        const d = await res.json()
        alert(d.error ?? 'Erro ao editar.')
      }
    } finally {
      setEditLoading(false)
    }
  }

  // ── Ban/unban ──
  async function toggleBan(user: User, banned: boolean, reason?: string) {
    setBanLoading(user.id)
    try {
      const res = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, banned, reason }),
      })
      if (res.ok) {
        setBanModal(null)
        router.refresh()
      } else {
        alert('Erro ao alterar ban.')
      }
    } finally {
      setBanLoading(null)
    }
  }

  // ── Set plan ──
  async function submitPlan() {
    if (!planUser) return
    setPlanLoading(true)
    try {
      const res = await fetch('/api/admin/users/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: planUser.id, plano: planValue, meses: planMeses }),
      })
      if (res.ok) {
        setPlanUser(null)
        router.refresh()
      } else {
        alert('Erro ao definir plano.')
      }
    } finally {
      setPlanLoading(false)
    }
  }

  // ── Delete anuncio ──
  async function deleteAnuncio(id: string) {
    if (!confirm('Deletar este anúncio?')) return
    setDeletingAnuncio(id)
    try {
      const res = await fetch('/api/admin/anuncios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anuncioId: id }),
      })
      if (res.ok) router.refresh()
      else alert('Erro ao deletar anúncio.')
    } finally {
      setDeletingAnuncio(null)
    }
  }

  // ── Save settings ──
  async function saveSetting(key: string, value: string) {
    setSettingsLoading(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
    } finally {
      setSettingsLoading(false)
    }
  }

  async function toggleMaintenance() {
    const next = !maintenance
    setMaintenance(next)
    await saveSetting('maintenance_mode', String(next))
  }

  async function toggleAnnouncement() {
    const next = !announcementActive
    setAnnouncementActive(next)
    await saveSetting('announcement_active', String(next))
  }

  async function saveAnnouncement() {
    await saveSetting('global_announcement', announcement)
    alert('Aviso global salvo.')
  }

  // ── Update credentials ──
  async function submitCredentials() {
    setCredLoading(true)
    setCredMsg('')
    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: credCurrentPass, newUsername: credNewUser, newPassword: credNewPass }),
      })
      const d = await res.json()
      if (res.ok) {
        setCredMsg(d.message ?? 'Credenciais salvas.')
        setCredCurrentPass('')
        setCredNewUser('')
        setCredNewPass('')
      } else {
        setCredMsg(d.error ?? 'Erro.')
      }
    } finally {
      setCredLoading(false)
    }
  }

  // ── Export CSV ──
  function exportCSV() {
    window.open('/api/admin/export-users', '_blank')
  }

  // ── Filtered data ──
  const filteredUsers = users.filter(u =>
    !search ||
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.cidade.toLowerCase().includes(search.toLowerCase())
  )

  const filteredAnuncios = anuncios.filter(a => {
    if (anuncioFilter !== 'todos' && a.tipo !== anuncioFilter) return false
    if (anuncioAlbum && !a.album_id.toLowerCase().includes(anuncioAlbum.toLowerCase())) return false
    return true
  })

  // ── Stat cards ──
  const STAT_CARDS = [
    { label: 'Usuários',        value: stats.totalUsers,        icon: '👥', color: 'from-blue-500 to-blue-600'     },
    { label: 'Perfis completos',value: stats.completeProfiles,  icon: '✅', color: 'from-green-500 to-green-600'   },
    { label: 'Online hoje',     value: stats.onlineHoje,        icon: '🟢', color: 'from-emerald-500 to-emerald-600'},
    { label: 'Banidos',         value: stats.bannedUsers,       icon: '🚫', color: 'from-red-500 to-red-600'       },
    { label: 'Figurinhas',      value: stats.totalColadas,      icon: '🃏', color: 'from-purple-500 to-purple-600' },
    { label: 'Anúncios',        value: stats.totalAnuncios,     icon: '📢', color: 'from-orange-500 to-orange-600' },
    { label: 'Propostas',       value: stats.totalPropostas,    icon: '🔁', color: 'from-cyan-500 to-cyan-600'     },
    { label: 'Pedidos',         value: stats.totalPedidos,      icon: '📦', color: 'from-rose-500 to-rose-600'     },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🛡️</span>
            <span className="font-black text-white">Completando <span className="text-orange-400 font-normal text-sm">Admin</span></span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" className="text-xs text-slate-400 hover:text-white transition-colors">
              Ver site →
            </a>
            <button onClick={logout} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300 transition-colors">
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          <TabBtn active={tab === 'overview'}  onClick={() => setTab('overview')}>📊 Visão Geral</TabBtn>
          <TabBtn active={tab === 'users'}     onClick={() => setTab('users')}>👥 Usuários ({stats.totalUsers})</TabBtn>
          <TabBtn active={tab === 'anuncios'}  onClick={() => setTab('anuncios')}>📢 Anúncios ({stats.totalAnuncios})</TabBtn>
          <TabBtn active={tab === 'propostas'} onClick={() => setTab('propostas')}>🔁 Propostas ({stats.totalPropostas})</TabBtn>
          <TabBtn active={tab === 'settings'}  onClick={() => setTab('settings')}>⚙️ Configurações</TabBtn>
        </div>

        {/* ══════════════════════════════════════════════════════════
            TAB 1 — VISÃO GERAL
        ══════════════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="space-y-6">

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {STAT_CARDS.map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-3 text-center shadow-lg`}>
                  <div className="text-xl mb-0.5">{s.icon}</div>
                  <div className="text-2xl font-black">{s.value.toLocaleString('pt-BR')}</div>
                  <div className="text-[10px] text-white/70 mt-0.5 font-medium leading-tight">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Gráfico de cadastros */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                <p className="font-bold text-white mb-3 text-sm">Cadastros — últimos 14 dias</p>
                <BarChart data={cadastrosPorDia} />
                <div className="flex justify-between mt-2 text-[10px] text-slate-600">
                  <span>{Object.keys(cadastrosPorDia)[0]?.slice(5)}</span>
                  <span>{Object.keys(cadastrosPorDia)[Object.keys(cadastrosPorDia).length - 1]?.slice(5)}</span>
                </div>
              </div>

              {/* Distribuição por UF */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                <p className="font-bold text-white mb-3 text-sm">Top 5 estados</p>
                {ufDistrib.length > 0
                  ? <HBarChart data={ufDistrib} />
                  : <p className="text-slate-500 text-sm">Sem dados de localização.</p>
                }
              </div>
            </div>

            {/* Últimos 8 cadastros */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <p className="font-bold text-white">Últimos cadastros</p>
                <button onClick={() => setTab('users')} className="text-xs text-orange-400 hover:underline">
                  Ver todos →
                </button>
              </div>
              <div className="divide-y divide-slate-800">
                {users.slice(0, 8).map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={u.nome} email={u.email} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{u.nome || '(sem nome)'}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-0.5">
                      <p className="text-xs text-slate-400">{fmtDate(u.created_at)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${u.profile_complete ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {u.profile_complete ? 'completo' : 'incompleto'}
                      </span>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Nenhum usuário cadastrado.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2 — USUÁRIOS
        ══════════════════════════════════════════════════════════ */}
        {tab === 'users' && (
          <div className="space-y-4">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou cidade..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={exportCSV}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors whitespace-nowrap"
              >
                ⬇ Exportar CSV
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
            </p>

            {/* Tabela */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-semibold">Usuário</th>
                      <th className="text-left px-4 py-3 font-semibold">Localização</th>
                      <th className="text-left px-4 py-3 font-semibold">Telefone</th>
                      <th className="text-left px-4 py-3 font-semibold">Cadastro</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                      <th className="text-right px-4 py-3 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className={`hover:bg-slate-800/50 transition-colors ${u.banned ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={u.nome} email={u.email} />
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate max-w-[160px]">{u.nome || '(sem nome)'}</p>
                              <p className="text-xs text-slate-400 truncate max-w-[160px]">{u.email}</p>
                              <p className="text-[10px] text-slate-600 capitalize">{u.provider}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <p className="text-xs">{[u.bairro, u.cidade, u.uf].filter(Boolean).join(', ') || '—'}</p>
                          {u.cep && <p className="text-[10px] text-slate-500">{u.cep}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-xs">{u.telefone || '—'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          <p>{fmtDate(u.created_at)}</p>
                          {u.last_sign_in && <p className="text-slate-600">Último: {fmtDate(u.last_sign_in)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${u.profile_complete ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {u.profile_complete ? '✓ completo' : '⚠ incompleto'}
                            </span>
                            <PlanoBadge plano={u.plano} expirado={u.plano_expirado} />
                            {u.banned && <BanBadge />}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button onClick={() => setSelectedUser(u)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Ver</button>
                            <button onClick={() => openEditUser(u)} className="text-xs text-slate-400 hover:text-white transition-colors">Editar</button>
                            <button onClick={() => { setPlanUser(u); setPlanValue(u.plano); setPlanMeses(1) }} className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors">Plano</button>
                            <button
                              onClick={() => {
                                if (u.banned) {
                                  toggleBan(u, false)
                                } else {
                                  setBanModal(u)
                                  setBanReason('')
                                }
                              }}
                              disabled={banLoading === u.id}
                              className={`text-xs transition-colors ${u.banned ? 'text-green-400 hover:text-green-300' : 'text-orange-400 hover:text-orange-300'}`}
                            >
                              {banLoading === u.id ? <Spinner /> : u.banned ? 'Desbanir' : 'Banir'}
                            </button>
                            <button onClick={() => setConfirmDelete(u)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Deletar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-slate-500">Nenhum usuário encontrado.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 3 — ANÚNCIOS
        ══════════════════════════════════════════════════════════ */}
        {tab === 'anuncios' && (
          <div className="space-y-4">

            {/* Filtros */}
            <div className="flex flex-wrap gap-3">
              <div className="flex gap-2">
                {(['todos', 'tenho', 'preciso'] as const).map(f => (
                  <button key={f} onClick={() => setAnuncioFilter(f)}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${anuncioFilter === f ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                    {f === 'todos' ? 'Todos' : f === 'tenho' ? 'Tenho' : 'Preciso'}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Filtrar por álbum..."
                value={anuncioAlbum}
                onChange={e => setAnuncioAlbum(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <p className="text-xs text-slate-500">{filteredAnuncios.length} anúncio{filteredAnuncios.length !== 1 ? 's' : ''}</p>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-semibold">Figurinha</th>
                      <th className="text-left px-4 py-3 font-semibold">Tipo</th>
                      <th className="text-left px-4 py-3 font-semibold">Usuário</th>
                      <th className="text-left px-4 py-3 font-semibold">Álbum</th>
                      <th className="text-left px-4 py-3 font-semibold">Preço</th>
                      <th className="text-left px-4 py-3 font-semibold">Data</th>
                      <th className="text-right px-4 py-3 font-semibold">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredAnuncios.map(a => (
                      <tr key={a.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-orange-400 text-xs">{a.sid}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.tipo === 'tenho' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {a.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-xs">{a.user_nome || '(sem nome)'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{a.album_id}</td>
                        <td className="px-4 py-3 text-slate-300 text-xs">
                          {a.preco ? `R$ ${Number(a.preco).toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(a.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => deleteAnuncio(a.id)}
                            disabled={deletingAnuncio === a.id}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            {deletingAnuncio === a.id ? <Spinner /> : 'Deletar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAnuncios.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-slate-500">Nenhum anúncio encontrado.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 4 — PROPOSTAS
        ══════════════════════════════════════════════════════════ */}
        {tab === 'propostas' && (
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-semibold">De</th>
                      <th className="text-left px-4 py-3 font-semibold">Para</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                      <th className="text-left px-4 py-3 font-semibold">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {propostas.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-slate-300 text-xs">{p.de_nome || '(sem nome)'}</td>
                        <td className="px-4 py-3 text-slate-300 text-xs">{p.para_nome || '(sem nome)'}</td>
                        <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{fmt(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {propostas.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-slate-500">Nenhuma proposta encontrada.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 5 — CONFIGURAÇÕES
        ══════════════════════════════════════════════════════════ */}
        {tab === 'settings' && (
          <div className="space-y-6 max-w-2xl">

            {/* Modo manutenção */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">Modo Manutenção</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Desativa o acesso dos usuários ao site.</p>
                </div>
                <button
                  onClick={toggleMaintenance}
                  disabled={settingsLoading}
                  className={`relative w-12 h-6 rounded-full transition-colors ${maintenance ? 'bg-orange-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${maintenance ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <p className="text-xs mt-2 font-semibold">
                Status: <span className={maintenance ? 'text-orange-400' : 'text-green-400'}>{maintenance ? 'MANUTENÇÃO ATIVA' : 'Site operacional'}</span>
              </p>
            </div>

            {/* Aviso global */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">Aviso Global</h3>
                <button
                  onClick={toggleAnnouncement}
                  disabled={settingsLoading}
                  className={`relative w-12 h-6 rounded-full transition-colors ${announcementActive ? 'bg-orange-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${announcementActive ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <textarea
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
                rows={3}
                placeholder="Mensagem exibida para todos os usuários..."
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
              <button
                onClick={saveAnnouncement}
                disabled={settingsLoading}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-bold transition-colors"
              >
                Salvar aviso
              </button>
            </div>

            {/* Credenciais */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-3">
              <h3 className="font-bold text-white">Alterar Credenciais de Admin</h3>
              <p className="text-xs text-slate-500">As credenciais são salvas no banco. Para aplicar efetivamente, atualize as variáveis de ambiente ADMIN_USERNAME e ADMIN_PASSWORD.</p>

              {credMsg && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-blue-300">
                  {credMsg}
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="Senha atual"
                  value={credCurrentPass}
                  onChange={e => setCredCurrentPass(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="text"
                  placeholder="Novo usuário"
                  value={credNewUser}
                  onChange={e => setCredNewUser(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="password"
                  placeholder="Nova senha"
                  value={credNewPass}
                  onChange={e => setCredNewPass(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={submitCredentials}
                  disabled={credLoading}
                  className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {credLoading ? <><Spinner /> Salvando...</> : 'Salvar credenciais'}
                </button>
              </div>
            </div>

            {/* Logs admin */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800">
                <h3 className="font-bold text-white">Logs de Ações</h3>
                <p className="text-xs text-slate-400 mt-0.5">Últimas 50 ações do painel admin.</p>
              </div>
              <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
                {adminLogs.length === 0 && (
                  <p className="text-center text-slate-500 py-8 text-sm">Nenhuma ação registrada.</p>
                )}
                {adminLogs.map(log => (
                  <div key={log.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-orange-400 uppercase tracking-wide">{log.action.replace(/_/g, ' ')}</p>
                        {log.details && <p className="text-xs text-slate-300 mt-0.5 truncate">{log.details}</p>}
                        {log.target_id && <p className="text-[10px] text-slate-600 mt-0.5 font-mono truncate">{log.target_id}</p>}
                      </div>
                      <p className="text-[10px] text-slate-500 flex-shrink-0">{fmt(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════ */}

      {/* Modal — Detalhes do usuário */}
      {selectedUser && (
        <Modal onClose={() => setSelectedUser(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 rounded-t-2xl">
              <h3 className="font-black text-white">Detalhes do usuário</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-2.5">
              {[
                { label: 'ID',           value: selectedUser.id },
                { label: 'Nome',         value: selectedUser.nome || '(sem nome)' },
                { label: 'E-mail',       value: selectedUser.email },
                { label: 'Telefone',     value: selectedUser.telefone || '—' },
                { label: 'Bairro',       value: selectedUser.bairro || '—' },
                { label: 'Cidade/UF',    value: [selectedUser.cidade, selectedUser.uf].filter(Boolean).join(' / ') || '—' },
                { label: 'CEP',          value: selectedUser.cep || '—' },
                { label: 'Provider',     value: selectedUser.provider },
                { label: 'Plano',        value: `${selectedUser.plano}${selectedUser.plano_expira ? ` (expira ${fmtDate(selectedUser.plano_expira)})` : ''}` },
                { label: 'Banido',       value: selectedUser.banned ? `Sim — ${selectedUser.banned_reason || 'sem motivo'} (${fmtDate(selectedUser.banned_at)})` : 'Não' },
                { label: 'Cadastro',     value: fmt(selectedUser.created_at) },
                { label: 'Último acesso',value: fmt(selectedUser.last_sign_in) },
                { label: 'Termos',       value: selectedUser.aceitou_termos ? '✅ Aceito' : '❌ Não aceito' },
                { label: 'Privacidade',  value: selectedUser.aceitou_privacidade ? '✅ Aceita' : '❌ Não aceita' },
              ].map(row => (
                <div key={row.label} className="flex gap-3">
                  <span className="text-xs text-slate-500 w-28 flex-shrink-0 pt-0.5">{row.label}</span>
                  <span className="text-sm text-slate-200 break-all">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5 flex flex-wrap gap-2">
              <button onClick={() => { openEditUser(selectedUser); setSelectedUser(null) }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors">
                Editar
              </button>
              <button onClick={() => { setPlanUser(selectedUser); setPlanValue(selectedUser.plano); setPlanMeses(1); setSelectedUser(null) }}
                className="flex-1 py-2.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-sm font-semibold border border-yellow-500/30 transition-colors">
                Plano
              </button>
              <button onClick={() => { setConfirmDelete(selectedUser); setSelectedUser(null) }}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold border border-red-500/30 transition-colors">
                Deletar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal — Editar usuário */}
      {editUser && (
        <Modal onClose={() => setEditUser(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="font-black text-white">Editar usuário</h3>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Nome</label>
                <input
                  type="text"
                  value={editNome}
                  onChange={e => setEditNome(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">E-mail</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Telefone</label>
                <input
                  type="tel"
                  value={editTelefone}
                  onChange={e => setEditTelefone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={() => setEditUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors">
                Cancelar
              </button>
              <button
                onClick={submitEditUser}
                disabled={editLoading}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                {editLoading ? <><Spinner /> Salvando...</> : 'Salvar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal — Definir plano */}
      {planUser && (
        <Modal onClose={() => setPlanUser(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="font-black text-white">Definir plano</h3>
              <button onClick={() => setPlanUser(null)} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-400">
                Usuário: <span className="text-white font-semibold">{planUser.nome || planUser.email}</span>
              </p>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Plano</label>
                <div className="flex gap-2">
                  {(['free', 'mensal', 'anual'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPlanValue(p)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border ${
                        planValue === p
                          ? p === 'anual'  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                          : p === 'mensal' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                          :                  'bg-slate-600 text-white border-slate-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {planValue !== 'free' && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Meses ({planMeses})</label>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    value={planMeses}
                    onChange={e => setPlanMeses(Number(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>1 mês</span>
                    <span>24 meses</span>
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={() => setPlanUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors">
                Cancelar
              </button>
              <button
                onClick={submitPlan}
                disabled={planLoading}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                {planLoading ? <><Spinner /> Salvando...</> : 'Aplicar plano'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal — Banir usuário */}
      {banModal && (
        <Modal onClose={() => setBanModal(null)}>
          <div className="bg-slate-900 border border-orange-500/30 rounded-2xl w-full shadow-2xl p-6">
            <div className="text-4xl text-center mb-3">🚫</div>
            <h3 className="font-black text-white text-center text-lg mb-2">Banir usuário?</h3>
            <p className="text-slate-400 text-sm text-center mb-3">
              <strong className="text-white">{banModal.nome || banModal.email}</strong>
            </p>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Motivo (opcional)</label>
              <input
                type="text"
                placeholder="Ex: spam, comportamento inadequado..."
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setBanModal(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => toggleBan(banModal, true, banReason)}
                disabled={banLoading === banModal.id}
                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                {banLoading === banModal.id ? <><Spinner /> Banindo...</> : '🚫 Banir'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal — Confirmar delete */}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)}>
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full shadow-2xl p-6">
            <div className="text-4xl text-center mb-3">⚠️</div>
            <h3 className="font-black text-white text-center text-lg mb-2">Deletar usuário?</h3>
            <p className="text-slate-400 text-sm text-center mb-1">
              <strong className="text-white">{confirmDelete.nome || confirmDelete.email}</strong>
            </p>
            <p className="text-xs text-slate-500 text-center mb-5">
              Todos os dados (perfil, figurinhas, anúncios, propostas) serão apagados. Ação irreversível.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => deleteUser(confirmDelete)}
                disabled={deleting === confirmDelete.id}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                {deleting === confirmDelete.id ? <><Spinner /> Deletando...</> : '🗑️ Deletar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}
