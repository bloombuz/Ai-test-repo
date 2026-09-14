export type P25DisplayModelId = 'YHT-V3.12-P2.5' | 'YHT-V3.22-P2.5' | 'YHT-V7.0-P2.5';

export interface P25DisplaySpec {
  id: P25DisplayModelId;
  name: string;
  series: string;
  pixelPitch: number; // 2.5mm
  pixelDensity: number; // 160,000 px/m²
  displayWidthMm: number;
  displayHeightMm: number;
  resolutionWidthPx: number;
  resolutionHeightPx: number; // 128 px
  aspectRatioLabel: string;
  aspectRatioValue: number;
  maxBrightnessNits: number; // 4500 nits
  viewingAngle: string; // V140° H140°
  weightKg: number;
  type: 'double-sided' | 'triangular';
  moduleDimensions: string;
  drivingMethod: string;
  refreshRate: string;
}

export interface MetricDetail {
  contrastScore: number;
  contrastRating: 'High' | 'Moderate' | 'Low' | 'Poor';
  contrastRatioEstimate?: string;
  contrastFeedback: string;
  textCount: number;
  textCountRating: 'Optimal (<6 words)' | 'Moderate (6-8 words)' | 'Excessive (>8 words)';
  textCountFeedback: string;
  pixelPitchLegibilityScore: number;
  pixelPitchFeedback: string;
  daylightVisibilityScore: number;
  daylightFeedback: string;
  aspectRatioFitScore: number;
  aspectRatioFeedback: string;
  dwellTimeReadabilitySec: number;
}

export interface FlaggedIssue {
  severity: 'critical' | 'warning' | 'tip';
  category: 'Contrast' | 'Word Count' | 'Typography' | 'Safe Zones' | 'CTA' | 'Sunlight' | string;
  title: string;
  description: string;
  benchmarkStat?: string;
}

export interface Recommendation {
  priority: number;
  action: string;
  rationale: string;
  sampleFix: string;
}

export interface OptimizedCopy {
  originalCopy: string;
  recommendedCopy: string;
  reductionPercentage: number;
  explanation: string;
}

export interface DAMSChecklist {
  resolutionFit: boolean;
  safeZoneClearance: boolean;
  contrastPassing: boolean;
  wordCountPassing: boolean;
  glanceTestPassing: boolean;
  videoDurationPassing?: boolean;
  motionSafetyPassing?: boolean;
}

export interface VideoKeyframe {
  timestampSec: number;
  label: string;
  dataUrl: string;
  base64?: string;
  contrastScore?: number;
  readabilityFeedback?: string;
}

export interface VideoAnalysisData {
  durationSec: number;
  loopCompliance: boolean;
  loopComplianceFeedback: string;
  strobeHazard: boolean;
  strobeHazardFeedback: string;
  motionPacingRating: 'Optimal' | 'Fast / Distracting' | 'Static';
  motionPacingFeedback: string;
  keyframes?: {
    timestamp: string;
    label: string;
    legibilityScore: number;
    notes: string;
    thumbnail?: string;
  }[];
}

export interface CreativeAnalysisResult {
  overallScore: number;
  status: 'APPROVED' | 'NEEDS_REVISION' | 'REJECTED';
  summaryHeadline: string;
  keyFindingExample: string;
  detectedText: string[];
  metrics: MetricDetail;
  mediaType?: 'image' | 'video';
  videoAnalysis?: VideoAnalysisData;
  flaggedIssues: FlaggedIssue[];
  actionableRecommendations: Recommendation[];
  optimizedCopySuggestion: OptimizedCopy;
  damsChecklist: DAMSChecklist;
}

export interface PresetCreative {
  id: string;
  title: string;
  brand: string;
  tagline: string;
  thumbnailUrl: string;
  description: string;
  expectedIssue: string;
  category: 'problematic' | 'optimal';
  mediaType?: 'image' | 'video';
  durationSec?: number;
}

