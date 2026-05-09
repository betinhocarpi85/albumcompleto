import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/entrar', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://albumcompleto.vercel.app'), { status: 302 })
}
