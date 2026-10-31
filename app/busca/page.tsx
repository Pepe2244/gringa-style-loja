'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types';
import ProductGrid from '@/components/home/ProductGrid';
import DirectPurchaseModal from '@/components/modals/DirectPurchaseModal';
import { useToast } from '@/context/ToastContext';
import ProductFilters from '@/components/home/ProductFilters';
import { trackSearchQuery } from '@/utils/analytics';
import { ItemListSchema, WebPageSchema } from '@/components/SEO/StructuredData';
import { buildCanonicalUrl } from '@/lib/site-config';

const PRODUCTS_PER_PAGE = 12;

export default function SearchPage() {
    return (
        <Suspense fallback={
            <main className="container" style={{ padding: '48px 0', textAlign: 'center' }}>
                <h1 style={{ fontFamily: 'var(--fonte-titulos)', fontSize: '2.5rem', marginBottom: '20px', color: 'var(--cor-destaque)' }}>
                    Busca de Produtos
                </h1>
                <p style={{ color: '#888' }}>Carregando busca...</p>
            <DirectPurchaseModal
                isOpen={false}
                onClose={() => {}}
                product={null}
            />
        </main>
        }>
            <SearchPageContent />
        </Suspense>
    );
}

function SearchPageContent() {
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
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
    const { showToast } = useToast();

    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadingRef = useRef<HTMLDivElement | null>(null);

    const normalizeString = (str: string) => {
        if (!str) return '';
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    };

    // Função para buscar produtos com paginação e normalização de acentos
    const fetchProducts = useCallback(async (pageNum: number, isLoadMore = false) => {
        try {
            let queryBuilder = supabase
                .from('produtos')
                .select('id, nome, preco, preco_promocional, preco_pix, descricao, imagens, media_urls, em_estoque, categoria_id, created_at, tags, slug, variants')
                .limit(1000);

            // Aplicar filtro de categoria
            if (selectedCategory) {
                queryBuilder = queryBuilder.eq('categoria_id', selectedCategory);
            }

            // Aplicar filtro de estoque
            if (inStockOnly) {
                queryBuilder = queryBuilder.eq('em_estoque', true);
            }

            // Aplicar filtro de promoção
            if (hasDiscountOnly) {
                queryBuilder = queryBuilder.not('preco_promocional', 'is', null);
            }

            // Busca produtos com filtros estruturais (categoria, estoque, promoção)
            const { data, error } = await queryBuilder;
            if (error) throw error;

            let resultList: Product[] = (data as unknown as Product[]) || [];

            // Se houver query, aplica busca inteligente (accent-folding e tokenização)
            if (query.trim()) {
                const termNorm = normalizeString(query);
                const stopWords = ['de', 'da', 'do', 'e', 'para', 'com', 'em', 'um', 'uma', 'os', 'as'];
                const tokens = termNorm
                    .split(/\s+/)
                    .filter(t => t.length > 0 && !stopWords.includes(t));

                resultList = resultList.filter(product => {
                    const nome = normalizeString(product.nome);
                    const desc = normalizeString(product.descricao);
                    const tags = Array.isArray(product.tags) ? product.tags.map(normalizeString).join(' ') : '';
                    const combined = `${nome} ${desc} ${tags}`;

                    if (combined.includes(termNorm)) return true;
                    return tokens.length > 0 && tokens.every(token => combined.includes(token));
                });
            }

            // Filtro de faixa de preço determinístico por preço efetivo
            if (priceRange[0] > 0 || priceRange[1] < 10000) {
                resultList = resultList.filter(p => {
                    const price = p.preco_promocional && p.preco_promocional > 0 && p.preco_promocional < p.preco 
                        ? p.preco_promocional 
                        : p.preco;
                    return price >= priceRange[0] && price <= priceRange[1];
                });
            }

            // Ordenação determinística por preço efetivo / relevância
            if (sortType === 'menor-preco') {
                resultList.sort((a, b) => {
                    const pa = a.preco_promocional && a.preco_promocional > 0 && a.preco_promocional < a.preco ? a.preco_promocional : a.preco;
                    const pb = b.preco_promocional && b.preco_promocional > 0 && b.preco_promocional < b.preco ? b.preco_promocional : b.preco;
                    return pa - pb;
                });
            } else if (sortType === 'maior-preco') {
                resultList.sort((a, b) => {
                    const pa = a.preco_promocional && a.preco_promocional > 0 && a.preco_promocional < a.preco ? a.preco_promocional : a.preco;
                    const pb = b.preco_promocional && b.preco_promocional > 0 && b.preco_promocional < b.preco ? b.preco_promocional : b.preco;
                    return pb - pa;
                });
            } else if (sortType === 'az') {
                resultList.sort((a, b) => a.nome.localeCompare(b.nome));
            } else if (sortType === 'za') {
                resultList.sort((a, b) => b.nome.localeCompare(a.nome));
            } else {
                resultList.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
            }

            const visibleCount = (pageNum + 1) * PRODUCTS_PER_PAGE;
            const pagedSlice = resultList.slice(0, visibleCount);

            setProducts(pagedSlice);
            setHasMore(resultList.length > visibleCount);

            if (!isLoadMore && pageNum === 0 && query.trim()) {
                trackSearchQuery(query, resultList.length);
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

    const getPrecoFinal = (p: Product) => {
        if (!p.preco_promocional || p.preco_promocional >= p.preco) {
            return p.preco;
        }
        return p.preco_promocional;
    };

    // Filtro local adicional com suporte a múltiplos termos
    const filteredProducts = products.filter(product => {
        if (!searchTerm.trim()) return true;

        const term = normalizeString(searchTerm);
        const nome = normalizeString(product.nome);
        const desc = normalizeString(product.descricao);
        const tags = Array.isArray(product.tags) ? product.tags.map(normalizeString).join(' ') : '';
        const combined = `${nome} ${desc} ${tags}`;

        if (combined.includes(term)) return true;
        const tokens = term.split(/\s+/).filter(t => t.length > 0 && !['de', 'da', 'do', 'e', 'para', 'com'].includes(t));
        return tokens.length > 0 && tokens.every(token => combined.includes(token));
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
                    Resultados para &quot;{query}&quot;
                </h1>

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
                        border: '1px solid #222',
                        marginTop: '30px'
                    }}>
                        <h2 style={{ color: '#888', marginBottom: '15px' }}>Nenhum produto encontrado</h2>
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            Tente refinar sua busca ou ajuste os filtros acima
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedCategory(null);
                                setPriceRange([0, 10000]);
                                setInStockOnly(false);
                                setHasDiscountOnly(false);
                            }}
                            className="btn btn-secundario"
                            style={{ display: 'inline-block', padding: '10px 20px', margin: '0 5px' }}
                        >
                            Limpar Filtros
                        </button>
                        <Link
                            href="/loja"
                            style={{
                                display: 'inline-block',
                                padding: '12px 30px',
                                background: 'var(--cor-destaque)',
                                color: 'black',
                                textDecoration: 'none',
                                borderRadius: '999px',
                                fontWeight: 'bold',
                                margin: '0 5px'
                            }}
                        >
                            Ver Todos os Produtos
                        </Link>
                    </div>
                ) : (
                    <>

                        <WebPageSchema page={{
                            name: 'Resultados de Busca | Gringa Style',
                            description: `Página de resultados de busca para ${query || 'produtos Gringa Style'}`,
                            url: buildCanonicalUrl(`/busca?q=${encodeURIComponent(query || '')}`)
                        }} />
                        <ItemListSchema
                            products={filteredProducts.map(product => ({
                                id: product.id,
                                nome: product.nome,
                                descricao: product.descricao,
                                preco: product.preco,
                                preco_promocional: product.preco_promocional,
                                em_estoque: product.em_estoque,
                                imagens: product.imagens,
                                media_urls: product.media_urls,
                                slug: product.slug
                            }))}
                            pageUrl={buildCanonicalUrl(`/busca?q=${encodeURIComponent(query || '')}`)}
                            name={`Resultados de Busca: ${query || 'Produtos'} | Gringa Style`}
                        />

                        <div style={{ marginTop: '30px', marginBottom: '20px', color: '#888' }}>
                            Encontrados <strong style={{ color: 'var(--cor-destaque)' }}>{filteredProducts.length}</strong> produtos
                            {hasMore && <span> (carregando mais...)</span>}
                        </div>

                        <ProductGrid
                            products={filteredProducts}
                            loading={loading}
                            diasNovo={7}
                            onQuickView={(prod) => setQuickViewProduct(prod)}
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
            <DirectPurchaseModal
                isOpen={!!quickViewProduct}
                onClose={() => setQuickViewProduct(null)}
                product={quickViewProduct}
            />
        </main>
    );
}
