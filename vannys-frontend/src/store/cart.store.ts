import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';
import { findVariant } from '@/utils/variants';

/**
 * Panier **hors connexion**.
 *
 * Depuis le lot L2, le panier d'un client connecté vit sur le serveur : ce
 * magasin ne sert plus qu'aux visiteurs non connectés, et de tampon avant la
 * fusion (`POST /cart/merge`) au moment de la connexion. Voir `useCart()`, qui
 * expose une vue unique des deux mondes.
 */
export interface CartItem {
  product: Product;
  /**
   * Déclinaison choisie. Absente des paniers enregistrés avant le lot L1 :
   * le serveur la retrouve alors depuis le produit, la couleur et la taille.
   */
  variantId?: string;
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
}

export const itemKey = (productId: string, color?: string, size?: string) =>
  `${productId}:${color ?? ''}:${size ?? ''}`;

const keyOf = (item: CartItem) => itemKey(item.product.id, item.color, item.size);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1, color, size) => {
        const key = itemKey(product.id, color, size);
        const existing = get().items.find((i) => keyOf(i) === key);

        if (existing) {
          set({
            items: get().items.map((i) =>
              keyOf(i) === key ? { ...i, quantity: i.quantity + quantity } : i,
            ),
          });
          return;
        }

        // La déclinaison est résolue à l'ajout : au moment de la fusion, le
        // produit stocké peut être périmé, l'identifiant de variante non.
        const variantId = findVariant(product.variants, color, size)?.id;
        set({ items: [...get().items, { product, variantId, quantity, color, size }] });
      },

      removeItem: (productId, color, size) => {
        const key = itemKey(productId, color, size);
        set({ items: get().items.filter((i) => keyOf(i) !== key) });
      },

      updateQuantity: (productId, quantity, color, size) => {
        const key = itemKey(productId, color, size);
        if (quantity <= 0) {
          get().removeItem(productId, color, size);
          return;
        }
        set({
          items: get().items.map((i) => (keyOf(i) === key ? { ...i, quantity } : i)),
        });
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'vannys-cart',
      version: 2,
      /**
       * Les paniers enregistrés avant le lot L1 décrivent les variantes à
       * l'ancienne (`{ type, value }`) et n'ont pas de `variantId`. On les
       * garde tels quels : le nom, le prix et l'image restent affichables, et
       * la fusion serveur retrouve la déclinaison depuis produit + couleur +
       * taille. Les jeter reviendrait à vider le panier d'une cliente.
       */
      migrate: (persisted) => persisted as CartState,
      // Volontairement : l'ouverture du tiroir ne se mémorise pas.
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
