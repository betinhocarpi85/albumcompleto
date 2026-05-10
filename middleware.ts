import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

const ADMIN_COOKIE = 'cdo_admin'

function getAdminToken(): string {
  const secret = process.env.ADMIN_SECRET ?? 'completando-admin-secret'
  return createHmac('sha256', secret).update('admin-authenticated').digest('hex')
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protege todas as rotas /admin/dashboard*
  if (pathname.startsWith('/admin/dashboard')) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value
    if (token !== getAdminToken()) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard/:path*'],
}
