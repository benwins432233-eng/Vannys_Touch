import {
  createContext, useContext, useState,
  useCallback, useEffect, type ReactNode
} from 'react';
import type { CartItem, Product } from '@/types';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  removeFromCart: (productId: number, color?: string, size?: string) => void;
  updateQuantity: (productId: number, quantity: number, color?: string, size?: string) => void;
  clearCart: () => void;
  loadCartForUser: (userId: number | null) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ── Clé localStorage selon l'utilisateur ─────────────────────
function cartKey(userId: number | null): string {
  return userId ? `vanny_cart_${userId}` : 'vanny_cart_guest';
}

// ── Lire le panier depuis localStorage ───────────────────────
function loadCart(userId: number | null): CartItem[] {
  try {
    const raw = localStorage.getItem(cartKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ── Sauvegarder le panier dans localStorage ──────────────────
function saveCart(userId: number | null, items: CartItem[]): void {
  try {
    localStorage.setItem(cartKey(userId), JSON.stringify(items));
  } catch {}
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId]   = useState<number | null>(null);
  const [items, setItems]     = useState<CartItem[]>(() => loadCart(null));

  // Sauvegarder automatiquement à chaque changement
  useEffect(() => {
    saveCart(userId, items);
  }, [items, userId]);

  // ── Charger le panier quand l'utilisateur change ──────────
  const loadCartForUser = useCallback((newUserId: number | null) => {
    const guestItems = loadCart(null); // panier invité actuel
    const userItems  = loadCart(newUserId); // panier sauvegardé du compte

    if (newUserId) {
      // Fusionner panier invité + panier du compte
      if (guestItems.length > 0) {
        const merged = [...userItems];
        for (const guestItem of guestItems) {
          const existing = merged.find(i =>
            i.product.id === guestItem.product.id &&
            i.selected_color === guestItem.selected_color &&
            i.selected_size  === guestItem.selected_size
          );
          if (existing) {
            existing.quantity += guestItem.quantity;
          } else {
            merged.push(guestItem);
          }
        }
        setItems(merged);
        // Vider le panier invité
        localStorage.removeItem(cartKey(null));
      } else {
        setItems(userItems);
      }
    } else {
      // Déconnexion → panier invité vide
      setItems([]);
    }

    setUserId(newUserId);
  }, []);

  // ── Ajouter au panier ─────────────────────────────────────
  const addToCart = useCallback((
    product: Product,
    quantity = 1,
    color?: string,
    size?: string
  ) => {
    setItems(prev => {
      const existing = prev.find(i =>
        i.product.id    === product.id &&
        i.selected_color === color &&
        i.selected_size  === size
      );

      if (existing) {
        toast.success('Quantité mise à jour');
        return prev.map(i =>
          i.product.id === product.id &&
          i.selected_color === color &&
          i.selected_size  === size
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }

      toast.success(`${product.name} ajouté au panier`);
      return [...prev, {
        product,
        quantity,
        selected_color: color,
        selected_size:  size,
      }];
    });
  }, []);

  // ── Retirer du panier ─────────────────────────────────────
  const removeFromCart = useCallback((
    productId: number,
    color?: string,
    size?: string
  ) => {
    setItems(prev => {
      const item = prev.find(i =>
        i.product.id === productId &&
        i.selected_color === color &&
        i.selected_size  === size
      );
      if (item) toast.info(`${item.product.name} retiré du panier`);
      return prev.filter(i => !(
        i.product.id    === productId &&
        i.selected_color === color &&
        i.selected_size  === size
      ));
    });
  }, []);

  // ── Modifier la quantité ──────────────────────────────────
  const updateQuantity = useCallback((
    productId: number,
    quantity: number,
    color?: string,
    size?: string
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, color, size);
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.product.id    === productId &&
        i.selected_color === color &&
        i.selected_size  === size
          ? { ...i, quantity }
          : i
      )
    );
  }, [removeFromCart]);

  // ── Vider le panier ───────────────────────────────────────
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart,
      updateQuantity, clearCart, loadCartForUser,
      totalItems, totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}