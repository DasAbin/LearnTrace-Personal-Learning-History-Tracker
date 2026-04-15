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
  Users,
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

  const adminNav = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { path: '/admin/classroom', icon: Users, label: 'Classroom', matchPrefix: true },
  ];

  const navItems = isAdmin ? adminNav : studentNav;

  const isActive = (item: typeof navItems[0]) => {
    if ((item as any).matchPrefix) {
      return location.pathname.startsWith(item.path);
    }
    return location.pathname === item.path;
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100 flex items-center justify-between">
        <Link to={isAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-4.5 w-4.5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-bold text-gray-900 tracking-tight">LearnTrace</span>
          )}
        </Link>
        {/* Mobile close */}
        <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg">
          <XIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Add Entry (Student only) */}
      {!isAdmin && (
        <div className="px-3 pt-4">
          <Link
            to="/entries/new"
            className={`flex items-center gap-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 active:scale-[0.98] ${
              sidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'
            }`}
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-bold">Add Entry</span>}
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {isAdmin && !sidebarCollapsed && (
          <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Administration</p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl transition-all ${
                sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${
                active
                  ? 'bg-amber-50 text-amber-700 font-bold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-amber-600' : ''}`} />
              {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-gray-100 p-3">
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
            isAdmin ? 'bg-amber-500' : 'bg-gray-900'
          }`}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400 font-medium truncate flex items-center gap-1">
                {isAdmin ? (
                  <><GraduationCap className="h-3 w-3" /> Admin</>
                ) : (
                  <><>{user?.collegeName || user?.email}</>{' '}</>
                )}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Collapse Toggle (desktop) */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-3 w-3 text-gray-500" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-gray-500" />
        )}
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-200 relative transition-all duration-300 ${
        sidebarCollapsed ? 'w-[72px]' : 'w-[250px]'
      }`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-white flex flex-col shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-amber-500 rounded-lg flex items-center justify-center">
              <BookOpen className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">LearnTrace</span>
          </div>
          <div className="w-9" /> {/* Balance spacer */}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
