import { Category } from '@/types';
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProductFiltersProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedCategory: number | null;
    setSelectedCategory: (id: number | null) => void;
    sortType: string;
    setSortType: (type: string) => void;
    categories: Category[];
    // Novos filtros avançados
    priceRange?: [number, number];
    setPriceRange?: (range: [number, number]) => void;
    inStockOnly?: boolean;
    setInStockOnly?: (inStock: boolean) => void;
    hasDiscountOnly?: boolean;
    setHasDiscountOnly?: (hasDiscount: boolean) => void;
    minRating?: number;
    setMinRating?: (rating: number) => void;
    onResetFilters?: () => void;
}

export default function ProductFilters({
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    sortType,
    setSortType,
    categories,
    priceRange = [0, 10000],
    setPriceRange,
    inStockOnly = false,
    setInStockOnly,
    hasDiscountOnly = false,
    setHasDiscountOnly,
    minRating = 0,
    setMinRating,
    onResetFilters
}: ProductFiltersProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    useEffect(() => {
        const updateMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        updateMobile();
        window.addEventListener('resize', updateMobile);
        return () => window.removeEventListener('resize', updateMobile);
    }, []);

    const sortOptions = [
        { value: 'padrao', label: 'Mais Recentes' },
        { value: 'menor-preco', label: 'Menor Preço' },
        { value: 'maior-preco', label: 'Maior Preço' },
        { value: 'az', label: 'A-Z' },
        { value: 'za', label: 'Z-A' }
    ];

    return (
        <div className="search-container" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid #2a2a2a',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)'
        }}>
            <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
                        <label htmlFor="search-input" className="sr-only">Buscar produtos</label>
                        <input
                            type="search"
                            id="search-input"
                            placeholder="Buscar por máscara, tocha, lente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                height: '44px',
                                padding: '0 42px 0 14px',
                                backgroundColor: '#171717',
                                border: '1px solid #333',
                                borderRadius: '10px',
                                color: '#fff',
                                fontSize: '0.95rem'
                            }}
                        />
                        {searchTerm && (
                            <button
                                className="search-clear-btn"
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#888',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                                onClick={() => setSearchTerm('')}
                                aria-label="Limpar busca"
                            >
                                <X size={18} />
                            </button>
                        )}
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#666'
                            }}
                        />
                    </div>

                    {onResetFilters && (
                        <button
                            type="button"
                            onClick={onResetFilters}
                            style={{
                                padding: '10px 12px',
                                backgroundColor: 'transparent',
                                border: '1px solid #444',
                                color: '#ddd',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <RotateCcw size={15} />
                            Limpar
                        </button>
                    )}
                </div>

                {isMobile && (
                    <button
                        type="button"
                        onClick={() => setShowMobileFilters(prev => !prev)}
                        className="filter-toggle-button"
                        style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #555',
                            color: '#ccc',
                            padding: '9px 12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            fontSize: '0.9rem'
                        }}
                    >
                        {showMobileFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                        {showMobileFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                )}

                <div style={{
                    display: isMobile ? (showMobileFilters ? 'grid' : 'none') : 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
                    gap: '10px',
                    alignItems: 'stretch'
                }}>
                    <div>
                        <label htmlFor="categoria-select" className="sr-only">Filtrar por Categoria</label>
                        <select
                            id="categoria-select"
                            value={selectedCategory || ''}
                            onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                backgroundColor: '#171717',
                                border: '1px solid #333',
                                borderRadius: '10px',
                                color: '#fff',
                                fontSize: '0.9rem'
                            }}
                        >
                            <option value="">Todas as Categorias</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="sort-select" className="sr-only">Ordenar por</label>
                        <select
                            id="sort-select"
                            value={sortType}
                            onChange={(e) => setSortType(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                backgroundColor: '#171717',
                                border: '1px solid #333',
                                borderRadius: '10px',
                                color: '#fff',
                                fontSize: '0.9rem'
                            }}
                        >
                            {sortOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        alignItems: 'center',
                        padding: '10px 12px',
                        backgroundColor: '#171717',
                        border: '1px solid #2a2a2a',
                        borderRadius: '10px',
                        minHeight: '44px'
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ccc', fontSize: '0.82rem' }}>
                            <input
                                type="checkbox"
                                checked={inStockOnly}
                                onChange={(e) => setInStockOnly?.(e.target.checked)}
                            />
                            Estoque
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ccc', fontSize: '0.82rem' }}>
                            <input
                                type="checkbox"
                                checked={hasDiscountOnly}
                                onChange={(e) => setHasDiscountOnly?.(e.target.checked)}
                            />
                            Desconto
                        </label>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ccc', fontSize: '0.82rem' }}>
                            <SlidersHorizontal size={14} />
                            <span>Até R$ {priceRange[1].toLocaleString('pt-BR')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
