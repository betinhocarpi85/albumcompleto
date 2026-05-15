-- ============================================================
-- MIGRAÇÃO: Escalabilidade para milhões de usuários
-- Data: 2026-05-15
-- ============================================================
-- COMO APLICAR:
--   Supabase Dashboard → SQL Editor → cole e execute
-- ============================================================


-- ── 1. Extensão trigram (busca ILIKE rápida) ────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ── 2. Colunas desnormalizadas em profiles ──────────────────
--   Evita N chamadas getUserById por página no admin
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email           TEXT,
  ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider        TEXT DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ DEFAULT now();


-- ── 3. Popula dados existentes a partir de auth.users ───────
UPDATE public.profiles p
SET
  email           = u.email,
  last_sign_in_at = u.last_sign_in_at,
  provider        = COALESCE(u.raw_app_meta_data->>'provider', 'email'),
  created_at      = u.created_at
FROM auth.users u
WHERE p.id = u.id;


-- ── 4. Trigger: sincroniza email em tempo real ───────────────
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE public.profiles
  SET
    email           = NEW.email,
    last_sign_in_at = NEW.last_sign_in_at,
    provider        = COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    created_at      = COALESCE((SELECT created_at FROM public.profiles WHERE id = NEW.id), NEW.created_at)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_from_auth ON auth.users;
CREATE TRIGGER trg_sync_profile_from_auth
  AFTER INSERT OR UPDATE OF email, last_sign_in_at, raw_app_meta_data
  ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_auth();


-- ── 5. Índices de performance em profiles ───────────────────

-- Filtros escalares (igualdade/range)
CREATE INDEX IF NOT EXISTS idx_profiles_plano
  ON public.profiles(plano);

CREATE INDEX IF NOT EXISTS idx_profiles_uf
  ON public.profiles(uf);

CREATE INDEX IF NOT EXISTS idx_profiles_updated_at
  ON public.profiles(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON public.profiles(created_at DESC);

-- Índices parciais (bem menores, queries específicas)
CREATE INDEX IF NOT EXISTS idx_profiles_banned
  ON public.profiles(id)
  WHERE banned = true;

CREATE INDEX IF NOT EXISTS idx_profiles_incomplete
  ON public.profiles(id)
  WHERE telefone IS NULL OR cep IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_pro_ativo
  ON public.profiles(plano_expira_em)
  WHERE plano IN ('pro', 'anual', 'mensal');

-- Busca textual trigram (suporta ILIKE '%texto%' eficientemente)
CREATE INDEX IF NOT EXISTS idx_profiles_nome_trgm
  ON public.profiles USING gin(nome gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_email_trgm
  ON public.profiles USING gin(email gin_trgm_ops);


-- ── 6. Índices em anuncios ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_anuncios_user_id
  ON public.anuncios(user_id);

CREATE INDEX IF NOT EXISTS idx_anuncios_tipo
  ON public.anuncios(tipo);

CREATE INDEX IF NOT EXISTS idx_anuncios_album_id
  ON public.anuncios(album_id);

CREATE INDEX IF NOT EXISTS idx_anuncios_created_at
  ON public.anuncios(created_at DESC);

-- Composite para filtros combinados tipo+album
CREATE INDEX IF NOT EXISTS idx_anuncios_tipo_album
  ON public.anuncios(tipo, album_id);


-- ── 7. Índices em propostas ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_propostas_de_user
  ON public.propostas(de_user_id);

CREATE INDEX IF NOT EXISTS idx_propostas_para_user
  ON public.propostas(para_user_id);

CREATE INDEX IF NOT EXISTS idx_propostas_created_at
  ON public.propostas(created_at DESC);


-- ── 8. Índices em coladas ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_coladas_user_id
  ON public.coladas(user_id);

CREATE INDEX IF NOT EXISTS idx_coladas_created_at
  ON public.coladas(created_at DESC);


-- ── 9. Estatísticas atualizadas ──────────────────────────────
-- Faz o planner usar os novos índices imediatamente
ANALYZE public.profiles;
ANALYZE public.anuncios;
ANALYZE public.propostas;
ANALYZE public.coladas;
