-- Tabela de rate limiting por chave (rota:userId)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key          text        PRIMARY KEY,
  count        int         NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

-- Sem RLS — acessada apenas pelo admin client (service_role)
ALTER TABLE public.rate_limits DISABLE ROW LEVEL SECURITY;

-- Função atômica: retorna true se a requisição for permitida, false se bloqueada.
-- Usa FOR UPDATE para evitar race condition em instâncias concorrentes.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key            text,
  p_max_count      int,
  p_window_seconds int
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count        int;
  v_window_start timestamptz;
BEGIN
  SELECT count, window_start
    INTO v_count, v_window_start
    FROM public.rate_limits
   WHERE key = p_key
     FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.rate_limits (key, count, window_start)
    VALUES (p_key, 1, now());
    RETURN true;
  END IF;

  -- Janela expirou: reinicia
  IF now() - v_window_start > (p_window_seconds || ' seconds')::interval THEN
    UPDATE public.rate_limits
       SET count = 1, window_start = now()
     WHERE key = p_key;
    RETURN true;
  END IF;

  -- Dentro da janela: verifica limite
  IF v_count >= p_max_count THEN
    RETURN false;
  END IF;

  UPDATE public.rate_limits
     SET count = count + 1
   WHERE key = p_key;
  RETURN true;
END;
$$;
