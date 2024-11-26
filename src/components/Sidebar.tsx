import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../hooks/useUserRole';
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  Clock,
  PlaySquare,
  Wallet,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react';

export default function Sidebar() {
  const { logout } = useAuth();
  const { isAdmin } = useUserRole();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Centers', href: '/centers', icon: Building2, adminOnly: true },
    { name: 'Animators', href: '/animators', icon: Users, adminOnly: true },
    { name: 'Periods', href: '/periods', icon: Calendar },
    { name: 'Activities', href: '/activities', icon: PlaySquare },
    { name: 'Time Tracking', href: '/time-tracking', icon: Clock },
    { name: 'Budget', href: '/budget', icon: Wallet, adminOnly: true },
    { name: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
    { name: 'Help', href: '/help', icon: HelpCircle }
  ];

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
      <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <div className="flex flex-shrink-0 items-center px-4">
            <h1 className="text-2xl font-bold text-indigo-600">Leisure Center</h1>
          </div>
          <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
            {navigation.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon
                    className="mr-3 h-5 w-5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
          <button
            onClick={() => logout()}
            className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
          >
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}