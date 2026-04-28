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
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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

            {/* Toggle Filtros Avançados */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #555',
                        color: '#ccc',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        margin: '0 auto',
                        fontSize: '0.9rem'
                    }}
                >
                    <Filter size={16} />
                    Filtros Avançados
                    {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {/* Filtros Avançados */}
            {showAdvancedFilters && (
                <div style={{
                    borderTop: '1px solid #333',
                    paddingTop: '20px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px'
                }}>
                    {/* Filtro de Preço */}
                    {setPriceRange && (
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#ccc',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                marginBottom: '10px'
                            }}>
                                Faixa de Preço
                            </label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={priceRange[0]}
                                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                />
                                <span style={{ color: '#666' }}>até</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Filtro de Disponibilidade */}
                    {setInStockOnly && (
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#ccc',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={inStockOnly}
                                    onChange={(e) => setInStockOnly(e.target.checked)}
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        accentColor: 'var(--cor-destaque)'
                                    }}
                                />
                                Apenas em Estoque
                            </label>
                        </div>
                    )}

                    {/* Filtro de Promoção */}
                    {setHasDiscountOnly && (
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#ccc',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={hasDiscountOnly}
                                    onChange={(e) => setHasDiscountOnly(e.target.checked)}
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        accentColor: 'var(--cor-destaque)'
                                    }}
                                />
                                Apenas em Promoção
                            </label>
                        </div>
                    )}

                    {/* Filtro de Avaliação (placeholder para futuro) */}
                    {setMinRating && (
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#ccc',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                marginBottom: '10px'
                            }}>
                                Avaliação Mínima
                            </label>
                            <select
                                value={minRating}
                                onChange={(e) => setMinRating(Number(e.target.value))}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #333',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <option value={0}>Todas</option>
                                <option value={3}>3+ estrelas</option>
                                <option value={4}>4+ estrelas</option>
                                <option value={5}>5 estrelas</option>
                            </select>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
                style={{ padding: '10px', borderRadius: '25px', border: 'none', background: '#333', color: 'white', marginLeft: '10px', cursor: 'pointer' }}
            >
                <option value="">Todas as Categorias</option>
                {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
            </select>

            <label htmlFor="sort-select" className="sr-only">Ordenar por</label>
            <select
                id="sort-select"
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
                style={{ padding: '10px', borderRadius: '25px', border: 'none', background: '#333', color: 'white', marginLeft: '10px', cursor: 'pointer' }}
            >
                <option value="padrao">Ordenar por</option>
                <option value="menor-preco">Menor Preço</option>
                <option value="maior-preco">Maior Preço</option>
                <option value="az">Nome (A-Z)</option>
                <option value="za">Nome (Z-A)</option>
            </select>
        </div>
    );
}
