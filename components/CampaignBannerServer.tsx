import { supabase } from '@/lib/supabase';
import CampaignBannerClient from './CampaignBannerClient';
import { unstable_cache } from 'next/cache';

// O HACK DE PERFORMANCE: Envolvemos as duas chamadas sequenciais numa cache.
// Em vez de demorar 200ms para cada utilizador, vai demorar 0ms (leitura da memória).
const getCachedCampaign = unstable_cache(
    async () => {
        const { data: config } = await supabase
            .from('configuracoes_site')
            .select('campanha_ativa_id')
            .limit(1)
            .maybeSingle();

        if (config && config.campanha_ativa_id) {
            const { data: camp } = await supabase
                .from('campanhas')
                .select('*')
                .eq('id', config.campanha_ativa_id)
                .single();

            return camp;
        }
        return null;
    },
    ['active-campaign-banner'], // A chave única desta cache
    { 
        revalidate: 3600, // Tempo de vida: 1 hora (3600 segundos). 
        tags: ['campaign'] // Permite limpar a cache no futuro se precisares
    } 
);

export default async function CampaignBannerServer() {
    try {
        // Agora o componente não bloqueia a renderização a ir ao Supabase a toda a hora
        const camp = await getCachedCampaign();

        if (camp) {
            return <CampaignBannerClient campaign={camp} />;
        }
    } catch (error) {
        console.error('Error fetching campaign:', error);
    }

    return null;
}


