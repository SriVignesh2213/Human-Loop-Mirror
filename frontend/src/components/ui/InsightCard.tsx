import React from 'react';
import { Insight } from '../../types';
import { Sparkles, CheckCircle2, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface InsightCardProps {
  insight: Insight;
  isMain?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, isMain = false }) => {
  return (
    <div
      className={`border rounded-lg p-5 transition-all ${
        isMain
          ? 'bg-charcoal-900 border-telemetry-teal/30 shadow-subtle'
          : 'bg-charcoal-900 border-charcoal-800 hover:border-charcoal-700'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-charcoal-800 border border-telemetry-teal/40 flex items-center justify-center text-telemetry-teal">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-charcoal-100">{insight.title}</h3>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-300 border border-charcoal-700">
            {insight.source === 'kimi' ? 'Kimi K3 Verified' : 'Evidence Baseline'}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-telemetry-teal/15 text-telemetry-teal border border-telemetry-teal/30 uppercase">
            {insight.confidence} Confidence
          </span>
        </div>
      </div>

      <div className="space-y-3.5 mt-3 text-xs leading-relaxed">
        {/* Observation */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-400 block font-semibold mb-0.5">
            Observation
          </span>
          <p className="text-charcoal-200">{insight.observation}</p>
        </div>

        {/* Evidence */}
        {insight.evidence && insight.evidence.length > 0 && (
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-400 block font-semibold mb-1">
              Evidence
            </span>
            <ul className="space-y-1">
              {insight.evidence.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-charcoal-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-telemetry-teal flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Why It Matters */}
        <div className="p-3 bg-charcoal-950/60 rounded border border-charcoal-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-400 block font-semibold mb-0.5 flex items-center space-x-1">
            <HelpCircle className="w-3 h-3 text-telemetry-teal" />
            <span>Why It Matters</span>
          </span>
          <p className="text-charcoal-200">{insight.why_it_matters}</p>
        </div>

        {/* Try This */}
        {insight.recommendation && (
          <div className="p-3 bg-telemetry-teal/5 rounded border-l-2 border-telemetry-teal">
            <span className="text-[10px] font-mono uppercase tracking-wider text-telemetry-teal block font-semibold mb-0.5">
              Try This (Sublimation & Alternative Choice)
            </span>
            <p className="text-charcoal-200">{insight.recommendation}</p>
          </div>
        )}
      </div>
    </div>
  );
};
