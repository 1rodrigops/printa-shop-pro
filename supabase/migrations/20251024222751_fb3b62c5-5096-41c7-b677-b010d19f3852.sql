-- Adicionar função para obter a role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Atualizar RLS policies para clientes na tabela orders
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;

CREATE POLICY "Clientes podem ver seus próprios pedidos"
ON public.orders
FOR SELECT
USING (
  has_role(auth.uid(), 'cliente'::app_role) AND customer_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
);

CREATE POLICY "Público pode criar pedidos"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Adicionar trigger para registrar visualizações de pedidos por clientes
CREATE OR REPLACE FUNCTION public.log_order_view()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_email TEXT;
BEGIN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    IF v_user_email IS NOT NULL AND has_role(auth.uid(), 'cliente'::app_role) THEN
        INSERT INTO public.admin_activity_log (
            user_id,
            user_email,
            action_type,
            action_detail,
            result,
            metadata
        ) VALUES (
            auth.uid(),
            v_user_email,
            'pedido_view',
            format('Consultou pedido #%s', LEFT(NEW.id::TEXT, 8)),
            'Sucesso',
            jsonb_build_object(
                'order_id', NEW.id,
                'customer_name', NEW.customer_name
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;