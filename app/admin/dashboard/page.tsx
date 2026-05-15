import { redirect } from 'next/navigation'
import { isAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminDashboard from './AdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  if (!await isAdminAuth()) redirect('/admin')

  const sb = createAdminClient()

  // Stats via COUNT queries — no full table scans
  const [
    { count: totalUsers },
    { count: totalPro },
    { count: totalBanned },
    { count: totalComplete },
    { count: totalAnuncios },
    { count: totalPropostas },
    { count: totalColadas },
    { count: totalPedidos },
    { count: onlineHoje },
  ] = await Promise.all([
    sb.from('profiles').select('*', { count: 'exact', head: true }),
    sb.from('profiles').select('*', { count: 'exact', head: true })
      .in('plano', ['pro', 'anual', 'mensal'])
      .or(`plano_expira_em.is.null,plano_expira_em.gt.${new Date().toISOString()}`),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('banned', true),
    sb.from('profiles').select('*', { count: 'exact', head: true })
      .not('telefone', 'is', null).not('cep', 'is', null)
      .eq('aceitou_termos', true).eq('aceitou_privacidade', true),
    sb.from('anuncios').select('*', { count: 'exact', head: true }),
    sb.from('propostas').select('*', { count: 'exact', head: true }),
    sb.from('coladas').select('*', { count: 'exact', head: true }),
    sb.from('pedidos').select('*', { count: 'exact', head: true }),
    sb.from('profiles').select('*', { count: 'exact', head: true })
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ])

  const total = totalUsers ?? 0
  const pro   = totalPro   ?? 0

  const stats = {
    totalUsers:       total,
    totalPro:         pro,
    totalFree:        total - pro,
    bannedUsers:      totalBanned    ?? 0,
    completeProfiles: totalComplete  ?? 0,
    totalAnuncios:    totalAnuncios  ?? 0,
    totalPropostas:   totalPropostas ?? 0,
    totalColadas:     totalColadas   ?? 0,
    totalPedidos:     totalPedidos   ?? 0,
    onlineHoje:       onlineHoje     ?? 0,
  }

  // First page of users for SSR (25 rows + auth batch)
  const { data: firstPageProfiles } = await sb
    .from('profiles')
    .select('*')
    .order('updated_at', { ascending: false })
    .range(0, 24)

  const authUsers = await Promise.all(
    (firstPageProfiles ?? []).map(p =>
      sb.auth.admin.getUserById(p.id).then(r => r.data?.user)
    )
  )

  const users = (firstPageProfiles ?? []).map((p, i) => {
    const u = authUsers[i]
    const plano_expira = p.plano_expira_em ?? null
    const planoExpirado = p.plano === 'pro' && plano_expira && new Date(plano_expira) < new Date()
    return {
      id:                  p.id,
      email:               u?.email ?? '',
      created_at:          u?.created_at ?? p.updated_at,
      last_sign_in:        u?.last_sign_in_at ?? null,
      provider:            u?.app_metadata?.provider ?? 'email',
      nome:                p.nome        ?? '',
      telefone:            p.telefone    ?? '',
      bairro:              p.bairro      ?? '',
      cidade:              p.cidade      ?? '',
      uf:                  p.uf          ?? '',
      cep:                 p.cep         ?? '',
      aceitou_termos:      p.aceitou_termos      ?? false,
      aceitou_privacidade: p.aceitou_privacidade ?? false,
      profile_complete:    !!(p.telefone && p.cep && p.aceitou_termos && p.aceitou_privacidade),
      banned:              p.banned              ?? false,
      banned_at:           p.banned_at           ?? null,
      banned_reason:       p.banned_reason       ?? null,
      plano:               p.plano               ?? 'free',
      plano_expira,
      plano_expirado:      planoExpirado ?? false,
    }
  })

  // First page of anuncios for SSR
  const { data: firstAnuncios } = await sb
    .from('anuncios')
    .select('*')
    .order('created_at', { ascending: false })
    .range(0, 24)

  const anuncioUserIds = [...new Set((firstAnuncios ?? []).map(a => a.user_id))]
  const { data: anuncioProfiles } = anuncioUserIds.length > 0
    ? await sb.from('profiles').select('id, nome').in('id', anuncioUserIds)
    : { data: [] }
  const anuncioNameMap = new Map((anuncioProfiles ?? []).map(p => [p.id, p.nome ?? '']))

  const anuncios = (firstAnuncios ?? []).map(a => ({
    ...a,
    user_nome: anuncioNameMap.get(a.user_id) ?? '',
  }))

  // Propostas with names (small dataset — kept as-is)
  const { data: propostas } = await sb
    .from('propostas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const propostaUserIds = [...new Set([
    ...(propostas ?? []).map(p => p.de_user_id),
    ...(propostas ?? []).map(p => p.para_user_id),
  ])]
  const { data: propostaProfiles } = propostaUserIds.length > 0
    ? await sb.from('profiles').select('id, nome').in('id', propostaUserIds)
    : { data: [] }
  const propostaNameMap = new Map((propostaProfiles ?? []).map(p => [p.id, p.nome ?? '']))

  const propostasComNomes = (propostas ?? []).map(p => ({
    ...p,
    de_nome:   propostaNameMap.get(p.de_user_id)   ?? '',
    para_nome: propostaNameMap.get(p.para_user_id) ?? '',
  }))

  // Cadastros por dia (últimos 30 dias) — using profiles updated_at as proxy
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const { data: recentProfiles } = await sb
    .from('profiles')
    .select('updated_at')
    .gte('updated_at', thirtyDaysAgo.toISOString())

  const today = new Date()
  const cadastrosPorDia: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    cadastrosPorDia[d.toISOString().slice(0, 10)] = 0
  }
  for (const p of recentProfiles ?? []) {
    const day = (p.updated_at as string).slice(0, 10)
    if (day in cadastrosPorDia) cadastrosPorDia[day]++
  }

  // Distribuição por UF — top 5 from DB
  const { data: ufRows } = await sb
    .from('profiles')
    .select('uf')
    .not('uf', 'is', null)

  const ufCount: Record<string, number> = {}
  for (const row of ufRows ?? []) {
    if (row.uf) ufCount[row.uf] = (ufCount[row.uf] ?? 0) + 1
  }
  const ufDistrib = Object.entries(ufCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([uf, count]) => ({ uf, count }))

  // Admin logs
  const { data: adminLogs } = await sb
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  // Site settings
  const { data: siteSettingsRows } = await sb.from('site_settings').select('*')
  const siteSettings: Record<string, string> = {}
  for (const row of siteSettingsRows ?? []) {
    siteSettings[row.key] = row.value
  }

  return (
    <AdminDashboard
      users={users}
      stats={stats}
      anuncios={anuncios}
      propostas={propostasComNomes}
      cadastrosPorDia={cadastrosPorDia}
      ufDistrib={ufDistrib}
      adminLogs={adminLogs ?? []}
      siteSettings={siteSettings}
      initialTotalUsers={total}
      initialTotalAnuncios={totalAnuncios ?? 0}
    />
  )
}
