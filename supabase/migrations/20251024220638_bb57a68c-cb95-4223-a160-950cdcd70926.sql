-- Update RLS policies for orders table to allow only admins to update
DROP POLICY IF EXISTS "Anyone can view orders by email" ON public.orders;

CREATE POLICY "Anyone can view orders"
ON public.orders
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));