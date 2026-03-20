import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { BookOpen, Bot, CalendarCheck2, Star, ArrowRight } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FeatureCard } from './components/FeatureCard';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { MyShelf } from './pages/MyShelf';
import { HabitTracker } from './pages/HabitTracker';
import { Reviews } from './pages/Reviews';
import { Recommendations } from './pages/Recommendations';

function Home() {
  const { user } = useAuth();

  return (
    <div>
      <Navbar />

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#F1E6D7] blur-3xl" />
            <div className="absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-[#DDE7D8] blur-3xl" />
          </div>

          <div className="container-app relative py-16 sm:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <div className="badge">Modern reading companion</div>
              <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                Your reading life, organised
              </h1>
              <p className="mt-5 text-pretty text-lg leading-7 text-slate-600">
                Keep a beautiful reading list, capture thoughts as you go, build habits that stick, and
                get smart recommendations when you're ready for your next book.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {user ? (
                  <>
                    <Link to="/dashboard" className="btn-primary w-full sm:w-auto flex items-center gap-2">
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link to="/shelf" className="btn-ghost w-full sm:w-auto">
                      My Shelf
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/signin" className="btn-primary w-full sm:w-auto flex items-center gap-2">
                      Get started
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link to="/signin" className="btn-ghost w-full sm:w-auto">
                      Sign In
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="glass rounded-2xl p-6 text-left hover:bg-white/70 transition-colors cursor-pointer group">
                  <BookOpen className="h-8 w-8 text-[#1F3A2E] mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900 mb-2">Reading List</h3>
                  <p className="text-sm text-slate-600 mb-3">Track what you want to read, what you're reading, and what you've finished.</p>
                  <span className="text-xs font-medium text-[#1F3A2E] group-hover:underline">Learn more →</span>
                </div>
                <div className="glass rounded-2xl p-6 text-left hover:bg-white/70 transition-colors cursor-pointer group">
                  <Star className="h-8 w-8 text-[#1F3A2E] mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900 mb-2">Reviews</h3>
                  <p className="text-sm text-slate-600 mb-3">Save highlights, thoughts, and ratings you'll actually want to revisit.</p>
                  <span className="text-xs font-medium text-[#1F3A2E] group-hover:underline">Learn more →</span>
                </div>
                <div className="glass rounded-2xl p-6 text-left hover:bg-white/70 transition-colors cursor-pointer group">
                  <CalendarCheck2 className="h-8 w-8 text-[#1F3A2E] mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900 mb-2">Habit Tracker</h3>
                  <p className="text-sm text-slate-600 mb-3">Build a streak with gentle goals and a dashboard that keeps you motivated.</p>
                  <span className="text-xs font-medium text-[#1F3A2E] group-hover:underline">Learn more →</span>
                </div>
                <div className="glass rounded-2xl p-6 text-left hover:bg-white/70 transition-colors cursor-pointer group">
                  <Bot className="h-8 w-8 text-[#1F3A2E] mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-slate-900 mb-2">AI Recommendations</h3>
                  <p className="text-sm text-slate-600 mb-3">Ask for your next read by mood, genre, pacing, or themes—instantly.</p>
                  <span className="text-xs font-medium text-[#1F3A2E] group-hover:underline">Learn more →</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container-app py-14 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Everything you need to read with intention
            </h2>
            <p className="mt-3 text-pretty text-base leading-7 text-slate-600">
              Simple, fast, and delightful—built to support your reading taste and your time.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={BookOpen}
              title="Reading List"
              description="Track what you want to read, what you're reading, and what you've finished."
            />
            <FeatureCard
              icon={Star}
              title="Reviews"
              description="Save highlights, thoughts, and ratings you'll actually want to revisit."
            />
            <FeatureCard
              icon={CalendarCheck2}
              title="Habit Tracker"
              description="Build a streak with gentle goals and a dashboard that keeps you motivated."
            />
            <FeatureCard
              icon={Bot}
              title="AI Recommendations"
              description="Ask for your next read by mood, genre, pacing, or themes—instantly."
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shelf"
              element={
                <ProtectedRoute>
                  <MyShelf />
                </ProtectedRoute>
              }
            />
            <Route
              path="/habits"
              element={
                <ProtectedRoute>
                  <HabitTracker />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviews"
              element={
                <ProtectedRoute>
                  <Reviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations"
              element={
                <ProtectedRoute>
                  <Recommendations />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
