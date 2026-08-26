import React from 'react';
import { Type, ShieldCheck } from 'lucide-react';
import type { SubtitleStyleConfig } from '../../types/studio';

interface SubtitleStyleCustomizerProps {
  styleConfig: SubtitleStyleConfig;
  onChange: (newConfig: SubtitleStyleConfig) => void;
}

export const SubtitleStyleCustomizer: React.FC<SubtitleStyleCustomizerProps> = ({
  styleConfig,
  onChange,
}) => {
  const fonts: SubtitleStyleConfig['fontFamily'][] = [
    'Noto Sans Sinhala',
    'Gemunu Libre',
    'Abhaya Libre',
    'Inter',
    'Impact',
  ];

  return (
    <div className="cinema-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="flex items-center justify-between pb-5 border-b border-amber-500/20">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Type className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white font-mono tracking-tight">Sinhala Subtitle Styling &amp; Masking</h3>
            <p className="text-xs text-zinc-400">
              Unicode typography, broadcast stroke outlines &amp; backdrop masking to obscure old subtitles
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Font Family Selection */}
        <div>
          <label className="text-[11px] font-black text-amber-400 uppercase tracking-widest block mb-2.5 font-mono">
            SINHALA UNICODE FONT
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {fonts.map((f) => {
              const isSelected = styleConfig.fontFamily === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => onChange({ ...styleConfig, fontFamily: f })}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-400 shadow-xl shadow-amber-500/20'
                      : 'cinema-card text-zinc-300 hover:border-amber-500/40'
                  }`}
                >
                  <div className="text-xs font-black font-mono">{f}</div>
                  <div className={`text-[12px] mt-1 font-bold ${isSelected ? 'text-black' : 'text-zinc-400'}`} style={{ fontFamily: f }}>
                    සිංහල උපසිරැසි පෙළ
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Color & Outline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 cinema-card p-5 rounded-2xl border border-zinc-800">
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-2 font-mono">Primary Glyph Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={styleConfig.textColor}
                onChange={(e) => onChange({ ...styleConfig, textColor: e.target.value })}
                className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
              />
              <span className="font-mono text-xs text-amber-400 font-bold uppercase">
                {styleConfig.textColor}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-2 font-mono">Outline / Stroke Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={styleConfig.outlineColor}
                onChange={(e) => onChange({ ...styleConfig, outlineColor: e.target.value })}
                className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
              />
              <span className="font-mono text-xs text-amber-400 font-bold uppercase">
                {styleConfig.outlineColor}
              </span>
            </div>
          </div>
        </div>

        {/* Font Size & Position Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 cinema-card p-5 rounded-2xl border border-zinc-800">
          <div>
            <div className="flex justify-between text-xs text-zinc-300 mb-2 font-mono">
              <span>Font Size Scale</span>
              <span className="text-amber-400 font-bold">{styleConfig.fontSize}px</span>
            </div>
            <input
              type="range"
              min={24}
              max={64}
              step={2}
              value={styleConfig.fontSize}
              onChange={(e) => onChange({ ...styleConfig, fontSize: Number(e.target.value) })}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-300 mb-2 font-mono">
              <span>Vertical Position (From Bottom)</span>
              <span className="text-amber-400 font-bold">{styleConfig.positionY}%</span>
            </div>
            <input
              type="range"
              min={4}
              max={35}
              step={1}
              value={styleConfig.positionY}
              onChange={(e) => onChange({ ...styleConfig, positionY: Number(e.target.value) })}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Max Width & Line Wrapping Constraint (Prevents Screen Overflow) */}
        <div className="cinema-card p-5 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-200 font-mono">Subtitle Max Width (Screen Containment)</span>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {styleConfig.maxWidthPercent || 82}% of Video Width
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Automatically wraps long sentences into neat multiline blocks so text never overflows video edges
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: '65% Compact', val: 65 },
                { label: '75% Mobile', val: 75 },
                { label: '82% Standard', val: 82 },
                { label: '92% Wide', val: 92 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => onChange({ ...styleConfig, maxWidthPercent: preset.val })}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition cursor-pointer ${
                    (styleConfig.maxWidthPercent || 82) === preset.val
                      ? 'bg-amber-500 text-black font-black shadow-md'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <input
            type="range"
            min={50}
            max={98}
            step={2}
            value={styleConfig.maxWidthPercent || 82}
            onChange={(e) => onChange({ ...styleConfig, maxWidthPercent: Number(e.target.value) })}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Mask Original Burned-in Subtitles (Cover Box) */}
        <div className="cinema-card p-5 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-sm font-bold text-white font-mono">Mask Pre-Existing Hardcoded Subtitles</h4>
                <p className="text-xs text-zinc-400">
                  Adds a calibrated backdrop box behind Sinhala text to completely obscure original video subtitles
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={styleConfig.maskOriginalSubtitles}
              onChange={(e) =>
                onChange({
                  ...styleConfig,
                  maskOriginalSubtitles: e.target.checked,
                  backgroundOpacity: e.target.checked ? 0.85 : 0,
                })
              }
              className="w-5 h-5 rounded-lg text-amber-500 bg-zinc-950 border-zinc-700 focus:ring-0 cursor-pointer accent-amber-500"
            />
          </div>

          {styleConfig.maskOriginalSubtitles && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-zinc-800">
              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-2 font-mono">
                  <span>Backdrop Opacity</span>
                  <span className="text-amber-400 font-bold">
                    {Math.round(styleConfig.backgroundOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={1.0}
                  step={0.05}
                  value={styleConfig.backgroundOpacity}
                  onChange={(e) =>
                    onChange({ ...styleConfig, backgroundOpacity: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-2 font-mono">
                  Backdrop Shade
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={styleConfig.backgroundColor}
                    onChange={(e) =>
                      onChange({ ...styleConfig, backgroundColor: e.target.value })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="font-mono text-xs text-amber-400 font-bold uppercase">
                    {styleConfig.backgroundColor}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
