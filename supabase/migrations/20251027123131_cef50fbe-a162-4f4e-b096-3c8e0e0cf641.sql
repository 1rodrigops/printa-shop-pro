-- Remover política restritiva e criar uma mais adequada para área admin
DROP POLICY IF EXISTS "Clientes podem ver seus próprios pedidos" ON public.orders;

-- Permitir que usuários autenticados (admin) vejam todos os pedidos
CREATE POLICY "Usuários autenticados podem ver pedidos"
ON public.orders
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Manter políticas existentes para admin gerenciar
-- (as outras políticas de UPDATE e DELETE já existem e estão corretas)