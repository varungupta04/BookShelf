import { LogIn, LogOut, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-10 border-b border-white/60 bg-[#FBF7F2]/80 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link className="group inline-flex items-center gap-3" to="/" aria-label="BookShelf home">
          <Logo />
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="btn-primary flex items-center gap-2"
              >
                Go to Dashboard
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/50 border border-white/60">
                <User className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">{user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="btn-ghost"
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/signin" className="btn-ghost">
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

