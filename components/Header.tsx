'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ShoppingCart, Menu } from 'lucide-react';
import PushNotificationButton from './PushNotificationButton';

export default function Header() {
    const [menuAberto, setMenuAberto] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        // Placeholder for cart count logic - reading from localStorage if available
        const updateCartCount = () => {
            const carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
            const count = carrinho.reduce((acc: number, item: any) => acc + (item.quantidade || 1), 0);
            setCartCount(count);
        };

        updateCartCount();
        window.addEventListener('storage', updateCartCount);
        // Custom event for internal updates
        window.addEventListener('cart-updated', updateCartCount);

        return () => {
            window.removeEventListener('storage', updateCartCount);
            window.removeEventListener('cart-updated', updateCartCount);
        };
    }, []);

    const toggleMenu = () => {
        setMenuAberto(!menuAberto);
    };

    return (
        <header className="cabecalho">
            <div className="container">
                <Link href="/" className="logo">
                    <Image
                        src="/imagens/gringa_style_logo.png"
                        alt="Logo Gringa Style"
                        width={90}
                        height={90}
                        style={{ aspectRatio: '1/1' }}
                        priority
                    />
                </Link>
                <nav id="nav-menu" className={`navegacao ${menuAberto ? 'menu-aberto' : ''}`}>
                    <Link href="/" className="nav-item">Produtos</Link>
                    <Link href="/rifa" className="nav-item">Rifa</Link>
                    <Link href="/historico" className="nav-item">Histórico</Link>
                    <Link href="/#sobre" className="nav-item">Sobre</Link>
                    <Link href="/#contato" className="nav-item">Contato</Link>
                </nav>
                <div className="header-direita">
                    <PushNotificationButton />
                    <Link href="/carrinho" className="carrinho">
                        <i className="fas fa-shopping-cart"></i>
                        <span className="carrinho-contador">{cartCount}</span>
                    </Link>
                    <button
                        id="hamburger-btn"
                        className="hamburger-btn"
                        aria-label="Abrir menu de navegação"
                        onClick={toggleMenu}
                    >
                        <i className="fas fa-bars"></i>
                    </button>
                </div>
            </div>
        </header>
    );
}
