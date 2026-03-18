export function Footer() {
  return (
    <footer className="border-t border-white/60">
      <div className="container-app flex flex-col gap-3 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-semibold text-slate-600">
          © {new Date().getFullYear()} BookShelf. Built for better reading.
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
          <a className="hover:text-slate-900" href="#">
            Privacy
          </a>
          <a className="hover:text-slate-900" href="#">
            Terms
          </a>
          <a className="hover:text-slate-900" href="#">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

