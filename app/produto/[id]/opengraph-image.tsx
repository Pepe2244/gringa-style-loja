import { ImageResponse } from 'next/og';
import { fetchProductBySlugOrId, resolveAbsoluteUrl } from '@/lib/product-service';

export const alt = 'Gringa Style - Equipamentos de Solda Personalizados';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const revalidate = 86400; // Cache de 24 horas para alta performance

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Image({ params }: Props) {
  try {
    const { id: rawSlug } = await params;
    const product = await fetchProductBySlugOrId(rawSlug);

    if (!product) {
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              backgroundColor: '#111111',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontFamily: 'sans-serif',
              border: '6px solid #FFA500',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '28px',
                fontWeight: 900,
                color: '#FFA500',
                letterSpacing: '2px',
                marginBottom: '16px',
              }}
            >
              GRINGA STYLE
            </div>
            <div style={{ display: 'flex', fontSize: '48px', fontWeight: 800 }}>
              Equipamentos de Solda Personalizados
            </div>
            <div style={{ display: 'flex', fontSize: '22px', color: '#888888', marginTop: '12px' }}>
              gringastylebr.com.br
            </div>
          </div>
        ),
        { ...size }
      );
    }

    const mediaUrls = product.media_urls || product.imagens || [];
    const validPhoto = mediaUrls.find((url: string) => !url.includes('.mp4') && !url.includes('.webm'));
    const imageUrl = resolveAbsoluteUrl(validPhoto);

    const precoFinal = product.preco_promocional || product.preco;
    const precoFormatado = precoFinal ? precoFinal.toFixed(2).replace('.', ',') : '';
    const isProntaEntrega = Boolean(product.em_estoque);

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            height: '100%',
            backgroundColor: '#111111',
            backgroundImage: 'radial-gradient(circle at 85% 20%, #2A1A05 0%, #111111 65%)',
            padding: '48px',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '6px solid #FFA500',
            boxSizing: 'border-box',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Lado Esquerdo: Imagem do Produto em Destaque */}
          <div
            style={{
              display: 'flex',
              width: '460px',
              height: '460px',
              backgroundColor: '#1A1A1A',
              borderRadius: '24px',
              border: '2px solid #333333',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '16px',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={product.nome}
              width="420"
              height="420"
              style={{
                objectFit: 'contain',
                borderRadius: '16px',
              }}
            />
          </div>

          {/* Lado Direito: Informações Comerciais e Branding */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '590px',
              height: '460px',
              paddingLeft: '24px',
            }}
          >
            {/* Topo: Badges de Autoridade */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#FFA500',
                  color: '#000000',
                  fontWeight: 900,
                  fontSize: '15px',
                  padding: '6px 16px',
                  borderRadius: '999px',
                  letterSpacing: '1px',
                }}
              >
                GRINGA STYLE
              </div>

              <div
                style={{
                  display: 'flex',
                  backgroundColor: isProntaEntrega ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: isProntaEntrega ? '#10B981' : '#F59E0B',
                  border: `1px solid ${isProntaEntrega ? '#10B981' : '#F59E0B'}`,
                  fontWeight: 700,
                  fontSize: '14px',
                  padding: '5px 14px',
                  borderRadius: '999px',
                }}
              >
                {isProntaEntrega ? '✓ PRONTA ENTREGA' : '🛠️ SOB ENCOMENDA'}
              </div>
            </div>

            {/* Centro: Nome do Produto */}
            <div
              style={{
                display: 'flex',
                color: '#FFFFFF',
                fontSize: product.nome.length > 35 ? '36px' : '44px',
                fontWeight: 800,
                lineHeight: 1.2,
                maxHeight: '160px',
                overflow: 'hidden',
              }}
            >
              {product.nome}
            </div>

            {/* Bloco de Preço e Condições */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '24px', color: '#888888', fontWeight: 600 }}>R$</span>
                <span style={{ fontSize: '60px', color: '#FFA500', fontWeight: 900, lineHeight: 1 }}>
                  {precoFormatado}
                </span>
              </div>
              <div style={{ display: 'flex', fontSize: '18px', color: '#AAAAAA', marginTop: '6px' }}>
                Até 12x no cartão • Desconto especial no PIX
              </div>
            </div>

            {/* Rodapé do Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid #333333',
                paddingTop: '16px',
                color: '#888888',
                fontSize: '15px',
              }}
            >
              <span>gringastylebr.com.br</span>
              <span>🇧🇷 Envio para todo o Brasil</span>
            </div>
          </div>
        </div>
      ),
      { ...size }
    );
  } catch (err) {
    console.error('[OpenGraph Image] Erro ao gerar imagem OG dinâmica:', err);
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: '#111111',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '48px',
            fontWeight: 800,
          }}
        >
          Gringa Style
        </div>
      ),
      { ...size }
    );
  }
}
