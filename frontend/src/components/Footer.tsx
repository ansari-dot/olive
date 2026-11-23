import React from 'react';
import { useNavigate } from 'react-router-dom';

interface FooterProps {
  onNavigateHome?: () => void;
  onNavigateAbout?: () => void;
  onNavigateShop?: (category?: string) => void;
  onNavigateBlogs?: () => void;
  onNavigateContact?: () => void;
  onNavigateWishlist?: () => void;
  onNavigateCart?: () => void;
  onNavigateShipping?: () => void;
  onScrollToSection?: (sectionId: string) => void;
  onOpenAccount?: () => void;
}

export const Footer: React.FC<FooterProps> = React.memo(({
  onNavigateHome,
  onNavigateAbout,
  onNavigateShop,
  onNavigateBlogs,
  onNavigateContact,
  onNavigateWishlist,
  onNavigateCart,
  onNavigateShipping,
  onScrollToSection,
  onOpenAccount,
}) => {
  const navigate = useNavigate();

  const handleHome = () => (onNavigateHome ? onNavigateHome() : navigate('/'));
  const handleAbout = () => (onNavigateAbout ? onNavigateAbout() : navigate('/about'));
  const handleShop = (category?: string) => {
    if (onNavigateShop) {
      onNavigateShop(category);
    } else {
      navigate(
        category && category !== 'All'
          ? `/shop?category=${encodeURIComponent(category)}`
          : '/shop'
      );
    }
  };
  const handleBlogs = () => (onNavigateBlogs ? onNavigateBlogs() : navigate('/blogs'));
  const handleContact = () => (onNavigateContact ? onNavigateContact() : navigate('/contact'));
  const handleWishlist = () => (onNavigateWishlist ? onNavigateWishlist() : navigate('/wishlist'));
  const handleCart = () => (onNavigateCart ? onNavigateCart() : navigate('/cart'));
  const handleShipping = () => (onNavigateShipping ? onNavigateShipping() : navigate('/shipping-policy'));
  const handleScrollToSection = (sectionId: string) => {
    if (onScrollToSection) {
      onScrollToSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(`/#${sectionId}`);
      }
    }
  };
  const handleAccount = () => (onOpenAccount ? onOpenAccount() : navigate('/order-tracking'));

  const shopLinks = [
    { label: 'Ground & Whole Spices', category: 'Ground Spices' },
    { label: 'Artisanal Olive Oils', category: 'Olive Products' },
    { label: 'Mushrooms & Concentrates', category: 'Mushrooms and Mushroom Products' },
    { label: 'Himalayan Shilajit & Extracts', category: 'Extracts and Concentrates' },
    { label: 'Raw Mountain Sidr Honey', category: 'Natural Sweeteners' },
    { label: 'Botanical Teas & Coffees', category: 'Tea and Herbal Infusions' },
    { label: 'Superfoods & Supplements', category: 'Superfoods and Functional Ingredients' },
  ];

  return (
    <footer className="w-full bg-[#143320] text-[#F2EEE7]">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-14 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-5">
            <div onClick={handleHome} className="cursor-pointer select-none inline-block group">
              <img
                src="/assets/images/pak_veda_logo_white.svg"
                alt="Pak Veda"
                className="h-11 w-auto object-contain transition-transform group-hover:scale-102"
              />
            </div>
            <p className="text-[13.5px] leading-[1.75] text-[#C6D2C5] max-w-[36ch]">
              Rooted in nature and crafted for everyday life. Explore PAK VEDA’s natural foods, spices, botanicals, oils and wellness range.
            </p>
            <div className="flex items-center gap-4 pt-1 text-[12px] uppercase tracking-[0.1em] text-[#A8DC72]">
              <button
                type="button"
                onClick={handleAbout}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Our Story
              </button>
              <span className="text-[#3C644A]" aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => handleScrollToSection('testimonials')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Values
              </button>
              <span className="text-[#3C644A]" aria-hidden="true">·</span>
              <button
                type="button"
                onClick={handleBlogs}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Journal
              </button>
            </div>
          </div>

          {/* Shop Categories Column */}
          <div className="lg:col-span-3">
            <h3 className="text-[12px] uppercase tracking-[0.14em] font-semibold text-[#A8DC72] mb-4">
              Shop Harvests
            </h3>
            <ul className="space-y-2.5 text-[13.5px] text-[#DCE4DA]">
              {shopLinks.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => handleShop(item.category)}
                    className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore Column */}
          <div className="lg:col-span-2">
            <h3 className="text-[12px] uppercase tracking-[0.14em] font-semibold text-[#A8DC72] mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5 text-[13.5px] text-[#DCE4DA]">
              <li>
                <button
                  type="button"
                  onClick={handleHome}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleAbout}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleShop('All')}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Shop
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleBlogs}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Blogs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleContact}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleWishlist}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Wishlist
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleCart}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Shopping Cart
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleShipping}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Shipping &amp; Returns
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleAccount}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Track Order
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Dispatch Column */}
          <div className="lg:col-span-3">
            <h3 className="text-[12px] uppercase tracking-[0.14em] font-semibold text-[#A8DC72] mb-4">
              Customer Care
            </h3>
            <div className="space-y-2.5 text-[13.5px] text-[#DCE4DA] leading-relaxed">
              <button
                type="button"
                onClick={handleContact}
                className="hover:text-white underline underline-offset-4"
              >
                Contact us for assistance
              </button>
              <button
                type="button"
                onClick={handleShipping}
                className="block hover:text-white underline underline-offset-4"
              >
                View shipping information
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Purity Bar */}
      <div className="border-t border-[#254A33]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-14 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#B4C4B3]">
          <p>&copy; {new Date().getFullYear()} PAK VEDA. Nature&apos;s goodness, delivered.</p>
          <p className="tracking-[0.04em]">Natural products for everyday life.</p>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
