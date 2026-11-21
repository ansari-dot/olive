import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShippingPolicyPage } from '../components/ShippingPolicyPage';

export const ShippingPolicyRoutePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ShippingPolicyPage
      onNavigateHome={() => navigate('/')}
      onNavigateShop={() => navigate('/shop')}
      onNavigateContact={() => navigate('/contact')}
    />
  );
};

export default ShippingPolicyRoutePage;
