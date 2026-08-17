import type { AnalysisHistoryItem, VideoAnalysisResult } from '../types';

const STORAGE_KEYS = {
  API_KEY: 'viralflow_gemini_api_key',
  MODEL: 'viralflow_gemini_model',
  HISTORY: 'viralflow_analysis_history',
};

export const StorageService = {
  getApiKey(): string {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  },

  setApiKey(key: string): void {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
  },

  getModel(): string {
    const saved = localStorage.getItem(STORAGE_KEYS.MODEL);
    if (!saved || saved === 'gemini-2.5-flash' || saved === 'gemini-2.0-flash') {
      localStorage.setItem(STORAGE_KEYS.MODEL, 'gemini-1.5-flash');
      return 'gemini-1.5-flash';
    }
    return saved;
  },

  setModel(modelId: string): void {
    localStorage.setItem(STORAGE_KEYS.MODEL, modelId);
  },

  getHistory(): AnalysisHistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to read history from localStorage', e);
      return [];
    }
  },

  saveAnalysis(result: VideoAnalysisResult): void {
    try {
      const history = this.getHistory();
      const newItem: AnalysisHistoryItem = {
        id: result.id,
        createdAt: result.createdAt,
        fileName: result.fileName,
        videoDuration: result.videoDuration,
        aspectRatio: result.aspectRatio,
        result: result,
      };

      const updated = [newItem, ...history.filter((h) => h.id !== result.id)].slice(0, 20);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save analysis to history', e);
    }
  },

  deleteHistoryItem(id: string): AnalysisHistoryItem[] {
    try {
      const history = this.getHistory().filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
      return history;
    } catch (e) {
      console.error('Failed to delete history item', e);
      return [];
    }
  },

  clearHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  },
};
