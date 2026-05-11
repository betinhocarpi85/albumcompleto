import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que exigem perfil completo
const PROTECTED = [
  '/album',
  '/matches',
  '/anuncios',
  '/propostas',
  '/conta',
  '/notificacoes',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!isProtected) return NextResponse.next()

  const pending = request.cookies.get('profile_pending')?.value
  if (pending === '1') {
    return NextResponse.redirect(new URL('/completar-cadastro', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/album/:path*',
    '/matches/:path*',
    '/anuncios/:path*',
    '/propostas/:path*',
    '/conta/:path*',
    '/notificacoes/:path*',
  ],
}
