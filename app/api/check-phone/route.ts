import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/check-phone?tel=11999999999&exclude=<userId>
 * Retorna { available: boolean }
 * Requer autenticação.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const tel     = request.nextUrl.searchParams.get('tel')?.replace(/\D/g, '') ?? ''
  const exclude = request.nextUrl.searchParams.get('exclude') ?? ''

  if (tel.length < 10) {
    return NextResponse.json({ available: true })
  }

  const sb = createAdminClient()
  let query = sb.from('profiles').select('id').eq('telefone', tel)
  if (exclude) query = query.neq('id', exclude)

  const { data } = await query.limit(1)
  return NextResponse.json({ available: !data || data.length === 0 })
}
