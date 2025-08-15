import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Reports', href: '/reports', icon: FileText },
    ...(user?.role === 'admin'
      ? [{ name: 'Users', href: '/users', icon: Users }]
      : []),
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div
      className={`fixed top-0 left-0 z-40 flex flex-col justify-between ${isOpen ? 'w-64' : 'w-20'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-xl transition-all duration-300 lg:static lg:inset-0`}
    >
      {/* Header */}
      <div className="flex flex-col items-center py-6 gap-4">
        <div className="flex items-center justify-center w-full gap-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
            <CheckSquare className="w-7 h-7 text-white" />
          </div>
          {isOpen ? (
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              TaskFlow
            </span>
          ) : null}
        </div>
        <div className="flex gap-2 w-full justify-center">
          <button
            onClick={onToggle}
            onContextMenu={e => { e.preventDefault(); document.documentElement.classList.toggle('dark'); }}
            className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-gray-800 transition-all duration-200 shadow"
            aria-label="Toggle Sidebar or Theme"
          >
            {!isOpen ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-2 px-2 mt-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center w-full px-4 py-3 text-base font-semibold rounded-xl transition-all duration-200 shadow-sm ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg scale-105'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800 hover:scale-105'
              }`
            }
            onClick={() => window.innerWidth < 1024 && onToggle()}
          >
            <item.icon className={`w-6 h-6 ${isOpen ? 'mr-3' : 'mx-auto'} transition-all duration-200`} />
            {isOpen ? <span className="font-semibold">{item.name}</span> : null}
          </NavLink>
        ))}
      </nav>
      {/* User section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center shadow">
            <span className="text-base font-bold text-gray-700 dark:text-gray-300">
              {user?.firstName && user?.lastName ? `${user.firstName[0]}${user.lastName[0]}` : ''}
            </span>
          </div>
          {isOpen ? (
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          ) : null}
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center px-3 py-2 text-base font-semibold text-gray-700 rounded-xl hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-gray-800 transition-all duration-200 shadow"
        >
          <LogOut className="w-5 h-5 mr-3" />
          {isOpen ? 'Sign out' : null}
        </button>
      </div>
    </div>
  );
}