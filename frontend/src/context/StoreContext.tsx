import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { Product } from '../data/storeData';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PlacedOrder {
  id: string;
  customerName: string;
  city: string;
  total: number;
  itemCount: number;
  status: string;
}

interface StoreContextType {
  cart: CartItem[];
  wishlist: Product[];
  wishlistIds: string[];
  placedOrders: PlacedOrder[];
  cartCount: number;
  wishlistCount: number;
  subtotal: number;
  shippingFee: number;
  orderTotal: number;
  cartDrawerOpen: boolean;
  searchOverlayOpen: boolean;
  searchQuery: string;
  addToCart: (product: Product, quantity?: number) => void;
  buyNow: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  moveAllWishlistToCart: () => void;
  clearWishlist: () => void;
  setCartDrawerOpen: (open: boolean) => void;
  setSearchOverlayOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  addPlacedOrder: (order: PlacedOrder) => void;
  clearPlacedOrders: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'zaitoon_cart';
const WISHLIST_STORAGE_KEY = 'zaitoon_wishlist';
const ORDERS_STORAGE_KEY = 'zaitoon_orders';

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  // 2. Wishlist state
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Product[]) : [];
    } catch {
      return [];
    }
  });

  // 3. Placed orders state
  const [placedOrders, setPlacedOrders] = useState<PlacedOrder[]>(() => {
    try {
      const saved = window.localStorage.getItem(ORDERS_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as PlacedOrder[]) : [];
    } catch {
      return [];
    }
  });

  // 4. Overlays state
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(placedOrders));
    } catch {}
  }, [placedOrders]);

  // Derived calculations
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const wishlistCount = wishlist.length;

  const wishlistIds = useMemo(
    () => wishlist.map((p) => p.id),
    [wishlist]
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const shippingFee = subtotal === 0 || subtotal >= 1200 ? 0 : 200;
  const orderTotal = subtotal + shippingFee;

  // Actions
  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setCartDrawerOpen(true);
  }, []);

  const buyNow = useCallback((product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setCartDrawerOpen(false);
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback((product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      }
      return [product, ...prev];
    });
  }, []);

  const moveAllWishlistToCart = useCallback(() => {
    if (wishlist.length === 0) return;
    setCart((prev) => {
      const next = [...prev];
      wishlist.forEach((product) => {
        const existingIdx = next.findIndex((item) => item.product.id === product.id);
        if (existingIdx >= 0) {
          next[existingIdx] = {
            ...next[existingIdx],
            quantity: next[existingIdx].quantity + 1,
          };
        } else {
          next.push({ product, quantity: 1 });
        }
      });
      return next;
    });
    setCartDrawerOpen(true);
  }, [wishlist]);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
  }, []);

  const addPlacedOrder = useCallback((order: PlacedOrder) => {
    setPlacedOrders((prev) => [order, ...prev]);
  }, []);

  const clearPlacedOrders = useCallback(() => {
    setPlacedOrders([]);
    try {
      window.localStorage.removeItem(ORDERS_STORAGE_KEY);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      cart,
      wishlist,
      wishlistIds,
      placedOrders,
      cartCount,
      wishlistCount,
      subtotal,
      shippingFee,
      orderTotal,
      cartDrawerOpen,
      searchOverlayOpen,
      searchQuery,
      addToCart,
      buyNow,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      moveAllWishlistToCart,
      clearWishlist,
      setCartDrawerOpen,
      setSearchOverlayOpen,
      setSearchQuery,
      addPlacedOrder,
      clearPlacedOrders,
    }),
    [
      cart,
      wishlist,
      wishlistIds,
      placedOrders,
      cartCount,
      wishlistCount,
      subtotal,
      shippingFee,
      orderTotal,
      cartDrawerOpen,
      searchOverlayOpen,
      searchQuery,
      addToCart,
      buyNow,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      moveAllWishlistToCart,
      clearWishlist,
      addPlacedOrder,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
