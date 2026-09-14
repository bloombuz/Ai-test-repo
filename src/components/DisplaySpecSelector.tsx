import React from 'react';
import { P25DisplaySpec } from '../types';
import { P25_DISPLAY_SPECS } from '../data/specs';
import { Monitor, Sun, Cpu, Eye, Maximize2 } from 'lucide-react';

interface DisplaySpecSelectorProps {
  currentSpec: P25DisplaySpec;
  onSelectSpec: (spec: P25DisplaySpec) => void;
}

export const DisplaySpecSelector: React.FC<DisplaySpecSelectorProps> = ({
  currentSpec,
  onSelectSpec,
}) => {
  return (
    <div id="p25-hardware-selector" className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-100/80 dark:border-slate-800 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Monitor className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              HYGH Display
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Physical vehicle top hardware matrix calibrated for 128px rasterization &amp; ambient nits
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 px-3 py-1 rounded-full text-[11px] font-mono text-slate-600 dark:text-slate-300">
          <span>Pitch 2.5mm</span>
          <span className="text-slate-400 dark:text-slate-500">•</span>
          <span>160,000 diodes/m²</span>
          <span className="text-slate-400 dark:text-slate-500">•</span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">128 Row Native</span>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 gap-3.5">
        {Object.values(P25_DISPLAY_SPECS).map((spec) => {
          const isSelected = spec.id === currentSpec.id;
          return (
            <button
              id={`select-profile-${spec.id}`}
              key={spec.id}
              type="button"
              onClick={() => onSelectSpec(spec)}
              className={`p-4 rounded-2xl border text-left transition-all relative ${
                isSelected
                  ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-600 dark:border-blue-500 shadow-xs ring-1 ring-blue-600/20'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight">{spec.series}</div>
                  <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-medium mt-0.5">{spec.id}</div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono transition-colors ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {spec.resolutionWidthPx} × {spec.resolutionHeightPx}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Dimensions: </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{spec.displayWidthMm}×{spec.displayHeightMm}mm</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Aspect: </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{spec.aspectRatioLabel}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Day Luminance: </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">≤{spec.maxBrightnessNits} nits</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Weight: </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{spec.weightKg} kg</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Real-world hardware constraint banner */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-5 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Diode Pitch: <strong className="text-slate-800 dark:text-slate-200 font-semibold">2.5 mm</strong></span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Vertical Matrix: <strong className="text-blue-600 dark:text-blue-400 font-semibold">128 Pixels Strict</strong></span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Daylight Nits: <strong className="text-slate-800 dark:text-slate-200 font-semibold">4500 Nits Max</strong></span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-emerald-500" />
            <span>Viewing Angle: <strong className="text-slate-800 dark:text-slate-200 font-semibold">V140° / H140°</strong></span>
          </span>
        </div>
      </div>
    </div>
  );
};
