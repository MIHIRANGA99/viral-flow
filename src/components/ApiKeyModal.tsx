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
    currentModel || 'gemini-3.7-flash'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#111827] border border-slate-700 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gemini API Settings</h2>
              <p className="text-xs text-slate-400">Configure your local multimodal video engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="py-4 space-y-4 text-sm overflow-y-auto flex-1 pr-1">
          {/* API Key Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Google Gemini API Key
            </label>
            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 text-xs text-slate-400 hover:text-slate-200 cursor-pointer font-medium"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium underline underline-offset-2"
              >
                <span>Get a free key from Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testing || !keyInput.trim()}
                className="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-700 transition disabled:opacity-50 cursor-pointer"
              >
                {testing ? 'Testing...' : 'Test Connection'}
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

            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    setSelectedModel(model.id);
                    setCustomModel('');
                  }}
                  className={`text-left p-3 rounded-xl border transition flex items-start justify-between cursor-pointer ${
                    selectedModel === model.id && !customModel
                      ? 'bg-indigo-600/15 border-indigo-500/80 text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                      {model.name}
                      {model.id === 'gemini-1.5-flash' && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{model.id}</div>
                  </div>
                  {selectedModel === model.id && !customModel && (
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Model Input */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Or enter custom model ID:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="e.g. gemini-1.5-flash"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Your key is saved only in your browser's local storage. Videos are processed directly with zero server storage.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!keyInput.trim()}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/25 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
