import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const whatsappSchema = z.object({
  phone: z.string()
    .regex(/^\d{10,15}$/, 'Número de telefone inválido')
    .refine(val => val.length >= 10 && val.length <= 15, 'Telefone deve ter entre 10 e 15 dígitos'),
  customerName: z.string()
    .trim()
    .min(2, 'Nome muito curto')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome contém caracteres inválidos'),
  orderDetails: z.object({
    quantity: z.number().int().min(1).max(1000),
    shirtColor: z.string().max(50),
    shirtSize: z.string().max(10),
    totalPrice: z.number().min(0).max(1000000)
  })
});

interface WhatsAppRequest {
  phone: string;
  customerName: string;
  orderDetails: {
    quantity: number;
    shirtColor: string;
    shirtSize: string;
    totalPrice: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    
    // Validate input
    let validatedData: WhatsAppRequest;
    try {
      validatedData = whatsappSchema.parse(requestData);
    } catch (error) {
      console.error('Validation error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos', 
          details: error instanceof z.ZodError ? error.errors : 'Formato de dados incorreto'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const { phone, customerName, orderDetails } = validatedData;
    
    const wuzapiToken = Deno.env.get('WUZAPI_TOKEN');
    const wuzapiUrl = Deno.env.get('WUZAPI_URL');

    if (!wuzapiToken || !wuzapiUrl) {
      throw new Error('Credenciais Wuzapi não configuradas');
    }

    // Formatar telefone (remover caracteres especiais)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Mensagem personalizada
    const message = `🎉 *Pedido Recebido com Sucesso!*

Olá ${customerName}! 👋

Recebemos seu pedido de camiseta personalizada!

📋 *Detalhes do Pedido:*
• Quantidade: ${orderDetails.quantity} unidade(s)
• Cor: ${orderDetails.shirtColor}
• Tamanho: ${orderDetails.shirtSize}
• Valor Total: R$ ${orderDetails.totalPrice.toFixed(2)}

Em breve entraremos em contato para acertar os detalhes de pagamento e entrega! 🚚

Obrigado por escolher nossa loja! ✨`;

    console.log('Enviando mensagem para:', cleanPhone);

    // Enviar mensagem via Wuzapi
    const response = await fetch(`${wuzapiUrl}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wuzapiToken}`,
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro Wuzapi:', errorText);
      throw new Error(`Erro ao enviar WhatsApp: ${response.status}`);
    }

    const result = await response.json();
    console.log('Mensagem enviada com sucesso:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Erro na função send-whatsapp:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
