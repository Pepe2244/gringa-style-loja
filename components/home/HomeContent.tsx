'use client';

import { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import ProductFilters from '@/components/home/ProductFilters';
import ProductGrid from '@/components/home/ProductGrid';
import DirectPurchaseModal from '@/components/modals/DirectPurchaseModal';
import { FAQSchema } from '@/components/SEO/StructuredData';

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

            <section id="faq" className="secao-info" style={{ marginTop: '40px', padding: '20px', backgroundColor: '#111', borderRadius: '10px' }}>
                <FAQSchema questions={[
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
                ]} />
                <h2 className="titulo-secao" style={{ marginBottom: '15px' }}>Dúvidas Frequentes (FAQ)</h2>
                
                <details style={{ marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                    <summary style={{ color: 'var(--cor-destaque)', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '10px' }}>›</span> A lente escura da máscara é substituível?
                    </summary>
                    <p style={{ color: '#ccc', lineHeight: '1.5', marginTop: '10px', paddingLeft: '20px' }}>Sim, a lente escura (passiva) das nossas máscaras Gringa Style pode ser facilmente removida e substituída, garantindo conveniência e durabilidade para a sua máscara na hora da manutenção.</p>
                </details>
                
                <details style={{ marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                    <summary style={{ color: 'var(--cor-destaque)', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '10px' }}>›</span> Vocês enviam para todo o Brasil?
                    </summary>
                    <p style={{ color: '#ccc', lineHeight: '1.5', marginTop: '10px', paddingLeft: '20px' }}>Com certeza! Enviamos via Correios (PAC e Sedex) para todas as regiões do Brasil. O cálculo do frete pode ser feito diretamente no carrinho de compras informando o seu CEP.</p>
                </details>
                
                <details style={{ paddingBottom: '10px' }}>
                    <summary style={{ color: 'var(--cor-destaque)', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '10px' }}>›</span> Como funcionam as opções de pagamento?
                    </summary>
                    <p style={{ color: '#ccc', lineHeight: '1.5', marginTop: '10px', paddingLeft: '20px' }}>Aceitamos pagamento seguro via PIX (com aprovação imediata) ou Cartão de Crédito em até 12x. Toda a finalização pode ser acompanhada pelo nosso atendimento VIP no WhatsApp.</p>
                </details>
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

