import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductDetailPage } from '../components/ProductDetailPage';
import { useStore } from '../context/StoreContext';
import { fetchProductById } from '../services/api';
import { Product } from '../data/storeData';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const ProductDetailRoutePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wishlistIds, toggleWishlist, addToCart } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchProductById(id)
      .then((res) => {
        if (!isMounted) return;
        setProduct(res.product);
        setRelatedProducts(res.relatedProducts || []);
        setGalleryImages(
          res.product?.galleryImages && res.product.galleryImages.length > 0
            ? res.product.galleryImages
            : res.product?.image
            ? [res.product.image]
            : []
        );
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load product details:', err);
        setError('This product could not be found or has been discontinued.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#15472B] animate-spin" />
        <p className="text-sm text-[#475569] font-medium">Fetching cold-pressed batch verification...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="w-full min-h-[50vh] max-w-[1240px] mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#15472B]">Product Not Available</h2>
        <p className="text-sm text-[#64748B] max-w-md mx-auto">
          {error || 'We could not locate this harvest record.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xs bg-[#15472B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0E341E] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Harvest Shop
        </button>
      </div>
    );
  }

  const isWishlisted = wishlistIds.includes(product.id);

  return (
    <ProductDetailPage
      product={product}
      relatedProducts={relatedProducts}
      galleryImages={galleryImages}
      isWishlisted={isWishlisted}
      onToggleWishlist={toggleWishlist}
      onAddToCart={(prod, qty) => addToCart(prod, qty)}
      onBuyNow={(prod, qty) => {
        addToCart(prod, qty);
        navigate('/checkout');
      }}
      onSelectProduct={(prod) => navigate(`/product/${prod.slug || prod.id}`)}
      onNavigateHome={() => navigate('/')}
      onNavigateShop={(cat) =>
        navigate(cat && cat !== 'All' ? `/shop?category=${encodeURIComponent(cat)}` : '/shop')
      }
    />
  );
};

export default ProductDetailRoutePage;
