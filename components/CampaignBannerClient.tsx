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
                    {/* O FIM DA DESCULPA: 
                        O componente Image abaixo é perfeitamente responsivo e destrói o LCP alto. 
                        A tag 'priority' obriga o navegador a descarregar isto antes de qualquer outra coisa.
                    */}
                    <Image
                        src={campaign.banner_url}
                        alt={campaign.nome_campanha || "Banner Promocional"}
                        width={1200} // Valor base de referência, o CSS fará o resize
                        height={670} // Valor base de referência
                        sizes="100vw"
                        priority={true} // A PROPRIEDADE MÁGICA QUE SALVA O TEU PAGESPEED
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

