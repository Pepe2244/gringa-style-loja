'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Heart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { supabase } from '@/lib/supabase';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const totalItems = useCartStore(state => state.totalItems());
    const wishlistItems = useWishlistStore(state => state.items) || [];
    const wishlistCount = wishlistItems.length;
    
    const [mounted, setMounted] = useState(false);
    const [hasActiveRaffles, setHasActiveRaffles] = useState(false);
    const [isBouncing, setIsBouncing] = useState(false);
    const prevItemsRef = useRef(totalItems);

    useEffect(() => {
        if (mounted && totalItems > prevItemsRef.current) {
            setIsBouncing(true);
            const timer = setTimeout(() => setIsBouncing(false), 300);
            return () => clearTimeout(timer);
        }
        prevItemsRef.current = totalItems;
    }, [totalItems, mounted]);

    const checkActiveRaffles = async () => {
        const { count } = await supabase
            .from('rifas')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'ativa');

        setHasActiveRaffles(count !== null && count > 0);
    };

    useEffect(() => {
        setMounted(true);
        checkActiveRaffles();
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
                <Link href="/" className="logo" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', flexShrink: '0', textDecoration: 'none' }}>
                    <div style={{ position: 'relative', width: '220px', height: '80px', maxWidth: 'none' }} className="sm:w-[280px] sm:h-[95px] lg:w-[360px] lg:h-[120px]">
                        <Image
                            src="/imagens/logo_gringa_style.png"
                            alt="Gringa Style Logo"
                            fill
                            priority
                            sizes="(max-width: 640px) 220px, (max-width: 1024px) 280px, 360px"
                            style={{ objectFit: 'contain', objectPosition: 'left' }}
                        />
                    </div>
                </Link>

                <nav className={`navegacao ${isMenuOpen ? 'menu-aberto' : ''}`} style={isMenuOpen ? { backgroundColor: 'rgba(18, 18, 18, 0.85)', backdropFilter: 'blur(16px)' } : {}}>
                    <Link href="/" className={`nav-item ${isActive('/')}`} onClick={closeMenu}>Início</Link>
                    <Link href="/#produtos" className="nav-item" onClick={closeMenu}>Produtos</Link>
                    <Link href="/rifa" className={`nav-item ${isActive('/rifa')}`} onClick={closeMenu}>Rifa</Link>
                    <Link href="#contato" className="nav-item" onClick={closeMenu}>Contato</Link>
                    <Link href="/sobre" className={`nav-item ${isActive('/sobre')}`} onClick={closeMenu}>Sobre</Link>

                    {hasActiveRaffles && (
                        <Link href="/acompanhar-rifa" className={`nav-item ${isActive('/acompanhar-rifa')}`} onClick={closeMenu}>
                            Meus Números
                        </Link>
                    )}
                </nav>

                <div className="header-direita" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    <Link 
                        href="/favoritos" 
                        className="favoritos" 
                        onClick={closeMenu}
                        style={{ display: 'flex', alignItems: 'center', position: 'relative', color: 'inherit' }} 
                        title="Meus Favoritos"
                    >
                        <Heart 
                            size={26} 
                            color={mounted && wishlistCount > 0 ? 'var(--cor-destaque, #ff6b00)' : 'currentColor'} 
                            fill={mounted && wishlistCount > 0 ? 'var(--cor-destaque, #ff6b00)' : 'none'} 
                        />
                        <span 
                            className="favoritos-contador" 
                            style={{ 
                                minWidth: '18px', 
                                height: '18px',
                                padding: '0 4px',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                display: 'inline-grid', 
                                placeItems: 'center',
                                backgroundColor: 'var(--cor-destaque, #ff6b00)',
                                color: '#000',
                                position: 'absolute',
                                top: '-6px',
                                right: '-8px'
                            }}
                        >
                            {mounted ? wishlistCount : 0}
                        </span>
                    </Link>

                    <Link href="/carrinho" className="carrinho" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                        <ShoppingCart size={28} />
                        <span 
                            className="carrinho-contador" 
                            style={{ 
                                minWidth: '20px', 
                                display: 'inline-grid', 
                                placeItems: 'center',
                                transform: isBouncing ? 'scale(1.3)' : 'scale(1)',
                                transition: 'transform 0.2s ease-out',
                                backgroundColor: isBouncing ? '#fff' : 'var(--cor-destaque)',
                                color: isBouncing ? '#000' : 'inherit'
                            }}
                        >
                            {mounted ? totalItems : 0}
                        </span>
                    </Link>

                    <button
                        id="hamburger-btn"
                        className="hamburger-btn"
                        aria-label="Abrir menu de navegação"
                        onClick={toggleMenu}
                    >
                        {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
                    </button>
                </div>
            </div>
            {isMenuOpen && <div className="overlay-menu" onClick={closeMenu} style={{ backdropFilter: 'blurpx', backgroundColor: 'rgba(0,0,0,0.6)' }}></div>}
        </header>
    );
}