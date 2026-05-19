-- Adiciona colunas para fluxo de compra/venda
ALTER TABLE public.propostas
  ADD COLUMN IF NOT EXISTS valor_total    NUMERIC(10,2),  -- preço oferecido pelo comprador
  ADD COLUMN IF NOT EXISTS valor_original NUMERIC(10,2),  -- preço anunciado (soma dos preços individuais)
  ADD COLUMN IF NOT EXISTS contra_valor   NUMERIC(10,2);  -- contra-proposta de preço do vendedor
