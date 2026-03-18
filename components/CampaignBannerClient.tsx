'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getProxiedImageUrl } from '@/utils/imageUrl';

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

const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

export default function CampaignBannerClient({ campaign }: CampaignBannerClientProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!campaign) return;

        const storageKey = `banner_dismissed_${campaign.id}`;
        const dismissedAt = localStorage.getItem(storageKey);

        if (dismissedAt) {
            const elapsed = Date.now() - parseInt(dismissedAt, 10);
            if (elapsed < DISMISS_DURATION_MS) {
                setVisible(false);
                return;
            }
        }

        setVisible(true);
    }, [campaign]);

    const handleClose = () => {
        const storageKey = `banner_dismissed_${campaign.id}`;
        localStorage.setItem(storageKey, Date.now().toString());
        setVisible(false);
    };

    if (!visible || !campaign) return null;

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
                <div style={{ width: '100%', position: 'relative', display: 'block' }}>
                    <Image
                        src={getProxiedImageUrl(campaign.banner_url)}
                        alt={campaign.nome_campanha || "Banner Promocional"}
                        width={1200}
                        height={670}
                        sizes="100vw"
                        priority={true}
                        style={{
                            width: '100%',
                            height: 'auto',
                            objectFit: 'cover'
                        }}
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
                onClick={handleClose}
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
