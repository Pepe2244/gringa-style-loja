'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const totalItems = useCartStore(state => state.totalItems());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const isActive = (path: string) => pathname === path ? 'active' : '';

    return (
        <header className="header">
            <div className="container header-container">
                <Link href="/" className="logo-link" onClick={closeMenu}>
                    <img src="/imagens/logo-gringa-style.png" alt="Gringa Style Logo" className="logo" />
                </Link>

                <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                    <button className="fechar-menu-btn" onClick={closeMenu}>
                        <X size={24} />
                    </button>
                    <ul>
                        <li><Link href="/" className={isActive('/')} onClick={closeMenu}>Início</Link></li>
                        <li><Link href="/#produtos" onClick={closeMenu}>Produtos</Link></li>
                        <li><Link href="/rifa" className={isActive('/rifa')} onClick={closeMenu}>Rifa</Link></li>
                        <li><Link href="/historico" className={isActive('/historico')} onClick={closeMenu}>Ganhadores</Link></li>
                        <li><Link href="/acompanhar-rifa" className={isActive('/acompanhar-rifa')} onClick={closeMenu}>Meus Números</Link></li>
                    </ul>
                </nav>

                <div className="header-actions">
                    <Link href="/carrinho" className="carrinho">
                        <ShoppingCart size={24} />
                        <span className="carrinho-contador">{mounted ? totalItems : 0}</span>
                    </Link>
                    <button
                        id="hamburger-btn"
                        className="hamburger-btn"
                        aria-label="Abrir menu de navegação"
                        onClick={toggleMenu}
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </div>
            {isMenuOpen && <div className="overlay-menu" onClick={closeMenu}></div>}
        </header>
    );
}
