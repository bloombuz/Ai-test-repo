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
      setUploadError('Unsupported file format. Please upload DOOH video (MP4, WebM) or image (PNG, JPG, SVG).');
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
            const rawResult = event.target.result as string;

            if (file.type.includes('svg') || file.name.endsWith('.svg')) {
              try {
                const pngDataUrl = await convertSvgToPng(
                  rawResult,
                  currentSpec.resolutionWidthPx,
                  currentSpec.resolutionHeightPx
                );
                onMediaSelected({
                  mediaUrl: pngDataUrl,
                  name: file.name,
                  mediaType: 'image',
                });
              } catch (svgErr) {
                console.warn('SVG raster fallback:', svgErr);
                onMediaSelected({
                  mediaUrl: rawResult,
                  name: file.name,
                  mediaType: 'image',
                });
              }
            } else {
              onMediaSelected({
                mediaUrl: rawResult,
                name: file.name,
                mediaType: 'image',
              });
            }
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Error processing media file:', err);
      setUploadError(err.message || 'Failed to process creative media file');
    } finally {
      setIsProcessingMedia(false);
    }
  };

  const handleSelectPreset = async (preset: DemoCreativeItem) => {
    setUploadError(null);

    if (preset.mediaType === 'video') {
      setIsProcessingMedia(true);
      setProcessingStatusText('Synthesizing DOOH keyframes & motion pacing test...');
      try {
        const videoBlob = await generatePresetVideoBlob(preset.id);
        const objectUrl = URL.createObjectURL(videoBlob);

        const mockKeyframes: VideoKeyframe[] = [
          { timestampSec: 0.5, label: '0.5s Opening Hook', dataUrl: preset.dataUrl, base64: preset.dataUrl },
          { timestampSec: (preset.durationSec || 6) / 2, label: 'Key Message', dataUrl: preset.dataUrl, base64: preset.dataUrl },
          { timestampSec: (preset.durationSec || 6) - 0.5, label: 'Call-to-Action', dataUrl: preset.dataUrl, base64: preset.dataUrl },
        ];

        onMediaSelected({
          mediaUrl: objectUrl,
          name: preset.name,
          mediaType: 'video',
          durationSec: preset.durationSec || 6.0,
          keyframes: mockKeyframes,
          strobeHazard: preset.strobeHazard,
        });
      } catch (err: any) {
        console.warn('Preset video playback fallback:', err);
        onMediaSelected({
          mediaUrl: preset.dataUrl,
          name: preset.name,
          mediaType: 'image',
        });
      } finally {
        setIsProcessingMedia(false);
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
    <div id="creative-uploader-card" className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-100/80 dark:border-slate-800 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Upload Ad Creative (DOOH Video or Image)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Target Canvas: <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{currentSpec.resolutionWidthPx}×{currentSpec.resolutionHeightPx} px</span> ({currentSpec.aspectRatioLabel}) for Yaham P2.5
          </p>
        </div>

        {currentMedia && (
          <button
            id="run-ai-analysis-btn"
            type="button"
            onClick={onTriggerAnalysis}
            disabled={isAnalyzing || isProcessingMedia}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Auditing...</span>
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
        <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-200"
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
        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30'
            : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/40 dark:bg-slate-800/20 hover:bg-blue-50/20 dark:hover:bg-slate-800/40'
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
            <RefreshCw className="w-7 h-7 text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{processingStatusText}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Inspecting 128px matrix compliance &amp; safety standards</p>
          </div>
        ) : currentMedia ? (
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-2xl bg-slate-950 rounded-xl p-2 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner">
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
                    <span className="bg-blue-600 text-white font-medium text-[10px] px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                      <Film className="w-3 h-3" />
                      {videoDuration ? `${videoDuration}s DOOH Spot` : 'Video Loop'}
                    </span>
                    {strobeHazard && (
                      <span className="bg-rose-500 text-white font-medium text-[10px] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Strobe Alert
                      </span>
                    )}
                  </>
                ) : (
                  <span className="bg-slate-900/80 text-white font-medium text-[10px] px-2.5 py-0.5 rounded-full">
                    Static Display
                  </span>
                )}
              </div>
            </div>

            {/* Keyframes Filmstrip preview if video */}
            {mediaType === 'video' && keyframes.length > 0 && (
              <div className="w-full max-w-2xl mt-3 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2 shadow-xs">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                  <Film className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Keyframes:
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {keyframes.map((kf, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 w-24 h-7 shrink-0 bg-black">
                      <img src={kf.base64} alt={kf.label} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 right-0 bg-black/80 px-1 text-[8px] font-mono text-white">
                        {kf.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{currentMediaName}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Click or drop new file to replace</span>
            </div>
          </div>
        ) : (
          <div className="py-5">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-2.5">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Drag &amp; drop ad creative here (Image or Video), or <span className="text-blue-600 dark:text-blue-400 underline">browse</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Supports MP4, WebM, PNG, JPG, SVG • Recommended: {currentSpec.resolutionWidthPx}×{currentSpec.resolutionHeightPx} px (6s-10s video spot)
            </p>
          </div>
        )}
      </div>

      {/* 1-Click Preset Test Ads with Filter Tabs */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Or Test Sample DOOH Creatives:
            </span>
          </div>

          {/* Filter Tabs matching HYGH clean pill aesthetics */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded-full transition-all ${
                filterTab === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('video')}
              className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all ${
                filterTab === 'video' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <VideoIcon className="w-3 h-3" />
              <span>DOOH Videos</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('image')}
              className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all ${
                filterTab === 'image' ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Static</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredPresets.map((preset) => {
            const isCurrent = currentMediaName === preset.name;
            const isVideoPreset = preset.mediaType === 'video';

            return (
              <button
                id={`preset-${preset.id}`}
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  isCurrent
                    ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-600 dark:border-blue-500 shadow-xs ring-1 ring-blue-600/20'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono flex items-center gap-1 ${
                      preset.id === 'luxury-low-contrast'
                        ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50'
                        : preset.id === 'video-strobe-warning'
                        ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200/50 dark:border-rose-900/50'
                        : preset.id === 'video-cyberbolt'
                        ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50'
                        : preset.id === 'bold-energy-drink'
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50'
                    }`}
                  >
                    {isVideoPreset ? <Film className="w-2.5 h-2.5" /> : null}
                    {preset.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {isVideoPreset ? `${preset.durationSec}s spot` : `${preset.wordCount} words`}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{preset.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
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
