import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  SHIPPING_CLASS_PRIORITY,
  type CartResolvedItem,
  type CartStoredItem,
  type CartStoredState,
  type ProductListResponse,
  type ProductSummary,
  type ShippingClass,
} from '../../shared/types';
import { apiFetch, ApiRequestError } from '../lib/api';
import { useLanguage } from './LanguageContext';

const CART_STORAGE_KEY = 'brakasa_cart_v1';

interface CartContextValue {
  items: CartStoredItem[];
  resolvedItems: CartResolvedItem[];
  loading: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  totalCount: number;
  subtotalIdr: number;
  totalWeightGrams: number;
  requiresAge18: boolean;
  combinedShippingClass: ShippingClass;
  addItem: (productId: number, qty?: number) => void;
  addManyItems: (entries: CartStoredItem[]) => void;
  updateQuantity: (productId: number, qty: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  error: string | null;
  adjustmentNotice: string | null;
  dismissAdjustmentNotice: () => void;
  lastAnnouncement: string;
}

const CartContext = createContext<CartContextValue | null>(null);

function normalizeStoredItems(rawItems: unknown): CartStoredItem[] {
  if (!Array.isArray(rawItems)) return [];
  const merged = new Map<number, number>();
  for (const entry of rawItems) {
    if (typeof entry !== 'object' || entry === null) continue;
    const candidate = entry as Record<string, unknown>;
    const productId = Number(candidate.productId);
    const quantity = Number(candidate.quantity);
    if (Number.isInteger(productId) && productId > 0 && Number.isInteger(quantity) && quantity > 0) {
      merged.set(productId, (merged.get(productId) ?? 0) + quantity);
    }
  }
  return Array.from(merged.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

function readStoredCart(): CartStoredItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<CartStoredState>;
    if (parsed && parsed.version === 1 && Array.isArray(parsed.items)) {
      return normalizeStoredItems(parsed.items);
    }
  } catch {
    // Ignore malformed local storage
  }
  return [];
}

function writeStoredCart(items: CartStoredItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: CartStoredState = {
      version: 1,
      items,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or storage errors
  }
}

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { t } = useLanguage();
  const tRef = useRef(t);
  tRef.current = t;

  const [items, setItems] = useState<CartStoredItem[]>(readStoredCart);
  const [productMap, setProductMap] = useState<Record<number, ProductSummary>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [adjustmentNotice, setAdjustmentNotice] = useState<string | null>(null);
  const [lastAnnouncement, setLastAnnouncement] = useState<string>('');

  const itemsRef = useRef<CartStoredItem[]>(items);
  itemsRef.current = items;

  const requestSeqRef = useRef<number>(0);

  useEffect(() => {
    writeStoredCart(items);
  }, [items]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) {
        setItems(readStoredCart());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const refreshCart = useCallback(async () => {
    const currentItems = itemsRef.current;
    if (currentItems.length === 0) {
      setProductMap({});
      setError(null);
      setLoading(false);
      return;
    }

    const seq = ++requestSeqRef.current;
    const idsCsv = currentItems.map((i) => i.productId).join(',');
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch<ProductListResponse>(
        `/api/products?ids=${encodeURIComponent(idsCsv)}&limit=100`,
      );
      if (seq !== requestSeqRef.current) return;

      const nextMap: Record<number, ProductSummary> = {};
      for (const product of response.items) {
        nextMap[product.id] = product;
      }
      setProductMap(nextMap);

      const copy = tRef.current.cart;
      const notices: string[] = [];
      let changed = false;
      const clampedItems: CartStoredItem[] = [];

      for (const entry of itemsRef.current) {
        const product = nextMap[entry.productId];
        if (!product) {
          changed = true;
          notices.push(copy.archivedRemovedNotice);
          continue;
        }
        if (product.stockQty > 0 && entry.quantity > product.stockQty) {
          changed = true;
          clampedItems.push({ productId: entry.productId, quantity: product.stockQty });
          notices.push(copy.stockClampedNotice(product.name, product.stockQty));
        } else {
          clampedItems.push(entry);
        }
      }

      if (changed) {
        setItems(clampedItems);
      }
      if (notices.length > 0) {
        setAdjustmentNotice(notices.join(' '));
      }
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(tRef.current.cart.verifyError);
      }
    } finally {
      if (seq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const itemIdsKey = useMemo(
    () =>
      items
        .map((i) => i.productId)
        .sort((a, b) => a - b)
        .join(','),
    [items],
  );

  useEffect(() => {
    void refreshCart();
  }, [itemIdsKey, refreshCart]);

  const addItem = useCallback(
    (productId: number, qty = 1) => {
      const safeQty = Math.max(1, Math.floor(qty));
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        if (existing) {
          const product = productMap[productId];
          const nextQty =
            product && product.stockQty > 0
              ? Math.min(existing.quantity + safeQty, product.stockQty)
              : existing.quantity + safeQty;
          return prev.map((i) => (i.productId === productId ? { ...i, quantity: nextQty } : i));
        }
        return [...prev, { productId, quantity: safeQty }];
      });
      const known = productMap[productId];
      const copy = tRef.current.cart;
      setLastAnnouncement(
        known ? copy.addedNamed(known.name, safeQty) : copy.addedGeneric(safeQty),
      );
    },
    [productMap],
  );

  const addManyItems = useCallback(
    (entries: CartStoredItem[]) => {
      const valid = normalizeStoredItems(entries);
      if (valid.length === 0) return;
      setItems((prev) => {
        const merged = new Map<number, number>();
        for (const item of prev) {
          merged.set(item.productId, item.quantity);
        }
        for (const entry of valid) {
          const product = productMap[entry.productId];
          const nextTotal = (merged.get(entry.productId) ?? 0) + entry.quantity;
          const clamped =
            product && product.stockQty > 0 ? Math.min(nextTotal, product.stockQty) : nextTotal;
          merged.set(entry.productId, clamped);
        }
        return Array.from(merged.entries()).map(([productId, quantity]) => ({
          productId,
          quantity,
        }));
      });
      const totalAdded = valid.reduce((sum, e) => sum + e.quantity, 0);
      setLastAnnouncement(tRef.current.cart.addedMany(totalAdded));
    },
    [productMap],
  );

  const updateQuantity = useCallback(
    (productId: number, qty: number) => {
      const safeQty = Math.floor(qty);
      if (safeQty <= 0) {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
        setLastAnnouncement(tRef.current.cart.removedGeneric);
        return;
      }
      const product = productMap[productId];
      const clamped =
        product && product.stockQty > 0 ? Math.min(safeQty, product.stockQty) : safeQty;
      setItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity: clamped } : i)),
      );
    },
    [productMap],
  );

  const removeItem = useCallback(
    (productId: number) => {
      const known = productMap[productId];
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      const copy = tRef.current.cart;
      setLastAnnouncement(known ? copy.removedNamed(known.name) : copy.removedGeneric);
    },
    [productMap],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setProductMap({});
    setAdjustmentNotice(null);
    setError(null);
    setLastAnnouncement(tRef.current.cart.cleared);
  }, []);

  const dismissAdjustmentNotice = useCallback(() => {
    setAdjustmentNotice(null);
  }, []);

  const resolvedItems = useMemo<CartResolvedItem[]>(() => {
    const resolved: CartResolvedItem[] = [];
    for (const item of items) {
      const product = productMap[item.productId];
      if (!product) continue;
      const outOfStock = product.stockQty <= 0 || !product.isActive;
      const exceedsStock = !outOfStock && item.quantity > product.stockQty;
      resolved.push({
        product,
        quantity: item.quantity,
        lineTotalIdr: product.priceIdr * item.quantity,
        lineWeightGrams: product.weightGrams * item.quantity,
        exceedsStock,
        outOfStock,
      });
    }
    return resolved;
  }, [items, productMap]);

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotalIdr = useMemo(
    () => resolvedItems.reduce((sum, item) => sum + item.lineTotalIdr, 0),
    [resolvedItems],
  );

  const totalWeightGrams = useMemo(
    () => resolvedItems.reduce((sum, item) => sum + item.lineWeightGrams, 0),
    [resolvedItems],
  );

  const requiresAge18 = false;

  const combinedShippingClass = useMemo<ShippingClass>(() => {
    let highest: ShippingClass = 'REGULAR';
    for (const item of resolvedItems) {
      const currentClass = item.product.shippingClass;
      if (SHIPPING_CLASS_PRIORITY[currentClass] > SHIPPING_CLASS_PRIORITY[highest]) {
        highest = currentClass;
      }
    }
    return highest;
  }, [resolvedItems]);

  return (
    <CartContext.Provider
      value={{
        items,
        resolvedItems,
        loading,
        drawerOpen,
        setDrawerOpen,
        totalCount,
        subtotalIdr,
        totalWeightGrams,
        requiresAge18,
        combinedShippingClass,
        addItem,
        addManyItems,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
        error,
        adjustmentNotice,
        dismissAdjustmentNotice,
        lastAnnouncement,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider.');
  }
  return ctx;
}
