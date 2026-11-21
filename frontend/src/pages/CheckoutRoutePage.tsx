import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckoutPage } from '../components/CheckoutPage';
import { useStore } from '../context/StoreContext';

export const CheckoutRoutePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    subtotal,
    shippingFee,
    clearCart,
    addPlacedOrder,
  } = useStore();

  const handlePlaceOrder = (details: {
    name: string;
    phone: string;
    email: string;
    city: string;
    area: string;
    address: string;
    notes: string;
    paymentMethod: 'Cash on Delivery' | 'PayFast (Sandbox)' | 'Bank Transfer (IBFT)';
    discountAmount: number;
    finalTotal: number;
    orderReference?: string;
  }) => {
    const orderRef =
      details.orderReference || `ZP-${Date.now().toString().slice(-4)}`;

    addPlacedOrder({
      id: orderRef,
      customerName: details.name,
      city: details.city,
      total: details.finalTotal,
      itemCount: cart.reduce((s, it) => s + it.quantity, 0),
      status: 'Confirmed',
    });

    clearCart();
    return orderRef;
  };

  return (
    <CheckoutPage
      items={cart}
      subtotal={subtotal}
      shippingFee={shippingFee}
      onPlaceOrder={handlePlaceOrder}
      onTrackOrder={(orderId) =>
        navigate(`/order-tracking?orderId=${encodeURIComponent(orderId)}`)
      }
      onNavigateHome={() => navigate('/')}
      onNavigateCart={() => navigate('/cart')}
      onNavigateShop={() => navigate('/shop')}
    />
  );
};

export default CheckoutRoutePage;
