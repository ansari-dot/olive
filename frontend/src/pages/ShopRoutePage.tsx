import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShopPage } from '../components/ShopPage';
import { useStore } from '../context/StoreContext';
import { Product } from '../data/storeData';

export const ShopRoutePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { wishlistIds, toggleWishlist, addToCart } = useStore();

  const category = searchParams.get('category') || 'All';
  const subcategory = searchParams.get('subcategory') || 'All';
  const brand = searchParams.get('brand') || 'All Brands';

  const handleClearBrand = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('brand');
    setSearchParams(nextParams);
  };

  return (
    <ShopPage
      key={`${category}-${subcategory}-${brand}-${searchParams.get('search') || ''}`}
      wishlistIds={wishlistIds}
      onToggleWishlist={toggleWishlist}
      selectedBrand={brand}
      initialCategory={category}
      initialSubcategory={subcategory}
      onClearBrand={handleClearBrand}
      onAddToCart={addToCart}
      onSelectProduct={(product: Product) => {
        navigate(`/product/${product.slug || product.id}`);
      }}
      onNavigateHome={() => navigate('/')}
    />
  );
};

export default ShopRoutePage;
