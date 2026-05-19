-- Segunda rodada de contra-proposta (feita pelo de_user_id após receber a contra do para_user_id)
ALTER TABLE public.propostas
  ADD COLUMN IF NOT EXISTS contra2_eu_ofereco INTEGER[]  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contra2_eu_recebo  INTEGER[]  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contra2_feita_por  UUID       DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL;
