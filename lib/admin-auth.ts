import { cookies } from 'next/headers'

export const ADMIN_COOKIE = 'cdo_admin'

/** Mesmo token gerado no proxy.ts — sem dependência de Node crypto */
export function getAdminToken(): string {
  const u = process.env.ADMIN_USERNAME ?? 'admin'
  const p = process.env.ADMIN_PASSWORD ?? 'admin'
  const s = process.env.ADMIN_SECRET   ?? 'completando-admin-secret'
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
  const expectedUser = process.env.ADMIN_USERNAME ?? 'admin'
  const expectedPass = process.env.ADMIN_PASSWORD ?? 'admin'
  return user === expectedUser && pass === expectedPass
}
