-- Tabela de avaliações pós-troca
CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  de_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  para_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposta_id  UUID NOT NULL REFERENCES public.propostas(id) ON DELETE CASCADE,
  nota         SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (de_user_id, proposta_id)
);

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados inserem próprias avaliações"
  ON public.avaliacoes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = de_user_id);

CREATE POLICY "Autenticados leem avaliações"
  ON public.avaliacoes FOR SELECT
  TO authenticated
  USING (true);

-- Habilita real-time na tabela propostas para notificações instantâneas
ALTER PUBLICATION supabase_realtime ADD TABLE public.propostas;
