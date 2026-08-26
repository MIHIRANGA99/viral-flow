import React from 'react';
import { Scissors, Sliders, Clock, Layers } from 'lucide-react';
import type { TransitionConfig } from '../../types/studio';

interface VideoSplitterControlsProps {
  duration: number;
  chunkThreshold: number; // in seconds
  onChunkThresholdChange: (threshold: number) => void;
  transitionConfig: TransitionConfig;
  onTransitionChange: (config: TransitionConfig) => void;
  totalClipsCount: number;
}

export const VideoSplitterControls: React.FC<VideoSplitterControlsProps> = ({
  duration,
  chunkThreshold,
  onChunkThresholdChange,
  transitionConfig,
  onTransitionChange,
  totalClipsCount,
}) => {
  const presetThresholds = [
    { label: '3 Min (Shorts)', value: 180 },
    { label: '5 Min (Clips)', value: 300 },
    { label: '8 Min (Standard Default)', value: 480 },
    { label: '10 Min (Episodes)', value: 600 },
  ];

  return (
    <div className="cinema-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="flex items-center justify-between pb-5 border-b border-amber-500/20">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Scissors className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white font-mono tracking-tight">Timeline Split Thresholds</h3>
            <p className="text-xs text-zinc-400">
              Cut master footage into calibrated parts with broadcast fade dissolves
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-2xl">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-amber-300 font-mono">
            {totalClipsCount} {totalClipsCount === 1 ? 'PART' : 'PARTS'} GENERATED
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Preset Thresholds */}
        <div>
          <label className="text-[11px] font-black text-amber-400 uppercase tracking-widest block mb-3 font-mono">
            BROADCAST DURATION PRESETS
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {presetThresholds.map((preset) => {
              const isSelected = chunkThreshold === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => onChunkThresholdChange(preset.value)}
                  className={`p-3.5 rounded-2xl text-xs font-bold transition-all duration-200 border text-left ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-400 shadow-xl shadow-amber-500/20'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-amber-500/40'
                  }`}
                >
                  <div className="font-extrabold text-sm">{preset.label}</div>
                  <div className={`text-[10px] mt-1 font-mono ${isSelected ? 'text-black/80 font-bold' : 'text-zinc-500'}`}>
                    {preset.value}s per clip
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Duration Slider */}
        <div className="cinema-card rounded-2xl p-5 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Precision Duration Threshold:
            </span>
            <span className="text-xs font-mono font-black text-black bg-gradient-to-r from-amber-400 to-yellow-400 px-3 py-1 rounded-lg shadow">
              {Math.floor(chunkThreshold / 60)}m {chunkThreshold % 60}s ({chunkThreshold}s)
            </span>
          </div>
          <input
            type="range"
            min={15}
            max={Math.min(3600, Math.max(300, Math.ceil(duration || 600)))}
            step={5}
            value={chunkThreshold}
            onChange={(e) => onChunkThresholdChange(Number(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>15s Micro Part</span>
            <span>{Math.floor(duration / 60)} min Total Runtime</span>
          </div>
        </div>

        {/* Fade Transition Controls */}
        <div className="cinema-card rounded-2xl p-5 border border-zinc-800/80 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-widest font-mono">
              STUDIO FADE DISSOLVE TRANSITIONS
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-2 font-medium">
                <span>Head Fade-In (Audio &amp; Video)</span>
                <span className="text-amber-400 font-mono font-black">{transitionConfig.fadeInDuration}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                step={0.2}
                value={transitionConfig.fadeInDuration}
                onChange={(e) =>
                  onTransitionChange({
                    ...transitionConfig,
                    fadeInDuration: parseFloat(e.target.value),
                  })
                }
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-2 font-medium">
                <span>Tail Fade-Out (Audio &amp; Video)</span>
                <span className="text-amber-400 font-mono font-black">{transitionConfig.fadeOutDuration}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                step={0.2}
                value={transitionConfig.fadeOutDuration}
                onChange={(e) =>
                  onTransitionChange({
                    ...transitionConfig,
                    fadeOutDuration: parseFloat(e.target.value),
                  })
                }
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
