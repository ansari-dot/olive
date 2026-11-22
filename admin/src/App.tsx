import React, { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Package,
  LayoutGrid,
  Layers,
  TicketPercent,
  Flame,
  BookOpen,
  Star,
  Inbox,
  Mail,
  LogOut,
  Menu,
  X,
  Leaf,
  Bell,
  Home,
} from 'lucide-react';
import {
  fetchCurrentAdmin,
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
import { DealsView } from './components/DealsView';
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
  | 'deals'
  | 'coupons'
  | 'blogs'
  | 'reviews'
  | 'inquiries'
  | 'newsletter';

interface NavItem {
  id: AdminTab;
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', path: '/orders', label: 'Orders & Dispatch', icon: Truck },
  { id: 'products', path: '/products', label: 'Products & Stock', icon: Package },
  { id: 'categories', path: '/categories', label: 'Categories & Origins', icon: Layers },
  { id: 'sections', path: '/sections', label: 'Homepage Sections', icon: LayoutGrid },
  { id: 'deals', path: '/deals', label: 'Flash Deals', icon: Flame },
  { id: 'coupons', path: '/coupons', label: 'Harvest Coupons', icon: TicketPercent },
  { id: 'blogs', path: '/blogs', label: 'Orchard Journal', icon: BookOpen },
  { id: 'reviews', path: '/reviews', label: 'Reviews', icon: Star },
];

/**
 * Route wrapper that resolves orderReference from URL path (/orders/:orderReference)
 * or query params (/orders?ref=ORD-XXX) for deep linking into OrdersView.
 */
const OrdersRouteWrapper: React.FC = () => {
  const { orderReference } = useParams<{ orderReference?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const refFromQuery = searchParams.get('ref');
  const activeOrderRef = orderReference || refFromQuery || null;

  return (
    <OrdersView
      initialOrderReference={activeOrderRef}
      onClearInitialOrder={() => {
        if (refFromQuery) {
          searchParams.delete('ref');
          setSearchParams(searchParams, { replace: true });
        }
      }}
    />
  );
};

export const App: React.FC = () => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Authenticate session via secure HttpOnly cookie
    fetchCurrentAdmin()
      .then((user) => setAdmin(user))
      .catch(() => {
        setAdmin(null);
      })
      .finally(() => setBootstrapping(false));
  }, []);

  const handleSignOut = () => {
    logoutAdmin();
    setAdmin(null);
    navigate('/dashboard');
  };

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#15472B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[12px] uppercase tracking-[0.16em] text-[#64748B] font-medium">
            Verifying Orchard Session...
          </p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <LoginView onSuccess={(user) => setAdmin(user)} />;
  }

  // Derive current active tab from pathname
  const currentPath = location.pathname;
  const activeNav =
    NAV_ITEMS.find((n) => currentPath.startsWith(n.path)) ?? NAV_ITEMS[0];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0E291C] text-white relative overflow-hidden select-none">
      {/* Brand Header */}
      <div className="px-6 pt-6 pb-5 flex items-center gap-3.5 border-b border-white/10 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-[#4ADE80] shrink-0 shadow-inner">
          <Leaf className="w-5 h-5 fill-[#4ADE80]/20" />
        </div>
        <div className="min-w-0">
          <h1 className="font-serif-brand text-[20px] text-white font-medium leading-tight tracking-tight">
            Zaitoon Pakistan
          </h1>
          <p className="text-[9.5px] uppercase tracking-[0.22em] text-[#8DA896] font-semibold mt-0.5">
            Operations Console
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-5 px-3.5 space-y-1.5 relative z-10 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath.startsWith(item.path);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                navigate(item.path);
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 text-[13px] font-medium transition-all cursor-pointer text-left rounded-xl ${
                isActive
                  ? 'bg-[#1C4D32] text-white shadow-xs font-semibold'
                  : 'text-[#9EBAAA] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#4ADE80]' : 'text-[#8DA896]'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Admin Identity Card & Sign Out */}
      <div className="p-4 border-t border-white/10 bg-[#0A2216]/70 relative z-10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white text-[#0E291C] font-bold text-[13px] flex items-center justify-center shrink-0 shadow-xs">
            ZA
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white truncate leading-snug">
              {admin.name || 'Zaitoon Administrator'}
            </p>
            <p className="text-[11px] font-mono-data text-[#8DA896] truncate">
              {admin.email || 'admin@zaitoonpakistan.pk'}
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.14em] text-[#4ADE80] bg-[#163D27] border border-[#235839]">
              {admin.role === 'super_admin' ? 'Super Admin' : 'Hub Manager'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 border border-[#235839] hover:border-[#4ADE80]/60 bg-transparent hover:bg-white/5 py-2 rounded-lg text-[12px] font-medium text-white/90 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-white/80" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Decorative Bottom Olive Leaves Watermark */}
      <div className="absolute -bottom-6 -left-6 pointer-events-none opacity-10 select-none z-0">
        <svg width="220" height="220" viewBox="0 0 200 200" fill="currentColor" className="text-[#4ADE80]">
          <path d="M40,160 C70,120 120,100 180,90 C150,140 110,180 40,160 Z" />
          <path d="M10,110 C40,80 90,70 150,80 C110,120 70,140 10,110 Z" />
          <path d="M80,180 C110,150 140,120 190,140 C160,180 120,200 80,180 Z" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex font-sans text-[#0F172A]">
      {/* Desktop 260px Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 sticky top-0 h-screen shadow-lg">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-[260px] h-full relative z-10 shadow-2xl">{renderSidebarContent()}</div>
          <div
            className="flex-1 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileNavOpen(false)}
          />
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
            className="fixed top-4 right-4 z-20 bg-white p-2 rounded-lg border border-[#E2E8F0] text-[#0F172A] shadow-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-[60px] bg-white border-b border-[#E5E9E4] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shadow-2xs">
          {/* Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-1.5 rounded-lg border border-[#CBD5E1] text-[#0F172A] cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-[13px]">
              <Home className="w-4 h-4 text-[#15472B]" />
              <span className="text-[#475569] font-medium">Zaitoon Pakistan</span>
              <span className="text-[#CBD5E1]">/</span>
              <span className="font-semibold text-[#0F172A]">{activeNav.label}</span>
            </div>
          </div>

          {/* Right Controls: Location Status Pill, Bell Notification, User Avatar */}
          <div className="flex items-center gap-3.5">
            <div className="hidden sm:flex items-center gap-2 bg-[#EAF2EC] px-3.5 py-1.5 rounded-full text-[12px] font-medium text-[#15472B]">
              <div className="w-4 h-4 rounded-xs bg-[#15472B] flex items-center justify-center text-white shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <span>Nationwide COD &amp; IBFT</span>
              <span className="text-[#94A3B8]">·</span>
              <span>Islamabad Hub</span>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              aria-label="View notifications"
              className="w-8 h-8 rounded-full bg-white hover:bg-[#F1F5F9] flex items-center justify-center text-[#475569] relative transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#EF4444] absolute top-1.5 right-1.5 ring-2 ring-white" />
            </button>

            {/* Header User Badge */}
            <div className="w-8 h-8 rounded-full bg-[#0E291C] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
              ZA
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <DashboardView
                  onOpenOrder={(orderRef) => navigate(`/orders?ref=${orderRef}`)}
                  onNavigateTab={(tab) => navigate(`/${tab}`)}
                />
              }
            />
            <Route path="/orders" element={<OrdersRouteWrapper />} />
            <Route path="/orders/:orderReference" element={<OrdersRouteWrapper />} />
            <Route path="/products" element={<ProductsView />} />
            <Route path="/categories" element={<CategoriesView />} />
            <Route path="/sections" element={<HomepageSectionsView />} />
            <Route path="/deals" element={<DealsView />} />
            <Route path="/coupons" element={<CouponsView />} />
            <Route path="/blogs" element={<BlogsView />} />
            <Route path="/reviews" element={<ReviewsView />} />
            <Route path="/inquiries" element={<InquiriesView />} />
            <Route path="/newsletter" element={<NewsletterView />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
