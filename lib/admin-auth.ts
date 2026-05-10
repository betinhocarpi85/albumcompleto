import { createHmac } from 'crypto'
import { cookies } from 'next/headers'

export const ADMIN_COOKIE = 'cdo_admin'

function makeToken(): string {
  const secret = process.env.ADMIN_SECRET ?? 'completando-admin-secret'
  return createHmac('sha256', secret).update('admin-authenticated').digest('hex')
}

export async function isAdminAuth(): Promise<boolean> {
  try {
    const store = await cookies()
    return store.get(ADMIN_COOKIE)?.value === makeToken()
  } catch {
    return false
  }
}

export function getAdminToken() {
  return makeToken()
}

export function verifyCredentials(user: string, pass: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME ?? 'admin'
  const expectedPass = process.env.ADMIN_PASSWORD ?? 'admin'
  return user === expectedUser && pass === expectedPass
}
