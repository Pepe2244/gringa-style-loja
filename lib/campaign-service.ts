import { unstable_cache, revalidateTag } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { isDateWithinRange, type ActiveCampaignForPricing } from '@/lib/checkout-pricing';
import type { Campaign } from '@/types';

/**
 * Consulta a campanha ativa definida em configuracoes_site e busca os detalhes em campanhas.
 * Cache de 60 segundos com tag 'campaign' para invalidação sob demanda.
 */
const getCachedRawCampaign = unstable_cache(
    async (): Promise<Campaign | null> => {
        try {
            const { data: config, error: configError } = await supabase
                .from('configuracoes_site')
                .select('campanha_ativa_id')
                .limit(1)
                .maybeSingle();

            if (configError || !config || !config.campanha_ativa_id) {
                return null;
            }

            const { data: camp, error: campError } = await supabase
                .from('campanhas')
                .select('*')
                .eq('id', config.campanha_ativa_id)
                .maybeSingle();

            if (campError || !camp) {
                return null;
            }

            return camp as Campaign;
        } catch (err) {
            console.error('[CampaignService] Falha ao consultar campanha ativa:', err);
            return null;
        }
    },
    ['active-campaign-service-full'],
    {
        revalidate: 60,
        tags: ['campaign'],
    }
);

/**
 * Retorna o registro completo da campanha ativa no momento,
 * validando o agendamento de data_inicio e data_fim.
 * Se estiver fora do período ou se não houver campanha ativa configurada, retorna null.
 */
export async function getActiveCampaignFull(now = Date.now()): Promise<Campaign | null> {
    const camp = await getCachedRawCampaign();
    if (!camp) return null;

    if (!isDateWithinRange(camp.data_inicio, camp.data_fim, now)) {
        return null;
    }

    return camp;
}

/**
 * Retorna os parâmetros de precificação da campanha ativa no momento.
 * Se estiver fora do período agendado ou inativa, retorna null.
 */
export async function getActiveCampaign(now = Date.now()): Promise<ActiveCampaignForPricing | null> {
    const camp = await getActiveCampaignFull(now);
    if (!camp) return null;

    return {
        id: camp.id,
        data_inicio: camp.data_inicio,
        data_fim: camp.data_fim,
        tipo_desconto: camp.tipo_desconto,
        valor_desconto: camp.valor_desconto,
        produtos_aplicaveis: camp.produtos_aplicaveis,
        aplicar_em_todos: camp.aplicar_em_todos,
    };
}

/**
 * Invalida o cache sob demanda da campanha ativa.
 */
export function clearCampaignServiceCache(): void {
    try {
        revalidateTag('campaign', 'max');
    } catch {
        // Fallback silencioso caso invocado fora de contexto compatível do Next.js
    }
}
