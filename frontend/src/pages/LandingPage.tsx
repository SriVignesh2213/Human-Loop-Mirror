import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight, ShieldCheck, Repeat, Clock, Shuffle, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-charcoal-950 text-charcoal-100 font-sans selection:bg-telemetry-teal/20 selection:text-telemetry-teal">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-charcoal-800/80 px-6 sm:px-12 flex items-center justify-between sticky top-0 bg-charcoal-950/80 backdrop-blur-md z-30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-charcoal-800 border border-telemetry-teal/40 flex items-center justify-center text-telemetry-teal">
            <Layers className="w-4 h-4 text-telemetry-teal" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-charcoal-100">
            Habit Loop Mirror
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/login"
            className="text-xs font-medium text-charcoal-300 hover:text-charcoal-100 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-3.5 py-1.5 rounded text-xs font-semibold bg-telemetry-teal text-charcoal-950 hover:bg-telemetry-teal-bright transition-colors shadow-sm"
          >
            Start Your Habit Mirror
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-telemetry-teal/10 border border-telemetry-teal/25 text-telemetry-teal text-xs font-mono mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-telemetry-teal animate-ping" />
          <span>BEHAVIORAL TELEMETRY FOR DIGITAL SELF-REGULATION</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-charcoal-100 max-w-3xl mx-auto leading-tight">
          Screen Time tells you how much.{' '}
          <span className="text-telemetry-teal">We tell you why.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-charcoal-400 max-w-2xl mx-auto leading-relaxed">
          See the patterns behind your digital habits, understand what triggers them, and choose changes that fit your life.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-sm font-semibold bg-telemetry-teal text-charcoal-950 hover:bg-telemetry-teal-bright transition-colors shadow-subtle"
          >
            <span>Start Your Habit Mirror</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-medium bg-charcoal-900 hover:bg-charcoal-800 text-charcoal-200 border border-charcoal-800 transition-colors"
          >
            See How It Works
          </a>
        </div>

        {/* Non-judgmental Ethics Note */}
        <div className="mt-8 flex items-center justify-center space-x-2 text-xs text-charcoal-400">
          <ShieldCheck className="w-4 h-4 text-telemetry-teal" />
          <span>Non-judgmental awareness. No dopamine detox clichés. Pure self-chosen sublimation.</span>
        </div>
      </section>

      {/* Core Loop Architecture */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-16 border-t border-charcoal-800/80">
        <div className="text-center mb-12">
          <span className="text-[11px] font-mono uppercase tracking-widest text-telemetry-teal block font-semibold">
            THE 5-STAGE BEHAVIORAL MIRROR
          </span>
          <h2 className="text-2xl font-bold text-charcoal-100 mt-1">
            From Passive Usage to Conscious Choice
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              step: '01',
              title: 'DETECT',
              desc: 'Correlates app notifications and session timestamps to verify recurring habit loops.',
            },
            {
              step: '02',
              title: 'EXPLAIN',
              desc: 'Explains the context, latency, and duration impact without judgment or medical claims.',
            },
            {
              step: '03',
              title: 'REFLECT',
              desc: 'Allows intentionality labeling (Planned, Necessary, Relaxation, or Unplanned).',
            },
            {
              step: '04',
              title: 'SUBSTITUTE',
              desc: 'Personal Swap suggests 2, 10, or 20-minute meaningful offline or creative alternatives.',
            },
            {
              step: '05',
              title: 'IMPROVE',
              desc: 'Tracks multi-week habit evolution and verified reclaimed time without fabrication.',
            },
          ].map((item) => (
            <div key={item.step} className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-telemetry-teal font-semibold block mb-2">
                  {item.step}
                </span>
                <h3 className="text-sm font-semibold text-charcoal-100 mb-2">{item.title}</h3>
                <p className="text-xs text-charcoal-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-charcoal-800/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-6">
            <div className="w-9 h-9 rounded bg-charcoal-800 border border-telemetry-teal/30 flex items-center justify-center text-telemetry-teal mb-4">
              <Repeat className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-charcoal-100 mb-2">Evidence-Based Detection</h3>
            <p className="text-xs text-charcoal-400 leading-relaxed">
              Habit loops require proof. We calculate when sessions follow notifications within 3 minutes and recur across multiple days.
            </p>
          </div>

          <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-6">
            <div className="w-9 h-9 rounded bg-charcoal-800 border border-telemetry-amber/30 flex items-center justify-center text-telemetry-amber mb-4">
              <Shuffle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-charcoal-100 mb-2">Personal Swap Engine</h3>
            <p className="text-xs text-charcoal-400 leading-relaxed">
              Sublimation-inspired activity substitution. Redirect an impulsive scroll into a sketch, coding puzzle, or brief walk based strictly on your onboarding preferences.
            </p>
          </div>

          <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-6">
            <div className="w-9 h-9 rounded bg-charcoal-800 border border-telemetry-indigo/30 flex items-center justify-center text-telemetry-indigo mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-charcoal-100 mb-2">Chronological Digital Day</h3>
            <p className="text-xs text-charcoal-400 leading-relaxed">
              Inspect your digital sessions in real context. Filter by long sessions, notification-associated events, and late-night patterns.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-charcoal-800/80 py-8 px-6 text-center text-xs text-charcoal-400 font-mono">
        <p>Habit Loop Mirror — An awareness and digital self-regulation tool. Not a medical treatment or diagnosis.</p>
      </footer>
    </div>
  );
};
