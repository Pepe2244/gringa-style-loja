'use client';

import { useState } from 'react';

export default function GrupoHubContactForm() {
  const lojaEmail = 'contato@gringastylebr.com.br';
  const gsServicesEmail = 'contato@gsservicosindustriais.com.br';
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

    const deptoNome = departamento === 'loja' ? 'Loja Gringa Style (B2C)' : 'GS Serviços Industriais (B2B)';
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

    const deptoNome = departamento === 'loja' ? 'Loja Gringa Style (B2C)' : 'GS Serviços Industriais (B2B)';
    const destinatario = departamento === 'loja' ? lojaEmail : gsServicesEmail;
    const assunto = encodeURIComponent(`Contato via Site - ${deptoNome} (${formData.nome})`);
    const corpo = encodeURIComponent(`Nome: ${formData.nome}\nEmpresa: ${formData.empresa || 'Não informado'}\nE-mail: ${formData.email}\nTelefone: ${formData.telefone}\nDepartamento: ${deptoNome}\n\nMensagem:\n${formData.mensagem || 'Gostaria de mais informações.'}`);

    window.location.href = `mailto:${destinatario}?subject=${assunto}&body=${corpo}`;
  };

  return (
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
              color: 'hsl(0, 0%, 100%)',
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
            GS Serviços Industriais (B2B)
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
  );
}
