import React, { useEffect, useState } from 'react';
import { Sparkles, Film, Cpu, Music, Bot, Layers, Zap } from 'lucide-react';

interface FullScreenLoaderProps {
  isOpen: boolean;
  progress: number;
  status: string;
  fileName?: string;
  type?: 'analysis' | 'export';
}

const ANALYSIS_STEPS = [
  { label: 'Reading & preparing video frames', icon: Film, threshold: 0 },
  { label: 'Encoding frames for Gemini vision', icon: Layers, threshold: 20 },
  { label: 'Gemini AI Multimodal Reasoning', icon: Bot, threshold: 45 },
  { label: 'Analyzing visual hooks & pacing', icon: Cpu, threshold: 75 },
  { label: 'Synthesizing viral packages & music prompts', icon: Music, threshold: 90 },
];

const EXPORT_STEPS = [
  { label: 'Initializing GPU video decoder', icon: Film, threshold: 0 },
  { label: 'Setting up Web Audio & Canvas mixer', icon: Music, threshold: 15 },
  { label: 'Applying watermark filter & logo overlay', icon: Layers, threshold: 25 },
  { label: 'Encoding 60fps high-bitrate video stream', icon: Cpu, threshold: 60 },
  { label: 'Finalizing clean video export file', icon: Sparkles, threshold: 95 },
];

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  isOpen,
  progress,
  status,
  fileName,
  type = 'analysis',
}) => {
  const [pulseScale, setPulseScale] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setPulseScale((p) => !p);
    }, 1400);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = type === 'analysis' ? ANALYSIS_STEPS : EXPORT_STEPS;
  const currentStepIndex = steps.reduce(
    (acc, step, idx) => (progress >= step.threshold ? idx : acc),
    0
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#070A12]/90 backdrop-blur-2xl animate-fadeIn select-none">
      {/* Embedded SVG Gradients */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="ai-glow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="export-glow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Background Animated Gradient Aura */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] sm:w-[600px] h-[420px] sm:h-[600px] bg-gradient-to-tr from-indigo-600/25 via-pink-600/20 to-amber-500/25 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Main Glass Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/90 border border-slate-700/60 p-6 sm:p-8 shadow-2xl shadow-indigo-950/80 text-center space-y-6 flex flex-col items-center">
        {/* Animated Central Glowing Orb */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 via-pink-500 to-amber-400 p-[2px] shadow-2xl shadow-indigo-500/40 transition-transform duration-1000 ${
              pulseScale ? 'scale-105 rotate-3' : 'scale-95 -rotate-3'
            }`}
          >
            <div className="w-full h-full bg-slate-950 rounded-3xl flex items-center justify-center relative overflow-hidden">
              {/* Pulsing Ambient Backdrop */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/25 via-pink-500/20 to-amber-500/20 animate-pulse" />
              
              {/* Radar Scanner Beam Line */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-bounce opacity-70" />

              {/* Glowing Center AI Icon */}
              {type === 'analysis' ? (
                <div className="relative z-10 flex items-center justify-center">
                  <div className="absolute w-12 h-12 bg-indigo-500/30 rounded-full blur-md" />
                  <Bot
                    className="w-12 h-12 text-indigo-300 relative z-10 animate-pulse"
                    style={{ stroke: 'url(#ai-glow-gradient)', strokeWidth: 2 }}
                  />
                </div>
              ) : (
                <div className="relative z-10 flex items-center justify-center">
                  <div className="absolute w-12 h-12 bg-emerald-500/30 rounded-full blur-md" />
                  <Film
                    className="w-12 h-12 text-emerald-300 relative z-10 animate-pulse"
                    style={{ stroke: 'url(#export-glow-gradient)', strokeWidth: 2 }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sparkles */}
          <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-spin duration-3000" />
          <Zap className="w-4 h-4 text-pink-400 absolute -bottom-1 -left-2 animate-pulse" />
        </div>

        {/* Title & Status */}
        <div className="space-y-2 max-w-md">
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {type === 'analysis' ? (
              <span>
                Gemini AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-300">Video Analysis</span>
              </span>
            ) : (
              <span>
                Rendering <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400">Clean Video</span>
              </span>
            )}
          </h3>

          <p className="text-xs sm:text-sm font-medium text-slate-300 h-5 transition-all">
            {status || 'Processing video stream...'}
          </p>

          {fileName && (
            <div className="inline-block px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-mono text-slate-400 max-w-[280px] truncate">
              {fileName}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2 pt-1">
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 p-0.5 shadow-inner">
            <div
              className="bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-400 h-full rounded-full transition-all duration-500 ease-out shadow-lg shadow-indigo-500/50"
              style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs font-mono text-slate-400 px-1">
            <span className="font-bold text-white text-sm">{Math.round(progress)}%</span>
            <span className="text-[11px] text-slate-400">
              {type === 'analysis' ? 'Multimodal AI Vision' : 'Hardware Video Render'}
            </span>
          </div>
        </div>

        {/* Dynamic Multi-Step Live Pipeline Feed */}
        <div className="w-full space-y-2 pt-2 border-t border-slate-800/80 text-left">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Pipeline Steps
          </div>

          <div className="space-y-1.5">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = currentStepIndex > idx || progress >= 100;
              const isCurrent = currentStepIndex === idx && progress < 100;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-2 rounded-xl text-xs transition-all ${
                    isCurrent
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-white font-semibold'
                      : isCompleted
                      ? 'text-slate-400 opacity-80'
                      : 'text-slate-600 opacity-40'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-indigo-500 text-white animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate flex-1">{step.label}</span>
                  {isCompleted && (
                    <span className="text-[10px] text-emerald-400 font-bold">✓</span>
                  )}
                  {isCurrent && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 pt-1">
          100% locally processed in your browser • Please keep this tab open
        </div>
      </div>
    </div>
  );
};
