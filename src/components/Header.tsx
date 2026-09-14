import React from 'react';
import { Sparkles, ShieldCheck, HelpCircle, Layers } from 'lucide-react';
import { P25DisplaySpec } from '../types';

interface HeaderProps {
  selectedSpec: P25DisplaySpec;
  onOpenSpecsModal: () => void;
  isAnalyzing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedSpec,
  onOpenSpecsModal,
  isAnalyzing,
}) => {
  return (
    <header id="dams-header" className="bg-slate-900 border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: Brand / System Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black tracking-tight">
            <span className="text-base font-extrabold tracking-tighter">P2.5</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Taxi Top LED AI Creative Advisor
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="w-3 h-3 text-amber-400" />
                DAMS Pre-Flight
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Yaham RoofLED Displays • Real-Time Performance &amp; Contrast Audit
            </p>
          </div>
        </div>

        {/* Right: Active Profile Chip & Hardware Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="hardware-specs-button"
            type="button"
            onClick={onOpenSpecsModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition-colors shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <span className="text-slate-400 font-medium">Profile:</span>{' '}
              <strong className="text-white">{selectedSpec.name.split(' (')[0]}</strong>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-amber-300">
              {selectedSpec.resolutionWidthPx}×{selectedSpec.resolutionHeightPx}
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-medium">HYGH Benchmark Engine Active</span>
          </div>

          <button
            id="guidelines-info-button"
            type="button"
            onClick={onOpenSpecsModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="View P2.5 LED Display Specification Details"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
