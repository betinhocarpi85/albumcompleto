'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
}

type Stats = {
  totalUsers: number
  totalAnuncios: number
  totalColadas: number
  totalPropostas: number
  totalPedidos: number
  completeProfiles: number
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function AdminDashboard({ users, stats }: { users: User[]; stats: Stats }) {
  const router = useRouter()
  const [tab,     setTab]     = useState<'overview' | 'users'>('overview')
  const [search,  setSearch]  = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  async function deleteUser(user: User) {
    setDeleting(user.id)
    try {
      const res = await fetch('/api/admin/users', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: user.id }),
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

  const filtered = users.filter(u =>
    !search ||
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.cidade.toLowerCase().includes(search.toLowerCase())
  )

  const STAT_CARDS = [
    { label: 'Usuários',       value: stats.totalUsers,        icon: '👥', color: 'from-blue-500 to-blue-600'   },
    { label: 'Perfis completos', value: stats.completeProfiles, icon: '✅', color: 'from-green-500 to-green-600' },
    { label: 'Figurinhas',     value: stats.totalColadas,      icon: '🃏', color: 'from-purple-500 to-purple-600'},
    { label: 'Anúncios',       value: stats.totalAnuncios,     icon: '📢', color: 'from-orange-500 to-orange-600'},
    { label: 'Propostas',      value: stats.totalPropostas,    icon: '🔁', color: 'from-cyan-500 to-cyan-600'   },
    { label: 'Pedidos',        value: stats.totalPedidos,      icon: '📦', color: 'from-rose-500 to-rose-600'   },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🛡️</span>
            <span className="font-black text-white">Completando <span className="text-orange-400 font-normal text-sm">Admin</span></span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank"
              className="text-xs text-slate-400 hover:text-white transition-colors">
              Ver site →
            </a>
            <button onClick={logout}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300 transition-colors">
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {([
            { key: 'overview', label: '📊 Visão Geral' },
            { key: 'users',    label: `👥 Usuários (${stats.totalUsers})` },
          ] as { key: typeof tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={[
                'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                tab === t.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700',
              ].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-6 animate-fadein">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {STAT_CARDS.map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-center shadow-lg`}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-3xl font-black">{s.value.toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-white/70 mt-0.5 font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Últimos usuários */}
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
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-black">
                        {(u.nome || u.email).slice(0, 1).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{u.nome || '(sem nome)'}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-400">{fmt(u.created_at)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.profile_complete ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
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

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div className="space-y-4 animate-fadein">
            {/* Busca */}
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou cidade..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            <p className="text-xs text-slate-500">{filtered.length} usuário{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>

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
                    {filtered.map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-black">
                                {(u.nome || u.email).slice(0, 1).toUpperCase()}
                              </span>
                            </div>
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
                        <td className="px-4 py-3 text-slate-300 text-xs">
                          {u.telefone || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          <p>{fmt(u.created_at)}</p>
                          {u.last_sign_in && <p className="text-slate-600">Último: {fmt(u.last_sign_in)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                              u.profile_complete ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {u.profile_complete ? '✓ completo' : '⚠ incompleto'}
                            </span>
                            {u.aceitou_termos && (
                              <span className="text-[10px] text-slate-500">termos ✓</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => setConfirmDelete(u)}
                              className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                              Deletar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filtered.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-slate-500">Nenhum usuário encontrado.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal — Detalhes do usuário */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="font-black text-white">Detalhes do usuário</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'ID',         value: selectedUser.id },
                { label: 'Nome',       value: selectedUser.nome || '(sem nome)' },
                { label: 'E-mail',     value: selectedUser.email },
                { label: 'Telefone',   value: selectedUser.telefone || '—' },
                { label: 'Bairro',     value: selectedUser.bairro || '—' },
                { label: 'Cidade/UF',  value: [selectedUser.cidade, selectedUser.uf].filter(Boolean).join(' / ') || '—' },
                { label: 'CEP',        value: selectedUser.cep || '—' },
                { label: 'Provider',   value: selectedUser.provider },
                { label: 'Cadastro',   value: fmt(selectedUser.created_at) },
                { label: 'Último acesso', value: fmt(selectedUser.last_sign_in) },
                { label: 'Termos',     value: selectedUser.aceitou_termos ? '✅ Aceito' : '❌ Não aceito' },
                { label: 'Privacidade',value: selectedUser.aceitou_privacidade ? '✅ Aceita' : '❌ Não aceita' },
              ].map(row => (
                <div key={row.label} className="flex gap-3">
                  <span className="text-xs text-slate-500 w-28 flex-shrink-0 pt-0.5">{row.label}</span>
                  <span className="text-sm text-slate-200 break-all">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={() => setSelectedUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors">
                Fechar
              </button>
              <button onClick={() => { setConfirmDelete(selectedUser); setSelectedUser(null) }}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold border border-red-500/30 transition-colors">
                🗑️ Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Confirmar delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-sm shadow-2xl p-6">
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
                {deleting === confirmDelete.id
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Deletando...</>
                  : '🗑️ Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
