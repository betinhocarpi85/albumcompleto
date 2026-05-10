import { NextResponse } from 'next/server'
import { isAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  if (!await isAdminAuth()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const sb = createAdminClient()

  const [{ data: authData }, { data: profiles }] = await Promise.all([
    sb.auth.admin.listUsers({ perPage: 1000 }),
    sb.from('profiles').select('*'),
  ])

  const profilesMap = new Map((profiles ?? []).map(p => [p.id, p]))

  const rows = (authData?.users ?? []).map(u => {
    const p = profilesMap.get(u.id)
    return [
      u.id,
      u.email ?? '',
      p?.nome ?? '',
      p?.telefone ?? '',
      p?.cidade ?? '',
      p?.uf ?? '',
      p?.cep ?? '',
      p?.plano ?? 'free',
      p?.banned ? 'sim' : 'não',
      new Date(u.created_at).toLocaleDateString('pt-BR'),
      u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('pt-BR') : '',
    ]
  })

  const header = ['ID', 'Email', 'Nome', 'Telefone', 'Cidade', 'UF', 'CEP', 'Plano', 'Banido', 'Cadastro', 'Último acesso']
  const csvLines = [header, ...rows].map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  )
  const csv = csvLines.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="usuarios-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
