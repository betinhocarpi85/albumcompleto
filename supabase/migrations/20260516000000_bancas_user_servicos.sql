-- Adiciona user_id e servicos à tabela bancas
-- user_id: vincula a banca ao usuário que cadastrou (auto-registro)
-- servicos: array de serviços oferecidos (troca, venda, compra, album, pacote)

ALTER TABLE bancas
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS servicos text[] DEFAULT '{}';

-- Index para buscar banca pelo dono
CREATE INDEX IF NOT EXISTS bancas_user_id_idx ON bancas (user_id);

-- Garante que cada usuário só pode ter uma banca
CREATE UNIQUE INDEX IF NOT EXISTS bancas_user_id_unique ON bancas (user_id) WHERE user_id IS NOT NULL;
