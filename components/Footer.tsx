'use client';

import Link from 'next/link';
import PushNotificationButton from './PushNotificationButton';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, MapPin, Instagram } from 'lucide-react';

export default function Footer() {
    const [clickCount, setClickCount] = useState(0);
    const router = useRouter();

    const handleSecretClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount === 5) {
            router.push('/admin');
            setClickCount(0);
        }
    };

    return (
        <footer className="rodape">
            <div className="container">
                <div className="rodape-coluna">
                    <h4>Gringa Style</h4>
                    <p>Equipamentos e acessórios para solda com a mais alta qualidade e estilo.</p>
                </div>
                <div className="rodape-coluna">
                    <h4>Contato</h4>
                    <p>
                        <a href="https://wa.me/5515998608170" target="_blank" aria-label="Contato via WhatsApp" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                            </svg>
                            (15) 99860-8170
                        </a>
                    </p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={16} /> nalessogtaw015@gmail.com</p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={16} /> Itapetininga - SP (Loja Online)</p>
                    <p><Link href="/privacidade">Política de Privacidade</Link></p>
                </div>
                <div className="rodape-coluna">
                    <h4>Siga-nos</h4>
                    <a href="https://www.instagram.com/gringastyle_br" target="_blank" className="social-link" aria-label="Siga-nos no Instagram" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Instagram size={16} /> Instagram
                    </a>
                </div>
            </div>
            <div className="rodape-base">
                <p>Usamos armazenamento local para salvar seu carrinho. Ao navegar, você concorda com nossa <Link href="/privacidade" style={{ textDecoration: 'underline', color: 'var(--cor-destaque)' }}>Política de Privacidade</Link>.</p>
                <p style={{ marginTop: '10px' }}>
                    &copy; <span onClick={handleSecretClick} style={{ cursor: 'default', userSelect: 'none' }}>2025</span> Gringa Style. Todos os direitos reservados.
                </p>

                <div id="push-subscribe-container" className="push-subscribe-container">
                    <PushNotificationButton />
                </div>
            </div>
        </footer>
    );
}
