'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const diferenciais = [
  { title: 'Time Qualificado', text: 'Equipe técnica com experiência real em soldagem industrial.' },
  { title: 'Atendimento em Todo o Brasil', text: 'Execução e suporte em plantas, caldeiraria e manutenção.' },
  { title: 'Cumprimento de Normas', text: 'Processos alinhados com exigências técnicas e de segurança.' },
  { title: 'Laudo Técnico', text: 'Documentação técnica para tomada de decisão e rastreabilidade.' },
];

export default function SoldasEspeciaisPage() {
  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    mensagem: '',
  });

  // Estados para os dados vindos do Supabase
  const [heroImage, setHeroImage] = useState('/imagens/tocha 2.jpg');
  const [projetosDinamicos, setProjetosDinamicos] = useState<any[]>([]);
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

        // 2. Projetos Antes / Depois
        const proj = data.filter(item => item.section === 'projetos');
        if (proj.length > 0) {
          setProjetosDinamicos(proj.map(p => ({
            title: p.title || 'Projeto Industrial',
            detail: 'Execução com solda especializada de alto desempenho.',
            meta: 'Norma / Procedimento técnico atendido',
            before: p.url,
            after: p.secondary_url || p.url,
          })));
        }

        // 3. Clientes (Confiança)
        const cl = data.filter(item => item.section === 'cliente');
        if (cl.length > 0) {
          setClientesDinamicos(cl.map(c => ({ name: c.title || 'Cliente', src: c.url })));
        }

        // 4. Galeria
        const gal = data.filter(item => item.section === 'galeria');
        setGaleriaImagens(gal);
      }
    };

    fetchB2BAssets();
  }, []);

  // Fallbacks caso o admin ainda não tenha cadastrado nada
  const projetosFinais = projetosDinamicos.length > 0 ? projetosDinamicos : [
    {
      title: 'Recuperação de eixo de máquina industrial',
      detail: 'Recuperação estrutural com solda especializada em aço e alta resistência.',
      meta: 'Norma / Procedimento técnico atendido',
      before: '/imagens/tocha 1.jpg',
      after: '/imagens/tocha 3.jpg',
    },
    {
      title: 'Estrutura metálica em altura',
      detail: 'Execução em campo com equipe especializada, EPIs e monitoramento de segurança.',
      meta: 'Execução em obra / inspeção de qualidade',
      before: '/imagens/mascara 2.jpg',
      after: '/imagens/mascara personalizada 3.jpg',
    },
  ];

  const clientesFinais = clientesDinamicos.length > 0 ? clientesDinamicos : [
    { name: 'Cliente A', src: '/imagens/logo_gringa_style.png' },
    { name: 'Cliente B', src: '/imagens/logo_gringa_style.png' },
    { name: 'Cliente C', src: '/imagens/logo_gringa_style.png' },
    { name: 'Cliente D', src: '/imagens/logo_gringa_style.png' },
    { name: 'Cliente E', src: '/imagens/logo_gringa_style.png' },
  ];

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
              <span className="b2b-kicker">Soluções em soldagem industrial</span>
              <h1>RECUPERAÇÃO DE ATIVOS CRÍTICOS E SOLUÇÕES EM SOLDAGEM INDUSTRIAL.</h1>
              <p>
                Nossa equipe de engenharia de soldagem garante eficiência, laudo técnico e redução de downtime para sua indústria.
              </p>
              <div className="b2b-hero-actions">
                <a
                  href="https://wa.me/5515998092548?text=Ol%C3%A1%2C%20quero%20falar%20com%20o%20engenheiro%20respons%C3%A1vel%20sobre%20soldagem%20industrial."
                  target="_blank"
                  rel="noreferrer"
                  className="b2b-primary-cta"
                >
                  FALAR COM ENGENHEIRO RESPONSÁVEL (WhatsApp)
                </a>
              </div>
            </div>
              <div className="b2b-hero-visual">
                <Image src={heroImage} alt="Soldagem profissional em equipamento industrial" fill priority sizes="(max-width: 768px) 92vw, 42vw" />
                <span>PRECISÃO EM CADA JUNTA</span>
              </div>
          </div>
        </section>

        <section className="b2b-section">
          <div className="container">
            <div className="b2b-section-header">
              <span className="b2b-kicker">Por que nos escolher?</span>
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
              <span className="b2b-kicker">Portfólio técnico</span>
              <h2>Projetos executados com prova de performance.</h2>
            </div>

            <div className="b2b-projects-grid">
              {projetosFinais.map((projeto, idx) => (
                <article key={idx} className="b2b-project-card">
                  <div className="b2b-before-after">
                    <div className="b2b-compare-item">
                      <span>Antes</span>
                      <Image src={projeto.before} alt={`${projeto.title} antes`} fill sizes="(max-width: 768px) 90vw, 24vw" />
                    </div>
                    <div className="b2b-compare-item">
                      <span>Depois</span>
                      <Image src={projeto.after} alt={`${projeto.title} depois`} fill sizes="(max-width: 768px) 90vw, 24vw" />
                    </div>
                  </div>
                  <div className="b2b-project-copy">
                    <h3>{projeto.title}</h3>
                    <p>{projeto.detail}</p>
                    <small>{projeto.meta}</small>
                  </div>
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
                        alt="Galeria de serviços de solda" 
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

            <div className="group relative flex overflow-hidden mt-8 pt-4 pb-4 [mask-image:_linear-gradient(to_right,transparent_0,_black_15%,_black_85%,transparent_100%)]">
              <div className="flex w-max animate-infinite-scroll">
                {/* Duplicamos a lista e usamos map nela inteira para o cálculo de -50% funcionar com precisão */}
                {[...clientesFinais, ...clientesFinais].map((cliente, index) => (
                  <div 
                    key={`cliente-${index}`} 
                    className="flex-shrink-0 px-6 md:px-12 flex items-center justify-center"
                  >
                    <Image 
                      src={cliente.src} 
                      alt={cliente.name} 
                      width={120} 
                      height={48} 
                      className="object-contain opacity-70 hover:opacity-100 transition-opacity w-[100px] md:w-[120px] h-[40px] md:h-[48px]" 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* CSS injetado especificamente para este componente para evitar conflitos e bugs no Mobile */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes infinite-scroll {
                from { transform: translateX(0); }
                to { transform: translateX(-50%); }
              }
              .animate-infinite-scroll {
                animation: infinite-scroll 25s linear infinite;
              }
              /* Pausa no hover APENAS se o dispositivo tiver mouse (evita travamento no toque do celular) */
              @media (hover: hover) and (pointer: fine) {
                .group:hover .animate-infinite-scroll {
                  animation-play-state: paused;
                }
              }
            `}} />

          </div>
        </section>
      </main>

      <section id="contato" className="b2b-footer">
        <div className="container b2b-footer-grid">
          <div className="b2b-footer-copy">
            <span className="b2b-kicker">Solicite um orçamento</span>
            <h3>Descreva sua necessidade e nossa equipe entra em contato.</h3>
            <ul>
              <li>Telefone: (15) 99809-2548</li>
              <li>E-mail: contato@gringastylebr.com.br</li>
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