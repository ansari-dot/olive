import React from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { OrderTrackingPage, TrackedOrderRecord } from '../components/OrderTrackingPage';
import { useStore } from '../context/StoreContext';

export const OrderTrackingRoutePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { orderId: pathOrderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();
  const { placedOrders, clearPlacedOrders } = useStore();

  const initialOrderId = pathOrderId || searchParams.get('orderId') || '';
  const isPayfastSuccess =
    searchParams.get('payfast') === 'success' ||
    searchParams.get('paid') === '1' ||
    Boolean(pathOrderId); // Coming directly back from PayFast redirect URL

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
      isPayfastSuccess={isPayfastSuccess}
      onClearRecentOrders={clearPlacedOrders}
      onNavigateHome={() => navigate('/')}
      onNavigateShop={() => navigate('/shop')}
      onNavigateShipping={() => navigate('/shipping-policy')}
      onNavigateContact={() => navigate('/contact')}
    />
  );
};

export default OrderTrackingRoutePage;
