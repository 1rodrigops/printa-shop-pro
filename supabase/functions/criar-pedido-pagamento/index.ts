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

    // Criar pedido no banco
    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name: cliente.nome,
        customer_email: cliente.email,
        customer_phone: cliente.telefone,
        shirt_color: produtos.cor,
        shirt_size: 'Variados',
        quantity: produtos.total_pecas,
        total_price: pagamento.valor_total,
        status: 'pending',
        notes: JSON.stringify({
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
        })
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
