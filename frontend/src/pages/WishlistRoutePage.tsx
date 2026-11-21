import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WishlistPage } from '../components/WishlistPage';
import { useStore } from '../context/StoreContext';
import { fetchProducts } from '../services/api';
import { Product } from '../data/storeData';

export const WishlistRoutePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    wishlist,
    toggleWishlist,
    clearWishlist,
    moveAllWishlistToCart,
    addToCart,
  } = useStore();

  const [recommended, setRecommended] = useState<Product[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchProducts({ limit: 4 })
      .then((res) => {
        if (isMounted) setRecommended(res.products);
      })
      .catch(console.error);

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <WishlistPage
      items={wishlist}
      recommendedProducts={recommended}
      onToggleWishlist={toggleWishlist}
      onClearWishlist={clearWishlist}
      onMoveAllToCart={moveAllWishlistToCart}
      onAddToCart={addToCart}
      onSelectProduct={(p) => navigate(`/product/${p.slug || p.id}`)}
      onNavigateHome={() => navigate('/')}
      onNavigateShop={() => navigate('/shop')}
    />
  );
};

export default WishlistRoutePage;
