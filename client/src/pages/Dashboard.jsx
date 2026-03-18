import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Star, CalendarCheck2, Bot, TrendingUp, BookMarked, PenTool, Flame, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [stats, setStats] = useState({
    booksRead: 0,
    wantToRead: 0,
    currentStreak: 0,
    reviewsWritten: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    try {
      // Fetch shelf stats
      const { data: shelfData } = await supabase
        .from('shelf')
        .select('status')
        .eq('user_id', user.id);

      // Fetch reviews count
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch reading streak
      const { data: logsData } = await supabase
        .from('reading_logs')
        .select('log_date')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(365);

      if (shelfData) {
        const booksRead = shelfData.filter(book => book.status === 'read').length;
        const wantToRead = shelfData.filter(book => book.status === 'want_to_read').length;

        // Calculate streak
        let streak = 0;
        if (logsData && logsData.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          let currentDate = new Date(today);

          for (const log of logsData) {
            const logDate = new Date(log.log_date).toISOString().split('T')[0];
            const currentDateStr = currentDate.toISOString().split('T')[0];

            if (logDate === currentDateStr) {
              streak++;
              currentDate.setDate(currentDate.getDate() - 1);
            } else {
              break;
            }
          }
        }

        setStats({
          booksRead,
          wantToRead,
          currentStreak: streak,
          reviewsWritten: reviewsCount || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = [
    {
      title: 'Books read',
      value: loading ? '...' : stats.booksRead.toString(),
      icon: BookMarked,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      href: '/shelf'
    },
    {
      title: 'Want to read',
      value: loading ? '...' : stats.wantToRead.toString(),
      icon: BookOpen,
      color: 'bg-green-50 text-green-600 border-green-100',
      href: '/shelf'
    },
    {
      title: 'Current streak',
      value: loading ? '...' : `${stats.currentStreak} days`,
      icon: Flame,
      color: 'bg-orange-50 text-orange-600 border-orange-100',
      href: '/habits'
    },
    {
      title: 'Reviews written',
      value: loading ? '...' : stats.reviewsWritten.toString(),
      icon: PenTool,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      href: '/reviews'
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBF7F2]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen border-r border-white/60 bg-white/30 backdrop-blur-sm sticky top-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <Logo />
              <span className="text-lg font-semibold text-slate-900">BookShelf</span>
            </div>
            <nav className="space-y-2">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1F3A2E]/10 text-[#1F3A2E] font-medium"
              >
                <Home className="h-4 w-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link
                to="/shelf"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-white/50 hover:text-slate-900 transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                <span className="text-sm font-medium">My Shelf</span>
              </Link>
              <Link
                to="/reviews"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-white/50 hover:text-slate-900 transition-colors"
              >
                <Star className="h-4 w-4" />
                <span className="text-sm font-medium">Reviews</span>
              </Link>
              <Link
                to="/habits"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-white/50 hover:text-slate-900 transition-colors"
              >
                <CalendarCheck2 className="h-4 w-4" />
                <span className="text-sm font-medium">Habit Tracker</span>
              </Link>
              <Link
                to="/recommendations"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-white/50 hover:text-slate-900 transition-colors"
              >
                <Bot className="h-4 w-4" />
                <span className="text-sm font-medium">AI Recommendations</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 animate-fadeIn">
          <div className="max-w-4xl">
            {/* Welcome Message */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Welcome back, {user?.email?.split('@')[0]}!
              </h1>
              <p className="text-slate-600">
                Here's what's happening with your reading life today.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {summaryCards.map((card) => (
                <button
                  key={card.title}
                  onClick={() => navigate(card.href)}
                  className={`glass rounded-2xl p-4 border ${card.color} text-left hover:shadow-lg transition-all duration-200 active:scale-95 group`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <card.icon className="h-5 w-5" />
                    <TrendingUp className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">{card.value}</div>
                  <div className="text-sm font-medium">{card.title}</div>
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  to="/shelf"
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/50 border border-white/60 hover:bg-white/70 transition-colors hover:shadow-sm active:scale-95"
                >
                  <BookOpen className="h-5 w-5 text-[#1F3A2E]" />
                  <div>
                    <div className="font-medium text-slate-900">Add a book to your shelf</div>
                    <div className="text-sm text-slate-600">Search and save books you want to read</div>
                  </div>
                </Link>
                <Link
                  to="/recommendations"
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/50 border border-white/60 hover:bg-white/70 transition-colors hover:shadow-sm active:scale-95"
                >
                  <Bot className="h-5 w-5 text-[#1F3A2E]" />
                  <div>
                    <div className="font-medium text-slate-900">Get AI recommendations</div>
                    <div className="text-sm text-slate-600">Discover your next favorite book</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
