import { getActiveCampaignFull } from '@/lib/campaign-service';
import CampaignBannerClient from './CampaignBannerClient';

export default async function CampaignBannerServer() {
    const camp = await getActiveCampaignFull();

    if (!camp) {
        return null;
    }

    return <CampaignBannerClient campaign={camp} />;
}
