'use client';

import { useState } from 'react';
import { MessageSquare, Phone, X } from 'lucide-react';

const GS_ENGINEERING_CONTACTS = [
  { nome: 'Nalesso', telefone: '(15) 99860-8170', numeroLimpo: '5515998608170' },
  { nome: 'Emanuel', telefone: '(67) 8145-0995', numeroLimpo: '556781450995' },
  { nome: 'Fernando', telefone: '(19) 99328-3474', numeroLimpo: '5519993283474' },
];

export default function GSWhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);

  const buildContactUrl = (nome: string, numeroLimpo: string) => {
    const message = `Olá ${nome}! Gostaria de falar com a engenharia da GS Soluções Industriais para solicitar um orçamento.`;
    return `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="gs-floating-whatsapp">
      {/* Balão de Contatos Oficiais da Engenharia */}
      {isOpen && (
        <div className="gs-whatsapp-bubble" role="dialog" aria-label="Canais de Engenharia GS Soluções Industriais">
          <div className="gs-whatsapp-bubble-header">
            <div>
              <strong>Engenharia &amp; Orçamentos</strong>
              <p>GS Soluções Industriais</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="gs-whatsapp-close"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="gs-whatsapp-bubble-body">
            <p>
              Fale diretamente com nossa equipe técnica para <strong>soldas especiais</strong>, <strong>caldeiraria</strong> ou <strong>manutenção industrial</strong>:
            </p>
            <div className="gs-whatsapp-contact-list">
              {GS_ENGINEERING_CONTACTS.map((contato) => (
                <a
                  key={contato.nome}
                  href={buildContactUrl(contato.nome, contato.numeroLimpo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gs-whatsapp-contact-item"
                >
                  <span className="gs-whatsapp-contact-name">
                    <Phone className="w-3.5 h-3.5 text-[#D95B16]" />
                    {contato.nome}
                  </span>
                  <strong className="gs-whatsapp-contact-phone">{contato.telefone}</strong>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Botão Principal */}
      <div className="flex items-center gap-2">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-[#0F172A] text-white border border-[#D95B16]/60 px-3.5 py-2 rounded-full text-xs font-semibold shadow-xl cursor-pointer hover:border-[#D95B16] transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Plantão Técnico Online</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Abrir atendimento WhatsApp da GS Soluções Industriais"
          className="gs-whatsapp-main-btn"
        >
          <span className="gs-whatsapp-pulse" />
          <MessageSquare className="w-6 h-6 text-white relative z-10" />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .gs-floating-whatsapp {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        .gs-whatsapp-main-btn {
          position: relative;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #25D366;
          border: 2px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 10px 25px rgba(37, 211, 102, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .gs-whatsapp-main-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 14px 30px rgba(37, 211, 102, 0.55);
        }

        .gs-whatsapp-pulse {
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 2px solid #25D366;
          animation: gsPulse 2s infinite;
          opacity: 0.8;
        }

        @keyframes gsPulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }

        .gs-whatsapp-bubble {
          width: 320px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-top: 4px solid #D95B16;
          border-radius: 16px;
          box-shadow: 0 22px 48px rgba(15, 23, 42, 0.25);
          overflow: hidden;
          animation: gsBubbleSlide 0.25s ease-out;
        }

        .gs-whatsapp-bubble-header {
          background: #0F172A;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .gs-whatsapp-bubble-header strong {
          color: #ffffff;
          font-size: 0.9rem;
          display: block;
        }

        .gs-whatsapp-bubble-header p {
          color: #D95B16;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin: 2px 0 0;
        }

        .gs-whatsapp-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
        }

        .gs-whatsapp-close:hover {
          color: #ffffff;
        }

        .gs-whatsapp-bubble-body {
          padding: 16px;
          color: #334155;
          font-size: 0.84rem;
          line-height: 1.45;
        }

        .gs-whatsapp-contact-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }

        .gs-whatsapp-contact-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 3px solid #D95B16;
          border-radius: 8px;
          color: #0F172A;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .gs-whatsapp-contact-item:hover {
          background: #fff7ed;
          border-color: #D95B16;
          transform: translateX(2px);
        }

        .gs-whatsapp-contact-name {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.84rem;
          font-weight: 700;
          color: #0F172A;
        }

        .gs-whatsapp-contact-phone {
          font-size: 0.8rem;
          font-weight: 800;
          color: #16a34a;
        }

        @keyframes gsBubbleSlide {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}
