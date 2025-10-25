-- Create whatsapp_message_logs table for tracking all WhatsApp messages
CREATE TABLE IF NOT EXISTS public.whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id TEXT,
  numero TEXT NOT NULL,
  evento TEXT NOT NULL,
  tipo_envio TEXT NOT NULL CHECK (tipo_envio IN ('automatico', 'manual')),
  payload JSONB,
  status_http TEXT,
  resposta_api TEXT,
  tempo_envio_ms INTEGER,
  enviado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;

-- SuperAdmin and Admin can view logs
CREATE POLICY "SuperAdmin e Admin podem ver logs WhatsApp"
  ON public.whatsapp_message_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('superadmin', 'admin')
    )
  );

-- Only system or superadmin can insert logs
CREATE POLICY "Sistema e SuperAdmin podem inserir logs WhatsApp"
  ON public.whatsapp_message_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Only superadmin can delete logs
CREATE POLICY "Apenas SuperAdmin pode deletar logs WhatsApp"
  ON public.whatsapp_message_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Create indexes for faster queries
CREATE INDEX idx_whatsapp_logs_pedido ON public.whatsapp_message_logs(pedido_id);
CREATE INDEX idx_whatsapp_logs_numero ON public.whatsapp_message_logs(numero);
CREATE INDEX idx_whatsapp_logs_evento ON public.whatsapp_message_logs(evento);
CREATE INDEX idx_whatsapp_logs_created_at ON public.whatsapp_message_logs(created_at DESC);