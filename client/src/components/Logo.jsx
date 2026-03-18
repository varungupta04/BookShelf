export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#1F3A2E] text-white shadow-sm">
        <span className="text-sm font-extrabold tracking-tight">BS</span>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-extrabold tracking-tight text-slate-900">BookShelf</div>
        <div className="text-[11px] font-semibold text-slate-600">reading companion</div>
      </div>
    </div>
  );
}

