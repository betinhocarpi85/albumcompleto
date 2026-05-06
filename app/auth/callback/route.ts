import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/album'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Verifica se o perfil está completo
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('cpf, cep, aceito_termos, aceito_privacidade')
          .eq('id', user.id)
          .single()

        const completo = profile?.cpf && profile?.cep &&
          profile?.aceito_termos && profile?.aceito_privacidade

        if (!completo) {
          return NextResponse.redirect(`${origin}/completar-cadastro`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/entrar?error=auth`)
}
