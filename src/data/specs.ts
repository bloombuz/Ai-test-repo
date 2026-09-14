import { P25DisplaySpec } from '../types';

export const P25_DISPLAY_SPECS: Record<string, P25DisplaySpec> = {
  'YHT-V3.22-P2.5': {
    id: 'YHT-V3.22-P2.5',
    name: 'HYGH 3.22 / 3.10 Series P2.5 (Compact Format)',
    series: '3.22 / 3.10 Compact Format',
    pixelPitch: 2.5,
    pixelDensity: 160000,
    displayWidthMm: 960,
    displayHeightMm: 320,
    resolutionWidthPx: 384,
    resolutionHeightPx: 128,
    aspectRatioLabel: '3 : 1',
    aspectRatioValue: 384 / 128,
    maxBrightnessNits: 4500,
    viewingAngle: 'V140° H140°',
    weightKg: 18.0,
    type: 'double-sided',
    moduleDimensions: '480 × 320 mm',
    drivingMethod: '32S',
    refreshRate: '1920 ~ 3840 Hz',
  },
};
