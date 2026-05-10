import { cookies } from 'next/headers'

export const ADMIN_COOKIE = 'cdo_admin'

/** Mesmo token gerado no proxy.ts — sem dependência de Node crypto */
export function getAdminToken(): string {
  const u = (process.env.ADMIN_USERNAME ?? 'admin').trim()
  const p = (process.env.ADMIN_PASSWORD ?? 'admin').trim()
  const s = (process.env.ADMIN_SECRET   ?? 'completando-admin-secret').trim()
  return `${s}::${u}:${p}`
}

export async function isAdminAuth(): Promise<boolean> {
  try {
    const store = await cookies()
    return store.get(ADMIN_COOKIE)?.value === getAdminToken()
  } catch {
    return false
  }
}

export function verifyCredentials(user: string, pass: string): boolean {
  const expectedUser = (process.env.ADMIN_USERNAME ?? 'admin').trim()
  const expectedPass = (process.env.ADMIN_PASSWORD ?? 'admin').trim()
  return user === expectedUser && pass === expectedPass
}
