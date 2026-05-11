import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Whitelist de destinos para prevenir open redirect
  const nextParam = searchParams.get('next') ?? '/album'
  const ALLOWED_PATHS = ['/album', '/matches', '/anuncios', '/conta', '/notificacoes', '/completar-cadastro']
  const next = ALLOWED_PATHS.includes(nextParam) ? nextParam : '/album'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Verifica se o perfil já está completo (usuário existente)
        const { data: profile } = await supabase
          .from('profiles')
          .select('telefone, cep, aceitou_termos, aceitou_privacidade')
          .eq('id', user.id)
          .single()

        const completo = profile?.telefone && profile?.cep &&
          profile?.aceitou_termos && profile?.aceitou_privacidade

        if (completo) {
          // Usuário existente com perfil completo → vai direto para o destino
          return NextResponse.redirect(`${origin}${next}`)
        }

        // Perfil incompleto ou novo usuário → completar cadastro
        // O perfil só é salvo no banco após o formulário ser preenchido
        const res = NextResponse.redirect(`${origin}/completar-cadastro`)
        res.cookies.set('profile_pending', '1', {
          httpOnly: true,
          sameSite: 'lax',
          path:     '/',
          maxAge:   60 * 60 * 24, // 24h
        })
        return res
      }
    }
  }

  return NextResponse.redirect(`${origin}/entrar?error=auth`)
}
