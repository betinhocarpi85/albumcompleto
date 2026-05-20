-- Atualiza o trigger de sincronização para copiar o nome do provider OAuth
-- (Google, etc.) quando profiles.nome ainda estiver vazio.
-- Usuários de email sem nome continuam sem nome até completar o cadastro.
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE public.profiles
  SET
    email           = NEW.email,
    last_sign_in_at = NEW.last_sign_in_at,
    provider        = COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    created_at      = COALESCE((SELECT created_at FROM public.profiles WHERE id = NEW.id), NEW.created_at),
    -- Preenche nome apenas se ainda estiver vazio E vier de um provider OAuth
    -- (evita sobrescrever nome já preenchido pelo usuário no completar-cadastro)
    nome            = CASE
                        WHEN nome IS NOT NULL THEN nome
                        WHEN COALESCE(NEW.raw_app_meta_data->>'provider', 'email') != 'email'
                          THEN COALESCE(
                            NEW.raw_user_meta_data->>'full_name',
                            NEW.raw_user_meta_data->>'name'
                          )
                        ELSE nome
                      END
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Backfill: atualiza usuários Google que já existem sem nome
UPDATE public.profiles p
SET nome = COALESCE(
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'name'
)
FROM auth.users u
WHERE p.id = u.id
  AND p.nome IS NULL
  AND COALESCE(u.raw_app_meta_data->>'provider', 'email') != 'email'
  AND COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name'
  ) IS NOT NULL;
