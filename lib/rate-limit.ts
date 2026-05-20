import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Upstash singleton ────────────────────────────────────────────────────────
// Inicializado uma única vez por processo (warm lambda / Edge runtime).
// Se as env vars não estiverem presentes, redis fica null e o fallback DB é usado.
let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  const url   = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

// ─── Fallback: Supabase DB (rate_limits table + check_rate_limit RPC) ────────
async function checkRateLimitDB(
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
      console.error('[rate-limit/db] rpc error:', error.message)
      return true // fail-open
    }
    return data as boolean
  } catch (e) {
    console.error('[rate-limit/db] exception:', e)
    return true // fail-open
  }
}

// ─── API pública ──────────────────────────────────────────────────────────────
/**
 * Verifica rate limit.
 * - Com UPSTASH_REDIS_REST_URL + TOKEN: usa Redis (~1ms, sliding window).
 * - Sem essas env vars: fallback para Supabase DB (~15ms, igualmente correto).
 * Fail-open: se ambos falharem, permite a requisição.
 *
 * @param key           ex. "checkout:user-uuid"
 * @param maxCount      máximo de requisições na janela
 * @param windowSeconds duração da janela
 */
export async function checkRateLimit(
  key: string,
  maxCount: number,
  windowSeconds: number,
): Promise<boolean> {
  const r = getRedis()

  if (r) {
    try {
      const rl = new Ratelimit({
        redis:     r,
        limiter:   Ratelimit.slidingWindow(maxCount, `${windowSeconds} s`),
        analytics: false,
        prefix:    'rl',
      })
      const { success } = await rl.limit(key)
      return success
    } catch (e) {
      console.error('[rate-limit/redis] error — falling back to DB:', e)
      // Se o Redis cair, tenta o DB antes de fail-open
    }
  }

  return checkRateLimitDB(key, maxCount, windowSeconds)
}
