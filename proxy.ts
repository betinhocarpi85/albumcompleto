import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROTAS_PROTEGIDAS = [
  '/album',
  '/anuncios',
  '/matches',
  '/conta',
  '/notificacoes',
  '/propostas',
  '/completar-cadastro',
]

const ADMIN_COOKIE = 'cdo_admin'

function getAdminToken(): string {
  const s = (process.env.ADMIN_SECRET ?? 'completando-admin-secret').trim()
  return `cdo-admin-session::${s}`
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Proteção do painel admin ──────────────────────────────────────────────
  if (pathname.startsWith('/admin/dashboard')) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value
    if (token !== getAdminToken()) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    // Sliding session: renova o cookie a cada acesso (30 min de inatividade)
    const res = NextResponse.next({ request })
    res.cookies.set(ADMIN_COOKIE, getAdminToken(), {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 60, // 30 minutos
      path:     '/',
    })
    return res
  }

  // ── Proteção das rotas de usuário (Supabase Auth) ─────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── Cadastro pendente: bloqueia navegação até completar ───────────────────
  const profilePending = request.cookies.get('profile_pending')?.value === '1'
  if (user && profilePending) {
    // Permite apenas completar-cadastro e rotas de API/auth
    const permitido =
      pathname.startsWith('/completar-cadastro') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/entrar') ||
      pathname.startsWith('/cadastro')

    if (!permitido) {
      // Cookie presente mas pode estar desatualizado — verifica o DB como fonte de verdade
      const { data: profile } = await supabase
        .from('profiles')
        .select('telefone, cep, aceitou_termos, aceitou_privacidade')
        .eq('id', user.id)
        .single()

      const completo =
        profile?.telefone && profile?.cep &&
        profile?.aceitou_termos && profile?.aceitou_privacidade

      if (!completo) {
        return NextResponse.redirect(new URL('/completar-cadastro', request.url))
      }

      // Perfil completo no DB: limpa o cookie stale e deixa passar
      supabaseResponse.cookies.set('profile_pending', '', {
        httpOnly: true,
        sameSite: 'lax',
        path:     '/',
        maxAge:   0,
      })
      return supabaseResponse
    }

    return supabaseResponse
  }

  // ── Rotas protegidas por login ────────────────────────────────────────────
  const protegida = ROTAS_PROTEGIDAS.some(r => pathname === r || pathname.startsWith(r + '/'))

  if (protegida && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/entrar'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
