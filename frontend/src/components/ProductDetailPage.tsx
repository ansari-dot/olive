import React, { useState, useMemo, useEffect } from 'react';
import { Check, Heart, Share2, ShoppingCart, Loader2 } from 'lucide-react';
import { Product } from '../data/storeData';
import {
  fetchProductById,
  submitProductReview,
  ProductDetailResponse,
} from '../services/api';

interface ProductDetailPageProps {
  product: Product;
  relatedProducts?: Product[];
  galleryImages?: string[];
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow?: (product: Product, quantity: number) => void;
  onSelectProduct: (product: Product) => void;
  onNavigateHome: () => void;
  onNavigateShop: (category?: string) => void;
}

interface DisplayReviewItem {
  id: string;
  author: string;
  date: string;
  rating: number;
  comment: string;
}

const formatPKR = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`;

const StarRating: React.FC<{ rating?: number; size?: 'sm' | 'md' }> = ({
  rating = 4,
  size = 'md',
}) => {
  const dim = size === 'sm' ? 'w-[12px] h-[12px]' : 'w-[14px] h-[14px]';
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Rated ${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rating;
        return (
          <svg
            key={star}
            viewBox="0 0 16 16"
            className={`${dim} text-[#C46B3B]`}
            fill={filled ? 'currentColor' : 'none'}
            aria-hidden="true"
          >
            <path
              d="M8 1.4L9.95 5.35L14.3 5.98L11.15 9.05L11.89 13.38L8 11.33L4.11 13.38L4.85 9.05L1.7 5.98L6.05 5.35L8 1.4Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
};

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product: initialProduct,
  relatedProducts: initialRelated = [],
  galleryImages: initialGallery = [],
  isWishlisted = false,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  onNavigateHome,
  onNavigateShop,
}) => {
  const [product, setProduct] = useState<Product>(initialProduct);
  const [relatedList, setRelatedList] = useState<Product[]>(initialRelated);
  const [reviewsList, setReviewsList] = useState<DisplayReviewItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  const [activeThumbIndex, setActiveThumbIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'additional' | 'reviews'>('description');
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Review Form state
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessNotice, setReviewSuccessNotice] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Fetch live product details and reviews from backend
  useEffect(() => {
    let isMounted = true;
    const fetchTargetId = initialProduct.id || initialProduct.slug;
    if (!fetchTargetId) return;

    setLoadingDetails(true);
    fetchProductById(fetchTargetId)
      .then((data: ProductDetailResponse) => {
        if (!isMounted) return;
        setProduct(data.product);
        if (data.relatedProducts && data.relatedProducts.length > 0) {
          setRelatedList(data.relatedProducts);
        }
        if (data.reviews && data.reviews.length > 0) {
          const mappedReviews: DisplayReviewItem[] = data.reviews.map((r) => ({
            id: r._id || r.id || String(Math.random()),
            author: r.city ? `${r.author} · ${r.city}` : r.author,
            date: r.createdAt
              ? new Date(r.createdAt).toLocaleDateString('en-PK', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recent',
            rating: r.rating,
            comment: r.comment,
          }));
          setReviewsList(mappedReviews);
        }
      })
      .catch((err) => {
        console.error('Failed to load full product detail:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingDetails(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialProduct.id, initialProduct.slug]);

  const thumbnails = useMemo(() => {
    const gallery = product.galleryImages && product.galleryImages.length > 0
      ? product.galleryImages
      : initialGallery;
    const deduped = [product.image, ...gallery.filter((img) => img !== product.image)];
    return deduped.slice(0, 5);
  }, [product.image, product.galleryImages, initialGallery]);

  const mainImage = thumbnails[activeThumbIndex] ?? product.image;

  const handleCopyShare = (platform: string) => {
    const shareText = `${product.name} — Zaitoon Pakistan (${formatPKR(product.price)})`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }
    setCopiedNotice(`Link copied for ${platform}`);
    window.setTimeout(() => setCopiedNotice(null), 2500);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAuthor = reviewAuthor.trim();
    const cleanComment = reviewComment.trim();
    if (!cleanAuthor || !cleanComment) return;

    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccessNotice(null);

    try {
      const targetId = product.mongoId || product.id;
      const res = await submitProductReview(targetId, {
        author: cleanAuthor,
        rating: reviewRating,
        comment: cleanComment,
      });

      const newReviewItem: DisplayReviewItem = {
        id: res.review?._id || res.review?.id || `rev-${Date.now()}`,
        author: cleanAuthor,
        date: 'Today',
        rating: reviewRating,
        comment: cleanComment,
      };

      setReviewsList((prev) => [newReviewItem, ...prev]);
      setReviewAuthor('');
      setReviewRating(5);
      setReviewComment('');
      setReviewSuccessNotice('Thank you! Your harvest review has been submitted.');
      setTimeout(() => setReviewSuccessNotice(null), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit review';
      setReviewError(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <main className="w-full bg-white py-10 sm:py-12 lg:py-14">
      <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Top Breadcrumb: Home / Category / Product Name */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 text-[12.5px] text-[#777777] flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-[#181818] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            onClick={() => onNavigateShop(product.category)}
            className="hover:text-[#181818] transition-colors cursor-pointer"
          >
            {product.category}
          </button>
          <span aria-hidden="true">/</span>
          <span className="text-[#444444]">{product.name}</span>
        </nav>

        {/* Upper 2-Column Gallery + Contiguous Purchase Module */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Gallery: Vertical Thumbnail Strip + Large Main Studio Frame */}
          <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnail Strip */}
            <div className="flex sm:flex-col gap-3 sm:w-[78px] shrink-0 overflow-x-auto sm:overflow-visible">
              {thumbnails.map((imgSrc, idx) => {
                const isSelected = idx === activeThumbIndex;
                return (
                  <button
                    key={`${product.id}-thumb-${idx}`}
                    type="button"
                    onClick={() => setActiveThumbIndex(idx)}
                    aria-label={`View image ${idx + 1} of ${product.name}`}
                    className={`w-[68px] sm:w-full aspect-square bg-[#FAF3F0] overflow-hidden shrink-0 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#181818]'
                        : 'border-transparent hover:border-[#CCCCCC]'
                    }`}
                  >
                    <img
                      src={imgSrc}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>

            {/* Main Large Image Container */}
            <div className="relative flex-1 aspect-[3/3.65] bg-[#FAF3F0] overflow-hidden">
              {product.isSale ? (
                <span className="absolute top-0 left-0 z-10 bg-[#C46B3B] text-white text-[12px] font-medium leading-none px-3.5 py-2">
                  Sale
                </span>
              ) : (
                <span className="absolute top-0 left-0 z-10 bg-[#7E8F5B] text-white text-[12px] font-medium leading-none px-3.5 py-2">
                  New
                </span>
              )}

              {!brokenImages[mainImage] ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setBrokenImages((prev) => ({ ...prev, [mainImage]: true }))
                  }
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8 text-center text-[#15472B]">
                  <span className="font-serif-brand text-xl">{product.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Purchase Details Module */}
          <div className="lg:col-span-6">
            <h1 className="text-[32px] sm:text-[38px] lg:text-[42px] font-normal tracking-[-0.01em] text-[#111111] leading-tight">
              {product.name}
            </h1>

            {/* Rating + Review Link */}
            <div className="mt-2.5 flex items-center gap-2.5">
              <StarRating rating={product.rating ?? 5} />
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className="text-[12.5px] text-[#666666] hover:text-[#181818] cursor-pointer tabular-nums"
              >
                ({reviewsList.length} customer {reviewsList.length === 1 ? 'review' : 'reviews'})
              </button>
            </div>

            {/* Price Row */}
            <div className="mt-4 flex items-baseline gap-3 text-[22px] font-medium tabular-nums">
              {product.originalPrice ? (
                <>
                  <span className="text-[#888888] line-through text-[18px]">
                    {formatPKR(product.originalPrice)}
                  </span>
                  <span className="text-[#C46B3B]">{formatPKR(product.price)}</span>
                </>
              ) : (
                <span className="text-[#181818]">{formatPKR(product.price)}</span>
              )}
              <span className="text-[12px] font-normal uppercase tracking-[0.06em] text-[#7E8F5B]">
                Tax Included · Nationwide COD
              </span>
            </div>

            {/* Editorial Description */}
            <p className="mt-4 text-[14.5px] text-[#555555] leading-relaxed">
              {product.description}
            </p>

            {/* Key Quality Callouts - Dynamic from Admin Panel */}
            <div className="mt-5 grid grid-cols-2 gap-3 text-[12.5px] text-[#333333]">
              {product.origin && (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15472B]" />
                  <span>Harvest Origin: {product.origin}</span>
                </div>
              )}
              {product.size && (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15472B]" />
                  <span>Package Size: {product.size}</span>
                </div>
              )}
              {product.extractionMethod && (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15472B]" />
                  <span>Extraction: {product.extractionMethod}</span>
                </div>
              )}
              {product.acidityLevel && (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15472B]" />
                  <span>Acidity Level: {product.acidityLevel}</span>
                </div>
              )}
              {product.flavour && (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15472B]" />
                  <span>Flavour: {product.flavour}</span>
                </div>
              )}
              {product.harvestDate && (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15472B]" />
                  <span>Harvest Batch: {product.harvestDate}</span>
                </div>
              )}
              {product.isOrganic && (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15472B]" />
                  <span className="text-[#15472B] font-semibold">100% Certified Organic</span>
                </div>
              )}
            </div>

            {/* Quantity Selector + Add to Cart + Buy Now Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
              <div className="inline-flex items-center border border-[#181818] bg-white h-[48px] self-start">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-[#444444] hover:text-[#181818] text-[16px] cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="px-4 text-[14px] font-medium tabular-nums min-w-[32px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-2 text-[#444444] hover:text-[#181818] text-[16px] cursor-pointer"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => onAddToCart(product, quantity)}
                className="flex-1 h-[48px] bg-[#181818] hover:bg-[#15472B] text-white text-[12px] font-semibold uppercase tracking-[0.09em] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Bag</span>
              </button>

              {onBuyNow && (
                <button
                  type="button"
                  onClick={() => onBuyNow(product, quantity)}
                  className="flex-1 h-[48px] bg-[#C46B3B] hover:bg-[#a6572e] text-white text-[12px] font-semibold uppercase tracking-[0.09em] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Buy Now (COD)</span>
                </button>
              )}

              {onToggleWishlist && (
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product)}
                  aria-label={
                    isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'
                  }
                  className={`h-[48px] px-4 border border-[#181818] flex items-center justify-center transition-colors cursor-pointer ${
                    isWishlisted
                      ? 'bg-[#181818] text-white'
                      : 'bg-white text-[#181818] hover:bg-[#F5F5F5]'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`}
                  />
                </button>
              )}
            </div>

            {/* Social Sharing */}
            <div className="mt-8 pt-6 border-t border-[#EAEAEA] flex items-center gap-4 text-[12px] text-[#666666]">
              <span className="flex items-center gap-1.5 uppercase tracking-[0.08em] font-medium text-[#181818]">
                <Share2 className="w-3.5 h-3.5" />
                Share:
              </span>
              <button
                type="button"
                onClick={() => handleCopyShare('WhatsApp')}
                className="hover:text-[#15472B] cursor-pointer"
              >
                WhatsApp
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleCopyShare('Facebook')}
                className="hover:text-[#15472B] cursor-pointer"
              >
                Facebook
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleCopyShare('Copy Link')}
                className="hover:text-[#15472B] cursor-pointer"
              >
                Copy Link
              </button>
              {copiedNotice && (
                <span className="text-[#15472B] font-medium ml-2">{copiedNotice}</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabbed Description / Additional Information / Reviews Section */}
        <div className="mt-16 lg:mt-20">
          <div
            role="tablist"
            aria-label="Product details tabs"
            className="border-b border-[#E5E5E5] flex flex-wrap items-center gap-7 sm:gap-9"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'description'}
              onClick={() => setActiveTab('description')}
              className={`pb-3.5 text-[15px] transition-colors cursor-pointer relative ${
                activeTab === 'description'
                  ? 'text-[#111111] font-normal after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[1.5px] after:bg-[#C46B3B]'
                  : 'text-[#666666] hover:text-[#111111]'
              }`}
            >
              Description
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'additional'}
              onClick={() => setActiveTab('additional')}
              className={`pb-3.5 text-[15px] transition-colors cursor-pointer relative ${
                activeTab === 'additional'
                  ? 'text-[#111111] font-normal after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[1.5px] after:bg-[#C46B3B]'
                  : 'text-[#666666] hover:text-[#111111]'
              }`}
            >
              Additional information
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'reviews'}
              onClick={() => setActiveTab('reviews')}
              className={`pb-3.5 text-[15px] transition-colors cursor-pointer relative tabular-nums ${
                activeTab === 'reviews'
                  ? 'text-[#111111] font-normal after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[1.5px] after:bg-[#C46B3B]'
                  : 'text-[#666666] hover:text-[#111111]'
              }`}
            >
              Reviews ({reviewsList.length})
            </button>
          </div>

          <div className="pt-6 pb-4">
            {activeTab === 'description' && (
              <div className="space-y-4 text-[14px] leading-[1.75] text-[#666666] max-w-[98ch]">
                {product.detailedDescription ? (
                  <div className="whitespace-pre-line space-y-3 text-[#555555]">
                    {product.detailedDescription.split('\n\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <p>{product.description}</p>
                )}

                {product.ingredients && (
                  <div className="mt-5 pt-4 border-t border-[#EFEFEF]">
                    <h4 className="text-[12.5px] uppercase font-bold tracking-wider text-[#181818] mb-1">
                      Ingredients &amp; Composition
                    </h4>
                    <p className="text-[13.5px] text-[#555555]">{product.ingredients}</p>
                  </div>
                )}

                {product.storageInstructions && (
                  <div className="mt-3">
                    <h4 className="text-[12.5px] uppercase font-bold tracking-wider text-[#181818] mb-1">
                      Storage &amp; Care
                    </h4>
                    <p className="text-[13.5px] text-[#555555]">{product.storageInstructions}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'additional' && (
              <div className="max-w-[680px] divide-y divide-[#EFEFEF] border-t border-b border-[#EFEFEF] text-[13.5px]">
                {product.size && (
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-medium text-[#181818]">Pack Size</span>
                    <span className="col-span-2 text-[#555555]">{product.size}</span>
                  </div>
                )}
                {product.brand && (
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-medium text-[#181818]">Brand / Estate</span>
                    <span className="col-span-2 text-[#555555]">{product.brand}</span>
                  </div>
                )}
                {product.category && (
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-medium text-[#181818]">Category</span>
                    <span className="col-span-2 text-[#555555]">
                      {product.category} {product.subcategory ? `· ${product.subcategory}` : ''}
                    </span>
                  </div>
                )}
                {product.origin && (
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-medium text-[#181818]">Origin / Terroir</span>
                    <span className="col-span-2 text-[#555555]">{product.origin}</span>
                  </div>
                )}
                {product.extractionMethod && (
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-medium text-[#181818]">Extraction</span>
                    <span className="col-span-2 text-[#555555]">{product.extractionMethod}</span>
                  </div>
                )}
                {product.acidityLevel && (
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-medium text-[#181818]">Acidity Level</span>
                    <span className="col-span-2 text-[#555555] tabular-nums">{product.acidityLevel}</span>
                  </div>
                )}
                {product.flavour && (
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-medium text-[#181818]">Flavour Profile</span>
                    <span className="col-span-2 text-[#555555]">{product.flavour}</span>
                  </div>
                )}
                {product.ingredients && (
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-medium text-[#181818]">Ingredients</span>
                    <span className="col-span-2 text-[#555555]">{product.ingredients}</span>
                  </div>
                )}
                {product.harvestDate && (
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-medium text-[#181818]">Harvest Season</span>
                    <span className="col-span-2 text-[#555555]">{product.harvestDate}</span>
                  </div>
                )}
                {product.storageInstructions && (
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-medium text-[#181818]">Storage Instructions</span>
                    <span className="col-span-2 text-[#555555]">{product.storageInstructions}</span>
                  </div>
                )}
                <div className="py-3 grid grid-cols-3 gap-4">
                  <span className="font-medium text-[#181818]">Purity Standard</span>
                  <span className="col-span-2 text-[#15472B] font-medium">
                    {product.isOrganic ? '100% Certified Organic Harvest' : 'Pure Single-Origin Harvest'}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-5">
                  {reviewsList.length === 0 ? (
                    <p className="text-[14px] text-[#666666] italic">
                      There are no customer reviews for this harvest yet. Be the first to review!
                    </p>
                  ) : (
                    reviewsList.map((rev) => (
                      <div key={rev.id} className="pb-5 border-b border-[#EFEFEF]">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[14px] font-medium text-[#181818]">
                            {rev.author}
                          </span>
                          <span className="text-[12px] text-[#777777]">{rev.date}</span>
                        </div>
                        <StarRating rating={rev.rating} size="sm" />
                        <p className="mt-2 text-[13.5px] leading-[1.65] text-[#555555]">
                          {rev.comment}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={handleSubmitReview}
                  className="lg:col-span-5 space-y-3 bg-[#FAF9F6] p-5 border border-[#EAEAEA]"
                >
                  <h3 className="text-[15px] font-medium text-[#181818]">Write a review</h3>

                  {reviewSuccessNotice && (
                    <div className="p-3 bg-[#EEF5EB] border border-[#D5EAD5] text-[#1D5A2A] text-[12.5px]">
                      {reviewSuccessNotice}
                    </div>
                  )}

                  {reviewError && (
                    <div className="p-3 bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] text-[12.5px]">
                      {reviewError}
                    </div>
                  )}

                  <input
                    type="text"
                    required
                    value={reviewAuthor}
                    onChange={(e) => setReviewAuthor(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-white border border-[#D4D4D4] px-3.5 py-2 text-[13.5px] focus:outline-none focus:border-[#15472B]"
                  />
                  <div className="flex items-center gap-2 text-[13px] text-[#555555]">
                    <span>Rating:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-[16px] cursor-pointer ${
                          star <= reviewRating ? 'text-[#C46B3B]' : 'text-[#CCCCCC]'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your tasting notes..."
                    className="w-full bg-white border border-[#D4D4D4] px-3.5 py-2 text-[13.5px] focus:outline-none focus:border-[#15472B]"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2.5 bg-[#0B0B0B] hover:bg-[#15472B] disabled:bg-[#888888] text-white text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Review</span>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Related Products 4-Column Row */}
        {relatedList.length > 0 && (
          <section aria-labelledby="related-products-heading" className="mt-14 lg:mt-16">
            <h2
              id="related-products-heading"
              className="text-[26px] sm:text-[30px] font-normal text-[#111111] mb-8"
            >
              Related products
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
              {relatedList.slice(0, 4).map((rel) => (
                <article key={rel.id} className="group flex flex-col">
                  <button
                    type="button"
                    onClick={() => onSelectProduct(rel)}
                    className="relative aspect-[3/3.55] w-full bg-[#FAF3F0] overflow-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15472B]"
                  >
                    <img
                      src={rel.image}
                      alt={rel.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                    />
                  </button>

                  <div className="mt-4 text-center">
                    <h3 className="text-[16.5px] font-normal text-[#1E1E1E] leading-snug">
                      <button
                        type="button"
                        onClick={() => onSelectProduct(rel)}
                        className="hover:text-[#15472B] transition-colors cursor-pointer"
                      >
                        {rel.name}
                      </button>
                    </h3>
                    <div className="mt-1.5 flex justify-center">
                      <StarRating rating={rel.rating ?? 4} size="sm" />
                    </div>
                    <div className="mt-1.5 flex items-center justify-center gap-2 text-[13.5px] tabular-nums">
                      {rel.originalPrice ? (
                        <>
                          <span className="text-[#777777] line-through">
                            {formatPKR(rel.originalPrice)}
                          </span>
                          <span className="text-[#C46B3B]">{formatPKR(rel.price)}</span>
                        </>
                      ) : (
                        <span className="text-[#555555]">{formatPKR(rel.price)}</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};
