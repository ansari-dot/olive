import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { ZaitoonLogo } from './ZaitoonLogo';

export type NavSection =
  | 'HOME'
  | 'ABOUT US'
  | 'SHOP'
  | 'BLOGS'
  | 'CONTACT US';

interface NavbarProps {
  activeNav: NavSection;
  cartCount: number;
  wishlistCount: number;
  orderCount?: number;
  onSelectNav: (nav: NavSection) => void;
  onOpenSearch: () => void;
  onOpenOrderTracking: () => void;
  onOpenWishlist: () => void;
  onOpenCart: () => void;
}

const NAV_ITEMS: NavSection[] = [
  'HOME',
  'ABOUT US',
  'SHOP',
  'BLOGS',
  'CONTACT US',
];

export const Navbar: React.FC<NavbarProps> = ({
  activeNav,
  cartCount,
  wishlistCount,
  orderCount = 0,
  onSelectNav,
  onOpenSearch,
  onOpenOrderTracking,
  onOpenWishlist,
  onOpenCart,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNavClick = (item: NavSection) => {
    onSelectNav(item);
    setMobileMenuOpen(false);
  };

  return (
    <header className="w-full bg-white sticky top-0 z-40">
      {/* Top Announcement Bar */}
      <div className="w-full h-[36px] bg-white border-t border-b border-[#EAEAEA] flex items-center justify-center px-4">
        <p className="text-[12.5px] sm:text-[13px] font-normal tracking-[0.03em] text-[#262626] text-center truncate">
          Free Shipping on All Orders Over Rs. 1,200 Across Pakistan!
        </p>
      </div>

      {/* Main Header Row */}
      <div className="w-full bg-white border-b border-[#EAEAEA]">
        <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 h-[84px] lg:h-[96px] flex items-center justify-between gap-4 sm:gap-6 lg:gap-8">
          {/* Mobile Sidebar Menu Trigger (visible below lg) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden p-2 -ml-2 text-[#1A1A1A] hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#224d26] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 stroke-[1.5]" /> : <Menu className="w-6 h-6 stroke-[1.5]" />}
          </button>

          {/* Left Zone: Logo */}
          <div className="flex items-center shrink-0 scale-[0.84] sm:scale-[0.92] lg:scale-100 origin-center lg:origin-left">
            <ZaitoonLogo
              onClick={() => {
                setMobileMenuOpen(false);
                onSelectNav('HOME');
              }}
            />
          </div>

          {/* Center Zone: Desktop Single-Row Navigation Links (5 Pages Only) */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center justify-center gap-6 xl:gap-8"
          >
            {NAV_ITEMS.map((item) => {
              const isUnderlined = activeNav === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className="group inline-flex items-center text-[11.5px] xl:text-[12.5px] font-normal uppercase tracking-[0.06em] leading-none text-[#3A3A3A] hover:text-[#111111] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#224d26]"
                >
                  <span
                    className={`relative py-0.5 after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-[2px] after:h-[1.2px] after:transition-colors ${
                      isUnderlined
                        ? 'text-[#121212] after:bg-[#121212]'
                        : 'after:bg-transparent group-hover:after:bg-[#121212]'
                    }`}
                  >
                    {item}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right Zone: Search, Order Tracking, Wishlist, Shopping Bag Icons */}
          <div className="flex items-center gap-2.5 sm:gap-5 shrink-0">
            {/* Search Icon */}
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search store"
              title="Search"
              className="p-1.5 text-[#1A1A1A] hover:text-[#224D26] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#224d26]"
            >
              <svg
                viewBox="0 0 22 22"
                className="w-[20px] h-[20px]"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="9.5"
                  cy="9.5"
                  r="6.75"
                  stroke="currentColor"
                  strokeWidth="1.35"
                />
                <path
                  d="M14.5 14.5L19.25 19.25"
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Order Tracking Icon */}
            <button
              type="button"
              onClick={onOpenOrderTracking}
              aria-label="Track order"
              title="Order Tracking"
              className="relative inline-flex p-1.5 text-[#1A1A1A] hover:text-[#224D26] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#224d26]"
            >
              <svg
                viewBox="0 0 22 22"
                className="w-[20px] h-[20px]"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2.75 6.25H13.5V15.25H2.75V6.25Z"
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.5 8.75H17.1L19.25 11.4V15.25H13.5V8.75Z"
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinejoin="round"
                />
                <circle cx="6.5" cy="16.25" r="1.6" fill="white" stroke="currentColor" strokeWidth="1.35" />
                <circle cx="16.25" cy="16.25" r="1.6" fill="white" stroke="currentColor" strokeWidth="1.35" />
              </svg>
              {orderCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#224D26] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                  {orderCount}
                </span>
              )}
            </button>

            {/* Wishlist Icon */}
            <button
              type="button"
              onClick={onOpenWishlist}
              aria-label={`Wishlist (${wishlistCount} saved items)`}
              title="Wishlist"
              className="relative inline-flex p-1.5 text-[#1A1A1A] hover:text-[#C46B3B] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#224d26]"
            >
              <svg
                viewBox="0 0 22 22"
                className="w-[20px] h-[20px]"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M11 18.25C11 18.25 3.75 13.85 3.75 8.55C3.75 6.15 5.65 4.25 8 4.25C9.45 4.25 10.65 5 11 6.1C11.35 5 12.55 4.25 14 4.25C16.35 4.25 18.25 6.15 18.25 8.55C18.25 13.85 11 18.25 11 18.25Z"
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinejoin="round"
                />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#C46B3B] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Bag Icon */}
            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`Shopping bag (${cartCount} items)`}
              className="relative p-1.5 text-[#1A1A1A] hover:text-[#224D26] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#224d26]"
            >
              <svg
                viewBox="0 0 22 22"
                className="w-[20px] h-[20px]"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4.25 5.25H17.75L18.1 15.1C18.17 17.1 16.58 18.75 14.58 18.75H7.42C5.42 18.75 3.83 17.1 3.9 15.1L4.25 5.25Z"
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.1 5.25V7.1C8.1 8.7 9.4 10 11 10C12.6 10 13.9 8.7 13.9 7.1V5.25"
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#224D26] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Drawer (Only: Home, About Us, Shop, Blogs, Contact Us) */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 top-[120px] z-50 bg-black/30"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            aria-label="Mobile navigation sidebar"
            onClick={(e) => e.stopPropagation()}
            className="w-[280px] max-w-[82vw] h-full bg-white border-r border-[#EAEAEA] px-6 py-6 shadow-xl flex flex-col"
          >
            <nav aria-label="Sidebar pages" className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeNav === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleNavClick(item)}
                    className={`w-full text-left py-3.5 border-b border-[#F3F3F3] last:border-b-0 text-[13px] uppercase tracking-[0.08em] flex items-center justify-between transition-colors cursor-pointer ${
                      isActive
                        ? 'font-semibold text-[#15472B]'
                        : 'text-[#3A3A3A] hover:text-[#121212]'
                    }`}
                  >
                    <span>{item}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
};
