import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageCircle,
  Settings,
  User
} from 'lucide-react';

interface AdminSidebarProps {
  userProfile?: {
    name: string;
    role: string;
    avatar?: string;
  } | null;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  userProfile = null
}) => {
  const location = useLocation();

  const navItems = [
    {
      id: 'dashboard',
      label: 'DASHBOARD',
      icon: LayoutDashboard,
      path: '/admin'
    },
    {
      id: 'products',
      label: 'PRODUCTS',
      icon: Package,
      path: '/admin/products'
    },
    {
      id: 'orders',
      label: 'ORDERS',
      icon: ShoppingCart,
      path: '/admin/orders'
    },
    {
      id: 'messages',
      label: 'MESSAGES',
      icon: MessageCircle,
      path: '/admin/messages'
    },
    {
      id: 'settings',
      label: 'SETTINGS',
      icon: Settings,
      path: '/admin/settings'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-[#4a3436] to-[#3a2a2d] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Artisanal Ledger
        </h1>
        <p className="text-xs uppercase tracking-widest text-gray-300 mt-1">
          Educational Toy Centre
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-0 py-6 space-y-0 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.id}
              to={item.path}
              className={`block w-full px-6 py-4 flex items-center gap-4 transition-all duration-200 text-left group relative
                ${
                  active
                    ? 'bg-[#6b4a47] border-l-4 border-orange-500 text-white shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon
                size={20}
                className={`transition-transform ${
                  active ? 'text-orange-400' : 'group-hover:scale-110'
                }`}
              />
              <span className="text-sm font-medium tracking-wide uppercase">
                {item.label}
              </span>

              {/* Hover indicator for inactive items */}
              {!active && (
                <div className="absolute right-0 w-1 h-8 bg-orange-500/0 group-hover:bg-orange-500/100 transition-all duration-200 rounded-l" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <Link
          to="/admin/settings"
          className="block w-full flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:bg-white/10 group"
        >
          {/* Avatar Placeholder */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-orange-500/50 transition-shadow">
            {userProfile?.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name || 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={24} className="text-white" />
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-left overflow-hidden">
            <h3 className="text-sm font-semibold text-white truncate">
              {userProfile?.name || 'Loading...'}
            </h3>
            <p className="text-xs text-gray-300 uppercase tracking-widest">
              {userProfile?.role || 'Administrator'}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminSidebar;