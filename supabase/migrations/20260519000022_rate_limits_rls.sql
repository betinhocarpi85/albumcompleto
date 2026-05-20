-- Habilita RLS na tabela rate_limits para silenciar o alerta do Supabase.
-- O service_role (admin client) bypassa RLS automaticamente — nada muda
-- no comportamento real. Sem policies = anon/authenticated não conseguem
-- ler nem escrever diretamente; só o backend acessa via admin client.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
