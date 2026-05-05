import { Category } from '@/types';
import { Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

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
    setMinRating
}: ProductFiltersProps) {
    const sortOptions = [
        { value: 'padrao', label: 'Mais Recentes' },
        { value: 'menor-preco', label: 'Menor Preço' },
        { value: 'maior-preco', label: 'Maior Preço' },
        { value: 'az', label: 'A-Z' },
        { value: 'za', label: 'Z-A' }
    ];

    return (
        <div className="search-container" style={{
            backgroundColor: '#111',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            border: '1px solid #222'
        }}>
            {/* Filtros Principais */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: '15px',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                {/* Campo de Busca */}
                <div style={{ position: 'relative', width: '100%' }}>
                    <label htmlFor="search-input" className="sr-only">Buscar produtos</label>
                    <input
                        type="search"
                        id="search-input"
                        placeholder="Buscar por máscara, tocha, lente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 45px 12px 16px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '1rem'
                        }}
                    />
                    {searchTerm && (
                        <button
                            className="search-clear-btn"
                            style={{
                                position: 'absolute',
                                right: '12px',
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
                            <X size={20} />
                        </button>
                    )}
                    <Search
                        size={20}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#666'
                        }}
                    />
                </div>

                {/* Filtro de Categoria */}
                <div>
                    <label htmlFor="categoria-select" className="sr-only">Filtrar por Categoria</label>
                    <select
                        id="categoria-select"
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                        style={{
                            padding: '12px 16px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.9rem',
                            minWidth: '180px'
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

                {/* Ordenação */}
                <div>
                    <label htmlFor="sort-select" className="sr-only">Ordenar por</label>
                    <select
                        id="sort-select"
                        value={sortType}
                        onChange={(e) => setSortType(e.target.value)}
                        style={{
                            padding: '12px 16px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.9rem',
                            minWidth: '160px'
                        }}
                    >
                        {sortOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
