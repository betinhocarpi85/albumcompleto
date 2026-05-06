-- ============================================================
-- completando.com.br — Schema Supabase
-- Rode este arquivo no SQL Editor do seu projeto Supabase
-- ============================================================

-- ── PROFILES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome                TEXT,
  cpf                 TEXT,
  data_nascimento     TEXT,
  maior_18            BOOLEAN NOT NULL DEFAULT FALSE,
  aceitou_termos      BOOLEAN NOT NULL DEFAULT FALSE,
  aceitou_privacidade BOOLEAN NOT NULL DEFAULT FALSE,
  cep                 TEXT,
  uf                  TEXT,
  logradouro          TEXT,
  numero              TEXT,
  complemento         TEXT,
  cidade              TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: leitura própria"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: inserção própria"  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: atualização própria" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Cria perfil vazio automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── COLADAS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coladas (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  album_id   TEXT    NOT NULL,
  sticker_id TEXT    NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, album_id, sticker_id)
);

ALTER TABLE public.coladas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coladas: gestão própria" ON public.coladas FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS coladas_user_album_idx ON public.coladas (user_id, album_id);


-- ── ANÚNCIOS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.anuncios (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo         TEXT    NOT NULL CHECK (tipo IN ('tenho', 'preciso')),
  album_id     TEXT    NOT NULL DEFAULT 'copa-2026',
  sid          TEXT    NOT NULL,
  g_num        INTEGER,
  nome         TEXT,
  qty          INTEGER NOT NULL DEFAULT 1,
  sticker_tipo TEXT,
  preco        NUMERIC(10,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tipo, album_id, sid)
);

ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anuncios: gestão própria"     ON public.anuncios FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "anuncios: leitura pública (tenho)" ON public.anuncios FOR SELECT USING (tipo = 'tenho');

CREATE INDEX IF NOT EXISTS anuncios_user_tipo_idx ON public.anuncios (user_id, tipo);
CREATE INDEX IF NOT EXISTS anuncios_album_tipo_idx ON public.anuncios (album_id, tipo);


-- ── PROPOSTAS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.propostas (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  de_user_id   UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  para_user_id UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  eu_ofereco   INTEGER[] NOT NULL DEFAULT '{}',
  eu_recebo    INTEGER[] NOT NULL DEFAULT '{}',
  status       TEXT    NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceita', 'recusada')),
  minha_escolha JSONB,
  enviar_para  JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "propostas: leitura própria" ON public.propostas FOR SELECT
  USING (auth.uid() = de_user_id OR auth.uid() = para_user_id);
CREATE POLICY "propostas: criar"  ON public.propostas FOR INSERT WITH CHECK (auth.uid() = de_user_id);
CREATE POLICY "propostas: atualizar" ON public.propostas FOR UPDATE
  USING (auth.uid() = de_user_id OR auth.uid() = para_user_id);

CREATE INDEX IF NOT EXISTS propostas_de_idx   ON public.propostas (de_user_id);
CREATE INDEX IF NOT EXISTS propostas_para_idx ON public.propostas (para_user_id);


-- ── PEDIDOS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pedidos (
  id               TEXT PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data             TEXT NOT NULL,
  tipo             TEXT NOT NULL CHECK (tipo IN ('venda', 'troca', 'doacao')),
  status           TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('concluido', 'pendente', 'cancelado')),
  contraparte      TEXT NOT NULL,
  fig              TEXT NOT NULL,
  valor            NUMERIC(10,2),
  endereco_entrega TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedidos: gestão própria" ON public.pedidos FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS pedidos_user_idx ON public.pedidos (user_id, created_at DESC);


-- ── PREFERÊNCIAS DO USUÁRIO ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id       UUID  PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_albums TEXT[] NOT NULL DEFAULT ARRAY['copa-2026'],
  notifs_seen   TEXT[] NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prefs: gestão própria" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
