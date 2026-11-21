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
  fetchHomeSections,
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
    navigate(`/blogs/${post.slug || post.id}`);
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

      {/* 6. Unique Products — Artisanal Highlights (Rich Olive Tint) */}
      <UniqueProductsSection
        products={uniqueProducts}
        onSelectProduct={handleOpenProductDetail}
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        wishlistIds={wishlistIds}
        onViewAll={() => handleNavigateShopCategory('All')}
      />

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
