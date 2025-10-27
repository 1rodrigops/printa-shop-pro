import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PedidoRequest {
  cliente: {
    nome: string;
    email: string;
    telefone: string;
    endereco_rua: string;
    endereco_numero: string;
    endereco_bairro: string;
    endereco_cidade: string;
    endereco_uf: string;
    cep: string;
  };
  produtos: {
    tipo_estampa: string;
    tecido: string;
    tamanhos: Record<string, number>;
    cor: string;
    total_pecas: number;
  };
  pagamento: {
    metodo: 'pix' | 'pagseguro' | 'mercadopago';
    valor_total: number;
  };
  imagens?: {
    frente: string;
    verso?: string;
  };
}

// Helper para fazer upload de imagem base64 para o storage
async function uploadBase64Image(
  supabase: any,
  base64Data: string,
  filename: string
): Promise<string | null> {
  try {
    // Remove o prefixo data:image/...;base64,
    const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const buffer = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
    
    const { data, error } = await supabase.storage
      .from('order-images')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      return null;
    }

    // Retornar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('order-images')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { cliente, produtos, pagamento, imagens }: PedidoRequest = await req.json();

    console.log('Criando pedido:', { cliente, produtos, pagamento });

    // Buscar configurações de pagamento
    const { data: paymentSettings, error: settingsError } = await supabaseAdmin
      .from('payment_settings')
      .select('*')
      .single();

    if (settingsError || !paymentSettings) {
      console.error('Erro ao buscar configurações:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Configurações de pagamento não encontradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o método está habilitado
    if (pagamento.metodo === 'pix' && !paymentSettings.pix_enabled) {
      return new Response(
        JSON.stringify({ error: 'PIX não está habilitado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (pagamento.metodo === 'pagseguro' && !paymentSettings.pagseguro_enabled) {
      return new Response(
        JSON.stringify({ error: 'PagSeguro não está habilitado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (pagamento.metodo === 'mercadopago' && !paymentSettings.mercadopago_enabled) {
      return new Response(
        JSON.stringify({ error: 'Mercado Pago não está habilitado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fazer upload das imagens se fornecidas
    let frontImageUrl = null;
    let backImageUrl = null;
    
    if (imagens?.frente) {
      const timestamp = Date.now();
      frontImageUrl = await uploadBase64Image(
        supabaseAdmin,
        imagens.frente,
        `orders/${timestamp}_front.png`
      );
      console.log('Upload frente:', frontImageUrl);
    }
    
    if (imagens?.verso) {
      const timestamp = Date.now() + 1; // +1 para evitar colisão
      backImageUrl = await uploadBase64Image(
        supabaseAdmin,
        imagens.verso,
        `orders/${timestamp}_back.png`
      );
      console.log('Upload verso:', backImageUrl);
    }

    // Determinar tamanho principal para o campo enum
    const sizesOrdered = Object.entries(produtos.tamanhos)
      .filter(([_, qty]) => qty > 0)
      .map(([size, _]) => size);
    const mainSize = sizesOrdered.length > 0 ? sizesOrdered[0] : 'M';

    // Criar pedido no banco
    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name: cliente.nome,
        customer_email: cliente.email,
        customer_phone: cliente.telefone,
        shirt_color: produtos.cor,
        shirt_size: mainSize,
        quantity: produtos.total_pecas,
        total_price: pagamento.valor_total,
        status: 'pending',
        front_image_url: frontImageUrl,
        back_image_url: backImageUrl,
        order_details: {
          tipo_estampa: produtos.tipo_estampa,
          tecido: produtos.tecido,
          tamanhos: produtos.tamanhos,
          endereco: {
            rua: cliente.endereco_rua,
            numero: cliente.endereco_numero,
            bairro: cliente.endereco_bairro,
            cidade: cliente.endereco_cidade,
            uf: cliente.endereco_uf,
            cep: cliente.cep
          },
          origem: 'lovable_personalizar',
          metodo_pagamento: pagamento.metodo
        }
      })
      .select()
      .single();

    if (pedidoError) {
      console.error('Erro ao criar pedido:', pedidoError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar pedido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Pedido criado:', pedido);

    // Enviar confirmação via WhatsApp automaticamente
    try {
      const mensagemWhatsApp = `🛍️ Olá ${cliente.nome}! Recebemos seu pedido no site.\n\nPedido nº ${pedido.id.split('-')[0]}\nValor: R$ ${pagamento.valor_total.toFixed(2)}\n\nAcompanhe o status pelo nosso WhatsApp.\nAssim que for atualizado, avisaremos por aqui. 💬`;
      
      await supabaseAdmin.functions.invoke('send-whatsapp', {
        body: {
          phoneNumber: cliente.telefone.replace(/\D/g, ''),
          message: mensagemWhatsApp
        }
      });
      
      console.log('Mensagem WhatsApp enviada com sucesso');
    } catch (whatsappError) {
      console.error('Erro ao enviar WhatsApp:', whatsappError);
      // Não bloqueia o pedido se WhatsApp falhar
    }

    // Processar pagamento baseado no método
    let pagamentoUrl = '';
    let qrCodeData = null;

    if (pagamento.metodo === 'pix') {
      // Retornar dados do PIX (chave, QR code, etc)
      qrCodeData = {
        chave: paymentSettings.pix_chave,
        nome_recebedor: paymentSettings.pix_nome_recebedor,
        banco: paymentSettings.pix_banco,
        valor: pagamento.valor_total,
        pedido_id: pedido.id
      };
    } else if (pagamento.metodo === 'pagseguro') {
      // Aqui você integraria com a API do PagSeguro
      // Por ora, retornamos URL de exemplo
      pagamentoUrl = `https://pagseguro.uol.com.br/v2/checkout/payment.html?code=EXAMPLE_${pedido.id}`;
    } else if (pagamento.metodo === 'mercadopago') {
      // Aqui você integraria com a API do Mercado Pago
      // Por ora, retornamos URL de exemplo
      pagamentoUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=EXAMPLE_${pedido.id}`;
    }

    // Registrar log de pagamento
    await supabaseAdmin
      .from('payment_logs')
      .insert({
        pedido_id: pedido.id,
        metodo_pagamento: pagamento.metodo,
        valor: pagamento.valor_total,
        status: 'Aguardando',
        mensagem_api: 'Pedido criado, aguardando pagamento'
      });

    return new Response(
      JSON.stringify({
        success: true,
        pedido_id: pedido.id,
        pagamento_url: pagamentoUrl,
        qr_code_data: qrCodeData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro no processamento:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao processar pedido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
