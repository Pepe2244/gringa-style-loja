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
    // 1. INICIALIZAÇÃO DO ADMIN (O que faltava no teu código)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. CONFIGURAÇÃO VAPID (Blindada contra chaves inválidas)
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contato@gringastyle.com.br'

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

    const results = await Promise.all(subs.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh
        }
      }

      try {
        await webpush.sendNotification(pushConfig, JSON.stringify({
          title: record.titulo,
          body: record.mensagem,
          url: record.link_url
        }))
        return { success: true }
      } catch (err) {
        console.error(`Falha ao enviar para ${sub.endpoint}:`, err)
        // Se a inscrição expirou, removemos do banco para manter o Growth limpo
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id)
        }
        return { success: false, error: err.message }
      }
    }))

    // 5. ATUALIZAÇÃO DO STATUS NA FILA
    const hasError = results.some(r => !r.success)
    await supabaseAdmin
      .from('notificacoes_push_queue')
      .update({ 
        status: hasError ? 'erro' : 'enviado',
        enviado_em: new Date().toISOString(),
        erro_log: hasError ? JSON.stringify(results.filter(r => !r.success)) : null
      })
      .eq('id', record.id)

    return new Response(JSON.stringify({ status: 'processado', total: subs.length }), {
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