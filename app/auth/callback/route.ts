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
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('telefone, cep, aceitou_termos, aceitou_privacidade')
          .eq('id', user.id)
          .single()

        // Novo usuário via magic link — salva perfil a partir dos metadados
        const meta = user.user_metadata
        if (!profile?.telefone && meta?.nome) {
          await supabase.from('profiles').upsert({
            id:                  user.id,
            nome:                meta.nome,
            telefone:            meta.telefone,
            cep:                 meta.cep,
            cidade:              meta.cidade,
            uf:                  meta.uf,
            maior18:             true,
            aceitou_termos:      meta.aceitouTermos ?? false,
            aceitou_privacidade: meta.aceitouPrivacidade ?? false,
            updated_at:          new Date().toISOString(),
          })
          return NextResponse.redirect(`${origin}/album`)
        }

        const completo = profile?.telefone && profile?.cep &&
          profile?.aceitou_termos && profile?.aceitou_privacidade

        if (!completo) {
          return NextResponse.redirect(`${origin}/completar-cadastro`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/entrar?error=auth`)
}
