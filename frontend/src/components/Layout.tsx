import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Clock, 
  Award, 
  BarChart3, 
  Calendar, 
  Settings,
  LogOut,
  Plus,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Menu,
  X as XIcon
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';

  const studentNav = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/timeline', icon: Clock, label: 'Timeline' },
    { path: '/badges', icon: Award, label: 'Badges' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/heatmap', icon: Calendar, label: 'Heatmap' },
    { path: '/profile', icon: Settings, label: 'Profile' },
  ];

  /* 
   * Bugfix: Removed generic 'Classroom' route to ensure admins
   * access classes via specific parameterized Dashboard cards.
   */
  const adminNav = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  ];

  const navItems = isAdmin ? adminNav : studentNav;

  const isActive = (item: typeof navItems[0]) => {
    return location.pathname === item.path;
  };

  const SidebarContent = () => (
    <>
      {/* Structural Headers with Playfair */}
      <div className="px-6 py-8 border-b border-[#C9A84C]/20 flex items-center justify-between">
        <Link to={isAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-4">
          <div className="h-8 w-8 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5 text-brand-gold" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-xl font-serif text-brand-text tracking-widest uppercase">LearnTrace</span>
          )}
        </Link>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden p-2">
          <XIcon className="h-5 w-5 text-brand-text" />
        </button>
      </div>

      {!isAdmin && (
        <div className="px-4 pt-6">
          <Link
            to="/entries/new"
            className={`flex items-center gap-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-200 ${
              sidebarCollapsed ? 'justify-center p-4' : 'px-6 py-4'
            }`}
          >
            <Plus className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm uppercase tracking-widest font-semibold">Log Entry</span>}
          </Link>
        </div>
      )}

      {/* Navigation Space */}
      <nav className="flex-1 px-4 py-8 space-y-4 overflow-y-auto">
        {isAdmin && !sidebarCollapsed && (
          <p className="px-4 py-2 text-xs font-serif text-[#C9A84C] uppercase tracking-[0.2em]">Registry</p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-4 rounded-md transition-all ${
                sidebarCollapsed ? 'justify-center p-4' : 'px-4 py-4'
              } ${
                active
                  ? 'border border-[#C9A84C] text-[#C9A84C]'
                  : 'text-brand-text/60 border border-transparent hover:border-[#C9A84C]/30 hover:text-brand-text'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm uppercase tracking-widest">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Footer flat border styling */}
      <div className="border-t border-[#C9A84C]/20 p-5">
        <div className={`flex items-center gap-4 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="h-10 w-10 border border-[#C9A84C] flex items-center justify-center text-brand-gold text-sm font-semibold flex-shrink-0 font-serif">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-text truncate font-serif">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-brand-text/50 uppercase tracking-widest truncate mt-1 flex items-center gap-2">
                {isAdmin ? (
                  <><GraduationCap className="h-3 w-3" /> Dean</>
                ) : (
                  <>{user?.collegeName || user?.email}</>
                )}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-3 text-brand-text/50 hover:text-brand-gold hover:border hover:border-brand-gold transition-all flex-shrink-0"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="hidden lg:flex absolute -right-4 top-24 h-8 w-8 bg-brand-dark border border-[#C9A84C] items-center justify-center hover:bg-[#C9A84C] hover:text-brand-dark text-brand-gold transition-colors z-50"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-4 w-4 " />
        ) : (
          <ChevronLeft className="h-4 w-4 " />
        )}
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text flex font-sans">
      <aside className={`hidden lg:flex flex-col bg-brand-dark border-r border-[#C9A84C]/20 relative transition-all duration-300 ${
        sidebarCollapsed ? 'w-[88px]' : 'w-[320px]'
      }`}>
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#0F0E0C]/80" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[300px] bg-brand-dark border-r border-[#C9A84C] flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-brand-dark border-b border-[#C9A84C]/20 px-6 h-20 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-3 border border-brand-gold text-brand-gold">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-brand-gold" />
            <span className="font-serif text-xl tracking-widest uppercase">LearnTrace</span>
          </div>
          <div className="w-12" />
        </header>

        <main className="flex-1 p-6 sm:p-10 lg:p-12 overflow-y-auto bg-brand-dark">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
