import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ContactUsPage } from '../components/ContactUsPage';

export const ContactRoutePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ContactUsPage
      onNavigateHome={() => navigate('/')}
      onNavigateShop={() => navigate('/shop')}
    />
  );
};

export default ContactRoutePage;
