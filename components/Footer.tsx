'use client';

import Link from 'next/link';
import PushNotificationButton from './PushNotificationButton';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
                    <p><a href="https://wa.me/5515998608170" target="_blank"><i className="fab fa-whatsapp"></i> (15) 99860-8170</a></p>
                    <p><i className="fas fa-envelope"></i> nalessogtaw015@gmail.com</p>
                    <p><i className="fas fa-map-marker-alt"></i> Itapetininga - SP (Loja Online)</p>
                    <p><Link href="/privacidade">Política de Privacidade</Link></p>
                </div>
                <div className="rodape-coluna">
                    <h4>Siga-nos</h4>
                    <a href="https://www.instagram.com/gringastyle_br" target="_blank" className="social-link">
                        <i className="fab fa-instagram"></i> Instagram
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
