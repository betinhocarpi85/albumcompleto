import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Verifica rate limit usando a tabela rate_limits no Supabase.
 * Funciona em multi-instância (Vercel serverless) porque o estado fica no banco.
 * Fail-open: se o banco falhar, permite a requisição (não bloqueia usuário legítimo).
 *
 * @param key           Identificador único: ex. "checkout:user-uuid"
 * @param maxCount      Máximo de requisições permitidas na janela
 * @param windowSeconds Duração da janela em segundos
 * @returns true se permitido, false se bloqueado
 */
export async function checkRateLimit(
  key: string,
  maxCount: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const sb = createAdminClient()
    const { data, error } = await sb.rpc('check_rate_limit', {
      p_key:            key,
      p_max_count:      maxCount,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      console.error('[rate-limit] rpc error:', error.message)
      return true // fail-open
    }
    return data as boolean
  } catch (e) {
    console.error('[rate-limit] exception:', e)
    return true // fail-open
  }
}
