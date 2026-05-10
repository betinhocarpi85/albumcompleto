-- Adiciona colunas de plano na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plano           TEXT NOT NULL DEFAULT 'free' CHECK (plano IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS plano_expira_em TIMESTAMPTZ;
