import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DisplaySpecSelector } from './components/DisplaySpecSelector';
import { CreativeUploader } from './components/CreativeUploader';
import { DigitalTwinSimulator } from './components/DigitalTwinSimulator';
import { PlaylistLoopManager } from './components/PlaylistLoopManager';
import { AnalysisResults } from './components/AnalysisResults';
import { P25_DISPLAY_SPECS } from './data/specs';
import { DEMO_CREATIVES } from './data/presets';
import { P25DisplaySpec, CreativeAnalysisResult, VideoKeyframe, DisplayMode, PlaylistItem } from './types';
import { Sparkles, AlertCircle, Monitor, Layers, Repeat } from 'lucide-react';
import { convertSvgToPng, generatePresetVideoBlob } from './utils/mediaUtils';

const INITIAL_PLAYLIST: PlaylistItem[] = [
  {
    id: 'slot-1',
    name: DEMO_CREATIVES[0].name,
    brand: DEMO_CREATIVES[0].brand,
    mediaType: 'image',
    mediaUrl: DEMO_CREATIVES[0].dataUrl,
    durationSec: 10.0,
    originalDurationSec: 10.0,
    thumbnailUrl: DEMO_CREATIVES[0].dataUrl,
    badge: DEMO_CREATIVES[0].badge,
  },
  {
    id: 'slot-2',
    name: DEMO_CREATIVES[1].name,
    brand: DEMO_CREATIVES[1].brand,
    mediaType: 'video',
    mediaUrl: DEMO_CREATIVES[1].dataUrl,
    durationSec: DEMO_CREATIVES[1].durationSec || 6.0,
    originalDurationSec: DEMO_CREATIVES[1].durationSec || 6.0,
    thumbnailUrl: DEMO_CREATIVES[1].dataUrl,
    badge: DEMO_CREATIVES[1].badge,
  },
  {
    id: 'slot-3',
    name: DEMO_CREATIVES[2].name,
    brand: DEMO_CREATIVES[2].brand,
    mediaType: 'video',
    mediaUrl: DEMO_CREATIVES[2].dataUrl,
    durationSec: DEMO_CREATIVES[2].durationSec || 12.0,
    originalDurationSec: 12.0,
    strobeHazard: DEMO_CREATIVES[2].strobeHazard,
    thumbnailUrl: DEMO_CREATIVES[2].dataUrl,
    badge: '12s Video (Skips @ 10s)',
  },
  {
    id: 'slot-4',
    name: DEMO_CREATIVES[3].name,
    brand: DEMO_CREATIVES[3].brand,
    mediaType: 'image',
    mediaUrl: DEMO_CREATIVES[3].dataUrl,
    durationSec: 10.0,
    originalDurationSec: 10.0,
    thumbnailUrl: DEMO_CREATIVES[3].dataUrl,
    badge: DEMO_CREATIVES[3].badge,
  },
  {
    id: 'slot-5',
    name: DEMO_CREATIVES[4].name,
    brand: DEMO_CREATIVES[4].brand,
    mediaType: 'image',
    mediaUrl: DEMO_CREATIVES[4].dataUrl,
    durationSec: 10.0,
    originalDurationSec: 10.0,
    thumbnailUrl: DEMO_CREATIVES[4].dataUrl,
    badge: DEMO_CREATIVES[4].badge,
  },
  {
    id: 'slot-6',
    name: DEMO_CREATIVES[5].name,
    brand: DEMO_CREATIVES[5].brand,
    mediaType: 'image',
    mediaUrl: DEMO_CREATIVES[5].dataUrl,
    durationSec: 10.0,
    originalDurationSec: 10.0,
    thumbnailUrl: DEMO_CREATIVES[5].dataUrl,
    badge: DEMO_CREATIVES[5].badge,
  },
];

export default function App() {
  const [selectedSpec, setSelectedSpec] = useState<P25DisplaySpec>(
    P25_DISPLAY_SPECS['YHT-V3.22-P2.5']
  );
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hygh_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hygh_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hygh_theme', 'light');
    }
  }, [isDarkMode]);

  // Display mode: 'single' (individual ad analysis) or 'loop6' (6 ads rotation loop)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('single');

  // Single ad state
  const [currentMedia, setCurrentMedia] = useState<string | null>(
    DEMO_CREATIVES[0].dataUrl
  );
  const [currentMediaName, setCurrentMediaName] = useState<string>(
    DEMO_CREATIVES[0].name
  );
  const [mediaType, setMediaType] = useState<'image' | 'video'>(
    (DEMO_CREATIVES[0].mediaType as 'image' | 'video') || 'image'
  );
  const [videoDuration, setVideoDuration] = useState<number | undefined>(
    DEMO_CREATIVES[0].durationSec
  );
  const [keyframes, setKeyframes] = useState<VideoKeyframe[] | undefined>(undefined);
  const [strobeHazard, setStrobeHazard] = useState<boolean | undefined>(undefined);

  // 6 Ads Loop playlist state
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(INITIAL_PLAYLIST);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [slotElapsedSec, setSlotElapsedSec] = useState<number>(0);
  const [loopCount, setLoopCount] = useState<number>(1);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<CreativeAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Background synthesis of video blobs for the default playlist presets
  useEffect(() => {
    let active = true;
    async function initPresetVideos() {
      try {
        const cyberboltBlob = await generatePresetVideoBlob('video-cyberbolt', 384, 128, 3);
        if (!active) return;
        const cyberboltUrl = URL.createObjectURL(cyberboltBlob);

        const strobeBlob = await generatePresetVideoBlob('video-strobe-warning', 384, 128, 3);
        if (!active) return;
        const strobeUrl = URL.createObjectURL(strobeBlob);

        setPlaylist((prev) =>
          prev.map((item) => {
            if (item.id === 'slot-2') return { ...item, mediaUrl: cyberboltUrl };
            if (item.id === 'slot-3') return { ...item, mediaUrl: strobeUrl };
            return item;
          })
        );
      } catch (err) {
        console.warn('Background preset video synthesis note:', err);
      }
    }
    initPresetVideos();
    return () => {
      active = false;
    };
  }, []);

  // 10-Second Auto-Advancing Precision Loop Timer for 6 Ads Mode
  // Requirement: Each image or video stays for exactly 10s. If a video is >10s, skip additional time and jump to next.
  // After every 6 ads (or playlist length), loop restarts.
  useEffect(() => {
    if (displayMode !== 'loop6' || playlist.length === 0) return;

    const interval = setInterval(() => {
      setSlotElapsedSec((prev) => {
        const next = Number((prev + 0.1).toFixed(1));
        if (next >= 10.0) {
          // 10-second mark reached: jump immediately to next slot (skipping extra time of longer videos)
          setActiveSlotIndex((currIdx) => {
            const nextIdx = (currIdx + 1) % playlist.length;
            if (nextIdx === 0) {
              setLoopCount((c) => c + 1);
            }
            return nextIdx;
          });
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [displayMode, playlist.length]);

  const handleSkipNext = () => {
    setSlotElapsedSec(0);
    setActiveSlotIndex((currIdx) => {
      const nextIdx = (currIdx + 1) % playlist.length;
      if (nextIdx === 0) {
        setLoopCount((c) => c + 1);
      }
      return nextIdx;
    });
  };

  const handleSkipPrev = () => {
    setSlotElapsedSec(0);
    setActiveSlotIndex((currIdx) => (currIdx - 1 + playlist.length) % playlist.length);
  };

  const handleSelectSlot = (index: number) => {
    setActiveSlotIndex(index);
    setSlotElapsedSec(0);
  };

  const handleUpdateSlot = (index: number, updatedItem: PlaylistItem) => {
    setPlaylist((prev) => {
      const copy = [...prev];
      copy[index] = updatedItem;
      return copy;
    });
  };

  const handleAddSlot = (item: PlaylistItem) => {
    if (playlist.length >= 6) return;
    setPlaylist((prev) => [...prev, item]);
  };

  const handleRemoveSlot = (index: number) => {
    if (playlist.length <= 1) return;
    setPlaylist((prev) => prev.filter((_, i) => i !== index));
    if (activeSlotIndex >= playlist.length - 1) {
      setActiveSlotIndex(0);
      setSlotElapsedSec(0);
    }
  };

  const handleResetPlaylist = () => {
    setPlaylist(INITIAL_PLAYLIST);
    setActiveSlotIndex(0);
    setSlotElapsedSec(0);
    setLoopCount(1);
  };

  // Initial audit on launch with default creative
  useEffect(() => {
    runAnalysis({
      mediaToAnalyze: DEMO_CREATIVES[0].dataUrl,
      mediaName: DEMO_CREATIVES[0].name,
      spec: selectedSpec,
      type: 'image',
    });
  }, []);

  const runAnalysis = async (params: {
    mediaToAnalyze: string;
    mediaName: string;
    spec: P25DisplaySpec;
    type: 'image' | 'video';
    duration?: number;
    frames?: VideoKeyframe[];
    strobe?: boolean;
  }) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      let visualPayload = params.mediaToAnalyze;

      // If media is vector SVG, convert to high-fidelity PNG Base64 for Gemini Vision
      if (
        params.type === 'image' &&
        visualPayload &&
        (visualPayload.startsWith('data:image/svg') ||
          visualPayload.includes('<svg') ||
          visualPayload.includes('%3Csvg'))
      ) {
        try {
          visualPayload = await convertSvgToPng(
            visualPayload,
            params.spec.resolutionWidthPx,
            params.spec.resolutionHeightPx
          );
        } catch (convErr) {
          console.warn('SVG pre-render fallback:', convErr);
        }
      }

      const payload: any = {
        imageBase64:
          params.type === 'video' && params.frames && params.frames.length > 0
            ? params.frames[0].dataUrl || params.frames[0].base64 || visualPayload
            : visualPayload,
        modelSpec: params.spec.id,
        brandName: params.mediaName,
        campaignGoal: 'Taxi DOOH',
        mediaType: params.type,
        videoDuration: params.duration,
        keyframes: params.frames,
        strobeHazard: params.strobe,
      };

      const response = await fetch('/api/analyze-creative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data: CreativeAnalysisResult = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error('Audit execution error:', err);
      setAnalysisError(err.message || 'Failed to complete creative audit');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMediaSelected = (params: {
    mediaUrl: string;
    name: string;
    mediaType: 'image' | 'video';
    durationSec?: number;
    keyframes?: VideoKeyframe[];
    strobeHazard?: boolean;
  }) => {
    setCurrentMedia(params.mediaUrl);
    setCurrentMediaName(params.name);
    setMediaType(params.mediaType);
    setVideoDuration(params.durationSec);
    setKeyframes(params.keyframes);
    setStrobeHazard(params.strobeHazard);

    runAnalysis({
      mediaToAnalyze: params.mediaUrl,
      mediaName: params.name,
      spec: selectedSpec,
      type: params.mediaType,
      duration: params.durationSec,
      frames: params.keyframes,
      strobe: params.strobeHazard,
    });
  };

  const handleSpecSelected = (newSpec: P25DisplaySpec) => {
    setSelectedSpec(newSpec);
    const mediaForAnalysis = displayMode === 'loop6' ? playlist[activeSlotIndex]?.mediaUrl : currentMedia;
    const nameForAnalysis = displayMode === 'loop6' ? playlist[activeSlotIndex]?.name : currentMediaName;
    const typeForAnalysis = displayMode === 'loop6' ? playlist[activeSlotIndex]?.mediaType : mediaType;

    if (mediaForAnalysis) {
      runAnalysis({
        mediaToAnalyze: mediaForAnalysis,
        mediaName: nameForAnalysis || 'Ad Creative',
        spec: newSpec,
        type: typeForAnalysis || 'image',
        duration: videoDuration,
        frames: keyframes,
        strobe: strobeHazard,
      });
    }
  };

  const handleTriggerManualAnalysis = () => {
    const mediaForAnalysis = displayMode === 'loop6' ? playlist[activeSlotIndex]?.mediaUrl : currentMedia;
    const nameForAnalysis = displayMode === 'loop6' ? playlist[activeSlotIndex]?.name : currentMediaName;
    const typeForAnalysis = displayMode === 'loop6' ? playlist[activeSlotIndex]?.mediaType : mediaType;

    if (mediaForAnalysis) {
      runAnalysis({
        mediaToAnalyze: mediaForAnalysis,
        mediaName: nameForAnalysis || 'Ad Creative',
        spec: selectedSpec,
        type: typeForAnalysis || 'image',
        duration: videoDuration,
        frames: keyframes,
        strobe: strobeHazard,
      });
    }
  };

  // Determine what is currently active on the Rooftop Mount
  const activePlaylistItem = playlist[activeSlotIndex] || playlist[0];
  const activeSimulatorMedia = displayMode === 'loop6' ? activePlaylistItem?.mediaUrl : currentMedia;
  const activeSimulatorMediaType = displayMode === 'loop6' ? activePlaylistItem?.mediaType : mediaType;
  const activeSimulatorDuration = displayMode === 'loop6' ? activePlaylistItem?.durationSec : videoDuration;

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-200">
      {/* Navigation & Header */}
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top: HYGH Display Profile */}
        <DisplaySpecSelector
          currentSpec={selectedSpec}
          onSelectSpec={handleSpecSelected}
        />

        {/* Display Mode Toggle: Single Ad Display vs 6 Ads Display */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {displayMode === 'single' ? <Monitor className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Display Broadcast Mode
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {displayMode === 'single'
                  ? 'Single ad creative inspection & AI compliance audit'
                  : 'Up to 6 ads playlist rotation • 10.0s spot loop with auto-advance'}
              </div>
            </div>
          </div>

          {/* Toggle Button */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-center">
            <button
              id="toggle-single-ad"
              type="button"
              onClick={() => setDisplayMode('single')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                displayMode === 'single'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs ring-1 ring-slate-200/50 dark:ring-slate-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Single Ad Display</span>
            </button>

            <button
              id="toggle-6-ads"
              type="button"
              onClick={() => {
                setDisplayMode('loop6');
                setSlotElapsedSec(0);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                displayMode === 'loop6'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>6 Ads Display (10s Loop)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                displayMode === 'loop6' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                6 Spots
              </span>
            </button>
          </div>
        </div>

        {/* Middle: Grid with Controls & Digital Twin Physical Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 cols in Single mode, 5 cols in 6 Ads mode) */}
          <div className="lg:col-span-5 space-y-6">
            {displayMode === 'single' ? (
              <>
                <CreativeUploader
                  currentSpec={selectedSpec}
                  currentMedia={currentMedia}
                  currentMediaName={currentMediaName}
                  mediaType={mediaType}
                  videoDuration={videoDuration}
                  keyframes={keyframes}
                  strobeHazard={strobeHazard}
                  isAnalyzing={isAnalyzing}
                  onMediaSelected={handleMediaSelected}
                  onTriggerAnalysis={handleTriggerManualAnalysis}
                />

                {/* Quick Context Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100/80 dark:border-slate-800 p-5 text-xs text-slate-500 dark:text-slate-400 shadow-xs transition-colors">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold mb-1.5">
                    <div className="w-5 h-5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <span>Automated DAMS Creative Audits</span>
                  </div>
                  <p className="leading-relaxed text-slate-500 dark:text-slate-400">
                    Measures ambient sunlight contrast against the 4500-nit diode ceiling, enforces the 6-word moving vehicle rule, and guarantees &lt;3Hz photosensitive safety before broadcast.
                  </p>
                </div>
              </>
            ) : (
              <PlaylistLoopManager
                currentSpec={selectedSpec}
                playlist={playlist}
                activeSlotIndex={activeSlotIndex}
                slotElapsedSec={slotElapsedSec}
                loopCount={loopCount}
                onSelectSlot={handleSelectSlot}
                onUpdateSlot={handleUpdateSlot}
                onAddSlot={handleAddSlot}
                onRemoveSlot={handleRemoveSlot}
                onResetPlaylist={handleResetPlaylist}
                onSkipNext={handleSkipNext}
                onSkipPrev={handleSkipPrev}
                onTriggerAudit={(item) => {
                  runAnalysis({
                    mediaToAnalyze: item.mediaUrl,
                    mediaName: item.name,
                    spec: selectedSpec,
                    type: item.mediaType,
                    duration: item.originalDurationSec,
                    strobe: item.strobeHazard,
                  });
                }}
              />
            )}
          </div>

          {/* Right Column: Physical Digital Twin Simulator (7 cols) */}
          <div className="lg:col-span-7">
            <DigitalTwinSimulator
              currentSpec={selectedSpec}
              imageSrc={activeSimulatorMedia}
              mediaType={activeSimulatorMediaType}
              videoDuration={activeSimulatorDuration}
              contrastScore={analysisResult?.metrics?.contrastScore}
              wordCount={analysisResult?.metrics?.textCount}
              isPlaylistMode={displayMode === 'loop6'}
              activeSlotIndex={activeSlotIndex}
              totalSlots={playlist.length}
              slotElapsedSec={slotElapsedSec}
              onSkipNext={handleSkipNext}
              onSkipPrev={handleSkipPrev}
            />
          </div>
        </div>

        {/* Error Notice if any */}
        {analysisError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Notice: {analysisError}. Reverting to standard baseline DOOH heuristics.</span>
          </div>
        )}

        {/* Bottom: Analysis Results Dashboard */}
        {isAnalyzing ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-12 text-center shadow-xs transition-colors">
            <div className="w-10 h-10 rounded-full border-3 border-blue-100 dark:border-blue-900 border-t-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              AI Auditing {activeSimulatorMediaType === 'video' ? 'DOOH Video Creative' : 'Ad Creative'} for HYGH Display...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Simulating 128px vertical diode rasterization, calculating direct sunlight contrast ratio, and verifying driver glance safety.
            </p>
          </div>
        ) : analysisResult ? (
          <AnalysisResults
            result={analysisResult}
            currentSpec={selectedSpec}
          />
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-center text-xs text-slate-400 dark:text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-500 dark:text-slate-400">
            HYGH DOOH Suite • Taxi RoofLED Creative Advisor
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Powered by Google Gemini Vision &amp; HYGH DOOH Network Guidelines
          </span>
        </div>
      </footer>
    </div>
  );
}
