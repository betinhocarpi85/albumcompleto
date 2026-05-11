import { redirect } from 'next/navigation'
import { isAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminDashboard from './AdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  if (!await isAdminAuth()) redirect('/admin')

  const sb = createAdminClient()

  const [
    { data: authData },
    { data: profiles },
    { data: anuncios },
    { data: propostas },
    { count: totalColadas },
    { count: totalPedidos },
    { data: adminLogs },
    { data: siteSettingsRows },
  ] = await Promise.all([
    sb.auth.admin.listUsers({ perPage: 1000 }),
    sb.from('profiles').select('*'),
    sb.from('anuncios').select('*').order('created_at', { ascending: false }),
    sb.from('propostas').select('*').order('created_at', { ascending: false }),
    sb.from('coladas').select('*', { count: 'exact', head: true }),
    sb.from('pedidos').select('*', { count: 'exact', head: true }),
    sb.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(50),
    sb.from('site_settings').select('*'),
  ])

  const profilesMap = new Map((profiles ?? []).map(p => [p.id, p]))

  const users = (authData?.users ?? []).map(u => {
    const p = profilesMap.get(u.id)
    const plano_expira = p?.plano_expira_em ?? null
    const plano = p?.plano ?? 'free'
    const planoExpirado = plano === 'pro' && plano_expira && new Date(plano_expira) < new Date()
    return {
      id:                  u.id,
      email:               u.email ?? '',
      created_at:          u.created_at,
      last_sign_in:        u.last_sign_in_at ?? null,
      provider:            u.app_metadata?.provider ?? 'email',
      nome:                p?.nome        ?? '',
      telefone:            p?.telefone    ?? '',
      bairro:              p?.bairro      ?? '',
      cidade:              p?.cidade      ?? '',
      uf:                  p?.uf          ?? '',
      cep:                 p?.cep         ?? '',
      aceitou_termos:      p?.aceitou_termos      ?? false,
      aceitou_privacidade: p?.aceitou_privacidade ?? false,
      profile_complete:    !!(p?.telefone && p?.cep && p?.aceitou_termos && p?.aceitou_privacidade),
      banned:              p?.banned              ?? false,
      banned_at:           p?.banned_at           ?? null,
      banned_reason:       p?.banned_reason       ?? null,
      plano,
      plano_expira,
      plano_expirado:      planoExpirado ?? false,
    }
  })

  // Sort by created_at desc (most recent first)
  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Cadastros por dia (últimos 30 dias)
  const today = new Date()
  const cadastrosPorDia: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    cadastrosPorDia[d.toISOString().slice(0, 10)] = 0
  }
  for (const u of users) {
    const day = u.created_at.slice(0, 10)
    if (day in cadastrosPorDia) cadastrosPorDia[day]++
  }

  // Distribuição por UF
  const ufCount: Record<string, number> = {}
  for (const u of users) {
    if (u.uf) ufCount[u.uf] = (ufCount[u.uf] ?? 0) + 1
  }
  const ufDistrib = Object.entries(ufCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([uf, count]) => ({ uf, count }))

  // Usuários online hoje
  const todayStr = today.toISOString().slice(0, 10)
  const onlineHoje = users.filter(u => u.last_sign_in?.slice(0, 10) === todayStr).length

  // Anúncios com nome do usuário
  const anunciosComNome = (anuncios ?? []).map(a => ({
    ...a,
    user_nome: profilesMap.get(a.user_id)?.nome ?? '',
  }))

  // Propostas com nomes
  const propostasComNomes = (propostas ?? []).map(p => ({
    ...p,
    de_nome:   profilesMap.get(p.de_user_id)?.nome ?? '',
    para_nome: profilesMap.get(p.para_user_id)?.nome ?? '',
  }))

  // Site settings
  const siteSettings: Record<string, string> = {}
  for (const row of siteSettingsRows ?? []) {
    siteSettings[row.key] = row.value
  }

  const stats = {
    totalUsers:       users.length,
    totalAnuncios:    (anuncios ?? []).length,
    totalColadas:     totalColadas  ?? 0,
    totalPropostas:   (propostas ?? []).length,
    totalPedidos:     totalPedidos  ?? 0,
    completeProfiles: users.filter(u => u.profile_complete).length,
    bannedUsers:      users.filter(u => u.banned).length,
    onlineHoje,
  }

  return (
    <AdminDashboard
      users={users}
      stats={stats}
      anuncios={anunciosComNome}
      propostas={propostasComNomes}
      cadastrosPorDia={cadastrosPorDia}
      ufDistrib={ufDistrib}
      adminLogs={adminLogs ?? []}
      siteSettings={siteSettings}
    />
  )
}
