import { useState, useEffect, useRef } from 'react';
import { Sparkles, Key, Film } from 'lucide-react';
import { Header } from './components/Header';
import { ApiKeyModal } from './components/ApiKeyModal';
import { VideoUploader } from './components/VideoUploader';
import { VideoPlayer } from './components/VideoPlayer';
import type { VideoPlayerHandle } from './components/VideoPlayer';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { HistoryDrawer } from './components/HistoryDrawer';
import { FullScreenLoader } from './components/FullScreenLoader';
import { ErrorModal } from './components/ErrorModal';
import type { VideoMetadata, VideoAnalysisResult, AnalysisHistoryItem } from './types';
import { analyzeVideoWithGemini } from './services/gemini';
import type { GeminiModelId } from './services/gemini';
import { StorageService } from './utils/storage';

export function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<GeminiModelId>('gemini-3.7-flash');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [currentVideo, setCurrentVideo] = useState<VideoMetadata | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ percent: number; status: string }>({
    percent: 0,
    status: '',
  });
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCustomPrompt, setLastCustomPrompt] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);

  const videoPlayerRef = useRef<VideoPlayerHandle>(null);

  useEffect(() => {
    const savedKey = StorageService.getApiKey();
    const savedModel = StorageService.getModel() as GeminiModelId;
    const savedHistory = StorageService.getHistory();

    setApiKey(savedKey);
    if (savedModel) setModel(savedModel);
    setHistory(savedHistory);
  }, []);

  const handleSaveApiKey = (newKey: string, newModel: GeminiModelId) => {
    setApiKey(newKey);
    setModel(newModel);
    StorageService.setApiKey(newKey);
    StorageService.setModel(newModel);
  };

  const handleVideoSelected = (metadata: VideoMetadata) => {
    if (currentVideo && currentVideo.objectUrl !== metadata.objectUrl) {
      URL.revokeObjectURL(currentVideo.objectUrl);
    }
    setCurrentVideo(metadata);
    setAnalysisResult(null);
    setError(null);
  };

  const handleStartAnalysis = async (customPrompt?: string) => {
    if (!currentVideo) return;

    if (!apiKey.trim()) {
      setIsApiKeyModalOpen(true);
      setError('Please provide your Google Gemini API key to begin analysis.');
      return;
    }

    if (customPrompt !== undefined) {
      setLastCustomPrompt(customPrompt);
    }

    setError(null);
    setIsAnalyzing(true);
    setAnalysisProgress({ percent: 10, status: 'Initializing video analysis...' });

    try {
      const result = await analyzeVideoWithGemini(
        currentVideo.file,
        apiKey,
        model,
        customPrompt !== undefined ? customPrompt : lastCustomPrompt,
        (percent, status) => {
          setAnalysisProgress({ percent, status });
        }
      );

      result.videoDuration = currentVideo.duration;
      result.aspectRatio = currentVideo.aspectRatio;

      setAnalysisResult(result);
      StorageService.saveAnalysis(result);
      setHistory(StorageService.getHistory());
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'An error occurred during video analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSeekVideo = (seconds: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(seconds);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectHistoryItem = (item: AnalysisHistoryItem) => {
    setAnalysisResult(item.result);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = StorageService.deleteHistoryItem(id);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    StorageService.clearHistory();
    setHistory([]);
  };

  const handleChangeVideo = () => {
    if (currentVideo) {
      URL.revokeObjectURL(currentVideo.objectUrl);
    }
    setCurrentVideo(null);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Full-Screen Animated Multimodal AI Loader */}
      <FullScreenLoader
        isOpen={isAnalyzing}
        progress={analysisProgress.percent}
        status={analysisProgress.status}
        fileName={currentVideo?.name}
        type="analysis"
      />

      {/* User-Friendly Actionable Error Modal */}
      <ErrorModal
        error={error}
        onClose={() => setError(null)}
        onRetry={() => handleStartAnalysis()}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      <Header
        hasApiKey={!!apiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!apiKey && (
          <div className="rounded-2xl bg-gradient-to-r from-indigo-900/30 via-pink-900/20 to-indigo-900/30 border border-indigo-500/30 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Enter Your Free Google Gemini Key</h4>
                <p className="text-xs text-slate-300">
                  Required to run local multimodal video analysis (visuals, audio, hooks & music prompt).
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30 shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Configure API Key</span>
            </button>
          </div>
        )}

        {!currentVideo && !analysisResult && (
          <div className="text-center space-y-3 pt-4 pb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>AI Multimodal Video Engine (TikTok • Facebook • Google Flow Music)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Turn Local Clips into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-300">Viral Gold</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Select any local video file (≤ 20s). Gemini analyzes the visual hooks, pacing, and audio to give you ready-to-post TikTok & Facebook copy, plus tailored Google Flow music prompts.
            </p>
          </div>
        )}

        {!currentVideo && (
          <VideoUploader onVideoSelected={handleVideoSelected} isLoading={isAnalyzing} />
        )}

        {currentVideo && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className={analysisResult ? 'lg:col-span-5 lg:sticky lg:top-20' : 'lg:col-span-12 max-w-3xl mx-auto'}>
                <VideoPlayer
                  ref={videoPlayerRef}
                  metadata={currentVideo}
                  onChangeVideo={handleChangeVideo}
                  onAnalyze={handleStartAnalysis}
                  isAnalyzing={isAnalyzing}
                  hasResult={!!analysisResult}
                />
              </div>

              {analysisResult && (
                <div className="lg:col-span-7">
                  <AnalysisDashboard
                    result={analysisResult}
                    onSeekVideo={handleSeekVideo}
                    onAttachMusic={(file) => videoPlayerRef.current?.attachMusicFile?.(file)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {!currentVideo && analysisResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-300">
                Viewing analysis for: <strong className="text-white">{analysisResult.fileName}</strong>
              </span>
              <button
                onClick={() => setAnalysisResult(null)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                Analyze New Video
              </button>
            </div>
            <AnalysisDashboard
              result={analysisResult}
              onSeekVideo={() => {}}
              onAttachMusic={(file) => videoPlayerRef.current?.attachMusicFile?.(file)}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#0B0F19] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-400">ViralFlow AI</span>
            <span>— 100% Client-Side Local Video Analyzer</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-slate-200">TikTok Hooks</span>
            <span>•</span>
            <span className="hover:text-slate-200">Facebook Descriptions</span>
            <span>•</span>
            <span className="hover:text-slate-200">Google Flow Music</span>
          </div>
        </div>
      </footer>

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentKey={apiKey}
        currentModel={model}
        onSave={handleSaveApiKey}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}

export default App;
