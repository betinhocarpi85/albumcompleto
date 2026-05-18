-- Adiciona coordenadas geográficas ao perfil do usuário
-- Usadas para encontrar a banca de jornal mais próxima quando um match é aceito

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

COMMENT ON COLUMN public.profiles.lat IS 'Latitude derivada do CEP via Nominatim (fire-and-forget ao salvar perfil)';
COMMENT ON COLUMN public.profiles.lng IS 'Longitude derivada do CEP via Nominatim (fire-and-forget ao salvar perfil)';
