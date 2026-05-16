'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ALBUMS_REGISTRY } from '@/data/albums-registry'

let SESSION_TIMEOUT_MS = 30 * 60 * 1000  // 30 minutos (sobrescrito por localStorage)
const SESSION_WARN_MS  =  5 * 60 * 1000  // avisa 5 min antes

const USERS_PER_PAGE = 25

// ─── Types ───────────────────────────────────────────────────────────────────

interface Toast { id: number; msg: string; type: 'ok' | 'err' | 'info' }

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
  totalPro: number
  totalFree: number
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
  initialTotalUsers: number
  initialTotalAnuncios: number
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
  if (plano === 'pro' || plano === 'anual' || plano === 'mensal') {
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${expirado ? 'bg-slate-500/20 text-slate-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
        {expirado ? 'PRO expirado' : '★ PRO'}
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

type TabKey = 'overview' | 'users' | 'anuncios' | 'propostas' | 'logs' | 'bancas' | 'settings'

type Banca = {
  id: string; slug: string; nome: string; responsavel: string | null
  telefone: string | null; email: string | null; endereco: string
  bairro: string | null; cidade: string; uf: string; cep: string | null
  horario: string | null; descricao: string | null; foto_url: string | null
  destaque: boolean; ativa: boolean; total_trocas: number
  lat: number | null; lng: number | null
}

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

// ─── Toast container ──────────────────────────────────────────────────────────

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={[
            'px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl text-white pointer-events-auto',
            'transition-all duration-300 translate-x-0',
            t.type === 'ok'   ? 'bg-green-600 border border-green-500/50' :
            t.type === 'err'  ? 'bg-red-600 border border-red-500/50' :
                                'bg-blue-600 border border-blue-500/50',
          ].join(' ')}
        >
          {t.type === 'ok' ? '✓ ' : t.type === 'err' ? '✕ ' : 'ℹ '}{t.msg}
        </div>
      ))}
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
  initialTotalUsers,
  initialTotalAnuncios,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('overview')

  // ── Toast system ──
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = useRef(0)

  const showToast = useCallback((msg: string, type: 'ok' | 'err' | 'info' = 'info') => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  // ── Server-side pagination state — users ──
  const [usersData, setUsersData]         = useState<User[]>(users)
  const [totalUsers, setTotalUsers]       = useState(initialTotalUsers)
  const [usersLoading, setUsersLoading]   = useState(false)

  // ── Server-side pagination state — anuncios ──
  const [anunciosData, setAnunciosData]         = useState<Anuncio[]>(anuncios)
  const [totalAnuncios, setTotalAnuncios]       = useState(initialTotalAnuncios)
  const [anunciosLoading, setAnunciosLoading]   = useState(false)
  const [anuncioPage, setAnuncioPage]           = useState(1)

  // ── Refresh state ──
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    router.refresh()
    await new Promise(r => setTimeout(r, 1200))
    setRefreshing(false)
    setLastRefresh(new Date())
  }, [router])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
      setLastRefresh(new Date())
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [router])

  // Users tab state
  const [search, setSearch] = useState('')
  const [filterPlano, setFilterPlano] = useState<'todos' | 'pro' | 'free'>('todos')
  const [filterUF, setFilterUF] = useState('')
  const [filterComplete, setFilterComplete] = useState<'todos' | 'completo' | 'incompleto'>('todos')
  const [filterBanned, setFilterBanned] = useState<'todos' | 'ativos' | 'banidos'>('todos')
  const [sortBy, setSortBy] = useState<'created_at' | 'nome' | 'last_sign_in'>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [usersPage, setUsersPage] = useState(1)

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

  // Bancas tab state
  const [bancas, setBancas]               = useState<Banca[]>([])
  const [bancasLoading, setBancasLoading] = useState(false)
  const [bancaForm, setBancaForm]         = useState(false)
  const [bancaEditId, setBancaEditId]     = useState<string | null>(null)
  const [bancaSaving, setBancaSaving]     = useState(false)
  const [geocoding, setGeocoding]         = useState(false)
  const [geocodeResult, setGeocodeResult] = useState<{ atualizadas: number; total: number; erros: string[] } | null>(null)
  const [bancaData, setBancaData]         = useState({
    nome: '', responsavel: '', telefone: '', email: '', endereco: '',
    bairro: '', cidade: '', uf: 'SP', cep: '', horario: '', descricao: '',
    ativa: true, destaque: false,
  })

  const fetchBancas = useCallback(async () => {
    setBancasLoading(true)
    const r = await fetch('/api/bancas?todas=1')
    const d = await r.json()
    setBancas(d.bancas ?? [])
    setBancasLoading(false)
  }, [])

  useEffect(() => { if (tab === 'bancas') fetchBancas() }, [tab, fetchBancas])

  function resetBancaForm() {
    setBancaData({ nome:'', responsavel:'', telefone:'', email:'', endereco:'', bairro:'', cidade:'', uf:'SP', cep:'', horario:'', descricao:'', ativa:true, destaque:false })
    setBancaEditId(null)
    setBancaForm(false)
  }

  async function saveBanca() {
    if (!bancaData.nome || !bancaData.endereco || !bancaData.cidade) {
      showToast('Nome, endereço e cidade são obrigatórios', 'err'); return
    }
    setBancaSaving(true)
    const url    = bancaEditId ? `/api/bancas/${bancaEditId}` : '/api/bancas'
    const method = bancaEditId ? 'PATCH' : 'POST'
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bancaData) })
    setBancaSaving(false)
    if (!r.ok) { showToast('Erro ao salvar banca', 'err'); return }
    showToast(bancaEditId ? 'Banca atualizada!' : 'Banca criada!', 'ok')
    resetBancaForm()
    fetchBancas()
  }

  async function deleteBanca(id: string) {
    if (!confirm('Remover esta banca?')) return
    const r = await fetch(`/api/bancas/${id}`, { method: 'DELETE' })
    if (r.ok) { showToast('Banca removida', 'ok'); fetchBancas() }
    else showToast('Erro ao remover', 'err')
  }

  async function geocodificarBancas() {
    if (!confirm('Vai geocodificar todas as bancas sem coordenadas. Pode demorar (1 seg por banca). Continuar?')) return
    setGeocoding(true)
    setGeocodeResult(null)
    const r = await fetch('/api/admin/geocode-bancas', { method: 'POST' })
    const d = await r.json()
    setGeocoding(false)
    if (r.ok) {
      setGeocodeResult(d)
      showToast(`✅ ${d.atualizadas} de ${d.total} bancas geocodificadas`, 'ok')
      fetchBancas()
    } else {
      showToast('Erro ao geocodificar', 'err')
    }
  }

  async function toggleBanca(b: Banca, field: 'ativa' | 'destaque') {
    await fetch(`/api/bancas/${b.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !b[field] })
    })
    fetchBancas()
  }

  function editBanca(b: Banca) {
    setBancaData({
      nome: b.nome, responsavel: b.responsavel ?? '', telefone: b.telefone ?? '',
      email: b.email ?? '', endereco: b.endereco, bairro: b.bairro ?? '',
      cidade: b.cidade, uf: b.uf, cep: b.cep ?? '', horario: b.horario ?? '',
      descricao: b.descricao ?? '', ativa: b.ativa, destaque: b.destaque,
    })
    setBancaEditId(b.id)
    setBancaForm(true)
  }

  // Anuncios tab state
  const [anuncioFilter, setAnuncioFilter] = useState<'todos' | 'tenho' | 'preciso'>('todos')
  const [anuncioAlbum, setAnuncioAlbum] = useState('')
  const [filterAnuncioUser, setFilterAnuncioUser] = useState('')
  const [deletingAnuncio, setDeletingAnuncio] = useState<string | null>(null)
  const [confirmAnuncio, setConfirmAnuncio] = useState<string | null>(null)

  // Session timeout state
  const [sessionWarning, setSessionWarning] = useState(false)
  const [minsLeft, setMinsLeft] = useState(30)
  const lastActivityRef = useRef(Date.now())

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

  // Session timeout configurable
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState(30)

  // Notify modal
  const [notifyModal, setNotifyModal] = useState(false)
  const [notifyMsg, setNotifyMsg] = useState('')
  const [notifyLoading, setNotifyLoading] = useState(false)

  // Album available toggles (local state)
  const [albumAvail, setAlbumAvail] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    ALBUMS_REGISTRY.forEach(a => {
      init[a.id] = siteSettings[`album_${a.id}_available`] !== 'false' && a.available
    })
    return init
  })

  // Load session timeout from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('admin_session_timeout')
    if (stored) {
      const val = parseInt(stored, 10)
      if (!isNaN(val) && val >= 5 && val <= 120) {
        setSessionTimeoutMin(val)
        SESSION_TIMEOUT_MS = val * 60 * 1000
      }
    }
  }, [])

  // ── Logout ──
  const logout = useCallback(async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }, [router])

  // ── Timeout de inatividade ──
  useEffect(() => {
    const resetTimer = () => { lastActivityRef.current = Date.now() }
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))

    const tick = setInterval(() => {
      const idle      = Date.now() - lastActivityRef.current
      const remaining = SESSION_TIMEOUT_MS - idle

      if (remaining <= 0) {
        logout()
      } else if (remaining <= SESSION_WARN_MS) {
        setSessionWarning(true)
        setMinsLeft(Math.ceil(remaining / 60_000))
      } else {
        setSessionWarning(false)
      }
    }, 30_000) // verifica a cada 30s

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      clearInterval(tick)
    }
  }, [logout])

  // Reset usersPage when filters change
  useEffect(() => {
    setUsersPage(1)
  }, [search, filterPlano, filterUF, filterComplete, filterBanned, sortBy, sortDir])

  // ── fetchUsers — server-side ──
  const fetchUsers = useCallback(async (
    page: number,
    searchVal: string,
    planoVal: string,
    ufVal: string,
    completeVal: string,
    bannedVal: string,
    sortByVal: string,
    sortDirVal: string,
  ) => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams({
        page:     String(page),
        limit:    '25',
        search:   searchVal,
        plano:    planoVal,
        uf:       ufVal,
        complete: completeVal,
        banned:   bannedVal,
        sortBy:   sortByVal,
        sortDir:  sortDirVal,
      })
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsersData(data.users ?? [])
        setTotalUsers(data.total ?? 0)
      }
    } finally {
      setUsersLoading(false)
    }
  }, [])

  // Debounce search for users
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      fetchUsers(usersPage, search, filterPlano, filterUF, filterComplete, filterBanned, sortBy, sortDir)
    }, 400)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [usersPage, search, filterPlano, filterUF, filterComplete, filterBanned, sortBy, sortDir, fetchUsers])

  // ── fetchAnuncios — server-side ──
  const fetchAnuncios = useCallback(async (
    page: number,
    tipoVal: string,
    albumVal: string,
    userVal: string,
  ) => {
    setAnunciosLoading(true)
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: '25',
        tipo:  tipoVal,
        album: albumVal,
        user:  userVal,
      })
      const res = await fetch(`/api/admin/anuncios?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAnunciosData(data.anuncios ?? [])
        setTotalAnuncios(data.total ?? 0)
      }
    } finally {
      setAnunciosLoading(false)
    }
  }, [])

  // Debounce for anuncio filters
  const anuncioDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (anuncioDebounceRef.current) clearTimeout(anuncioDebounceRef.current)
    anuncioDebounceRef.current = setTimeout(() => {
      fetchAnuncios(anuncioPage, anuncioFilter, anuncioAlbum, filterAnuncioUser)
    }, 400)
    return () => {
      if (anuncioDebounceRef.current) clearTimeout(anuncioDebounceRef.current)
    }
  }, [anuncioPage, anuncioFilter, anuncioAlbum, filterAnuncioUser, fetchAnuncios])

  // Reset anuncioPage when anuncio filters change
  useEffect(() => {
    setAnuncioPage(1)
  }, [anuncioFilter, anuncioAlbum, filterAnuncioUser])

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
        showToast('Usuário deletado com sucesso.', 'ok')
        fetchUsers(usersPage, search, filterPlano, filterUF, filterComplete, filterBanned, sortBy, sortDir)
      } else {
        showToast('Erro ao deletar usuário.', 'err')
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
        showToast('Usuário atualizado.', 'ok')
        fetchUsers(usersPage, search, filterPlano, filterUF, filterComplete, filterBanned, sortBy, sortDir)
      } else {
        const d = await res.json()
        showToast(d.error ?? 'Erro ao editar.', 'err')
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
        showToast(banned ? 'Usuário banido.' : 'Usuário desbanido.', 'ok')
        fetchUsers(usersPage, search, filterPlano, filterUF, filterComplete, filterBanned, sortBy, sortDir)
      } else {
        showToast('Erro ao alterar ban.', 'err')
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
        showToast('Plano atualizado.', 'ok')
        fetchUsers(usersPage, search, filterPlano, filterUF, filterComplete, filterBanned, sortBy, sortDir)
      } else {
        const d = await res.json().catch(() => ({}))
        showToast('Erro ao definir plano: ' + (d?.error ?? res.status), 'err')
      }
    } finally {
      setPlanLoading(false)
    }
  }

  // ── Delete anuncio ──
  async function deleteAnuncio(id: string) {
    setConfirmAnuncio(null)
    setDeletingAnuncio(id)
    try {
      const res = await fetch('/api/admin/anuncios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anuncioId: id }),
      })
      if (res.ok) {
        showToast('Anúncio deletado.', 'ok')
        fetchAnuncios(anuncioPage, anuncioFilter, anuncioAlbum, filterAnuncioUser)
      } else {
        showToast('Erro ao deletar anúncio.', 'err')
      }
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
    showToast('Aviso global salvo.', 'ok')
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

  // ── Notify all ──
  async function submitNotify() {
    if (!notifyMsg.trim()) return
    setNotifyLoading(true)
    try {
      await saveSetting('global_announcement', notifyMsg)
      await saveSetting('announcement_active', 'true')
      setAnnouncementActive(true)
      setAnnouncement(notifyMsg)
      setNotifyModal(false)
      setNotifyMsg('')
      showToast('Notificação enviada para todos os usuários.', 'ok')
    } finally {
      setNotifyLoading(false)
    }
  }

  // ── Toggle album availability ──
  async function toggleAlbumAvail(albumId: string) {
    const next = !albumAvail[albumId]
    setAlbumAvail(prev => ({ ...prev, [albumId]: next }))
    await saveSetting(`album_${albumId}_available`, String(next))
    showToast(`Álbum ${next ? 'ativado' : 'desativado'}.`, 'info')
  }

  // ── Save session timeout ──
  function saveSessionTimeout() {
    localStorage.setItem('admin_session_timeout', String(sessionTimeoutMin))
    SESSION_TIMEOUT_MS = sessionTimeoutMin * 60 * 1000
    showToast(`Tempo de inatividade definido: ${sessionTimeoutMin} min.`, 'ok')
  }

  // ── Server-side paginated data ──
  const isProUser = (u: User) => (u.plano === 'pro' || u.plano === 'anual' || u.plano === 'mensal') && !u.plano_expirado

  // pagedUsers comes directly from server (already filtered + paginated)
  const pagedUsers = usersData
  const totalUsersPages = Math.max(1, Math.ceil(totalUsers / USERS_PER_PAGE))

  // anunciosData comes directly from server (already filtered + paginated)
  const filteredAnuncios = anunciosData
  const totalAnunciosPages = Math.max(1, Math.ceil(totalAnuncios / 25))

  // ── Revenue metrics ──
  const totalProAtivo = stats.totalPro
  const receitaMensal = totalProAtivo * 19.90
  const taxaConversao = stats.totalUsers > 0
    ? (totalProAtivo / stats.totalUsers * 100).toFixed(1)
    : '0.0'

  // ── Stat cards ──
  const STAT_CARDS = [
    { label: 'Usuários',        value: stats.totalUsers,        icon: '👥', color: 'from-blue-500 to-blue-600'     },
    { label: '★ PRO',           value: stats.totalPro,          icon: '🏆', color: 'from-yellow-500 to-amber-600'  },
    { label: 'Free',            value: stats.totalFree,         icon: '🆓', color: 'from-slate-500 to-slate-600'   },
    { label: 'Perfis completos',value: stats.completeProfiles,  icon: '✅', color: 'from-green-500 to-green-600'   },
    { label: 'Online hoje',     value: stats.onlineHoje,        icon: '🟢', color: 'from-emerald-500 to-emerald-600'},
    { label: 'Banidos',         value: stats.bannedUsers,       icon: '🚫', color: 'from-red-500 to-red-600'       },
    { label: 'Anúncios',        value: stats.totalAnuncios,     icon: '📢', color: 'from-orange-500 to-orange-600' },
    { label: 'Propostas',       value: stats.totalPropostas,    icon: '🔁', color: 'from-cyan-500 to-cyan-600'     },
  ]

  function SortHeader({ col, label }: { col: 'created_at' | 'nome' | 'last_sign_in'; label: string }) {
    const active = sortBy === col
    return (
      <th
        className="text-left px-4 py-3 font-semibold cursor-pointer select-none hover:text-white transition-colors"
        onClick={() => {
          if (active) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
          else { setSortBy(col); setSortDir('desc') }
        }}
      >
        {label} {active ? (sortDir === 'desc' ? '↓' : '↑') : ''}
      </th>
    )
  }

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
            {sessionWarning && (
              <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-3 py-1 rounded-lg animate-pulse">
                ⚠️ Sessão expira em {minsLeft} min
              </span>
            )}
            {lastRefresh && (
              <span className="text-[10px] text-slate-600 hidden sm:block">
                Atualizado: {lastRefresh.toLocaleTimeString('pt-BR', { timeStyle: 'short' })}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Atualizar dados"
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <span className={refreshing ? 'animate-spin inline-block' : ''}>↻</span>
              {refreshing ? 'Atualizando...' : 'Refresh'}
            </button>
            <button
              onClick={() => setNotifyModal(true)}
              className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-white transition-colors"
            >
              📣 Notificar
            </button>
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
          <TabBtn active={tab === 'logs'}      onClick={() => setTab('logs')}>📋 Logs</TabBtn>
          <TabBtn active={tab === 'bancas'}    onClick={() => setTab('bancas')}>📍 Bancas ({bancas.length})</TabBtn>
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

            {/* Revenue metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-4 text-center shadow-lg">
                <div className="text-2xl mb-0.5">💰</div>
                <div className="text-2xl font-black">
                  R$ {receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-white/70 mt-0.5 font-medium">Receita Est. Mensal</div>
              </div>
              <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-4 text-center shadow-lg">
                <div className="text-2xl mb-0.5">📈</div>
                <div className="text-2xl font-black">{taxaConversao}%</div>
                <div className="text-xs text-white/70 mt-0.5 font-medium">Taxa de Conversão PRO</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-600 to-amber-700 rounded-2xl p-4 text-center shadow-lg">
                <div className="text-2xl mb-0.5">⭐</div>
                <div className="text-2xl font-black">{totalProAtivo}</div>
                <div className="text-xs text-white/70 mt-0.5 font-medium">PRO Ativo</div>
              </div>
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
                {usersData.slice(0, 8).map(u => (
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
                {usersData.length === 0 && (
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

            {/* Toolbar row 1 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou cidade..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex gap-2">
                {([
                  { key: 'todos', label: 'Todos' },
                  { key: 'pro',   label: '★ PRO' },
                  { key: 'free',  label: 'Free'  },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilterPlano(key)}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                      filterPlano === key
                        ? key === 'pro'  ? 'bg-yellow-500 text-black'
                        : key === 'free' ? 'bg-slate-500 text-white'
                        :                  'bg-orange-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={exportCSV}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors whitespace-nowrap"
              >
                ⬇ Exportar CSV
              </button>
            </div>

            {/* Toolbar row 2 — advanced filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                placeholder="Filtrar UF..."
                value={filterUF}
                onChange={e => setFilterUF(e.target.value)}
                maxLength={2}
                className="w-24 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
              />
              <div className="flex gap-1">
                {([
                  { key: 'todos',      label: 'Todos' },
                  { key: 'completo',   label: 'Completo' },
                  { key: 'incompleto', label: 'Incompleto' },
                ] as const).map(({ key, label }) => (
                  <button key={key} onClick={() => setFilterComplete(key)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filterComplete === key ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {([
                  { key: 'todos',   label: 'Todos' },
                  { key: 'ativos',  label: 'Ativos' },
                  { key: 'banidos', label: 'Banidos' },
                ] as const).map(({ key, label }) => (
                  <button key={key} onClick={() => setFilterBanned(key)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filterBanned === key ? 'bg-red-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <select
                value={`${sortBy}:${sortDir}`}
                onChange={e => {
                  const [col, dir] = e.target.value.split(':')
                  setSortBy(col as 'created_at' | 'nome' | 'last_sign_in')
                  setSortDir(dir as 'asc' | 'desc')
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="created_at:desc">Cadastro ↓</option>
                <option value="created_at:asc">Cadastro ↑</option>
                <option value="nome:asc">Nome A-Z</option>
                <option value="nome:desc">Nome Z-A</option>
                <option value="last_sign_in:desc">Último acesso</option>
              </select>
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-2">
              {usersLoading
                ? <span className="text-slate-600">Carregando...</span>
                : <>
                    {totalUsers} usuário{totalUsers !== 1 ? 's' : ''} encontrado{totalUsers !== 1 ? 's' : ''}
                    {totalUsers > 0 && (
                      <span className="ml-1">(mostrando {(usersPage - 1) * USERS_PER_PAGE + 1}–{Math.min(usersPage * USERS_PER_PAGE, totalUsers)} de {totalUsers})</span>
                    )}
                  </>
              }
              {usersLoading && <Spinner />}
            </p>

            {/* Tabela */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wide">
                      <SortHeader col="nome" label="Usuário" />
                      <th className="text-left px-4 py-3 font-semibold">Localização</th>
                      <th className="text-left px-4 py-3 font-semibold">Telefone</th>
                      <SortHeader col="created_at" label="Cadastro" />
                      <SortHeader col="last_sign_in" label="Último acesso" />
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                      <th className="text-right px-4 py-3 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {pagedUsers.map(u => (
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
                        <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(u.created_at)}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{u.last_sign_in ? fmtDate(u.last_sign_in) : '—'}</td>
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
                {pagedUsers.length === 0 && !usersLoading && (
                  <div className="py-12 text-center">
                    <p className="text-slate-500">Nenhum usuário encontrado.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {totalUsersPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                  disabled={usersPage <= 1}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-sm text-slate-300 transition-colors"
                >
                  ← Anterior
                </button>
                <span className="text-sm text-slate-400">
                  Página {usersPage} de {totalUsersPages}
                </span>
                <button
                  onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))}
                  disabled={usersPage >= totalUsersPages}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-sm text-slate-300 transition-colors"
                >
                  Próxima →
                </button>
              </div>
            )}
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
              <input
                type="text"
                placeholder="Filtrar por usuário..."
                value={filterAnuncioUser}
                onChange={e => setFilterAnuncioUser(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-2">
              {anunciosLoading
                ? <span className="text-slate-600">Carregando...</span>
                : <>{totalAnuncios} anúncio{totalAnuncios !== 1 ? 's' : ''} (pág. {anuncioPage} de {totalAnunciosPages})</>
              }
              {anunciosLoading && <Spinner />}
            </p>

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
                          {confirmAnuncio === a.id ? (
                            <span className="flex items-center justify-end gap-2">
                              <button onClick={() => deleteAnuncio(a.id)} className="text-xs text-red-400 hover:text-red-300 font-bold">Confirmar</button>
                              <button onClick={() => setConfirmAnuncio(null)} className="text-xs text-slate-500 hover:text-slate-300">Cancelar</button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmAnuncio(a.id)}
                              disabled={deletingAnuncio === a.id}
                              className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                              {deletingAnuncio === a.id ? <Spinner /> : 'Deletar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAnuncios.length === 0 && !anunciosLoading && (
                  <div className="py-12 text-center">
                    <p className="text-slate-500">Nenhum anúncio encontrado.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Anuncios Pagination */}
            {totalAnunciosPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setAnuncioPage(p => Math.max(1, p - 1))}
                  disabled={anuncioPage <= 1 || anunciosLoading}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-sm text-slate-300 transition-colors"
                >
                  ← Anterior
                </button>
                <span className="text-sm text-slate-400">
                  Página {anuncioPage} de {totalAnunciosPages}
                </span>
                <button
                  onClick={() => setAnuncioPage(p => Math.min(totalAnunciosPages, p + 1))}
                  disabled={anuncioPage >= totalAnunciosPages || anunciosLoading}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-sm text-slate-300 transition-colors"
                >
                  Próxima →
                </button>
              </div>
            )}
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
            TAB 5 — LOGS
        ══════════════════════════════════════════════════════════ */}
        {tab === 'logs' && (
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800">
                <h3 className="font-bold text-white">Logs de Ações</h3>
                <p className="text-xs text-slate-400 mt-0.5">Últimas 50 ações do painel admin.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-semibold">Timestamp</th>
                      <th className="text-left px-4 py-3 font-semibold">Ação</th>
                      <th className="text-left px-4 py-3 font-semibold">Detalhes</th>
                      <th className="text-left px-4 py-3 font-semibold">Target ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {adminLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmt(log.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-orange-400 uppercase tracking-wide">{log.action.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-xs max-w-xs truncate">{log.details || '—'}</td>
                        <td className="px-4 py-3 text-slate-600 text-[10px] font-mono truncate max-w-[120px]">{log.target_id || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {adminLogs.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-slate-500">Nenhuma ação registrada.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB BANCAS
        ══════════════════════════════════════════════════════════ */}
        {tab === 'bancas' && (
          <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-white">📍 Bancas Parceiras</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {bancas.filter(b => !b.lat || !b.lng).length > 0
                    ? `⚠️ ${bancas.filter(b => !b.lat || !b.lng).length} sem coordenadas`
                    : 'Todos os pinos no mapa ✅'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={geocodificarBancas}
                  disabled={geocoding}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-bold transition-colors"
                >
                  {geocoding ? '⏳ Geocodificando...' : '🗺️ Geocodificar'}
                </button>
                <button
                  onClick={() => { resetBancaForm(); setBancaForm(true) }}
                  className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors"
                >
                  + Nova Banca
                </button>
              </div>
            </div>

            {/* Resultado geocoding */}
            {geocodeResult && (
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm">
                <p className="text-green-400 font-bold mb-1">✅ {geocodeResult.atualizadas} de {geocodeResult.total} bancas geocodificadas</p>
                {geocodeResult.erros.length > 0 && (
                  <div className="mt-2">
                    <p className="text-yellow-400 text-xs font-semibold mb-1">Não encontradas:</p>
                    {geocodeResult.erros.map((e, i) => (
                      <p key={i} className="text-slate-400 text-xs">• {e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Formulário */}
            {bancaForm && (
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-white text-sm">{bancaEditId ? '✏️ Editar Banca' : '➕ Nova Banca'}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    { key: 'nome',        label: 'Nome *',        placeholder: 'Banca do João' },
                    { key: 'responsavel', label: 'Responsável',    placeholder: 'João Silva' },
                    { key: 'telefone',    label: 'WhatsApp',       placeholder: '(11) 99999-9999' },
                    { key: 'email',       label: 'E-mail',         placeholder: 'joao@email.com' },
                    { key: 'endereco',    label: 'Endereço *',     placeholder: 'Rua XV de Novembro, 120' },
                    { key: 'bairro',      label: 'Bairro',         placeholder: 'Centro' },
                    { key: 'cidade',      label: 'Cidade *',       placeholder: 'São Paulo' },
                    { key: 'cep',         label: 'CEP',            placeholder: '01310-100' },
                    { key: 'horario',     label: 'Horário',        placeholder: 'Seg-Sex 7h-20h, Sab 7h-14h' },
                  ] as { key: keyof typeof bancaData; label: string; placeholder: string }[]).map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-slate-400 mb-1 block">{f.label}</label>
                      <input
                        value={bancaData[f.key] as string}
                        onChange={e => setBancaData(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  ))}

                  {/* UF */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Estado *</label>
                    <select
                      value={bancaData.uf}
                      onChange={e => setBancaData(prev => ({ ...prev, uf: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descricao */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Descrição</label>
                  <textarea
                    value={bancaData.descricao}
                    onChange={e => setBancaData(prev => ({ ...prev, descricao: e.target.value }))}
                    rows={2}
                    placeholder="Fala um pouco sobre a banca..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>

                {/* Toggles */}
                <div className="flex gap-6">
                  {(['ativa', 'destaque'] as const).map(f => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setBancaData(prev => ({ ...prev, [f]: !prev[f] }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${bancaData[f] ? 'bg-green-500' : 'bg-slate-700'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${bancaData[f] ? 'left-5' : 'left-0.5'}`} />
                      </button>
                      <span className="text-sm text-slate-300 capitalize">{f === 'ativa' ? 'Ativa' : '⭐ Destaque'}</span>
                    </label>
                  ))}
                </div>

                <p className="text-xs text-slate-500">📍 Coordenadas geradas automaticamente pelo endereço ao salvar</p>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveBanca}
                    disabled={bancaSaving}
                    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-sm font-bold transition-colors"
                  >
                    {bancaSaving ? 'Salvando...' : bancaEditId ? 'Salvar alterações' : 'Criar banca'}
                  </button>
                  <button
                    onClick={resetBancaForm}
                    className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Lista */}
            {bancasLoading ? (
              <div className="text-center py-10 text-slate-400 text-sm">Carregando bancas...</div>
            ) : bancas.length === 0 ? (
              <div className="text-center py-14 text-slate-500 text-sm">
                Nenhuma banca cadastrada ainda.<br />
                <span className="text-slate-600">Clique em "+ Nova Banca" para adicionar.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {bancas.map(b => (
                  <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-white text-sm">{b.nome}</span>
                          <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{b.uf}</span>
                          {b.destaque && <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">⭐ Destaque</span>}
                          {!b.ativa && <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Inativa</span>}
                        </div>
                        <p className="text-xs text-slate-400 truncate">{b.endereco}{b.bairro ? `, ${b.bairro}` : ''} — {b.cidade}</p>
                        {b.horario && <p className="text-xs text-slate-500 mt-0.5">🕐 {b.horario}</p>}
                        {b.telefone && <p className="text-xs text-slate-500">📱 {b.telefone}</p>}
                        {b.total_trocas > 0 && <p className="text-xs text-green-400 mt-0.5">🔁 {b.total_trocas} trocas realizadas</p>}
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button onClick={() => editBanca(b)}
                          className="px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-medium transition-colors">
                          ✏️ Editar
                        </button>
                        <button onClick={() => toggleBanca(b, 'ativa')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${b.ativa ? 'bg-orange-600/20 hover:bg-orange-600/40 text-orange-400' : 'bg-green-600/20 hover:bg-green-600/40 text-green-400'}`}>
                          {b.ativa ? 'Desativar' : 'Ativar'}
                        </button>
                        <button onClick={() => toggleBanca(b, 'destaque')}
                          className="px-3 py-1 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 text-xs font-medium transition-colors">
                          {b.destaque ? '★ Remover' : '★ Destacar'}
                        </button>
                        <button onClick={() => deleteBanca(b.id)}
                          className="px-3 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-medium transition-colors">
                          🗑 Remover
                        </button>
                      </div>
                    </div>

                    {/* Link perfil */}
                    <a href={`/bancas/${b.slug}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                      🔗 /bancas/{b.slug} ↗
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 6 — CONFIGURAÇÕES
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

            {/* Session timeout */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-3">
              <h3 className="font-bold text-white">Tempo de Inatividade</h3>
              <p className="text-xs text-slate-400">Sessão do admin será encerrada após este tempo sem atividade.</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={sessionTimeoutMin}
                  onChange={e => setSessionTimeoutMin(Number(e.target.value))}
                  className="w-24 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-sm text-slate-400">minutos (5–120)</span>
                <button
                  onClick={saveSessionTimeout}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>

            {/* Albums disponíveis */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-3">
              <h3 className="font-bold text-white">Álbuns Disponíveis</h3>
              <div className="space-y-3">
                {ALBUMS_REGISTRY.map(album => (
                  <div key={album.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">{album.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{album.name}</p>
                        <p className="text-xs text-slate-400">{album.subtitle}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAlbumAvail(album.id)}
                      disabled={settingsLoading}
                      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-3 ${albumAvail[album.id] ? 'bg-orange-500' : 'bg-slate-700'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${albumAvail[album.id] ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 italic">⚠ Requer novo deploy para efeito completo.</p>
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

            {/* Anúncios do usuário */}
            <div className="px-5 pb-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                Anúncios do usuário ({anunciosData.filter(a => a.user_id === selectedUser.id).length} visíveis)
              </h4>
              {anunciosData.filter(a => a.user_id === selectedUser.id).length === 0 ? (
                <p className="text-xs text-slate-600 italic">Sem anúncios na página atual.</p>
              ) : (
                <div className="space-y-1.5">
                  {anunciosData.filter(a => a.user_id === selectedUser.id).map(a => (
                    <div key={a.id} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 text-xs">
                      <span className="font-mono text-orange-400">{a.sid}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${a.tipo === 'tenho' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{a.tipo}</span>
                      <span className="text-slate-400">{a.album_id}</span>
                      {a.preco !== null && <span className="text-slate-300 ml-auto">R$ {Number(a.preco).toFixed(2)}</span>}
                    </div>
                  ))}
                </div>
              )}
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
                <div className="flex gap-2 flex-wrap">
                  {(['free', 'pro', 'mensal', 'anual'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPlanValue(p)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border ${
                        planValue === p
                          ? p === 'anual'  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                          : p === 'pro'    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                          : p === 'mensal' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                          :                  'bg-slate-600 text-white border-slate-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {p === 'pro' ? '★ PRO' : p}
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

      {/* Modal — Notificar todos */}
      {notifyModal && (
        <Modal onClose={() => setNotifyModal(false)}>
          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl w-full shadow-2xl p-6">
            <div className="text-4xl text-center mb-3">📣</div>
            <h3 className="font-black text-white text-center text-lg mb-2">Notificar Todos</h3>
            <p className="text-slate-400 text-sm text-center mb-4">
              A mensagem será exibida como aviso global para todos os usuários.
            </p>
            <textarea
              value={notifyMsg}
              onChange={e => setNotifyMsg(e.target.value)}
              rows={4}
              placeholder="Digite a mensagem para todos os usuários..."
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setNotifyModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors">
                Cancelar
              </button>
              <button
                onClick={submitNotify}
                disabled={notifyLoading || !notifyMsg.trim()}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                {notifyLoading ? <><Spinner /> Enviando...</> : '📣 Enviar para todos'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast container */}
      <ToastContainer toasts={toasts} />

    </div>
  )
}
