import { supabase } from '@/lib/supabase';
import CampaignBannerClient from './CampaignBannerClient';
import { unstable_cache } from 'next/cache';

// O HACK DE PERFORMANCE: Envolvemos as duas chamadas sequenciais numa cache.
// Em vez de demorar 200ms para cada utilizador, vai demorar 0ms (leitura da memória).
const getCachedCampaign = unstable_cache(
    async () => {
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

            return camp;
        } catch (err) {
            console.error('[CampaignBannerServer] Falha ao carregar campanha ativa:', err);
            return null;
        }
    },
    ['active-campaign-banner'], // A chave única desta cache
    { 
        revalidate: 60, // Tempo de vida curto para sincronização rápida
        tags: ['campaign'] // Permite limpar a cache no futuro se precisares
    } 
);

export default async function CampaignBannerServer() {
    const camp = await getCachedCampaign();

    if (!camp) {
        return null;
    }

    return <CampaignBannerClient campaign={camp} />;
}


