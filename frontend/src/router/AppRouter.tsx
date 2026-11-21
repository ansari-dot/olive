import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';

// Route-level code-splitting: Lazy-load page components for ultra-fast initial bundle
const HomePage = lazy(() => import('../pages/HomePage'));
const ShopRoutePage = lazy(() => import('../pages/ShopRoutePage'));
const ProductDetailRoutePage = lazy(() => import('../pages/ProductDetailRoutePage'));
const BlogDetailRoutePage = lazy(() => import('../pages/BlogDetailRoutePage'));
const BlogsRoutePage = lazy(() => import('../pages/BlogsRoutePage'));
const AboutRoutePage = lazy(() => import('../pages/AboutRoutePage'));
const ContactRoutePage = lazy(() => import('../pages/ContactRoutePage'));
const CartRoutePage = lazy(() => import('../pages/CartRoutePage'));
const CheckoutRoutePage = lazy(() => import('../pages/CheckoutRoutePage'));
const WishlistRoutePage = lazy(() => import('../pages/WishlistRoutePage'));
const OrderTrackingRoutePage = lazy(() => import('../pages/OrderTrackingRoutePage'));
const ShippingPolicyRoutePage = lazy(() => import('../pages/ShippingPolicyRoutePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const PageRouteSkeleton: React.FC = () => (
  <div className="w-full min-h-[60vh] max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse space-y-6">
    <div className="h-7 bg-[#15472B]/10 w-48 rounded"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="aspect-[3/4] bg-[#15472B]/5 rounded-sm"></div>
      ))}
    </div>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageRouteSkeleton />}>
        <Routes>
          <Route element={<MainLayout />}>
            {/* Storefront Routes */}
            <Route index element={<HomePage />} />
            <Route path="shop" element={<ShopRoutePage />} />
            <Route path="products" element={<Navigate to="/shop" replace />} />
            <Route path="product/:id" element={<ProductDetailRoutePage />} />
            <Route path="products/:id" element={<ProductDetailRoutePage />} />

            {/* Content & Brand Routes */}
            <Route path="about" element={<AboutRoutePage />} />
            <Route path="about-us" element={<Navigate to="/about" replace />} />
            <Route path="blogs" element={<BlogsRoutePage />} />
            <Route path="blogs/:id" element={<BlogDetailRoutePage />} />
            <Route path="blog/:id" element={<BlogDetailRoutePage />} />
            <Route path="contact" element={<ContactRoutePage />} />
            <Route path="contact-us" element={<Navigate to="/contact" replace />} />

            {/* Customer & E-commerce Operations */}
            <Route path="cart" element={<CartRoutePage />} />
            <Route path="checkout" element={<CheckoutRoutePage />} />
            <Route path="wishlist" element={<WishlistRoutePage />} />
            <Route path="order-tracking" element={<OrderTrackingRoutePage />} />
            <Route path="order-tracking/:orderId" element={<OrderTrackingRoutePage />} />
            <Route path="orders" element={<Navigate to="/order-tracking" replace />} />
            <Route path="shipping-policy" element={<ShippingPolicyRoutePage />} />
            <Route path="shipping" element={<Navigate to="/shipping-policy" replace />} />

            {/* 404 Fallback Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
