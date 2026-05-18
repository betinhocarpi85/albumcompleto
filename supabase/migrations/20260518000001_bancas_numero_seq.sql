-- Número sequencial por banca — identificador amigável para o usuário
-- Ex: Banca da Resenha #1, Banca da Resenha #2 (cidades diferentes)

CREATE SEQUENCE IF NOT EXISTS public.bancas_numero_seq START 1;

ALTER TABLE public.bancas
  ADD COLUMN IF NOT EXISTS numero INTEGER DEFAULT nextval('public.bancas_numero_seq');

-- Popula bancas já existentes (retroativo)
UPDATE public.bancas SET numero = nextval('public.bancas_numero_seq') WHERE numero IS NULL;
