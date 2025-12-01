'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { supabase } from '@/lib/supabase';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const totalItems = useCartStore(state => state.totalItems());
    const [mounted, setMounted] = useState(false);
    const [hasActiveRaffles, setHasActiveRaffles] = useState(false);

    useEffect(() => {
        setMounted(true);
        checkActiveRaffles();
    }, []);

    const checkActiveRaffles = async () => {
        const { count } = await supabase
            .from('rifas')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'ativa');

        setHasActiveRaffles(count !== null && count > 0);
    };

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
                    <img src="/imagens/logo_gringa_style.png" alt="Gringa Style Logo" />
                </Link>

                <nav className={`navegacao ${isMenuOpen ? 'menu-aberto' : ''}`}>

                    <Link href="/" className={`nav-item ${isActive('/')}`} onClick={closeMenu}>Início</Link>
                    <Link href="/#produtos" className="nav-item" onClick={closeMenu}>Produtos</Link>
                    <Link href="/rifa" className={`nav-item ${isActive('/rifa')}`} onClick={closeMenu}>Rifa</Link>
                    <Link href="/historico" className={`nav-item ${isActive('/historico')}`} onClick={closeMenu}>Ganhadores</Link>

                    {hasActiveRaffles && (
                        <Link href="/acompanhar-rifa" className={`nav-item ${isActive('/acompanhar-rifa')}`} onClick={closeMenu}>
                            Meus Números
                        </Link>
                    )}
                </nav>

                <div className="header-direita" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <Link href="/carrinho" className="carrinho" style={{ display: 'flex', alignItems: 'center' }}>
                        <ShoppingCart size={28} />
                        <span className="carrinho-contador">{mounted ? totalItems : 0}</span>
                    </Link>
                    <button
                        id="hamburger-btn"
                        className="hamburger-btn"
                        aria-label="Abrir menu de navegação"
                        onClick={toggleMenu}
                    >
                        <Menu size={32} />
                    </button>
                </div>
            </div>
            {isMenuOpen && <div className="overlay-menu" onClick={closeMenu}></div>}
        </header>
    );
}