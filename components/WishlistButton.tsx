'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/useWishlistStore';
import { Product } from '@/types';
import { useToast } from '@/context/ToastContext';
import { trackWishlistAction } from '@/utils/analytics';
import { motion } from 'framer-motion';

interface WishlistButtonProps {
    product: Product;
    variant?: 'icon' | 'button';
    size?: 'sm' | 'md' | 'lg';
}

export default function WishlistButton({ product, variant = 'icon', size = 'md' }: WishlistButtonProps) {
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [mounted, setMounted] = useState(false);
    const addItem = useWishlistStore(state => state.addItem);
    const removeItem = useWishlistStore(state => state.removeItem);
    const isInList = useWishlistStore(state => state.isInWishlist);
    const { showToast } = useToast();

    useEffect(() => {
        setMounted(true);
        setIsInWishlist(isInList(product.id));
    }, [product.id, isInList]);

    const handleToggleWishlist = (e?: React.MouseEvent) => {
        e?.stopPropagation();

        if (!mounted) return;

        if (isInWishlist) {
            removeItem(product.id);
            setIsInWishlist(false);
            showToast(`Removido de favoritos`, 'success');
            trackWishlistAction('remove', product.id, product.nome);
        } else {
            addItem(product);
            setIsInWishlist(true);
            showToast(`Adicionado aos favoritos!`, 'success');
            trackWishlistAction('add', product.id, product.nome);
        }
    };

    const sizeMap = {
        sm: 20,
        md: 24,
        lg: 32
    };

    const iconSize = sizeMap[size];

    if (!mounted) return null;

    if (variant === 'icon') {
        return (
            <motion.button
                onClick={handleToggleWishlist}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 165, 0, 0.1)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                aria-label="Adicionar aos favoritos"
                title={isInWishlist ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
                <Heart
                    size={iconSize}
                    fill={isInWishlist ? 'var(--cor-destaque)' : 'none'}
                    color={isInWishlist ? 'var(--cor-destaque)' : 'currentColor'}
                />
            </motion.button>
        );
    }

    return (
        <motion.button
            onClick={handleToggleWishlist}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
                background: isInWishlist ? 'rgba(255, 165, 0, 0.1)' : 'transparent',
                border: `2px solid ${isInWishlist ? 'var(--cor-destaque)' : '#444'}`,
                color: isInWishlist ? 'var(--cor-destaque)' : '#888',
                padding: '10px 15px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.95rem',
                fontWeight: 500,
                transition: 'all 0.2s'
            }}
        >
            <Heart
                size={18}
                fill={isInWishlist ? 'var(--cor-destaque)' : 'none'}
                color={isInWishlist ? 'var(--cor-destaque)' : 'currentColor'}
            />
            {isInWishlist ? 'Nos favoritos!' : 'Adicionar aos favoritos'}
        </motion.button>
    );
}
