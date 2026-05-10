import { redirect } from 'next/navigation'
import { isAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminDashboard from './AdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  if (!await isAdminAuth()) redirect('/admin')

  const sb = createAdminClient()

  // Busca usuários do auth + perfis em paralelo
  const [
    { data: authData },
    { data: profiles },
    { count: totalAnuncios },
    { count: totalColadas },
    { count: totalPropostas },
    { count: totalPedidos },
  ] = await Promise.all([
    sb.auth.admin.listUsers({ perPage: 1000 }),
    sb.from('profiles').select('*'),
    sb.from('anuncios').select('*', { count: 'exact', head: true }),
    sb.from('coladas').select('*', { count: 'exact', head: true }),
    sb.from('propostas').select('*', { count: 'exact', head: true }),
    sb.from('pedidos').select('*', { count: 'exact', head: true }),
  ])

  const profilesMap = new Map((profiles ?? []).map(p => [p.id, p]))

  const users = (authData?.users ?? []).map(u => {
    const p = profilesMap.get(u.id)
    return {
      id:          u.id,
      email:       u.email ?? '',
      created_at:  u.created_at,
      last_sign_in: u.last_sign_in_at ?? null,
      provider:    u.app_metadata?.provider ?? 'email',
      nome:        p?.nome        ?? '',
      telefone:    p?.telefone    ?? '',
      bairro:      p?.bairro      ?? '',
      cidade:      p?.cidade      ?? '',
      uf:          p?.uf          ?? '',
      cep:         p?.cep         ?? '',
      aceitou_termos:      p?.aceitou_termos      ?? false,
      aceitou_privacidade: p?.aceitou_privacidade ?? false,
      profile_complete: !!(p?.telefone && p?.cep && p?.aceitou_termos && p?.aceitou_privacidade),
    }
  })

  const stats = {
    totalUsers:     users.length,
    totalAnuncios:  totalAnuncios ?? 0,
    totalColadas:   totalColadas  ?? 0,
    totalPropostas: totalPropostas ?? 0,
    totalPedidos:   totalPedidos  ?? 0,
    completeProfiles: users.filter(u => u.profile_complete).length,
  }

  return <AdminDashboard users={users} stats={stats} />
}
