import React, { useState, useMemo, useEffect, useRef, useCallback, startTransition } from 'react';
import { X, Plus, Minus, Trash2, Check, Loader2 } from 'lucide-react';
import { Navbar, NavSection } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { OurStorySection } from '../components/OurStorySection';
import { CategoriesSection } from '../components/CategoriesSection';
import { FeaturedProductsSection } from '../components/FeaturedProductsSection';
import { FromOurBlogSection } from '../components/FromOurBlogSection';
import { UniqueProductsSection } from '../components/UniqueProductsSection';
import { HeritageBannerSection } from '../components/HeritageBannerSection';
import { PromoBannerSection } from '../components/PromoBannerSection';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { PartnerLogosStrip } from '../components/PartnerLogosStrip';
import { NewsletterSection } from '../components/NewsletterSection';
import { Footer } from '../components/Footer';
// Route-level code-splitting: Subpages lazy-loaded on demand to keep initial bundle ultra-fast
const ShopPage = React.lazy(() => import('../components/ShopPage').then((m) => ({ default: m.ShopPage })));
const AboutUsPage = React.lazy(() => import('../components/AboutUsPage').then((m) => ({ default: m.AboutUsPage })));
const BlogsPage = React.lazy(() => import('../components/BlogsPage').then((m) => ({ default: m.BlogsPage })));
const BlogDetailPage = React.lazy(() => import('../components/BlogDetailPage').then((m) => ({ default: m.BlogDetailPage })));
const ContactUsPage = React.lazy(() => import('../components/ContactUsPage').then((m) => ({ default: m.ContactUsPage })));
const CartPage = React.lazy(() => import('../components/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = React.lazy(() => import('../components/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const WishlistPage = React.lazy(() => import('../components/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const OrderTrackingPage = React.lazy(() => import('../components/OrderTrackingPage').then((m) => ({ default: m.OrderTrackingPage })));
const ShippingPolicyPage = React.lazy(() => import('../components/ShippingPolicyPage').then((m) => ({ default: m.ShippingPolicyPage })));
const ProductDetailPage = React.lazy(() => import('../components/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));

const PageSkeleton: React.FC = () => (
  <div className="w-full min-h-[60vh] max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-6">
    <div className="h-8 bg-[#15472B]/10 w-1/4 rounded"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="aspect-[3/4] bg-[#15472B]/5 rounded"></div>
      ))}
    </div>
  </div>
);
import {
  BRANDS,
  HERO_SLIDES,
  BlogPost,
  Product,
} from '../data/storeData';
import {
  fetchProducts,
  fetchHomeSections,
  fetchBlogs,
  createOrder,
  fetchCategories,
  CategoryItem,
} from '../services/api';

interface CartItem {
  product: Product;
  quantity: number;
}

interface PlacedOrder {
  id: string;
  customerName: string;
  city: string;
  total: number;
  itemCount: number;
  status: string;
}

const formatPKR = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`;

export const HomePage: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavSection>('HOME');
  const [currentView, setCurrentView] = useState<
    | 'home'
    | 'about'
    | 'shop'
    | 'blogs'
    | 'blog-detail'
    | 'contact'
    | 'wishlist'
    | 'order-tracking'
    | 'cart'
    | 'checkout'
    | 'shipping'
    | 'product'
  >('home');
  const [selectedBrand, setSelectedBrand] = useState<string>('All Brands');
  const [shopInitialCategory, setShopInitialCategory] = useState<string>('All');
  const [shopInitialSubcategory, setShopInitialSubcategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Live backend section data
  const [featuredGrid, setFeaturedGrid] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [uniqueProducts, setUniqueProducts] = useState<Product[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CategoryItem[]>([]);

  // Search overlay state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Cart, wishlist & checkout state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = window.localStorage.getItem('zaitoon_wishlist');
      return saved ? (JSON.parse(saved) as Product[]) : [];
    } catch {
      return [];
    }
  });
  const [checkoutStep, setCheckoutStep] = useState<'bag' | 'checkout' | 'confirmed'>('bag');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('Lahore');
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [placedOrders, setPlacedOrders] = useState<PlacedOrder[]>([]);
  const [trackingInitialOrderId, setTrackingInitialOrderId] = useState('');
  const [drawerSubmitting, setDrawerSubmitting] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  const wishlistIds = useMemo(() => wishlist.map((p) => p.id), [wishlist]);

  // Load home sections in a single consolidated request with in-flight deduplication
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    fetchHomeSections({ signal: abortController.signal })
      .then((res) => {
        if (isMounted) {
          setFeaturedGrid(res.featuredGrid);
          setBestSellers(res.bestSellers);
          setUniqueProducts(res.uniqueProducts);
          if (res.shopProducts && res.shopProducts.length > 0) {
            setAllProducts(res.shopProducts);
          }
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.error('Failed to load home sections:', err);
        }
      });

    fetchBlogs({ signal: abortController.signal })
      .then((data) => {
        if (isMounted) setBlogs(data);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.error('Failed to load blogs:', err);
        }
      });

    fetchCategories({ signal: abortController.signal })
      .then((cats) => {
        if (isMounted) setCatalogCategories(cats);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.error('Failed to load categories:', err);
        }
      });

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  const searchAbortRef = useRef<AbortController | null>(null);

  // Debounced search with AbortController to immediately cancel stale requests
  useEffect(() => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }

    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const controller = new AbortController();
    searchAbortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const res = await fetchProducts({ search: q, limit: 6 }, { signal: controller.signal });
        setSearchResults(res.products);
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error('Search failed:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    try {
      window.localStorage.setItem('zaitoon_wishlist', JSON.stringify(wishlist));
    } catch {
      // Ignore storage quota errors
    }
  }, [wishlist]);

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const shippingFee = subtotal === 0 || subtotal >= 1200 ? 0 : 200;
  const orderTotal = subtotal + shippingFee;

  const handleSelectNav = useCallback((nav: NavSection) => {
    setActiveNav(nav);
    if (nav === 'SHOP') {
      setShopInitialCategory('All');
      setShopInitialSubcategory('All');
      setSelectedBrand('All Brands');
      setCurrentView('shop');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (nav === 'ABOUT US') {
      setCurrentView('about');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (nav === 'BLOGS') {
      setCurrentView('blogs');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (nav === 'CONTACT US') {
      setCurrentView('contact');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentView('home');
    setSelectedBrand('All Brands');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenProductDetail = useCallback((product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product');
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenBlogDetail = useCallback((post: BlogPost) => {
    setSelectedPost(post);
    setActiveNav('BLOGS');
    setCurrentView('blog-detail');
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateShopCategory = useCallback((
    category?: string,
    subcategory?: string,
    brand?: string
  ) => {
    setShopInitialCategory(category ?? 'All');
    setShopInitialSubcategory(subcategory ?? 'All');
    setSelectedBrand(brand ?? 'All Brands');
    setActiveNav('SHOP');
    setCurrentView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAddToCart = useCallback((product: Product, quantity = 1) => {
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
    setCheckoutStep('bag');
    setSearchOpen(false);
    setCartOpen(true);
  }, []);

  const handleBuyNow = useCallback((product: Product, quantity = 1) => {
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
    setCartOpen(false);
    setSearchOpen(false);
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleUpdateQty = useCallback((productId: string, delta: number) => {
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

  const handleRemoveItem = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const handleToggleWishlist = useCallback((product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      }
      return [product, ...prev];
});
  }, []);

  const handleMoveAllWishlistToCart = useCallback(() => {
    if (wishlist.length === 0) return;
    setCart((prev) => {
      const next = [...prev];
      wishlist.forEach((product) => {
        const existingIndex = next.findIndex((item) => item.product.id === product.id);
        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + 1,
          };
        } else {
          next.push({ product, quantity: 1 });
        }
      });
      return next;
    });
    setCheckoutStep('bag');
    setCartOpen(true);
  }, [wishlist]);

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim() || cart.length === 0) return;

    setDrawerSubmitting(true);
    setDrawerError(null);

    try {
      const orderPayload = {
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
        },
        shippingAddress: {
          city: customerCity,
          address: customerAddress.trim(),
        },
        items: cart.map((it) => ({
          productId: it.product.mongoId || it.product.id,
          quantity: it.quantity,
        })),
        paymentMethod: 'Cash on Delivery' as const,
      };

      const res = await createOrder(orderPayload);
      const code = res.order.orderReference;

      const newOrder: PlacedOrder = {
        id: code,
        customerName: customerName.trim(),
        city: customerCity,
        total: res.order.total ?? orderTotal,
        itemCount: totalItems,
        status: 'Confirmed — Preparing Cold-Packed Parcel at Islamabad Hub',
      };

      setPlacedOrders((prev) => [newOrder, ...prev]);
      setConfirmedOrderId(code);
      setCart([]);
      setCheckoutStep('confirmed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place order';
      setDrawerError(msg);
    } finally {
      setDrawerSubmitting(false);
    }
  };

  const handleOpenTrackOrder = useCallback((orderId = '') => {
    setCartOpen(false);
    setSearchOpen(false);
    setTrackingInitialOrderId(orderId.trim().toUpperCase());
    setCurrentView('order-tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div id="home" className="min-h-screen bg-white text-[#1C1C1C]">
      {/* Top Announcement Bar + Main Navbar */}
      <Navbar
        activeNav={activeNav}
        cartCount={totalItems}
        wishlistCount={wishlist.length}
        orderCount={placedOrders.length}
        featuredProducts={featuredGrid}
        onSelectNav={handleSelectNav}
        onNavigateCategory={(cat, sub) => handleNavigateShopCategory(cat, sub)}
        onOpenSearch={() => setSearchOpen((prev) => !prev)}
        onOpenOrderTracking={() => handleOpenTrackOrder(placedOrders[0]?.id ?? '')}
        onOpenWishlist={() => {
          setCartOpen(false);
          setSearchOpen(false);
          setCurrentView('wishlist');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCart={() => {
          setCartOpen(false);
          setSearchOpen(false);
          setCurrentView('cart');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenShipping={() => {
          setCurrentView('shipping');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectProduct={handleOpenProductDetail}
        onSearchSubmit={(q, cat) => {
          setShopInitialCategory(cat && cat !== 'All Collection' ? cat : 'All');
          setShopInitialSubcategory('All');
          setCurrentView('shop');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Expandable Search Bar Overlay */}
      {searchOpen && (
        <div className="w-full bg-[#FAF9F6] border-b border-[#EAEAEA] py-4 px-4 sm:px-8 lg:px-14">
          <div className="max-w-[1380px] mx-auto space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cold-pressed olive oil, Sidr honey, herbal teas..."
                autoFocus
                className="flex-1 bg-white border border-[#D4D4D4] px-4 py-2.5 text-[14px] text-[#1C1C1C] placeholder:text-[#767676] focus:outline-none focus:border-[#224D26]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-2 text-[12px] uppercase tracking-[0.06em] text-[#555555] hover:text-[#121212] cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="p-2 text-[#444444] hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {searchQuery.trim() && (
              <div className="bg-white border border-[#EAEAEA] divide-y divide-[#F0F0F0]">
                {searching ? (
                  <div className="px-4 py-6 text-center text-[13.5px] text-[#666666] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#15472B]" />
                    <span>Searching our orchard pantry...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="px-4 py-3 text-[13.5px] text-[#555555]">
                    No products matched &ldquo;{searchQuery}&rdquo;.
                  </p>
                ) : (
                  searchResults.slice(0, 6).map((product) => (
                    <div
                      key={product.id}
                      className="px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenProductDetail(product)}
                        className="min-w-0 flex items-center gap-3.5 text-left cursor-pointer group"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-14 object-cover bg-[#FAF3F0] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.06em] text-[#666666]">
                            {product.brand} · {product.category}
                          </p>
                          <p className="text-[14px] font-medium text-[#181818] group-hover:text-[#15472B] truncate">
                            {product.name}
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[13.5px] font-semibold tabular-nums">
                          {formatPKR(product.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="px-3 py-1.5 bg-[#1C1C1C] hover:bg-[#224D26] text-white text-[11.5px] uppercase tracking-[0.06em] cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {currentView === 'home' ? (
        <>
          {/* Hero Banner Carousel */}
          <HeroSection
            slides={HERO_SLIDES}
            onSlideAction={(slide) => {
              handleNavigateShopCategory('All', slide.brandFilter);
            }}
          />

          {/* 1. Our Story — Brand Heritage (White) */}
          <OurStorySection />

          {/* Top Categories Showcase (Exact Card Design Matching Reference) */}
          <CategoriesSection
            categories={catalogCategories}
            onSelectCategory={(catName) => handleNavigateShopCategory(catName)}
            onViewAll={() => handleNavigateShopCategory('All')}
          />

          {/* 2. Featured Grid — Hand-Harvested Pantry Products (Light Sand) */}
          <FeaturedProductsSection
            title="Featured Pantry Selections"
            subtitle="Cold-pressed single varietal extra virgins, raw forest honeys, whole aromatic spices and wild-harvested botanicals."
            products={featuredGrid}
            onSelectProduct={handleOpenProductDetail}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            onViewAll={() => handleNavigateShopCategory('All')}
          />

          {/* Artisanal Heritage Banner (Same to Same Banner Format with Shop Now Button Only) */}
          <HeritageBannerSection
            title="ORGANIC & COLD-PRESSED HARVESTS"
            onShopNow={() => handleNavigateShopCategory('All')}
          />

          {/* 3. Unique Products — Artisanal Highlights (Rich Olive Tint) */}
          <UniqueProductsSection
            products={uniqueProducts}
            onSelectProduct={handleOpenProductDetail}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            onViewAll={() => handleNavigateShopCategory('All')}
          />

          {/* Promotional Harvest Banner (Exact Reference Match: Coral Background, Tilted Bottle, Yellow Badge, Outlined Button, Right Bottles) */}
          <PromoBannerSection
            title="LATEST & SPECIAL BRANDS"
            subtitle="Cold-Pressed Potohar Extra Virgin Olive Oils & Wild Karakoram Botanicals"
            onShopNow={() => handleNavigateShopCategory('All')}
          />

          {/* 4. Best Sellers — Orchard Favorites (White) */}
          <FeaturedProductsSection
            title="Orchard & Pantry Best Sellers"
            subtitle="Our most loved cold-pressed oils, wild sidr honeys, and handcrafted seasonal infusions."
            products={bestSellers}
            onSelectProduct={handleOpenProductDetail}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            onViewAll={() => handleNavigateShopCategory('All')}
          />

          {/* 5. Customer Testimonials (Warm Sand) */}
          <TestimonialsSection />

          {/* 6. From Our Blog — Orchard Journal (White) */}
          <FromOurBlogSection
            posts={blogs}
            onSelectPost={handleOpenBlogDetail}
            onViewAllBlogs={() => handleSelectNav('BLOGS')}
          />

          {/* 7. Partner Brands & Certified Estates Logo Strip */}
          <PartnerLogosStrip
            onSelectBrand={(brand) => handleNavigateShopCategory('All', brand)}
            className="py-10 sm:py-14"
          />

          {/* 8. Newsletter — Stay in the Grove (Dark Forest Green) */}
          <NewsletterSection />
        </>
      ) : (
        <div className="pt-6 sm:pt-8">
          <React.Suspense fallback={<PageSkeleton />}>
          {currentView === 'shop' ? (
            <ShopPage
              key={`${shopInitialCategory}-${shopInitialSubcategory}-${selectedBrand}`}
              wishlistIds={wishlistIds}
              onToggleWishlist={handleToggleWishlist}
              selectedBrand={selectedBrand}
              initialCategory={shopInitialCategory}
              initialSubcategory={shopInitialSubcategory}
              onClearBrand={() => setSelectedBrand('All Brands')}
              onAddToCart={handleAddToCart}
              onSelectProduct={handleOpenProductDetail}
              onNavigateHome={() => handleSelectNav('HOME')}
            />
          ) : currentView === 'about' ? (
            <AboutUsPage
              brands={BRANDS}
              onNavigateHome={() => handleSelectNav('HOME')}
              onNavigateShop={(brandName) => handleNavigateShopCategory('All', brandName ?? 'All Brands')}
              onNavigateContact={() => handleSelectNav('CONTACT US')}
            />
          ) : currentView === 'blogs' ? (
            <BlogsPage
              posts={blogs}
              onSelectPost={handleOpenBlogDetail}
              onNavigateHome={() => handleSelectNav('HOME')}
              onNavigateShop={() => handleSelectNav('SHOP')}
            />
          ) : currentView === 'blog-detail' && selectedPost ? (
            <BlogDetailPage
              key={selectedPost.id}
              post={selectedPost}
              relatedPosts={blogs.filter((p) => p.id !== selectedPost.id)}
              featuredProducts={featuredGrid}
              onSelectPost={handleOpenBlogDetail}
              onSelectProduct={handleOpenProductDetail}
              onAddToCart={handleAddToCart}
              onNavigateHome={() => handleSelectNav('HOME')}
              onNavigateBlogs={() => handleSelectNav('BLOGS')}
              onNavigateShop={() => handleSelectNav('SHOP')}
            />
          ) : currentView === 'contact' ? (
            <ContactUsPage
              onNavigateHome={() => handleSelectNav('HOME')}
              onNavigateShop={() => handleSelectNav('SHOP')}
            />
          ) : currentView === 'wishlist' ? (
            <WishlistPage
              items={wishlist}
              recommendedProducts={featuredGrid}
              onToggleWishlist={handleToggleWishlist}
              onClearWishlist={() => setWishlist([])}
              onMoveAllToCart={handleMoveAllWishlistToCart}
              onAddToCart={handleAddToCart}
              onSelectProduct={handleOpenProductDetail}
              onNavigateHome={() => handleSelectNav('HOME')}
              onNavigateShop={() => handleSelectNav('SHOP')}
            />
          ) : currentView === 'order-tracking' ? (
            <OrderTrackingPage
              placedOrders={placedOrders}
              initialOrderId={trackingInitialOrderId}
              onNavigateHome={() => handleSelectNav('HOME')}
              onNavigateShop={() => handleSelectNav('SHOP')}
              onNavigateShipping={() => {
                setCurrentView('shipping');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateContact={() => handleSelectNav('CONTACT US')}
            />
          ) : currentView === 'cart' ? (
            <CartPage
              items={cart}
              recommendedProducts={featuredGrid}
              subtotal={subtotal}
              shippingFee={shippingFee}
              orderTotal={orderTotal}
              onUpdateQty={handleUpdateQty}
              onRemoveItem={handleRemoveItem}
              onAddToCart={handleAddToCart}
              onSelectProduct={handleOpenProductDetail}
              onProceedToCheckout={() => {
                setCurrentView('checkout');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateHome={() => handleSelectNav('HOME')}
              onNavigateShop={() => handleSelectNav('SHOP')}
            />
          ) : currentView === 'checkout' ? (
            <CheckoutPage
              items={cart}
              subtotal={subtotal}
              shippingFee={shippingFee}
              onPlaceOrder={({ name, phone, city, address, paymentMethod, finalTotal, orderReference }) => {
                const code = orderReference || `ZP-${Math.floor(1000 + Math.random() * 9000)}`;
                const newOrder: PlacedOrder = {
                  id: code,
                  customerName: name,
                  city,
                  total: finalTotal,
                  itemCount: totalItems,
                  status: `${paymentMethod} — Preparing Cold-Packed Parcel at Islamabad Hub`,
                };
                setPlacedOrders((prev) => [newOrder, ...prev]);
                setCustomerName(name);
                setCustomerPhone(phone);
                setCustomerCity(city);
                setCustomerAddress(address);
                setConfirmedOrderId(code);
                setCart([]);
                return code;
              }}
              onTrackOrder={handleOpenTrackOrder}
              onNavigateHome={() => handleSelectNav('HOME')}
              onNavigateCart={() => {
                setCurrentView('cart');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateShop={() => handleSelectNav('SHOP')}
            />
          ) : currentView === 'shipping' ? (
            <ShippingPolicyPage
              onNavigateHome={() => handleSelectNav('HOME')}
              onNavigateShop={() => handleSelectNav('SHOP')}
              onNavigateContact={() => handleSelectNav('CONTACT US')}
            />
          ) : currentView === 'product' && selectedProduct ? (
            <ProductDetailPage
              key={selectedProduct.id}
              product={selectedProduct}
              galleryImages={
                selectedProduct.galleryImages && selectedProduct.galleryImages.length > 0
                  ? selectedProduct.galleryImages
                  : [selectedProduct.image, ...featuredGrid.map((p) => p.image)]
              }
              relatedProducts={
                allProducts.length > 0
                  ? allProducts.filter((p) => p.id !== selectedProduct.id).slice(0, 4)
                  : featuredGrid.filter((p) => p.id !== selectedProduct.id)
              }
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              isWishlisted={wishlistIds.includes(selectedProduct.id)}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={handleOpenProductDetail}
              onNavigateHome={() => handleSelectNav('HOME')}
              onNavigateShop={handleNavigateShopCategory}
            />
          ) : null}
          </React.Suspense>
        </div>
      )}

      {/* Site Footer */}
      <Footer
        onNavigateHome={() => handleSelectNav('HOME')}
        onNavigateAbout={() => handleSelectNav('ABOUT US')}
        onNavigateShop={(category) => handleNavigateShopCategory(category)}
        onNavigateBlogs={() => handleSelectNav('BLOGS')}
        onNavigateContact={() => handleSelectNav('CONTACT US')}
        onNavigateWishlist={() => {
          setCartOpen(false);
          setCurrentView('wishlist');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateCart={() => {
          setCartOpen(false);
          setCurrentView('cart');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateShipping={() => {
          setCartOpen(false);
          setCurrentView('shipping');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onScrollToSection={(sectionId) => {
          setActiveNav('HOME');
          setCurrentView('home');
          setTimeout(() => {
            document
              .getElementById(sectionId)
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 40);
        }}
        onOpenAccount={() => handleOpenTrackOrder(placedOrders[0]?.id ?? '')}
      />

      {/* Shopping Bag Slide-Over Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-full max-w-[420px] bg-white h-full flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-[#EAEAEA] flex items-center justify-between">
              <h2 className="text-[14px] uppercase tracking-[0.08em] font-semibold">
                {checkoutStep === 'bag'
                  ? `Shopping Bag (${totalItems})`
                  : checkoutStep === 'checkout'
                  ? 'Cash on Delivery Details'
                  : 'Order Confirmed'}
              </h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close shopping bag"
                className="p-1.5 text-[#444444] hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {checkoutStep === 'confirmed' ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-11 h-11 mx-auto rounded-full bg-[#EEF5EB] text-[#1D5A2A] flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif-brand text-[22px] text-[#181818]">
                    Thank you, {customerName}
                  </h3>
                  <p className="text-[13.5px] text-[#555555]">
                    Order <strong className="text-[#181818]">{confirmedOrderId}</strong> is
                    confirmed for Cash on Delivery to {customerCity}.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false);
                      setCheckoutStep('bag');
                    }}
                    className="mt-4 px-6 py-2.5 bg-[#224D26] text-white text-[12px] uppercase tracking-[0.06em] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <p className="text-[14.5px] text-[#555555]">Your shopping bag is empty.</p>
                </div>
              ) : checkoutStep === 'bag' ? (
                <div className="space-y-5">
                  <div className="p-3 bg-[#F6F9F4] border border-[#DCEAD5] text-[12.5px] text-[#1D5A2A]">
                    {subtotal >= 1200
                      ? 'Your order qualifies for Free Shipping across Pakistan!'
                      : `Add ${formatPKR(1200 - subtotal)} more for Free Shipping across Pakistan.`}
                  </div>

                  {cart.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex gap-4 pb-5 border-b border-[#F0F0F0]"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 object-cover bg-[#F5F4F0] border border-[#EAEAEA] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.05em] text-[#666666]">
                          {product.brand}
                        </p>
                        <h4 className="text-[14px] font-medium text-[#181818] truncate">
                          {product.name}
                        </h4>
                        <p className="text-[13px] text-[#444444] tabular-nums mt-0.5">
                          {formatPKR(product.price)}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="inline-flex items-center border border-[#D4D4D4]">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(product.id, -1)}
                              aria-label="Decrease quantity"
                              className="p-1.5 hover:bg-[#F5F5F5] cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-[13px] tabular-nums">{quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(product.id, 1)}
                              aria-label="Increase quantity"
                              className="p-1.5 hover:bg-[#F5F5F5] cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(product.id)}
                            aria-label="Remove item"
                            className="p-1 text-[#777777] hover:text-[#181818] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <form id="cod-checkout-form" onSubmit={handleConfirmOrder} className="space-y-4">
                  {drawerError && (
                    <div className="p-3 bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] text-[12.5px]">
                      {drawerError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[12px] uppercase tracking-[0.05em] text-[#444444] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Ayesha Khan"
                      className="w-full border border-[#D4D4D4] px-3 py-2 text-[13.5px] focus:outline-none focus:border-[#224D26]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] uppercase tracking-[0.05em] text-[#444444] mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="03XX-XXXXXXX"
                      className="w-full border border-[#D4D4D4] px-3 py-2 text-[13.5px] focus:outline-none focus:border-[#224D26]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] uppercase tracking-[0.05em] text-[#444444] mb-1">
                      City
                    </label>
                    <select
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      className="w-full border border-[#D4D4D4] px-3 py-2 text-[13.5px] bg-white focus:outline-none focus:border-[#224D26]"
                    >
                      <option>Lahore</option>
                      <option>Karachi</option>
                      <option>Islamabad</option>
                      <option>Rawalpindi</option>
                      <option>Peshawar</option>
                      <option>Multan</option>
                      <option>Faisalabad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] uppercase tracking-[0.05em] text-[#444444] mb-1">
                      Delivery Address
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="House, street, sector or block"
                      className="w-full border border-[#D4D4D4] px-3 py-2 text-[13.5px] focus:outline-none focus:border-[#224D26]"
                    />
                  </div>
                </form>
              )}
            </div>

            {cart.length > 0 && checkoutStep !== 'confirmed' && (
              <div className="px-6 py-5 border-t border-[#EAEAEA] bg-[#FAF9F6] space-y-3">
                <div className="flex justify-between text-[13px] text-[#555555] tabular-nums">
                  <span>Subtotal</span>
                  <span>{formatPKR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[13px] text-[#555555] tabular-nums">
                  <span>Shipping</span>
                  <span>{shippingFee === 0 ? 'Free' : formatPKR(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-[15px] font-semibold text-[#181818] pt-2 border-t border-[#E5E3DC] tabular-nums">
                  <span>Total (COD)</span>
                  <span>{formatPKR(orderTotal)}</span>
                </div>
                {checkoutStep === 'bag' ? (
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCartOpen(false);
                        setCurrentView('cart');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full py-2.5 border border-[#181818] bg-white hover:bg-[#181818] hover:text-white text-[#181818] text-[12px] uppercase tracking-[0.08em] font-medium transition-colors cursor-pointer"
                    >
                      View Full Cart Page
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCartOpen(false);
                        setCheckoutStep('bag');
                        setCurrentView('checkout');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full py-3 bg-[#224D26] hover:bg-[#193A1C] text-white text-[12.5px] uppercase tracking-[0.08em] font-medium transition-colors cursor-pointer"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('bag')}
                      className="px-4 py-3 border border-[#D4D4D4] bg-white text-[12px] uppercase tracking-[0.06em] cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      form="cod-checkout-form"
                      disabled={drawerSubmitting}
                      className="flex-1 py-3 bg-[#224D26] hover:bg-[#193A1C] disabled:bg-[#888888] text-white text-[12.5px] uppercase tracking-[0.08em] font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      {drawerSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Confirming...</span>
                        </>
                      ) : (
                        <span>Confirm Order</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
