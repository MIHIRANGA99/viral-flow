import React from 'react';
import { Key, History, Sparkles, ShieldCheck, Film } from 'lucide-react';

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
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#070A12]/90 backdrop-blur-xl shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* ViralFlow Brand */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-pink-500 to-amber-400 p-[1.5px] shadow-xl shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0B0F19] rounded-2xl flex items-center justify-center">
              <Film className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-pink-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center">
                <span>Viral</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-300">Flow</span>
                <span className="text-xs text-indigo-400 font-bold ml-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30">AI</span>
              </span>
              <span className="text-[9px] font-mono font-extrabold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 tracking-wider">
                100% LOCAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:flex items-center gap-2">
              <span>Multi-Clip Reel Combiner</span>
              <span className="text-slate-600">•</span>
              <span>TikTok &amp; Facebook Hooks</span>
              <span className="text-slate-600">•</span>
              <span>Google Flow Music</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Privacy badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Upload Privacy</span>
          </div>

          {/* History Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="relative px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {historyCount}
              </span>
            )}
          </button>

          {/* API Key Modal Button */}
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg ${
              hasApiKey
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-indigo-600/30'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasApiKey ? 'API Key Configured' : 'Configure API Key'}</span>
            {hasApiKey ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
