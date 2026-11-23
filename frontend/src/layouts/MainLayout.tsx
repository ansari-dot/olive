import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CartDrawer } from '../components/CartDrawer';
import { SearchOverlay } from '../components/SearchOverlay';
import { ScrollToTop } from '../components/ScrollToTop';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3EBDD] text-[#23362B]">
      <ScrollToTop />
      <Navbar />
      <SearchOverlay />
      <CartDrawer />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
