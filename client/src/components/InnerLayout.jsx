import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Star, CalendarCheck2, Bot, User, LogOut, Menu, X, Users } from 'lucide-react';
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
    { icon: Users, label: 'Friends', href: '/friends' },
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
      <header className="sticky top-0 z-20 h-14 border-b border-[#e8e2d9]" style={{ background: 'rgba(250, 248, 244, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="flex h-full items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold text-slate-500 tracking-wide uppercase text-xs md:text-left flex-1 text-center md:flex-initial" style={{ letterSpacing: '0.08em' }}>{title}</h1>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm" style={{ background: 'rgba(45,74,56,0.08)', color: '#2D4A38' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#2D4A38' }}>
                {getUserInitials(user?.email)}
              </div>
              <span className="font-medium truncate max-w-32">{user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-red-600 transition-all hover:bg-red-50"
              type="button"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Sign out</span>
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
        <aside className={`fixed left-0 top-0 h-full w-60 z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`} style={{ background: 'linear-gradient(180deg, #1C2B22 0%, #162219 100%)', boxShadow: '4px 0 24px rgba(0,0,0,0.15)' }}>
          <div className="flex flex-col h-full p-5">
            <div className="mb-10 mt-2 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl text-white font-extrabold text-sm" style={{ background: 'linear-gradient(135deg, #2D4A38, #4a7c5e)', boxShadow: '0 4px 12px rgba(45,74,56,0.4)' }}>
                BS
              </div>
              <div>
                <div className="text-white font-bold text-sm tracking-tight">BookShelf</div>
                <div className="text-xs" style={{ color: '#6b9e7e' }}>reading companion</div>
              </div>
            </div>

            <nav className="flex-1 space-y-1">
              {sidebarLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
                    style={isActive ? {
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
                    } : {
                      color: '#8ab89a'
                    }}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ background: '#5C8C6A' }}></div>
                    )}
                    <link.icon className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span className="text-sm font-medium transition-all duration-200 group-hover:translate-x-1">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="px-3 py-2">
                <p className="text-xs" style={{ color: '#4a6b57' }}> 2026 BookShelf</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-60 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
