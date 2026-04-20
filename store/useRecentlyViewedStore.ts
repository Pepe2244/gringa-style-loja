import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/types';

interface RecentlyViewedItem extends Product {
    viewedAt: number; // timestamp
}

export interface RecentlyViewedState {
    items: RecentlyViewedItem[];
    addView: (product: Product) => void;
    getRecent: (limit?: number) => RecentlyViewedItem[];
    clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
    persist(
        (set, get) => ({
            items: [],
            addView: (product: Product) => set((state) => {
                // Remove se já existe
                const filtered = state.items.filter(item => item.id !== product.id);
                // Adiciona no início com timestamp
                const newItem: RecentlyViewedItem = {
                    ...product,
                    viewedAt: Date.now()
                };
                // Mantém apenas os últimos 20
                const updated = [newItem, ...filtered].slice(0, 20);
                return { items: updated };
            }),
            getRecent: (limit = 5) => {
                return get().items.slice(0, limit);
            },
            clear: () => set({ items: [] })
        }),
        {
            name: 'recently-viewed-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
