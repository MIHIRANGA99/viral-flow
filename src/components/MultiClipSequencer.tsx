import React, { useRef } from 'react';
import { Layers, ArrowUp, ArrowDown, Trash2, Plus, Sparkles, Clock, X } from 'lucide-react';
import type { VideoMetadata } from '../types';

interface MultiClipSequencerProps {
  clips: VideoMetadata[];
  onClipsChange: (newClips: VideoMetadata[]) => void;
  onCombineAndProceed: () => void;
  onCancel: () => void;
  onAddMoreFiles: (files: FileList | File[]) => void;
  isProcessing?: boolean;
}

export const MultiClipSequencer: React.FC<MultiClipSequencerProps> = ({
  clips,
  onClipsChange,
  onCombineAndProceed,
  onCancel,
  onAddMoreFiles,
  isProcessing = false,
}) => {
  const addFilesInputRef = useRef<HTMLInputElement>(null);

  const totalDuration = clips.reduce((acc, c) => acc + (c.duration || 10), 0);

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...clips];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onClipsChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index >= clips.length - 1) return;
    const updated = [...clips];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onClipsChange(updated);
  };

  const handleRemove = (index: number) => {
    const updated = clips.filter((_, i) => i !== index);
    onClipsChange(updated);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddMoreFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Hidden File Input for Adding More Clips */}
      <input
        type="file"
        ref={addFilesInputRef}
        onChange={handleFileInputChange}
        multiple
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/*"
        className="hidden"
      />

      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-[1.5px] shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-amber-400">
                <Layers className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  Multi-Clip Reel Sequencer
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                  {clips.length} Clips Loaded
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Arrange clips in chronological order. They will be stitched into a unified master reel.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer self-end sm:self-auto"
            title="Cancel and pick single video"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clip Sequence List */}
        <div className="space-y-3 pt-2">
          {clips.map((clip, idx) => (
            <div
              key={clip.objectUrl || idx}
              className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition"
            >
              {/* Left: Index badge & thumbnail preview */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-amber-400 shrink-0">
                  #{idx + 1}
                </div>

                <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-xl bg-black border border-slate-800 overflow-hidden relative shrink-0 flex items-center justify-center">
                  <video
                    src={clip.objectUrl}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                  />
                  <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px] sm:max-w-[320px]">
                    {clip.name}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-amber-300">
                      <Clock className="w-3 h-3" />
                      {clip.duration.toFixed(1)}s
                    </span>
                    <span>•</span>
                    <span className="text-slate-400 truncate">{clip.aspectRatio}</span>
                  </div>
                </div>
              </div>

              {/* Right: Reorder and Delete controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0 || isProcessing}
                  onClick={() => handleMoveUp(idx)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={idx === clips.length - 1 || isProcessing}
                  onClick={() => handleMoveDown(idx)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={clips.length <= 1 || isProcessing}
                  onClick={() => handleRemove(idx)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-30 text-rose-400 transition cursor-pointer"
                  title="Remove Clip"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add More Clips Button */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => addFilesInputRef.current?.click()}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Add More Clips to Sequence</span>
        </button>

        {/* Bottom Total & Execution Action Bar */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
              Total Duration: <strong className="text-white font-mono text-sm">{totalDuration.toFixed(1)}s</strong>
            </div>
            <div className="text-slate-400 hidden sm:block">
              {clips.map((c) => `${c.duration.toFixed(0)}s`).join(' + ')}
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="py-3 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={clips.length === 0 || isProcessing}
              onClick={onCombineAndProceed}
              className="flex-1 sm:flex-initial py-3 px-6 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Combine & Open Reel ({totalDuration.toFixed(0)}s)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
