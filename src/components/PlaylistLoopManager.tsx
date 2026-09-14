import React, { useState, useRef } from 'react';
import {
  Play,
  Repeat,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  Video,
  Image as ImageIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { PlaylistItem, P25DisplaySpec } from '../types';
import { DEMO_CREATIVES, DemoCreativeItem } from '../data/presets';
import { extractVideoMetadataAndKeyframes, convertSvgToPng, generatePresetVideoBlob } from '../utils/mediaUtils';

interface PlaylistLoopManagerProps {
  currentSpec: P25DisplaySpec;
  playlist: PlaylistItem[];
  activeSlotIndex: number;
  slotElapsedSec: number;
  loopCount: number;
  onSelectSlot: (index: number) => void;
  onUpdateSlot: (index: number, updatedItem: PlaylistItem) => void;
  onAddSlot: (item: PlaylistItem) => void;
  onRemoveSlot: (index: number) => void;
  onResetPlaylist: () => void;
  onSkipNext: () => void;
  onSkipPrev: () => void;
  onTriggerAudit: (item: PlaylistItem) => void;
}

export const PlaylistLoopManager: React.FC<PlaylistLoopManagerProps> = ({
  currentSpec,
  playlist,
  activeSlotIndex,
  slotElapsedSec,
  loopCount,
  onSelectSlot,
  onUpdateSlot,
  onAddSlot,
  onRemoveSlot,
  onResetPlaylist,
  onSkipNext,
  onSkipPrev,
  onTriggerAudit,
}) => {
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [isProcessingMedia, setIsProcessingMedia] = useState<boolean>(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [slotError, setSlotError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeItem = playlist[activeSlotIndex] || playlist[0];
  const timeRemaining = Math.max(0, 10.0 - slotElapsedSec);
  const progressPercent = Math.min(100, Math.max(0, (slotElapsedSec / 10.0) * 100));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.includes('video') || file.name.match(/\.(mp4|webm|mov|m4v)$/i);
    const isImage = file.type.includes('image') || file.name.match(/\.(png|jpg|jpeg|svg|webp)$/i);

    if (!isVideo && !isImage) {
      setSlotError('Unsupported file type. Please upload MP4/WebM video or PNG/JPG/SVG image.');
      return;
    }

    setIsProcessingMedia(true);
    setSlotError(null);

    try {
      if (isVideo) {
        setProcessStatus('Extracting video metadata, measuring spot duration & keyframes...');
        const videoResult = await extractVideoMetadataAndKeyframes(
          file,
          currentSpec.resolutionWidthPx,
          currentSpec.resolutionHeightPx
        );
        const objectUrl = URL.createObjectURL(file);

        const updated: PlaylistItem = {
          id: `custom-video-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          brand: 'Custom Video Ad',
          mediaType: 'video',
          mediaUrl: objectUrl,
          durationSec: Number(videoResult.duration.toFixed(1)),
          originalDurationSec: Number(videoResult.duration.toFixed(1)),
          keyframes: videoResult.keyframes,
          strobeHazard: videoResult.strobeHazard,
          thumbnailUrl: videoResult.keyframes[0]?.dataUrl || objectUrl,
          badge: videoResult.duration > 10 ? 'Long Video (>10s)' : 'DOOH Video',
        };

        if (targetIndex >= playlist.length) {
          onAddSlot(updated);
        } else {
          onUpdateSlot(targetIndex, updated);
        }
        setEditingSlotIndex(null);
      } else {
        setProcessStatus('Formatting image to display matrix...');
        const reader = new FileReader();
        reader.onload = async (ev) => {
          if (ev.target?.result) {
            let mediaUrl = ev.target.result as string;
            if (file.type.includes('svg') || file.name.endsWith('.svg')) {
              try {
                mediaUrl = await convertSvgToPng(
                  mediaUrl,
                  currentSpec.resolutionWidthPx,
                  currentSpec.resolutionHeightPx
                );
              } catch (convErr) {
                console.warn('SVG pre-render fallback:', convErr);
              }
            }

            const updated: PlaylistItem = {
              id: `custom-image-${Date.now()}`,
              name: file.name.replace(/\.[^/.]+$/, ''),
              brand: 'Custom Image Ad',
              mediaType: 'image',
              mediaUrl: mediaUrl,
              durationSec: 10.0,
              thumbnailUrl: mediaUrl,
              badge: 'Custom Ad',
            };

            if (targetIndex >= playlist.length) {
              onAddSlot(updated);
            } else {
              onUpdateSlot(targetIndex, updated);
            }
            setEditingSlotIndex(null);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Slot upload error:', err);
      setSlotError(err.message || 'Failed to process ad creative.');
    } finally {
      setIsProcessingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectPresetForSlot = async (preset: DemoCreativeItem, targetIndex: number) => {
    setIsProcessingMedia(true);
    setSlotError(null);
    setProcessStatus(`Applying ${preset.name}...`);

    try {
      let mediaUrl = preset.dataUrl;

      if (preset.mediaType === 'video') {
        try {
          const videoBlob = await generatePresetVideoBlob(preset.id);
          mediaUrl = URL.createObjectURL(videoBlob);
        } catch (vErr) {
          console.warn('Preset video synthesis fallback:', vErr);
        }
      }

      const updated: PlaylistItem = {
        id: `preset-${preset.id}-${Date.now()}`,
        name: preset.name,
        brand: preset.brand,
        mediaType: preset.mediaType,
        mediaUrl: mediaUrl,
        durationSec: preset.durationSec || (preset.mediaType === 'video' ? 6.0 : 10.0),
        originalDurationSec: preset.durationSec,
        strobeHazard: preset.strobeHazard,
        thumbnailUrl: preset.dataUrl,
        contrastProfile: preset.contrastProfile,
        badge: preset.badge,
      };

      if (targetIndex >= playlist.length) {
        onAddSlot(updated);
      } else {
        onUpdateSlot(targetIndex, updated);
      }
      setEditingSlotIndex(null);
    } catch (err: any) {
      console.error('Preset slot update error:', err);
      setSlotError(err.message || 'Failed to apply preset.');
    } finally {
      setIsProcessingMedia(false);
    }
  };

  return (
    <div id="playlist-loop-manager" className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-100/80 dark:border-slate-800 transition-colors space-y-5">
      {/* Top Banner: Active Loop State & 10s Spot Countdown */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-sky-50/80 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-sky-950/40 border border-blue-100 dark:border-blue-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Repeat className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  6-Ad DOOH Rotation Loop
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold">
                  Loop #{loopCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Playing Spot {activeSlotIndex + 1} of {playlist.length}: <strong className="text-slate-900 dark:text-slate-200">{activeItem?.name}</strong>
              </p>
            </div>
          </div>

          {/* Skip / Nav Controls */}
          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <button
              id="playlist-prev-btn"
              type="button"
              onClick={onSkipPrev}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
              title="Previous Ad Spot"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="playlist-next-btn"
              type="button"
              onClick={onSkipNext}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
              title="Skip to Next Ad Spot"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              id="playlist-restart-btn"
              type="button"
              onClick={onResetPlaylist}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Reset to Default 6 Ads"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Loop</span>
            </button>
          </div>
        </div>

        {/* 10-Second Precision Countdown Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                10.0s Display Window
              </span>
              {activeItem?.mediaType === 'video' && (activeItem.originalDurationSec || 0) > 10 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-medium">
                  {activeItem.originalDurationSec}s video (cuts at 10s)
                </span>
              )}
            </div>
            <div className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300">
              {slotElapsedSec.toFixed(1)}s / 10.0s ({timeRemaining.toFixed(1)}s remaining)
            </div>
          </div>

          {/* Progress fill */}
          <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 h-2.5 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-100 ease-linear shadow-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
            <span>Each ad displays for exactly 10s</span>
            <span>Loop seamlessly restarts after Spot {playlist.length}</span>
          </div>
        </div>
      </div>

      {/* Playlist Grid Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Ad Loop Queue ({playlist.length}/6 Spots)</span>
            <span className="text-xs font-normal text-slate-400">
              • Click any slot to play immediately or replace creative
            </span>
          </h3>
        </div>

        {playlist.length < 6 && (
          <button
            type="button"
            onClick={() => setEditingSlotIndex(playlist.length)}
            className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slot ({6 - playlist.length} left)</span>
          </button>
        )}
      </div>

      {/* 6 Ad Slots Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {playlist.map((item, index) => {
          const isActive = index === activeSlotIndex;
          const isOverTen = item.mediaType === 'video' && (item.originalDurationSec || 0) > 10;

          return (
            <div
              key={item.id || index}
              id={`playlist-slot-${index + 1}`}
              onClick={() => onSelectSlot(index)}
              className={`relative rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              {/* Slot Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                    Spot #{index + 1}
                  </span>
                </div>

                {isActive ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE ({timeRemaining.toFixed(0)}s)
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">Queued</span>
                )}
              </div>

              {/* Thumbnail Preview Area */}
              <div
                className="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center mb-2.5 shadow-2xs"
                style={{ aspectRatio: `${currentSpec.resolutionWidthPx} / ${currentSpec.resolutionHeightPx}` }}
              >
                {item.thumbnailUrl || item.mediaUrl ? (
                  <img
                    src={item.thumbnailUrl || item.mediaUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-500 text-xs">No preview</div>
                )}

                {/* Media Type Badge */}
                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded-md text-[9px] font-mono text-white">
                  {item.mediaType === 'video' ? (
                    <>
                      <Video className="w-2.5 h-2.5 text-blue-400" />
                      <span>{item.originalDurationSec ? `${item.originalDurationSec}s Video` : 'Video'}</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-2.5 h-2.5 text-purple-400" />
                      <span>10s Image</span>
                    </>
                  )}
                </div>

                {/* Over-10s Skip Warning Tag */}
                {isOverTen && (
                  <div className="absolute top-1.5 right-1.5 bg-amber-500/90 text-slate-950 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono shadow-xs">
                    Skips @10s
                  </div>
                )}
              </div>

              {/* Title & Brand */}
              <div className="mb-2">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {item.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {item.brand || 'DOOH Campaign'}
                </div>
              </div>

              {/* Slot Action Buttons */}
              <div className="flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-700/60" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setEditingSlotIndex(index)}
                  className="flex-1 py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition-colors"
                >
                  Replace Ad
                </button>

                <button
                  type="button"
                  onClick={() => onTriggerAudit(item)}
                  className="p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 transition-colors"
                  title="Run AI DOOH Audit on this ad"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>

                {playlist.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveSlot(index)}
                    className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-500 transition-colors"
                    title="Remove this slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Replace / Upload Ad for Slot */}
      {editingSlotIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {editingSlotIndex < playlist.length
                    ? `Replace Spot #${editingSlotIndex + 1}`
                    : `Add Spot #${editingSlotIndex + 1}`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload an image or video, or choose a preset. Will display for 10 seconds.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlotIndex(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {slotError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{slotError}</span>
              </div>
            )}

            {isProcessingMedia && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>{processStatus || 'Processing media...'}</span>
              </div>
            )}

            {/* Option 1: File Upload */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Option 1: Upload Your Image or Video
              </span>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all"
              >
                <UploadCloud className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Click to select ad file (MP4, WebM, PNG, JPG, SVG)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Target: {currentSpec.resolutionWidthPx}×{currentSpec.resolutionHeightPx} • Up to 100MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.mp4,.webm,.mov,.svg"
                  onChange={(e) => handleFileUpload(e, editingSlotIndex)}
                  className="hidden"
                />
              </div>
            </div>

            {/* Option 2: Select From Preset Creatives */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Option 2: Pick from Sample DOOH Creatives
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEMO_CREATIVES.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPresetForSlot(preset, editingSlotIndex)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all flex items-center gap-3"
                  >
                    <div
                      className="w-16 h-8 rounded-lg overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center"
                    >
                      <img src={preset.dataUrl} alt={preset.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {preset.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span>{preset.mediaType === 'video' ? `Video (${preset.durationSec}s)` : 'Image'}</span>
                        <span>•</span>
                        <span>{preset.badge}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSlotIndex(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
