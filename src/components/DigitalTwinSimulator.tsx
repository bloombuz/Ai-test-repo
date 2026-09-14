import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Moon,
  Cloud,
  Eye,
  ZoomIn,
  Play,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  Layers,
  Zap,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Compass,
  Activity,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { P25DisplaySpec, LightingMode, SunIntensityPreset } from '../types';
import { P25LedScreen, P25DiodeLoupe, P25RenderMode, DiodeInspectInfo } from './P25LedDisplay';

interface DigitalTwinSimulatorProps {
  currentSpec: P25DisplaySpec;
  imageSrc: string | null;
  mediaType?: 'image' | 'video';
  videoDuration?: number;
  contrastScore?: number;
  wordCount?: number;
  isPlaylistMode?: boolean;
  activeSlotIndex?: number;
  totalSlots?: number;
  slotElapsedSec?: number;
  onSkipNext?: () => void;
  onSkipPrev?: () => void;
}

export const DigitalTwinSimulator: React.FC<DigitalTwinSimulatorProps> = ({
  currentSpec,
  imageSrc,
  mediaType = 'image',
  videoDuration = 6.0,
  contrastScore = 52,
  wordCount = 14,
  isPlaylistMode = false,
  activeSlotIndex = 0,
  totalSlots = 6,
  slotElapsedSec = 0,
  onSkipNext,
  onSkipPrev,
}) => {
  const [lightingMode, setLightingMode] = useState<LightingMode>('sunlight');
  const [sunPreset, setSunPreset] = useState<SunIntensityPreset>('high-noon');
  const [ambientRoofColor, setAmbientRoofColor] = useState<{ r: number; g: number; b: number }>({ r: 40, g: 80, b: 160 });
  const [showLightingTelemetry, setShowLightingTelemetry] = useState<boolean>(true);
  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);
  const [isGlanceTesting, setIsGlanceTesting] = useState<boolean>(false);
  const [glanceTimeRemaining, setGlanceTimeRemaining] = useState<number>(2.5);
  const [glancePassed, setGlancePassed] = useState<boolean | null>(null);

  // Physical P2.5 Simulation Engine States
  const [renderMode, setRenderMode] = useState<P25RenderMode>('physical');
  const [showLoupe, setShowLoupe] = useState<boolean>(false);
  const [hoveredDiode, setHoveredDiode] = useState<DiodeInspectInfo | null>(null);
  const [pixelData, setPixelData] = useState<{ width: number; height: number; data: Uint8ClampedArray } | null>(null);
  const [splitPosition, setSplitPosition] = useState<number>(50);

  // Viewing Distance & P2.5 Optics States
  const [viewingDistance, setViewingDistance] = useState<number>(8.6); // Default to P2.5 optimal visual blend point (8.6m)
  const [viewMode, setViewMode] = useState<'focus' | 'perspective'>('focus');
  const [nitsMode, setNitsMode] = useState<'3500' | '4500' | '5000'>('4500');

  // Video playback states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [loopCount, setLoopCount] = useState<number>(1);

  // Guarantee seamless video autoplay on the rooftop mount
  useEffect(() => {
    if (videoRef.current && mediaType === 'video') {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((err) => {
        console.log('Rooftop mount autoplay status:', err);
      });
    }
  }, [imageSrc, mediaType, activeSlotIndex]);

  // Optical physics calculations for Yaham P2.5 LED (2.5mm pixel pitch):
  const blendThresholdMeters = 8.6;
  const angularSizeArcmin = Math.max(0.15, (2.5 / (viewingDistance * 1000)) * (180 / Math.PI) * 60);
  const blendRatio = Math.min(1, Math.max(0, (viewingDistance - 2.0) / (blendThresholdMeters - 2.0)));
  const readabilityIndex = Math.min(99, Math.round(56 + blendRatio * 42));

  const perspectiveScale =
    viewMode === 'perspective'
      ? Math.max(0.48, Math.min(1.15, 1.06 - (viewingDistance - 2.5) * 0.019))
      : 1.0;

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const stepDistance = (delta: number) => {
    setViewingDistance((prev) => Math.min(35, Math.max(1.5, Number((prev + delta).toFixed(1)))));
  };

  // Glance test animation timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGlanceTesting) {
      setGlanceTimeRemaining(2.5);
      setGlancePassed(null);

      const startTime = Date.now();
      const duration = 2500; // 2.5s typical moving vehicle glance window

      timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, (duration - elapsed) / 1000);
        setGlanceTimeRemaining(Number(remaining.toFixed(1)));

        if (elapsed >= duration) {
          clearInterval(timer);
          setIsGlanceTesting(false);
          setGlancePassed(wordCount <= 6 && contrastScore >= 60);
        }
      }, 100);
    }

    return () => clearInterval(timer);
  }, [isGlanceTesting, wordCount, contrastScore]);

  const triggerGlanceTest = () => {
    setIsGlanceTesting(true);
  };

  return (
    <div id="digital-twin-simulator" className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-100/80 dark:border-slate-800 space-y-4 transition-colors">
      {/* Simulator Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              P2.5 Taxi Roof Digital Twin &amp; In-Situ Simulator
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
              Yaham {currentSpec.resolutionWidthPx}×{currentSpec.resolutionHeightPx}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-world 2.5mm diode pixel pitch, high-brightness SMD LEDs, and distance optical blending
          </p>
        </div>

        {/* View Condition Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Lighting Mode Pill */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full text-xs font-medium border border-slate-200/60 dark:border-slate-700/60">
            <button
              id="light-sunlight-btn"
              type="button"
              onClick={() => setLightingMode('sunlight')}
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                lightingMode === 'sunlight'
                  ? 'bg-amber-500 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Direct Sunlight Visual Simulation (100,000 Lux Veiling Glare & Solar Reflections)"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Direct Sun</span>
            </button>
            <button
              id="light-overcast-btn"
              type="button"
              onClick={() => setLightingMode('overcast')}
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                lightingMode === 'overcast'
                  ? 'bg-slate-700 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Overcast Daytime Visual Simulation (15,000 Lux Diffuse Light, 140:1 Louvre Contrast)"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Overcast</span>
            </button>
            <button
              id="light-night-btn"
              type="button"
              onClick={() => setLightingMode('night')}
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                lightingMode === 'night'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Night Visual Simulation (12 Lux Urban Arterial, Auto-Dimmed 1200 Nits, Roof Glow)"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Night</span>
            </button>
          </div>

          {/* Direct Sun Intensity Angle Presets */}
          {lightingMode === 'sunlight' && (
            <div className="flex items-center bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-0.5 rounded-full text-[11px] font-medium transition-all">
              <button
                id="sun-high-noon-btn"
                type="button"
                onClick={() => setSunPreset('high-noon')}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  sunPreset === 'high-noon'
                    ? 'bg-amber-500 text-white font-semibold shadow-2xs'
                    : 'text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-white'
                }`}
                title="Direct Solar Zenith (100,000 Lux) - Maximum veiling glare & black floor washout"
              >
                High Noon
              </button>
              <button
                id="sun-angled-btn"
                type="button"
                onClick={() => setSunPreset('angled')}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  sunPreset === 'angled'
                    ? 'bg-amber-500 text-white font-semibold shadow-2xs'
                    : 'text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-white'
                }`}
                title="45° Angled Sunlight (80,000 Lux) - Directional specular glare on diodes & louvres"
              >
                45° Angled
              </button>
              <button
                id="sun-golden-btn"
                type="button"
                onClick={() => setSunPreset('golden')}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  sunPreset === 'golden'
                    ? 'bg-amber-500 text-white font-semibold shadow-2xs'
                    : 'text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-white'
                }`}
                title="Golden Hour Low Sun (50,000 Lux) - Warm low solar cast on car & display"
              >
                Golden Hour
              </button>
            </div>
          )}

          {/* Engine Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full text-xs font-medium">
            <button
              id="engine-physical-btn"
              type="button"
              onClick={() => setRenderMode('physical')}
              className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all ${
                renderMode === 'physical'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Authentic Yaham P2.5 SMD1921 3-in-1 Diode Matrix"
            >
              <Sparkles className="w-3 h-3" />
              <span>SMD Diodes</span>
            </button>
            <button
              id="engine-subpixel-btn"
              type="button"
              onClick={() => setRenderMode('subpixel')}
              className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all ${
                renderMode === 'subpixel'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Visualizes individual Red, Green, Blue phosphor micro-dies"
            >
              <span>Subpixel</span>
            </button>
            <button
              id="engine-split-btn"
              type="button"
              onClick={() => setRenderMode('split')}
              className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all ${
                renderMode === 'split'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Interactive slider comparing Master Artwork vs Yaham P2.5 LED Display"
            >
              <Sliders className="w-3 h-3" />
              <span>Split</span>
            </button>
            <button
              id="engine-master-btn"
              type="button"
              onClick={() => setRenderMode('master')}
              className={`px-3 py-1 rounded-full transition-all ${
                renderMode === 'master'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Original unrasterized vector master"
            >
              <span>Master</span>
            </button>
          </div>

          {/* 12x SMD Diode Macro Loupe Button */}
          <button
            id="toggle-loupe-btn"
            type="button"
            onClick={() => setShowLoupe(!showLoupe)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs ${
              showLoupe
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>12x Loupe</span>
          </button>

          {/* Safe Zones Toggle */}
          <button
            id="toggle-safezones-btn"
            type="button"
            onClick={() => setShowSafeZones(!showSafeZones)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-xs ${
              showSafeZones
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            Safe Zone
          </button>
        </div>
      </div>

      {/* VIEWING DISTANCE & LUMINANCE CONTROL BAR */}
      <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-3 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Distance Header & Value Display */}
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Viewing Distance:
            </span>
            <div className="flex items-baseline gap-1.5 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                {viewingDistance.toFixed(1)}m
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                ({Math.round(viewingDistance * 3.28084)} ft)
              </span>
            </div>

            {/* Step closer / Step back buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => stepDistance(-1.5)}
                disabled={viewingDistance <= 1.5}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 font-medium text-[11px] transition-colors shadow-2xs"
              >
                - Closer
              </button>
              <button
                type="button"
                onClick={() => stepDistance(1.5)}
                disabled={viewingDistance >= 35}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 font-medium text-[11px] transition-colors shadow-2xs"
              >
                + Back
              </button>
            </div>
          </div>

          {/* Diode Luminance / Nits Selector & View Scale Toggle */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Output:
              </span>
              <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs text-[11px]">
                <button
                  type="button"
                  onClick={() => setNitsMode('3500')}
                  className={`px-2.5 py-0.5 rounded-full transition-all ${
                    nitsMode === '3500' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  3500 Nits
                </button>
                <button
                  type="button"
                  onClick={() => setNitsMode('4500')}
                  className={`px-2.5 py-0.5 rounded-full transition-all ${
                    nitsMode === '4500' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  4500 Nits (Std)
                </button>
                <button
                  type="button"
                  onClick={() => setNitsMode('5000')}
                  className={`px-2.5 py-0.5 rounded-full transition-all ${
                    nitsMode === '5000' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  5000 Nits
                </button>
              </div>
            </div>

            {/* View Scale Mode Toggle */}
            <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode('focus')}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  viewMode === 'focus' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Focus
              </button>
              <button
                type="button"
                onClick={() => setViewMode('perspective')}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  viewMode === 'perspective' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Perspective
              </button>
            </div>
          </div>
        </div>

        {/* Distance Slider with Preset Markers */}
        <div className="space-y-1.5 pt-1">
          <input
            id="viewing-distance-slider"
            type="range"
            min="1.5"
            max="35"
            step="0.5"
            value={viewingDistance}
            onChange={(e) => setViewingDistance(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          {/* Preset Buttons */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setViewingDistance(2.0)}
              className={`px-2 py-0.5 rounded-full hover:text-slate-900 dark:hover:text-white transition-colors ${
                viewingDistance <= 3.0 ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60' : ''
              }`}
            >
              2.0m (Close)
            </button>
            <button
              type="button"
              onClick={() => setViewingDistance(5.0)}
              className={`px-2 py-0.5 rounded-full hover:text-slate-900 dark:hover:text-white transition-colors ${
                Math.abs(viewingDistance - 5.0) < 1 ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60' : ''
              }`}
            >
              5.0m (Pedestrian)
            </button>
            <button
              type="button"
              onClick={() => setViewingDistance(8.6)}
              className={`px-2 py-0.5 rounded-full hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 ${
                Math.abs(viewingDistance - 8.6) < 1 ? 'text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              ★ 8.6m (P2.5 Blend Threshold)
            </button>
            <button
              type="button"
              onClick={() => setViewingDistance(18.0)}
              className={`px-2 py-0.5 rounded-full hover:text-slate-900 dark:hover:text-white transition-colors ${
                Math.abs(viewingDistance - 18.0) < 2 ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60' : ''
              }`}
            >
              18m (Approaching Vehicle)
            </button>
            <button
              type="button"
              onClick={() => setViewingDistance(30.0)}
              className={`px-2 py-0.5 rounded-full hover:text-slate-900 dark:hover:text-white transition-colors ${
                viewingDistance >= 26 ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60' : ''
              }`}
            >
              30m (Traffic)
            </button>
          </div>
        </div>

        {/* Dynamic P2.5 Optical Science Quality Badge */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Angular Subtense:</span>
            <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{angularSizeArcmin.toFixed(2)} arcmin</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-500">Diode State:</span>
            <span
              className={`font-semibold ${
                viewingDistance >= 8.6 ? 'text-emerald-600 dark:text-emerald-400' : viewingDistance >= 5 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {viewingDistance >= 8.6
                ? '✓ 100% Optically Blended (Seamless Continuous Text)'
                : viewingDistance >= 5
                ? '⟳ Transitional (Diodes starting to fuse)'
                : '⚠ Discrete Diode Grid Resolved (Close pixelation)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Legibility Score:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{readabilityIndex}%</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {viewingDistance >= 8.6 ? '(Seamless)' : '(Stepping visible on 128px matrix)'}
            </span>
          </div>
        </div>
      </div>

      {/* Photometric & Optical Telemetry Dashboard */}
      {showLightingTelemetry && (
        <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs shadow-xs transition-all">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span>Photometric Environment:</span>
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                {lightingMode === 'sunlight'
                  ? sunPreset === 'high-noon'
                    ? '100,000 Lux (Direct Solar Zenith)'
                    : sunPreset === 'angled'
                    ? '80,000 Lux (45° Angled Sunlight)'
                    : '50,000 Lux (Golden Hour Low Sun)'
                  : lightingMode === 'overcast'
                  ? '15,000 Lux (Diffuse Sky Dome)'
                  : '12 Lux (Urban Arterial Night)'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Luminance: {lightingMode === 'night' ? '1,200 Nits (Dimmed)' : `${nitsMode} Nits`}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                Contrast: {lightingMode === 'sunlight' ? (sunPreset === 'high-noon' ? '16 : 1 (Washout)' : sunPreset === 'angled' ? '24 : 1' : '32 : 1') : lightingMode === 'overcast' ? '140 : 1 (Peak Outdoor)' : '> 3,400 : 1 (High Dynamic Range)'}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                Black Floor: {lightingMode === 'sunlight' ? (sunPreset === 'high-noon' ? '280 Nits' : sunPreset === 'angled' ? '190 Nits' : '140 Nits') : lightingMode === 'overcast' ? '32 Nits' : '0.35 Nits'}
              </span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <span>
              {lightingMode === 'sunlight'
                ? 'Severe solar washout on black louvres. Polycarbonate micro-louvres reduce ambient reflection, but bold typography & high-contrast creatives are essential.'
                : lightingMode === 'overcast'
                ? 'Uniform diffuse sky dome without harsh hotspots. Yaham black-face louvres efficiently absorb diffuse light for maximum outdoor DOOH readability.'
                : 'Yaham Photocell sensor automatically dims cabinet to 1,200 Nits to comply with DOOH roadway safety codes and prevent driver flash-blindness.'}
            </span>
          </div>
        </div>
      )}

      {/* Simulator Stage Environment */}
      <div
        id="simulator-canvas-stage"
        className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors duration-700 p-6 flex flex-col items-center justify-center min-h-[380px] ${
          lightingMode === 'sunlight'
            ? sunPreset === 'golden'
              ? 'bg-gradient-to-b from-amber-400/80 via-orange-200/70 to-slate-200'
              : sunPreset === 'angled'
              ? 'bg-gradient-to-br from-sky-300 via-sky-100 to-amber-50/60'
              : 'bg-gradient-to-b from-sky-300 via-sky-100 to-slate-100'
            : lightingMode === 'overcast'
            ? 'bg-gradient-to-b from-slate-400/80 via-slate-200 to-slate-100 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900'
            : 'bg-gradient-to-b from-[#050814] via-[#090e24] to-[#030610]'
        }`}
      >
        {/* ========================================================================= */}
        {/* REALISTIC ENVIRONMENTAL VISUAL SCENERY: DIRECT SUN, OVERCAST & NIGHT     */}
        {/* ========================================================================= */}

        {/* 1. DIRECT SUN VISUAL SCENERY */}
        {lightingMode === 'sunlight' && (
          <>
            {/* Celestial Sun Disk & Dynamic Corona Flares */}
            <div
              className={`absolute pointer-events-none transition-all duration-700 z-0 ${
                sunPreset === 'high-noon'
                  ? 'top-1 left-1/2 -translate-x-1/2'
                  : sunPreset === 'angled'
                  ? 'top-2 right-12'
                  : 'top-10 right-6'
              }`}
            >
              {/* Core Solar Corona */}
              <div
                className={`rounded-full blur-2xl animate-pulse ${
                  sunPreset === 'golden'
                    ? 'w-48 h-48 bg-amber-400/50'
                    : sunPreset === 'angled'
                    ? 'w-40 h-40 bg-yellow-200/60'
                    : 'w-44 h-44 bg-white/70'
                }`}
              />
              {/* Brilliant Solar Disc */}
              <div
                className={`absolute inset-0 m-auto rounded-full shadow-2xl ${
                  sunPreset === 'golden'
                    ? 'w-16 h-16 bg-gradient-to-tr from-amber-300 to-yellow-100 shadow-amber-400/80'
                    : 'w-14 h-14 bg-white shadow-yellow-100/90'
                }`}
              />
            </div>

            {/* Directional Solar Flare Streak across Stage */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen opacity-45"
              style={{
                background:
                  sunPreset === 'golden'
                    ? 'linear-gradient(125deg, rgba(251,191,36,0.35) 0%, rgba(245,158,11,0.15) 35%, transparent 70%)'
                    : sunPreset === 'angled'
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(254,240,138,0.2) 30%, transparent 65%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 35%, transparent 70%)',
              }}
            />

            {/* Distant Sunlit Urban Skyline Silhouette */}
            <div className="absolute bottom-12 inset-x-0 h-28 pointer-events-none opacity-25 flex items-end justify-around px-4">
              <div className="w-10 h-20 bg-slate-700/60 rounded-t-xs" />
              <div className="w-8 h-14 bg-slate-700/50 rounded-t-xs" />
              <div className="w-14 h-24 bg-slate-800/60 rounded-t-xs" />
              <div className="w-12 h-16 bg-slate-700/50 rounded-t-xs" />
              <div className="w-16 h-22 bg-slate-800/60 rounded-t-xs" />
              <div className="w-10 h-12 bg-slate-700/40 rounded-t-xs" />
              <div className="w-14 h-26 bg-slate-800/60 rounded-t-xs" />
              <div className="w-8 h-16 bg-slate-700/50 rounded-t-xs" />
            </div>

            {/* Heat Mirage / Asphalt Glare Horizon */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-200/90 via-slate-200/40 to-transparent pointer-events-none" />
          </>
        )}

        {/* 2. OVERCAST VISUAL SCENERY */}
        {lightingMode === 'overcast' && (
          <>
            {/* Layered Diffuse Stratus Cloud Bands */}
            <div className="absolute top-0 inset-x-0 h-36 pointer-events-none opacity-40">
              <div className="absolute -top-10 left-1/4 w-96 h-28 bg-slate-100 rounded-full blur-2xl" />
              <div className="absolute top-2 right-1/4 w-80 h-24 bg-slate-200 rounded-full blur-2xl" />
              <div className="absolute -top-6 right-10 w-72 h-20 bg-slate-100 rounded-full blur-xl" />
            </div>

            {/* Distant Cool Daylight Urban Silhouette */}
            <div className="absolute bottom-12 inset-x-0 h-24 pointer-events-none opacity-20 flex items-end justify-around px-4">
              <div className="w-10 h-16 bg-slate-600 rounded-t-xs" />
              <div className="w-14 h-22 bg-slate-700 rounded-t-xs" />
              <div className="w-8 h-12 bg-slate-600 rounded-t-xs" />
              <div className="w-16 h-20 bg-slate-700 rounded-t-xs" />
              <div className="w-12 h-14 bg-slate-600 rounded-t-xs" />
              <div className="w-14 h-24 bg-slate-700 rounded-t-xs" />
            </div>

            {/* Diffuse Daylight Wet Road Plane */}
            <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-slate-300/80 via-slate-200/30 to-transparent pointer-events-none" />
          </>
        )}

        {/* 3. NIGHT VISUAL SCENERY */}
        {lightingMode === 'night' && (
          <>
            {/* Deep Midnight Sky with Distant Stars */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <div className="absolute top-4 left-10 w-1 h-1 bg-white rounded-full animate-pulse" />
              <div className="absolute top-8 left-1/3 w-0.5 h-0.5 bg-sky-200 rounded-full" />
              <div className="absolute top-6 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse" />
              <div className="absolute top-12 right-16 w-0.5 h-0.5 bg-yellow-100 rounded-full" />
            </div>

            {/* Distant High-Rise Urban Skyline with Lit Windows */}
            <div className="absolute bottom-12 inset-x-0 h-28 pointer-events-none opacity-40 flex items-end justify-around px-4">
              <div className="w-10 h-22 bg-slate-900 border-t border-slate-700 flex flex-col gap-1 p-1">
                <div className="w-full h-0.5 bg-amber-200/40" />
                <div className="w-full h-0.5 bg-amber-200/30" />
                <div className="w-full h-0.5 bg-cyan-200/30" />
              </div>
              <div className="w-14 h-26 bg-slate-950 border-t border-slate-700 flex flex-col gap-1 p-1">
                <div className="w-full h-0.5 bg-amber-100/50" />
                <div className="w-full h-0.5 bg-cyan-100/40" />
              </div>
              <div className="w-8 h-14 bg-slate-900 border-t border-slate-800" />
              <div className="w-16 h-24 bg-slate-950 border-t border-slate-700 flex flex-col gap-1 p-1">
                <div className="w-full h-0.5 bg-amber-200/50" />
                <div className="w-full h-0.5 bg-amber-200/40" />
              </div>
              <div className="w-12 h-18 bg-slate-900 border-t border-slate-800" />
              <div className="w-14 h-28 bg-slate-950 border-t border-slate-700 flex flex-col gap-1 p-1">
                <div className="w-full h-0.5 bg-cyan-200/40" />
                <div className="w-full h-0.5 bg-amber-100/40" />
              </div>
            </div>

            {/* Urban Bokeh Orbs (Streetlamps, Neon Billboards, Vehicle Taillights) */}
            <div className="absolute top-8 left-8 w-14 h-14 rounded-full bg-amber-500/15 blur-xl pointer-events-none" />
            <div className="absolute top-14 right-16 w-16 h-16 rounded-full bg-cyan-500/15 blur-xl pointer-events-none" />
            <div className="absolute bottom-16 left-1/4 w-12 h-12 rounded-full bg-rose-500/15 blur-lg pointer-events-none" />

            {/* Dark Wet Asphalt Surface with Road Markings */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-950 via-slate-900 to-transparent pointer-events-none flex items-center justify-center">
              <div className="w-24 h-0.5 bg-yellow-500/25 blur-xs" />
            </div>
          </>
        )}

        {/* Distance Indicator Overlay on Stage */}
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pointer-events-none z-10 shadow-sm">
          <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          <span>Distance: {viewingDistance.toFixed(1)}m</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className={viewingDistance >= 8.6 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-blue-600 dark:text-blue-400 font-semibold'}>
            {viewingDistance >= 8.6 ? 'Optically Blended' : 'Discrete Pitch'}
          </span>
        </div>

        {/* Glance Test & Perspective Transform Wrapper */}
        <div
          className="w-full max-w-3xl transition-transform duration-300 ease-out flex flex-col items-center z-10"
          style={{
            transform: isGlanceTesting
              ? `translateX(${(glanceTimeRemaining - 1.25) * 80}px) scale(${
                  (0.92 + (glanceTimeRemaining / 2.5) * 0.08) * perspectiveScale
                })`
              : `scale(${perspectiveScale})`,
            transformOrigin: 'center center',
          }}
        >
          {/* VEHICLE CABIN TOP & ROOF-RACK MOUNT */}
          <div className="relative w-full mx-auto flex flex-col items-center">
            {/* The Yaham P2.5 LED Display Cabinet */}
            <div className="relative w-full rounded-xl shadow-2xl overflow-hidden bg-slate-950 border-4 border-slate-800 ring-1 ring-slate-900">
              {/* Aerodynamic Yaham top extrusion hood */}
              <div className="h-3.5 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-b border-slate-900 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono text-slate-300 tracking-wider font-semibold">
                    HYGH • YAHAM ROOFLED ({currentSpec.resolutionWidthPx}×{currentSpec.resolutionHeightPx})
                  </span>
                  {/* Active Yaham Photocell Light Sensor Indicator */}
                  <div
                    className="flex items-center gap-1 bg-black/60 px-1.5 py-0.2 rounded-full border border-slate-700"
                    title={
                      lightingMode === 'night'
                        ? 'Yaham Intelligent Photocell: Auto-dimmed to 1200 Nits to comply with DOOH roadway codes'
                        : 'Yaham Intelligent Photocell: High-ambient drive active'
                    }
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        lightingMode === 'night' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                      }`}
                    />
                    <span className="text-[7px] font-mono text-slate-300">
                      {lightingMode === 'night' ? 'PHOTOCELL: 1200 NITS AUTO-DIM' : 'PHOTOCELL: HIGH AMBIENT'}
                    </span>
                  </div>
                </div>
                <span className="text-[8px] font-mono text-blue-400 font-bold">
                  {lightingMode === 'night' ? '1,200 NITS (NIGHT)' : `${nitsMode} NITS`}
                </span>
              </div>

              {/* Active Screen Area with 128px Matrix Aspect Ratio */}
              <div
                className="relative w-full bg-black overflow-hidden flex items-center justify-center"
                style={{
                  aspectRatio: `${currentSpec.resolutionWidthPx} / ${currentSpec.resolutionHeightPx}`,
                }}
              >
                {imageSrc ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Hidden video element to decode frames and synchronize playback state */}
                    {mediaType === 'video' && (
                      <video
                        ref={videoRef}
                        src={imageSrc}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={() => setLoopCount((c) => c + 1)}
                        className="hidden"
                      />
                    )}

                    {/* PHYSICAL P2.5 LED HARDWARE DISPLAY ENGINE */}
                    <P25LedScreen
                      spec={currentSpec}
                      imageSrc={imageSrc}
                      mediaType={mediaType}
                      lightingMode={lightingMode}
                      sunPreset={sunPreset}
                      onDominantColorChange={setAmbientRoofColor}
                      nitsMode={nitsMode}
                      viewingDistance={viewingDistance}
                      showSafeZones={showSafeZones}
                      renderMode={renderMode}
                      splitPosition={splitPosition}
                      onSplitPositionChange={setSplitPosition}
                      videoRef={videoRef}
                      onHoverDiode={(info, data) => {
                        setHoveredDiode(info);
                        if (data) setPixelData(data);
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-xs text-slate-500 font-medium">
                      No Creative Loaded
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">
                      Upload an image or pick a sample ad above
                    </p>
                  </div>
                )}
              </div>

              {/* Aerodynamic Yaham lower chassis */}
              <div className="h-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-950 flex items-center justify-center">
                <div className="w-16 h-0.5 bg-slate-600 rounded-full" />
              </div>
            </div>

            {/* Playback Interactive Bar (when media is DOOH video or when in 6-ad Playlist Loop mode) */}
            {(mediaType === 'video' || isPlaylistMode) && imageSrc && (
              <div className="w-full mt-2 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs shadow-xs transition-colors">
                <div className="flex items-center gap-2">
                  {/* Autoplay Active Indicator - Pause option removed per DOOH broadcast requirements */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Autoplay</span>
                  </div>

                  {isPlaylistMode && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={onSkipPrev}
                        className="p-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                        title="Previous Ad Spot"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={onSkipNext}
                        className="p-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                        title="Skip to Next Ad Spot"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {mediaType === 'video' && (
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                      title={isMuted ? 'Muted (DOOH Standard)' : 'Audio Enabled'}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                  )}

                  <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
                    {isPlaylistMode
                      ? `Spot ${activeSlotIndex + 1} of ${totalSlots}`
                      : `${videoCurrentTime.toFixed(1)}s / ${videoDuration.toFixed(1)}s`}
                  </span>
                </div>

                {/* Scrubber / Progress track */}
                <div className="flex-1 mx-2 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-100 ease-linear"
                    style={{
                      width: isPlaylistMode
                        ? `${Math.min(100, (slotElapsedSec / 10.0) * 100)}%`
                        : `${Math.min(100, (videoCurrentTime / (videoDuration || 1)) * 100)}%`,
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {isPlaylistMode ? (
                    <span className="text-slate-700 dark:text-slate-300 font-bold">
                      {slotElapsedSec.toFixed(1)}s / 10.0s
                    </span>
                  ) : (
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-700 dark:text-slate-300 font-medium">
                      Loop #{loopCount}
                    </span>
                  )}
                  <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">1920Hz Refresh</span>
                </div>
              </div>
            )}

            {/* Slidable Roof Mounting Tracks */}
            <div className="w-4/5 flex justify-between px-8 -mt-0.5">
              <div
                className={`w-6 h-5 transition-colors duration-500 border-x shadow-xs ${
                  lightingMode === 'sunlight'
                    ? 'bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border-amber-100/50'
                    : lightingMode === 'night'
                    ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700'
                    : 'bg-gradient-to-b from-slate-700 to-slate-800 border-slate-600'
                }`}
              />
              <div
                className={`w-6 h-5 transition-colors duration-500 border-x shadow-xs ${
                  lightingMode === 'sunlight'
                    ? 'bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border-amber-100/50'
                    : lightingMode === 'night'
                    ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700'
                    : 'bg-gradient-to-b from-slate-700 to-slate-800 border-slate-600'
                }`}
              />
            </div>

            {/* Vehicle Roof Bar */}
            <div
              className={`w-11/12 h-3 rounded-full shadow-md transition-colors duration-500 ${
                lightingMode === 'sunlight'
                  ? 'bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500 border-t border-amber-100/70'
                  : lightingMode === 'night'
                  ? 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 border-b border-slate-900'
                  : 'bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 border-b border-slate-800'
              }`}
            />

            {/* Windshield & Roof arc - In Night Mode: Illuminated by the real-time active screen colors */}
            <div className="relative w-full h-10 bg-gradient-to-b from-slate-800/95 to-slate-950 rounded-t-3xl border-t border-slate-700/60 -mt-1 shadow-inner flex items-center justify-center overflow-hidden">
              {/* Dynamic Real-time Ambient Lighting from the active LED display down onto the car roof */}
              {lightingMode === 'night' && (
                <>
                  <div
                    className="absolute inset-0 rounded-t-3xl pointer-events-none transition-all duration-300"
                    style={{
                      background: `radial-gradient(ellipse at 50% 0%, rgba(${ambientRoofColor.r}, ${ambientRoofColor.g}, ${ambientRoofColor.b}, 0.5) 0%, rgba(${ambientRoofColor.r}, ${ambientRoofColor.g}, ${ambientRoofColor.b}, 0.15) 50%, transparent 80%)`,
                    }}
                  />
                  {/* Glossy specular highlight line along car roof curve */}
                  <div
                    className="absolute top-0 w-3/4 h-1 rounded-full blur-xs transition-colors duration-300 pointer-events-none"
                    style={{
                      backgroundColor: `rgba(${ambientRoofColor.r}, ${ambientRoofColor.g}, ${ambientRoofColor.b}, 0.85)`,
                    }}
                  />
                </>
              )}

              {/* In Sunlight Mode: Warm specular glint across vehicle windshield */}
              {lightingMode === 'sunlight' && (
                <div
                  className="absolute inset-0 rounded-t-3xl pointer-events-none opacity-40 mix-blend-screen"
                  style={{
                    background:
                      sunPreset === 'golden'
                        ? 'linear-gradient(135deg, rgba(251,191,36,0.3) 0%, transparent 60%)'
                        : 'linear-gradient(145deg, rgba(255,255,255,0.45) 0%, transparent 60%)',
                  }}
                />
              )}

              <span className="relative text-[10px] font-semibold tracking-widest text-slate-300 uppercase z-1">
                TAXI ROOF MOUNT • 35 KM/H URBAN ARTERIAL
              </span>
            </div>

            {/* 12x SMD Macro Diode Loupe Microscope Inspector Dock */}
            {showLoupe && (
              <div className="w-full mt-3">
                <P25DiodeLoupe
                  hoveredDiode={hoveredDiode}
                  spec={currentSpec}
                  pixelData={pixelData}
                  onClose={() => setShowLoupe(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Glance Test Floating HUD */}
        {isGlanceTesting && (
          <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-900/95 border border-blue-500 px-4 py-2.5 rounded-2xl shadow-xl text-left text-xs z-20">
            <div className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" />
              <span>3-Second Moving Vehicle Glance Test</span>
            </div>
            <div className="text-slate-700 dark:text-slate-300 mt-1 font-mono">
              Glance window remaining:{' '}
              <strong className="text-blue-700 dark:text-blue-400 text-sm font-bold">{glanceTimeRemaining}s</strong>
            </div>
          </div>
        )}

        {/* Glance Test Outcome Badge */}
        {!isGlanceTesting && glancePassed !== null && (
          <div
            className={`absolute top-4 left-4 px-3.5 py-1.5 rounded-full border text-xs font-semibold shadow-md ${
              glancePassed
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
            }`}
          >
            {glancePassed
              ? '✓ Glance Test Passed: High recall within 2.5s'
              : '✕ Glance Test Failed: Too many words or low contrast for moving taxi glance'}
          </div>
        )}
      </div>

      {/* Simulator Bottom Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span className="text-slate-800 dark:text-slate-200 font-semibold">P2.5 Hardware Profile:</span>
          <span>Pitch 2.5mm</span>
          <span>•</span>
          <span>128px Raster</span>
          <span>•</span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">Blend Point: 8.6m</span>
        </div>

        <button
          id="run-glance-test-btn"
          type="button"
          onClick={triggerGlanceTest}
          disabled={isGlanceTesting || !imageSrc}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-all disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>Simulate 35 km/h Taxi Glance (2.5s)</span>
        </button>
      </div>
    </div>
  );
};
