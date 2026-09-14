import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DisplaySpecSelector } from './components/DisplaySpecSelector';
import { CreativeUploader } from './components/CreativeUploader';
import { DigitalTwinSimulator } from './components/DigitalTwinSimulator';
import { AnalysisResults } from './components/AnalysisResults';
import { SpecsModal } from './components/SpecsModal';
import { P25_DISPLAY_SPECS } from './data/specs';
import { DEMO_CREATIVES } from './data/presets';
import { P25DisplaySpec, CreativeAnalysisResult, VideoKeyframe } from './types';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { convertSvgToPng } from './utils/mediaUtils';

export default function App() {
  const [selectedSpec, setSelectedSpec] = useState<P25DisplaySpec>(
    P25_DISPLAY_SPECS['YHT-V3.12-P2.5']
  );
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

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<CreativeAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState<boolean>(false);

  // Initial audit on launch with the default creative (which mirrors the user's example)
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

    // Automatically trigger audit on new media selection
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
    if (currentMedia) {
      runAnalysis({
        mediaToAnalyze: currentMedia,
        mediaName: currentMediaName,
        spec: newSpec,
        type: mediaType,
        duration: videoDuration,
        frames: keyframes,
        strobe: strobeHazard,
      });
    }
  };

  const handleTriggerManualAnalysis = () => {
    if (currentMedia) {
      runAnalysis({
        mediaToAnalyze: currentMedia,
        mediaName: currentMediaName,
        spec: selectedSpec,
        type: mediaType,
        duration: videoDuration,
        frames: keyframes,
        strobe: strobeHazard,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Navigation & Header */}
      <Header
        selectedSpec={selectedSpec}
        onOpenSpecsModal={() => setIsSpecsModalOpen(true)}
        isAnalyzing={isAnalyzing}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top: Yaham P2.5 Hardware Profile Selector */}
        <DisplaySpecSelector
          currentSpec={selectedSpec}
          onSelectSpec={handleSpecSelected}
        />

        {/* Middle: Grid with Upload/Input & Digital Twin Physical Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Creative Uploader & Sample Selectors (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
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
            <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 p-4 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-200 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>How the AI Advisor Audits Image &amp; Video Creatives:</span>
              </div>
              <p className="leading-relaxed">
                When an image or DOOH video is uploaded to DAMS, the AI measures ambient sunlight contrast (4500 nits limit), extracts copy word count against the 6-word transit rule, audits spot duration (6-10s), certifies strobe safety (&lt;3Hz photosensitive guideline), and benchmarks against HYGH network data.
              </p>
            </div>
          </div>

          {/* Right Column: Physical Digital Twin Simulator (7 cols) */}
          <div className="lg:col-span-7">
            <DigitalTwinSimulator
              currentSpec={selectedSpec}
              imageSrc={currentMedia}
              mediaType={mediaType}
              videoDuration={videoDuration}
              contrastScore={analysisResult?.metrics?.contrastScore}
              wordCount={analysisResult?.metrics?.textCount}
            />
          </div>
        </div>

        {/* Error Notice if any */}
        {analysisError && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Audit notice: {analysisError}. Displaying cached network standard heuristics.</span>
          </div>
        )}

        {/* Bottom: Analysis Results Dashboard */}
        {isAnalyzing ? (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mx-auto mb-4" />
            <h3 className="text-base font-bold text-white">
              AI Analyzing {mediaType === 'video' ? 'DOOH Video Creative' : 'Ad Creative'} for P2.5 Taxi Screen...
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Scanning 128-pixel vertical raster, calculating ambient solar contrast ratio, checking strobe frequencies, and evaluating 35 km/h glance comprehension.
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
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            P2.5 Yaham Taxi RoofLED Media Suite • DAMS Pre-Flight AI Creative Advisor
          </span>
          <span className="font-mono text-[11px] text-slate-600">
            Powered by Google Gemini &amp; HYGH DOOH Benchmarks
          </span>
        </div>
      </footer>

      {/* Datasheet Specifications Modal */}
      <SpecsModal
        isOpen={isSpecsModalOpen}
        onClose={() => setIsSpecsModalOpen(false)}
        currentSpec={selectedSpec}
      />
    </div>
  );
}
