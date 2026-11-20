import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Truck,
  Package,
  LayoutGrid,
  Layers,
  TicketPercent,
  BookOpen,
  Star,
  Inbox,
  Mail,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import {
  fetchCurrentAdmin,
  getStoredToken,
  logoutAdmin,
} from './services/adminApi';
import type { AdminUser } from './types/admin';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { OrdersView } from './components/OrdersView';
import { ProductsView } from './components/ProductsView';
import { CategoriesView } from './components/CategoriesView';
import { HomepageSectionsView } from './components/HomepageSectionsView';
import { CouponsView } from './components/CouponsView';
import { BlogsView } from './components/BlogsView';
import { ReviewsView } from './components/ReviewsView';
import { InquiriesView } from './components/InquiriesView';
import { NewsletterView } from './components/NewsletterView';

type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'categories'
  | 'sections'
  | 'coupons'
  | 'blogs'
  | 'reviews'
  | 'inquiries'
  | 'newsletter';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders & Dispatch', icon: Truck },
  { id: 'products', label: 'Products & Stock', icon: Package },
  { id: 'categories', label: 'Categories & Origins', icon: Layers },
  { id: 'sections', label: 'Homepage Sections', icon: LayoutGrid },
  { id: 'coupons', label: 'Harvest Coupons', icon: TicketPercent },
  { id: 'blogs', label: 'Orchard Journal', icon: BookOpen },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'inquiries', label: 'Care Inquiries', icon: Inbox },
  { id: 'newsletter', label: 'Newsletter', icon: Mail },
];

export const App: React.FC = () => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [selectedOrderRef, setSelectedOrderRef] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setBootstrapping(false);
      return;
    }

    fetchCurrentAdmin()
      .then((user) => setAdmin(user))
      .catch(() => {
        logoutAdmin();
        setAdmin(null);
      })
      .finally(() => setBootstrapping(false));
  }, []);

  const handleSignOut = () => {
    logoutAdmin();
    setAdmin(null);
    setActiveTab('dashboard');
  };

  const handleOpenOrder = (orderReference: string) => {
    setSelectedOrderRef(orderReference);
    setActiveTab('orders');
  };

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-7 h-7 border-2 border-[#15472B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-[#64748B]">
            Verifying Orchard Session...
          </p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <LoginView onSuccess={(user) => setAdmin(user)} />;
  }

  const activeNav = NAV_ITEMS.find((n) => n.id === activeTab) ?? NAV_ITEMS[0];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-[#E2E8F0]">
      {/* Brand Masthead */}
      <div className="px-6 py-5 border-b border-[#E2E8F0]">
        <p className="font-serif-brand text-[21px] text-[#15472B] leading-tight">
          Zaitoon Pakistan
        </p>
        <p className="text-[10.5px] uppercase tracking-[0.18em] text-[#C46B3B] font-semibold mt-0.5">
          Operations Console
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-[#15472B] text-white'
                  : 'text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Admin Identity & Sign Out */}
      <div className="p-4 border-t border-[#E2E8F0] space-y-3 bg-[#F8FAFC]">
        <div>
          <p className="text-[13px] font-semibold text-[#0F172A] truncate">
            {admin.name}
          </p>
          <p className="text-[11px] font-mono-data text-[#64748B] truncate">
            {admin.email}
          </p>
          <p className="text-[10.5px] uppercase tracking-[0.1em] text-[#15472B] font-semibold mt-1">
            {admin.role === 'super_admin' ? 'Super Admin' : 'Hub Manager'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 border border-[#CBD5E1] bg-white hover:border-[#0F172A] py-2 text-[12px] font-semibold text-[#0F172A] cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Desktop 260px Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-[260px] h-full relative z-10">{renderSidebarContent()}</div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
            className="fixed top-4 right-4 z-20 bg-white p-2 border border-[#E2E8F0] text-[#0F172A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Sticky Breadcrumb Topbar */}
        <header className="sticky top-0 z-30 h-[58px] bg-white border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-1.5 border border-[#CBD5E1] text-[#0F172A]"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-[#64748B]">Zaitoon Pakistan</span>
              <span className="text-[#CBD5E1]">/</span>
              <span className="font-semibold text-[#0F172A]">{activeNav.label}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[12px] text-[#64748B] font-mono-data">
            <span>Nationwide COD &amp; IBFT</span>
            <span>·</span>
            <span>Islamabad Hub</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenOrder={handleOpenOrder}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'orders' && (
            <OrdersView
              initialOrderReference={selectedOrderRef}
              onClearInitialOrder={() => setSelectedOrderRef(null)}
            />
          )}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'categories' && <CategoriesView />}
          {activeTab === 'sections' && <HomepageSectionsView />}
          {activeTab === 'coupons' && <CouponsView />}
          {activeTab === 'blogs' && <BlogsView />}
          {activeTab === 'reviews' && <ReviewsView />}
          {activeTab === 'inquiries' && <InquiriesView />}
          {activeTab === 'newsletter' && <NewsletterView />}
        </main>
      </div>
    </div>
  );
};

export default App;
