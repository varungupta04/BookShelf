export function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F1E6D7] text-[#1F3A2E] shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-slate-900">{title}</div>
          <div className="mt-1 text-sm leading-6 text-slate-600">{description}</div>
        </div>
      </div>
    </div>
  );
}

