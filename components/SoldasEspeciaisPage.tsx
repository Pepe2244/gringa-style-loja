'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const diferenciais = [
  {
    title: 'Soldagem industrial',
    text: 'Recuperação de peças, reforço estrutural e execução de solda em equipamentos e componentes críticos da operação.',
  },
  {
    title: 'Mecânica de manutenção',
    text: 'Montagem, reparo, ajuste e recuperação de máquinas e sistemas para manter produtividade e disponibilidade.',
  },
  {
    title: 'Manutenção planejada',
    text: 'Diagnóstico técnico para reduzir falhas, evitar paradas inesperadas e prolongar a vida útil do ativo.',
  },
  {
    title: 'Qualidade e segurança',
    text: 'Execução orientada por normas, segurança e controle de processo para entregar resultado confiável e durável.',
  },
];

const etapasAtendimento = [
  {
    number: '01',
    title: 'Diagnóstico técnico',
    text: 'Inspecionamos o equipamento, identificamos a falha e avaliamos o impacto da operação para definir a melhor solução.',
  },
  {
    number: '02',
    title: 'Planejamento da intervenção',
    text: 'Definimos a sequência do trabalho, materiais, processos e critérios de qualidade para execução segura e eficiente.',
  },
  {
    number: '03',
    title: 'Execução e entrega',
    text: 'Realizamos solda, reparos e ajustes com controle de qualidade e acompanhamento até o retorno funcional do ativo.',
  },
];

const frentesIndustriais = [
  {
    title: 'Soldas Especiais',
    icon: '⚡',
    tagline: 'Recuperação e reforço estrutural',
    keywords: ['Estruturas', 'Peças', 'Recuperação', 'Resistência'],
    summary: 'Execução técnica para reforço, recuperação e reparo de componentes submetidos a esforço, desgaste e condições severas de operação.',
  },
  {
    title: 'Mecânica Industrial',
    icon: '🔧',
    tagline: 'Manutenção e disponibilidade operacional',
    keywords: ['Montagem', 'Ajuste', 'Reparo', 'Disponibilidade'],
    summary: 'Serviços de manutenção, montagem e ajuste em máquinas e equipamentos para garantir performance, confiabilidade e menor tempo de parada.',
  },
];

export default function GSServicosIndustriaisPage() {
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    mensagem: '',
  });

  // Estados para os dados vindos do Supabase
  const [heroImage, setHeroImage] = useState('/imagens/tocha 2.jpg');
  const [clientesDinamicos, setClientesDinamicos] = useState<any[]>([]);
  const [galeriaImagens, setGaleriaImagens] = useState<any[]>([]);

  useEffect(() => {
    const fetchB2BAssets = async () => {
      const { data, error } = await supabase
        .from('b2b_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // 1. Hero Image
        const hero = data.find(item => item.section === 'hero');
        if (hero) setHeroImage(hero.url);

        // 2. Clientes (Confiança)
        const cl = data.filter(item => item.section === 'cliente');
        if (cl.length > 0) {
          setClientesDinamicos(cl.map(c => ({ name: c.title || 'Cliente', src: c.url })));
        }

        // 3. Galeria
        const gal = data.filter(item => item.section === 'galeria');
        setGaleriaImagens(gal);
      }
    };

    fetchB2BAssets();
  }, []);

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setSystemPrefersReducedMotion(motionPreference.matches);

    updatePreference();
    motionPreference.addEventListener('change', updatePreference);
    return () => motionPreference.removeEventListener('change', updatePreference);
  }, []);

  const clientesFinais = clientesDinamicos.length > 0 ? clientesDinamicos : [
    { name: 'Cliente A', src: '/imagens/logo_gringa_style.png' },
    { name: 'Cliente B', src: '/imagens/logo_gringa_style.png' },
    { name: 'Cliente C', src: '/imagens/logo_gringa_style.png' },
    { name: 'Cliente D', src: '/imagens/logo_gringa_style.png' },
    { name: 'Cliente E', src: '/imagens/logo_gringa_style.png' },
  ];
  const carouselItems = [...clientesFinais, ...clientesFinais];

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const mensagem = `Olá, quero um orçamento industrial.\n\nNome: ${formData.nome}\nEmpresa: ${formData.empresa || 'Não informado'}\nE-mail: ${formData.email}\nTelefone: ${formData.telefone}\nMensagem: ${formData.mensagem || 'Sem mensagem adicional'}`;

    const whatsappUrl = `https://wa.me/5515998092548?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="b2b-page">
      <main>
        <section className="b2b-hero">
          <div className="b2b-hero-overlay" />
          <div className="container b2b-hero-content">
            <div className="b2b-hero-copy">
              <span className="b2b-kicker">GS Serviços Industriais</span>
              <h1>SOLDAS ESPECIAIS E MECÂNICA INDUSTRIAL.</h1>
              <p>
                Atuamos em soldagem industrial e mecânica de manutenção para empresas que precisam de confiabilidade, resistência e solução prática em equipamentos, estruturas e componentes críticos.
              </p>
              <div className="b2b-hero-actions">
                <a
                  href={`https://wa.me/5515998092548?text=${encodeURIComponent('Olá, quero falar com a equipe da GS Serviços Industriais.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="b2b-primary-cta"
                >
                  FALAR COM A EQUIPE INDUSTRIAL
                </a>
              </div>
            </div>
              <div className="b2b-hero-visual">
                <Image src={heroImage} alt="Serviços técnicos para operações industriais" fill priority sizes="(max-width: 768px) 92vw, 42vw" />
                <span>SOLUÇÕES PARA A INDÚSTRIA</span>
              </div>
          </div>
        </section>

        <section id="servicos" className="b2b-section b2b-section-alt">
          <div className="container">
            <div className="b2b-section-header">
              <span className="b2b-kicker">Nossas frentes</span>
              <h2>Especialidades que trabalham lado a lado.</h2>
            </div>

            <div className="b2b-projects-grid">
              {frentesIndustriais.map((frente) => (
                <article key={frente.title} className="b2b-project-card" style={{ minHeight: '280px' }}>
                  <div className="b2b-project-copy" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,165,0,0.12)',
                        border: '1px solid rgba(255,165,0,0.28)',
                        fontSize: '1.5rem',
                        lineHeight: 1,
                      }} aria-hidden="true">{frente.icon}</span>
                      <span className="b2b-kicker">{frente.title}</span>
                    </div>

                    <h3 style={{ marginBottom: '12px' }}>{frente.tagline}</h3>
                    <p style={{ marginBottom: '18px', color: '#d0d0d0', lineHeight: 1.6 }}>{frente.summary}</p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
                      {frente.keywords.map((item) => (
                        <span
                          key={item}
                          style={{
                            padding: '7px 10px',
                            borderRadius: '999px',
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'rgba(255,255,255,0.02)',
                            color: '#d6d6d6',
                            fontSize: '0.76rem',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                          }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="b2b-section">
          <div className="container">
            <div className="b2b-section-header">
              <span className="b2b-kicker">Por que a GS Serviços Industriais?</span>
              <h2>Resultado técnico com visão de operação.</h2>
            </div>

            <div className="b2b-diferenciais-grid">
              {diferenciais.map((item) => (
                <div key={item.title} className="b2b-diferencial-card">
                  <div className="b2b-icon">✓</div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="b2b-section b2b-section-alt">
          <div className="container">
            <div className="b2b-section-header">
              <span className="b2b-kicker">Como trabalhamos</span>
              <h2>Da necessidade à execução, com foco na operação.</h2>
            </div>

            <div className="b2b-process-grid">
              {etapasAtendimento.map((etapa) => (
                <article key={etapa.number} className="b2b-process-card">
                  <span className="b2b-process-number">{etapa.number}</span>
                  <h3>{etapa.title}</h3>
                  <p>{etapa.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Galeria Dinâmica de Obras */}
        {galeriaImagens.length > 0 && (
          <section className="b2b-section">
            <div className="container">
               <div className="b2b-section-header text-center">
                  <span className="b2b-kicker">Galeria de Obras</span>
                  <h2>Nossas Execuções em Campo</h2>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
                  {galeriaImagens.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                      <Image 
                        src={img.url} 
                        alt="Galeria de serviços industriais"
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                  ))}
               </div>
            </div>
          </section>
        )}

        {/* CARROSSEL CONFIANÇA CORRIGIDO */}
        <section className="b2b-section overflow-hidden bg-black/40 border-y border-white/5 clients-marquee-section">
          <div className="container">
            <div className="b2b-section-header text-center">
              <span className="b2b-kicker">Confiança</span>
              <h2>Clientes que confiam em nossa execução.</h2>
            </div>

            <div className="clients-marquee mt-8" aria-label="Marquee de clientes e parceiros">
              <div className={`clients-track ${isCarouselPaused ? 'is-paused' : ''} ${systemPrefersReducedMotion ? 'reduced-motion' : ''}`}>
                {carouselItems.map((cliente, index) => (
                  <div key={`${cliente.name}-${index}`} className="clients-card">
                    <div className="clients-card-inner">
                      <Image
                        src={cliente.src}
                        alt={cliente.name}
                        fill
                        sizes="(max-width: 768px) 160px, 220px"
                        className="clients-card-logo"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              {systemPrefersReducedMotion ? (
                <p role="status" className="text-sm text-white/60">
                  Movimento reduzido conforme a preferência do dispositivo
                </p>
              ) : (
                <button
                  type="button"
                  aria-pressed={isCarouselPaused}
                  onClick={() => setIsCarouselPaused((paused) => !paused)}
                  className="rounded-full border border-[var(--cor-destaque)] px-4 py-2 text-sm font-semibold text-[var(--cor-destaque)] transition-colors hover:bg-[var(--cor-destaque)] hover:text-[var(--cor-fundo)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cor-destaque)]"
                >
                  {isCarouselPaused ? 'Retomar movimento' : 'Pausar movimento'}
                </button>
              )}
            </div>

            <style dangerouslySetInnerHTML={{__html: `
              .clients-marquee {
                position: relative;
                overflow: hidden;
                mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
                -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
              }

              .clients-track {
                display: flex;
                width: max-content;
                gap: 18px;
                padding: 8px 0 18px;
                animation: clients-marquee 24s linear infinite;
              }

              .clients-marquee-section:hover .clients-track,
              .clients-track.is-paused {
                animation-play-state: paused;
              }

              .clients-track.reduced-motion {
                animation: none;
              }

              .clients-card {
                flex: 0 0 auto;
                width: 210px;
                height: 120px;
                border-radius: 16px;
                border: 1px solid rgba(255,255,255,0.09);
                background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
                transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
              }

              .clients-card:hover {
                transform: translateY(-3px);
                border-color: rgba(255,165,0,0.4);
                box-shadow: 0 12px 28px rgba(0,0,0,0.18);
              }

              .clients-card-inner {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
                filter: grayscale(1) contrast(1.08);
                opacity: 0.82;
                transition: filter 0.25s ease, opacity 0.25s ease;
              }

              .clients-card:hover .clients-card-inner {
                filter: grayscale(0.15) contrast(1.14);
                opacity: 1;
              }

              .clients-card-logo {
                object-fit: contain;
                padding: 8px;
              }

              @keyframes clients-marquee {
                from { transform: translateX(0); }
                to { transform: translateX(-50%); }
              }

              @media (max-width: 767px) {
                .clients-card {
                  width: 170px;
                  height: 100px;
                }
              }
            `}} />
          </div>
        </section>
      </main>

      <section id="contato" className="b2b-footer">
        <div className="container b2b-footer-grid">
          <div className="b2b-footer-copy">
          <span className="b2b-kicker">GS Serviços Industriais</span>
          <h3>Conte sua necessidade em soldagem ou mecânica industrial.</h3>
            <ul>
              <li>Telefone: (15) 99809-2548</li>
              <li style={{ overflowWrap: 'anywhere' }}>E-mail: contato@gsservicosindustriais.com.br</li>
            </ul>
          </div>

          <form className="b2b-contact-form" onSubmit={handleSubmit}>
            <div className="b2b-field-row">
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Nome" aria-label="Nome" required />
              <input type="text" name="empresa" value={formData.empresa} onChange={handleChange} placeholder="Empresa" aria-label="Empresa" />
            </div>
            <div className="b2b-field-row">
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="E-mail" aria-label="E-mail" required />
              <input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="Telefone" aria-label="Telefone" required />
            </div>
            <textarea name="mensagem" value={formData.mensagem} onChange={handleChange} placeholder="Mensagem" aria-label="Mensagem" rows={5} />
            <button type="submit">Solicitar Orçamento</button>
          </form>
        </div>
      </section>
    </div>
  );
}