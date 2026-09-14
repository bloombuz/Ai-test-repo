import React from 'react';
import { X, Cpu, Maximize2, Sun, Eye, Shield, Zap, Wind } from 'lucide-react';
import { P25DisplaySpec } from '../types';
import { P25_DISPLAY_SPECS } from '../data/specs';

interface SpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSpec: P25DisplaySpec;
}

export const SpecsModal: React.FC<SpecsModalProps> = ({
  isOpen,
  onClose,
  currentSpec,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              P2.5
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Yaham Taxi Roof LED Display Specifications
              </h3>
              <p className="text-xs text-slate-400">
                Official Datasheet Parameters for P2.5 High-Resolution Vehicle Tops
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Specs Comparison Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase">
              <tr>
                <th className="p-2.5 rounded-l">Parameter</th>
                <th className="p-2.5 text-amber-400">YHT-V3.12-P2.5 (Large)</th>
                <th className="p-2.5">YHT-V3.22 / 3.10-P2.5 (Standard)</th>
                <th className="p-2.5 rounded-r">YHT-V7.0-P2.5 (Triangular)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              <tr>
                <td className="p-2.5 text-slate-400 font-medium">Pixel Pitch</td>
                <td className="p-2.5 font-bold text-white">2.5 mm</td>
                <td className="p-2.5 font-bold text-white">2.5 mm</td>
                <td className="p-2.5 font-bold text-white">2.5 mm</td>
              </tr>
              <tr>
                <td className="p-2.5 text-slate-400 font-medium">Pixel Density</td>
                <td className="p-2.5 font-mono">160,000 pixel/㎡</td>
                <td className="p-2.5 font-mono">160,000 pixel/㎡</td>
                <td className="p-2.5 font-mono">160,000 pixel/㎡</td>
              </tr>
              <tr>
                <td className="p-2.5 text-slate-400 font-medium">Cabinet Resolution</td>
                <td className="p-2.5 font-mono text-amber-300 font-bold">576 × 128 × 2 pixels</td>
                <td className="p-2.5 font-mono text-amber-300 font-bold">384 × 128 × 2 pixels</td>
                <td className="p-2.5 font-mono text-amber-300 font-bold">384×128×2 + 192×128</td>
              </tr>
              <tr>
                <td className="p-2.5 text-slate-400 font-medium">Display Dimension</td>
                <td className="p-2.5">1440 × 320 mm (4.5:1)</td>
                <td className="p-2.5">960 × 320 mm (3:1)</td>
                <td className="p-2.5">960×320 (x2) + 480×320 mm</td>
              </tr>
              <tr>
                <td className="p-2.5 text-slate-400 font-medium">Max Luminance</td>
                <td className="p-2.5 font-bold text-amber-400">≤ 4500 nits (Auto Sensor)</td>
                <td className="p-2.5 font-bold text-amber-400">≤ 4500 nits (Auto Sensor)</td>
                <td className="p-2.5 font-bold text-amber-400">≤ 4500 nits (Auto Sensor)</td>
              </tr>
              <tr>
                <td className="p-2.5 text-slate-400 font-medium">Viewing Angle</td>
                <td className="p-2.5">V140° / H140°</td>
                <td className="p-2.5">V140° / H140°</td>
                <td className="p-2.5">V140° / H140°</td>
              </tr>
              <tr>
                <td className="p-2.5 text-slate-400 font-medium">Cabinet Weight</td>
                <td className="p-2.5">22.2 kg / unit</td>
                <td className="p-2.5">14.1 - 18 kg / unit</td>
                <td className="p-2.5">24.0 kg / unit</td>
              </tr>
              <tr>
                <td className="p-2.5 text-slate-400 font-medium">Protection Rating</td>
                <td className="p-2.5">IP66 Weatherproof / Shockproof</td>
                <td className="p-2.5">IP66 Weatherproof / Shockproof</td>
                <td className="p-2.5">IP66 Weatherproof / Shockproof</td>
              </tr>
              <tr>
                <td className="p-2.5 text-slate-400 font-medium">Refresh Rate</td>
                <td className="p-2.5 font-mono">1920 ~ 3840 Hz</td>
                <td className="p-2.5 font-mono">1920 ~ 3840 Hz</td>
                <td className="p-2.5 font-mono">1920 ~ 3840 Hz</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Why P2.5 Constraints Matter in Creative Design */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
            DOOH Creative Rules for P2.5 Taxi Top Media:
          </h4>
          <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
            <li>
              <strong className="text-white">Strict 128-Pixel Height:</strong> The entire vertical canvas is only 128 physical diodes. Any typography below 24px height will be rendered on fewer than 10 diodes, turning into aliased dots.
            </li>
            <li>
              <strong className="text-white">Direct Sunlight (4500 Nits threshold):</strong> Direct solar illumination reaches up to 100,000 lux. Low contrast pastels, faint serifs, or low-contrast gray text wash out completely.
            </li>
            <li>
              <strong className="text-white">P2.5 Optical Blending Distance (8.6m threshold):</strong> With a 2.5mm pixel pitch, individual diodes and matrix gaps are resolved at close proximity (under 8.6m). Beyond 8.6m, human 20/20 vision optically fuses adjacent diodes into a continuous, razor-sharp image where headlines and logos look cleaner and significantly more readable.
            </li>
            <li>
              <strong className="text-white">Vehicle Motion Glance (under 6 words):</strong> Pedestrians and following drivers have an average dwell window of 1.5 to 2.5 seconds. HYGH network data confirms that campaigns with under 6 words and high contrast achieve +43% higher brand lift.
            </li>
          </ul>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
          >
            Close Specifications
          </button>
        </div>
      </div>
    </div>
  );
};
