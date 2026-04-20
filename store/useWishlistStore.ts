import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/types';

export interface WishlistState {
    items: Product[];
    addItem: (product: Product) => void;
    removeItem: (productId: number) => void;
    isInWishlist: (productId: number) => boolean;
    totalItems: () => number;
    clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product: Product) => set((state) => {
                const exists = state.items.some(item => item.id === product.id);
                if (!exists) {
                    return { items: [...state.items, product] };
                }
                return { items: state.items };
            }),
            removeItem: (productId: number) => set((state) => ({
                items: state.items.filter(item => item.id !== productId)
            })),
            isInWishlist: (productId: number) => {
                return get().items.some(item => item.id === productId);
            },
            totalItems: () => {
                return get().items.length;
            },
            clearWishlist: () => set({ items: [] })
        }),
        {
            name: 'wishlist-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
