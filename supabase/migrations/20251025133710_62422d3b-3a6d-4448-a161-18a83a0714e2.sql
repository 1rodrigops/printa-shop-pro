-- Inserir role de superadmin para o usuário marketing@agilgas.com.br
INSERT INTO public.user_roles (user_id, role)
VALUES ('3acb9b78-c499-4b60-938e-ab5fe5e60300', 'superadmin')
ON CONFLICT (user_id, role) DO UPDATE SET role = 'superadmin';

-- Opcional: Criar comentário para documentar
COMMENT ON TABLE public.user_roles IS 'Tabela de roles de usuários. SuperAdmin: marketing@agilgas.com.br';