import Link from 'next/link';
import PushNotificationButton from './PushNotificationButton';
import { Mail, MapPin, Instagram, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Transformamos o Footer num Server Component (sem 'use client')
// Isso garante que o Google lê os links no código-fonte original (SEO Perfeito)
export default async function Footer() {
    // Busca dinâmica dos 4 produtos mais relevantes (ex: últimos adicionados ou em estoque)
    const { data: topProdutos } = await supabase
        .from('produtos')
        .select('id, nome, slug')
        .eq('em_estoque', true) // Garante que não manda o usuário para produto esgotado
        .limit(4);

    return (
        <footer className="rodape">
            <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '30px' }}>

                <div className="rodape-coluna" style={{ flex: '1 1 200px' }}>
                    <div style={{ fontFamily: 'var(--fonte-titulos)', fontSize: '24px', color: 'var(--cor-destaque)', marginBottom: '15px', fontWeight: 'bold' }}>
                        Gringa Style
                    </div>
                    <p>Equipamentos e acessórios para solda com a mais alta qualidade e estilo.</p>
                </div>

                {/* A MATRIZ DINÂMICA DE SEO */}
                <div className="rodape-coluna" style={{ flex: '1 1 200px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                        <ShoppingBag size={18} /> Destaques
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {topProdutos && topProdutos.length > 0 ? (
                            topProdutos.map((produto) => (
                                <li key={produto.id}>
                                    <Link 
                                        href={`/produto/${produto.slug || produto.id}`} 
                                        title={`Comprar ${produto.nome}`} 
                                        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                        className="hover-destaque"
                                    >
                                        {produto.nome}
                                    </Link>
                                </li>
                            ))
                        ) : (
                            // Fallback caso o banco falhe
                            <li><Link href="/" style={{ color: 'inherit' }}>Ver Catálogo Completo</Link></li>
                        )}
                    </ul>
                </div>

                <div className="rodape-coluna" style={{ flex: '1 1 200px' }}>
                    <h3 style={{ marginBottom: '15px' }}>Contato</h3>
                    <p style={{ marginBottom: '10px' }}>
                        <a href="https://wa.me/5515998608170" target="_blank" aria-label="Contato via WhatsApp" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                            </svg>
                            (15) 99860-8170
                        </a>
                    </p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><Mail size={16} /> nalessogtaw015@gmail.com</p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><MapPin size={16} /> Itapetininga - SP (Loja Online)</p>
                    <p><Link href="/privacidade" style={{ textDecoration: 'underline' }}>Política de Privacidade</Link></p>
                </div>

                <div className="rodape-coluna" style={{ flex: '1 1 200px' }}>
                    <h3 style={{ marginBottom: '15px' }}>Siga-nos</h3>
                    <a href="https://www.instagram.com/gringastyle_br" target="_blank" className="social-link" aria-label="Siga-nos no Instagram" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
                        <Instagram size={16} /> Instagram
                    </a>
                </div>
            </div>

            <div className="rodape-base">
                <p>Usamos armazenamento local para salvar seu carrinho. Ao navegar, você concorda com nossa <Link href="/privacidade" style={{ textDecoration: 'underline', color: 'var(--cor-destaque)' }}>Política de Privacidade</Link>.</p>
                <p style={{ marginTop: '10px' }}>
                    &copy; 
                    {/* Link stealth: visualmente idêntico a um texto normal, mas leva direto pro admin */}
                    <Link href="/admin" style={{ cursor: 'default', color: 'inherit', textDecoration: 'none', marginLeft: '4px' }}>
                        {new Date().getFullYear()}
                    </Link> 
                    {' '}Gringa Style. Todos os direitos reservados.
                </p>

                <div id="push-subscribe-container" className="push-subscribe-container" style={{ marginTop: '20px' }}>
                    <PushNotificationButton />
                </div>
            </div>

            {/* CSS inline para evitar que o hover do client quebre no Server Component */}
            <style dangerouslySetInnerHTML={{__html: `
                .hover-destaque:hover {
                    color: var(--cor-destaque) !important;
                }
            `}} />
        </footer>
    );
}


