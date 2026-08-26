import React, { useRef } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import type { LogoConfig, LogoPosition, LogoAnimationType } from '../../types/studio';

interface LogoAnimationConfigProps {
  config: LogoConfig;
  onChange: (newConfig: LogoConfig) => void;
}

export const LogoAnimationConfig: React.FC<LogoAnimationConfigProps> = ({
  config,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (config.objectUrl) URL.revokeObjectURL(config.objectUrl);
      const objectUrl = URL.createObjectURL(file);
      onChange({
        ...config,
        file,
        objectUrl,
      });
    }
  };

  const positions: { label: string; value: LogoPosition }[] = [
    { label: 'Top Left', value: 'top-left' },
    { label: 'Top Right', value: 'top-right' },
    { label: 'Bottom Left', value: 'bottom-left' },
    { label: 'Bottom Right', value: 'bottom-right' },
    { label: 'Center Watermark', value: 'center' },
  ];

  const animations: { label: string; value: LogoAnimationType; desc: string }[] = [
    { label: 'Static Fade-In', value: 'fade-in', desc: 'Smoothly fades in at video start' },
    { label: 'Pulse / Breathing', value: 'pulse', desc: 'Gentle rhythmic scale pulsation' },
    { label: 'Gentle Float', value: 'gentle-bounce', desc: 'Subtle vertical floating motion' },
    { label: 'Glow Shimmer', value: 'shimmer', desc: 'Dynamic opacity luminance shimmer' },
    { label: 'Fixed Static', value: 'static', desc: 'Standard persistent watermark' },
  ];

  return (
    <div className="cinema-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="flex items-center justify-between pb-5 border-b border-amber-500/20">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white font-mono tracking-tight">Animated Brand Watermark</h3>
            <p className="text-xs text-zinc-400">
              Broadcast corner positioning, persistent animated badge &amp; luminance shimmer
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Upload Logo Box */}
        <div>
          <label className="text-[11px] font-black text-amber-400 uppercase tracking-widest block mb-2.5 font-mono">
            UPLOAD WATERMARK ASSET
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-800 hover:border-amber-400/70 bg-zinc-950/70 hover:bg-zinc-900/60 transition-all rounded-3xl p-5 flex flex-col items-center justify-center cursor-pointer text-center group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/svg+xml, image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
            {config.objectUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={config.objectUrl}
                  alt="Brand Logo"
                  className="h-16 w-auto object-contain max-w-[140px] bg-black/80 p-2.5 rounded-2xl border border-amber-500/30 shadow-xl"
                />
                <div className="text-left">
                  <div className="text-sm font-bold text-white group-hover:text-amber-300 font-mono">
                    {config.file?.name || 'Custom Watermark'}
                  </div>
                  <div className="text-xs text-zinc-400">Click to change asset</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5 py-3">
                <div className="p-3.5 rounded-2xl bg-zinc-900 text-amber-400 group-hover:scale-110 transition-transform border border-zinc-800">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-zinc-200">
                  Click to select PNG, SVG, or JPG Watermark
                </div>
                <div className="text-[10px] font-mono text-zinc-500">Transparent PNG recommended</div>
              </div>
            )}
          </div>
        </div>

        {/* Position Select */}
        <div>
          <label className="text-[11px] font-black text-amber-400 uppercase tracking-widest block mb-2.5 font-mono">
            SCREEN CORNER POSITION
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {positions.map((pos) => {
              const isSelected = config.position === pos.value;
              return (
                <button
                  key={pos.value}
                  type="button"
                  onClick={() => onChange({ ...config, position: pos.value })}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold border text-center transition-all cursor-pointer font-mono ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                      : 'cinema-card text-zinc-300 hover:border-amber-500/40'
                  }`}
                >
                  {pos.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Animation Presets */}
        <div>
          <label className="text-[11px] font-black text-amber-400 uppercase tracking-widest block mb-2.5 font-mono">
            WATERMARK MOTION ENGINE
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {animations.map((anim) => {
              const isSelected = config.animation === anim.value;
              return (
                <button
                  key={anim.value}
                  type="button"
                  onClick={() => onChange({ ...config, animation: anim.value })}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/60 text-white border-amber-400 shadow-lg ring-1 ring-amber-500/30'
                      : 'cinema-card text-zinc-300 hover:border-amber-500/40'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between font-mono">
                    <span>{anim.label}</span>
                    {isSelected && <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">{anim.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders: Scale & Opacity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 cinema-card p-5 rounded-2xl border border-zinc-800">
          <div>
            <div className="flex justify-between text-xs text-zinc-300 mb-2 font-mono">
              <span>Watermark Size</span>
              <span className="text-amber-400 font-bold">{Math.round(config.scale * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.35}
              step={0.01}
              value={config.scale}
              onChange={(e) => onChange({ ...config, scale: parseFloat(e.target.value) })}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-300 mb-2 font-mono">
              <span>Luminance Opacity</span>
              <span className="text-amber-400 font-bold">{Math.round(config.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1.0}
              step={0.05}
              value={config.opacity}
              onChange={(e) => onChange({ ...config, opacity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
