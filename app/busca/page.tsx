'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
const STOP_WORDS = ['de', 'da', 'do', 'e', 'para', 'com', 'em', 'um', 'uma', 'os', 'as'];

const normalizeString = (str: string) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const getEffectivePrice = (p: Product) => {
    if (p.preco_promocional && p.preco_promocional > 0 && p.preco_promocional < p.preco) {
        return p.preco_promocional;
    }
    return p.preco;
};

const matchesSearchTerm = (product: Product, term: string): boolean => {
    if (!term.trim()) return true;

    const termNorm = normalizeString(term);
    const tokens = termNorm
        .split(/\s+/)
        .filter(t => t.length > 0 && !STOP_WORDS.includes(t));

    const nome = normalizeString(product.nome);
    const desc = normalizeString(product.descricao || '');
    const tags = Array.isArray(product.tags) ? product.tags.map(normalizeString).join(' ') : '';
    const combined = `${nome} ${desc} ${tags}`;

    if (combined.includes(termNorm)) return true;
    return tokens.length > 0 && tokens.every(token => combined.includes(token));
};

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
    const [rawProducts, setRawProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [sortType, setSortType] = useState('padrao');
    const [searchTerm, setSearchTerm] = useState(query);
    const [page, setPage] = useState(0);
    // Novos filtros avançados
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    const [inStockOnly, setInStockOnly] = useState(false);
    const [hasDiscountOnly, setHasDiscountOnly] = useState(false);
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
    const { showToast } = useToast();

    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadingRef = useRef<HTMLDivElement | null>(null);
    const allMatchedProductsRef = useRef<Product[]>([]);
    const lastTrackedQueryRef = useRef<string>('');

    // Sincroniza o campo local quando o parâmetro ?q= da URL muda
    useEffect(() => {
        setSearchTerm(query);
    }, [query]);

    // Função para buscar produtos com filtros estruturais (categoria, estoque, promoção)
    const fetchProducts = useCallback(async () => {
        try {
            let queryBuilder = supabase
                .from('produtos')
                .select('id, nome, preco, preco_promocional, preco_pix, descricao, imagens, media_urls, em_estoque, categoria_id, created_at, tags, slug, variants')
                .limit(1000);

            if (selectedCategory) {
                queryBuilder = queryBuilder.eq('categoria_id', selectedCategory);
            }

            if (inStockOnly) {
                queryBuilder = queryBuilder.eq('em_estoque', true);
            }

            if (hasDiscountOnly) {
                queryBuilder = queryBuilder.not('preco_promocional', 'is', null);
            }

            const { data, error } = await queryBuilder;
            if (error) throw error;

            const resultList: Product[] = (data as unknown as Product[]) || [];
            setRawProducts(resultList);

            if (query.trim() && lastTrackedQueryRef.current !== query.trim()) {
                lastTrackedQueryRef.current = query.trim();
                const initialMatches = resultList.filter(p => matchesSearchTerm(p, query));
                trackSearchQuery(query, initialMatches.length);
            }
        } catch (error) {
            console.error('Search error:', error);
            showToast('Erro ao buscar produtos', 'error');
            setRawProducts([]);
        }
    }, [query, selectedCategory, inStockOnly, hasDiscountOnly, showToast]);

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

    // Carregar produtos iniciais e ao mudar filtros estruturais
    useEffect(() => {
        setLoading(true);
        fetchProducts().finally(() => {
            setLoading(false);
        });
    }, [fetchProducts]);

    // Reseta paginação quando qualquer critério de busca/filtro/ordenação muda
    useEffect(() => {
        setPage(0);
    }, [searchTerm, query, selectedCategory, sortType, priceRange, inStockOnly, hasDiscountOnly]);

    // Filtra e ordena contra todo o conjunto carregado (não apenas a página atual)
    const allMatchedProducts = useMemo(() => {
        let resultList = rawProducts;

        if (searchTerm.trim()) {
            resultList = resultList.filter(product => matchesSearchTerm(product, searchTerm));
        }

        if (priceRange[0] > 0 || priceRange[1] < 10000) {
            resultList = resultList.filter(p => {
                const price = getEffectivePrice(p);
                return price >= priceRange[0] && price <= priceRange[1];
            });
        }

        const sorted = [...resultList];
        if (sortType === 'menor-preco') {
            sorted.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
        } else if (sortType === 'maior-preco') {
            sorted.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
        } else if (sortType === 'az') {
            sorted.sort((a, b) => a.nome.localeCompare(b.nome));
        } else if (sortType === 'za') {
            sorted.sort((a, b) => b.nome.localeCompare(a.nome));
        } else {
            sorted.sort((a, b) => {
                const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA);
            });
        }

        return sorted;
    }, [rawProducts, searchTerm, priceRange, sortType]);

    useEffect(() => {
        allMatchedProductsRef.current = allMatchedProducts;
    }, [allMatchedProducts]);

    const visibleProducts = useMemo(() => {
        const visibleCount = (page + 1) * PRODUCTS_PER_PAGE;
        return allMatchedProducts.slice(0, visibleCount);
    }, [allMatchedProducts, page]);

    const hasMore = allMatchedProducts.length > visibleProducts.length;

    // Infinite scroll observer
    useEffect(() => {
        if (loading || !hasMore) return;

        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage(prev => prev + 1);
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
    }, [loading, hasMore]);

    return (
        <main style={{ minHeight: '60vh', padding: '20px 0' }}>
            <div className="container">
                <h1 style={{
                    fontFamily: 'var(--fonte-titulos)',
                    fontSize: '2.5rem',
                    marginBottom: '30px',
                    color: 'var(--cor-destaque)'
                }}>
                    {searchTerm.trim() ? `Resultados para "${searchTerm.trim()}"` : 'Busca de Produtos'}
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
                />

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        <p>Buscando produtos...</p>
                    </div>
                ) : visibleProducts.length === 0 ? (
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
                            products={visibleProducts.map(product => ({
                                id: product.id,
                                nome: product.nome,
                                descricao: product.descricao,
                                preco: product.preco,
                                preco_promocional: product.preco_promocional,
                                em_estoque: product.em_estoque,
                                imagens: product.imagens,
                                media_urls: product.media_urls,
                                slug: product.slug,
                                created_at: product.created_at
                            }))}
                            pageUrl={buildCanonicalUrl(`/busca?q=${encodeURIComponent(query || '')}`)}
                            name={`Resultados de Busca: ${query || 'Produtos'} | Gringa Style`}
                        />

                        <div style={{ marginTop: '30px', marginBottom: '20px', color: '#888' }}>
                            Encontrados <strong style={{ color: 'var(--cor-destaque)' }}>{allMatchedProducts.length}</strong> produtos
                            {hasMore && <span> (role para ver mais)</span>}
                        </div>

                        <ProductGrid
                            products={visibleProducts}
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
                            {hasMore ? (
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
