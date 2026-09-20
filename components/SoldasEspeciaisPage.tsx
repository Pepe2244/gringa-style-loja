'use client';

import Link from 'next/link';
import { useState } from 'react';

const diferenciais = [
  { title: 'Time Qualificado', text: 'Equipe técnica com experiência real em soldagem industrial.' },
  { title: 'Atendimento em Todo o Brasil', text: 'Execução e suporte em plantas, caldeiraria e manutenção.' },
  { title: 'Cumprimento de Normas', text: 'Processos alinhados com exigências técnicas e de segurança.' },
  { title: 'Laudo Técnico', text: 'Documentação técnica para tomada de decisão e rastreabilidade.' },
];

const projetos = [
  {
    title: 'Recuperação de eixo de máquina industrial',
    detail: 'Recuperação estrutural com solda especializada em aço e alta resistência.',
    meta: 'Norma / Procedimento técnico atendido',
    before: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80',
    after: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Estrutura metálica em altura',
    detail: 'Execução em campo com equipe especializada, EPIs e monitoramento de segurança.',
    meta: 'Execução em obra / inspeção de qualidade',
    before: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80',
    after: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?auto=format&fit=crop&w=900&q=80',
  },
];

const clientes = ['Aços', 'Industria', 'Metalúrgica', 'Logística', 'Energia'];

export default function SoldasEspeciaisPage() {
  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    mensagem: '',
  });

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
              {projetos.map((projeto) => (
                <article key={projeto.title} className="b2b-project-card">
                  <div className="b2b-before-after">
                    <div className="b2b-compare-item">
                      <span>Antes</span>
                      <img src={projeto.before} alt={`${projeto.title} antes`} />
                    </div>
                    <div className="b2b-compare-item">
                      <span>Depois</span>
                      <img src={projeto.after} alt={`${projeto.title} depois`} />
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

        <section className="b2b-section">
          <div className="container">
            <div className="b2b-section-header">
              <span className="b2b-kicker">Confiança</span>
              <h2>Clientes que confiam em nossa execução.</h2>
            </div>

            <div className="b2b-client-logos" aria-label="Clientes e parceiros">
              {clientes.map((cliente) => (
                <div key={cliente} className="b2b-client-logo">
                  {cliente}
                </div>
              ))}
            </div>
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
