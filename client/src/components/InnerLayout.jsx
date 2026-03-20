import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Star, CalendarCheck2, Bot, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';
import { useState } from 'react';

export function InnerLayout({ children, title }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarLinks = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: BookOpen, label: 'My Shelf', href: '/shelf' },
    { icon: Star, label: 'Reviews', href: '/reviews' },
    { icon: CalendarCheck2, label: 'Habit Tracker', href: '/habits' },
    { icon: Bot, label: 'AI Recommendations', href: '/recommendations' },
  ];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const getUserInitials = (email) => {
    if (!email) return 'U';
    return email.split('@')[0].split('.').map(part => part.charAt(0).toUpperCase()).join('');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-100 h-14">
        <div className="container-app flex h-full items-center justify-between px-4 md:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page Title - Center */}
          <h1 className="text-lg font-semibold text-slate-900 flex-1 text-center md:flex-initial">{title}</h1>

          {/* User Info - Right */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="w-6 h-6 bg-[#2D4A38] text-white rounded-full flex items-center justify-center text-xs font-medium">
                {getUserInitials(user?.email)}
              </div>
              <span className="text-sm font-medium text-slate-700 truncate max-w-32">
                {user?.email}
              </span>
            </div>
            {/* Mobile avatar only */}
            <div className="w-8 h-8 bg-[#2D4A38] text-white rounded-full flex items-center justify-center text-xs font-medium md:hidden">
              {getUserInitials(user?.email)}
            </div>
            <button
              onClick={handleSignOut}
              className="text-slate-500 hover:text-slate-700 transition-colors"
              type="button"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed left-0 top-14 h-full w-56 z-50 bg-[#1C2B22] transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}>
          <div className="p-6">
            {/* Logo Area */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <Logo />
                <div>
                  <div className="text-white font-semibold">BookShelf</div>
                  <div className="text-[#A8C4B0] text-xs">reading companion</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {sidebarLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive
                        ? 'bg-[#2D4A38] text-white border-l-2 border-[#5C8C6A] rounded-r-lg'
                        : 'text-[#A8C4B0] hover:bg-[#2D4A38]/10 hover:text-white'
                      }`}
                  >
                    <link.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-56 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
