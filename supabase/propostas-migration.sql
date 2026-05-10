-- Adiciona colunas faltantes na tabela propostas
ALTER TABLE public.propostas
  ADD COLUMN IF NOT EXISTS tipo      TEXT NOT NULL DEFAULT 'troca' CHECK (tipo IN ('troca', 'compra')),
  ADD COLUMN IF NOT EXISTS album_id  TEXT NOT NULL DEFAULT 'copa-2026';

-- Função: retorna telefone da contraparte quando proposta está aceita
CREATE OR REPLACE FUNCTION public.get_phone_for_proposta(p_proposta_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_de_user_id   UUID;
  v_para_user_id UUID;
  v_status       TEXT;
  v_other_id     UUID;
  v_phone        TEXT;
BEGIN
  -- Busca a proposta
  SELECT de_user_id, para_user_id, status
    INTO v_de_user_id, v_para_user_id, v_status
    FROM public.propostas
   WHERE id = p_proposta_id;

  -- Só funciona se aceita e o caller é parte da proposta
  IF v_status <> 'aceita' THEN RETURN NULL; END IF;
  IF auth.uid() NOT IN (v_de_user_id, v_para_user_id) THEN RETURN NULL; END IF;

  -- Telefone da contraparte
  v_other_id := CASE WHEN auth.uid() = v_de_user_id THEN v_para_user_id ELSE v_de_user_id END;

  SELECT telefone INTO v_phone FROM public.profiles WHERE id = v_other_id;
  RETURN v_phone;
END;
$$;
