import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartPage } from '../components/CartPage';
import { useStore } from '../context/StoreContext';
import { fetchProducts } from '../services/api';
import { Product } from '../data/storeData';

export const CartRoutePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    subtotal,
    shippingFee,
    orderTotal,
    updateQuantity,
    removeFromCart,
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
    <CartPage
      items={cart}
      recommendedProducts={recommended}
      subtotal={subtotal}
      shippingFee={shippingFee}
      orderTotal={orderTotal}
      onUpdateQty={updateQuantity}
      onRemoveItem={removeFromCart}
      onAddToCart={addToCart}
      onSelectProduct={(p) => navigate(`/product/${p.slug || p.id}`)}
      onProceedToCheckout={() => navigate('/checkout')}
      onNavigateHome={() => navigate('/')}
      onNavigateShop={() => navigate('/shop')}
    />
  );
};

export default CartRoutePage;
