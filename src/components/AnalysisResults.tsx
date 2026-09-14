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
  Copy,
  Check,
  Zap,
  ShieldAlert,
  Layers,
  Film,
  Clock,
  Activity,
  ChevronRight,
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
          text: 'text-emerald-600',
          badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          ring: '#10B981',
        };
      case 'NEEDS_REVISION':
        return {
          text: 'text-amber-600',
          badge: 'bg-amber-50 text-amber-700 border border-amber-200',
          ring: '#F59E0B',
        };
      default:
        return {
          text: 'text-rose-600',
          badge: 'bg-rose-50 text-rose-700 border border-rose-200',
          ring: '#EF4444',
        };
    }
  };

  const statusStyle = getStatusColor(status);

  // Calculate SVG circular progress values
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div id="creative-advisor-results" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
      {/* Top Header & Executive Score Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          {/* Circular Donut Gauge (HYGH Dashboard aesthetic) */}
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke={statusStyle.ring}
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-base font-bold font-mono leading-none ${statusStyle.text}`}>
                {overallScore}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                /100
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                DAMS Pre-Flight Audit Report
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle.badge}`}>
                {status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal max-w-xl">
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
          >
            {copiedReport ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Audit Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Export Audit to Agency</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* EXECUTIVE CALLOUT */}
      <div
        id="key-finding-banner"
        className="my-5 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-slate-800 dark:text-slate-200"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                Primary OOH Advisory Finding
              </span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                HYGH Network Benchmark
              </span>
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
              "{keyFindingExample}"
            </p>
          </div>
        </div>
      </div>

      {/* Critical Video Strobe Alert Banner (if strobe detected) */}
      {videoAnalysis?.strobeHazard && (
        <div
          id="strobe-hazard-banner"
          className="my-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-slate-800 dark:text-slate-200 text-xs flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide">
                Critical Safety Warning: Strobe / Rapid Flash Hazard (&gt;3Hz)
              </span>
              <span className="bg-rose-600 text-white font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                REJECTED BY DAMS
              </span>
            </div>
            <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">
              {videoAnalysis.strobeHazardWarning ||
                'This creative contains rapid luminance flashes exceeding the 3Hz photosensitive threshold. Municipal transit authorities and HYGH network standards strictly prohibit flashing content that can distract moving drivers or trigger seizures.'}
            </p>
          </div>
        </div>
      )}

      {/* Nav Tabs for Deep Inspection (HYGH Pill Tab Style) */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full mb-5 text-xs font-medium flex-wrap gap-1 transition-colors">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-1.5 rounded-full transition-all ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Flagged Issues ({flaggedIssues.length})
        </button>
        {videoAnalysis && (
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
              activeTab === 'video'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
          className={`px-4 py-1.5 rounded-full transition-all ${
            activeTab === 'metrics'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Hardware &amp; Glare Metrics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('optimizer')}
          className={`px-4 py-1.5 rounded-full transition-all ${
            activeTab === 'optimizer'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          AI Copy Optimizer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-1.5 rounded-full transition-all ${
            activeTab === 'checklist'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          DAMS Pre-Flight Dispatch
        </button>
      </div>

      {/* TAB CONTENT 1: FLAGGED ISSUES & ACTIONABLE RECOMMENDATIONS */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Flagged Issues List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Detected OOH Obstacles for Moving Vehicle
            </h3>
            <div className="space-y-2.5">
              {flaggedIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 text-xs space-y-1.5 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          issue.severity === 'critical'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                            : issue.severity === 'warning'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{issue.title}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">[{issue.category}]</span>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{issue.description}</p>
                  {issue.benchmarkStat && (
                    <div className="pt-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{issue.benchmarkStat}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Recommended Modifications for P2.5 Network
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {actionableRecommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs flex flex-col justify-between shadow-2xs hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1">
                      <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold font-mono">
                        {rec.priority}
                      </span>
                      <span>{rec.action}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed mt-1">{rec.rationale}</p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700 text-[11px]">
                    <strong className="text-blue-600 dark:text-blue-400 font-semibold">Suggested Fix: </strong>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{rec.sampleFix}</span>
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
            <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs space-y-1.5 transition-colors">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Sunlight Contrast Ratio
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{metrics.contrastScore}/100</span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Rating: <span className="text-blue-600 dark:text-blue-400 font-bold">{metrics.contrastRating}</span>
                {metrics.contrastRatioEstimate && (
                  <span className="text-slate-400 dark:text-slate-500 font-mono ml-1 font-normal">({metrics.contrastRatioEstimate})</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                {metrics.contrastFeedback}
              </p>
              <div className="pt-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                High contrast ads yield +43% higher recall on HYGH network.
              </div>
            </div>

            {/* Metric 2: Word Count */}
            <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs space-y-1.5 transition-colors">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Word Count &amp; Glance Density
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {metrics.textCount} Words
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Status: <span className={metrics.textCount <= 6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                  {metrics.textCountRating}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                {metrics.textCountFeedback}
              </p>
              <div className="pt-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Estimated vehicle dwell window: 1.8 - 2.5 seconds.
              </div>
            </div>

            {/* Metric 3: P2.5 128px Matrix Legibility */}
            <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs space-y-1.5 transition-colors">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  128px Matrix Legibility
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{metrics.pixelPitchLegibilityScore}/100</span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Pitch: <span className="text-blue-600 dark:text-blue-400 font-semibold">2.5mm Diode Density</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                {metrics.pixelPitchFeedback}
              </p>
              <div className="pt-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Requires thick sans-serif ≥24px to prevent diode aliasing.
              </div>
            </div>

            {/* Metric 4: Daylight 4500 Nits Resilience */}
            <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs space-y-1.5 transition-colors">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Daylight Solar Resilience
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{metrics.daylightVisibilityScore}/100</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                {metrics.daylightFeedback}
              </p>
            </div>

            {/* Metric 5: Aspect Ratio Fit */}
            <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs space-y-1.5 transition-colors">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Letterbox Aspect &amp; Margins
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{metrics.aspectRatioFitScore}/100</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                {metrics.aspectRatioFeedback}
              </p>
            </div>

            {/* Metric 6: Dwell Time Absorption */}
            <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs space-y-1.5 transition-colors">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                  Read Time vs Opportunity
                </span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {metrics.dwellTimeReadabilitySec}s Needed
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Drivers &amp; pedestrians only have 1.5 - 2.5 seconds of clean line-of-sight. Ads demanding &gt;3s lose 70%+ comprehension.
              </p>
            </div>
          </div>

          {/* Detected Text Segments */}
          {detectedText && detectedText.length > 0 && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs transition-colors">
              <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                Detected Creative Text Tokens:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {detectedText.map((t, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono text-[11px] font-medium">
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
            <div className="p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-2 transition-colors">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  DOOH Spot Duration
                </span>
                <span
                  className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full ${
                    videoAnalysis.durationCompliance === 'COMPLIANT'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {videoAnalysis.durationCompliance}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {videoAnalysis.durationSec}s{' '}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-sans">
                  (Standard: 6.0s - 10.0s slot)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {videoAnalysis.durationCompliance === 'COMPLIANT'
                  ? 'Perfect spot duration for Yaham LED schedule. Will fit precisely into HYGH 60s campaign rotation loops.'
                  : `Video duration is ${videoAnalysis.durationSec}s. HYGH taxi displays run 6-10s fixed loop slots.`}
              </p>
            </div>

            {/* Strobe Hazard Safety Rating */}
            <div
              className={`p-5 rounded-2xl border space-y-2 transition-colors ${
                videoAnalysis.strobeHazard
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50'
                  : 'bg-slate-50/60 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldAlert
                    className={`w-4 h-4 ${
                      videoAnalysis.strobeHazard ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  />
                  Roadway Strobe / Flash Safety
                </span>
                <span
                  className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full ${
                    videoAnalysis.strobeHazard
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {videoAnalysis.strobeHazard ? 'FAIL (>3Hz)' : 'PASS (<3Hz)'}
                </span>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {videoAnalysis.strobeHazard
                  ? 'Strobe Hazard Flagged'
                  : 'Photosensitive Compliant'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {videoAnalysis.strobeHazardWarning ||
                  'No violent luminance strobing detected. Ad adheres to municipal roadway safety guidelines.'}
              </p>
            </div>

            {/* Motion Pacing Card */}
            <div className="p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-2 transition-colors">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Motion Pacing Score
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {videoAnalysis.motionPacingScore}/100
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Pacing: <span className="text-blue-600 dark:text-blue-400">{videoAnalysis.motionPacingRating}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {videoAnalysis.motionPacingFeedback}
              </p>
            </div>

            {/* Loop Smoothness Card */}
            <div className="p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-2 transition-colors">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Loop Continuity &amp; Transitions
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {videoAnalysis.loopSmoothnessScore}/100
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {videoAnalysis.loopFeedback}
              </p>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                Evaluated across {videoAnalysis.keyframesEvaluatedCount} temporal keyframe samples.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: AI COPY OPTIMIZER */}
      {activeTab === 'optimizer' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                AI One-Click Creative Compression Engine
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              {optimizedCopySuggestion.explanation}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Copy */}
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-xs">
                <div className="flex items-center justify-between text-[11px] text-rose-700 dark:text-rose-400 font-bold mb-1">
                  <span>Current Creative Copy</span>
                  <span className="font-mono">{metrics.textCount} Words</span>
                </div>
                <div className="text-slate-800 dark:text-slate-200 italic mt-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/50 font-serif">
                  "{optimizedCopySuggestion.originalCopy}"
                </div>
                <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-2">
                  ✕ Overloads pedestrian cognitive window on moving vehicle.
                </div>
              </div>

              {/* Recommended High-Impact Copy */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-xs">
                <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mb-1">
                  <span>Optimized OOH Headline</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    -{optimizedCopySuggestion.reductionPercentage}% Word Count
                  </span>
                </div>
                <div className="text-blue-600 dark:text-blue-400 font-bold mt-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50 text-sm tracking-wide font-sans">
                  "{optimizedCopySuggestion.recommendedCopy}"
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-2 flex items-center justify-between">
                  <span>✓ Instant 1.5s comprehension on 128px matrix.</span>
                  {onApplyOptimizedCreative && (
                    <button
                      type="button"
                      onClick={() => onApplyOptimizedCreative(optimizedCopySuggestion.recommendedCopy)}
                      className="px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors text-[10px]"
                    >
                      Apply Copy
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Generated High Contrast Visual Mockup */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Simulated AI-Optimized Visual for Yaham P2.5 Screen:
              </div>
              <div
                className="w-full bg-slate-950 rounded-2xl p-4 border border-slate-900 flex items-center justify-center text-center shadow-inner"
                style={{ aspectRatio: `${currentSpec.resolutionWidthPx} / ${currentSpec.resolutionHeightPx}` }}
              >
                <div className="space-y-1">
                  <div className="text-white font-black text-base sm:text-lg tracking-wider uppercase font-sans">
                    {optimizedCopySuggestion.recommendedCopy}
                  </div>
                  <div className="text-blue-400 text-[10px] tracking-widest font-mono uppercase">
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
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 transition-colors">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Automated DAMS Deployment Gateways (P2.5 Taxi Network)
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-3">
                  {damsChecklist.resolutionFit ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Resolution &amp; Aspect Match</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Target: {currentSpec.resolutionWidthPx}×{currentSpec.resolutionHeightPx} px ({currentSpec.aspectRatioLabel})
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${damsChecklist.resolutionFit ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'}`}>
                  {damsChecklist.resolutionFit ? 'PASS' : 'FAIL'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-3">
                  {damsChecklist.contrastPassing ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Direct Sunlight Contrast (4500 Nits)</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Must exceed minimum 4.5:1 ratio for moving vehicle outdoor readability
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${damsChecklist.contrastPassing ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'}`}>
                  {damsChecklist.contrastPassing ? 'PASS' : 'FAIL'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-3">
                  {damsChecklist.wordCountPassing ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Word Count Threshold (&lt;6 Words)</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Detected: {metrics.textCount} words (Recommended: maximum 6 words)
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${damsChecklist.wordCountPassing ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'}`}>
                  {damsChecklist.wordCountPassing ? 'PASS' : 'FAIL'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-3">
                  {damsChecklist.safeZoneClearance ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Hardware Bezel Safe Margin (5%)</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Checks that text elements do not clip against Yaham aerodynamic cabinet bezels
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${damsChecklist.safeZoneClearance ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'}`}>
                  {damsChecklist.safeZoneClearance ? 'PASS' : 'WARN'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-3">
                  {damsChecklist.glanceTestPassing ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">35 km/h Dynamic Glance Comprehension</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Predicts ≥80% recall across pedestrian sidewalks and parallel driving traffic
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${damsChecklist.glanceTestPassing ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'}`}>
                  {damsChecklist.glanceTestPassing ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>

            {/* DAMS Deployment Conclusion */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Network Status:{' '}
                <strong className={overallScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                  {overallScore >= 70 ? 'Ready for Live Fleet Deployment' : 'Revisions Required Before Broadcast'}
                </strong>
              </div>
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-xs text-white font-medium shadow-xs transition-colors"
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
