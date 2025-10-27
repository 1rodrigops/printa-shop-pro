import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const { createClient } = await import('jsr:@supabase/supabase-js@2');
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const { cliente, produtos, pagamento, imagens }: PedidoRequest = await req.json();

    console.log('Criando pedido para:', cliente.email);

    // Buscar configurações de pagamento com tratamento de erro
    const { data: paymentSettings, error: settingsError } = await supabaseAdmin
      .from('payment_settings')
      .select('*')
      .maybeSingle();

    // Se não houver configurações, criar uma padrão com PIX habilitado
    let settings = paymentSettings;
    if (!settings) {
      console.log('Criando configurações de pagamento padrão');
      const { data: newSettings } = await supabaseAdmin
        .from('payment_settings')
        .insert({
          pix_enabled: true,
          pagseguro_enabled: false,
          mercadopago_enabled: false,
          pix_chave: '',
          pix_nome_beneficiario: 'Empresa'
        })
        .select()
        .single();
      settings = newSettings;
    }

    // Verificar se o método está habilitado (apenas avisar, não bloquear)
    if (settings) {
      if (pagamento.metodo === 'pix' && !settings.pix_enabled) {
        console.warn('PIX não está habilitado nas configurações');
      }
      if (pagamento.metodo === 'pagseguro' && !settings.pagseguro_enabled) {
        console.warn('PagSeguro não está habilitado nas configurações');
      }
      if (pagamento.metodo === 'mercadopago' && !settings.mercadopago_enabled) {
        console.warn('Mercado Pago não está habilitado nas configurações');
      }
    }

    // Determinar tamanho principal
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
        front_image_url: imagens?.frente ? 'base64_image' : null,
        back_image_url: imagens?.verso ? 'base64_image' : null,
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
      throw new Error(`Erro ao criar pedido: ${pedidoError.message}`);
    }

    console.log('Pedido criado com ID:', pedido.id);

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

    // Processar pagamento baseado no método
    let pagamentoUrl = '';
    let qrCodeData = null;

    if (pagamento.metodo === 'pix') {
      qrCodeData = {
        chave: settings?.pix_chave || '',
        nome_recebedor: settings?.pix_nome_beneficiario || 'Empresa',
        valor: pagamento.valor_total,
        pedido_id: pedido.id
      };
    } else if (pagamento.metodo === 'pagseguro') {
      pagamentoUrl = `https://pagseguro.uol.com.br/checkout?code=EXAMPLE_${pedido.id}`;
    } else if (pagamento.metodo === 'mercadopago') {
      pagamentoUrl = `https://www.mercadopago.com.br/checkout?pref_id=EXAMPLE_${pedido.id}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        pedido_id: pedido.id,
        pagamento_url: pagamentoUrl,
        qr_code_data: qrCodeData
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Erro no processamento:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar pedido' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});