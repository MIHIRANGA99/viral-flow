import React, { useState, useEffect } from 'react';
import { X, Key, Check, ExternalLink, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { GEMINI_MODELS, fetchLiveGeminiModels } from '../services/gemini';
import type { ModelOption, GeminiModelId } from '../services/gemini';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  currentModel: string;
  onSave: (key: string, model: GeminiModelId) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentKey,
  currentModel,
  onSave,
}) => {
  const [keyInput, setKeyInput] = useState(currentKey);
  const [selectedModel, setSelectedModel] = useState<string>(
    currentModel || 'gemini-2.0-flash'
  );
  const [customModel, setCustomModel] = useState('');
  const [availableModels, setAvailableModels] = useState<ModelOption[]>(GEMINI_MODELS);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen && keyInput.trim()) {
      loadModels(keyInput.trim());
    }
  }, [isOpen]);

  const loadModels = async (key: string) => {
    setLoadingModels(true);
    try {
      const models = await fetchLiveGeminiModels(key);
      setAvailableModels(models);
    } catch {
      setAvailableModels(GEMINI_MODELS);
    } finally {
      setLoadingModels(false);
    }
  };

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!keyInput.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key first.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const modelToTest = customModel.trim() || selectedModel || 'gemini-1.5-flash';

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelToTest}:generateContent?key=${keyInput.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Respond with {"status":"ok"}' }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (response.ok) {
        setTestResult({
          success: true,
          message: `Connection successful! Model ${modelToTest} is working.`,
        });
        await loadModels(keyInput.trim());
      } else {
        const errorData = await response.json();
        setTestResult({
          success: false,
          message: errorData.error?.message || `API error (${response.status})`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error while testing API key.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const finalModel = customModel.trim() || selectedModel || 'gemini-1.5-flash';
    onSave(keyInput.trim(), finalModel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl cinema-panel shadow-2xl p-6 sm:p-7 overflow-hidden max-h-[90vh] flex flex-col border border-amber-500/30">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white font-mono">Gemini AI Studio Key</h2>
              <p className="text-xs text-zinc-400">Multimodal speech transcription &amp; Sinhala translation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="py-4 space-y-4 text-sm overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {/* API Key Input */}
          <div>
            <label className="block text-[11px] font-black text-amber-400 uppercase tracking-widest mb-2 font-mono">
              GOOGLE GEMINI API KEY
            </label>
            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3.5 text-xs text-zinc-400 hover:text-amber-300 cursor-pointer font-bold font-mono"
              >
                {showKey ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2.5 text-xs">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-bold underline underline-offset-2"
              >
                <span>Get free key from Google AI Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testing || !keyInput.trim()}
                className="text-amber-300 hover:text-black hover:bg-amber-400 bg-zinc-900 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-500/30 transition disabled:opacity-50 cursor-pointer font-mono"
              >
                {testing ? 'Testing...' : 'Test Key'}
              </button>
            </div>
          </div>

          {/* Test Feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Model Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Gemini Vision Model
              </label>
              {loadingModels && (
                <span className="text-[11px] text-indigo-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Fetching models...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    setSelectedModel(model.id);
                    setCustomModel('');
                  }}
                  className={`text-left p-3.5 rounded-2xl border transition flex items-start justify-between cursor-pointer ${
                    selectedModel === model.id && !customModel
                      ? 'bg-amber-500/15 border-amber-400 text-white shadow-md'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-amber-500/30 hover:text-zinc-200'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-2 font-mono">
                      {model.name}
                      {model.id === 'gemini-1.5-flash' && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                          Fast
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">{model.id}</div>
                  </div>
                  {selectedModel === model.id && !customModel && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Model Input */}
            <div className="mt-2.5 pt-2 border-t border-zinc-800">
              <label className="block text-[11px] font-bold text-zinc-400 mb-1 font-mono">
                Custom Gemini Model ID:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="e.g. gemini-2.5-flash"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Stored 100% locally in your browser. All video cutting, audio extraction, and subtitle rendering runs on your device.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-amber-500/20 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:bg-zinc-800 transition cursor-pointer font-mono"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!keyInput.trim()}
            className="px-6 py-2.5 rounded-xl text-xs font-black text-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 transition shadow-xl shadow-amber-500/25 disabled:opacity-50 cursor-pointer flex items-center gap-2 font-mono uppercase tracking-wider"
          >
            <Check className="w-4 h-4 text-black stroke-[3]" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
