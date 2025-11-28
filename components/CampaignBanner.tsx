'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function CampaignBanner() {
    const [campaign, setCampaign] = useState<any>(null);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        fetchActiveCampaign();
    }, []);

    const fetchActiveCampaign = async () => {
        try {
            const { data: config } = await supabase.from('configuracoes_site').select('campanha_ativa_id').limit(1).maybeSingle();

            if (config && config.campanha_ativa_id) {
                const { data: camp } = await supabase.from('campanhas').select('*').eq('id', config.campanha_ativa_id).single();
                if (camp) setCampaign(camp);
            }
        } catch (error) {
            console.error('Error fetching campaign:', error);
        }
    };

    if (!campaign || !visible) return null;

    return (
        <div
            className="campaign-banner"
            style={{
                backgroundColor: campaign.cor_fundo || '#FFA500',
                color: campaign.cor_texto || '#000000',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column', // Stack vertically
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '18px',
                letterSpacing: '1px',
                marginBottom: '0px' // Removed spacing
            }}
        >
            {campaign.banner_url && (
                <div style={{ width: '100%', height: 'auto' }}>
                    <img
                        src={campaign.banner_url}
                        alt={campaign.nome_campanha}
                        style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                    />
                </div>
            )}

            <div style={{ width: '100%', overflow: 'hidden', padding: '10px 0', backgroundColor: campaign.cor_fundo || '#FFA500' }}>
                {campaign.aviso_deslizante_texto && (
                    <div className="marquee-container">
                        <div className="marquee-content" style={{ color: campaign.cor_destaque || '#000' }}>
                            {campaign.aviso_deslizante_texto}
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={() => setVisible(false)}
                style={{
                    position: 'absolute',
                    top: '10px', // Move to top right
                    right: '10px',
                    background: 'rgba(0,0,0,0.5)', // Semi-transparent background
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    border: 'none',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1
                }}
            >
                &times;
            </button>
        </div>
    );
}
