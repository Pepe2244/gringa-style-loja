import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// --- CORREÇÃO 1: IDs de produto são NÚMEROS ---
interface ItemCarrinho {
  produto_id: number; // Era 'string'
  quantidade: number;
  preco_unitario: number;
}

interface Cupom {
  id: string;
  codigo: string;
  tipo_desconto: 'percentual' | 'fixo';
  valor_desconto: number;
  tipo_aplicacao: 'carrinho' | 'produto';
  produtos_aplicaveis: number[] | null; // Era 'string[]'
  data_validade: string | null;
  limite_uso: number | null;
  usos_atuais: number;
  ativo: boolean;
}

console.log("Função 'validar-cupom' (v2) inicializada.");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { codigo_cupom, itens_carrinho } = await req.json();

    if (!codigo_cupom || !itens_carrinho || itens_carrinho.length === 0) {
      throw new Error("Código do cupom ou itens do carrinho ausentes.");
    }

    // Agora deve funcionar, pois os Secrets (Passo 1) foram configurados
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: cupom, error: cupomError } = await supabaseClient
      .from('cupons')
      .select('*')
      .eq('codigo', codigo_cupom.toUpperCase())
      .single();

    if (cupomError || !cupom) {
      return new Response(
        JSON.stringify({ valido: false, mensagem: "Cupom inválido ou não encontrado." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!cupom.ativo) {
      return new Response(
        JSON.stringify({ valido: false, mensagem: "Este cupom não está mais ativo." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) {
      return new Response(
        JSON.stringify({ valido: false, mensagem: "Este cupom expirou." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (cupom.limite_uso && cupom.usos_atuais >= cupom.limite_uso) {
      return new Response(
        JSON.stringify({ valido: false, mensagem: "Este cupom atingiu o limite de usos." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let subtotal = 0;
    let desconto = 0;

    itens_carrinho.forEach((item: ItemCarrinho) => {
      subtotal += item.preco_unitario * item.quantidade;
    });

    if (cupom.tipo_aplicacao === 'carrinho') {
      if (cupom.tipo_desconto === 'percentual') {
        desconto = subtotal * (cupom.valor_desconto / 100);
      } else {
        desconto = cupom.valor_desconto;
      }

    } else if (cupom.tipo_aplicacao === 'produto') {
      itens_carrinho.forEach((item: ItemCarrinho) => {
        // --- CORREÇÃO 2: 'produto_id' agora é 'number' ---
        if (cupom.produtos_aplicaveis?.includes(item.produto_id)) {
          const subtotalItem = item.preco_unitario * item.quantidade;
          if (cupom.tipo_desconto === 'percentual') {
            desconto += subtotalItem * (cupom.valor_desconto / 100);
          } else {
            // Regra: Desconto fixo por *TIPO* de produto, não por quantidade
            desconto += cupom.valor_desconto;
          }
        }
      });

      if (desconto === 0) {
        return new Response(
          JSON.stringify({ valido: false, mensagem: "Nenhum produto válido para este cupom no carrinho." }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (desconto > subtotal) {
      desconto = subtotal;
    }

    // --- CORREÇÃO 3: INCREMENTAR O USO DO CUPOM ---
    // Atualiza o contador de usos no banco ANTES de retornar sucesso.
    const { error: updateError } = await supabaseClient
      .from('cupons')
      .update({ usos_atuais: cupom.usos_atuais + 1 })
      .eq('id', cupom.id);

    if (updateError) {
      // Se falhar ao atualizar o contador, não aplica o cupom
      throw new Error(`Falha ao registrar uso do cupom: ${updateError.message}`);
    }
    // --- FIM DA CORREÇÃO 3 ---

    const cupomValidado = {
      ...cupom,
      desconto_calculado: desconto, // O carrinho.js precisa disso
    };

    return new Response(
      JSON.stringify({ 
        valido: true, 
        mensagem: "Cupom aplicado com sucesso!",
        cupom: cupomValidado 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função validar-cupom:', error.message);
    return new Response(
      JSON.stringify({ valido: false, mensagem: `Erro interno: ${error.message}` }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
