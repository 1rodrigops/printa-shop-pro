import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { phone, customerName, orderDetails }: WhatsAppRequest = await req.json();
    
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
