import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'
import webPush from 'npm:web-push@3.6.7'
import 'npm:util' // Importa o util para compatibilidade
import { corsHeaders } from '../_shared/cors.ts'

interface Notificacao {
  id: number
  titulo: string
  mensagem: string
  link_url: string
}

interface Assinante {
  id: number
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Marca as notificações no banco com um status específico.
 * 'enviando' -> Trava as notificações para evitar envios duplicados.
 * 'enviado' -> Marca como concluído após o envio.
 */
async function marcarNotificacoes(ids: number[], status: 'enviando' | 'enviado', supabaseAdmin: SupabaseClient) {
  if (ids.length === 0) return

  try {
    let updateData: { status: string; enviado_em?: string } = { status: status }
    if (status === 'enviado') {
      updateData.enviado_em = new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from('notificacoes_push_queue')
      .update(updateData)
      .in('id', ids)

    if (error) throw error
  } catch (err) {
    console.error(`Erro ao marcar notificações como '${status}':`, err.message)
  }
}

async function deletarAssinantesMortos(ids: Set<number>, supabaseAdmin: SupabaseClient) {
  if (ids.size === 0) return

  try {
    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .in('id', Array.from(ids))
  } catch (err) {
    console.error('Erro ao deletar assinantes mortos:', err)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    webPush.setVapidDetails(
      'mailto:contato@gringastyle.com',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    )

    // PASSO 1: Buscar notificações 'aprovadas'
    const { data: notificacoes, error: notifError } = await supabaseAdmin
      .from('notificacoes_push_queue')
      .select('*')
      .eq('status', 'aprovado')

    if (notifError) throw notifError
    if (!notificacoes || notificacoes.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhuma notificação para enviar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const idsParaProcessar = notificacoes.map(n => n.id)

    // PASSO 2: **LOCK (A CORREÇÃO)**
    // Imediatamente marca as notificações como 'enviando' para que
    // um segundo request não as pegue ao mesmo tempo.
    await marcarNotificacoes(idsParaProcessar, 'enviando', supabaseAdmin)

    // PASSO 3: Buscar os assinantes
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, endpoint, keys')

    if (subError) throw subError
    if (!subscriptions || subscriptions.length === 0) {
      // Se não há assinantes, limpamos a fila de qualquer maneira
      await marcarNotificacoes(idsParaProcessar, 'enviado', supabaseAdmin)
      return new Response(JSON.stringify({ message: 'Nenhum assinante. Fila limpa.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // PASSO 4: Preparar e enviar todas as notificações
    const idsAssinantesMortos = new Set<number>()
    let enviosSucesso = 0
    let enviosFalhados = 0

    for (const notificacao of notificacoes as Notificacao[]) {
      const payload = JSON.stringify({
        titulo: notificacao.titulo,
        mensagem: notificacao.mensagem,
        link: notificacao.link_url,
      })

      const promessasEnvio = (subscriptions as Assinante[]).map(sub => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys,
        }

        return webPush.sendNotification(pushSubscription, payload)
          .then(() => {
            enviosSucesso++
          })
          .catch((error) => {
            enviosFalhados++
            if (error.statusCode === 410 || error.statusCode === 404) {
              idsAssinantesMortos.add(sub.id)
            } else {
              console.error(`Falha ao enviar para ${sub.id}:`, error.message)
            }
          })
      })

      // Espera o envio desta notificação específica terminar
      await Promise.all(promessasEnvio)
    }

    // PASSO 5: Limpar assinantes mortos e marcar notificações como 'enviado'
    await deletarAssinantesMortos(idsAssinantesMortos, supabaseAdmin)
    await marcarNotificacoes(idsParaProcessar, 'enviado', supabaseAdmin)

    const message = `Processo concluído. ${enviosSucesso} envios com sucesso, ${enviosFalhados} falhas. ${idsAssinantesMortos.size} assinantes removidos. ${idsParaProcessar.length} notificações marcadas como enviadas.`

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro fatal na função send-push:', error)
    // Tenta reverter o status para 'aprovado' em caso de falha no meio do caminho
    // Isso é opcional, mas boa prática.
    const { data: notificacoesTravadas } = await supabaseAdmin
      .from('notificacoes_push_queue')
      .select('id')
      .eq('status', 'enviando');
      
    if (notificacoesTravadas && notificacoesTravadas.length > 0) {
      const idsTravados = notificacoesTravadas.map(n => n.id);
      await marcarNotificacoes(idsTravados, 'aprovado', supabaseAdmin);
      console.error('Notificações travadas foram revertidas para "aprovado".');
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})