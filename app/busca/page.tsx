'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types';
import ProductGrid from '@/components/home/ProductGrid';
import { useToast } from '@/context/ToastContext';
import ProductFilters from '@/components/home/ProductFilters';
import { trackSearchQuery } from '@/utils/analytics';

const PRODUCTS_PER_PAGE = 12;

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [sortType, setSortType] = useState('padrao');
    const [searchTerm, setSearchTerm] = useState(query);
    const [page, setPage] = useState(0);
    // Novos filtros avançados
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    const [inStockOnly, setInStockOnly] = useState(false);
    const [hasDiscountOnly, setHasDiscountOnly] = useState(false);
    const [minRating, setMinRating] = useState(0);
    const { showToast } = useToast();

    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadingRef = useRef<HTMLDivElement | null>(null);

    // Função para buscar produtos com paginação
    const fetchProducts = useCallback(async (pageNum: number, isLoadMore = false) => {
        try {
            let queryBuilder = supabase
                .from('produtos')
                .select('*')
                .range(pageNum * PRODUCTS_PER_PAGE, (pageNum + 1) * PRODUCTS_PER_PAGE - 1);

            // Aplicar filtros de busca se houver query
            if (query.trim()) {
                const searchTerm = query.toLowerCase();
                queryBuilder = queryBuilder.or(`nome.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);
            }

            // Aplicar filtro de categoria
            if (selectedCategory) {
                queryBuilder = queryBuilder.eq('categoria_id', selectedCategory);
            }

            // Aplicar filtro de preço
            if (priceRange[0] > 0 || priceRange[1] < 10000) {
                queryBuilder = queryBuilder.or(
                    `preco_promocional.gte.${priceRange[0]},preco_promocional.lte.${priceRange[1]},preco.gte.${priceRange[0]},preco.lte.${priceRange[1]}`
                );
            }

            // Aplicar filtro de estoque
            if (inStockOnly) {
                queryBuilder = queryBuilder.eq('em_estoque', true);
            }

            // Aplicar filtro de promoção
            if (hasDiscountOnly) {
                queryBuilder = queryBuilder.not('preco_promocional', 'is', null);
            }

            // Aplicar ordenação
            if (sortType === 'menor-preco') {
                queryBuilder = queryBuilder.order('preco_promocional', { ascending: true, nullsFirst: false })
                    .order('preco', { ascending: true });
            } else if (sortType === 'maior-preco') {
                queryBuilder = queryBuilder.order('preco_promocional', { ascending: false, nullsFirst: false })
                    .order('preco', { ascending: false });
            } else if (sortType === 'az') {
                queryBuilder = queryBuilder.order('nome', { ascending: true });
            } else if (sortType === 'za') {
                queryBuilder = queryBuilder.order('nome', { ascending: false });
            } else {
                queryBuilder = queryBuilder.order('created_at', { ascending: false });
            }

            const { data, error } = await queryBuilder;

            if (error) throw error;

            if (data) {
                if (isLoadMore) {
                    setProducts(prev => [...prev, ...data]);
                } else {
                    setProducts(data);
                    if (!isLoadMore && pageNum === 0) {
                        trackSearchQuery(query, data.length);
                    }
                }

                // Verificar se há mais produtos
                setHasMore(data.length === PRODUCTS_PER_PAGE);
            } else {
                if (!isLoadMore) {
                    setProducts([]);
                }
                setHasMore(false);
            }
        } catch (error) {
            console.error('Search error:', error);
            showToast('Erro ao buscar produtos', 'error');
            setHasMore(false);
        }
    }, [query, selectedCategory, sortType, priceRange, inStockOnly, hasDiscountOnly, showToast]);

    // Carregar categorias
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const { data: categoriesData } = await supabase
                    .from('categorias')
                    .select('*')
                    .order('nome');
                setCategories(categoriesData || []);
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };

        loadCategories();
    }, []);

    // Carregar produtos iniciais
    useEffect(() => {
        setPage(0);
        setProducts([]);
        setHasMore(true);
        setLoading(true);

        fetchProducts(0, false).finally(() => {
            setLoading(false);
        });
    }, [query, selectedCategory, sortType, fetchProducts]);

    // Infinite scroll observer
    useEffect(() => {
        if (loading || loadingMore) return;

        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    setLoadingMore(true);
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchProducts(nextPage, true).finally(() => {
                        setLoadingMore(false);
                    });
                }
            },
            { threshold: 0.1 }
        );

        if (loadingRef.current) {
            observerRef.current.observe(loadingRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [loading, loadingMore, hasMore, page, fetchProducts]);

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

    // Filtro local adicional (fallback para busca por texto)
    const filteredProducts = products.filter(product => {
        if (!searchTerm.trim()) return true;

        const term = normalizeString(searchTerm);
        const matchSearch =
            normalizeString(product.nome).includes(term) ||
            normalizeString(product.descricao).includes(term) ||
            (product.tags && normalizeString(product.tags.join(' ')).includes(term));

        return matchSearch;
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
                            priceRange={priceRange}
                            setPriceRange={setPriceRange}
                            inStockOnly={inStockOnly}
                            setInStockOnly={setInStockOnly}
                            hasDiscountOnly={hasDiscountOnly}
                            setHasDiscountOnly={setHasDiscountOnly}
                            minRating={minRating}
                            setMinRating={setMinRating}
                        />

                        <div style={{ marginTop: '30px', marginBottom: '20px', color: '#888' }}>
                            Encontrados <strong style={{ color: 'var(--cor-destaque)' }}>{filteredProducts.length}</strong> produtos
                            {hasMore && <span> (carregando mais...)</span>}
                        </div>

                        <ProductGrid
                            products={filteredProducts}
                            loading={loading}
                            diasNovo={7}
                            onQuickView={() => {}}
                        />

                        {/* Infinite Scroll Loading Indicator */}
                        <div
                            ref={loadingRef}
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '40px',
                                minHeight: '100px'
                            }}
                        >
                            {loadingMore ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '15px',
                                    color: '#888'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        border: '3px solid #333',
                                        borderTop: '3px solid var(--cor-destaque)',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    <p>Carregando mais produtos...</p>
                                </div>
                            ) : hasMore ? (
                                <p style={{ color: '#666' }}>
                                    Role para baixo para ver mais produtos
                                </p>
                            ) : (
                                <p style={{ color: '#666' }}>
                                    Você viu todos os produtos disponíveis
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    );
}
