import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { InnerLayout } from '../components/InnerLayout';

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
    <InnerLayout title="Dashboard">
      <div className="max-w-4xl">
        {/* Hero Section */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-3">
            Happy reading, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-base md:text-lg text-slate-600 mb-6 md:mb-8">
            {getTimeBasedGreeting()}
          </p>

          {/* Recent Book or Empty State */}
          {recentBook ? (
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 p-4 md:p-6 card">
              {recentBook.cover_url ? (
                <img
                  src={recentBook.cover_url}
                  alt={recentBook.title}
                  className="w-24 h-32 md:w-32 md:h-44 object-cover rounded-lg shadow-md mx-auto md:mx-0"
                />
              ) : (
                <div className="w-24 h-32 md:w-32 md:h-44 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg shadow-md flex items-center justify-center mx-auto md:mx-0">
                  <span className="text-xl md:text-2xl font-serif text-amber-800">
                    {recentBook.title?.charAt(0) || 'B'}
                  </span>
                </div>
              )}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-2">{recentBook.title}</h3>
                <p className="text-sm md:text-base text-slate-600 mb-4">{recentBook.author}</p>
                <Link
                  to="/shelf"
                  className="btn-primary"
                >
                  Continue reading
                </Link>
              </div>
            </div>
          ) : (
            <div className="card border-2 border-dashed border-slate-200 text-center p-6 md:p-8">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-slate-500" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-2">Your shelf is empty</h3>
              <p className="text-sm md:text-base text-slate-600 mb-4 md:mb-6">Add some books to get started with your reading journey</p>
              <Link
                to="/shelf"
                className="btn-primary"
              >
                Browse books
              </Link>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="card text-center p-4 md:p-5">
            <div className="text-2xl md:text-4xl font-bold text-slate-900 mb-1">
              {loading ? '...' : stats.booksRead}
            </div>
            <div className="text-xs uppercase tracking-widest text-slate-400 font-medium">Books Read</div>
          </div>
          <div className="card text-center p-4 md:p-5">
            <div className="text-2xl md:text-4xl font-bold text-slate-900 mb-1">
              {loading ? '...' : stats.wantToRead}
            </div>
            <div className="text-xs uppercase tracking-widest text-slate-400 font-medium">Want to Read</div>
          </div>
          <div className="card text-center p-4 md:p-5">
            <div className="text-2xl md:text-4xl font-bold text-slate-900 mb-1">
              {loading ? '...' : stats.currentStreak}
            </div>
            <div className="text-xs uppercase tracking-widest text-slate-400 font-medium">Day Streak</div>
          </div>
          <div className="card text-center p-4 md:p-5">
            <div className="text-2xl md:text-4xl font-bold text-slate-900 mb-1">
              {loading ? '...' : stats.reviewsWritten}
            </div>
            <div className="text-xs uppercase tracking-widest text-slate-400 font-medium">Reviews Written</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6">
          <Link
            to="/recommendations"
            className="card border-l-4 border-amber-400 cursor-pointer hover:shadow-md group p-4 md:p-6"
          >
            <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-2 group-hover:text-[#2D4A38] transition-colors">
              Find your next book
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Get personalized AI recommendations based on your taste
            </p>
          </Link>
          <Link
            to="/habits"
            className="card border-l-4 border-green-500 cursor-pointer hover:shadow-md group p-4 md:p-6"
          >
            <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-2 group-hover:text-[#2D4A38] transition-colors">
              Log today's reading
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Track your progress and maintain your reading streak
            </p>
          </Link>
        </div>
      </div>
    </InnerLayout>
  );
}
