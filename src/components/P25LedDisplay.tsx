import React, { useRef, useEffect, useState, useCallback } from 'react';
import { P25DisplaySpec, LightingMode, SunIntensityPreset } from '../types';
import { ZoomIn, Eye, Sparkles, Layers, Sliders, CheckCircle2, AlertTriangle, Maximize2, X } from 'lucide-react';

export type P25RenderMode = 'physical' | 'subpixel' | 'split' | 'master';

export interface DiodeInspectInfo {
  col: number;
  row: number;
  r: number;
  g: number;
  b: number;
  nits: number;
  pitchMm: number;
  isLit: boolean;
  subpixelState: {
    redDuty: number;
    greenDuty: number;
    blueDuty: number;
  };
}

export interface P25LedScreenProps {
  spec: P25DisplaySpec;
  imageSrc: string | null;
  mediaType: 'image' | 'video';
  lightingMode: LightingMode;
  sunPreset?: SunIntensityPreset;
  nitsMode: '3500' | '4500' | '5000';
  viewingDistance: number; // in meters (1.5m to 35m)
  showSafeZones?: boolean;
  renderMode?: P25RenderMode;
  splitPosition?: number;
  onSplitPositionChange?: (pos: number) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onHoverDiode?: (info: DiodeInspectInfo | null, pixelData: { width: number; height: number; data: Uint8ClampedArray } | null) => void;
  onDominantColorChange?: (color: { r: number; g: number; b: number }) => void;
}

/**
 * P25LedScreen:
 * High-performance hardware canvas simulating an authentic Yaham P2.5 outdoor LED display.
 * Rasterizes creative content directly to 128 vertical pixel rows and renders
 * physical SMD1921 3-in-1 point-emitter diodes, dark matte black louvres, and module seams.
 */
export const P25LedScreen: React.FC<P25LedScreenProps> = ({
  spec,
  imageSrc,
  mediaType,
  lightingMode,
  sunPreset = 'high-noon',
  nitsMode,
  viewingDistance,
  showSafeZones = false,
  renderMode = 'physical',
  splitPosition = 50,
  onSplitPositionChange,
  videoRef,
  onHoverDiode,
  onDominantColorChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [internalSplit, setInternalSplit] = useState<number>(splitPosition);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);

  const activeSplit = onSplitPositionChange ? splitPosition : internalSplit;

  // Cached downsampled pixel data from current frame
  const pixelDataRef = useRef<{
    width: number;
    height: number;
    data: Uint8ClampedArray;
  } | null>(null);

  const reqAnimFrameRef = useRef<number | null>(null);

  const cols = spec.resolutionWidthPx || 576;
  const rows = spec.resolutionHeightPx || 128;

  // Initialize offscreen downsampling canvas at exact hardware matrix resolution
  useEffect(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = cols;
    offscreen.height = rows;
    offscreenCanvasRef.current = offscreen;
  }, [cols, rows]);

  // Optical physics: human visual acuity blend point for 2.5mm pitch is ~8.6m
  const blendThreshold = 8.6;
  const blendFactor = Math.min(1, Math.max(0, (viewingDistance - 2.0) / (blendThreshold - 2.0)));
  const diodeDefinition = Math.max(0, 1 - Math.pow(blendFactor, 0.9));

  const nitsMultiplier = nitsMode === '5000' ? 1.15 : nitsMode === '4500' ? 1.0 : 0.82;
  const maxNits = parseInt(nitsMode, 10);

  // Downsample source to offscreen 576x128 matrix
  const sampleSourceToOffscreen = useCallback(
    (source: HTMLImageElement | HTMLVideoElement): boolean => {
      const offscreen = offscreenCanvasRef.current;
      if (!offscreen) return false;
      const ctx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!ctx) return false;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, cols, rows);

      try {
        ctx.drawImage(source, 0, 0, cols, rows);
        const imgData = ctx.getImageData(0, 0, cols, rows);
        pixelDataRef.current = {
          width: cols,
          height: rows,
          data: imgData.data,
        };

        // Extract average color of bottom half of frame to illuminate car roof
        if (onDominantColorChange) {
          let totR = 0, totG = 0, totB = 0, cnt = 0;
          const startR = Math.floor(rows * 0.45);
          for (let r = startR; r < rows; r += 2) {
            for (let c = 0; c < cols; c += 4) {
              const idx = (r * cols + c) * 4;
              totR += imgData.data[idx];
              totG += imgData.data[idx + 1];
              totB += imgData.data[idx + 2];
              cnt++;
            }
          }
          if (cnt > 0) {
            onDominantColorChange({
              r: Math.round(totR / cnt),
              g: Math.round(totG / cnt),
              b: Math.round(totB / cnt),
            });
          }
        }

        return true;
      } catch (err) {
        console.warn('Unable to sample source onto P2.5 offscreen matrix:', err);
        return false;
      }
    },
    [cols, rows]
  );

  // Main rendering routine: generates the physical P2.5 LED panel
  const renderP25Canvas = useCallback(() => {
    const canvas = displayCanvasRef.current;
    const pixelData = pixelDataRef.current;
    if (!canvas || !pixelData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-definition 4x4 sub-pixel diode matrix (2304 x 512 for 576x128 P2.5)
    // Simulates authentic Yaham SMD1921 black-face diodes, epoxy doming, and optical point spread
    const cellW = 4;
    const cellH = 4;
    const targetW = cols * cellW;
    const targetH = rows * cellH;

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const splitX = (activeSplit / 100) * targetW;

    // If master mode is requested, draw raw image directly
    if (renderMode === 'master') {
      const offscreen = offscreenCanvasRef.current;
      if (offscreen) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(offscreen, 0, 0, targetW, targetH);
      }
      return;
    }

    const outputImg = ctx.createImageData(targetW, targetH);
    const buf32 = new Uint32Array(outputImg.data.buffer);

    const srcData = pixelData.data;
    const isSubpixel = renderMode === 'subpixel';
    const isSplit = renderMode === 'split';

    // 1. Hardware drive current & Auto-dimming
    // Yaham Photocell: at night, auto-dims to ~1200 Nits to prevent driver flash-blindness & meet DOOH roadway codes
    let effectiveNitsMultiplier = nitsMultiplier;
    if (lightingMode === 'night') {
      effectiveNitsMultiplier = nitsMultiplier * 0.38; // ~1200 Nits output
    }

    // 2. Matte black Yaham louvre mask & veiling glare ambient reflection
    let maskR = 5;
    let maskG = 6;
    let maskB = 8;
    let washR = 0;
    let washG = 0;
    let washB = 0;
    let louvreSunGlintR = 0;
    let louvreSunGlintG = 0;
    let louvreSunGlintB = 0;

    if (lightingMode === 'sunlight') {
      if (sunPreset === 'high-noon') {
        // Direct solar zenith: 100,000 Lux. Elevated black floor, maximum veiling glare
        maskR = 44;
        maskG = 46;
        maskB = 52;
        washR = 34;
        washG = 36;
        washB = 40;
        louvreSunGlintR = maskR + 28;
        louvreSunGlintG = maskG + 30;
        louvreSunGlintB = maskB + 32;
      } else if (sunPreset === 'angled') {
        // Angled 45° Sun: 80,000 Lux. Directional solar specular flare
        maskR = 34;
        maskG = 36;
        maskB = 40;
        washR = 26;
        washG = 28;
        washB = 32;
        louvreSunGlintR = maskR + 22;
        louvreSunGlintG = maskG + 24;
        louvreSunGlintB = maskB + 26;
      } else {
        // Golden Hour: 50,000 Lux. Warm low-angle solar glaze
        maskR = 34;
        maskG = 30;
        maskB = 24;
        washR = 34;
        washG = 24;
        washB = 14;
        louvreSunGlintR = maskR + 28;
        louvreSunGlintG = maskG + 20;
        louvreSunGlintB = maskB + 14;
      }
    } else if (lightingMode === 'overcast') {
      // 15,000 Lux diffuse daylight. Crisp, high-contrast black-face performance (~140:1)
      maskR = 14;
      maskG = 15;
      maskB = 18;
      washR = 8;
      washG = 9;
      washB = 10;
    } else if (lightingMode === 'night') {
      // 12 Lux urban night. Inky black floor <0.5 Nits
      maskR = 2;
      maskG = 2;
      maskB = 3;
      washR = 0;
      washG = 0;
      washB = 0;
    }

    const maskPixel = (255 << 24) | (maskB << 16) | (maskG << 8) | maskR;

    // Louvre shadow pixel for horizontal anti-glare micro-vanes
    const louvreShadowR = Math.max(0, maskR - (lightingMode === 'sunlight' ? 6 : 2));
    const louvreShadowG = Math.max(0, maskG - (lightingMode === 'sunlight' ? 6 : 2));
    const louvreShadowB = Math.max(0, maskB - (lightingMode === 'sunlight' ? 6 : 2));
    const louvreShadowPixel = (255 << 24) | (louvreShadowB << 16) | (louvreShadowG << 8) | louvreShadowR;

    const louvreSunPixel = (255 << 24) | (louvreSunGlintB << 16) | (louvreSunGlintG << 8) | louvreSunGlintR;

    for (let r = 0; r < rows; r++) {
      const rowOffset = r * cols;
      const targetRowStart = r * cellH * targetW;

      for (let c = 0; c < cols; c++) {
        const srcIdx = (rowOffset + c) * 4;
        let pr = srcData[srcIdx];
        let pg = srcData[srcIdx + 1];
        let pb = srcData[srcIdx + 2];

        // Apply hardware drive current
        pr = Math.min(255, Math.round(pr * effectiveNitsMultiplier));
        pg = Math.min(255, Math.round(pg * effectiveNitsMultiplier));
        pb = Math.min(255, Math.round(pb * effectiveNitsMultiplier));

        // Apply solar / ambient veiling glare wash
        if (lightingMode === 'sunlight') {
          pr = Math.min(255, Math.round(pr * 0.86 + washR));
          pg = Math.min(255, Math.round(pg * 0.86 + washG));
          pb = Math.min(255, Math.round(pb * 0.86 + washB));
        } else if (lightingMode === 'overcast') {
          pr = Math.min(255, Math.round(pr * 0.96 + washR));
          pg = Math.min(255, Math.round(pg * 0.96 + washG));
          pb = Math.min(255, Math.round(pb * 0.96 + washB));
        }

        const luminance = 0.2126 * pr + 0.7152 * pg + 0.0722 * pb;
        const isLit = luminance > (lightingMode === 'sunlight' ? 45 : 10);

        const cellX = c * cellW;
        const inMasterSplit = isSplit && cellX < splitX;

        // In master artwork side of split screen: render continuous color
        if (inMasterSplit) {
          const masterPixel = (255 << 24) | (pb << 16) | (pg << 8) | pr;
          for (let dy = 0; dy < cellH; dy++) {
            const lineStart = targetRowStart + dy * targetW + cellX;
            for (let dx = 0; dx < cellW; dx++) {
              buf32[lineStart + dx] = masterPixel;
            }
          }
          continue;
        }

        if (isSubpixel) {
          // SUBPIXEL MICRO-DIE MODE (Discrete R, G, B point dies inside SMD1921 package)
          for (let dy = 0; dy < cellH; dy++) {
            const lineStart = targetRowStart + dy * targetW + cellX;

            if (dy === 1 || dy === 2) {
              const rPixel = isLit
                ? (255 << 24) | (Math.round(pb * 0.08) << 16) | (Math.round(pg * 0.04) << 8) | pr
                : maskPixel;
              const gPixel = isLit
                ? (255 << 24) | (Math.round(pb * 0.08) << 16) | (pg << 8) | (Math.round(pr * 0.04) << 0)
                : maskPixel;
              const bPixel = isLit
                ? (255 << 24) | (pb << 16) | (Math.round(pg * 0.08) << 8) | (Math.round(pr * 0.04) << 0)
                : maskPixel;

              buf32[lineStart + 0] = maskPixel;
              buf32[lineStart + 1] = rPixel;
              buf32[lineStart + 2] = gPixel;
              buf32[lineStart + 3] = bPixel;
            } else {
              buf32[lineStart + 0] = lightingMode === 'sunlight' ? louvreSunPixel : louvreShadowPixel;
              buf32[lineStart + 1] = maskPixel;
              buf32[lineStart + 2] = maskPixel;
              buf32[lineStart + 3] = maskPixel;
            }
          }
        } else {
          // PHYSICAL SMD1921 3-IN-1 POINT EMITTER DIODE MODE
          if (!isLit) {
            // Unlit Diode: Physical black resin package with epoxy cup highlight and micro-louvre
            const unlitCupR = maskR + 5;
            const unlitCupG = maskG + 6;
            const unlitCupB = maskB + 8;
            const unlitCupPixel = (255 << 24) | (unlitCupB << 16) | (unlitCupG << 8) | unlitCupR;

            // Specular resin highlight dot on top-left of unlit diode
            const specR = maskR + 14;
            const specG = maskG + 15;
            const specB = maskB + 18;
            const specPixel = (255 << 24) | (specB << 16) | (specG << 8) | specR;

            for (let dy = 0; dy < cellH; dy++) {
              const lineStart = targetRowStart + dy * targetW + cellX;
              for (let dx = 0; dx < cellW; dx++) {
                if (dy === 0) {
                  // Horizontal louvre rib: in sunlight, catches direct solar specular reflection
                  buf32[lineStart + dx] = lightingMode === 'sunlight' ? louvreSunPixel : louvreShadowPixel;
                } else if ((dx === 1 || dx === 2) && (dy === 1 || dy === 2)) {
                  // Diode epoxy core
                  buf32[lineStart + dx] = (dx === 1 && dy === 1) ? specPixel : unlitCupPixel;
                } else {
                  // Matte black louvre mask gap
                  buf32[lineStart + dx] = maskPixel;
                }
              }
            }
          } else {
            // Lit Diode: Authentic Point Light Source with High-Intensity Center and Optical Halation
            const coreBoost = Math.min(255, Math.round(luminance * 0.3));
            const coreR = Math.min(255, pr + coreBoost);
            const coreG = Math.min(255, pg + coreBoost);
            const coreB = Math.min(255, pb + coreBoost);
            const corePixel = (255 << 24) | (coreB << 16) | (coreG << 8) | coreR;

            // Diode body emission
            const bodyPixel = (255 << 24) | (pb << 16) | (pg << 8) | pr;

            // Optical halo around diode lens
            const haloAlpha = lightingMode === 'night' 
              ? 0.75 + blendFactor * 0.25 
              : 0.5 + blendFactor * 0.4;
            const haloR = Math.round(pr * haloAlpha + maskR * (1 - haloAlpha));
            const haloG = Math.round(pg * haloAlpha + maskG * (1 - haloAlpha));
            const haloB = Math.round(pb * haloAlpha + maskB * (1 - haloAlpha));
            const haloPixel = (255 << 24) | (haloB << 16) | (haloG << 8) | haloR;

            // Pitch gap optical blend (Airy disk / human Rayleigh acuity limit at distance + night halation bloom)
            const nightBloom = lightingMode === 'night' ? Math.round(luminance * 0.18) : 0;
            const gapAlpha = lightingMode === 'night' 
              ? Math.min(0.95, blendFactor * 0.85 + 0.2) 
              : blendFactor * 0.82;
            const gapR = Math.min(255, Math.round(pr * gapAlpha + maskR * (1 - gapAlpha)) + nightBloom);
            const gapG = Math.min(255, Math.round(pg * gapAlpha + maskG * (1 - gapAlpha)) + nightBloom);
            const gapB = Math.min(255, Math.round(pb * gapAlpha + maskB * (1 - gapAlpha)) + nightBloom);
            const gapPixel = (255 << 24) | (gapB << 16) | (gapG << 8) | gapR;

            for (let dy = 0; dy < cellH; dy++) {
              const lineStart = targetRowStart + dy * targetW + cellX;
              for (let dx = 0; dx < cellW; dx++) {
                const isCenter = (dx === 1 || dx === 2) && (dy === 1 || dy === 2);
                const isCorner = (dx === 0 || dx === 3) && (dy === 0 || dy === 3);

                if (isCenter) {
                  // Diode point emitter center
                  buf32[lineStart + dx] = corePixel;
                } else if (!isCorner) {
                  // Diode rim & halo
                  buf32[lineStart + dx] = diodeDefinition > 0.6 ? haloPixel : bodyPixel;
                } else {
                  // 2.5mm pitch gap
                  buf32[lineStart + dx] = gapPixel;
                }
              }
            }
          }
        }
      }
    }

    // Modular cabinet mechanical seams at column 192 and 384
    if (!isSplit || activeSplit < 33) {
      const seam1 = 192 * cellW;
      const seam2 = 384 * cellW;
      for (let y = 0; y < targetH; y++) {
        const yOffset = y * targetW;
        if (seam1 < targetW) buf32[yOffset + seam1] = 0xff000000;
        if (seam2 < targetW) buf32[yOffset + seam2] = 0xff000000;
      }
    }

    ctx.putImageData(outputImg, 0, 0);

    // If split mode, draw vertical divider with handle
    if (isSplit) {
      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, targetH);
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(splitX, targetH / 2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(splitX, targetH / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [
    cols,
    rows,
    renderMode,
    activeSplit,
    lightingMode,
    sunPreset,
    nitsMultiplier,
    blendFactor,
    diodeDefinition,
  ]);

  // Video or Image source processing
  useEffect(() => {
    let active = true;

    if (mediaType === 'video' && videoRef && videoRef.current) {
      const video = videoRef.current;

      const loop = () => {
        if (!active) return;
        if (video.readyState >= 2) {
          sampleSourceToOffscreen(video);
          renderP25Canvas();
        }
        reqAnimFrameRef.current = requestAnimationFrame(loop);
      };

      reqAnimFrameRef.current = requestAnimationFrame(loop);

      return () => {
        active = false;
        if (reqAnimFrameRef.current) {
          cancelAnimationFrame(reqAnimFrameRef.current);
        }
      };
    } else if (imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!active) return;
        sampleSourceToOffscreen(img);
        renderP25Canvas();
      };
      img.src = imageSrc;

      return () => {
        active = false;
      };
    }
  }, [imageSrc, mediaType, videoRef, sampleSourceToOffscreen, renderP25Canvas]);

  useEffect(() => {
    renderP25Canvas();
  }, [renderP25Canvas]);

  // Mouse move and hover inspection
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSplit && renderMode === 'split') {
      updateSplitFromMouse(e.clientX);
    }

    if (onHoverDiode && pixelDataRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

      const hoverCol = Math.floor(normX * cols);
      const hoverRow = Math.floor(normY * rows);

      const srcIdx = (hoverRow * cols + hoverCol) * 4;
      const pr = pixelDataRef.current.data[srcIdx] || 0;
      const pg = pixelDataRef.current.data[srcIdx + 1] || 0;
      const pb = pixelDataRef.current.data[srcIdx + 2] || 0;

      const lum = 0.2126 * pr + 0.7152 * pg + 0.0722 * pb;
      const isLit = lum > 12;

      onHoverDiode(
        {
          col: hoverCol,
          row: hoverRow,
          r: pr,
          g: pg,
          b: pb,
          nits: Math.round((lum / 255) * maxNits),
          pitchMm: spec.pixelPitch || 2.5,
          isLit,
          subpixelState: {
            redDuty: Math.round((pr / 255) * 100),
            greenDuty: Math.round((pg / 255) * 100),
            blueDuty: Math.round((pb / 255) * 100),
          },
        },
        pixelDataRef.current
      );
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (renderMode === 'split') {
      setIsDraggingSplit(true);
      updateSplitFromMouse(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingSplit(false);
  };

  const updateSplitFromMouse = (clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pos = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    if (onSplitPositionChange) {
      onSplitPositionChange(pos);
    } else {
      setInternalSplit(pos);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        handleMouseUp();
        if (onHoverDiode) onHoverDiode(null, null);
      }}
      className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center cursor-crosshair group select-none"
    >
      <canvas
        ref={displayCanvasRef}
        className="w-full h-full object-fill block"
        style={{
          imageRendering: 'auto',
        }}
      />

      {/* Optical Anti-Glare Polycarbonate Protective Face Sheen */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/[0.04] via-transparent to-black/[0.15]" />

      {/* Split Mode Labels */}
      {renderMode === 'split' && (
        <div className="absolute top-2 inset-x-2 flex justify-between pointer-events-none text-[10px] font-mono z-10">
          <span className="bg-black/85 px-2.5 py-0.5 rounded-full text-sky-300 border border-sky-500/40 shadow-xs">
            ◀ Artwork Master (Vector)
          </span>
          <span className="bg-black/85 px-2.5 py-0.5 rounded-full text-amber-300 border border-amber-500/40 shadow-xs">
            Actual Yaham P2.5 (128p) ▶
          </span>
        </div>
      )}

      {/* Ambient Sunlight Washout / Glare Layer */}
      {lightingMode === 'sunlight' && (
        <>
          {/* Solar beam & veiling glare */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-screen"
            style={{
              background:
                sunPreset === 'golden'
                  ? 'radial-gradient(circle at 85% 15%, rgba(253, 224, 71, 0.42) 0%, rgba(251, 146, 60, 0.22) 35%, rgba(255, 255, 255, 0.08) 60%, transparent 80%)'
                  : sunPreset === 'angled'
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.16) 28%, rgba(220,240,255,0.06) 55%, transparent 75%)'
                  : 'linear-gradient(170deg, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.04) 60%, transparent 85%)',
            }}
          />
          {/* Caustic lens flare circular glint ring */}
          <div
            className="absolute -top-10 right-10 w-44 h-44 rounded-full pointer-events-none mix-blend-color-dodge opacity-50 blur-xl"
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(254,240,138,0.4) 30%, rgba(199,210,254,0.15) 60%, transparent 75%)',
            }}
          />
          {/* Polycarbonate horizontal micro-louvre slat anti-glare ribs */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 1px, transparent 1px, transparent 4px)',
            }}
          />
        </>
      )}

      {/* Overcast Diffuse Sky Sheen & Anti-Reflective Coating */}
      {lightingMode === 'overcast' && (
        <>
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
            style={{
              background: 'linear-gradient(180deg, rgba(226, 232, 240, 0.4) 0%, rgba(203, 213, 225, 0.08) 60%, transparent 100%)',
            }}
          />
          <div className="absolute inset-0 pointer-events-none border border-cyan-500/10 shadow-[inset_0_0_16px_rgba(148,163,184,0.12)]" />
        </>
      )}

      {/* Night Ambient Neon Halation Layer & True Dark Contrast */}
      {lightingMode === 'night' && (
        <>
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_28px_rgba(59,130,246,0.16)]" />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-blue-950/20 via-transparent to-purple-950/15" />
        </>
      )}

      {/* Safe Zones Margin Overlay */}
      {showSafeZones && (
        <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-sky-400/80 m-2 flex items-center justify-between px-2 text-[9px] font-mono text-sky-300 z-10">
          <span className="bg-black/80 px-1 py-0.5 rounded">Safe Margin 5%</span>
          <span className="bg-black/80 px-1 py-0.5 rounded">128px Matrix Safe</span>
        </div>
      )}
    </div>
  );
};

/**
 * P25DiodeLoupe:
 * 12x Microscope Hardware Inspector rendering physical SMD1921 3-in-1 packages,
 * discrete Red/Green/Blue micro-LED chips, solder pads, 2.5mm scale ruler, and live nits.
 */
export interface P25DiodeLoupeProps {
  hoveredDiode: DiodeInspectInfo | null;
  spec: P25DisplaySpec;
  pixelData: { width: number; height: number; data: Uint8ClampedArray } | null;
  onClose?: () => void;
}

export const P25DiodeLoupe: React.FC<P25DiodeLoupeProps> = ({
  hoveredDiode,
  spec,
  pixelData,
  onClose,
}) => {
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);

  const cols = spec.resolutionWidthPx || 576;
  const rows = spec.resolutionHeightPx || 128;

  useEffect(() => {
    const canvas = loupeCanvasRef.current;
    if (!canvas || !pixelData || !hoveredDiode) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const inspectCols = 9;
    const inspectRows = 5;
    const hoverCol = hoveredDiode.col;
    const hoverRow = hoveredDiode.row;

    const startCol = Math.max(0, Math.min(cols - inspectCols, hoverCol - Math.floor(inspectCols / 2)));
    const startRow = Math.max(0, Math.min(rows - inspectRows, hoverRow - Math.floor(inspectRows / 2)));

    const loupeW = 280;
    const loupeH = 160;
    canvas.width = loupeW;
    canvas.height = loupeH;

    ctx.fillStyle = '#090B0F';
    ctx.fillRect(0, 0, loupeW, loupeH);

    const diodePitchPx = loupeW / inspectCols; // ~31px per diode
    const diodeSize = diodePitchPx * 0.72; // 1.8mm package on 2.5mm pitch

    for (let dy = 0; dy < inspectRows; dy++) {
      const r = startRow + dy;
      const rowOffset = r * cols;

      for (let dx = 0; dx < inspectCols; dx++) {
        const c = startCol + dx;
        const srcIdx = (rowOffset + c) * 4;

        const pr = pixelData.data[srcIdx] || 0;
        const pg = pixelData.data[srcIdx + 1] || 0;
        const pb = pixelData.data[srcIdx + 2] || 0;

        const lum = 0.2126 * pr + 0.7152 * pg + 0.0722 * pb;
        const isLit = lum > 12;

        const diodeCenterX = dx * diodePitchPx + diodePitchPx / 2;
        const diodeCenterY = dy * diodePitchPx + diodePitchPx / 2;

        const isCenterHover = c === hoverCol && r === hoverRow;

        ctx.save();
        ctx.fillStyle = '#11141A';
        ctx.strokeStyle = isCenterHover ? '#F59E0B' : '#1E232F';
        ctx.lineWidth = isCenterHover ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.roundRect(
          diodeCenterX - diodeSize / 2,
          diodeCenterY - diodeSize / 2,
          diodeSize,
          diodeSize,
          3
        );
        ctx.fill();
        ctx.stroke();

        // Solder pads
        ctx.fillStyle = '#3A4252';
        const padSize = 3;
        ctx.fillRect(diodeCenterX - diodeSize / 2, diodeCenterY - diodeSize / 2, padSize, padSize);
        ctx.fillRect(diodeCenterX + diodeSize / 2 - padSize, diodeCenterY - diodeSize / 2, padSize, padSize);
        ctx.fillRect(diodeCenterX - diodeSize / 2, diodeCenterY + diodeSize / 2 - padSize, padSize, padSize);
        ctx.fillRect(diodeCenterX + diodeSize / 2 - padSize, diodeCenterY + diodeSize / 2 - padSize, padSize, padSize);

        // Circular cup
        const cupRadius = diodeSize * 0.38;
        ctx.fillStyle = '#0A0C10';
        ctx.beginPath();
        ctx.arc(diodeCenterX, diodeCenterY, cupRadius, 0, Math.PI * 2);
        ctx.fill();

        if (isLit) {
          const glowGrad = ctx.createRadialGradient(
            diodeCenterX,
            diodeCenterY,
            1,
            diodeCenterX,
            diodeCenterY,
            cupRadius * 1.8
          );
          glowGrad.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, 0.85)`);
          glowGrad.addColorStop(0.5, `rgba(${pr}, ${pg}, ${pb}, 0.35)`);
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(diodeCenterX, diodeCenterY, cupRadius * 1.8, 0, Math.PI * 2);
          ctx.fill();

          // 3-in-1 micro-LED chips (Red, Green, Blue)
          const chipW = cupRadius * 0.45;
          const chipH = cupRadius * 0.75;
          const chipGap = 1.5;

          ctx.fillStyle = `rgb(${pr}, ${Math.round(pr * 0.1)}, ${Math.round(pr * 0.1)})`;
          ctx.fillRect(diodeCenterX - chipW - chipGap, diodeCenterY - chipH / 2, chipW, chipH);

          ctx.fillStyle = `rgb(${Math.round(pg * 0.1)}, ${pg}, ${Math.round(pg * 0.1)})`;
          ctx.fillRect(diodeCenterX - chipW / 2, diodeCenterY - chipH / 2, chipW, chipH);

          ctx.fillStyle = `rgb(${Math.round(pb * 0.1)}, ${Math.round(pb * 0.15)}, ${pb})`;
          ctx.fillRect(diodeCenterX + chipGap, diodeCenterY - chipH / 2, chipW, chipH);

          // Specular highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.beginPath();
          ctx.arc(diodeCenterX, diodeCenterY - 2, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#181C26';
          ctx.fillRect(diodeCenterX - 4, diodeCenterY - 3, 2.5, 6);
          ctx.fillRect(diodeCenterX - 1, diodeCenterY - 3, 2.5, 6);
          ctx.fillRect(diodeCenterX + 2, diodeCenterY - 3, 2.5, 6);
        }

        ctx.restore();
      }
    }

    // 2.5mm ruler
    ctx.save();
    ctx.fillStyle = '#F59E0B';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1;
    ctx.font = '9px monospace';

    const rulerX = 14;
    const rulerY = loupeH - 12;
    ctx.beginPath();
    ctx.moveTo(rulerX, rulerY);
    ctx.lineTo(rulerX + diodePitchPx, rulerY);
    ctx.moveTo(rulerX, rulerY - 3);
    ctx.lineTo(rulerX, rulerY + 3);
    ctx.moveTo(rulerX + diodePitchPx, rulerY - 3);
    ctx.lineTo(rulerX + diodePitchPx, rulerY + 3);
    ctx.stroke();
    ctx.fillText('2.5mm Pitch', rulerX + diodePitchPx + 6, rulerY + 3);
    ctx.restore();
  }, [hoveredDiode, pixelData, cols, rows]);

  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs space-y-3 select-none transition-colors">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ZoomIn className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            12x Macro Diode Loupe • SMD 1921 Hardware Inspector
          </span>
          <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold border border-blue-100 dark:border-blue-900/50">
            2.5mm Pitch
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close Loupe"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Loupe Canvas */}
        <div className="w-[280px] h-[160px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner shrink-0 relative">
          <canvas ref={loupeCanvasRef} className="w-full h-full block" />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border border-blue-400/80 -m-3" />
          </div>
        </div>

        {/* Diode Metrics */}
        <div className="flex-1 w-full space-y-2 text-[11px]">
          {hoveredDiode ? (
            <>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700/60 font-mono">
                <span className="text-slate-500 dark:text-slate-400">Matrix Diode:</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  Col {hoveredDiode.col} • Row {hoveredDiode.row} / {rows}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700/60 font-mono">
                <span className="text-slate-500 dark:text-slate-400">Luminance:</span>
                <span className={hoveredDiode.isLit ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-500'}>
                  {hoveredDiode.isLit ? `ACTIVE (${hoveredDiode.nits} Nits)` : 'UNLIT (0 Nits)'}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700/60 font-mono">
                <span className="text-slate-500 dark:text-slate-400">Subpixel Duty:</span>
                <div className="flex items-center gap-2 font-semibold">
                  <span className="text-red-500">R: {hoveredDiode.subpixelState.redDuty}%</span>
                  <span className="text-emerald-600 dark:text-emerald-400">G: {hoveredDiode.subpixelState.greenDuty}%</span>
                  <span className="text-blue-600 dark:text-blue-400">B: {hoveredDiode.subpixelState.blueDuty}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] pt-0.5">
                <span>Diode Size: 1.8 × 1.8 mm</span>
                <span>Pitch Gap: 0.7 mm louvre</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono font-medium">160,000 diodes/m²</span>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-slate-500">
              <Eye className="w-5 h-5 text-slate-300 dark:text-slate-600 mb-1" />
              <span>Hover your mouse across the taxi display above to inspect individual SMD LED diodes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const P25LedDisplay: React.FC<P25LedScreenProps> = (props) => {
  return <P25LedScreen {...props} />;
};
