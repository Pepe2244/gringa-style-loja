'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Campaign {
    id: number;
    nome_campanha: string;
    banner_url: string;
    cor_fundo: string;
    cor_texto: string;
    cor_destaque: string;
    aviso_deslizante_texto: string;
}

interface CampaignBannerClientProps {
    campaign: Campaign;
}

export default function CampaignBannerClient({ campaign }: CampaignBannerClientProps) {
    const [visible, setVisible] = useState(true);

    if (!visible || !campaign) return null;

    return (
        <div
            className="campaign-banner"
            style={{
                backgroundColor: campaign.cor_fundo || '#FFA500',
                color: campaign.cor_texto || '#000000',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden', // Importante para o marquee
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '18px',
                letterSpacing: '1px',
                marginBottom: '0px'
            }}
        >
            {campaign.banner_url && (
                <div style={{ width: '100%', position: 'relative', height: 'auto', minHeight: '100px' }}>
                    {/* Usando img normal por enquanto para garantir responsividade fluida baseada na largura, 
                       ou Image com width/height se soubermos a proporção. 
                       Como é banner, width 100% é o ideal. */}
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
                aria-label="Fechar banner da campanha"
                title="Fechar banner"
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.5)',
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
