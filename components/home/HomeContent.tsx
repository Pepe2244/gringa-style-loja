'use client';

import { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import { useToast } from '@/context/ToastContext';
import ProductFilters from '@/components/home/ProductFilters';
import ProductGrid from '@/components/home/ProductGrid';
import ProductDetailsModal from '@/components/modals/ProductDetailsModal';
import DirectPurchaseModal from '@/components/modals/DirectPurchaseModal';

interface HomeContentProps {
    initialProducts: Product[];
    categories: Category[];
    diasNovo: number;
}

export default function HomeContent({ initialProducts, categories, diasNovo }: HomeContentProps) {
    const { showToast } = useToast();
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [sortType, setSortType] = useState('padrao');

    // Modals State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<{ tipo: string; opcao: string } | null>(null);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, selectedCategory, sortType, products]);

    const getPrecoFinal = (p: Product) => {
        if (!p.preco_promocional || p.preco_promocional >= p.preco) {
            return p.preco;
        }
        return p.preco_promocional;
    };

    const applyFilters = () => {
        let result = products.filter(product => {
            const term = searchTerm.toLowerCase().trim();
            const matchSearch =
                product.nome.toLowerCase().includes(term) ||
                product.descricao.toLowerCase().includes(term) ||
                (product.tags && product.tags.join(' ').toLowerCase().includes(term));

            const matchCategory = selectedCategory ? product.categoria_id === selectedCategory : true;

            return matchSearch && matchCategory;
        });

        // Sorting
        if (sortType === 'menor-preco') {
            result.sort((a, b) => getPrecoFinal(a) - getPrecoFinal(b));
        } else if (sortType === 'maior-preco') {
            result.sort((a, b) => getPrecoFinal(b) - getPrecoFinal(a));
        } else if (sortType === 'az') {
            result.sort((a, b) => a.nome.localeCompare(b.nome));
        } else if (sortType === 'za') {
            result.sort((a, b) => b.nome.localeCompare(a.nome));
        } else {
            // Default: Newest first logic
            const limitDate = new Date();
            limitDate.setDate(limitDate.getDate() - diasNovo);

            result.sort((a, b) => {
                const aNew = a.created_at && new Date(a.created_at) > limitDate;
                const bNew = b.created_at && new Date(b.created_at) > limitDate;

                if (aNew && !bNew) return -1;
                if (!aNew && bNew) return 1;
                return a.nome.localeCompare(b.nome);
            });
        }

        setFilteredProducts(result);
    };

    const handleQuickView = (product: Product) => {
        setSelectedProduct(product);
        setSelectedVariant(null);

        if (product.variants) {
            setIsDetailsModalOpen(true);
        } else {
            setIsPurchaseModalOpen(true);
        }
    };

    const addToCart = (product: Product, variant: { tipo: string; opcao: string } | null) => {
        const carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
        const itemIndex = carrinho.findIndex((item: any) =>
            item.produto_id === product.id &&
            JSON.stringify(item.variante) === JSON.stringify(variant)
        );

        if (itemIndex > -1) {
            carrinho[itemIndex].quantidade++;
        } else {
            carrinho.push({
                produto_id: product.id,
                quantidade: 1,
                variante: variant
            });
        }

        localStorage.setItem('carrinho', JSON.stringify(carrinho));
        window.dispatchEvent(new Event('cart-updated'));
        setIsDetailsModalOpen(false);
        showToast('Produto adicionado ao carrinho!', 'success');
    };

    const handleBuyNowFromModal = (product: Product, variant: { tipo: string; opcao: string } | null) => {
        setSelectedProduct(product);
        setSelectedVariant(variant);
        setIsDetailsModalOpen(false);
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
                    Pronto para elevar o nível da sua solda? Fale conosco pelo WhatsApp para um atendimento rápido.
                    Entregamos para todo o Brasil.
                </p>
            </section>

            <ProductDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                product={selectedProduct}
                addToCart={addToCart}
                onBuyNow={handleBuyNowFromModal}
            />

            <DirectPurchaseModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
                product={selectedProduct}
                variant={selectedVariant}
            />
        </div>
    );
}
