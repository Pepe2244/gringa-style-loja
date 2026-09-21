'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function GrupoHubPage() {
  return (
    <div className="dual-path-page">
      <section className="dual-path-hero">
        <div className="dual-path-overlay" />
        <div className="container dual-path-shell">
          <div className="dual-path-eyebrow">Grupo Gringa Style</div>
          <h1>DO ENTUSIASTA AO CHÃO DE FÁBRICA.</h1>
          <p className="dual-path-subheadline">
            O Grupo Gringa Style eleva o padrão da soldagem. Escolha o seu caminho.
          </p>

          <div className="dual-path-grid">
            <article className="dual-path-card dual-path-card-b2c">
              <div className="dual-path-visual dual-path-visual-store">
                <Image src="/imagens/mascara personalizada 1.jpg" alt="Máscara de solda personalizada Gringa Style" fill sizes="(max-width: 768px) 92vw, 42vw" />
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

            <article className="dual-path-card dual-path-card-b2b">
              <div className="dual-path-visual dual-path-visual-b2b">
                <Image src="/imagens/tocha 1.jpg" alt="Equipamento para soldagem profissional" fill sizes="(max-width: 768px) 92vw, 42vw" />
              </div>
              <span className="dual-path-badge dual-path-badge-industrial">B2B</span>
              <h2>SOLDAS ESPECIAIS B2B</h2>
              <p>
                Engenharia de soldagem, manutenção industrial, caldeiraria pesada e serviços técnicos para sua planta.
              </p>
              <Link href="/soldas-especiais" className="dual-path-cta dual-path-cta-secondary">
                SOLICITAR ORÇAMENTO INDUSTRIAL
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="dual-path-trust">
        <div className="container dual-path-trust-grid">
          <div>
            <strong>+15 anos</strong>
            <span>de experiência com soldagem</span>
          </div>
          <div>
            <strong>Atendimento</strong>
            <span>comercial e técnico em todo o Brasil</span>
          </div>
          <div>
            <strong>Qualidade</strong>
            <span>com foco em desempenho e confiabilidade</span>
          </div>
        </div>
      </section>

      <section id="contato" className="dual-path-contact">
        <div className="container dual-path-contact-box">
          <div>
            <span className="dual-path-section-label">Contato</span>
            <h3>Fale com a equipe do Grupo Gringa Style.</h3>
          </div>
          <div className="dual-path-contact-actions">
            <a
              href="https://wa.me/5515998092548?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20os%20servi%C3%A7os%20e%20produtos%20do%20Grupo%20Gringa%20Style."
              target="_blank"
              rel="noreferrer"
              className="dual-path-cta dual-path-cta-primary"
            >
              FALAR NO WHATSAPP
            </a>
            <a 
              href="mailto:contato@gringastylebr.com.br" 
              className="dual-path-cta dual-path-cta-secondary"
            >
              ENVIAR E-MAIL
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
