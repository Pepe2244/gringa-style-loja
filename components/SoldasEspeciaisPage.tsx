'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const diferenciais = [
  { title: 'Time Qualificado', text: 'Equipe técnica para demandas de soldagem e mecânica industrial.' },
  { title: 'Atendimento em Todo o Brasil', text: 'Execução e suporte em plantas, manutenção e operações industriais.' },
  { title: 'Cumprimento de Normas', text: 'Processos alinhados com exigências técnicas e de segurança.' },
  { title: 'Foco na Operação', text: 'Soluções para apoiar a confiabilidade e reduzir o tempo de parada.' },
];

const etapasAtendimento = [
  { number: '01', title: 'Entendimento da necessidade', text: 'Analisamos a demanda, o equipamento e o contexto da operação.' },
  { number: '02', title: 'Planejamento técnico', text: 'Alinhamos o escopo do serviço, os recursos necessários e os requisitos de segurança.' },
  { number: '03', title: 'Execução do serviço', text: 'Realizamos o trabalho com acompanhamento técnico e foco na qualidade da entrega.' },
];

export default function GSServicosIndustriaisPage() {
  const clientsCarouselRef = useRef<HTMLDivElement>(null);
  const isCarouselInteractingRef = useRef(false);
  const carouselResumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carouselDragRef = useRef<{ pointerId: number; startX: number; startScrollLeft: number } | null>(null);
  const [carouselCopies, setCarouselCopies] = useState(3);
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

  useEffect(() => {
    const carousel = clientsCarouselRef.current;
    if (!carousel) return;

    let animationFrame = 0;
    let previousTime = 0;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

    const advanceCarousel = (time: number) => {
      if (!isCarouselInteractingRef.current && !isCarouselPaused && !motionPreference.matches) {
        const cycle = carousel.querySelector<HTMLElement>('[data-carousel-cycle]');
        const cycleWidth = cycle?.getBoundingClientRect().width ?? 0;

        if (cycleWidth > 0 && previousTime > 0) {
          carousel.scrollLeft += (time - previousTime) * 0.035;

          if (carousel.scrollLeft >= cycleWidth) {
            carousel.scrollLeft %= cycleWidth;
          }
        }
      }

      previousTime = isCarouselInteractingRef.current || isCarouselPaused || motionPreference.matches ? 0 : time;
      if (!isCarouselPaused && !motionPreference.matches && document.visibilityState === 'visible') {
        animationFrame = window.requestAnimationFrame(advanceCarousel);
      }
    };

    const startOrStopAnimation = () => {
      window.cancelAnimationFrame(animationFrame);
      previousTime = 0;
      if (!isCarouselPaused && !motionPreference.matches && document.visibilityState === 'visible') {
        animationFrame = window.requestAnimationFrame(advanceCarousel);
      }
    };
    const handleVisibilityChange = () => startOrStopAnimation();

    startOrStopAnimation();
    motionPreference.addEventListener('change', startOrStopAnimation);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      motionPreference.removeEventListener('change', startOrStopAnimation);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (carouselResumeTimeoutRef.current) {
        clearTimeout(carouselResumeTimeoutRef.current);
      }
    };
  }, [isCarouselPaused]);

  const pauseCarouselForInteraction = () => {
    isCarouselInteractingRef.current = true;
    if (carouselResumeTimeoutRef.current) {
      clearTimeout(carouselResumeTimeoutRef.current);
    }
  };

  const resumeCarouselAfterInteraction = () => {
    if (carouselResumeTimeoutRef.current) {
      clearTimeout(carouselResumeTimeoutRef.current);
    }

    carouselResumeTimeoutRef.current = setTimeout(() => {
      isCarouselInteractingRef.current = false;
      carouselResumeTimeoutRef.current = null;
    }, 1200);
  };

  const clientesFinais = clientesDinamicos.length > 0 ? clientesDinamicos : [
    { name: 'Cliente A', src: '/imagens/logo_gringa_style.png' },
    { name: 'Cliente B', src: '/imagens/logo_gringa_style.png' },
    { name: 'Cliente C', src: '/imagens/logo_gringa_style.png' },
    { name: 'Cliente D', src: '/imagens/logo_gringa_style.png' },
    { name: 'Cliente E', src: '/imagens/logo_gringa_style.png' },
  ];

  useEffect(() => {
    const carousel = clientsCarouselRef.current;
    if (!carousel) return;

    const updateCopies = () => {
      const cycle = carousel.querySelector<HTMLElement>('[data-carousel-cycle]');
      if (!cycle) return;

      const cycleWidth = cycle.getBoundingClientRect().width;
      if (cycleWidth > 0) {
        setCarouselCopies(Math.max(3, Math.ceil(carousel.clientWidth / cycleWidth) + 2));
      }
    };

    updateCopies();
    window.addEventListener('resize', updateCopies);

    return () => window.removeEventListener('resize', updateCopies);
  }, [clientesFinais.length]);

  const handleCarouselPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pauseCarouselForInteraction();

    if (event.pointerType === 'mouse' && event.button === 0) {
      carouselDragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: event.currentTarget.scrollLeft,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handleCarouselPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = carouselDragRef.current;
    if (drag?.pointerId === event.pointerId) {
      event.currentTarget.scrollLeft = drag.startScrollLeft - (event.clientX - drag.startX);
    }
  };

  const handleCarouselPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (carouselDragRef.current?.pointerId === event.pointerId) {
      carouselDragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
    resumeCarouselAfterInteraction();
  };

  const handleCarouselPointerLeave = () => {
    if (!carouselDragRef.current) {
      resumeCarouselAfterInteraction();
    }
  };

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
                Duas frentes integradas para atender às necessidades da indústria: serviços especializados de soldagem e soluções em mecânica industrial.
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
              <article className="b2b-project-card">
                <div className="b2b-project-copy">
                  <span className="b2b-kicker">Soldas especiais</span>
                  <h3>Engenharia e execução em soldagem.</h3>
                  <p>Atuação técnica em soldagem industrial para manutenção e recuperação de equipamentos e componentes.</p>
                  <ul className="b2b-service-list">
                    <li>Soldagem especializada para aplicações industriais</li>
                    <li>Recuperação de componentes e ativos</li>
                    <li>Serviços de solda em campo e em estruturas industriais</li>
                  </ul>
                </div>
              </article>

              <article className="b2b-project-card">
                <div className="b2b-project-copy">
                  <span className="b2b-kicker">Mecânica industrial</span>
                  <h3>Manutenção e soluções mecânicas.</h3>
                  <p>Serviços mecânicos para apoiar a disponibilidade e o funcionamento dos equipamentos da sua operação.</p>
                  <ul className="b2b-service-list">
                    <li>Manutenção industrial preventiva e corretiva</li>
                    <li>Montagem e desmontagem de equipamentos</li>
                    <li>Reparo e recuperação de componentes mecânicos</li>
                  </ul>
                </div>
              </article>
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
        <section className="b2b-section overflow-hidden bg-black/40 border-y border-white/5">
          <div className="container">
            <div className="b2b-section-header text-center">
              <span className="b2b-kicker">Confiança</span>
              <h2>Clientes que confiam em nossa execução.</h2>
            </div>

            <div
              role="region"
              aria-label="Carrossel de empresas clientes"
              tabIndex={0}
              ref={clientsCarouselRef}
              onPointerDown={handleCarouselPointerDown}
              onPointerMove={handleCarouselPointerMove}
              onPointerUp={handleCarouselPointerUp}
              onPointerCancel={handleCarouselPointerUp}
              onPointerLeave={handleCarouselPointerLeave}
              onFocus={pauseCarouselForInteraction}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  resumeCarouselAfterInteraction();
                }
              }}
              className="clients-carousel group relative mt-8 flex cursor-grab snap-x snap-mandatory overflow-x-auto pt-4 pb-4 active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--cor-destaque)] md:snap-none md:[mask-image:_linear-gradient(to_right,transparent_0,_black_15%,_black_85%,transparent_100%)]"
            >
              <div className="flex w-max">
                {Array.from({ length: carouselCopies }, (_, copyIndex) => (
                  <div
                    key={`clientes-copia-${copyIndex}`}
                    data-carousel-cycle
                    className="flex w-max"
                  >
                    {clientesFinais.map((cliente, index) => (
                      <div
                        key={`cliente-${copyIndex}-${index}`}
                        className="clients-carousel-item mr-4 flex h-28 w-44 flex-shrink-0 snap-center items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 md:h-32 md:w-56"
                      >
                        <div className="relative h-16 w-full md:h-20">
                          <Image
                            src={cliente.src}
                            alt={cliente.name}
                            fill
                            sizes="(max-width: 768px) 176px, 224px"
                            className="object-contain p-2 opacity-75 transition-opacity hover:opacity-100"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-center text-sm text-white/60 md:hidden">
              Deslize para ver mais clientes
            </p>
            <div className="mt-3 flex justify-center">
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

            {/* CSS injetado especificamente para este componente para evitar conflitos e bugs no Mobile */}
            <style dangerouslySetInnerHTML={{__html: `
              .clients-carousel {
                scrollbar-width: none;
              }
              .clients-carousel::-webkit-scrollbar {
                display: none;
              }
              @media (max-width: 767px) {
                .clients-carousel {
                  -webkit-overflow-scrolling: touch;
                }
                .clients-carousel-item {
                  scroll-snap-align: center;
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
              <li style={{ overflowWrap: 'anywhere' }}>E-mail: contato@gsserviçosindustriais.com.br</li>
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