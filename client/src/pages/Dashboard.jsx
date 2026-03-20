import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';

export function Dashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState({
    booksRead: 0,
    wantToRead: 0,
    currentStreak: 0,
    reviewsWritten: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentBook, setRecentBook] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchRecentBook();
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

  const fetchRecentBook = async () => {
    try {
      const { data } = await supabase
        .from('shelf')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      setRecentBook(data && data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error('Error fetching recent book:', error);
    }
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning. What are you reading today?";
    if (hour < 18) return "Good afternoon. Time for a few pages?";
    return "Good evening. Wind down with a good book.";
  };

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
                <span className="w-4 h-4 rounded bg-[#1F3A2E]/20"></span>
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
                <span className="w-4 h-4 rounded bg-slate-200"></span>
                <span className="text-sm font-medium">Reviews</span>
              </Link>
              <Link
                to="/habits"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-white/50 hover:text-slate-900 transition-colors"
              >
                <span className="w-4 h-4 rounded bg-slate-200"></span>
                <span className="text-sm font-medium">Habit Tracker</span>
              </Link>
              <Link
                to="/recommendations"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-white/50 hover:text-slate-900 transition-colors"
              >
                <span className="w-4 h-4 rounded bg-slate-200"></span>
                <span className="text-sm font-medium">AI Recommendations</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl">
            {/* Hero Section */}
            <div className="mb-12">
              <h1 className="text-4xl font-serif font-bold text-slate-900 mb-3">
                Happy reading, {user?.email?.split('@')[0]}!
              </h1>
              <p className="text-lg text-slate-600 mb-8">
                {getTimeBasedGreeting()}
              </p>

              {/* Recent Book or Empty State */}
              {recentBook ? (
                <div className="flex items-start gap-6 p-6 bg-white rounded-2xl shadow-md">
                  {recentBook.cover_url ? (
                    <img
                      src={recentBook.cover_url}
                      alt={recentBook.title}
                      className="w-32 h-44 object-cover rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="w-32 h-44 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg shadow-md flex items-center justify-center">
                      <span className="text-2xl font-serif text-amber-800">
                        {recentBook.title?.charAt(0) || 'B'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">{recentBook.title}</h3>
                    <p className="text-slate-600 mb-4">{recentBook.author}</p>
                    <Link
                      to="/shelf"
                      className="btn-primary"
                    >
                      Continue reading
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-white rounded-2xl shadow-md text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-amber-800" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Add your first book to get started</h3>
                  <Link
                    to="/shelf"
                    className="btn-primary"
                  >
                    Go to My Shelf
                  </Link>
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-6 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {loading ? '...' : stats.booksRead}
                </div>
                <div className="text-sm text-slate-500">Books Read</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {loading ? '...' : stats.wantToRead}
                </div>
                <div className="text-sm text-slate-500">Want to Read</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {loading ? '...' : stats.currentStreak}
                </div>
                <div className="text-sm text-slate-500">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {loading ? '...' : stats.reviewsWritten}
                </div>
                <div className="text-sm text-slate-500">Reviews Written</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-6">
              <Link
                to="/recommendations"
                className="p-8 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow group"
              >
                <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-[#1F3A2E] transition-colors">
                  Find your next book
                </h3>
                <p className="text-slate-600">
                  Get personalized AI recommendations based on your taste
                </p>
              </Link>
              <Link
                to="/habits"
                className="p-8 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow group"
              >
                <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-[#1F3A2E] transition-colors">
                  Log today's reading
                </h3>
                <p className="text-slate-600">
                  Track your progress and maintain your reading streak
                </p>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
