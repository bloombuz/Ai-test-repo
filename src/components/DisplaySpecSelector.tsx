import React from 'react';
import { P25DisplaySpec, P25DisplayModelId } from '../types';
import { P25_DISPLAY_SPECS } from '../data/specs';
import { Monitor, Sun, Zap, Eye, Gauge, Shield, Cpu, Maximize2 } from 'lucide-react';

interface DisplaySpecSelectorProps {
  currentSpec: P25DisplaySpec;
  onSelectSpec: (spec: P25DisplaySpec) => void;
}

export const DisplaySpecSelector: React.FC<DisplaySpecSelectorProps> = ({
  currentSpec,
  onSelectSpec,
}) => {
  return (
    <div id="p25-hardware-selector" className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">
            P2.5 Taxi Roof Hardware Profiles (Yaham LED)
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Pixel Pitch: 2.5mm • 160,000 px/m² • Auto-Brightness Sensor
        </span>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.values(P25_DISPLAY_SPECS).map((spec) => {
          const isSelected = spec.id === currentSpec.id;
          return (
            <button
              id={`select-profile-${spec.id}`}
              key={spec.id}
              type="button"
              onClick={() => onSelectSpec(spec)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                  : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white tracking-wide">{spec.series}</div>
                  <div className="text-[11px] text-amber-400 font-mono mt-0.5">{spec.id}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {spec.resolutionWidthPx} × {spec.resolutionHeightPx} px
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-400">Dimensions: </span>
                  <span className="font-medium text-slate-200">{spec.displayWidthMm}×{spec.displayHeightMm}mm</span>
                </div>
                <div>
                  <span className="text-slate-400">Aspect: </span>
                  <span className="font-medium text-slate-200">{spec.aspectRatioLabel}</span>
                </div>
                <div>
                  <span className="text-slate-400">Luminance: </span>
                  <span className="font-medium text-amber-300">≤{spec.maxBrightnessNits} nits</span>
                </div>
                <div>
                  <span className="text-slate-400">Weight: </span>
                  <span className="font-medium text-slate-200">{spec.weightKg} kg</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Real-world hardware constraint banner */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="inline-flex items-center gap-1 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Diode Pitch: <strong>2.5 mm</strong></span>
          </span>
          <span className="inline-flex items-center gap-1 text-slate-300">
            <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Vertical Matrix: <strong className="text-amber-300">128 Pixels Only</strong></span>
          </span>
          <span className="inline-flex items-center gap-1 text-slate-300">
            <Sun className="w-3.5 h-3.5 text-yellow-400" />
            <span>Daylight Max: <strong>4500 Nits</strong></span>
          </span>
          <span className="inline-flex items-center gap-1 text-slate-300">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Viewing Angle: <strong>V140° / H140°</strong></span>
          </span>
        </div>
        <div className="text-[11px] text-amber-400/90 font-medium">
          ⚠️ Fonts under 22px height render with severe diode pixelation.
        </div>
      </div>
    </div>
  );
};
