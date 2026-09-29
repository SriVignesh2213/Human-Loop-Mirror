import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileMenu } from './MobileMenu';
import { Modal } from '../ui/Modal';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  PlusCircle,
  Download,
  Info,
  Calendar,
  Clock,
  Smartphone,
  Tag,
  Bell
} from 'lucide-react';
import { usageService } from '../../services/usageService';
import { analysisService } from '../../services/analysisService';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'csv' | 'manual'>('csv');

  // CSV Upload States
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Manual Entry States
  const [manualApp, setManualApp] = useState('Instagram');
  const [manualCategory, setManualCategory] = useState('Social');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualStartTime, setManualStartTime] = useState('20:45');
  const [manualDuration, setManualDuration] = useState(35);
  const [manualNotifTriggered, setManualNotifTriggered] = useState(true);
  const [manualNotifTitle, setManualNotifTitle] = useState('Sarah sent a direct message');
  const [manualIntentionality, setManualIntentionality] = useState<'Planned' | 'Necessary' | 'Relaxation' | 'Unplanned'>('Unplanned');

  const handleImportAndAnalyze = async () => {
    if (!file) return;
    try {
      setImporting(true);
      setImportError(null);
      setImportStatus('Validating and importing CSV telemetry...');

      const importResult = await usageService.importCsv(file);
      setImportStatus(`Imported ${importResult.imported_sessions} sessions. Starting pattern analysis...`);

      const analysisResult = await analysisService.runAnalysis();
      setImportStatus(`Analysis complete! Identified ${analysisResult.habit_loops_detected} habit loops.`);

      setTimeout(() => {
        setImportModalOpen(false);
        setFile(null);
        setImportStatus(null);
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setImporting(true);
      setImportError(null);
      setImportStatus('Recording manual session...');

      const startDateTime = new Date(`${manualDate}T${manualStartTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + manualDuration * 60 * 1000);

      await usageService.addManualSession({
        app_name: manualApp.trim(),
        category: manualCategory,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        notification_associated: manualNotifTriggered,
        notification_title: manualNotifTriggered ? manualNotifTitle.trim() : undefined,
        reflection_label: manualIntentionality
      });

      setImportStatus('Running pattern analysis on updated mirror...');
      await analysisService.runAnalysis();

      setImportStatus('Session logged successfully!');
      setTimeout(() => {
        setImportModalOpen(false);
        setImportStatus(null);
        window.location.reload();
      }, 900);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Could not save manual session.');
    } finally {
      setImporting(false);
    }
  };

  const generateDynamicSampleCsv = () => {
    const now = new Date();
    const getIso = (dayOffset: number, hours: number, minutes: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - dayOffset);
      d.setHours(hours, minutes, 0, 0);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    };

    const header = 'timestamp,end_time,duration_minutes,app_name,category,notification_associated,notification_timestamp,notification_app,notification_title,user_reflection\n';
    const rows = [
      // Today (Live current timestamps)
      `${getIso(0, 8, 15)},${getIso(0, 8, 45)},30,Slack,Productivity,true,${getIso(0, 8, 13)},Slack,Team standup reminder,Necessary`,
      `${getIso(0, 9, 30)},${getIso(0, 12, 0)},150,VS Code,Development,false,,,,Planned`,
      `${getIso(0, 12, 15)},${getIso(0, 12, 40)},25,YouTube,Entertainment,false,,,,Relaxation`,
      `${getIso(0, 14, 0)},${getIso(0, 16, 30)},150,VS Code,Development,false,,,,Planned`,
      `${getIso(0, 18, 5)},${getIso(0, 18, 40)},35,Spotify,Entertainment,false,,,,Relaxation`,
      `${getIso(0, 20, 45)},${getIso(0, 21, 27)},42,Instagram,Social,true,${getIso(0, 20, 43)},Instagram,Sarah sent a reel: Modern Architecture,Unplanned`,
      `${getIso(0, 22, 15)},${getIso(0, 22, 45)},30,Notion,Productivity,false,,,,Planned`,

      // Yesterday
      `${getIso(1, 8, 30)},${getIso(1, 8, 55)},25,Slack,Productivity,true,${getIso(1, 8, 28)},Slack,Deployment alert: Staging ready,Necessary`,
      `${getIso(1, 9, 30)},${getIso(1, 12, 15)},165,VS Code,Development,false,,,,Planned`,
      `${getIso(1, 13, 0)},${getIso(1, 13, 30)},30,YouTube,Entertainment,false,,,,Relaxation`,
      `${getIso(1, 14, 30)},${getIso(1, 17, 0)},150,VS Code,Development,false,,,,Planned`,
      `${getIso(1, 19, 0)},${getIso(1, 19, 35)},35,Twitter,Social,true,${getIso(1, 18, 58)},Twitter,Breaking tech update,Unplanned`,
      `${getIso(1, 20, 50)},${getIso(1, 21, 28)},38,Instagram,Social,true,${getIso(1, 20, 48)},Instagram,Trending post from @designers,Unplanned`,
      `${getIso(1, 22, 30)},${getIso(1, 23, 0)},30,Kindle,Reading,false,,,,Planned`,

      // 2 days ago
      `${getIso(2, 8, 20)},${getIso(2, 8, 50)},30,Slack,Productivity,true,${getIso(2, 8, 18)},Slack,Morning announcements,Necessary`,
      `${getIso(2, 9, 15)},${getIso(2, 12, 15)},180,VS Code,Development,false,,,,Planned`,
      `${getIso(2, 20, 52)},${getIso(2, 21, 32)},40,Instagram,Social,true,${getIso(2, 20, 50)},Instagram,Alex tagged you in a photo,Unplanned`,

      // 3 days ago
      `${getIso(3, 8, 45)},${getIso(3, 9, 10)},25,Slack,Productivity,true,${getIso(3, 8, 43)},Slack,CI/CD Pipeline failed on main,Necessary`,
      `${getIso(3, 9, 30)},${getIso(3, 12, 0)},150,VS Code,Development,false,,,,Planned`,
      `${getIso(3, 20, 48)},${getIso(3, 21, 24)},36,Instagram,Social,true,${getIso(3, 20, 46)},Instagram,Direct message received,Unplanned`,

      // 4 days ago
      `${getIso(4, 10, 0)},${getIso(4, 11, 0)},60,Kindle,Reading,false,,,,Planned`,
      `${getIso(4, 21, 10)},${getIso(4, 21, 52)},42,Instagram,Social,true,${getIso(4, 21, 8)},Instagram,Jordan posted a story update,Unplanned`,

      // 5 days ago
      `${getIso(5, 9, 30)},${getIso(5, 10, 30)},60,Notion,Productivity,false,,,,Planned`,
      `${getIso(5, 20, 40)},${getIso(5, 21, 15)},35,Instagram,Social,true,${getIso(5, 20, 38)},Instagram,3 new direct messages,Unplanned`,

      // 6 days ago
      `${getIso(6, 8, 30)},${getIso(6, 9, 0)},30,Slack,Productivity,true,${getIso(6, 8, 28)},Slack,Weekly kickoff agenda,Necessary`,
      `${getIso(6, 20, 55)},${getIso(6, 21, 30)},35,Instagram,Social,true,${getIso(6, 20, 53)},Instagram,New reel recommendation,Unplanned`
    ];
    return header + rows.join('\n');
  };

  const handleLoadSampleData = async () => {
    try {
      setImporting(true);
      setImportError(null);
      setImportStatus('Generating and importing live dynamic dataset relative to today...');

      const sampleCsv = generateDynamicSampleCsv();
      const demoFile = new File([sampleCsv], 'sample_usage_live.csv', { type: 'text/csv' });
      const importResult = await usageService.importCsv(demoFile);
      setImportStatus(`Imported ${importResult.imported_sessions} live sessions. Executing pattern analysis...`);

      const analysisResult = await analysisService.runAnalysis();
      setImportStatus(`Success! Found ${analysisResult.habit_loops_detected} habit loops with live dates.`);

      setTimeout(() => {
        setImportModalOpen(false);
        setImportStatus(null);
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Demo import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = 'timestamp,end_time,duration_minutes,app_name,category,notification_associated,notification_timestamp,notification_app,notification_title,user_reflection\n2026-09-30T08:15:00,2026-09-30T08:45:00,30,Slack,Productivity,true,2026-09-30T08:13:30,Slack,Team standup reminder,Necessary\n2026-09-30T20:45:00,2026-09-30T21:25:00,40,Instagram,Social,true,2026-09-30T20:43:00,Instagram,Direct message ping,Unplanned\n';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'habit_mirror_template.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-charcoal-950 text-charcoal-100 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          onOpenImportModal={() => setImportModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Usage Data Input Modal (CSV Import + Manual Entry) */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => !importing && setImportModalOpen(false)}
        title="Usage Data Input: Import or Manual Entry"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Modal Navigation Tabs */}
          <div className="flex border-b border-charcoal-800">
            <button
              type="button"
              onClick={() => setModalTab('csv')}
              className={`flex items-center space-x-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
                modalTab === 'csv'
                  ? 'border-telemetry-teal text-telemetry-teal bg-telemetry-teal/5'
                  : 'border-transparent text-charcoal-400 hover:text-charcoal-200'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import Usage CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setModalTab('manual')}
              className={`flex items-center space-x-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
                modalTab === 'manual'
                  ? 'border-telemetry-teal text-telemetry-teal bg-telemetry-teal/5'
                  : 'border-transparent text-charcoal-400 hover:text-charcoal-200'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Manual Screen-Time Entry</span>
            </button>
          </div>

          {/* TAB 1: CSV FILE IMPORT */}
          {modalTab === 'csv' ? (
            <div className="space-y-4">
              <p className="text-xs text-charcoal-300 leading-relaxed">
                Upload your digital usage export. Habit Loop Mirror calculates verified correlations between notifications and session starts.
              </p>

              {/* Upload Dropzone */}
              <div className="p-5 border-2 border-dashed border-charcoal-700 hover:border-telemetry-teal/50 rounded-lg text-center bg-charcoal-950/60 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  id="csv-file-upload"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
                <label
                  htmlFor="csv-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <UploadCloud className="w-8 h-8 text-telemetry-teal" />
                  <div className="text-xs font-medium text-charcoal-200">
                    {file ? file.name : 'Click to select usage CSV or drop file here'}
                  </div>
                  <div className="text-[11px] text-charcoal-400 font-mono">
                    Accepts standard comma-separated .csv files
                  </div>
                </label>
              </div>

              {/* Specification & Criteria Reference Box */}
              <div className="p-3.5 bg-charcoal-950/90 border border-charcoal-800 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-mono text-[11px] text-telemetry-teal uppercase font-semibold">
                    <Info className="w-3.5 h-3.5" />
                    <span>CSV Columns & Validation Criteria</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="flex items-center space-x-1 text-[11px] text-charcoal-300 hover:text-telemetry-teal font-mono transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Template</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="space-y-1">
                    <span className="font-semibold text-charcoal-200 block">Required Columns:</span>
                    <ul className="text-charcoal-400 space-y-0.5 list-disc list-inside font-mono text-[10px]">
                      <li><strong className="text-charcoal-300">timestamp</strong>: ISO format (e.g. 2026-09-30T20:45:00)</li>
                      <li><strong className="text-charcoal-300">app_name</strong>: Name of app (e.g. Instagram)</li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-charcoal-200 block">Recommended Columns:</span>
                    <ul className="text-charcoal-400 space-y-0.5 list-disc list-inside font-mono text-[10px]">
                      <li><strong>duration_minutes</strong> or <strong>end_time</strong></li>
                      <li><strong>category</strong> (Social, Productivity, etc.)</li>
                      <li><strong>notification_associated</strong> (true / false)</li>
                      <li><strong>user_reflection</strong> (Planned, Unplanned...)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Sample Data */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleLoadSampleData}
                  disabled={importing}
                  className="flex items-center space-x-1.5 text-telemetry-teal hover:underline font-mono text-[11px]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Load Live Demo Dataset (Today's Date)</span>
                </button>
              </div>

              {importStatus && (
                <div className="p-3 bg-telemetry-teal/10 border border-telemetry-teal/30 rounded text-xs text-telemetry-teal flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-telemetry-teal animate-ping" />
                  <span>{importStatus}</span>
                </div>
              )}

              {importError && (
                <div className="p-3 bg-telemetry-rose/10 border border-telemetry-rose/30 rounded text-xs text-telemetry-rose flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  disabled={importing}
                  className="px-3 py-1.5 rounded text-xs font-medium text-charcoal-400 hover:text-charcoal-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportAndAnalyze}
                  disabled={!file || importing}
                  className="px-4 py-1.5 rounded text-xs font-semibold bg-telemetry-teal text-charcoal-950 hover:bg-telemetry-teal-bright disabled:opacity-50 transition-colors shadow-sm"
                >
                  {importing ? 'Processing...' : 'Import & Analyze'}
                </button>
              </div>
            </div>
          ) : (
            /* TAB 2: MANUAL USAGE DATA INPUT */
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <p className="text-xs text-charcoal-300">
                Manually record screen-time and application usage events directly into your mirror timeline.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* App Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-charcoal-300 flex items-center space-x-1">
                    <Smartphone className="w-3.5 h-3.5 text-telemetry-teal" />
                    <span>Application Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualApp}
                    onChange={(e) => setManualApp(e.target.value)}
                    placeholder="e.g. Instagram, Slack, VS Code"
                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded px-3 py-1.5 text-xs text-charcoal-100 focus:border-telemetry-teal outline-none"
                  />
                  {/* Quick Select Chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['Instagram', 'Slack', 'VS Code', 'YouTube', 'Chrome', 'Notion'].map((app) => (
                      <button
                        type="button"
                        key={app}
                        onClick={() => {
                          setManualApp(app);
                          if (app === 'Instagram') setManualCategory('Social');
                          if (app === 'Slack') setManualCategory('Productivity');
                          if (app === 'VS Code') setManualCategory('Development');
                          if (app === 'YouTube') setManualCategory('Entertainment');
                          if (app === 'Notion') setManualCategory('Productivity');
                        }}
                        className="text-[10px] font-mono px-1.5 py-0.5 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 rounded"
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-charcoal-300 flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-telemetry-teal" />
                    <span>Usage Category</span>
                  </label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded px-3 py-1.5 text-xs text-charcoal-100 focus:border-telemetry-teal outline-none"
                  >
                    <option value="Social">Social</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Development">Development</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Reading">Reading</option>
                    <option value="Communication">Communication</option>
                    <option value="General">General</option>
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-charcoal-300 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-telemetry-teal" />
                    <span>Session Date</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-charcoal-950 border border-charcoal-800 rounded px-3 py-1.5 text-xs text-charcoal-100 focus:border-telemetry-teal outline-none"
                  />
                </div>

                {/* Time & Duration */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-charcoal-300 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-telemetry-teal" />
                      <span>Start Time</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={manualStartTime}
                      onChange={(e) => setManualStartTime(e.target.value)}
                      className="w-full bg-charcoal-950 border border-charcoal-800 rounded px-2.5 py-1.5 text-xs text-charcoal-100 focus:border-telemetry-teal outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-charcoal-300">
                      Duration (Mins)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="720"
                      required
                      value={manualDuration}
                      onChange={(e) => setManualDuration(Number(e.target.value))}
                      className="w-full bg-charcoal-950 border border-charcoal-800 rounded px-2.5 py-1.5 text-xs text-charcoal-100 focus:border-telemetry-teal outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Association */}
              <div className="p-3 bg-charcoal-950 border border-charcoal-800 rounded-lg space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-charcoal-200">
                  <input
                    type="checkbox"
                    checked={manualNotifTriggered}
                    onChange={(e) => setManualNotifTriggered(e.target.checked)}
                    className="rounded border-charcoal-700 text-telemetry-teal focus:ring-0"
                  />
                  <span>Session followed a notification alert</span>
                </label>
                {manualNotifTriggered && (
                  <input
                    type="text"
                    value={manualNotifTitle}
                    onChange={(e) => setManualNotifTitle(e.target.value)}
                    placeholder="e.g. Direct message alert from Sarah"
                    className="w-full bg-charcoal-900 border border-charcoal-800 rounded px-3 py-1.5 text-xs text-charcoal-200 focus:border-telemetry-teal outline-none"
                  />
                )}
              </div>

              {/* Intentionality Label */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-charcoal-300 block">
                  Initial Intentionality Classification
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Planned', 'Necessary', 'Relaxation', 'Unplanned'] as const).map((label) => (
                    <button
                      type="button"
                      key={label}
                      onClick={() => setManualIntentionality(label)}
                      className={`p-2 rounded border text-xs font-medium transition-all ${
                        manualIntentionality === label
                          ? 'bg-telemetry-teal/15 border-telemetry-teal text-telemetry-teal'
                          : 'bg-charcoal-950 border-charcoal-800 text-charcoal-400 hover:text-charcoal-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {importStatus && (
                <div className="p-3 bg-telemetry-teal/10 border border-telemetry-teal/30 rounded text-xs text-telemetry-teal flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-telemetry-teal animate-ping" />
                  <span>{importStatus}</span>
                </div>
              )}

              {importError && (
                <div className="p-3 bg-telemetry-rose/10 border border-telemetry-rose/30 rounded text-xs text-telemetry-rose flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  disabled={importing}
                  className="px-3 py-1.5 rounded text-xs font-medium text-charcoal-400 hover:text-charcoal-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-4 py-1.5 rounded text-xs font-semibold bg-telemetry-teal text-charcoal-950 hover:bg-telemetry-teal-bright disabled:opacity-50 transition-colors shadow-sm"
                >
                  {importing ? 'Saving Session...' : 'Save & Analyze'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
