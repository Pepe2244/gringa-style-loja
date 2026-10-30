import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "https://esm.sh/web-push@3.6.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 0. AUTENTICAÇÃO E AUTORIZAÇÃO (Bloqueia chamadas anônimas públicas)
    const authHeader = req.headers.get('authorization') || '';
    const secretHeader = req.headers.get('x-webhook-secret') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const expectedSecret = Deno.env.get('PUSH_WEBHOOK_SECRET') ?? '';

    const isServiceRole = serviceKey && authHeader.replace(/^Bearer\s+/i, '') === serviceKey;
    const isWebhookSecretValid = expectedSecret && secretHeader === expectedSecret;

    if (!isServiceRole && !isWebhookSecretValid) {
      return new Response(JSON.stringify({ error: 'Não autorizado.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // 1. INICIALIZAÇÃO DO ADMIN
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. CONFIGURAÇÃO VAPID (Blindada contra chaves inválidas)
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contato@gringastylebr.com.br'

    if (!publicKey || !privateKey) {
      throw new Error("Chaves VAPID não configuradas nas Secrets!")
    }

    webpush.setVapidDetails(subject, publicKey, privateKey)

    // 3. CAPTURA DOS DADOS DO WEBHOOK
    const { record } = await req.json()
    console.log(`Processando notificação ID: ${record.id}`)

    // 4. BUSCA DE INSCRITOS
    const { data: subs, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')

    if (subError) throw subError

    const allSubs = subs || []
    const results: Array<{ success: boolean; error?: string }> = []
    const BATCH_SIZE = 50

    for (let i = 0; i < allSubs.length; i += BATCH_SIZE) {
      const batch = allSubs.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(batch.map(async (sub) => {
        const pushConfig = {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.auth,
            p256dh: sub.p256dh
          }
        }

        try {
          await webpush.sendNotification(pushConfig, JSON.stringify({
            titulo: record.titulo || record.title || "Gringa Style",
            mensagem: record.mensagem || record.body || "Nova atualização disponível!",
            link: record.link_url || record.url || record.link || "/",
            title: record.titulo || record.title || "Gringa Style",
            body: record.mensagem || record.body || "Nova atualização disponível!",
            url: record.link_url || record.url || record.link || "/"
          }))
          return { success: true }
        } catch (err: any) {
          console.error(`Falha ao enviar para ${sub.endpoint}:`, err)
          // Se a inscrição expirou (410 Gone / 404 Not Found), removemos do banco para manter o Growth limpo
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id)
          }
          return { success: false, error: err.message }
        }
      }))
      results.push(...batchResults)
    }

    // 5. ATUALIZAÇÃO DO STATUS NA FILA
    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount
    const finalStatus = (allSubs.length === 0 || successCount > 0) ? 'enviada' : 'falha'

    await supabaseAdmin
      .from('notificacoes_push_queue')
      .update({ 
        status: finalStatus,
        enviado_em: new Date().toISOString(),
        erro_log: failureCount > 0 ? JSON.stringify(results.filter(r => !r.success)) : null
      })
      .eq('id', record.id)

    return new Response(JSON.stringify({ 
      status: 'processado', 
      total: allSubs.length, 
      sucessos: successCount, 
      falhas: failureCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro fatal na função send-push:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})