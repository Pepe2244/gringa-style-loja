'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types';
import ProductGrid from '@/components/home/ProductGrid';
import { useToast } from '@/context/ToastContext';
import ProductFilters from '@/components/home/ProductFilters';
import { trackSearchQuery } from '@/utils/analytics';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [sortType, setSortType] = useState('padrao');
    const [searchTerm, setSearchTerm] = useState(query);
    const { showToast } = useToast();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Load categories
                const { data: categoriesData } = await supabase
                    .from('categorias')
                    .select('*')
                    .order('nome');
                setCategories(categoriesData || []);

                // Search products
                if (query.trim()) {
                    const searchTerm = query.toLowerCase();
                    const { data: searchData } = await supabase
                        .from('produtos')
                        .select('*')
                        .or(`nome.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
                        .order('created_at', { ascending: false });

                    if (searchData) {
                        setProducts(searchData);
                        trackSearchQuery(query, searchData.length);
                    }
                }
            } catch (error) {
                console.error('Search error:', error);
                showToast('Erro ao buscar produtos', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [query, showToast]);

    const normalizeString = (str: string) => {
        if (!str) return '';
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    };

    const getPrecoFinal = (p: Product) => {
        if (!p.preco_promocional || p.preco_promocional >= p.preco) {
            return p.preco;
        }
        return p.preco_promocional;
    };

    const filteredProducts = products.filter(product => {
        const term = normalizeString(searchTerm);
        const matchSearch =
            normalizeString(product.nome).includes(term) ||
            normalizeString(product.descricao).includes(term) ||
            (product.tags && normalizeString(product.tags.join(' ')).includes(term));

        const matchCategory = selectedCategory ? product.categoria_id === selectedCategory : true;

        return matchSearch && matchCategory;
    }).sort((a, b) => {
        if (sortType === 'menor-preco') {
            return getPrecoFinal(a) - getPrecoFinal(b);
        } else if (sortType === 'maior-preco') {
            return getPrecoFinal(b) - getPrecoFinal(a);
        } else if (sortType === 'az') {
            return a.nome.localeCompare(b.nome);
        } else if (sortType === 'za') {
            return b.nome.localeCompare(a.nome);
        }
        return 0;
    });

    return (
        <main style={{ minHeight: '60vh', padding: '20px 0' }}>
            <div className="container">
                <h1 style={{
                    fontFamily: 'var(--fonte-titulos)',
                    fontSize: '2.5rem',
                    marginBottom: '30px',
                    color: 'var(--cor-destaque)'
                }}>
                    Resultados para "{query}"
                </h1>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        <p>Buscando produtos...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: '#111',
                        borderRadius: '10px',
                        border: '1px solid #222'
                    }}>
                        <h2 style={{ color: '#888', marginBottom: '15px' }}>Nenhum produto encontrado</h2>
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            Tente refinar sua busca ou navegue por categorias
                        </p>
                        <a
                            href="/"
                            style={{
                                display: 'inline-block',
                                padding: '12px 30px',
                                background: 'var(--cor-destaque)',
                                color: 'black',
                                textDecoration: 'none',
                                borderRadius: '6px',
                                fontWeight: 'bold'
                            }}
                        >
                            Voltar para Home
                        </a>
                    </div>
                ) : (
                    <>
                        <ProductFilters
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            sortType={sortType}
                            setSortType={setSortType}
                            categories={categories}
                        />

                        <div style={{ marginTop: '30px', marginBottom: '20px', color: '#888' }}>
                            Encontrados <strong style={{ color: 'var(--cor-destaque)' }}>{filteredProducts.length}</strong> produtos
                        </div>

                        <ProductGrid
                            products={filteredProducts}
                            diasNovo={7}
                            onQuickView={() => {}}
                        />
                    </>
                )}
            </div>
        </main>
    );
}
