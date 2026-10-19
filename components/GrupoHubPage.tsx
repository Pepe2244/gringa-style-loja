import Link from 'next/link';
import Image from 'next/image';
import GrupoHubContactForm from './GrupoHubContactForm';

export default function GrupoHubPage() {
  return (
    <div className="dual-path-page">
      <section className="dual-path-hero">
        <div className="container dual-path-shell">
          <span className="dual-path-eyebrow" style={{ display: 'block', textAlign: 'center' }}>Grupo Gringa Style</span>
          <h1 style={{ textAlign: 'center' }}>DO ENTUSIASTA AO CHÃO DE FÁBRICA.</h1>
          <p className="dual-path-subheadline">
            O Grupo Gringa Style eleva o padrão da soldagem. Escolha o seu caminho.
          </p>
          <div className="dual-path-grid">
            {/* Card B2C: Elemento LCP Oficial da Página Inicial */}
            <article className="dual-path-card dual-path-card-b2c">
              <div className="dual-path-visual dual-path-visual-store">
                <Image
                  src="/imagens/mascara-personalizada-1.webp"
                  alt="Máscara de solda personalizada Gringa Style"
                  fill
                  sizes="(max-width: 640px) 290px, (max-width: 1024px) 440px, 490px"
                  priority
                  fetchPriority="high"
                  loading="eager"
                  quality={60}
                />
              </div>
              <span className="dual-path-badge">B2C</span>
              <h2>LOJA GRINGA STYLE</h2>
              <p>
                Equipamentos de alta performance TIG/MIG, acessórios e EPIs para quem busca o melhor acabamento.
              </p>
              <Link href="/loja" className="dual-path-cta dual-path-cta-primary">
                IR PARA A LOJA
              </Link>
            </article>

            {/* Card B2B: Abaixo da dobra no mobile. Carregamento sob demanda para não competir com o LCP */}
            <article className="dual-path-card dual-path-card-b2b">
              <div className="dual-path-visual dual-path-visual-b2b">
                <Image
                  src="/imagens/tocha-1.webp"
                  alt="Equipamento para soldagem profissional"
                  fill
                  sizes="(max-width: 640px) 240px, (max-width: 1024px) 440px, 490px"
                  loading="lazy"
                  fetchPriority="low"
                  quality={60}
                />
              </div>
              <span className="dual-path-badge dual-path-badge-industrial">B2B</span>
              <h2>GS SERVIÇOS INDUSTRIAIS</h2>
              <p>
                Soldas especiais e mecânica industrial para apoiar a manutenção e a confiabilidade da sua operação.
              </p>
              <Link href="/gs-servicos-industriais" className="dual-path-cta dual-path-cta-secondary">
                SOLICITAR ORÇAMENTO INDUSTRIAL
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="dual-path-trust">
        <div className="container dual-path-trust-grid">
          <div>
            <strong>+15 anos de experiência</strong>
            <span>vivendo a rotina da soldagem, da oficina à operação industrial</span>
          </div>
          <div>
            <strong>Atendimento</strong>
            <span>comercial e técnico para clientes em todo o Brasil</span>
          </div>
          <div>
            <strong>Qualidade</strong>
            <span>com foco em desempenho, segurança e confiabilidade</span>
          </div>
        </div>
      </section>

      <section id="contato" className="dual-path-contact" style={{ paddingBottom: '80px' }}>
        <div className="container dual-path-contact-box" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <span className="dual-path-section-label">Contato Direto</span>
            <h3>Fale com a equipe do Grupo Gringa Style.</h3>
            <p style={{ color: '#aaa', marginTop: '8px' }}>Preencha seus dados, selecione o setor de destino e escolha entre WhatsApp ou E-mail.</p>
          </div>

          <div style={{ maxWidth: '700px', margin: '0 auto 26px', display: 'grid', gap: '12px', color: '#f2f2f2' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', overflowWrap: 'anywhere' }}>
              <strong>Loja Gringa Style:</strong> contato@gringastylebr.com.br
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', overflowWrap: 'anywhere' }}>
              <strong>GS Serviços Industriais:</strong> contato@gsservicosindustriais.com.br
            </div>
          </div>

          <GrupoHubContactForm />
        </div>
      </section>
    </div>
  );
}
