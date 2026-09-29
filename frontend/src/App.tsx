import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { OverviewPage } from './pages/OverviewPage';
import { DigitalDayPage } from './pages/DigitalDayPage';
import { HabitLoopsPage } from './pages/HabitLoopsPage';
import { AiInsightsPage } from './pages/AiInsightsPage';
import { ReflectionPage } from './pages/ReflectionPage';
import { PersonalSwapPage } from './pages/PersonalSwapPage';
import { GoalsPage } from './pages/GoalsPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// SEO Title Updater
const TitleManager: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Habit Loop Mirror — Understand the patterns behind your digital habits',
      '/login': 'Habit Loop Mirror — Sign In',
      '/signup': 'Habit Loop Mirror — Create Account',
      '/onboarding': 'Habit Loop Mirror — Personalization Journal',
      '/overview': 'Habit Loop Mirror — Overview',
      '/digital-day': 'Habit Loop Mirror — Digital Day',
      '/habit-loops': 'Habit Loop Mirror — Habit Loops',
      '/ai-insights': 'Habit Loop Mirror — AI Insights',
      '/reflection': 'Habit Loop Mirror — Reflection',
      '/personal-swap': 'Habit Loop Mirror — Personal Swap',
      '/goals': 'Habit Loop Mirror — Goals',
      '/progress': 'Habit Loop Mirror — Progress',
      '/settings': 'Habit Loop Mirror — Settings',
    };

    document.title = titles[location.pathname] || 'Habit Loop Mirror';
  }, [location]);

  return null;
};

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-charcoal-950 flex items-center justify-center text-xs font-mono text-charcoal-400">
        <span className="w-2 h-2 rounded-full bg-telemetry-teal animate-ping mr-2" />
        <span>Restoring Telemetry Session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if onboarding is incomplete
  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TitleManager />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Protected Routes inside AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/digital-day" element={<DigitalDayPage />} />
            <Route path="/habit-loops" element={<HabitLoopsPage />} />
            <Route path="/ai-insights" element={<AiInsightsPage />} />
            <Route path="/reflection" element={<ReflectionPage />} />
            <Route path="/personal-swap" element={<PersonalSwapPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback 404 Route */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
