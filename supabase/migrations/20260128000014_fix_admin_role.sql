-- Atualiza forçadamente o perfil do usuário para ADMIN
-- Substitua o UUID abaixo pelo seu se for diferente, mas usei o que você forneceu anteriormente.
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '8c6b9345-7b0e-4d79-aa2a-6ed9706cbadd';

-- Garante que admin tenha acesso total (já coberto pela lógica, mas reforça consistência)
