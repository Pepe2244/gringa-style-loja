import { Category } from '@/types';
import { Search, X } from 'lucide-react';

interface ProductFiltersProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedCategory: number | null;
    setSelectedCategory: (id: number | null) => void;
    sortType: string;
    setSortType: (type: string) => void;
    categories: Category[];
}

export default function ProductFilters({
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    sortType,
    setSortType,
    categories
}: ProductFiltersProps) {
    return (
        <div className="search-container">
            <div style={{ position: 'relative', flex: 1 }}>
                <input
                    type="search"
                    id="search-input"
                    placeholder="Buscar por máscara, tocha, lente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button
                        className="search-clear-btn"
                        style={{ display: 'block' }}
                        onClick={() => setSearchTerm('')}
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <select
                id="categoria-select"
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                style={{ padding: '10px', borderRadius: '25px', border: 'none', background: '#333', color: 'white', marginLeft: '10px', cursor: 'pointer' }}
            >
                <option value="">Todas as Categorias</option>
                {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
            </select>

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
