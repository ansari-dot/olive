import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AboutUsPage } from '../components/AboutUsPage';
import { BRANDS } from '../data/storeData';

export const AboutRoutePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AboutUsPage
      brands={BRANDS}
      onNavigateHome={() => navigate('/')}
      onNavigateShop={(brandName) =>
        navigate(
          brandName && brandName !== 'All Brands'
            ? `/shop?brand=${encodeURIComponent(brandName)}`
            : '/shop'
        )
      }
      onNavigateContact={() => navigate('/contact')}
    />
  );
};

export default AboutRoutePage;
