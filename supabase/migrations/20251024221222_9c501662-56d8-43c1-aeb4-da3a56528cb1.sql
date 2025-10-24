-- Create table for admin activity logs
CREATE TABLE public.admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    action_type TEXT NOT NULL,
    action_detail TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ip_address TEXT,
    result TEXT DEFAULT 'Sucesso',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX idx_admin_activity_log_timestamp ON public.admin_activity_log(timestamp DESC);
CREATE INDEX idx_admin_activity_log_user_id ON public.admin_activity_log(user_id);
CREATE INDEX idx_admin_activity_log_action_type ON public.admin_activity_log(action_type);

-- RLS Policies
CREATE POLICY "Only authenticated users can view activity logs"
ON public.admin_activity_log
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert activity logs"
ON public.admin_activity_log
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to log admin activity
CREATE OR REPLACE FUNCTION public.log_admin_activity(
    p_action_type TEXT,
    p_action_detail TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_result TEXT DEFAULT 'Sucesso',
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
    v_user_email TEXT;
BEGIN
    -- Get user email
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Insert log
    INSERT INTO public.admin_activity_log (
        user_id,
        user_email,
        action_type,
        action_detail,
        ip_address,
        result,
        metadata
    ) VALUES (
        auth.uid(),
        v_user_email,
        p_action_type,
        p_action_detail,
        p_ip_address,
        p_result,
        p_metadata
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- Trigger to log order status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_email TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        SELECT email INTO v_user_email
        FROM auth.users
        WHERE id = auth.uid();
        
        INSERT INTO public.admin_activity_log (
            user_id,
            user_email,
            action_type,
            action_detail,
            result,
            metadata
        ) VALUES (
            auth.uid(),
            COALESCE(v_user_email, 'Sistema'),
            'pedido_edit',
            format('Alterou status do pedido #%s de "%s" para "%s"', 
                LEFT(NEW.id::TEXT, 8), 
                OLD.status, 
                NEW.status
            ),
            'Sucesso',
            jsonb_build_object(
                'order_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'customer_name', NEW.customer_name
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();