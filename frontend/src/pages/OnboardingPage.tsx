import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { OnboardingData } from '../types';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Sparkles,
  Layers,
  Activity,
  Shield,
  Clock,
  Target,
  User,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const ACTIVITY_CATEGORIES = [
  { id: 'coding', label: 'Coding & Building' },
  { id: 'drawing', label: 'Drawing & Sketching' },
  { id: 'music', label: 'Music & Playlists' },
  { id: 'reading', label: 'Reading & Articles' },
  { id: 'walking', label: 'Walking & Stepping Outside' },
  { id: 'exercise', label: 'Exercise & Stretching' },
  { id: 'cooking', label: 'Cooking & Brewing Tea/Coffee' },
  { id: 'socializing', label: 'Socializing & Voice Notes' },
  { id: 'learning', label: 'Learning New Concepts' },
  { id: 'creative', label: 'Creative Writing / Journaling' },
  { id: 'relaxation', label: 'Relaxation & Breathwork' },
  { id: 'outdoor', label: 'Outdoor Observation' },
  { id: 'gaming', label: 'Casual Mind Games' },
  { id: 'personal projects', label: 'Personal Craft Projects' },
];

const GOAL_LENSES = [
  { id: 'Focus / Study', title: 'Focus / Study', desc: 'Reduce fragmented app-switching during daytime deep work hours.' },
  { id: 'Sleep', title: 'Sleep & Night Transition', desc: 'Prevent late-night notification rabbit holes before bedtime.' },
  { id: 'Be Present', title: 'Be Present', desc: 'Engage with tangible surroundings and relationships over digital feeds.' },
  { id: 'Reduce Digital Distraction', title: 'Reduce Digital Distraction', desc: 'Interrupt automatic notification triggers with deliberate choices.' },
  { id: 'Build Better Routines', title: 'Build Better Routines', desc: 'Sublimate idle screen scrolling into offline crafts and rituals.' },
];

export const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<OnboardingData>({
    display_name: profile?.display_name || '',
    favorite_activities: ['coding', 'music', 'drawing'],
    typical_free_time: '10 minutes',
    preferred_activity_type: 'creative',
    main_personal_goal: 'Reduce Digital Distraction',
    preferred_reward_style: 'creative',
    avoid_activities: [],
    difficulty_preference: 'easy',
    social_solo_preference: 'solo',
    creative_productive_relaxation: 'creative',
    high_risk_periods: ['evening'],
  });

  const toggleFavorite = (catId: string) => {
    setFormData((prev) => {
      const exists = prev.favorite_activities.includes(catId);
      const updated = exists
        ? prev.favorite_activities.filter((c) => c !== catId)
        : [...prev.favorite_activities, catId];
      return { ...prev, favorite_activities: updated };
    });
  };

  const toggleAvoid = (catId: string) => {
    setFormData((prev) => {
      const exists = prev.avoid_activities.includes(catId);
      const updated = exists
        ? prev.avoid_activities.filter((c) => c !== catId)
        : [...prev.avoid_activities, catId];
      return { ...prev, avoid_activities: updated };
    });
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleComplete = async () => {
    try {
      setSaving(true);
      setError(null);
      await profileService.completeOnboarding(formData);
      await refreshProfile();
      navigate('/overview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (
        !msg ||
        msg.toLowerCase().includes('json') ||
        msg.toLowerCase().includes('syntax') ||
        msg.toLowerCase().includes('failed to fetch') ||
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('unexpected')
      ) {
        setError('Unable to connect to the calibration service. Please try again.');
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-charcoal-100 font-sans flex flex-col justify-between p-4 sm:p-8 md:p-12">
      {/* Telemetry Header */}
      <header className="max-w-3xl mx-auto w-full pt-2 pb-6 flex items-center justify-between border-b border-charcoal-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-telemetry-teal/15 border border-telemetry-teal/30 flex items-center justify-center text-telemetry-teal">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold tracking-tight text-charcoal-100">Habit Loop Mirror</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-telemetry-teal/15 text-telemetry-teal border border-telemetry-teal/30 uppercase">
                Calibration
              </span>
            </div>
            <span className="text-xs text-charcoal-400 block mt-0.5">
              Personalization Engine & Behavioral Baseline
            </span>
          </div>
        </div>

        {/* Step Progress Pill */}
        <div className="text-right">
          <div className="flex items-center space-x-2 justify-end text-xs font-mono text-charcoal-300">
            <span>STEP {step} OF {totalSteps}</span>
          </div>
          <div className="w-28 bg-charcoal-800 h-1.5 rounded-full mt-1.5 overflow-hidden border border-charcoal-700/50">
            <div
              className="bg-telemetry-teal h-full transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.6)]"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Glassmorphic Telemetry Card */}
      <main className="max-w-3xl mx-auto w-full py-8 my-auto">
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 sm:p-10 shadow-2xl space-y-6">
          {/* Section Header */}
          <div className="border-b border-charcoal-800/80 pb-4">
            <div className="flex items-center space-x-2 text-xs font-mono uppercase text-telemetry-teal font-semibold tracking-wider mb-1">
              <Compass className="w-4 h-4" />
              <span>Step {step}: Calibration Module</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-charcoal-100 tracking-tight">
              {step === 1 && "What activities reward and re-energize you?"}
              {step === 2 && "Rhythm & Digital Availability"}
              {step === 3 && "Primary Self-Regulation Goal Lens"}
              {step === 4 && "Boundary Setting: Activities to Avoid"}
              {step === 5 && "Energy Orientation & Social Disposition"}
              {step === 6 && "Confirm Your Mirror Configuration"}
            </h1>
            <p className="text-xs text-charcoal-400 mt-1">
              {step === 1 && "When you notice an impulse loop, what offline activities feel rewarding and effortless?"}
              {step === 2 && "Calibrate your typical free window and the recurring times you drift into digital feeds."}
              {step === 3 && "Habit Loop Mirror frames all telemetry, insights, and alternatives around this primary intention."}
              {step === 4 && "Specify any activities you dislike so our deterministic recommendation engine never suggests them."}
              {step === 5 && "Ensure alternative rituals match your energy levels and social preferences."}
              {step === 6 && "Review your calibration profile before entering the live telemetry mirror."}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-telemetry-rose/10 border border-telemetry-rose/30 text-xs text-telemetry-rose flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Favorite Activities */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-charcoal-400">
                <span className="font-mono text-[11px] uppercase text-charcoal-300">Select all that apply</span>
                <span className="font-mono text-[11px] text-telemetry-teal">
                  {formData.favorite_activities.length} selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ACTIVITY_CATEGORIES.map((cat) => {
                  const selected = formData.favorite_activities.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleFavorite(cat.id)}
                      className={`p-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                        selected
                          ? 'bg-telemetry-teal/15 border-telemetry-teal text-telemetry-teal font-medium shadow-sm'
                          : 'bg-charcoal-950 border-charcoal-800 text-charcoal-300 hover:border-charcoal-700 hover:text-charcoal-100'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {selected && <Check className="w-4 h-4 text-telemetry-teal flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Rhythm & High-Risk Periods */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono uppercase text-charcoal-300 font-semibold block mb-2">
                  Typical Free Time During Impulsive Pickups
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {['2 minutes', '5 minutes', '10 minutes', '20 minutes'].map((time) => {
                    const selected = formData.typical_free_time === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setFormData({ ...formData, typical_free_time: time })}
                        className={`p-3 rounded-lg border text-center text-xs font-medium transition-all ${
                          selected
                            ? 'bg-telemetry-teal/15 border-telemetry-teal text-telemetry-teal font-semibold shadow-sm'
                            : 'bg-charcoal-950 border-charcoal-800 text-charcoal-300 hover:border-charcoal-700'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="text-xs font-mono uppercase text-charcoal-300 font-semibold block mb-2">
                  High-Risk Digital Usage Periods
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'morning', label: 'Early Morning in Bed' },
                    { id: 'work_break', label: 'Mid-day Work Transitions' },
                    { id: 'evening', label: 'Evening Decompression (8:00 - 10:30 PM)' },
                    { id: 'late_night', label: 'Late Night Bedtime (10:30 PM+)' },
                  ].map((period) => {
                    const sel = formData.high_risk_periods.includes(period.id);
                    return (
                      <button
                        key={period.id}
                        type="button"
                        onClick={() => {
                          const exists = formData.high_risk_periods.includes(period.id);
                          const updated = exists
                            ? formData.high_risk_periods.filter((p) => p !== period.id)
                            : [...formData.high_risk_periods, period.id];
                          setFormData({ ...formData, high_risk_periods: updated });
                        }}
                        className={`p-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                          sel
                            ? 'bg-telemetry-teal/15 border-telemetry-teal text-telemetry-teal font-medium shadow-sm'
                            : 'bg-charcoal-950 border-charcoal-800 text-charcoal-300 hover:border-charcoal-700'
                        }`}
                      >
                        <span>{period.label}</span>
                        {sel && <Check className="w-4 h-4 text-telemetry-teal" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Goal Lens */}
          {step === 3 && (
            <div className="space-y-3">
              {GOAL_LENSES.map((goal) => {
                const selected = formData.main_personal_goal === goal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, main_personal_goal: goal.id })}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      selected
                        ? 'bg-telemetry-teal/10 border-telemetry-teal text-charcoal-100 shadow-sm ring-1 ring-telemetry-teal'
                        : 'bg-charcoal-950 border-charcoal-800 text-charcoal-300 hover:border-charcoal-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-charcoal-100">{goal.title}</span>
                      {selected && <Check className="w-4 h-4 text-telemetry-teal" />}
                    </div>
                    <p className="text-xs text-charcoal-400 mt-1 leading-relaxed">{goal.desc}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 4: Boundaries (Avoided Activities) */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-charcoal-400">
                <span className="font-mono text-[11px] uppercase text-charcoal-300">
                  Select activities you do NOT enjoy
                </span>
                <span className="font-mono text-[11px] text-telemetry-rose">
                  {formData.avoid_activities.length} excluded
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ACTIVITY_CATEGORIES.map((cat) => {
                  const avoided = formData.avoid_activities.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleAvoid(cat.id)}
                      className={`p-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                        avoided
                          ? 'bg-telemetry-rose/15 border-telemetry-rose text-telemetry-rose font-medium'
                          : 'bg-charcoal-950 border-charcoal-800 text-charcoal-300 hover:border-charcoal-700 hover:text-charcoal-100'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {avoided ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-telemetry-rose/20 text-telemetry-rose border border-telemetry-rose/30 uppercase">
                          Excluded
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-charcoal-500">Allow</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Social & Energy Fit */}
          {step === 5 && (
            <div className="space-y-6">
              {/* Social Preference */}
              <div>
                <span className="text-xs font-mono uppercase text-charcoal-300 font-semibold block mb-2">
                  Social vs. Solo Rituals
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'solo', label: 'Solo Rituals' },
                    { id: 'social', label: 'Reaching Out' },
                    { id: 'flexible', label: 'Flexible' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, social_solo_preference: s.id })}
                      className={`p-3 rounded-lg border text-xs text-center font-medium transition-all ${
                        formData.social_solo_preference === s.id
                          ? 'bg-telemetry-teal/15 border-telemetry-teal text-telemetry-teal font-semibold'
                          : 'bg-charcoal-950 border-charcoal-800 text-charcoal-300 hover:border-charcoal-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Preference */}
              <div>
                <span className="text-xs font-mono uppercase text-charcoal-300 font-semibold block mb-2">
                  Primary Alternative Disposition
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'creative', label: 'Creative (Build, Sketch)' },
                    { id: 'relaxation', label: 'Relaxing (Tea, Walk)' },
                    { id: 'intellectual', label: 'Intellectual (Read, Learn)' },
                  ].map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, creative_productive_relaxation: e.id })}
                      className={`p-3 rounded-lg border text-xs text-center font-medium transition-all ${
                        formData.creative_productive_relaxation === e.id
                          ? 'bg-telemetry-teal/15 border-telemetry-teal text-telemetry-teal font-semibold'
                          : 'bg-charcoal-950 border-charcoal-800 text-charcoal-300 hover:border-charcoal-700'
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Review & Final Launch */}
          {step === 6 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-mono uppercase text-charcoal-300 mb-1.5 font-semibold">
                  Display Name or Moniker <span className="text-telemetry-teal">*</span>
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g. Alex"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-charcoal-950 border border-charcoal-750 text-charcoal-100 text-xs focus:outline-none focus:border-telemetry-teal transition-colors"
                  required
                />
                <span className="text-[10px] text-charcoal-500 font-mono mt-1 block">
                  Displayed on telemetry badges and header menu
                </span>
              </div>

              {/* Calibration Summary Box */}
              <div className="p-4 rounded-lg bg-charcoal-950 border border-charcoal-800 space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-charcoal-850">
                  <span className="text-charcoal-400 font-mono text-[11px] uppercase">Goal Lens:</span>
                  <span className="font-semibold text-telemetry-teal">{formData.main_personal_goal}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-charcoal-850">
                  <span className="text-charcoal-400 font-mono text-[11px] uppercase">Typical Free Time:</span>
                  <span className="font-medium text-charcoal-200">{formData.typical_free_time}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-charcoal-850">
                  <span className="text-charcoal-400 font-mono text-[11px] uppercase">Passions:</span>
                  <span className="font-medium text-charcoal-200">
                    {formData.favorite_activities.slice(0, 3).join(', ')}
                    {formData.favorite_activities.length > 3 && ` +${formData.favorite_activities.length - 3} more`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-400 font-mono text-[11px] uppercase">Excluded Activities:</span>
                  <span className="font-medium text-telemetry-rose">
                    {formData.avoid_activities.length > 0 ? formData.avoid_activities.join(', ') : 'None'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-charcoal-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center space-x-1.5 px-4 py-2 rounded text-xs font-medium text-charcoal-400 hover:text-charcoal-200 bg-charcoal-800 hover:bg-charcoal-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-3">
              {step < totalSteps ? (
                <>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="text-xs text-charcoal-400 hover:text-charcoal-200 font-mono"
                  >
                    Skip optional
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center space-x-1.5 px-5 py-2.5 rounded text-xs font-semibold bg-telemetry-teal text-charcoal-950 hover:bg-telemetry-teal-bright transition-colors shadow-sm"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex items-center space-x-1.5 px-6 py-2.5 rounded text-xs font-semibold bg-telemetry-teal text-charcoal-950 hover:bg-telemetry-teal-bright disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saving ? 'Calibrating Mirror...' : 'Launch Habit Loop Mirror →'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-charcoal-500 py-3 font-mono">
        TELEMETRY ONLINE • Screen Time tells you how much. We tell you why.
      </footer>
    </div>
  );
};
