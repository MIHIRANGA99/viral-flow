import React from 'react';
import { Key, History, Sparkles, ShieldCheck, Clapperboard } from 'lucide-react';
import { ShinyText } from './reactbits/ShinyText';

interface HeaderProps {
  hasApiKey: boolean;
  onOpenApiKeyModal: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  hasApiKey,
  onOpenApiKeyModal,
  onOpenHistory,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-amber-500/20 bg-[#060709]/95 backdrop-blur-xl shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Cinema Brand */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-rose-700 shadow-xl shadow-amber-500/20 border border-amber-400/30">
            <Clapperboard className="w-5 h-5 text-black stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-black tracking-tight text-white font-mono flex items-center gap-1">
                <span>CINE</span>
                <ShinyText text="FLOW" className="font-mono text-xl font-black" speed={3} />
                <span className="text-xs text-amber-500 font-sans font-bold ml-1 tracking-widest uppercase">PRO STUDIO</span>
              </span>
              <span className="text-[9px] font-mono font-extrabold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 tracking-wider">
                100% LOCAL
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:flex items-center gap-2">
              <span>Client-Side Video Splitter</span>
              <span className="text-amber-500/60">•</span>
              <span>Sinhala AI Subtitles</span>
              <span className="text-amber-500/60">•</span>
              <span>Animated Watermark Studio</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Privacy badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Zero-Upload Privacy</span>
          </div>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 transition cursor-pointer"
            title="View Past Renderings"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Project Log</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black">
                {historyCount}
              </span>
            )}
          </button>

          {/* API Key Config */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer ${
              hasApiKey
                ? 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 hover:border-amber-400/60 shadow-amber-500/5'
                : 'bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-black font-black shadow-amber-500/30 animate-pulse'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasApiKey ? 'Gemini AI Connected' : 'Set Gemini Key'}</span>
            {hasApiKey ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
            ) : (
              <Sparkles className="w-3 h-3 text-black fill-current" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
