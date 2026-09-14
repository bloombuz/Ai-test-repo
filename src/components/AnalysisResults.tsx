import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Sun,
  FileText,
  Sliders,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Zap,
  ShieldAlert,
  Info,
  Layers,
  Award,
  Film,
  Clock,
  Activity,
  Video as VideoIcon,
} from 'lucide-react';
import { CreativeAnalysisResult, P25DisplaySpec } from '../types';

interface AnalysisResultsProps {
  result: CreativeAnalysisResult;
  currentSpec: P25DisplaySpec;
  onApplyOptimizedCreative?: (optimizedText: string) => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  currentSpec,
  onApplyOptimizedCreative,
}) => {
  const [copiedReport, setCopiedReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'video' | 'optimizer' | 'checklist'>('overview');

  const {
    overallScore,
    status,
    summaryHeadline,
    keyFindingExample,
    detectedText,
    mediaType = 'image',
    videoAnalysis,
    metrics,
    flaggedIssues,
    actionableRecommendations,
    optimizedCopySuggestion,
    damsChecklist,
  } = result;

  const handleCopyReport = () => {
    const reportText = `
--- HYGH DAMS AI CREATIVE ADVISOR REPORT ---
Hardware: Yaham P2.5 LED (${currentSpec.name})
Media Format: ${mediaType === 'video' ? 'DOOH Video Asset' : 'Static Display Creative'}
Resolution: ${currentSpec.resolutionWidthPx}x${currentSpec.resolutionHeightPx} px (128px Vertical Matrix)
Max Luminance: ≤4500 Nits

Overall DOOH Score: ${overallScore}/100 (${status})
Executive Summary:
"${keyFindingExample}"

${
  videoAnalysis
    ? `Video Spot Duration: ${videoAnalysis.durationSec}s (${videoAnalysis.durationCompliance})
Strobe Hazard: ${videoAnalysis.strobeHazard ? 'CRITICAL RISK (>3Hz)' : 'PASS (Safe)'}
Motion Pacing Score: ${videoAnalysis.motionPacingScore}/100 (${videoAnalysis.motionPacingRating})
`
    : ''
}
Detected Word Count: ${metrics.textCount} words (Recommended: <6 words)
Contrast Rating: ${metrics.contrastRating} (${metrics.contrastScore}/100)
Daylight Sun Resilience: ${metrics.daylightVisibilityScore}/100
P2.5 Matrix Legibility: ${metrics.pixelPitchLegibilityScore}/100

Actionable Recommendations:
${actionableRecommendations.map((r, i) => `${i + 1}. [Priority ${r.priority}] ${r.action}: ${r.sampleFix}`).join('\n')}

Suggested Optimized Copy:
"${optimizedCopySuggestion.recommendedCopy}" (${optimizedCopySuggestion.reductionPercentage}% reduction)
--------------------------------------------
    `.trim();

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'APPROVED':
        return {
          bg: 'bg-emerald-950/60',
          border: 'border-emerald-700/80',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500 text-slate-950',
        };
      case 'NEEDS_REVISION':
        return {
          bg: 'bg-amber-950/60',
          border: 'border-amber-700/80',
          text: 'text-amber-400',
          badge: 'bg-amber-500 text-slate-950',
        };
      default:
        return {
          bg: 'bg-rose-950/60',
          border: 'border-rose-700/80',
          text: 'text-rose-400',
          badge: 'bg-rose-500 text-white',
        };
    }
  };

  const statusStyle = getStatusColor(status);

  return (
    <div id="creative-advisor-results" className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm">
      {/* Top Header & Executive Score Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-start gap-4">
          {/* Circular Score Gauge */}
          <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-slate-950 border-2 border-slate-700 shrink-0 shadow-inner">
            <div className="text-center">
              <span className={`text-xl font-black font-mono leading-none ${statusStyle.text}`}>
                {overallScore}
              </span>
              <span className="block text-[9px] text-slate-400 uppercase font-semibold">
                Score
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">
                DAMS Pre-Flight Audit Report
              </h2>
              <span className={`px-2.5 py-0.5 rounded text-xs font-black tracking-wide ${statusStyle.badge}`}>
                {status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-medium max-w-xl">
              {summaryHeadline}
            </p>
          </div>
        </div>

        {/* Copy Report Action */}
        <div className="flex items-center gap-2">
          <button
            id="copy-audit-report-btn"
            type="button"
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors shadow-sm"
          >
            {copiedReport ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Audit Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Export Audit to Agency</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PROMINENT EXECUTIVE CALLOUT (Directly addressing user prompt example) */}
      <div
        id="key-finding-banner"
        className="my-5 p-4 rounded-xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/40 border border-amber-500/60 shadow-md"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Primary OOH Advisory Finding
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                HYGH Network Data
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-1 leading-relaxed">
              "{keyFindingExample}"
            </p>
          </div>
        </div>
      </div>

      {/* Critical Video Strobe Alert Banner (if strobe detected) */}
      {videoAnalysis?.strobeHazard && (
        <div
          id="strobe-hazard-banner"
          className="my-3 p-4 rounded-xl bg-rose-950/80 border-2 border-rose-600 text-rose-200 text-xs shadow-lg flex items-start gap-3"
        >
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-rose-300 uppercase tracking-wide">
                Critical Safety Warning: Strobe / Rapid Flash Hazard (&gt;3Hz)
              </span>
              <span className="bg-rose-500 text-slate-950 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold">
                REJECTED BY DAMS
              </span>
            </div>
            <p className="mt-1 text-white leading-relaxed">
              {videoAnalysis.strobeHazardWarning ||
                'This creative contains rapid luminance flashes exceeding the 3Hz photosensitive threshold. Municipal transit authorities and HYGH network standards strictly prohibit flashing content that can distract moving drivers or trigger seizures.'}
            </p>
          </div>
        </div>
      )}

      {/* Nav Tabs for Deep Inspection */}
      <div className="flex items-center gap-1 border-b border-slate-800 mb-5 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 font-semibold border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'text-amber-400 border-amber-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Flagged Issues ({flaggedIssues.length})
        </button>
        {videoAnalysis && (
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`px-3.5 py-2 font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'video'
                ? 'text-sky-400 border-sky-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>DOOH Video Specs</span>
            {videoAnalysis.strobeHazard && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`px-3.5 py-2 font-semibold border-b-2 transition-all ${
            activeTab === 'metrics'
              ? 'text-amber-400 border-amber-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Hardware &amp; Glare Metrics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('optimizer')}
          className={`px-3.5 py-2 font-semibold border-b-2 transition-all ${
            activeTab === 'optimizer'
              ? 'text-amber-400 border-amber-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          AI Copy Optimizer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('checklist')}
          className={`px-3.5 py-2 font-semibold border-b-2 transition-all ${
            activeTab === 'checklist'
              ? 'text-amber-400 border-amber-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          DAMS Pre-Flight Dispatch
        </button>
      </div>

      {/* TAB CONTENT 1: FLAGGED ISSUES & ACTIONABLE RECOMMENDATIONS */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Flagged Issues List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Detected OOH Obstacles for Moving Vehicle
            </h3>
            <div className="space-y-2.5">
              {flaggedIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border text-xs ${
                    issue.severity === 'critical'
                      ? 'bg-rose-950/40 border-rose-800/60 text-slate-200'
                      : issue.severity === 'warning'
                      ? 'bg-amber-950/40 border-amber-800/60 text-slate-200'
                      : 'bg-slate-800/40 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          issue.severity === 'critical'
                            ? 'bg-rose-600 text-white'
                            : issue.severity === 'warning'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="font-bold text-white text-xs">{issue.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">[{issue.category}]</span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-slate-300 leading-relaxed">{issue.description}</p>
                  {issue.benchmarkStat && (
                    <div className="mt-2 text-[11px] font-medium text-amber-300/90 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{issue.benchmarkStat}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Recommended Modifications for P2.5 Network
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {actionableRecommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 text-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] text-amber-300 font-mono">
                        {rec.priority}
                      </span>
                      <span>{rec.action}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{rec.rationale}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
                    <strong className="text-emerald-400">Fix: </strong>
                    <span className="text-slate-200 font-medium">{rec.sampleFix}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: HARDWARE & ENVIRONMENT METRICS */}
      {activeTab === 'metrics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Metric 1: Contrast */}
            <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Sunlight Contrast Ratio
                </span>
                <span className="font-mono font-bold text-amber-400">{metrics.contrastScore}/100</span>
              </div>
              <div className="text-xs font-bold text-white mt-1">
                Rating: <span className="text-amber-400">{metrics.contrastRating}</span>
                {metrics.contrastRatioEstimate && (
                  <span className="text-slate-400 font-mono ml-1 font-normal">({metrics.contrastRatioEstimate})</span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                {metrics.contrastFeedback}
              </p>
              <div className="mt-2 text-[10px] text-amber-300/80 font-medium">
                High contrast ads yield +43% higher recall on HYGH network.
              </div>
            </div>

            {/* Metric 2: Word Count */}
            <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  Word Count &amp; Glance Density
                </span>
                <span className="font-mono font-bold text-white">
                  {metrics.textCount} Words
                </span>
              </div>
              <div className="text-xs font-bold text-white mt-1">
                Status: <span className={metrics.textCount <= 6 ? 'text-emerald-400' : 'text-rose-400'}>
                  {metrics.textCountRating}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                {metrics.textCountFeedback}
              </p>
              <div className="mt-2 text-[10px] text-sky-300/80 font-medium">
                Estimated vehicle dwell window: 1.8 - 2.5 seconds.
              </div>
            </div>

            {/* Metric 3: P2.5 128px Matrix Legibility */}
            <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  128px Matrix Legibility
                </span>
                <span className="font-mono font-bold text-emerald-400">{metrics.pixelPitchLegibilityScore}/100</span>
              </div>
              <div className="text-xs font-bold text-white mt-1">
                Pitch: <span className="text-amber-400">2.5mm Diode Density</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                {metrics.pixelPitchFeedback}
              </p>
              <div className="mt-2 text-[10px] text-emerald-300/80 font-medium">
                Requires thick sans-serif ≥24px to prevent diode aliasing.
              </div>
            </div>

            {/* Metric 4: Daylight 4500 Nits Resilience */}
            <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  Daylight Solar Resilience
                </span>
                <span className="font-mono font-bold text-yellow-400">{metrics.daylightVisibilityScore}/100</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                {metrics.daylightFeedback}
              </p>
            </div>

            {/* Metric 5: Aspect Ratio Fit */}
            <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  Letterbox Aspect &amp; Margins
                </span>
                <span className="font-mono font-bold text-purple-400">{metrics.aspectRatioFitScore}/100</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                {metrics.aspectRatioFeedback}
              </p>
            </div>

            {/* Metric 6: Dwell Time Absorption */}
            <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                  Read Time vs Opportunity
                </span>
                <span className="font-mono font-bold text-rose-400">
                  {metrics.dwellTimeReadabilitySec}s Needed
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                Drivers &amp; pedestrians only have 1.5 - 2.5 seconds of clean line-of-sight. Ads demanding &gt;3s lose 70%+ comprehension.
              </p>
            </div>
          </div>

          {/* Detected Text Segments */}
          {detectedText && detectedText.length > 0 && (
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Detected Creative Text Tokens:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {detectedText.map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">
                    "{t}"
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DOOH VIDEO SPECIFICATIONS & STROBE AUDIT */}
      {activeTab === 'video' && videoAnalysis && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Spot Duration Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-400" />
                  DOOH Spot Duration
                </span>
                <span
                  className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                    videoAnalysis.durationCompliance === 'COMPLIANT'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {videoAnalysis.durationCompliance}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {videoAnalysis.durationSec}s{' '}
                <span className="text-xs font-normal text-slate-400 font-sans">
                  (Standard: 6.0s - 10.0s slot)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {videoAnalysis.durationCompliance === 'COMPLIANT'
                  ? 'Perfect spot duration for Yaham LED schedule. Will fit precisely into HYGH 60s campaign rotation loops.'
                  : `Video duration is ${videoAnalysis.durationSec}s. HYGH taxi displays run 6-10s fixed loop slots.`}
              </p>
            </div>

            {/* Strobe Hazard Safety Rating */}
            <div
              className={`p-4 rounded-xl border ${
                videoAnalysis.strobeHazard
                  ? 'bg-rose-950/40 border-rose-700'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert
                    className={`w-4 h-4 ${
                      videoAnalysis.strobeHazard ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  />
                  Roadway Strobe / Flash Safety
                </span>
                <span
                  className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                    videoAnalysis.strobeHazard
                      ? 'bg-rose-500 text-slate-950'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {videoAnalysis.strobeHazard ? 'FAIL (>3Hz)' : 'PASS (<3Hz)'}
                </span>
              </div>
              <div className="text-lg font-bold text-white">
                {videoAnalysis.strobeHazard
                  ? 'Strobe Hazard Flagged'
                  : 'Photosensitive Compliant'}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {videoAnalysis.strobeHazardWarning ||
                  'No violent luminance strobing detected. Ad adheres to municipal roadway safety guidelines.'}
              </p>
            </div>

            {/* Motion Pacing Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Motion Pacing Score
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {videoAnalysis.motionPacingScore}/100
                </span>
              </div>
              <div className="text-xs font-bold text-white mb-1">
                Pacing: <span className="text-amber-300">{videoAnalysis.motionPacingRating}</span>
              </div>
              <p className="text-xs text-slate-400">
                {videoAnalysis.motionPacingFeedback}
              </p>
            </div>

            {/* Loop Smoothness Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-purple-400" />
                  Loop Continuity &amp; Transitions
                </span>
                <span className="font-mono font-bold text-purple-400">
                  {videoAnalysis.loopSmoothnessScore}/100
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {videoAnalysis.loopFeedback}
              </p>
              <div className="mt-2 text-[10px] text-slate-500 font-mono">
                Evaluated across {videoAnalysis.keyframesEvaluatedCount} temporal keyframe samples.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: AI COPY OPTIMIZER */}
      {activeTab === 'optimizer' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                AI One-Click Creative Compression Engine
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {optimizedCopySuggestion.explanation}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Copy */}
              <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs">
                <div className="flex items-center justify-between text-[11px] text-rose-400 font-bold mb-1">
                  <span>Current Creative Copy</span>
                  <span className="font-mono">{metrics.textCount} Words</span>
                </div>
                <div className="text-slate-200 italic mt-2 p-2.5 rounded bg-slate-900/90 font-serif">
                  "{optimizedCopySuggestion.originalCopy}"
                </div>
                <div className="text-[11px] text-rose-300/80 mt-2">
                  ✕ Overloads pedestrian cognitive window on moving vehicle.
                </div>
              </div>

              {/* Recommended High-Impact Copy */}
              <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs">
                <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold mb-1">
                  <span>Optimized OOH Headline</span>
                  <span className="font-mono text-emerald-300">
                    -{optimizedCopySuggestion.reductionPercentage}% Word Count
                  </span>
                </div>
                <div className="text-amber-300 font-extrabold mt-2 p-2.5 rounded bg-slate-900/90 text-sm tracking-wide font-sans">
                  "{optimizedCopySuggestion.recommendedCopy}"
                </div>
                <div className="text-[11px] text-emerald-300/80 mt-2">
                  ✓ Instant 1.5s comprehension + maximum contrast on 128px matrix.
                </div>
              </div>
            </div>

            {/* Generated High Contrast Visual Mockup */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Simulated AI-Optimized Visual for Yaham P2.5 Screen:
              </div>
              <div
                className="w-full bg-slate-950 rounded-lg p-4 border border-slate-800 flex items-center justify-center text-center shadow-inner"
                style={{ aspectRatio: `${currentSpec.resolutionWidthPx} / ${currentSpec.resolutionHeightPx}` }}
              >
                <div className="space-y-1">
                  <div className="text-amber-400 font-black text-base sm:text-lg tracking-wider uppercase font-sans drop-shadow-md">
                    {optimizedCopySuggestion.recommendedCopy}
                  </div>
                  <div className="text-slate-400 text-[10px] tracking-widest font-mono uppercase">
                    HIGH VISIBILITY • 4500 NITS DAYLIGHT COMPLIANT
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: DAMS PRE-FLIGHT DISPATCH CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Automated DAMS Deployment Gateways (P2.5 Taxi Network)
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  {damsChecklist.resolutionFit ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <div>
                    <div className="font-semibold text-white">Resolution &amp; Aspect Match</div>
                    <div className="text-[11px] text-slate-400">
                      Target: {currentSpec.resolutionWidthPx}×{currentSpec.resolutionHeightPx} px ({currentSpec.aspectRatioLabel})
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${damsChecklist.resolutionFit ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                  {damsChecklist.resolutionFit ? 'PASS' : 'FAIL'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  {damsChecklist.contrastPassing ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <div>
                    <div className="font-semibold text-white">Direct Sunlight Contrast (4500 Nits)</div>
                    <div className="text-[11px] text-slate-400">
                      Must exceed minimum 4.5:1 ratio for moving vehicle outdoor readability
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${damsChecklist.contrastPassing ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                  {damsChecklist.contrastPassing ? 'PASS' : 'FAIL'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  {damsChecklist.wordCountPassing ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <div>
                    <div className="font-semibold text-white">Word Count Threshold (&lt;6 Words)</div>
                    <div className="text-[11px] text-slate-400">
                      Detected: {metrics.textCount} words (Recommended: maximum 6 words)
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${damsChecklist.wordCountPassing ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                  {damsChecklist.wordCountPassing ? 'PASS' : 'FAIL'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  {damsChecklist.safeZoneClearance ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <div>
                    <div className="font-semibold text-white">Hardware Bezel Safe Margin (5%)</div>
                    <div className="text-[11px] text-slate-400">
                      Checks that text elements do not clip against Yaham aerodynamic cabinet bezels
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${damsChecklist.safeZoneClearance ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                  {damsChecklist.safeZoneClearance ? 'PASS' : 'WARN'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  {damsChecklist.glanceTestPassing ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <div>
                    <div className="font-semibold text-white">35 km/h Dynamic Glance Comprehension</div>
                    <div className="text-[11px] text-slate-400">
                      Predicts ≥80% recall across pedestrian sidewalks and parallel driving traffic
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${damsChecklist.glanceTestPassing ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                  {damsChecklist.glanceTestPassing ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>

            {/* DAMS Deployment Conclusion */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Network Status:{' '}
                <strong className={overallScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}>
                  {overallScore >= 70 ? 'Ready for Live Fleet Deployment' : 'Revisions Required Before Broadcast'}
                </strong>
              </div>
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
              >
                Send Feedback to Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
