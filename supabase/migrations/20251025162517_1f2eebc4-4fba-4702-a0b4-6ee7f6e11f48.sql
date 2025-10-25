-- Create system_config table for storing system-wide configurations
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  config_category TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read system configs
CREATE POLICY "SuperAdmins can view system configs"
  ON public.system_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Only superadmins can insert system configs
CREATE POLICY "SuperAdmins can insert system configs"
  ON public.system_config
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Only superadmins can update system configs
CREATE POLICY "SuperAdmins can update system configs"
  ON public.system_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Only superadmins can delete system configs
CREATE POLICY "SuperAdmins can delete system configs"
  ON public.system_config
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON public.system_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_system_config_key ON public.system_config(config_key);
CREATE INDEX idx_system_config_category ON public.system_config(config_category);

-- Insert default WhatsApp API config placeholders
INSERT INTO public.system_config (config_key, config_value, config_category, description)
VALUES 
  ('api_whatsapp_url', '', 'whatsapp', 'URL do servidor WhatsApp API'),
  ('api_whatsapp_key', '', 'whatsapp', 'Chave de API global WhatsApp'),
  ('api_whatsapp_provider', 'WuzAPI', 'whatsapp', 'Provedor de API WhatsApp (WuzAPI, Evolution API, Outro)')
ON CONFLICT (config_key) DO NOTHING;