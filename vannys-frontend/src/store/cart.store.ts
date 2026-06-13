import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

export interface CartItem {
  product: Product;
  quantity: number;
  color?: string;
  size?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  addItem: (product: Product, quantity?: number, color?: string, size?: string) => void;
  removeItem: (productId: string, color?: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, color?: string, size?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;

  get total(): number;
  get itemCount(): number;
}

const itemKey = (productId: string, color?: string, size?: string) =>
  `${productId}:${color ?? ''}:${size ?? ''}`;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1, color, size) => {
        const key = itemKey(product.id, color, size);
        const existing = get().items.find(
          (i) => itemKey(i.product.id, i.color, i.size) === key,
        );

        if (existing) {
          set({
            items: get().items.map((i) =>
              itemKey(i.product.id, i.color, i.size) === key
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            ),
          });
        } else {
          set({ items: [...get().items, { product, quantity, color, size }] });
        }
      },

      removeItem: (productId, color, size) => {
        const key = itemKey(productId, color, size);
        set({ items: get().items.filter((i) => itemKey(i.product.id, i.color, i.size) !== key) });
      },

      updateQuantity: (productId, quantity, color, size) => {
        const key = itemKey(productId, color, size);
        if (quantity <= 0) {
          get().removeItem(productId, color, size);
          return;
        }
        set({
          items: get().items.map((i) =>
            itemKey(i.product.id, i.color, i.size) === key ? { ...i, quantity } : i,
          ),
        });
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      closeCart: () => set({ isOpen: false }),

      get total() {
        return get().items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
      },

      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    { name: 'vannys-cart' },
  ),
);
