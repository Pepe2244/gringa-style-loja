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
        <header className="cabecalho">
            <div className="container">
                <Link href="/" className="logo" onClick={closeMenu}>
                    <img src="/logo-gringa-style.png" alt="Gringa Style Logo" />
                </Link>

                <nav className={`navegacao ${isMenuOpen ? 'menu-aberto' : ''}`}>
                    <button className="fechar-menu-btn" onClick={closeMenu}>
                        <X size={24} />
                    </button>
                    <Link href="/" className={`nav-item ${isActive('/')}`} onClick={closeMenu}>Início</Link>
                    <Link href="/#produtos" className="nav-item" onClick={closeMenu}>Produtos</Link>
                    <Link href="/rifa" className={`nav-item ${isActive('/rifa')}`} onClick={closeMenu}>Rifa</Link>
                    <Link href="/historico" className={`nav-item ${isActive('/historico')}`} onClick={closeMenu}>Ganhadores</Link>
                    <Link href="/acompanhar-rifa" className={`nav-item ${isActive('/acompanhar-rifa')}`} onClick={closeMenu}>Meus Números</Link>
                </nav>

                <div className="header-direita">
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
