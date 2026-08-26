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
import { MultiClipSequencer } from './components/MultiClipSequencer';
import { VideoStudioMain } from './components/VideoStudio/VideoStudioMain';
import { BlurText } from './components/reactbits/BlurText';
import { RotatingText } from './components/reactbits/RotatingText';
import { ShinyText } from './components/reactbits/ShinyText';
import type { VideoMetadata, VideoAnalysisResult, AnalysisHistoryItem } from './types';
import { analyzeVideoWithGemini } from './services/gemini';
import type { GeminiModelId } from './services/gemini';
import { concatenateVideos } from './services/videoConcat';
import { StorageService } from './utils/storage';

export function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<GeminiModelId>('gemini-3.7-flash');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [appMode, setAppMode] = useState<'studio' | 'viral'>('viral');
  
  const [currentVideo, setCurrentVideo] = useState<VideoMetadata | null>(null);
  const [sequencerClips, setSequencerClips] = useState<VideoMetadata[] | null>(null);
  const [isConcatenating, setIsConcatenating] = useState(false);
  const [concatProgress, setConcatProgress] = useState<{ percent: number; status: string }>({
    percent: 0,
    status: '',
  });

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
    setSequencerClips(null);
    setCurrentVideo(metadata);
    setAnalysisResult(null);
    setError(null);
  };

  const handleMultipleVideosSelected = (metadatas: VideoMetadata[]) => {
    setSequencerClips(metadatas);
    setCurrentVideo(null);
    setAnalysisResult(null);
    setError(null);
  };

  const extractSingleMetadata = (file: File): Promise<VideoMetadata> => {
    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = objectUrl;

      const finish = (duration: number) => {
        const width = video.videoWidth || 1080;
        const height = video.videoHeight || 1920;
        const validDuration = isFinite(duration) && duration > 0 ? duration : 10;

        let aspectRatio = '16:9 (Landscape)';
        const ratio = width / height;
        if (ratio <= 0.65) {
          aspectRatio = '9:16 (Vertical Reel/TikTok)';
        } else if (ratio <= 0.9) {
          aspectRatio = '4:5 (Vertical Feed)';
        } else if (ratio >= 0.95 && ratio <= 1.05) {
          aspectRatio = '1:1 (Square)';
        }

        resolve({
          file,
          name: file.name,
          size: file.size,
          type: file.type || 'video/mp4',
          duration: validDuration,
          width,
          height,
          aspectRatio,
          objectUrl,
        });
      };

      video.onloadedmetadata = () => {
        if (!isFinite(video.duration) || isNaN(video.duration)) {
          video.currentTime = 1e101;
          video.ontimeupdate = () => {
            video.ontimeupdate = null;
            const trueDuration = video.currentTime;
            video.currentTime = 0;
            finish(trueDuration);
          };
        } else {
          finish(video.duration);
        }
      };

      video.onerror = () => {
        finish(10);
      };
    });
  };

  const handleAddMoreFilesToSequencer = async (fileList: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv|avi|m4v)$/i)) {
        validFiles.push(file);
      }
    }
    if (validFiles.length === 0) return;
    try {
      const newMetas = await Promise.all(validFiles.map((f) => extractSingleMetadata(f)));
      setSequencerClips((prev) => [...(prev || []), ...newMetas]);
    } catch (err: any) {
      setError('Could not load added clips: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCombineClips = async () => {
    if (!sequencerClips || sequencerClips.length === 0) return;
    setIsConcatenating(true);
    setConcatProgress({ percent: 5, status: 'Initializing multi-clip compositor...' });

    try {
      const { metadata } = await concatenateVideos(sequencerClips, (percent, status) => {
        setConcatProgress({ percent, status });
      });
      setSequencerClips(null);
      setCurrentVideo(metadata);
    } catch (err: any) {
      console.error('Concatenation error:', err);
      setError('Failed to combine video clips: ' + (err.message || 'Unknown error'));
    } finally {
      setIsConcatenating(false);
    }
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
    setSequencerClips(null);
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

      {/* Full-Screen Multi-Clip Concatenation Loader */}
      <FullScreenLoader
        isOpen={isConcatenating}
        progress={concatProgress.percent}
        status={concatProgress.status}
        fileName={sequencerClips ? `${sequencerClips.length} Clips Combined Reel` : 'Combined Reel'}
        type="export"
      />

      {/* User-Friendly Actionable Error Modal */}
      <ErrorModal
        error={error}
        onClose={() => setError(null)}
        onRetry={() => (currentVideo ? handleStartAnalysis() : null)}
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

        {!currentVideo && !sequencerClips && !analysisResult && (
          <div className="text-center space-y-5 pt-8 pb-4">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 mb-1 shadow-lg shadow-amber-500/5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current animate-spin" style={{ animationDuration: '6s' }} />
              <ShinyText text="100% Client-Side Multi-Clip Reel Engine" speed={3} className="font-mono text-xs font-black" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                <BlurText text="COMBINE SHORT CLIPS INTO" delay={0.03} className="justify-center" />
                <br />
                <ShinyText
                  text="VIRAL MASTER REELS"
                  speed={3}
                  className="font-mono text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight"
                />
              </h1>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-zinc-400 font-mono">
              <span>Reel Engine: </span>
              <RotatingText
                texts={[
                  'Combine 3x 10s Clips into 30s Reel',
                  'AI Multimodal Viral Copy',
                  'Google Flow Music Sync Prompts',
                  'SOLIVAST Brand Logo Overlay',
                  '100% Zero-Storage Local Processing',
                ]}
                rotationInterval={2800}
                className="text-amber-300 font-bold"
                elementLevelClassName="border-b border-amber-500/40 pb-0.5"
              />
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed pt-1">
              Select multiple clips or a single video file. Stitch clips in chronological order, craft custom viral hooks with Gemini AI, attach generated background beats, and export with your brand logo!
            </p>
          </div>
        )}

        {/* Multi-Clip Sequencer UI */}
        {!currentVideo && sequencerClips && sequencerClips.length > 0 && (
          <MultiClipSequencer
            clips={sequencerClips}
            onClipsChange={(newClips) => setSequencerClips(newClips)}
            onCombineAndProceed={handleCombineClips}
            onCancel={() => setSequencerClips(null)}
            onAddMoreFiles={handleAddMoreFilesToSequencer}
            isProcessing={isConcatenating}
          />
        )}

        {/* Video Uploader (Shown when no video or multi-clip sequence is active) */}
        {!currentVideo && !sequencerClips && (
          <VideoUploader
            onVideoSelected={handleVideoSelected}
            onMultipleVideosSelected={handleMultipleVideosSelected}
            isLoading={isAnalyzing || isConcatenating}
          />
        )}

        {/* Active Combined / Single Video Player & Studio */}
        {currentVideo && (
          <div className="space-y-6">
            {/* Mode Switcher Bar */}
            <div className="flex items-center justify-center">
              <div className="inline-flex p-1.5 rounded-2xl bg-zinc-900/90 border border-amber-500/20 shadow-2xl backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setAppMode('viral')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer font-mono tracking-wide ${
                    appMode === 'viral'
                      ? 'bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-600 text-white shadow-xl shadow-indigo-600/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Viral Social Copy &amp; Music Kit
                </button>
                <button
                  type="button"
                  onClick={() => setAppMode('studio')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer font-mono tracking-wide ${
                    appMode === 'studio'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-xl shadow-amber-500/25'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  Cinema Split &amp; Sinhala Subtitles Studio
                </button>
              </div>
            </div>

            {appMode === 'studio' ? (
              <VideoStudioMain
                video={currentVideo}
                apiKey={apiKey}
                selectedModel={model}
                onBack={handleChangeVideo}
                onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
              />
            ) : (
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
            )}
          </div>
        )}

        {!currentVideo && !sequencerClips && analysisResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl cinema-card text-xs font-mono">
              <span className="text-zinc-300">
                Viewing analysis for: <strong className="text-amber-400">{analysisResult.fileName}</strong>
              </span>
              <button
                onClick={() => setAnalysisResult(null)}
                className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
              >
                Analyze New Reel
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

      <footer className="border-t border-amber-500/20 bg-[#060709] py-6 text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-zinc-300">ViralFlow AI &amp; Studio</span>
            <span>— 100% Client-Side Multi-Clip Master Reel Engine</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>TikTok Hooks</span>
            <span>•</span>
            <span>Facebook Descriptions</span>
            <span>•</span>
            <span>Google Flow Music</span>
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
