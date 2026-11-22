import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { HERO_SLIDES, BlogPost, Product } from '../data/storeData';
import {
<<<<<<< HEAD
  fetchHomeSections,
=======
  BRANDS,
  HERO_SLIDES,
  BlogPost,
  Product,
} from '../data/storeData'; 
import {
  fetchProducts,
>>>>>>> 21a32c4 (create the branding)
  fetchBlogs,
  fetchCategories,
  CategoryItem,
} from '../services/api';
import { useStore } from '../context/StoreContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { wishlistIds, toggleWishlist, addToCart } = useStore();

  // Live backend section data
  const [featuredGrid, setFeaturedGrid] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [uniqueProducts, setUniqueProducts] = useState<Product[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CategoryItem[]>([]);

  // Consolidated home sections fetch with in-memory TTL caching
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    fetchHomeSections({ signal: abortController.signal })
      .then((res) => {
        if (isMounted) {
          setFeaturedGrid(res.featuredGrid);
          setBestSellers(res.bestSellers);
          setUniqueProducts(res.uniqueProducts);
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

  const handleNavigateShopCategory = (categoryName = 'All', brandName = 'All Brands') => {
    let url = `/shop?category=${encodeURIComponent(categoryName)}`;
    if (brandName && brandName !== 'All Brands') {
      url += `&brand=${encodeURIComponent(brandName)}`;
    }
    navigate(url);
  };

  const handleOpenProductDetail = (product: Product) => {
    navigate(`/product/${product.slug || product.id}`);
  };

  const handleOpenBlogDetail = (post: BlogPost) => {
<<<<<<< HEAD
    navigate(`/blogs/${post.slug || post.id}`);
=======
    setSelectedPost(post);
    setActiveNav('BLOGS');
    setCurrentView('blog-detail');
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateShopCategory = (category?: string, brand?: string) => {
    setShopInitialCategory(category ?? 'All');
    setSelectedBrand(brand ?? 'All Brands');
    setActiveNav('SHOP');
    setCurrentView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const productKey = product.variantKey || product.id;
      const existing = prev.find(
        (item) => (item.product.variantKey || item.product.id) === productKey
      );
      if (existing) {
        return prev.map((item) =>
          (item.product.variantKey || item.product.id) === productKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setCheckoutStep('bag');
    setSearchOpen(false);
    setCartOpen(true);
  };

  const handleBuyNow = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const productKey = product.variantKey || product.id;
      const existing = prev.find(
        (item) => (item.product.variantKey || item.product.id) === productKey
      );
      if (existing) {
        return prev.map((item) =>
          (item.product.variantKey || item.product.id) === productKey
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
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          (item.product.variantKey || item.product.id) === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) =>
      prev.filter((item) => (item.product.variantKey || item.product.id) !== productId)
    );
  };

  const handleChangeCartVariant = (
    currentProduct: Product,
    variant: NonNullable<Product['variants']>[number]
  ) => {
    if (!variant.isActive) return;

    setCart((prev) => {
      const sourceKey = currentProduct.variantKey || currentProduct.id;
      const sourceItem = prev.find(
        (item) => (item.product.variantKey || item.product.id) === sourceKey
      );
      if (!sourceItem) return prev;

      const changedProduct: Product = {
        ...sourceItem.product,
        variantKey: `${sourceItem.product.mongoId || sourceItem.product.id}::${variant.label}`,
        size: variant.label,
        price: variant.price,
        originalPrice: variant.originalPrice,
        stock: variant.stock,
      };
      const targetKey = changedProduct.variantKey || changedProduct.id;

      const remaining = prev.filter(
        (item) => (item.product.variantKey || item.product.id) !== sourceKey
      );
      const targetItem = remaining.find(
        (item) => (item.product.variantKey || item.product.id) === targetKey
      );

      if (targetItem) {
        return remaining.map((item) =>
          (item.product.variantKey || item.product.id) === targetKey
            ? { ...item, quantity: item.quantity + sourceItem.quantity }
            : item
        );
      }

      return [...remaining, { product: changedProduct, quantity: sourceItem.quantity }];
    });
  };

  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      }
      return [product, ...prev];
    });
  };

  const handleMoveAllWishlistToCart = () => {
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
  };

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
          size: it.product.size,
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

  const handleOpenTrackOrder = (orderId = '') => {
    setCartOpen(false);
    setSearchOpen(false);
    setTrackingInitialOrderId(orderId.trim().toUpperCase());
    setCurrentView('order-tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
>>>>>>> 21a32c4 (create the branding)
  };

  return (
    <div className="w-full">
      {/* 1. Hero Banner Carousel */}
      <HeroSection
        slides={HERO_SLIDES}
        onSlideAction={(slide) => {
          handleNavigateShopCategory('All', slide.brandFilter);
        }}
      />

      {/* 2. Our Story — Brand Heritage (White) */}
      <OurStorySection />

      {/* 3. Top Categories Showcase */}
      <CategoriesSection
        categories={catalogCategories}
        onSelectCategory={(catName) => handleNavigateShopCategory(catName)}
        onViewAll={() => handleNavigateShopCategory('All')}
      />

      {/* 4. Featured Grid — Hand-Harvested Pantry Products (Light Sand) */}
      <FeaturedProductsSection
        title="Featured Pantry Selections"
        subtitle="Cold-pressed single varietal extra virgins, raw forest honeys, whole aromatic spices and wild-harvested botanicals."
        products={featuredGrid}
        onSelectProduct={handleOpenProductDetail}
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        wishlistIds={wishlistIds}
        onViewAll={() => handleNavigateShopCategory('All')}
      />

      {/* 5. Artisanal Heritage Banner */}
      <HeritageBannerSection
        title="ORGANIC & COLD-PRESSED HARVESTS"
        onShopNow={() => handleNavigateShopCategory('All')}
      />

<<<<<<< HEAD
      {/* 6. Unique Products — Artisanal Highlights (Rich Olive Tint) */}
      <UniqueProductsSection
        products={uniqueProducts}
        onSelectProduct={handleOpenProductDetail}
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        wishlistIds={wishlistIds}
        onViewAll={() => handleNavigateShopCategory('All')}
      />
=======
                  {cart.map(({ product, quantity }) => (
                    <div
                      key={product.variantKey || product.id}
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
                        <p className="text-[12px] text-[#777777] mt-0.5">
                          Size: {product.size}
                        </p>
                        {(product.variants || []).some((variant) => variant.isActive) && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {(product.variants || [])
                              .filter((variant) => variant.isActive)
                              .map((variant) => {
                                const selected = product.size === variant.label;
                                return (
                                  <button
                                    key={variant.label}
                                    type="button"
                                    disabled={variant.stock <= 0}
                                    onClick={() => handleChangeCartVariant(product, variant)}
                                    className={`border px-2 py-1 text-[10.5px] leading-tight transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                                      selected
                                        ? 'border-[#15472B] bg-[#15472B] text-white'
                                        : 'border-[#D4D4D4] bg-white text-[#333333] hover:border-[#15472B]'
                                    }`}
                                  >
                                    <span className="block font-semibold">{variant.label}</span>
                                    <span className="block tabular-nums">
                                      {formatPKR(variant.price)}
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        )}
                        <p className="text-[13px] text-[#444444] tabular-nums mt-0.5">
                          {formatPKR(product.price)}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="inline-flex items-center border border-[#D4D4D4]">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQty(product.variantKey || product.id, -1)
                              }
                              aria-label="Decrease quantity"
                              className="p-1.5 hover:bg-[#F5F5F5] cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-[13px] tabular-nums">{quantity}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQty(product.variantKey || product.id, 1)
                              }
                              aria-label="Increase quantity"
                              className="p-1.5 hover:bg-[#F5F5F5] cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveItem(product.variantKey || product.id)
                            }
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
>>>>>>> 21a32c4 (create the branding)

      {/* 7. Promotional Harvest Banner */}
      <PromoBannerSection
        title="LATEST & SPECIAL BRANDS"
        subtitle="Cold-Pressed Potohar Extra Virgin Olive Oils & Wild Karakoram Botanicals"
        onShopNow={() => handleNavigateShopCategory('All')}
      />

      {/* 8. Best Sellers — Orchard Favorites (White) */}
      <FeaturedProductsSection
        title="Orchard & Pantry Best Sellers"
        subtitle="Our most loved cold-pressed oils, wild sidr honeys, and handcrafted seasonal infusions."
        products={bestSellers}
        onSelectProduct={handleOpenProductDetail}
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        wishlistIds={wishlistIds}
        onViewAll={() => handleNavigateShopCategory('All')}
      />

      {/* 9. Customer Testimonials (Warm Sand) */}
      <TestimonialsSection />

      {/* 10. From Our Blog — Orchard Journal (White) */}
      <FromOurBlogSection
        posts={blogs}
        onSelectPost={handleOpenBlogDetail}
        onViewAllBlogs={() => navigate('/blogs')}
      />

      {/* 11. Partner Brands & Certified Estates Logo Strip */}
      <PartnerLogosStrip
        onSelectBrand={(brand) => handleNavigateShopCategory('All', brand)}
        className="py-10 sm:py-14"
      />

      {/* 12. Newsletter — Stay in the Grove (Dark Forest Green) */}
      <NewsletterSection />
    </div>
  );
};

export default HomePage;
