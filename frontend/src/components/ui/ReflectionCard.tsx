import React, { useState } from 'react';
import { Reflection } from '../../types';
import { reflectionService } from '../../services/reflectionService';
import { Check, MessageSquareQuote } from 'lucide-react';

interface ReflectionCardProps {
  sessionId?: string;
  appName?: string;
  durationMinutes?: number;
  initialLabel?: string | null;
  onSaved?: (label: 'Planned' | 'Necessary' | 'Relaxation' | 'Unplanned') => void;
}

export const ReflectionCard: React.FC<ReflectionCardProps> = ({
  sessionId,
  appName = 'Application Session',
  durationMinutes,
  initialLabel,
  onSaved,
}) => {
  const [selected, setSelected] = useState<string | null>(initialLabel || null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const options: Array<{ label: 'Planned' | 'Necessary' | 'Relaxation' | 'Unplanned'; desc: string; color: string }> = [
    { label: 'Planned', desc: 'Pre-scheduled or deliberate focus', color: 'border-telemetry-teal/40 hover:bg-telemetry-teal/10' },
    { label: 'Necessary', desc: 'Work or vital communication', color: 'border-telemetry-indigo/40 hover:bg-telemetry-indigo/10' },
    { label: 'Relaxation', desc: 'Conscious leisure choice', color: 'border-telemetry-emerald/40 hover:bg-telemetry-emerald/10' },
    { label: 'Unplanned', desc: 'Automatic impulse response', color: 'border-telemetry-amber/40 hover:bg-telemetry-amber/10' },
  ];

  const handleSelect = async (optLabel: 'Planned' | 'Necessary' | 'Relaxation' | 'Unplanned') => {
    setSelected(optLabel);
    try {
      setSaving(true);
      await reflectionService.createReflection({
        session_id: sessionId,
        intentionality_label: optLabel,
        notes: notes.trim() || undefined,
      });
      setSavedSuccess(true);
      if (onSaved) onSaved(optLabel);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5">
      <div className="flex items-center space-x-2 text-xs font-mono text-charcoal-400 mb-2">
        <MessageSquareQuote className="w-4 h-4 text-telemetry-teal" />
        <span>BEHAVIORAL REFLECTION</span>
        {durationMinutes && <span className="text-charcoal-600">/</span>}
        {durationMinutes && <span>{Math.round(durationMinutes)} min on {appName}</span>}
      </div>

      <h4 className="text-sm font-semibold text-charcoal-100 mb-1">
        Was this session intentional?
      </h4>
      <p className="text-xs text-charcoal-400 mb-4">
        Awareness starts with observing intent without judgment or criticism.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {options.map((opt) => {
          const isSelected = selected === opt.label;
          return (
            <button
              key={opt.label}
              type="button"
              disabled={saving}
              onClick={() => handleSelect(opt.label)}
              className={`p-3 rounded border text-left transition-all ${
                isSelected
                  ? 'bg-charcoal-800 border-telemetry-teal text-telemetry-teal shadow-sm ring-1 ring-telemetry-teal/30'
                  : `bg-charcoal-950/70 border-charcoal-800 text-charcoal-200 ${opt.color}`
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold block">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-telemetry-teal" />}
              </div>
              <span className="text-[10px] text-charcoal-400 block mt-1 leading-snug">
                {opt.desc}
              </span>
            </button>
          );
        })}
      </div>

      {savedSuccess && (
        <div className="text-[11px] text-telemetry-teal flex items-center space-x-1 font-mono pt-1">
          <Check className="w-3.5 h-3.5" />
          <span>Reflection recorded to your mirror baseline.</span>
        </div>
      )}
    </div>
  );
};
