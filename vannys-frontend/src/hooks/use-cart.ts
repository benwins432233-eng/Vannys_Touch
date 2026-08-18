import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cartApi } from '@/api/cart.api';
import type { MergeCartItemPayload } from '@/api/cart.api';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import type { CartItem } from '@/store/cart.store';
import { getErrorMessage } from '@/utils';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '@/utils/shipping';
import { findVariant, MAX_QUANTITY_PER_LINE } from '@/utils/variants';
import type { Product, ServerCart } from '@/types';

export const CART_KEY = 'cart';

/**
 * Ligne affichable, quelle que soit son origine.
 * Les pages ne doivent pas avoir à savoir si le panier vit ici ou sur le serveur.
 */
export interface CartLine {
  /** Clé stable pour React et pour les actions. */
  key: string;
  /** Identifiant de la ligne serveur — absent hors connexion. */
  itemId?: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl?: string | null;
  size?: string | null;
  color?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  /** Stock restant, quand il est connu. */
  stock?: number;
  available: boolean;
  alert?: string;
  maxQuantity: number;
}

export interface CartView {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  freeShippingThreshold: number;
  /** Vrai dès qu'une ligne empêche de commander. */
  hasIssues: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  /** Le panier vit-il sur le serveur (client connecté) ? */
  isServerCart: boolean;

  add: (product: Product, quantity?: number, color?: string, size?: string) => void;
  setQuantity: (line: CartLine, quantity: number) => void;
  remove: (line: CartLine) => void;
  clear: () => void;
}

// ── Vue serveur ────────────────────────────────────────────────

const serverLine = (line: ServerCart['items'][number]): CartLine => ({
  key: line.id,
  itemId: line.id,
  productId: line.product.id,
  slug: line.product.slug,
  name: line.product.name,
  imageUrl: line.product.imageUrl,
  size: line.size,
  color: line.color,
  unitPrice: line.unitPrice,
  quantity: line.quantity,
  subtotal: line.subtotal,
  stock: line.stock,
  available: line.available,
  alert: line.alert,
  maxQuantity: Math.min(line.stock, MAX_QUANTITY_PER_LINE),
});

// ── Vue locale (visiteur non connecté) ─────────────────────────

const localLine = (item: CartItem): CartLine => {
  const image = item.product.images.find((i) => i.isPrimary) ?? item.product.images[0];
  const variant = findVariant(item.product.variants, item.color, item.size);
  const unitPrice = Number(item.product.price);
  // Le stock vient du produit tel qu'il a été mis au panier : il peut avoir
  // bougé depuis. Le serveur tranchera à la connexion, puis à la commande.
  const stock = variant?.stock;

  return {
    key: `${item.product.id}:${item.color ?? ''}:${item.size ?? ''}`,
    productId: item.product.id,
    slug: item.product.slug,
    name: item.product.name,
    imageUrl: image?.urlThumbnail || image?.url,
    size: item.size,
    color: item.color,
    unitPrice,
    quantity: item.quantity,
    subtotal: unitPrice * item.quantity,
    stock,
    available: stock === undefined || stock >= item.quantity,
    alert:
      stock !== undefined && stock < item.quantity
        ? `Il ne reste que ${stock} article(s) : ajustez la quantité pour commander.`
        : undefined,
    maxQuantity: Math.min(stock ?? MAX_QUANTITY_PER_LINE, MAX_QUANTITY_PER_LINE),
  };
};

/** Lignes du panier local, prêtes pour `POST /cart/merge`. */
export const toMergePayload = (items: CartItem[]): MergeCartItemPayload[] =>
  items.map((item) => ({
    variantId: item.variantId,
    productId: item.product.id,
    color: item.color,
    size: item.size,
    quantity: item.quantity,
  }));

// ── Hook ───────────────────────────────────────────────────────

/**
 * Vue unique du panier.
 *
 * Connecté, le panier vient du serveur, qui est seul à calculer les montants et
 * à connaître le stock. Hors connexion, il reste dans le navigateur ; il est
 * fusionné au serveur à la connexion.
 */
export function useCart(): CartView {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();

  const localItems = useCartStore((s) => s.items);
  const addLocal = useCartStore((s) => s.addItem);
  const updateLocal = useCartStore((s) => s.updateQuantity);
  const removeLocal = useCartStore((s) => s.removeItem);
  const clearLocal = useCartStore((s) => s.clearCart);

  const { data: serverCart, isLoading } = useQuery({
    queryKey: [CART_KEY],
    queryFn: cartApi.get,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  /** Toute mutation renvoie le panier à jour : on écrit directement le cache. */
  const onMutated = useCallback(
    (cart: ServerCart) => {
      qc.setQueryData([CART_KEY], cart);
      if (cart.notice) toast(cart.notice);
    },
    [qc],
  );

  const onFailed = useCallback((error: unknown) => {
    toast.error(getErrorMessage(error));
  }, []);

  const addMutation = useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      cartApi.add(variantId, quantity),
    onSuccess: onMutated,
    onError: onFailed,
  });

  const quantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateQuantity(itemId, quantity),
    onSuccess: onMutated,
    onError: onFailed,
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => cartApi.remove(itemId),
    onSuccess: onMutated,
    onError: onFailed,
  });

  const clearMutation = useMutation({
    mutationFn: cartApi.clear,
    onSuccess: onMutated,
    onError: onFailed,
  });

  const isSyncing =
    addMutation.isPending ||
    quantityMutation.isPending ||
    removeMutation.isPending ||
    clearMutation.isPending;

  return useMemo(() => {
    if (isAuthenticated) {
      const lines = (serverCart?.items ?? []).map(serverLine);
      return {
        lines,
        itemCount: serverCart?.itemCount ?? 0,
        subtotal: serverCart?.subtotal ?? 0,
        shippingFee: serverCart?.shippingFee ?? 0,
        total: serverCart?.total ?? 0,
        freeShippingThreshold: serverCart?.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD,
        hasIssues: serverCart?.hasIssues ?? false,
        isLoading,
        isSyncing,
        isServerCart: true,

        add: (product, quantity = 1, color, size) => {
          const variant = findVariant(product.variants, color, size);
          if (!variant) {
            toast.error("Choisissez une déclinaison avant d'ajouter cet article.");
            return;
          }
          addMutation.mutate({ variantId: variant.id, quantity });
        },
        setQuantity: (line, quantity) => {
          if (!line.itemId) return;
          quantityMutation.mutate({ itemId: line.itemId, quantity });
        },
        remove: (line) => {
          if (!line.itemId) return;
          removeMutation.mutate(line.itemId);
        },
        clear: () => clearMutation.mutate(),
      };
    }

    const lines = localItems.map(localLine);
    const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    return {
      lines,
      itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      hasIssues: lines.some((l) => !l.available),
      isLoading: false,
      isSyncing: false,
      isServerCart: false,

      add: (product, quantity = 1, color, size) => addLocal(product, quantity, color, size),
      setQuantity: (line, quantity) =>
        updateLocal(line.productId, quantity, line.color ?? undefined, line.size ?? undefined),
      remove: (line) =>
        removeLocal(line.productId, line.color ?? undefined, line.size ?? undefined),
      clear: () => clearLocal(),
    };
  }, [
    isAuthenticated,
    serverCart,
    isLoading,
    isSyncing,
    localItems,
    addMutation,
    quantityMutation,
    removeMutation,
    clearMutation,
    addLocal,
    updateLocal,
    removeLocal,
    clearLocal,
  ]);
}

/**
 * Ajout seul, pour les composants qui ne montrent pas le panier.
 *
 * Une grille de douze cartes produit n'a pas besoin de douze abonnements aux
 * totaux : seul le geste d'ajout l'intéresse.
 */
export function useAddToCart() {
  const { add } = useCart();
  return add;
}

/**
 * Fusionne le panier local dans le panier serveur, puis vide le local.
 * Appelé à la connexion et à l'inscription.
 */
export function useMergeCart() {
  const qc = useQueryClient();
  const clearLocal = useCartStore.getState().clearCart;

  return useMutation({
    mutationFn: async () => {
      const items = useCartStore.getState().items;
      if (!items.length) return null;
      return cartApi.merge(toMergePayload(items));
    },
    onSuccess: (cart) => {
      // Le local est vidé même si rien n'a été repris : le panier serveur fait
      // désormais foi, en garder une copie ferait réapparaître des articles.
      clearLocal();
      if (!cart) return;
      qc.setQueryData([CART_KEY], cart);
      if (cart.notice) toast(cart.notice);
    },
    // Un échec de fusion ne doit pas empêcher la connexion : on garde le panier
    // local, il sera refusionné au prochain chargement.
    onError: () => qc.invalidateQueries({ queryKey: [CART_KEY] }),
  });
}

/**
 * Fusionne le panier local dès qu'une session s'ouvre, puis n'y revient plus.
 *
 * Une seule tentative par session : sans ce garde-fou, un échec de fusion
 * relancerait la requête à chaque rendu, puisque le panier local reste plein.
 * Le prochain chargement de l'application réessaiera.
 */
export function useCartMergeOnLogin(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasLocalItems = useCartStore((s) => s.items.length > 0);
  const { mutate: merge } = useMergeCart();
  const attempted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      attempted.current = false;
      return;
    }
    if (!hasLocalItems || attempted.current) return;
    attempted.current = true;
    merge();
  }, [isAuthenticated, hasLocalItems, merge]);
}
