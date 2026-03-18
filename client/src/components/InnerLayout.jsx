import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Star, CalendarCheck2, Bot, User, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';

export function InnerLayout({ children, title }) {
  const { user, signOut } = useAuth();
  const location = useLocation();

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

  return (
    <div className="min-h-screen bg-[#FBF7F2]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 border-b border-white/60 bg-[#FBF7F2]/90 backdrop-blur">
        <div className="container-app flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="group inline-flex items-center gap-3">
              <Logo />
            </Link>
            <div className="h-6 w-px bg-slate-300"></div>
            <h1 className="text-lg font-medium text-slate-900">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="btn-ghost text-sm flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/50 border border-white/60">
              <User className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">{user?.email}</span>
            </div>
            <button 
              onClick={handleSignOut}
              className="btn-ghost text-sm" 
              type="button"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen border-r border-white/60 bg-white/30 backdrop-blur-sm sticky top-14">
          <div className="p-6">
            <nav className="space-y-2">
              {sidebarLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#1F3A2E]/10 text-[#1F3A2E] font-medium shadow-sm' 
                        : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
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
        <main className="flex-1 p-6 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
}
