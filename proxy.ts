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
  const u = process.env.ADMIN_USERNAME ?? 'admin'
  const p = process.env.ADMIN_PASSWORD ?? 'admin'
  const s = process.env.ADMIN_SECRET   ?? 'completando-admin-secret'
  return `${s}::${u}:${p}`
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Proteção do painel admin ──────────────────────────────────────────────
  if (pathname.startsWith('/admin/dashboard')) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value
    if (token !== getAdminToken()) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next({ request })
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
      return NextResponse.redirect(new URL('/completar-cadastro', request.url))
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
