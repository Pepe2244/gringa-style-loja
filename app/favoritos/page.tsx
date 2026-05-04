'use client';

import { useState, useEffect } from 'react';
import { useWishlistStore } from '@/store/useWishlistStore';
import { Product } from '@/types';
import ProductGrid from '@/components/home/ProductGrid';

export default function FavoritosPage() {
    const { items: wishlistItems } = useWishlistStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setProducts(wishlistItems || []);
        setLoading(false);
    }, [wishlistItems]);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '20px' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{
                    color: '#fff',
                    fontSize: '2rem',
                    marginBottom: '30px',
                    textAlign: 'center'
                }}>
                    Meus Favoritos
                </h1>

                {loading ? (
                    <div style={{ textAlign: 'center', color: '#ccc', padding: '40px' }}>
                        Carregando...
                    </div>
                ) : products.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: '#ccc',
                        padding: '60px 20px',
                        backgroundColor: '#111',
                        borderRadius: '12px'
                    }}>
                        <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                            Você ainda não adicionou nenhum produto aos favoritos
                        </p>
                        <a href="/" style={{
                            display: 'inline-block',
                            backgroundColor: '#ff6b35',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '1rem'
                        }}>
                            Voltar para a Loja
                        </a>
                    </div>
                ) : (
                    <ProductGrid
                        products={products}
                        loading={loading}
                        diasNovo={7}
                        onQuickView={() => {}}
                    />
                )}
            </div>
        </div>
    );
}
