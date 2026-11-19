'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Mail, MapPin, PhoneCall, ShieldCheck } from 'lucide-react';
import { buildWhatsAppUrl, getWhatsAppFormatted } from '@/lib/site-config';

const GS_FOOTER_CONTACTS = [
    { nome: 'Nalesso', telefone: '(15) 99860-8170', numeroLimpo: '5515998608170' },
    { nome: 'Emanuel', telefone: '(67) 8145-0995', numeroLimpo: '556781450995' },
    { nome: 'Fernando', telefone: '(19) 99328-3474', numeroLimpo: '5519993283474' },
];

export default function Footer() {
    const [clickCount, setClickCount] = useState(0);
    const router = useRouter();
    const pathname = usePathname();

    // Contexto com base na rota
    const isServices = pathname.startsWith('/gs-servicos-industriais') || pathname.startsWith('/soldas-especiais');
    const isPortal = pathname === '/';
    const isStore = !isPortal && !isServices;

    const gringaEmail = 'contato@gringastylebr.com.br';
    const gsServicesEmail = 'contato@gsservicosindustriais.com.br';
    const contactEmail = isServices ? gsServicesEmail : gringaEmail;

    const handleSecretClick = () => {
        if (process.env.NODE_ENV !== 'production') {
            const newCount = clickCount + 1;
            setClickCount(newCount);
            if (newCount === 5) {
                router.push('/admin');
                setClickCount(0);
            }
        }
    };

    // FOOTER EXCLUSIVO E CONTEXTUAL PARA GS SOLUÇÕES INDUSTRIAIS
    if (isServices) {
        return (
            <footer className="bg-[#0F172A] text-neutral-300 relative">
                {/* Barra gradiente fiel ao rodapé/capa do PDF */}
                <div
                    className="h-1 w-full"
                    style={{ background: 'linear-gradient(90deg, #D95B16 0%, #2AB3A6 100%)' }}
                    aria-hidden="true"
                />

                <div className="container !mb-0 !py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Coluna 1: Marca & Missão Industrial */}
                    <div className="space-y-4">
                        <div className="font-bold text-2xl tracking-wider text-[#D95B16]" style={{ fontFamily: 'var(--fonte-titulos)' }}>
                            GS SOLUÇÕES INDUSTRIAIS
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Soluções de engenharia em caldeiraria, soldas especiais de alta integridade, recuperação dimensional de peças críticas e manutenção mecânica em todo o Brasil.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
                            <ShieldCheck className="w-4 h-4 text-[#D95B16] flex-shrink-0" />
                            <span>Normas ASME, ANSI, NR-33 &amp; NR-35</span>
                        </div>
                    </div>

                    {/* Coluna 2: Especialidades Técnicas */}
                    <div className="space-y-2.5">
                        <h3 className="text-white font-bold text-lg mb-4" style={{ fontFamily: 'var(--fonte-titulos)' }}>Especialidades</h3>
                        <p className="text-sm"><a href="/gs-servicos-industriais#especialidades" className="text-slate-300 hover:text-[#D95B16] transition-colors">Tubulações Industriais (Sch 40 / 10S / OD)</a></p>
                        <p className="text-sm"><a href="/gs-servicos-industriais#soldas-especiais" className="text-slate-300 hover:text-[#D95B16] transition-colors">Soldas Especiais (GTAW / TIG)</a></p>
                        <p className="text-sm"><a href="/gs-servicos-industriais#caldeiraria" className="text-slate-300 hover:text-[#D95B16] transition-colors">Caldeiraria, Tanques &amp; Estruturas</a></p>
                        <p className="text-sm"><a href="/gs-servicos-industriais#manutencao" className="text-slate-300 hover:text-[#D95B16] transition-colors">Caldeiras, Torres &amp; Linha de Incêndio</a></p>
                        <p className="text-sm"><a href="/gs-servicos-industriais#segmentos" className="text-slate-300 hover:text-[#D95B16] transition-colors">Segmentos Atendidos</a></p>
                    </div>

                    {/* Coluna 3: Portfólio & Confiança */}
                    <div className="space-y-2.5">
                        <h3 className="text-white font-bold text-lg mb-4" style={{ fontFamily: 'var(--fonte-titulos)' }}>Portfólio &amp; Confiança</h3>
                        <p className="text-sm"><a href="/gs-servicos-industriais#sobre" className="text-slate-300 hover:text-[#D95B16] transition-colors">Quem Somos &amp; Valores</a></p>
                        <p className="text-sm"><a href="/gs-servicos-industriais#portfolio" className="text-[#D95B16] hover:text-white font-semibold transition-colors">Portfólio Técnico de Obras</a></p>
                        <p className="text-sm"><a href="/gs-servicos-industriais#clientes" className="text-slate-300 hover:text-[#D95B16] transition-colors">Principais Parceiros</a></p>
                        <p className="text-sm"><a href="/gs-servicos-industriais#diferenciais" className="text-slate-300 hover:text-[#D95B16] transition-colors">Qualidade &amp; Segurança (100% no Prazo)</a></p>
                        <p className="text-sm"><Link href="/" className="text-slate-400 hover:text-white transition-colors">Portal Grupo Gringa Style</Link></p>
                    </div>

                    {/* Coluna 4: Atendimento & Engenharia */}
                    <div className="space-y-3">
                        <h3 className="text-white font-bold text-lg mb-4" style={{ fontFamily: 'var(--fonte-titulos)' }}>Atendimento Técnico</h3>
                        <div className="space-y-2">
                            {GS_FOOTER_CONTACTS.map((ct) => (
                                <p key={ct.nome} className="text-sm flex items-center gap-2">
                                    <PhoneCall className="w-3.5 h-3.5 text-[#D95B16] flex-shrink-0" />
                                    <a
                                        href={`https://wa.me/${ct.numeroLimpo}?text=${encodeURIComponent(`Olá ${ct.nome}! Gostaria de falar com a equipe técnica da GS Soluções Industriais.`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-slate-200 hover:text-[#D95B16] transition-colors font-medium"
                                    >
                                        <span className="text-slate-400 font-normal">{ct.nome}:</span> {ct.telefone}
                                    </a>
                                </p>
                            ))}
                        </div>
                        <p className="text-sm flex items-start gap-2 break-all pt-1">
                            <Mail className="w-4 h-4 text-[#D95B16] flex-shrink-0 mt-0.5" />
                            <span className="text-slate-300">{gsServicesEmail}</span>
                        </p>
                        <p className="text-sm flex items-center gap-2 text-slate-300">
                            <MapPin className="w-4 h-4 text-[#D95B16] flex-shrink-0" />
                            <span>Atendimento em Fábrica em Todo o Brasil</span>
                        </p>
                        <div className="pt-2">
                            <a
                                href="/gs-servicos-industriais#contato"
                                className="inline-block px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-md bg-[#B84507] text-white hover:bg-[#9A3412] transition-colors shadow-md"
                            >
                                Ir para Formulário de Cotação
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10 py-6 text-center text-xs text-slate-400">
                    <p>
                        &copy; <span onClick={handleSecretClick} style={{ cursor: 'default', userSelect: 'none' }} suppressHydrationWarning>{new Date().getFullYear()}</span> GS Soluções Industriais — Divisão de Engenharia &amp; Manutenção. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        );
    }

    // FOOTER PADRÃO DA LOJA E DO PORTAL
    return (
        <footer className="rodape">
            <div className="container">
                <div className="rodape-coluna">
                    <div style={{ fontFamily: 'var(--fonte-titulos)', fontSize: '24px', color: 'var(--cor-destaque)', marginBottom: '15px', fontWeight: 'bold' }}>
                        {isPortal ? 'Grupo Gringa Style' : 'Gringa Style'}
                    </div>
                    <p>
                        {isPortal
                            ? 'Loja de equipamentos para soldadores e GS Soluções Industriais, com soluções em soldas especiais e mecânica industrial.'
                            : 'Equipamentos e acessórios para solda com a mais alta qualidade e estilo.'}
                    </p>
                </div>

                <div className="rodape-coluna">
                    <h3>Institucional</h3>
                    <p><Link href="/sobre">Sobre nós</Link></p>
                    <p><Link href="/loja">Loja Gringa Style</Link></p>
                    <p><Link href="/gs-servicos-industriais">GS Soluções Industriais</Link></p>
                    <p><Link href="/rifa">Ações e Rifas</Link></p>
                    <p><Link href="/historico">Histórico de Rifas</Link></p>
                    <p><Link href="/devolucao-e-reembolso">Devolução e Reembolso</Link></p>
                    <p><Link href="/privacidade">Política de Privacidade</Link></p>
                </div>

                <div className="rodape-coluna">
                    <h3>Categorias</h3>
                    <p><Link href="/categoria/6">Máscaras de Solda</Link></p>
                    <p><Link href="/categoria/9">Lentes de Solda</Link></p>
                    <p><Link href="/categoria/7">Acessórios e Tochas TIG</Link></p>
                    <p><Link href="/categoria/4">Camisas e Vestuário</Link></p>
                    <p><Link href="/categoria/5">Bonés</Link></p>
                    <p><Link href="/categoria/8">Kits Completos</Link></p>
                </div>
                
                <div className="rodape-coluna">
                    <h3>Contato</h3>
                    <p>
                        <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" aria-label="Contato via WhatsApp" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                            </svg>
                            {getWhatsAppFormatted()}
                        </a>
                    </p>
                    <p style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', flexWrap: 'wrap', overflowWrap: 'anywhere' }}>
                        <Mail size={16} />
                        <span>{contactEmail}</span>
                    </p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={16} /> Itapetininga - SP (Loja Online)</p>
                </div>

                <div className="rodape-coluna">
                    <h3>Siga-nos</h3>
                    <a href="https://www.instagram.com/gringastyle_br" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Siga-nos no Instagram" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.852-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.204-.275 1.486-.145.373-.319.64-.599.92-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.275-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.035-1.203-.166-1.486-.275-.373-.145-.64-.319-.92-.599-.28-.28-.453-.546-.598-.92-.11-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.231 0-2.136.008-2.388.046-3.231.035-.78.166-1.204.275-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.486-.275.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/>
                        </svg>
                        Instagram
                    </a>
                </div>
            </div>
            
            <div className="rodape-base">
                <p>Usamos armazenamento local para salvar seu carrinho. Ao navegar, você concorda com nossa <Link href="/privacidade" style={{ textDecoration: 'underline', color: 'var(--cor-destaque)' }}>Política de Privacidade</Link>.</p>
                <p style={{ marginTop: '10px' }}>
                    &copy; <span onClick={handleSecretClick} style={{ cursor: 'default', userSelect: 'none' }} suppressHydrationWarning>{new Date().getFullYear()}</span> Gringa Style. Todos os direitos reservados.
                </p>
            </div>
        </footer>
    );
}
