'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function GrupoHubPage() {
const [departamento, setDepartamento] = useState<'loja' | 'soldas'>('loja');
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

const handleWhatsAppSubmit = (event: React.FormEvent) => {
event.preventDefault();

const deptoNome = departamento === 'loja' ? 'Loja Gringa Style (B2C)' : 'Soldas Especiais (B2B)';
const mensagemTexto = `Olá! Meu nome é ${formData.nome}.\n\nDepartamento/Assunto: *${deptoNome}*\nEmpresa: ${formData.empresa || 'Não informado'}\nE-mail: ${formData.email}\nTelefone: ${formData.telefone}\nMensagem: ${formData.mensagem || 'Gostaria de mais informações.'}`;

const whatsappUrl = `https://wa.me/5515998092548?text=${encodeURIComponent(mensagemTexto)}`;
window.open(whatsappUrl, '_blank', 'noopener,noreferrer');


};

const handleEmailSubmit = (event: React.MouseEvent) => {
event.preventDefault();
if (!formData.email || !formData.nome) {
alert('Por favor, preencha pelo menos o seu Nome e E-mail antes de enviar.');
return;
}

const deptoNome = departamento === 'loja' ? 'Loja Gringa Style (B2C)' : 'Soldas Especiais (B2B)';
const assunto = encodeURIComponent(`Contato via Site - ${deptoNome} (${formData.nome})`);
const corpo = encodeURIComponent(`Nome: ${formData.nome}\nEmpresa: ${formData.empresa || 'Não informado'}\nE-mail: ${formData.email}\nTelefone: ${formData.telefone}\nDepartamento: ${deptoNome}\n\nMensagem:\n${formData.mensagem || 'Gostaria de mais informações.'}`);

window.location.href = `mailto:contato@gringastylebr.com.br?subject=${assunto}&body=${corpo}`;


};

return (
<div className="dual-path-page">
  <section className="dual-path-hero">
    <div className="container dual-path-shell">
      <span className="dual-path-eyebrow">Grupo Gringa Style</span>
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

      <div className="b2b-contact-form" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        {/* Seletor de Departamento */}
        <div className="form-campo" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: '#ccc', marginBottom: '8px', fontWeight: 'bold' }}>Selecione o Assunto / Destino</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setDepartamento('loja')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '5px',
                border: departamento === 'loja' ? '2px solid var(--cor-destaque)' : '1px solid #555',
                backgroundColor: departamento === 'loja' ? 'rgba(255,165,0,0.15)' : '#202020',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Loja (B2C)
            </button>
            <button
              type="button"
              onClick={() => setDepartamento('soldas')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '5px',
                border: departamento === 'soldas' ? '2px solid var(--cor-destaque)' : '1px solid #555',
                backgroundColor: departamento === 'soldas' ? 'rgba(255,165,0,0.15)' : '#202020',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Soldas Especiais (B2B)
            </button>
          </div>
        </div>

        <form onSubmit={handleWhatsAppSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="b2b-field-row">
            <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Seu Nome" aria-label="Nome" required />
            <input type="text" name="empresa" value={formData.empresa} onChange={handleChange} placeholder="Empresa (Opcional)" aria-label="Empresa" />
          </div>
          <div className="b2b-field-row">
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="E-mail" aria-label="E-mail" required />
            <input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="Telefone / WhatsApp" aria-label="Telefone" required />
          </div>
          <textarea name="mensagem" value={formData.mensagem} onChange={handleChange} placeholder="Como podemos ajudar?" aria-label="Mensagem" rows={4} />
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              type="submit"
              className="dual-path-cta dual-path-cta-primary"
              style={{ flex: 1, cursor: 'pointer', textAlign: 'center' }}
            >
              ENVIAR NO WHATSAPP
            </button>
            <button 
              type="button"
              onClick={handleEmailSubmit}
              className="dual-path-cta dual-path-cta-secondary"
              style={{ flex: 1, cursor: 'pointer', textAlign: 'center' }}
            >
              ENVIAR POR E-MAIL
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</div>


);
}