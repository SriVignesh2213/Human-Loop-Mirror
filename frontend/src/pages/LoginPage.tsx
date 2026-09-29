import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, profile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      if (profile && !profile.onboarding_completed) {
        navigate('/onboarding');
      } else {
        navigate('/overview');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    try {
      setLoading(true);
      setError(null);
      await login('demo@habitloopmirror.dev', 'demo12345');
      navigate('/overview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-charcoal-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-telemetry-teal/20 selection:text-telemetry-teal">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-4">
          <div className="w-9 h-9 rounded bg-charcoal-800 border border-telemetry-teal/40 flex items-center justify-center text-telemetry-teal">
            <Layers className="w-5 h-5 text-telemetry-teal" />
          </div>
          <span className="font-semibold text-base tracking-tight text-charcoal-100">
            Habit Loop Mirror
          </span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-charcoal-100">
          Sign In to Your Habit Mirror
        </h2>
        <p className="mt-1 text-xs text-charcoal-400">
          Understand the patterns behind your digital habits.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-charcoal-900 border border-charcoal-800 py-8 px-6 shadow-elevated rounded-xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded bg-telemetry-rose/10 border border-telemetry-rose/30 text-xs text-telemetry-rose flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase text-charcoal-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 rounded bg-charcoal-950 border border-charcoal-700 text-charcoal-100 text-xs focus:outline-none focus:border-telemetry-teal transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-charcoal-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded bg-charcoal-950 border border-charcoal-700 text-charcoal-100 text-xs focus:outline-none focus:border-telemetry-teal transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded text-xs font-semibold bg-telemetry-teal text-charcoal-950 hover:bg-telemetry-teal-bright disabled:opacity-50 transition-colors shadow-sm"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-charcoal-800 space-y-3">
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded text-xs font-medium bg-charcoal-800 hover:bg-charcoal-700 text-telemetry-teal border border-charcoal-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Instant Demo Mode</span>
            </button>

            <div className="text-center text-xs text-charcoal-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-telemetry-teal hover:underline font-medium">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
