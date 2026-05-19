-- Tabela para rate limiting do admin login (persistente entre instâncias Vercel)
CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  ip         TEXT        PRIMARY KEY,
  count      INTEGER     NOT NULL DEFAULT 1,
  reset_at   TIMESTAMPTZ NOT NULL
);

-- Sem RLS — acessada apenas via service role
