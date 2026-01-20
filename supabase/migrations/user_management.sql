-- 0. CRIAR O ROLE 'ENFERMAGEM' NO BANCO DE DADOS
-- O erro "não existe o role de enfermagem" acontece porque ele precisa ser adicionado ao tipo 'app_role' primeiro.
-- Execute este bloco separadamente ou antes de criar o usuário.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid  
                   WHERE t.typname = 'app_role' AND e.enumlabel = 'enfermagem') THEN
        ALTER TYPE app_role ADD VALUE 'enfermagem';
    END IF;
END$$;

-- EXCLUSÃO DA PARTE DE ESTOQUE
-- Para "excluir" o usuário do estoque, você pode deletar o usuário da tabela de autenticação e roles.
-- Substitua 'email_do_usuario_estoque@exemplo.com' pelo email real.

-- 1. Encontrar ID do usuário (Para referência)
-- SELECT id FROM auth.users WHERE email = 'email_do_usuario_estoque@exemplo.com';

-- 2. Deletar (Cuidado: isso deleta o usuário permanentemente)
-- DELETE FROM auth.users WHERE email = 'email_do_usuario_estoque@exemplo.com';

--------------------------------------------------------------------------------

-- CRIAÇÃO DO USUÁRIO DA ENFERMAGEM
-- 1. Vá no painel do Supabase -> Authentication -> Users -> Add User
-- 2. Crie o usuário com o email desejado (ex: enfermagem@imago.com) e senha.

-- 3. Após criar o usuário, execute o comando abaixo para dar a permissão de 'enfermagem'.
--    Você precisará do ID do usuário (UUID) gerado no passo acima.

-- Substitua 'UUID_DO_NOVO_USUARIO' pelo ID real do usuário criado.
INSERT INTO public.user_roles (user_id, role)
VALUES ('UUID_DO_NOVO_USUARIO', 'enfermagem');

-- Caso a tabela user_roles tenha restrições ou estrutura diferente, verifique com:
-- SELECT * FROM public.user_roles LIMIT 1;

-- Para garantir que o usuário tenha acesso apenas ao que deve, o código já foi atualizado
-- para checar o role 'enfermagem'.

--------------------------------------------------------------------------------
-- CHECAGEM DE ROLES EXISTENTES
-- SELECT * FROM public.user_roles;
