import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem } from '@/types';

export interface CartState {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (index: number) => void;
    updateQuantity: (index: number, quantity: number) => void;
    clearCart: () => void;
    totalItems: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item: CartItem) => set((state) => {
                // Trava de segurança: ignora se quantidade for menor que 1
                if (!item.quantidade || item.quantidade < 1) {
                    return { items: state.items };
                }

                const existingItemIndex = state.items.findIndex((i) =>
                    i.produto_id === item.produto_id &&
                    JSON.stringify(i.variante) === JSON.stringify(item.variante)
                );

                if (existingItemIndex > -1) {
                    const newItems = [...state.items];
                    newItems[existingItemIndex].quantidade += item.quantidade;
                    return { items: newItems };
                }
                return { items: [...state.items, item] };
            }),
            removeItem: (index: number) => set((state) => ({
                items: state.items.filter((_, i) => i !== index)
            })),
            updateQuantity: (index: number, quantity: number) => set((state) => {
                const newItems = [...state.items];
                // Se quantidade for inválida ou menor que 1, remove o item
                if (!quantity || quantity < 1) {
                    newItems.splice(index, 1);
                } else {
                    newItems[index].quantidade = quantity;
                }
                return { items: newItems };
            }),
            clearCart: () => set({ items: [] }),
            totalItems: () => {
                const state = get();
                return state.items.reduce((acc, item) => acc + item.quantidade, 0);
            }
        }),
        {
            name: 'carrinho-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
