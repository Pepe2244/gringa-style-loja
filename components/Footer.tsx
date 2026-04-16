import React from 'react';
// Substituímos o componente Link do Next.js por tags <a> convencionais para garantir que o código compile corretamente no Canvas.
// No seu projeto Next.js real, você poderá reverter para o componente Link se desejar.
import { Instagram, Facebook, Mail, MessageCircle, ShieldCheck } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-950 text-white pt-16 pb-8 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <a href="/" className="inline-block">
              <span className="text-2xl font-black tracking-tighter italic text-orange-500">
                GRINGA<span className="text-white font-light">STYLE</span>
              </span>
            </a>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
              Equipamentos de alta performance para soldadores que não aceitam nada menos que a perfeição. Estilo e proteção em cada cordão.
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-900 rounded-full hover:bg-orange-600 transition-colors">
                <Instagram size={18} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-900 rounded-full hover:bg-orange-600 transition-colors">
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-orange-500 mb-6">Categorias</h3>
            <ul className="space-y-4">
              <li><a href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">Máscaras de Solda</a></li>
              <li><a href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">Tochas e Consumíveis</a></li>
              <li><a href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">Lentes Especiais</a></li>
              <li><a href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">Personalizados</a></li>
            </ul>
          </div>

          {/* Institutional */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-orange-500 mb-6">Institucional</h3>
            <ul className="space-y-4">
              <li><a href="/sobre" className="text-zinc-400 hover:text-white text-sm transition-colors">Sobre Nós</a></li>
              <li><a href="/privacidade" className="text-zinc-400 hover:text-white text-sm transition-colors">Política de Privacidade</a></li>
              <li>
                <a href="/devolucao-e-reembolso" className="text-zinc-400 hover:text-white text-sm transition-colors font-medium flex items-center">
                  Trocas e Devoluções
                  <span className="ml-2 px-1.5 py-0.5 bg-orange-500/10 text-orange-500 text-[10px] rounded border border-orange-500/20">Novo</span>
                </a>
              </li>
              <li><a href="/acompanhar-rifa" className="text-zinc-400 hover:text-white text-sm transition-colors">Acompanhar Rifa</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-orange-500 mb-6">Atendimento</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <Mail size={18} className="text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs text-zinc-500 uppercase font-bold">E-mail</span>
                  <a href="mailto:nalessogtaw015@gmail.com" className="text-zinc-300 hover:text-white text-sm break-all">
                    nalessogtaw015@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <MessageCircle size={18} className="text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs text-zinc-500 uppercase font-bold">WhatsApp</span>
                  <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-white text-sm">
                    Suporte Especializado
                  </a>
                </div>
              </li>
            </ul>
            <div className="mt-8 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-center space-x-3">
              <ShieldCheck className="text-green-500" size={24} />
              <div className="text-[10px] text-zinc-500 leading-tight uppercase font-bold">
                Site 100% Seguro<br />Ambiente Criptografado
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-zinc-500 text-xs text-center md:text-left">
            &copy; {currentYear} Gringa Style. Todos os direitos reservados. 
            <span className="block md:inline md:ml-2 text-zinc-600 italic">Feito por e para Soldadores.</span>
          </p>
          <div className="flex items-center space-x-6">
            <div className="flex space-x-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <div className="w-8 h-5 bg-zinc-800 rounded flex items-center justify-center text-[8px] font-bold">PIX</div>
              <div className="w-8 h-5 bg-zinc-800 rounded flex items-center justify-center text-[8px] font-bold">VISA</div>
              <div className="w-8 h-5 bg-zinc-800 rounded flex items-center justify-center text-[8px] font-bold">MC</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;