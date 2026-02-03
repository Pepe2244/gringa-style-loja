import { supabase } from '@/lib/supabase';
import CampaignBannerClient from './CampaignBannerClient';

export default async function CampaignBannerServer() {
    try {
        const { data: config } = await supabase.from('configuracoes_site').select('campanha_ativa_id').limit(1).maybeSingle();

        if (config && config.campanha_ativa_id) {
            const { data: camp } = await supabase.from('campanhas').select('*').eq('id', config.campanha_ativa_id).single();
            if (camp) {
                return <CampaignBannerClient campaign={camp} />;
            }
        }
    } catch (error) {
        console.error('Error fetching campaign:', error);
    }

    return null;
}
