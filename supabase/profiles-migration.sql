-- Adiciona colunas faltantes na tabela profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bairro    TEXT,
  ADD COLUMN IF NOT EXISTS telefone  TEXT;
