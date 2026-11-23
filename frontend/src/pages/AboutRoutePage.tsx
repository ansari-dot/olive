import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AboutUsPage } from '../components/AboutUsPage';

export const AboutRoutePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AboutUsPage
      onNavigateHome={() => navigate('/')}
      onNavigateShop={(categoryName) =>
        navigate(
          categoryName && categoryName !== 'All'
            ? `/shop?category=${encodeURIComponent(categoryName)}`
            : '/shop'
        )
      }
      onNavigateContact={() => navigate('/contact')}
    />
  );
};

export default AboutRoutePage;
