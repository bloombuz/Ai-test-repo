import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Moon,
  Cloud,
  Eye,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  RotateCcw,
  Crosshair,
  Sparkles,
  Volume2,
  VolumeX,
  Film,
  Sliders,
  Maximize2,
  Minimize2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { P25DisplaySpec } from '../types';

interface DigitalTwinSimulatorProps {
  currentSpec: P25DisplaySpec;
  imageSrc: string | null;
  mediaType?: 'image' | 'video';
  videoDuration?: number;
  contrastScore?: number;
  wordCount?: number;
}

export const DigitalTwinSimulator: React.FC<DigitalTwinSimulatorProps> = ({
  currentSpec,
  imageSrc,
  mediaType = 'image',
  videoDuration = 6.0,
  contrastScore = 52,
  wordCount = 14,
}) => {
  const [lightingMode, setLightingMode] = useState<'sunlight' | 'overcast' | 'night'>('sunlight');
  const [showLedMatrix, setShowLedMatrix] = useState<boolean>(true);
  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);
  const [isGlanceTesting, setIsGlanceTesting] = useState<boolean>(false);
  const [glanceTimeRemaining, setGlanceTimeRemaining] = useState<number>(2.5);
  const [glancePassed, setGlancePassed] = useState<boolean | null>(null);

  // Viewing Distance & P2.5 Optics States
  const [viewingDistance, setViewingDistance] = useState<number>(8.6); // Default to P2.5 optimal visual blend point (8.6m)
  const [viewMode, setViewMode] = useState<'focus' | 'perspective'>('focus');
  const [nitsMode, setNitsMode] = useState<'3500' | '4500' | '5000'>('4500');

  // Video playback states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [loopCount, setLoopCount] = useState<number>(1);

  // Optical physics calculations for Yaham P2.5 LED (2.5mm pixel pitch):
  // Human eye 20/20 resolution limit is ~1 arcminute (1/60th deg).
  // Distance where 2.5mm subtends 1 arcminute:
  // D = 0.0025 / (2 * tan(0.5 / 60 * pi / 180)) ≈ 8.59 meters (~8.6m).
  const blendThresholdMeters = 8.6;
  const angularSizeArcmin = Math.max(0.15, (2.5 / (viewingDistance * 1000)) * (180 / Math.PI) * 60);

  // Blend ratio: 0 at <=2.0m, 1 at >=8.6m
  const blendRatio = Math.min(1, Math.max(0, (viewingDistance - 2.0) / (blendThresholdMeters - 2.0)));

  // Diode grid opacity: prominently resolved up close, smoothly dissolving into continuous raster beyond 8.6m
  const diodeGridOpacity = Math.max(0, 0.44 * (1 - Math.pow(blendRatio, 0.85)));

  // Readability Index: As distance increases past threshold, discrete diodes merge into continuous typography!
  const readabilityIndex = Math.min(99, Math.round(56 + blendRatio * 42));

  // Perspective scale when in perspective mode
  const perspectiveScale =
    viewMode === 'perspective'
      ? Math.max(0.48, Math.min(1.15, 1.06 - (viewingDistance - 2.5) * 0.019))
      : 1.0;

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlayingVideo) {
      videoRef.current.pause();
      setIsPlayingVideo(false);
    } else {
      videoRef.current.play();
      setIsPlayingVideo(true);
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
      const duration = 2500; // 2.5 seconds typical pedestrian/driver glance window

      timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, (duration - elapsed) / 1000);
        setGlanceTimeRemaining(Number(remaining.toFixed(1)));

        if (elapsed >= duration) {
          clearInterval(timer);
          setIsGlanceTesting(false);
          // Pass condition: words <= 6 and contrast >= 60
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
    <div id="digital-twin-simulator" className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm space-y-4">
      {/* Simulator Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">
              P2.5 Taxi Roof Digital Twin &amp; In-Situ Simulator
            </h2>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-amber-300 border border-slate-700">
              Yaham {currentSpec.resolutionWidthPx}×{currentSpec.resolutionHeightPx} Matrix
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-world 2.5mm diode pixel pitch, high-brightness SMD LEDs, and distance optical blending
          </p>
        </div>

        {/* View Condition Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Lighting Mode */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              id="light-sunlight-btn"
              type="button"
              onClick={() => setLightingMode('sunlight')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${
                lightingMode === 'sunlight'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Direct Sunlight (100,000 Lux Glare)"
            >
              <Sun className="w-3 h-3" />
              <span>Direct Sun</span>
            </button>
            <button
              id="light-overcast-btn"
              type="button"
              onClick={() => setLightingMode('overcast')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${
                lightingMode === 'overcast'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Overcast Daytime"
            >
              <Cloud className="w-3 h-3" />
              <span>Overcast</span>
            </button>
            <button
              id="light-night-btn"
              type="button"
              onClick={() => setLightingMode('night')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${
                lightingMode === 'night'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Night City Neon (Auto-Dimmed to 1200 Nits)"
            >
              <Moon className="w-3 h-3" />
              <span>Night Neon</span>
            </button>
          </div>

          {/* Matrix Overlay Toggle */}
          <button
            id="toggle-matrix-btn"
            type="button"
            onClick={() => setShowLedMatrix(!showLedMatrix)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showLedMatrix
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle 2.5mm LED physical diode matrix raster"
          >
            P2.5 Diode Grid: {showLedMatrix ? 'ON' : 'OFF'}
          </button>

          {/* Safe Zones Toggle */}
          <button
            id="toggle-safezones-btn"
            type="button"
            onClick={() => setShowSafeZones(!showSafeZones)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showSafeZones
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle 5% edge crop & safe zone margin"
          >
            Safe Zone
          </button>
        </div>
      </div>

      {/* NEW: INTERACTIVE VIEWING DISTANCE & LUMINANCE CONTROL BAR */}
      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Distance Header & Value Display */}
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" />
              Viewing Distance:
            </span>
            <div className="flex items-baseline gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-base font-black font-mono text-amber-300">
                {viewingDistance.toFixed(1)}m
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({Math.round(viewingDistance * 3.28084)} ft)
              </span>
            </div>

            {/* Step closer / Step back buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => stepDistance(-1.5)}
                disabled={viewingDistance <= 1.5}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-mono text-[11px] transition-colors"
                title="Move 1.5m closer"
              >
                - Closer
              </button>
              <button
                type="button"
                onClick={() => stepDistance(1.5)}
                disabled={viewingDistance >= 35}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-mono text-[11px] transition-colors"
                title="Step 1.5m further back"
              >
                + Back
              </button>
            </div>
          </div>

          {/* Diode Luminance / Nits Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              LED Output:
            </span>
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setNitsMode('3500')}
                className={`px-2 py-0.5 rounded transition-all ${
                  nitsMode === '3500' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                3500 Nits
              </button>
              <button
                type="button"
                onClick={() => setNitsMode('4500')}
                className={`px-2 py-0.5 rounded transition-all ${
                  nitsMode === '4500' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Yaham Datasheet Standard Luminance"
              >
                4500 Nits (Std)
              </button>
              <button
                type="button"
                onClick={() => setNitsMode('5000')}
                className={`px-2 py-0.5 rounded transition-all ${
                  nitsMode === '5000' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Maximum Sunlight Punch"
              >
                5000 Nits (Peak)
              </button>
            </div>

            {/* View Scale Mode Toggle */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode('focus')}
                className={`px-2 py-0.5 rounded transition-all ${
                  viewMode === 'focus' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Keep display full-sized to inspect pixel blending quality"
              >
                Screen Focus
              </button>
              <button
                type="button"
                onClick={() => setViewMode('perspective')}
                className={`px-2 py-0.5 rounded transition-all ${
                  viewMode === 'perspective' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Scale taxi roof display realistically with physical distance"
              >
                Car Perspective
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
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          {/* Preset Buttons for Quick Realistic Scenarios */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setViewingDistance(2.0)}
              className={`px-1.5 py-0.5 rounded hover:text-white transition-colors ${
                viewingDistance <= 3.0 ? 'text-amber-400 font-bold underline decoration-amber-400' : ''
              }`}
            >
              2.0m (Close Inspection)
            </button>
            <button
              type="button"
              onClick={() => setViewingDistance(5.0)}
              className={`px-1.5 py-0.5 rounded hover:text-white transition-colors ${
                Math.abs(viewingDistance - 5.0) < 1 ? 'text-amber-400 font-bold underline decoration-amber-400' : ''
              }`}
            >
              5.0m (Sidewalk Pedestrian)
            </button>
            <button
              type="button"
              onClick={() => setViewingDistance(8.6)}
              className={`px-1.5 py-0.5 rounded hover:text-white transition-colors flex items-center gap-1 ${
                Math.abs(viewingDistance - 8.6) < 1 ? 'text-emerald-400 font-bold underline decoration-emerald-400' : 'text-emerald-300/80'
              }`}
            >
              ★ 8.6m (P2.5 Eye Blend Limit)
            </button>
            <button
              type="button"
              onClick={() => setViewingDistance(18.0)}
              className={`px-1.5 py-0.5 rounded hover:text-white transition-colors ${
                Math.abs(viewingDistance - 18.0) < 2 ? 'text-amber-400 font-bold underline decoration-amber-400' : ''
              }`}
            >
              18m (Approaching Vehicle)
            </button>
            <button
              type="button"
              onClick={() => setViewingDistance(30.0)}
              className={`px-1.5 py-0.5 rounded hover:text-white transition-colors ${
                viewingDistance >= 26 ? 'text-amber-400 font-bold underline decoration-amber-400' : ''
              }`}
            >
              30m (Far Arterial Traffic)
            </button>
          </div>
        </div>

        {/* Dynamic P2.5 Optical Science Quality Badge */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Angular Subtense:</span>
            <span className="font-mono text-slate-200">{angularSizeArcmin.toFixed(2)} arcmin</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">P2.5 Diode State:</span>
            <span
              className={`font-semibold ${
                viewingDistance >= 8.6 ? 'text-emerald-400' : viewingDistance >= 5 ? 'text-sky-300' : 'text-amber-300'
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
            <span className="text-slate-400">Legibility Score:</span>
            <span className="font-mono font-bold text-amber-300">{readabilityIndex}%</span>
            <span className="text-[10px] text-slate-500">
              {viewingDistance >= 8.6 ? '(Far pixels look cleaner & sharper)' : '(Stepping visible on 128px matrix)'}
            </span>
          </div>
        </div>
      </div>

      {/* Simulator Stage Environment */}
      <div
        id="simulator-canvas-stage"
        className={`relative w-full rounded-xl overflow-hidden border border-slate-800 transition-colors duration-500 p-6 flex flex-col items-center justify-center min-h-[340px] ${
          lightingMode === 'sunlight'
            ? 'bg-gradient-to-b from-sky-400 via-sky-200 to-slate-200'
            : lightingMode === 'overcast'
            ? 'bg-gradient-to-b from-slate-400 via-slate-300 to-slate-200'
            : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
        }`}
      >
        {/* Environmental Sky & Sunlight Flares */}
        {lightingMode === 'sunlight' && (
          <div className="absolute top-2 right-8 pointer-events-none">
            <div className="w-24 h-24 rounded-full bg-yellow-100/60 blur-xl animate-pulse" />
            <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-amber-200/80 blur-md" />
          </div>
        )}

        {/* City Skyline Background Silhouette */}
        <div className="absolute bottom-0 inset-x-0 h-28 opacity-15 pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Distance Indicator Overlay on Stage */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-white flex items-center gap-1.5 pointer-events-none z-10">
          <Eye className="w-3 h-3 text-amber-400" />
          <span>Distance: {viewingDistance.toFixed(1)}m</span>
          <span className="text-slate-400">|</span>
          <span className={viewingDistance >= 8.6 ? 'text-emerald-400' : 'text-amber-300'}>
            {viewingDistance >= 8.6 ? 'Optically Blended' : 'Discrete Pitch'}
          </span>
        </div>

        {/* Glance Test & Perspective Transform Wrapper */}
        <div
          className="w-full max-w-3xl transition-transform duration-300 ease-out flex flex-col items-center"
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
            <div className="relative w-full rounded-lg shadow-2xl overflow-hidden bg-slate-950 border-4 border-slate-800 ring-2 ring-black/80">
              {/* Aerodynamic Yaham top extrusion hood */}
              <div className="h-2.5 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-b border-slate-900 flex items-center justify-between px-3">
                <span className="text-[8px] font-mono text-slate-400 tracking-wider">
                  YAHAM ROOFLED • P2.5 ({currentSpec.resolutionWidthPx}×{currentSpec.resolutionHeightPx})
                </span>
                <span className="text-[8px] font-mono text-amber-400 font-bold">
                  {lightingMode === 'night' ? '1200 NITS (NIGHT)' : `${nitsMode} NITS (HIGH BRIGHTNESS)`}
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
                    {/* The Rendered Ad Media (Video or Image) with Bright SMD Diode Tuning */}
                    {mediaType === 'video' ? (
                      <video
                        ref={videoRef}
                        src={imageSrc}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={() => setLoopCount((c) => c + 1)}
                        className="w-full h-full object-fill transition-all duration-300"
                        style={{
                          // Optical resolution: at close distance (< 7m), discrete pixels are evident; at far distance (>= 8.6m), pixels smoothly blend into clean, readable text
                          imageRendering: viewingDistance < 7.0 ? 'pixelated' : 'auto',
                          filter: `
                            brightness(${
                              nitsMode === '5000'
                                ? lightingMode === 'sunlight' ? 1.35 : 1.28
                                : nitsMode === '4500'
                                ? lightingMode === 'sunlight' ? 1.25 : 1.18
                                : 1.08
                            })
                            contrast(${lightingMode === 'sunlight' ? 1.16 : 1.12})
                            saturate(${lightingMode === 'night' ? 1.3 : 1.22})
                            drop-shadow(0 0 10px rgba(255, 220, 140, ${nitsMode === '5000' ? 0.35 : 0.22}))
                          `,
                        }}
                      />
                    ) : (
                      <img
                        src={imageSrc}
                        alt="Active Ad Creative"
                        className="w-full h-full object-fill transition-all duration-300"
                        style={{
                          // Optical resolution: at close distance (< 7m), discrete pixels are evident; at far distance (>= 8.6m), pixels smoothly blend into clean, readable text
                          imageRendering: viewingDistance < 7.0 ? 'pixelated' : 'auto',
                          filter: `
                            brightness(${
                              nitsMode === '5000'
                                ? lightingMode === 'sunlight' ? 1.35 : 1.28
                                : nitsMode === '4500'
                                ? lightingMode === 'sunlight' ? 1.25 : 1.18
                                : 1.08
                            })
                            contrast(${lightingMode === 'sunlight' ? 1.16 : 1.12})
                            saturate(${lightingMode === 'night' ? 1.3 : 1.22})
                            drop-shadow(0 0 10px rgba(255, 220, 140, ${nitsMode === '5000' ? 0.35 : 0.22}))
                          `,
                        }}
                      />
                    )}

                    {/* PHYSICAL P2.5 SMD LED DIODE MESH (BRIGHT, NON-DULL EMISSIVE OVERLAY) */}
                    {showLedMatrix && diodeGridOpacity > 0.01 && (
                      <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                        style={{
                          opacity: diodeGridOpacity,
                          // Sharp sub-millimeter black louvre borders around bright diode apertures
                          backgroundImage: `
                            radial-gradient(circle at 1.5px 1.5px, rgba(255, 255, 255, 0.22) 0.6px, transparent 1.2px),
                            linear-gradient(to right, rgba(0, 0, 0, 0.75) 0.5px, transparent 0.5px),
                            linear-gradient(to bottom, rgba(0, 0, 0, 0.75) 0.5px, transparent 0.5px)
                          `,
                          backgroundSize: '3px 3px, 3px 3px, 3px 3px',
                          mixBlendMode: 'overlay',
                        }}
                      />
                    )}

                    {/* HIGH-LUMINANCE SUBPIXEL GLOW LAYER (Replicating 4500 Nits Self-Emissive Point Emitters) */}
                    <div
                      className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                      style={{
                        opacity: nitsMode === '5000' ? 0.35 : nitsMode === '4500' ? 0.24 : 0.14,
                        backgroundImage: `radial-gradient(circle at 1.5px 1.5px, rgba(255, 255, 220, 0.45) 0.4px, transparent 1.5px)`,
                        backgroundSize: '3px 3px',
                        mixBlendMode: 'screen',
                      }}
                    />

                    {/* Direct Midday Sunlight Glare & Specular Reflection */}
                    {lightingMode === 'sunlight' && (
                      <div
                        className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/30 to-yellow-100/35 mix-blend-screen"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.08) 40%, transparent 60%)',
                        }}
                      />
                    )}

                    {/* Night Neon Ambient Glow */}
                    {lightingMode === 'night' && (
                      <div className="absolute inset-0 pointer-events-none ring-1 ring-cyan-500/20 shadow-[inset_0_0_20px_rgba(6,182,212,0.15)]" />
                    )}

                    {/* Safe Zone Overlay */}
                    {showSafeZones && (
                      <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-sky-400/80 m-2 flex items-center justify-between px-2 text-[9px] font-mono text-sky-300">
                        <span className="bg-black/80 px-1 py-0.5 rounded">Safe Margin 5%</span>
                        <Crosshair className="w-3.5 h-3.5 text-sky-400 opacity-70" />
                        <span className="bg-black/80 px-1 py-0.5 rounded">128px Matrix Safe</span>
                      </div>
                    )}
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

            {/* Video Playback Interactive Scrubber Bar (when media is DOOH video) */}
            {mediaType === 'video' && imageSrc && (
              <div className="w-full mt-2 p-2 bg-slate-950/90 rounded-lg border border-slate-800 flex items-center justify-between gap-3 text-xs shadow-inner">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                    title={isPlayingVideo ? 'Pause Video Loop' : 'Play Video Loop'}
                  >
                    {isPlayingVideo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title={isMuted ? 'Muted (DOOH Standard)' : 'Audio Enabled'}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <span className="text-[11px] font-mono text-slate-300">
                    {videoCurrentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s
                  </span>
                </div>

                {/* Scrubber track */}
                <div className="flex-1 mx-2 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (videoCurrentTime / (videoDuration || 1)) * 100)}%`,
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                    Loop #{loopCount}
                  </span>
                  <span className="text-slate-500 hidden sm:inline">1920Hz Refresh</span>
                </div>
              </div>
            )}

            {/* Slidable Roof Mounting Tracks & Stanchions (per Yaham datasheet) */}
            <div className="w-4/5 flex justify-between px-8 -mt-0.5">
              <div className="w-6 h-5 bg-gradient-to-b from-slate-800 to-slate-900 border-x border-slate-700 shadow-md" />
              <div className="w-6 h-5 bg-gradient-to-b from-slate-800 to-slate-900 border-x border-slate-700 shadow-md" />
            </div>

            {/* Vehicle Roof Bar & Car Profile */}
            <div className="w-11/12 h-3 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-full shadow-lg border-b border-slate-900" />
            {/* Windshield & Roof arc */}
            <div className="w-full h-8 bg-gradient-to-b from-slate-800/90 to-slate-900/95 rounded-t-3xl border-t border-slate-600/50 -mt-1 shadow-inner flex items-center justify-center">
              <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                TAXI ROOF MOUNT • 35 KM/H URBAN ARTERIAL
              </span>
            </div>
          </div>
        </div>

        {/* Glance Test Floating HUD */}
        {isGlanceTesting && (
          <div className="absolute top-4 left-4 bg-slate-950/95 border border-amber-500/80 px-4 py-2 rounded-lg shadow-xl text-left text-xs z-20 animate-bounce">
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" />
              <span>3-Second Moving Vehicle Glance Test</span>
            </div>
            <div className="text-slate-300 mt-1 font-mono">
              Glance window remaining:{' '}
              <strong className="text-white text-sm">{glanceTimeRemaining}s</strong>
            </div>
          </div>
        )}

        {/* Glance Test Outcome Badge */}
        {!isGlanceTesting && glancePassed !== null && (
          <div
            className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-lg ${
              glancePassed
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700'
                : 'bg-rose-950/90 text-rose-300 border-rose-700'
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
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-slate-300 font-medium">P2.5 Optical Science:</span>
          <span>Pitch 2.5mm</span>
          <span>•</span>
          <span>128px Vertical Grid</span>
          <span>•</span>
          <span className="text-amber-400 font-medium">Blend Point: 8.6m</span>
        </div>

        <button
          id="run-glance-test-btn"
          type="button"
          onClick={triggerGlanceTest}
          disabled={isGlanceTesting || !imageSrc}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold border border-slate-700 hover:border-amber-500/40 transition-all disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-amber-300" />
          <span>Simulate 35 km/h Taxi Glance (2.5s)</span>
        </button>
      </div>
    </div>
  );
};
