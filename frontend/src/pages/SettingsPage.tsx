import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { progressService } from '../services/progressService';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  Settings as SettingsIcon,
  Download,
  Trash2,
  User,
  Shield,
  Clock,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Save,
  Check,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { user, profile, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Profile Edit State
  const [displayName, setDisplayName] = useState(profile?.display_name || 'Digital Explorer');
  const [email, setEmail] = useState(user?.email || 'demo@habitloopmirror.dev');
  const [goalLens, setGoalLens] = useState(profile?.goal_lens || 'Reduce Digital Distraction');
  const [typicalFreeTime, setTypicalFreeTime] = useState(profile?.typical_free_time || '10 minutes');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Sync state if profile/user loaded later
  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
    if (user?.email) setEmail(user.email);
    if (profile?.goal_lens) setGoalLens(profile.goal_lens);
    if (profile?.typical_free_time) setTypicalFreeTime(profile.typical_free_time);
  }, [profile, user]);

  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setProfileErrorMsg('Display Name cannot be empty.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setProfileErrorMsg('Please enter a valid email address.');
      return;
    }

    try {
      setSavingProfile(true);
      setProfileErrorMsg(null);
      setProfileSuccessMsg(null);
      await updateProfile({
        display_name: displayName.trim(),
        email: email.trim(),
        goal_lens: goalLens,
        typical_free_time: typicalFreeTime
      });
      setProfileSuccessMsg('Profile updated! Changes are now reflected in the header and throughout the mirror.');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setProfileErrorMsg(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setStatusMsg('Preparing CSV telemetry export for spreadsheet analysis...');
      const blob = await progressService.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habit_mirror_sessions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatusMsg('CSV telemetry spreadsheet exported successfully.');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMsg('CSV export failed.');
    }
  };

  const handleExportPdf = async () => {
    try {
      setStatusMsg('Generating comprehensive PDF telemetry report...');
      const blob = await progressService.exportPdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habit_mirror_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatusMsg('PDF report generated and downloaded successfully.');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMsg('PDF export failed.');
    }
  };

  const handleExportData = async () => {
    try {
      setStatusMsg('Preparing full JSON archive export...');
      const blob = await progressService.exportReport();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habit_loop_mirror_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatusMsg('JSON telemetry archive exported successfully.');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMsg('Export failed.');
    }
  };

  const handleClearUsage = async () => {
    try {
      await progressService.clearUsageData();
      setStatusMsg('All imported usage sessions, reflections, goals, and habit loops cleared.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await progressService.deleteAccount();
      await logout();
      navigate('/signup');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-charcoal-800">
        <h1 className="text-xl font-bold tracking-tight text-charcoal-100 flex items-center space-x-2">
          <span>Settings & Privacy Controls</span>
        </h1>
        <p className="text-xs text-charcoal-400 mt-1">
          Manage your mirror preferences, edit your profile, export your telemetry data in PDF/CSV/JSON, or erase stored records.
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 bg-telemetry-teal/10 border border-telemetry-teal/30 rounded-lg text-xs text-telemetry-teal flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* User Profile Form */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-charcoal-400 font-semibold tracking-wider">
            <User className="w-4 h-4 text-telemetry-teal" />
            <span>Personalization Profile</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-400 border border-charcoal-700">
            Syncs to Header
          </span>
        </div>

        {profileSuccessMsg && (
          <div className="p-3 bg-telemetry-teal/10 border border-telemetry-teal/30 rounded text-xs text-telemetry-teal flex items-center space-x-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        {profileErrorMsg && (
          <div className="p-3 bg-telemetry-rose/10 border border-telemetry-rose/30 rounded text-xs text-telemetry-rose flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{profileErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Name Input */}
            <div>
              <label className="text-charcoal-400 block font-mono text-[10px] uppercase mb-1">
                Display Name <span className="text-telemetry-teal">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-telemetry-teal rounded px-3 py-2 text-xs text-charcoal-100 outline-none transition-colors"
                required
              />
              <span className="text-[10px] text-charcoal-500 font-mono mt-0.5 block">
                Visible in the top right user menu and mirror reports
              </span>
            </div>

            {/* Account Email Input */}
            <div>
              <label className="text-charcoal-400 block font-mono text-[10px] uppercase mb-1">
                Account Email <span className="text-telemetry-teal">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex@example.com"
                className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-telemetry-teal rounded px-3 py-2 text-xs text-charcoal-100 outline-none transition-colors"
                required
              />
              <span className="text-[10px] text-charcoal-500 font-mono mt-0.5 block">
                Primary identifier for local session storage and audit exports
              </span>
            </div>

            {/* Goal Lens */}
            <div>
              <label className="text-charcoal-400 block font-mono text-[10px] uppercase mb-1">
                Goal Lens
              </label>
              <select
                value={goalLens}
                onChange={(e) => setGoalLens(e.target.value)}
                className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-telemetry-teal rounded px-3 py-2 text-xs text-telemetry-teal outline-none transition-colors"
              >
                <option value="Reduce Digital Distraction">Reduce Digital Distraction</option>
                <option value="Focus / Study">Focus / Study</option>
                <option value="Sleep">Sleep Preservation</option>
                <option value="Be Present">Be Present</option>
                <option value="Build Better Routines">Build Better Routines</option>
              </select>
            </div>

            {/* Typical Free Time */}
            <div>
              <label className="text-charcoal-400 block font-mono text-[10px] uppercase mb-1">
                Typical Free Time Window
              </label>
              <select
                value={typicalFreeTime}
                onChange={(e) => setTypicalFreeTime(e.target.value)}
                className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-telemetry-teal rounded px-3 py-2 text-xs text-charcoal-200 outline-none transition-colors"
              >
                <option value="2 minutes">2 minutes (Micro-break)</option>
                <option value="5 minutes">5 minutes (Quick breath)</option>
                <option value="10 minutes">10 minutes (Standard transition)</option>
                <option value="20 minutes">20 minutes (Deep decompression)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-charcoal-800 gap-3">
            <button
              type="button"
              onClick={() => navigate('/onboarding')}
              className="text-xs text-telemetry-teal hover:underline font-mono text-left"
            >
              Re-run Complete Onboarding Calibration →
            </button>

            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded text-xs font-semibold bg-telemetry-teal text-charcoal-950 hover:bg-telemetry-teal-bright disabled:opacity-50 transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Privacy Guarantees */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono uppercase text-charcoal-400 font-semibold tracking-wider">
          <Shield className="w-4 h-4 text-telemetry-teal" />
          <span>Data Privacy Architecture</span>
        </div>

        <p className="text-xs text-charcoal-300 leading-relaxed">
          Habit Loop Mirror only processes usage metadata (application names, session start/end timestamps, and notification alert arrival times) required to isolate habit loops. We never inspect, store, or ask for the contents of your private messages or applications.
        </p>
      </div>

      {/* Data Export & Erase Controls */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5 space-y-4">
        <div className="text-xs font-mono uppercase text-charcoal-400 font-semibold tracking-wider">
          Data Management
        </div>

        <div className="divide-y divide-charcoal-800">
          {/* Multi-Format Export */}
          <div className="py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold text-charcoal-200">Export Telemetry Data</h4>
              <p className="text-[11px] text-charcoal-400">
                Download your complete usage records as an executive PDF report, spreadsheet CSV (for Excel / Google Sheets), or raw JSON technical archive.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* PDF Button */}
              <button
                onClick={handleExportPdf}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-telemetry-teal text-charcoal-950 hover:bg-telemetry-teal-bright transition-colors shadow-sm"
                title="Download formatted executive PDF report"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              {/* CSV Button */}
              <button
                onClick={handleExportCsv}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-telemetry-teal/15 hover:bg-telemetry-teal/25 text-telemetry-teal border border-telemetry-teal/30 transition-colors"
                title="Download CSV for Excel or Google Sheets"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV (Excel)</span>
              </button>

              {/* JSON Button */}
              <button
                onClick={handleExportData}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 border border-charcoal-700 transition-colors"
                title="Download full JSON archive"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON Archive</span>
              </button>
            </div>
          </div>

          {/* Clear Usage */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-charcoal-200">Clear Stored Usage & Telemetry Records</h4>
              <p className="text-[11px] text-charcoal-400">
                Permanently wipes all imported usage sessions, intentionality reflections, detected habit loops, and active goals. Your profile settings remain intact.
              </p>
            </div>
            <button
              onClick={() => setClearConfirmOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium text-telemetry-amber hover:bg-telemetry-amber/10 border border-telemetry-amber/30 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Clear Usage</span>
            </button>
          </div>

          {/* Delete Account */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-charcoal-200 text-telemetry-rose">Delete Account</h4>
              <p className="text-[11px] text-charcoal-400">
                Permanently erases your user profile, all telemetry data, and associated records from the local system.
              </p>
            </div>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium text-telemetry-rose hover:bg-telemetry-rose/10 border border-telemetry-rose/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clear Usage Confirmation Dialog */}
      <ConfirmDialog
        isOpen={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={handleClearUsage}
        title="Clear All Usage, Reflections & Goals?"
        message="This will completely remove all recorded sessions, notifications, intentionality reflections, active goals, and detected habit loops from your mirror. Your display name and profile settings will be preserved. This action cannot be undone."
        confirmLabel="Clear All Telemetry"
        isDestructive={true}
      />

      {/* Delete Account Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Habit Mirror Account?"
        message="This will permanently delete your account and all associated insights, reflections, and goals from the database. Are you sure?"
        confirmLabel="Permanently Delete"
        isDestructive={true}
      />
    </div>
  );
};
