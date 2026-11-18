import React from 'react';
import { ZaitoonLogo } from './ZaitoonLogo';

interface FooterProps {
  onNavigateHome: () => void;
  onNavigateAbout: () => void;
  onNavigateShop: (category?: string) => void;
  onNavigateBlogs: () => void;
  onNavigateContact: () => void;
  onNavigateWishlist?: () => void;
  onNavigateCart: () => void;
  onNavigateShipping: () => void;
  onScrollToSection: (sectionId: string) => void;
  onOpenAccount: () => void;
}

export const Footer: React.FC<FooterProps> = ({
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
  const shopLinks = [
    { label: 'Bottled Olive Oils', category: 'Bottled' },
    { label: 'Cooking & Kitchen Tins', category: 'Cooking' },
    { label: 'Cured Table Olives', category: 'Oily' },
    { label: 'Raw Sidr Honey', category: 'Raw Honey' },
    { label: 'Botanical Infusions', category: 'Botanical Infusions' },
    { label: 'Gift Editions', category: 'Gift Card' },
  ];

  return (
    <footer className="w-full bg-[#143320] text-[#F2EEE7]">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-14 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-5">
            <ZaitoonLogo variant="dark" onClick={onNavigateHome} />
            <p className="text-[13.5px] leading-[1.75] text-[#C6D2C5] max-w-[36ch]">
              Single-origin cold-pressed extra virgin olive oils, wild Himalayan Sidr honey, and sun-dried olive leaf botanicals harvested across Pakistan’s Potohar and Swat valleys.
            </p>
            <div className="flex items-center gap-4 pt-1 text-[12px] uppercase tracking-[0.1em] text-[#A8DC72]">
              <button
                type="button"
                onClick={onNavigateAbout}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Orchards
              </button>
              <span className="text-[#3C644A]" aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onScrollToSection('testimonials')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Reviews
              </button>
              <span className="text-[#3C644A]" aria-hidden="true">·</span>
              <button
                type="button"
                onClick={onNavigateBlogs}
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
                    onClick={() => onNavigateShop(item.category)}
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
                  onClick={onNavigateHome}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateAbout}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateShop('All')}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Shop
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateBlogs}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Blogs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateContact}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
              {onNavigateWishlist && (
                <li>
                  <button
                    type="button"
                    onClick={onNavigateWishlist}
                    className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                  >
                    Wishlist
                  </button>
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={onNavigateCart}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Shopping Cart
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateShipping}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Shipping &amp; Returns
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenAccount}
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
              Orchard Hub &amp; Care
            </h3>
            <div className="space-y-2.5 text-[13.5px] text-[#DCE4DA] leading-relaxed">
              <p>Potohar Olive Belt · Chakwal Road, Islamabad</p>
              <p>
                <a
                  href="mailto:care@zaitoonpakistan.pk"
                  className="hover:text-white underline underline-offset-4"
                >
                  care@zaitoonpakistan.pk
                </a>
              </p>
              <p className="tabular-nums">+92 300 000 0000 · Mon–Sat</p>
              <p className="pt-2 text-[12.5px] text-[#A8DC72]">
                Free Nationwide Delivery on orders over Rs. 1,200 · Cash on Delivery
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Purity Bar */}
      <div className="border-t border-[#254A33]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-14 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#B4C4B3]">
          <p>&copy; {new Date().getFullYear()} Zaitoon Pakistan. Pure Potohar Harvests.</p>
          <p className="tracking-[0.04em]">
            Cold-Pressed Below 27&deg;C &middot; Acidity &lt; 0.3% &middot; Nationwide COD
          </p>
        </div>
      </div>
    </footer>
  );
};
