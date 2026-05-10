import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/check-phone?tel=11999999999&exclude=<userId>
 * Retorna { available: boolean }
 */
export async function GET(request: NextRequest) {
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
