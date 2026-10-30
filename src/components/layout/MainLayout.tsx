import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Upload,
  Database,
  Users,
  LogOut,
  Menu,
  X,
  Vote,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/search',
      labelEn: 'Search Voters',
      labelTe: 'ఓటర్ల శోధన',
      icon: Search,
      adminOnly: false,
    },
    {
      to: '/dashboard',
      labelEn: 'Dashboard',
      labelTe: 'డాష్‌బోర్డ్',
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      to: '/upload',
      labelEn: 'Upload Excel',
      labelTe: 'ఎక్సెల్ అప్‌లోడ్',
      icon: Upload,
      adminOnly: true,
    },
    {
      to: '/data-management',
      labelEn: 'Data Management',
      labelTe: 'డేటా నిర్వహణ',
      icon: Database,
      adminOnly: true,
    },
    {
      to: '/user-management',
      labelEn: 'User Roles',
      labelTe: 'వినియోగదారులు',
      icon: Users,
      adminOnly: true,
    },
  ];

  const filteredNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5F8FC]">
      {/* Top Mobile Header */}
      <header className="lg:hidden bg-[#123D73] text-white flex items-center justify-between px-4 py-3 sticky top-0 z-40 shadow-md">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight leading-none">Ward 81 Voter Search</h1>
            <p className="text-[11px] text-blue-200 font-telugu mt-0.5">వార్డు 81 ఓటర్ల శోధన</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Desktop Sticky Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#123D73] text-white shrink-0 sticky top-0 h-screen shadow-xl z-30 justify-between">
        <div>
          {/* Logo Brand */}
          <div className="p-5 border-b border-blue-900/60 flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-inner">
              <Vote className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight">Ward 81 Search</div>
              <div className="text-xs text-blue-200 font-telugu mt-0.5">వార్డు 81 ఓటర్ల శోధన</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-semibold'
                      : 'text-blue-100/90 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className={cn('w-4 h-4 mr-3 shrink-0', isActive ? 'text-white' : 'text-blue-300 group-hover:text-white')} />
                  <div className="flex flex-col">
                    <span>{item.labelEn}</span>
                    <span className="text-[11px] font-normal text-blue-200 group-hover:text-blue-100 font-telugu -mt-0.5">
                      {item.labelTe}
                    </span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout Bottom Bar */}
        <div className="p-4 border-t border-blue-900/60 bg-[#0e305c]">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-700/80 flex items-center justify-center text-sm font-bold border border-blue-400/40">
              {user?.display_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.display_name || 'Authorized User'}</p>
              <div className="flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-[11px] text-blue-200 capitalize">{user?.role || 'User'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-blue-200 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/30 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Slideout Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-[#123D73] text-white p-5 rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/60 mb-4">
              <div className="flex items-center space-x-2">
                <Vote className="w-5 h-5 text-blue-400" />
                <span className="font-bold">Ward 81 Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center px-4 py-3 rounded-lg text-sm font-medium',
                      isActive ? 'bg-blue-600 text-white font-semibold' : 'text-blue-100 hover:bg-white/10'
                    )}
                  >
                    <Icon className="w-5 h-5 mr-3 shrink-0" />
                    <div>
                      <div>{item.labelEn}</div>
                      <div className="text-xs text-blue-200 font-telugu">{item.labelTe}</div>
                    </div>
                  </NavLink>
                );
              })}
            </nav>
            <div className="mt-6 pt-4 border-t border-blue-900/60 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{user?.display_name}</p>
                <p className="text-xs text-blue-300 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-red-300 bg-red-950/40 border border-red-800/40 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        <div className="w-full flex-1 flex flex-col items-center">
          {children}
        </div>
      </main>
    </div>
  );
};
