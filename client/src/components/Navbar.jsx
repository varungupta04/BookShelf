import { LogIn } from 'lucide-react';
import { Logo } from './Logo.jsx';

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/60 bg-[#FBF7F2]/80 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <a className="group inline-flex items-center gap-3" href="/" aria-label="BookShelf home">
          <Logo />
        </a>

        <div className="flex items-center gap-2">
          <button className="btn-ghost" type="button">
            <LogIn className="h-4 w-4" />
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
}

