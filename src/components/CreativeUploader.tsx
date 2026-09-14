import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Video as VideoIcon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Clock,
  Film,
  XCircle,
} from 'lucide-react';
import { DEMO_CREATIVES, DemoCreativeItem } from '../data/presets';
import { P25DisplaySpec, VideoKeyframe } from '../types';
import {
  convertSvgToPng,
  extractVideoMetadataAndKeyframes,
  generatePresetVideoBlob,
} from '../utils/mediaUtils';

interface CreativeUploaderProps {
  currentSpec: P25DisplaySpec;
  currentMedia: string | null;
  currentMediaName: string;
  mediaType: 'image' | 'video';
  videoDuration?: number;
  keyframes?: VideoKeyframe[];
  strobeHazard?: boolean;
  isAnalyzing: boolean;
  onMediaSelected: (params: {
    mediaUrl: string;
    name: string;
    mediaType: 'image' | 'video';
    durationSec?: number;
    keyframes?: VideoKeyframe[];
    strobeHazard?: boolean;
  }) => void;
  onTriggerAnalysis: () => void;
}

export const CreativeUploader: React.FC<CreativeUploaderProps> = ({
  currentSpec,
  currentMedia,
  currentMediaName,
  mediaType,
  videoDuration,
  keyframes = [],
  strobeHazard,
  isAnalyzing,
  onMediaSelected,
  onTriggerAnalysis,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'video' | 'image'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setUploadError(null);
    const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|ogg)$/i);
    const isImage = file.type.startsWith('image/') || file.name.match(/\.(png|jpe?g|webp|svg)$/i);

    if (!isVideo && !isImage) {
      setUploadError('Unsupported file format. Please upload DOOH video (MP4, WebM) or high-res image (PNG, JPG, SVG).');
      return;
    }

    setIsProcessingMedia(true);

    try {
      if (isVideo) {
        setProcessingStatusText('Extracting video frames, measuring spot duration & safety strobe rate...');
        const videoResult = await extractVideoMetadataAndKeyframes(
          file,
          currentSpec.resolutionWidthPx,
          currentSpec.resolutionHeightPx
        );

        const objectUrl = URL.createObjectURL(file);
        onMediaSelected({
          mediaUrl: objectUrl,
          name: file.name,
          mediaType: 'video',
          durationSec: Number(videoResult.duration.toFixed(1)),
          keyframes: videoResult.keyframes,
          strobeHazard: videoResult.strobeHazard,
        });
      } else {
        setProcessingStatusText('Normalizing creative to 128px LED display matrix...');
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            let dataUrl = event.target.result as string;
            if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
              dataUrl = await convertSvgToPng(dataUrl, currentSpec.resolutionWidthPx, currentSpec.resolutionHeightPx);
            }
            onMediaSelected({
              mediaUrl: dataUrl,
              name: file.name,
              mediaType: 'image',
            });
            setIsProcessingMedia(false);
          }
        };
        reader.readAsDataURL(file);
        return; // Return early as reader onload handles state
      }
    } catch (err: any) {
      console.error('Error processing media file:', err);
      setUploadError(err.message || 'Could not process media file.');
    } finally {
      setIsProcessingMedia(false);
      setProcessingStatusText('');
    }
  };

  const handleSelectPreset = async (preset: DemoCreativeItem) => {
    setUploadError(null);

    if (preset.mediaType === 'video') {
      setIsProcessingMedia(true);
      setProcessingStatusText(`Generating dynamic ${preset.durationSec || 6}s DOOH video loop...`);
      try {
        const videoBlob = await generatePresetVideoBlob(
          preset.id,
          preset.durationSec || 6,
          currentSpec.resolutionWidthPx,
          currentSpec.resolutionHeightPx
        );

        const videoUrl = URL.createObjectURL(videoBlob);
        const videoResult = await extractVideoMetadataAndKeyframes(
          videoBlob,
          currentSpec.resolutionWidthPx,
          currentSpec.resolutionHeightPx
        );

        onMediaSelected({
          mediaUrl: videoUrl,
          name: preset.name,
          mediaType: 'video',
          durationSec: preset.durationSec || Number(videoResult.duration.toFixed(1)),
          keyframes: videoResult.keyframes,
          strobeHazard: preset.id === 'video-strobe-warning' || videoResult.strobeHazard,
        });
      } catch (err) {
        console.warn('MediaRecorder error, falling back to static poster keyframe:', err);
        // Fallback for environments where MediaRecorder is restricted
        onMediaSelected({
          mediaUrl: preset.dataUrl,
          name: preset.name,
          mediaType: 'video',
          durationSec: preset.durationSec || 6.0,
          keyframes: [
            { timestampSec: 0.5, label: '0.5s Hook', base64: preset.dataUrl },
            { timestampSec: 3.0, label: '3.0s Core', base64: preset.dataUrl },
            { timestampSec: 5.5, label: '5.5s CTA', base64: preset.dataUrl },
          ],
          strobeHazard: preset.id === 'video-strobe-warning',
        });
      } finally {
        setIsProcessingMedia(false);
        setProcessingStatusText('');
      }
    } else {
      onMediaSelected({
        mediaUrl: preset.dataUrl,
        name: preset.name,
        mediaType: 'image',
      });
    }
  };

  const filteredPresets = DEMO_CREATIVES.filter((item) => {
    if (filterTab === 'video') return item.mediaType === 'video';
    if (filterTab === 'image') return item.mediaType === 'image';
    return true;
  });

  return (
    <div id="creative-uploader-card" className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-amber-400" />
            Upload Ad Creative to DAMS (Image or Video)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Target Canvas: <span className="font-mono text-amber-300 font-semibold">{currentSpec.resolutionWidthPx}×{currentSpec.resolutionHeightPx} px</span> ({currentSpec.aspectRatioLabel}) for Yaham P2.5 LED
          </p>
        </div>

        {currentMedia && (
          <button
            id="run-ai-analysis-btn"
            type="button"
            onClick={onTriggerAnalysis}
            disabled={isAnalyzing || isProcessingMedia}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Auditing Creative...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run Instant AI Audit</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-rose-400 hover:text-rose-200"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Upload Dropzone */}
      <div
        id="creative-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessingMedia && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,video/mp4,video/webm,video/ogg,video/quicktime"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {isProcessingMedia ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-xs font-semibold text-white">{processingStatusText}</p>
            <p className="text-[11px] text-slate-400">Inspecting 128px matrix compliance &amp; safety standards</p>
          </div>
        ) : currentMedia ? (
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-2xl bg-black rounded-lg p-2 border border-slate-800 overflow-hidden shadow-inner">
              {mediaType === 'video' ? (
                <video
                  src={currentMedia}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-20 object-contain mx-auto"
                />
              ) : (
                <img
                  src={currentMedia}
                  alt="Uploaded Creative"
                  className="w-full h-20 object-contain mx-auto"
                  style={{ imageRendering: 'pixelated' }}
                />
              )}

              {/* Status Badges */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                {mediaType === 'video' ? (
                  <>
                    <span className="bg-sky-950 text-sky-300 font-mono text-[10px] px-2 py-0.5 rounded border border-sky-800/80 flex items-center gap-1">
                      <Film className="w-3 h-3" />
                      {videoDuration ? `${videoDuration}s DOOH Spot` : 'Video Loop'}
                    </span>
                    {strobeHazard && (
                      <span className="bg-rose-950 text-rose-300 font-mono text-[10px] px-2 py-0.5 rounded border border-rose-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Strobe Alert
                      </span>
                    )}
                  </>
                ) : (
                  <span className="bg-slate-900/90 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-700">
                    Static Creative
                  </span>
                )}
              </div>
            </div>

            {/* Keyframes Filmstrip preview if video */}
            {mediaType === 'video' && keyframes.length > 0 && (
              <div className="w-full max-w-2xl mt-3 p-2 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 shrink-0">
                  <Film className="w-3 h-3 text-amber-400" />
                  Keyframes Analyzed:
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {keyframes.map((kf, idx) => (
                    <div key={idx} className="relative rounded overflow-hidden border border-slate-700 w-24 h-7 shrink-0 bg-black">
                      <img src={kf.base64} alt={kf.label} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 bg-black/80 px-1 text-[8px] font-mono text-white">
                        {kf.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-white">{currentMediaName}</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-400 hover:underline">Click to change creative or drop video</span>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-amber-400 mx-auto flex items-center justify-center mb-2">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-200">
              Drag &amp; drop brand ad creative here (Image or Video), or <span className="text-amber-400 underline">browse</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports MP4, WebM, PNG, JPG, SVG • Recommended: {currentSpec.resolutionWidthPx}×{currentSpec.resolutionHeightPx} px (6s-10s video spot)
            </p>
          </div>
        )}
      </div>

      {/* 1-Click Preset Test Ads with Filter Tabs */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-300">
              Or Test Ready-to-Audit Brand Creatives:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">(1-Click Pre-Flight)</span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-2 py-0.5 rounded transition-all ${
                filterTab === 'all' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('video')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                filterTab === 'video' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <VideoIcon className="w-3 h-3" />
              <span>DOOH Videos</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('image')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                filterTab === 'image' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Static</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredPresets.map((preset) => {
            const isCurrent = currentMediaName === preset.name;
            const isVideoPreset = preset.mediaType === 'video';

            return (
              <button
                id={`preset-${preset.id}`}
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/30'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono flex items-center gap-1 ${
                      preset.id === 'luxury-low-contrast'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                        : preset.id === 'video-strobe-warning'
                        ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
                        : preset.id === 'video-cyberbolt'
                        ? 'bg-sky-950 text-sky-300 border border-sky-700'
                        : preset.id === 'bold-energy-drink'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isVideoPreset ? <Film className="w-2.5 h-2.5" /> : null}
                    {preset.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {isVideoPreset ? `${preset.durationSec}s loop` : `${preset.wordCount} words`}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white truncate">{preset.name}</div>
                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {preset.expectedResultHeadline}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

