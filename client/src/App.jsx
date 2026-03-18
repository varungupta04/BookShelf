import { BookOpen, Bot, CalendarCheck2, Star } from 'lucide-react';
import { FeatureCard } from './components/FeatureCard.jsx';
import { Footer } from './components/Footer.jsx';
import { Navbar } from './components/Navbar.jsx';

function App() {
  return (
    <div className="min-h-screen">
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
                get smart recommendations when you’re ready for your next book.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button className="btn-primary w-full sm:w-auto" type="button">
                  Get started
                </button>
                <button className="btn-ghost w-full sm:w-auto" type="button">
                  See features
                </button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="glass rounded-2xl p-4 text-left">
                  <div className="text-xs font-bold text-slate-600">Today</div>
                  <div className="mt-2 text-sm font-extrabold text-slate-900">15 minutes</div>
                  <div className="mt-1 text-sm text-slate-600">Reading streak: 6 days</div>
                </div>
                <div className="glass rounded-2xl p-4 text-left">
                  <div className="text-xs font-bold text-slate-600">Up next</div>
                  <div className="mt-2 text-sm font-extrabold text-slate-900">Pick your next vibe</div>
                  <div className="mt-1 text-sm text-slate-600">AI recommendations, tuned to you</div>
                </div>
                <div className="glass rounded-2xl p-4 text-left">
                  <div className="text-xs font-bold text-slate-600">Inbox</div>
                  <div className="mt-2 text-sm font-extrabold text-slate-900">3 new notes</div>
                  <div className="mt-1 text-sm text-slate-600">Captured while you read</div>
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
              description="Track what you want to read, what you’re reading, and what you’ve finished."
            />
            <FeatureCard
              icon={Star}
              title="Reviews"
              description="Save highlights, thoughts, and ratings you’ll actually want to revisit."
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

export default App;
