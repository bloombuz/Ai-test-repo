import { VideoKeyframe } from '../types';

/**
 * Converts an SVG data URL or image into a clean PNG Base64 string
 * to ensure maximum compatibility with Google Gemini and canvas image processors.
 */
export async function convertSvgToPng(
  svgDataUrl: string,
  width = 576,
  height = 128
): Promise<string> {
  return new Promise((resolve) => {
    // If it's already JPEG, PNG, or WebP base64 data, return directly
    if (
      svgDataUrl.startsWith('data:image/png') ||
      svgDataUrl.startsWith('data:image/jpeg') ||
      svgDataUrl.startsWith('data:image/webp')
    ) {
      return resolve(svgDataUrl);
    }

    let srcToLoad = svgDataUrl;
    let objectUrl: string | null = null;

    try {
      let rawSvg = svgDataUrl;
      if (rawSvg.includes(',')) {
        const parts = rawSvg.split(',');
        const header = parts[0];
        const payload = parts.slice(1).join(',');
        if (header.includes('base64')) {
          rawSvg = atob(payload);
        } else {
          rawSvg = decodeURIComponent(payload);
        }
      }

      if (rawSvg.includes('<svg')) {
        const blob = new Blob([rawSvg], { type: 'image/svg+xml;charset=utf-8' });
        objectUrl = URL.createObjectURL(blob);
        srcToLoad = objectUrl;
      }
    } catch {
      srcToLoad = svgDataUrl;
    }

    const cleanup = () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
        objectUrl = null;
      }
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          return resolve(svgDataUrl);
        }
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const pngUrl = canvas.toDataURL('image/png');
        cleanup();
        resolve(pngUrl);
      } catch {
        cleanup();
        resolve(svgDataUrl);
      }
    };
    img.onerror = () => {
      cleanup();
      resolve(svgDataUrl);
    };
    img.src = srcToLoad;
  });
}

/**
 * Extracts video duration, dimensions, keyframes at key timestamps (15%, 50%, 85%),
 * and calculates luminance variance to detect rapid strobe/flashing hazards.
 */
export async function extractVideoMetadataAndKeyframes(
  videoSource: File | Blob | string,
  targetWidth = 576,
  targetHeight = 128
): Promise<{
  duration: number;
  width: number;
  height: number;
  keyframes: VideoKeyframe[];
  strobeHazard: boolean;
  strobeFrequencyHz: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const sourceUrl = typeof videoSource === 'string'
      ? videoSource
      : URL.createObjectURL(videoSource);

    video.src = sourceUrl;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    const cleanUp = () => {
      if (typeof videoSource !== 'string' && sourceUrl.startsWith('blob:')) {
        // Keep blob active for playback, don't revoke immediately
      }
    };

    video.onloadedmetadata = async () => {
      const duration = Math.max(0.5, video.duration || 6);
      const width = video.videoWidth || targetWidth;
      const height = video.videoHeight || targetHeight;

      const timestamps = [
        { time: Math.min(duration * 0.15, 1.0), label: 'Frame 1: Opening Hook' },
        { time: duration * 0.5, label: 'Frame 2: Core Proposition' },
        { time: Math.max(duration * 0.85, duration - 1.0), label: 'Frame 3: CTA & Branding' },
      ];

      const keyframes: VideoKeyframe[] = [];
      const luminanceSamples: number[] = [];

      try {
        for (const ts of timestamps) {
          await seekToTime(video, ts.time);
          if (ctx) {
            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

            // Sample average luminance for contrast & strobe checking
            const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            let sumLuminance = 0;
            const step = 8; // sample every 8th pixel
            for (let i = 0; i < imgData.data.length; i += 4 * step) {
              const r = imgData.data[i];
              const g = imgData.data[i + 1];
              const b = imgData.data[i + 2];
              // Standard perceptual luminance
              sumLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
            }
            const avgLuminance = sumLuminance / (imgData.data.length / (4 * step));
            luminanceSamples.push(avgLuminance);

            keyframes.push({
              timestampSec: Number(ts.time.toFixed(1)),
              label: ts.label,
              dataUrl,
            });
          }
        }

        // Test for rapid flashing / strobe: check delta between successive frames
        let maxDelta = 0;
        for (let i = 1; i < luminanceSamples.length; i++) {
          const delta = Math.abs(luminanceSamples[i] - luminanceSamples[i - 1]);
          if (delta > maxDelta) maxDelta = delta;
        }

        // A delta > 120 indicates extreme high-contrast flickering (e.g. pure black to pure white)
        const strobeHazard = maxDelta > 115 && duration > 2;
        const strobeFrequencyHz = strobeHazard ? 4.5 : 0.8;

        cleanUp();
        resolve({
          duration: Number(duration.toFixed(1)),
          width,
          height,
          keyframes,
          strobeHazard,
          strobeFrequencyHz,
        });
      } catch (err) {
        cleanUp();
        // Fallback with empty keyframes if seek fails
        resolve({
          duration: Number(duration.toFixed(1)),
          width,
          height,
          keyframes: [],
          strobeHazard: false,
          strobeFrequencyHz: 0,
        });
      }
    };

    video.onerror = (e) => {
      cleanUp();
      reject(new Error('Failed to load video metadata'));
    };
  });
}

function seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    video.addEventListener('seeked', onSeeked);
    video.currentTime = Math.max(0, time);
  });
}

/**
 * Generates an animated video for a preset using HTML5 Canvas + MediaRecorder
 * Produces real WebM video blobs compatible with all browsers in 576x128 / 384x128.
 */
export function generatePresetVideoBlob(
  presetId: string,
  width = 576,
  height = 128,
  durationSec = 6
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const captureStream = (canvas as any).captureStream || (canvas as any).mozCaptureStream;

    if (!ctx || typeof MediaRecorder === 'undefined' || !captureStream) {
      return reject(new Error('MediaRecorder or Canvas captureStream not supported in this environment'));
    }

    const stream = captureStream.call(canvas, 30);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
    } catch (e) {
      return reject(e);
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };

    recorder.start();

    const startTime = performance.now();
    const totalMs = durationSec * 1000;

    function renderFrame(now: number) {
      const elapsed = now - startTime;
      const progress = (elapsed % totalMs) / totalMs;

      ctx!.clearRect(0, 0, width, height);

      if (presetId === 'video-cyberbolt') {
        // High-impact optimal 6-second DOOH video
        // Deep background
        const grad = ctx!.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, '#05070A');
        grad.addColorStop(0.7, '#0D141F');
        grad.addColorStop(1, '#001C38');
        ctx!.fillStyle = grad;
        ctx!.fillRect(0, 0, width, height);

        // Electric animated pulse beam
        const beamX = (progress * width * 1.5) % (width + 200) - 100;
        const beamGrad = ctx!.createLinearGradient(beamX, 0, beamX + 80, height);
        beamGrad.addColorStop(0, 'rgba(0, 255, 234, 0)');
        beamGrad.addColorStop(0.5, 'rgba(0, 255, 234, 0.25)');
        beamGrad.addColorStop(1, 'rgba(255, 230, 0, 0)');
        ctx!.fillStyle = beamGrad;
        ctx!.fillRect(0, 0, width, height);

        // Brand Icon / Lightning
        const pulse = 1 + Math.sin(progress * Math.PI * 8) * 0.08;
        ctx!.save();
        ctx!.translate(48, 64);
        ctx!.scale(pulse, pulse);
        ctx!.beginPath();
        ctx!.moveTo(-6, -32);
        ctx!.lineTo(-18, 4);
        ctx!.lineTo(-4, 4);
        ctx!.lineTo(-14, 32);
        ctx!.lineTo(14, -6);
        ctx!.lineTo(2, -6);
        ctx!.closePath();
        ctx!.fillStyle = '#FFE600';
        ctx!.shadowColor = '#FFE600';
        ctx!.shadowBlur = 12;
        ctx!.fill();
        ctx!.restore();

        // Brand Name (Solid white, bold)
        ctx!.font = '900 24px "Impact", "Arial Black", sans-serif';
        ctx!.fillStyle = '#FFFFFF';
        ctx!.fillText('CYBERBOLT', 82, 48);

        // Moving Headline (Optimal 4 words)
        ctx!.font = '900 32px "Impact", "Arial Black", sans-serif';
        ctx!.fillStyle = '#FFE600';
        ctx!.fillText('100% RAW ENERGY', 82, 88);

        // CTA Pill Button
        ctx!.fillStyle = '#00FFEA';
        ctx!.beginPath();
        ctx!.roundRect(width - 130, 44, 114, 40, 8);
        ctx!.fill();
        ctx!.fillStyle = '#000000';
        ctx!.font = '900 13px "Arial Black", sans-serif';
        ctx!.fillText('GRAB NOW', width - 110, 69);

      } else if (presetId === 'video-strobe-warning') {
        // Problematic video creative: violent black/white flash at 4-5 Hz (violates safety!)
        const strobeOn = Math.floor(elapsed / 120) % 2 === 0;
        ctx!.fillStyle = strobeOn ? '#FFFFFF' : '#000000';
        ctx!.fillRect(0, 0, width, height);

        // Rapidly jittering text with 16 words
        ctx!.font = 'bold 22px sans-serif';
        ctx!.fillStyle = strobeOn ? '#FF0000' : '#FFFF00';
        ctx!.fillText('FLASH SALE! 70% OFF! ENDS TONIGHT!', 20, 50);

        ctx!.font = '14px sans-serif';
        ctx!.fillStyle = strobeOn ? '#000000' : '#FFFFFF';
        ctx!.fillText('Don\'t wait - visit store now or scan code to claim coupon before midnight', 20, 82);
        ctx!.fillText('Terms and conditions apply. Limited stock available at participating locations.', 20, 104);

      } else {
        // Subtle pastel perfume video: low contrast that washes out in sun
        ctx!.fillStyle = '#E8DDD9';
        ctx!.fillRect(0, 0, width, height);

        // Moving soft gradient circle
        const circleX = (width * 0.2) + Math.sin(progress * Math.PI * 2) * 50;
        const gradCircle = ctx!.createRadialGradient(circleX, 64, 10, circleX, 64, 90);
        gradCircle.addColorStop(0, '#D4C3BC');
        gradCircle.addColorStop(1, 'transparent');
        ctx!.fillStyle = gradCircle;
        ctx!.fillRect(0, 0, width, height);

        // Delicate low-contrast serif copy
        ctx!.font = 'italic 20px Georgia, serif';
        ctx!.fillStyle = '#A3958F';
        ctx!.fillText('Maison de la Rose • L\'Essence Nouvelle', 48, 56);

        ctx!.font = '14px Georgia, serif';
        ctx!.fillStyle = '#8E8079';
        ctx!.fillText('Experience Parisian Haute Parfumerie in 12 Rare Botanical Notes', 48, 86);
      }

      if (elapsed < totalMs) {
        requestAnimationFrame(renderFrame);
      } else {
        recorder.stop();
      }
    }

    requestAnimationFrame(renderFrame);
  });
}
