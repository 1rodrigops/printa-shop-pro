-- Fix Security Issue: Admin Activity Logs Accessible to All Users
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Only authenticated users can view activity logs" ON admin_activity_log;

-- Create restricted policy for admins only
CREATE POLICY "Only admins can view activity logs" 
ON admin_activity_log 
FOR SELECT 
TO authenticated 
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow users to view their own actions
CREATE POLICY "Users can view their own actions" 
ON admin_activity_log 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Fix Security Issue: Payment Gateway Credentials Accessible to All Admins
-- Drop policy allowing all admins to view payment settings
DROP POLICY IF EXISTS "SuperAdmin e Admin podem ver configurações de pagamento" ON payment_settings;

-- Create policy restricting to superadmin only
CREATE POLICY "Only superadmin can view payment settings" 
ON payment_settings 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Update UPDATE policy to superadmin only
DROP POLICY IF EXISTS "SuperAdmin pode atualizar configurações de pagamento" ON payment_settings;

CREATE POLICY "Only superadmin can update payment settings" 
ON payment_settings 
FOR UPDATE 
TO authenticated 
USING (has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));