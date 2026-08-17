'use client';

import { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import { TrendingUp, Package } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import ProductFilters from '@/components/home/ProductFilters';
import ProductGrid from '@/components/home/ProductGrid';
import RetentionHighlights from '@/components/home/RetentionHighlights';
import CartRecoveryBanner from '@/components/home/CartRecoveryBanner';
import PersonalizedRecommendations from '@/components/home/PersonalizedRecommendations';
import DirectPurchaseModal from '@/components/modals/DirectPurchaseModal';
import ProductFAQ from '@/components/home/ProductFAQ'; // Caminho corrigido
import { trackEvent, trackFilterUsage, trackSearchQuery } from '@/utils/analytics';
import { ItemListSchema } from '@/components/SEO/StructuredData';

interface HomeContentProps {
    initialProducts: Product[];
    categories: Category[];
    diasNovo: number;
}

export default function HomeContent({ initialProducts, categories, diasNovo }: HomeContentProps) {
    const { showToast } = useToast();
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [sortType, setSortType] = useState('padrao');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    const [inStockOnly, setInStockOnly] = useState(false);
    const [hasDiscountOnly, setHasDiscountOnly] = useState(false);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialProducts.length === 12);
    const [loadingMore, setLoadingMore] = useState(false);

    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<{ tipo: string; opcao: string } | null>(null);

    const getPrecoFinal = (p: Product) => {
        if (!p.preco_promocional || p.preco_promocional >= p.preco) {
            return p.preco;
        }
        return p.preco_promocional;
    };

    const normalizeString = (str: string) => {
        if (!str) return '';
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    };

    const handleLoadMore = async () => {
        if (loadingMore) return;
        setLoadingMore(true);
        
        const from = page * 12;
        const to = from + 11;

        try {
            const response = await fetch(`/api/produtos?from=${from}&to=${to}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || 'Erro ao carregar mais produtos');
            }

            if (Array.isArray(data) && data.length > 0) {
                setProducts(prev => [...prev, ...data]);
                setPage(prev => prev + 1);
                if (data.length < 12) setHasMore(false);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Erro ao carregar mais produtos:', error);
            showToast('Erro ao carregar mais produtos', 'error');
        } finally {
            setLoadingMore(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const term = normalizeString(debouncedSearchTerm);
        const matchSearch =
            normalizeString(product.nome).includes(term) ||
            normalizeString(product.descricao).includes(term) ||
            (product.tags && normalizeString(product.tags.join(' ')).includes(term));

        const matchCategory = selectedCategory ? product.categoria_id === selectedCategory : true;
        const matchPrice = getPrecoFinal(product) >= priceRange[0] && getPrecoFinal(product) <= priceRange[1];
        const matchStock = !inStockOnly || product.em_estoque;
        const matchDiscount = !hasDiscountOnly || (product.preco_promocional && product.preco_promocional > 0 && product.preco_promocional < product.preco);

        return matchSearch && matchCategory && matchPrice && matchStock && matchDiscount;
    }).sort((a, b) => {
        if (sortType === 'menor-preco') {
            return getPrecoFinal(a) - getPrecoFinal(b);
        } else if (sortType === 'maior-preco') {
            return getPrecoFinal(b) - getPrecoFinal(a);
        } else if (sortType === 'az') {
            return a.nome.localeCompare(b.nome);
        } else if (sortType === 'za') {
            return b.nome.localeCompare(a.nome);
        } else {
            const aHasPromo = a.preco_promocional && a.preco_promocional > 0 && a.preco_promocional < a.preco;
            const bHasPromo = b.preco_promocional && b.preco_promocional > 0 && b.preco_promocional < b.preco;

            if (aHasPromo && !bHasPromo) return -1;
            if (!aHasPromo && bHasPromo) return 1;

            const limitDate = new Date();
            limitDate.setDate(limitDate.getDate() - diasNovo);
            const aNew = a.created_at && new Date(a.created_at) > limitDate;
            const bNew = b.created_at && new Date(b.created_at) > limitDate;

            if (aNew && !bNew) return -1;
            if (!aNew && bNew) return 1;

            return a.nome.localeCompare(b.nome);
        }
    });

    const activeFilterCount = [
        searchTerm.trim() ? 1 : 0,
        selectedCategory ? 1 : 0,
        sortType !== 'padrao' ? 1 : 0,
        priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0,
        inStockOnly ? 1 : 0,
        hasDiscountOnly ? 1 : 0
    ].reduce((sum, value) => sum + value, 0);

    const hasActiveFilters = activeFilterCount > 0;
    const produtosEmEstoque = filteredProducts.filter(product => product.em_estoque).length;
    const produtosComDesconto = filteredProducts.filter(product => product.preco_promocional && product.preco_promocional > 0 && product.preco_promocional < product.preco).length;
    const featuredCategories = categories.slice(0, 6);

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCategory(null);
        setSortType('padrao');
        setPriceRange([0, 10000]);
        setInStockOnly(false);
        setHasDiscountOnly(false);
    };

    const handleQuickView = (product: Product) => {
        setSelectedProduct(product);
        setSelectedVariant(null);
        setIsPurchaseModalOpen(true);
    };

    const handleCategorySelect = (categoryId: number | null) => {
        setSelectedCategory(categoryId);
        trackEvent('category_selected', {
            category_id: categoryId,
            category_name: categoryId ? categories.find(category => category.id === categoryId)?.nome || 'unknown' : 'all'
        });
    };

    const handleSortChange = (value: string) => {
        setSortType(value);
        trackFilterUsage('sort', value);
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (value.trim()) {
            trackSearchQuery(value.trim(), products.length);
        }
    };

    return (
        <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 className="titulo-secao" style={{ marginBottom: '10px' }}>Nossos Produtos</h1>
                <p style={{ color: '#ccc', fontSize: '1.2rem', lineHeight: '1.6' }}>
                    Equipamentos de solda TIG com estilo único, conforto e proteção máxima para profissionais exigentes.
                </p>
            </div>

            <CartRecoveryBanner />

            <ProductFilters
                searchTerm={searchTerm}
                setSearchTerm={handleSearchChange}
                selectedCategory={selectedCategory}
                setSelectedCategory={handleCategorySelect}
                sortType={sortType}
                setSortType={handleSortChange}
                categories={categories}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                inStockOnly={inStockOnly}
                setInStockOnly={setInStockOnly}
                hasDiscountOnly={hasDiscountOnly}
                setHasDiscountOnly={setHasDiscountOnly}
                onResetFilters={hasActiveFilters ? resetFilters : undefined}
            />

            <RetentionHighlights diasNovo={diasNovo} onQuickView={handleQuickView} />
            <PersonalizedRecommendations products={products} diasNovo={diasNovo} onQuickView={handleQuickView} />

            <ItemListSchema products={filteredProducts.map(product => ({
                id: product.id,
                nome: product.nome,
                descricao: product.descricao,
                preco: product.preco,
                preco_promocional: product.preco_promocional,
                em_estoque: product.em_estoque,
                imagens: product.imagens,
                media_urls: product.media_urls,
                slug: product.slug
            }))} pageUrl='https://gringa-style.netlify.app/' />

            <ProductGrid
                products={filteredProducts}
                loading={products.length === 0}
                diasNovo={diasNovo}
                onQuickView={handleQuickView}
                hasMore={hasMore && searchTerm === '' && selectedCategory === null} // Only show Load More if not filtering aggressively
                loadingMore={loadingMore}
                onLoadMore={handleLoadMore}
            />

            <section id="faq" className="secao-info" style={{ marginTop: '40px', padding: '40px', backgroundColor: 'rgba(17,17,17,0.7)', borderRadius: '10px', border: '1px solid #333' }}>
                <ProductFAQ
                    faqs={[
                        {
                            q: "A lente escura da máscara é substituível?",
                            a: "Sim, a lente escura (passiva) das nossas máscaras Gringa Style pode ser facilmente removida e substituída, garantindo conveniência e durabilidade para a sua máscara na hora da manutenção."
                        },
                        {
                            q: "Vocês enviam para todo o Brasil?",
                            a: "Com certeza! Enviamos via Correios (PAC e Sedex) para todas as regiões do Brasil. O cálculo do frete pode ser feito diretamente no carrinho de compras informando o seu CEP."
                        },
                        {
                            q: "Como funcionam as opções de pagamento?",
                            a: "Aceitamos pagamento seguro via PIX (com aprovação imediata) ou Cartão de Crédito em até 12x. Toda a finalização pode ser acompanhada pelo nosso atendimento VIP no WhatsApp."
                        }
                    ]}
                />
            </section>

            <section id="contato" className="secao-info" style={{ marginTop: '20px', padding: '20px', backgroundColor: '#111', borderRadius: '10px', marginBottom: '40px' }}>
                <h2 className="titulo-secao">Entre em Contato</h2>
                <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                    Pronto para elevar o nível da sua solda? Fale conosco pelo WhatsApp para um atendimento rápido, sanar dúvidas técnicas sobre bocais e bicos, ou para encomendar sua máscara personalizada exclusiva.
                </p>
            </section>

            <DirectPurchaseModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
                product={selectedProduct}
                initialVariant={selectedVariant}
            />
        </div>
    );
}
