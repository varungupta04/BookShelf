import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Star, CalendarCheck2, Bot, Home, CheckCircle, Plus, Flame, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { InnerLayout } from '../components/InnerLayout';

export function HabitTracker() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayLogged, setTodayLogged] = useState(false);
  const [readingLogs, setReadingLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggingToday, setLoggingToday] = useState(false);

  useEffect(() => {
    fetchReadingData();
  }, []);

  const fetchReadingData = async () => {
    setLoading(true);
    try {
      const { data: logsData } = await supabase
        .from('reading_logs')
        .select('log_date')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(365);

      if (logsData) {
        setReadingLogs(logsData);

        // Check if today is logged
        const today = new Date().toISOString().split('T')[0];
        const todayExists = logsData.some(log => log.log_date === today);
        setTodayLogged(todayExists);

        // Calculate streak
        let streak = 0;
        if (logsData.length > 0) {
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

        setCurrentStreak(streak);
      }
    } catch (error) {
      console.error('Error fetching reading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const logToday = async () => {
    if (todayLogged) return;

    setLoggingToday(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('reading_logs')
        .insert({
          user_id: user.id,
          log_date: today
        });

      if (!error) {
        setTodayLogged(true);
        setCurrentStreak(prev => prev + 1);
        await fetchReadingData();
        addToast('Great job! Reading logged for today! 🎉', 'success');
      }
    } catch (error) {
      console.error('Error logging today:', error);
      addToast('Failed to log reading', 'error');
    } finally {
      setLoggingToday(false);
    }
  };

  const generate30DayCalendar = () => {
    const calendar = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const isLogged = readingLogs.some(log => log.log_date === dateStr);

      calendar.push({
        date,
        dateStr,
        isLogged,
        isToday: i === 0
      });
    }

    return calendar;
  };

  const getMotivationalMessage = () => {
    if (currentStreak === 0) {
      return "Start your reading journey today! Every book begins with a single page.";
    } else if (currentStreak === 1) {
      return "Great start! You've read for 1 day. Keep the momentum going!";
    } else if (currentStreak < 7) {
      return `Fantastic! ${currentStreak} days in a row. You're building a great habit!`;
    } else if (currentStreak < 30) {
      return `Amazing! ${currentStreak} days of consistent reading. You're unstoppable!`;
    } else {
      return `Incredible! ${currentStreak} days streak. You're a reading champion! 🎉`;
    }
  };

  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthLogs = readingLogs.filter(log => {
      const logDate = new Date(log.log_date);
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    });

    return monthLogs.length;
  };

  if (loading) {
    return (
      <InnerLayout title="Habit Tracker">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3A2E] mx-auto mb-4"></div>
            <p className="text-slate-600">Loading your reading habits...</p>
          </div>
        </div>
      </InnerLayout>
    );
  }

  return (
    <InnerLayout title="Habit Tracker">
      <div className="max-w-4xl">
        {/* Log Today Button */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="text-center">
            {todayLogged ? (
              <div className="flex items-center justify-center gap-3 text-green-600">
                <CheckCircle className="h-6 w-6" />
                <span className="font-medium">Great job! You've already logged today's reading.</span>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Log reading today</h3>
                <p className="text-slate-600 mb-4">Did you read today? Log it to keep your streak alive!</p>
                <button
                  onClick={logToday}
                  disabled={loggingToday}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  {loggingToday ? (
                    'Logging...'
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Log Today's Reading
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <div className="glass rounded-2xl p-6 border border-orange-100 bg-orange-50">
            <div className="flex items-center gap-3 mb-3">
              <Flame className="h-6 w-6 text-orange-600" />
              <h3 className="font-semibold text-slate-900">Current Streak</h3>
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-2">{currentStreak} days</div>
            <p className="text-sm text-slate-600">{getMotivationalMessage()}</p>
          </div>

          <div className="glass rounded-2xl p-6 border border-blue-100 bg-blue-50">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="h-6 w-6 text-blue-600" />
              <h3 className="font-semibold text-slate-900">This Month</h3>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{getMonthlyStats()} days</div>
            <p className="text-sm text-slate-600">Days you've read this month</p>
          </div>
        </div>

        {/* 30-Day Calendar */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">30-Day View</h3>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-xs font-medium text-slate-600 text-center py-2">
                {day}
              </div>
            ))}
            {generate30DayCalendar().map((day, index) => (
              <div
                key={day.dateStr}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${day.isToday
                    ? 'ring-2 ring-[#1F3A2E] bg-white'
                    : day.isLogged
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-white/50 text-slate-400 border border-white/60'
                  }`}
                title={day.date.toLocaleDateString()}
              >
                {day.date.getDate()}
                {day.isLogged && (
                  <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              <span>Reading logged</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white/50 border border-white/60 rounded"></div>
              <span>No reading</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white border-2 border-[#1F3A2E] rounded"></div>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>
    </InnerLayout>
  );
}
