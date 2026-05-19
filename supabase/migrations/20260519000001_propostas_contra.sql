-- Adiciona suporte a contra-proposta em propostas
ALTER TABLE public.propostas
  ADD COLUMN IF NOT EXISTS contra_eu_ofereco INTEGER[]  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contra_eu_recebo  INTEGER[]  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contra_feita_por  UUID       DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL;
