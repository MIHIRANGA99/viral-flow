import React from 'react';
import { AlertTriangle, Key, RefreshCw, X } from 'lucide-react';

interface ErrorModalProps {
  error: string | null;
  onClose: () => void;
  onRetry?: () => void;
  onOpenApiKeyModal?: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  error,
  onClose,
  onRetry,
  onOpenApiKeyModal,
}) => {
  if (!error) return null;

  const is503 = error.includes('503') || error.toLowerCase().includes('high demand') || error.toLowerCase().includes('temporarily unavailable');
  const isKeyIssue = error.toLowerCase().includes('api key') || error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('invalid api key') || error.includes('403');
  const isModel404 = error.includes('404') || error.toLowerCase().includes('model') || error.toLowerCase().includes('not found');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-[#070A12]/80 backdrop-blur-xl animate-fadeIn select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/95 border border-rose-500/40 p-6 sm:p-7 shadow-2xl shadow-rose-950/50 space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Icon */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-500/20">
            {isKeyIssue ? (
              <Key className="w-6 h-6" />
            ) : is503 ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-bold text-white">
              {is503
                ? 'AI Traffic Spike (503)'
                : isKeyIssue
                ? 'Gemini API Key Required'
                : isModel404
                ? 'Model Update Needed'
                : 'Analysis Encountered an Issue'}
            </h4>
            <p className="text-xs text-rose-300 font-medium">
              {is503
                ? 'Temporary Google AI demand surge'
                : isKeyIssue
                ? 'Authentication or quota check'
                : 'Action required to proceed'}
            </p>
          </div>
        </div>

        {/* Error Details Box */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-rose-500/20 text-xs text-slate-300 space-y-2 leading-relaxed">
          <div className="font-mono text-rose-200 break-words text-[11px] bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/20">
            {error}
          </div>

          {/* User-friendly Advice */}
          <div className="text-[11px] text-slate-400 pt-1 space-y-1">
            {is503 && (
              <p className="text-amber-300">
                💡 <strong>Tip:</strong> Google Gemini free tier servers experience momentary traffic spikes. Clicking <strong>Retry Analysis</strong> usually succeeds immediately!
              </p>
            )}
            {isKeyIssue && (
              <p className="text-indigo-300">
                💡 <strong>Tip:</strong> Make sure you entered a valid Google Gemini API key from Google AI Studio.
              </p>
            )}
            {isModel404 && (
              <p className="text-amber-300">
                💡 <strong>Tip:</strong> You can switch models (e.g. to <code>gemini-1.5-flash</code> or <code>gemini-2.0-flash</code>) in the API Key settings modal.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {onRetry && (
            <button
              onClick={() => {
                onClose();
                onRetry();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Analysis</span>
            </button>
          )}

          {onOpenApiKeyModal && (
            <button
              onClick={() => {
                onClose();
                onOpenApiKeyModal();
              }}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>API Key Settings</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
