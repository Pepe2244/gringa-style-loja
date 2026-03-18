'use client';

import { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import ProductFilters from '@/components/home/ProductFilters';
import ProductGrid from '@/components/home/ProductGrid';
import DirectPurchaseModal from '@/components/modals/DirectPurchaseModal';

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
            let query = supabase
                .from('produtos')
                .select('id, nome, preco, preco_promocional, imagens, video, em_estoque, categoria_id, created_at, descricao, tags, variants, slug, media_urls, produtos_relacionados_ids')
                .order('created_at', { ascending: false })
                .range(from, to);

            const { data, error } = await query;
            
            if (error) throw error;
            
            if (data && data.length > 0) {
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

    const handleQuickView = (product: Product) => {
        setSelectedProduct(product);
        setSelectedVariant(null);
        setIsPurchaseModalOpen(true);
    };

    return (
        <div className="container">
            <h1 className="titulo-secao">Nossos Produtos</h1>

            <ProductFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                sortType={sortType}
                setSortType={setSortType}
                categories={categories}
            />

            <ProductGrid
                products={filteredProducts}
                loading={false}
                diasNovo={diasNovo}
                onQuickView={handleQuickView}
                hasMore={hasMore && searchTerm === '' && selectedCategory === null} // Only show Load More if not filtering aggressively
                loadingMore={loadingMore}
                onLoadMore={handleLoadMore}
            />

            <section id="sobre" className="secao-info">
                <h2 className="titulo-secao">Sobre a Gringa Style</h2>
                <p>
                    Somos especializados em equipamentos para solda TIG. A Gringa Style oferece máscaras de solda
                    personalizadas, tochas TIG profissionais e lentes de alta performance.
                    Nossos produtos unem estilo único e proteção máxima para o soldador moderno.
                </p>
            </section>

            <section id="contato" className="secao-info">
                <h2 className="titulo-secao">Entre em Contato</h2>
                <p>
                    Pronto para elevar o nível da sua solda? Fale connosco pelo WhatsApp para um atendimento rápido.
                    Entregamos para todo o Brasil.
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

