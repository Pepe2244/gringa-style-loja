import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem } from '@/types';

const BANNER_SUPPRESSION_WINDOW_MS = 24 * 60 * 60 * 1000;

const getBannerKey = (item: CartItem) => {
    const variantKey = item.variante ? `${item.variante.tipo}:${item.variante.opcao}` : 'default';
    return `${item.produto_id}:${variantKey}`;
};

export interface CartState {
    items: CartItem[];
    showCartRecoveryBanner: boolean;
    dismissedCartRecoveryBannerFor: Record<string, number>;
    addItem: (item: CartItem) => void;
    removeItem: (index: number) => void;
    updateQuantity: (index: number, quantity: number) => void;
    clearCart: () => void;
    dismissCartRecoveryBanner: (productKeys?: string[]) => void;
    setCartRecoveryBannerVisible: (visible: boolean) => void;
    totalItems: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            showCartRecoveryBanner: true,
            dismissedCartRecoveryBannerFor: {},
            addItem: (item: CartItem) => set((state) => {
                // Trava de segurança: ignora se quantidade for menor que 1
                if (!item.quantidade || item.quantidade < 1) {
                    return { items: state.items, showCartRecoveryBanner: state.showCartRecoveryBanner, dismissedCartRecoveryBannerFor: state.dismissedCartRecoveryBannerFor };
                }

                const existingItemIndex = state.items.findIndex((i) =>
                    i.produto_id === item.produto_id &&
                    JSON.stringify(i.variante) === JSON.stringify(item.variante)
                );

                let newItems = [...state.items];
                if (existingItemIndex > -1) {
                    newItems[existingItemIndex].quantidade += item.quantidade;
                } else {
                    newItems = [...state.items, item];
                }

                const bannerKey = getBannerKey(item);
                const lastDismissedAt = state.dismissedCartRecoveryBannerFor[bannerKey];
                const isSuppressed = !!lastDismissedAt && (Date.now() - lastDismissedAt) < BANNER_SUPPRESSION_WINDOW_MS;

                return {
                    items: newItems,
                    showCartRecoveryBanner: isSuppressed ? false : true,
                    dismissedCartRecoveryBannerFor: state.dismissedCartRecoveryBannerFor,
                };
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
            dismissCartRecoveryBanner: (productKeys?: string[]) => set((state) => {
                const now = Date.now();
                const nextDismissals = { ...state.dismissedCartRecoveryBannerFor };
                const keysToDismiss = productKeys && productKeys.length > 0
                    ? productKeys
                    : state.items.map(getBannerKey);

                keysToDismiss.forEach((key) => {
                    if (key) {
                        nextDismissals[key] = now;
                    }
                });

                return {
                    showCartRecoveryBanner: false,
                    dismissedCartRecoveryBannerFor: nextDismissals,
                };
            }),
            setCartRecoveryBannerVisible: (visible: boolean) => set({ showCartRecoveryBanner: visible }),
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
