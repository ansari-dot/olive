import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { OrderTrackingPage, TrackedOrderRecord } from '../components/OrderTrackingPage';
import { useStore } from '../context/StoreContext';

export const OrderTrackingRoutePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { placedOrders } = useStore();

  const initialOrderId = searchParams.get('orderId') || '';

  const trackedRecords: TrackedOrderRecord[] = placedOrders.map((o) => ({
    id: o.id,
    customerName: o.customerName,
    city: o.city,
    total: o.total,
    itemCount: o.itemCount,
    status: o.status,
  }));

  return (
    <OrderTrackingPage
      placedOrders={trackedRecords}
      initialOrderId={initialOrderId}
      onNavigateHome={() => navigate('/')}
      onNavigateShop={() => navigate('/shop')}
      onNavigateShipping={() => navigate('/shipping-policy')}
      onNavigateContact={() => navigate('/contact')}
    />
  );
};

export default OrderTrackingRoutePage;
