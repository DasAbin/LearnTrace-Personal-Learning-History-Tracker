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
  Plus
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/timeline', icon: Clock, label: 'Timeline' },
    { path: '/badges', icon: Award, label: 'Badge Vault' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/heatmap', icon: Calendar, label: 'Heatmap' },
    { path: '/profile', icon: Settings, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-soft border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold text-deep-blue">LearnTrace</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                to="/entries/new"
                className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-button hover:bg-blue-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Entry</span>
              </Link>
              <div className="text-sm text-gray-600 hidden sm:block">
                {user?.firstName} {user?.lastName}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-alert-red transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-button transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-card text-gray-700 hover:bg-gray-100 shadow-soft'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main>{children}</main>
      </div>
    </div>
  );
};
