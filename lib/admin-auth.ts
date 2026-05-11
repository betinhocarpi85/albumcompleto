import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { scryptSync, timingSafeEqual, randomBytes } from 'crypto'

export const ADMIN_COOKIE = 'cdo_admin'

/** Token de sessão — derivado apenas do ADMIN_SECRET */
export function getAdminToken(): string {
  const s = (process.env.ADMIN_SECRET ?? 'completando-admin-secret').trim()
  return `cdo-admin-session::${s}`
}

export async function isAdminAuth(): Promise<boolean> {
  try {
    const store = await cookies()
    return store.get(ADMIN_COOKIE)?.value === getAdminToken()
  } catch {
    return false
  }
}

/** Cria hash seguro para armazenar senhas no banco */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `$scrypt$${salt}$${hash}`
}

/** Verifica senha contra hash (formato $scrypt$salt$hash) ou texto plano legado */
export function verifyPassword(password: string, stored: string): boolean {
  if (stored.startsWith('$scrypt$')) {
    const parts = stored.split('$')
    // parts: ['', 'scrypt', salt, hash]
    const salt     = parts[2]
    const hashHex  = parts[3]
    try {
      const derived = scryptSync(password, salt, 64)
      return timingSafeEqual(derived, Buffer.from(hashHex, 'hex'))
    } catch {
      return false
    }
  }
  // Legado: comparação direta (será substituído na próxima troca de senha)
  return password === stored
}

/** Verifica credenciais: env vars têm prioridade; DB é fallback */
export async function verifyCredentials(user: string, pass: string): Promise<boolean> {
  // 1) Env vars (Vercel / .env.local) — fonte primária
  const envUser = (process.env.ADMIN_USERNAME ?? '').trim()
  const envPass = (process.env.ADMIN_PASSWORD ?? '').trim()
  if (envUser && envPass) {
    // Comparação timing-safe para evitar timing attacks
    const userBuf = Buffer.alloc(256)
    const passBuf = Buffer.alloc(256)
    const envUBuf = Buffer.alloc(256)
    const envPBuf = Buffer.alloc(256)
    userBuf.write(user)
    passBuf.write(pass)
    envUBuf.write(envUser)
    envPBuf.write(envPass)
    return timingSafeEqual(userBuf, envUBuf) && timingSafeEqual(passBuf, envPBuf)
  }

  // 2) Banco de dados — credenciais alteradas via painel admin
  try {
    const sb = createAdminClient()
    const { data } = await sb
      .from('site_settings')
      .select('key, value')
      .in('key', ['admin_username', 'admin_password_hash', 'admin_password_plain'])

    const dbUser      = data?.find(r => r.key === 'admin_username')?.value ?? ''
    const dbHash      = data?.find(r => r.key === 'admin_password_hash')?.value ?? ''
    const dbPlain     = data?.find(r => r.key === 'admin_password_plain')?.value ?? ''
    const storedPass  = dbHash || dbPlain

    if (dbUser && storedPass) {
      if (user !== dbUser) return false
      return verifyPassword(pass, storedPass)
    }
  } catch { /* segue */ }

  // 3) Sem credenciais configuradas — bloqueia acesso
  console.error('[admin-auth] Nenhuma credencial configurada. Defina ADMIN_USERNAME e ADMIN_PASSWORD.')
  return false
}
