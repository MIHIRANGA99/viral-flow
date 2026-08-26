import React, { useState, useEffect, useRef } from 'react';
import {
  Scissors,
  Languages,
  Sparkles,
  Type,
  Download,
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import type {
  VideoMetadata,
  VideoClipSegment,
  SubtitleCue,
  SubtitleStyleConfig,
  LogoConfig,
  TransitionConfig,
  TargetLanguage,
  SubtitleAnalysisResult,
  SubtitleScanZone,
} from '../../types/studio';
import type { ExtractedAudioResult } from '../../services/audioExtractor';
import { calculateVideoSegments } from '../../services/videoChunker';
import { detectAndTranslateSubtitles } from '../../services/geminiSubtitleService';
import { scanAndTranslateVisualSubtitles } from '../../services/videoVisualSubtitleScanner';
import type { ExtractedFrame } from '../../services/videoVisualSubtitleScanner';
import { VideoSplitterControls } from './VideoSplitterControls';
import { SubtitleStudioPanel } from './SubtitleStudioPanel';
import type { SubtitleExtractionMode, SubtitleScanOptions } from './SubtitleStudioPanel';
import { LogoAnimationConfig } from './LogoAnimationConfig';
import { SubtitleStyleCustomizer } from './SubtitleStyleCustomizer';
import { ClipPreviewCarousel } from './ClipPreviewCarousel';
import { ExportQueueModal } from './ExportQueueModal';
import { DecryptedText } from '../reactbits/DecryptedText';

interface VideoStudioMainProps {
  video: VideoMetadata;
  apiKey: string;
  selectedModel?: string;
  onBack: () => void;
  onOpenApiKeyModal: () => void;
}

export const VideoStudioMain: React.FC<VideoStudioMainProps> = ({
  video,
  apiKey,
  selectedModel = 'gemini-3.6-flash',
  onBack,
  onOpenApiKeyModal,
}) => {
  // Active Studio Tab
  const [activeTab, setActiveTab] = useState<'split' | 'subtitles' | 'logo' | 'styling'>('subtitles');

  // Video Split Settings
  const [chunkThreshold, setChunkThreshold] = useState<number>(480); // 8 minutes default
  const [transitionConfig, setTransitionConfig] = useState<TransitionConfig>({
    fadeInDuration: 0.8,
    fadeOutDuration: 0.8,
    transitionType: 'fade-to-black',
  });

  // Subtitles & AI Translation Settings
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>('Sinhala');
  const [scanZone, setScanZone] = useState<SubtitleScanZone>({
    preset: 'bottom',
    yPercent: 62,
    heightPercent: 38,
  });
  const [allCues, setAllCues] = useState<SubtitleCue[]>([]);
  const [cachedFrames, setCachedFrames] = useState<ExtractedFrame[]>([]);
  const [cachedAudio, setCachedAudio] = useState<ExtractedAudioResult | null>(null);
  const [subtitleError, setSubtitleError] = useState<string | null>(null);
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState(false);
  const [subtitleProgress, setSubtitleProgress] = useState<{ percent: number; status: string }>({
    percent: 0,
    status: '',
  });
  const [analysisResult, setAnalysisResult] = useState<SubtitleAnalysisResult | null>(null);
  const [seekTime, setSeekTime] = useState<number | undefined>(undefined);

  // Logo & Branding Settings
  const [logoConfig, setLogoConfig] = useState<LogoConfig>({
    file: null,
    objectUrl: null,
    position: 'top-right',
    scale: 0.14,
    opacity: 0.9,
    margin: 30,
    animation: 'pulse',
    animationSpeed: 1,
  });

  // Subtitle Styling & Mask Settings
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyleConfig>({
    fontFamily: 'Noto Sans Sinhala',
    fontSize: 38,
    textColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 6,
    backgroundColor: '#000000',
    backgroundOpacity: 0.85,
    backgroundPadding: 16,
    borderRadius: 12,
    positionY: 12,
    alignment: 'center',
    bold: true,
    maxWidthPercent: 82,
    maskOriginalSubtitles: true,
  });

  // Calculated Clips
  const [clips, setClips] = useState<VideoClipSegment[]>([]);
  const [selectedClip, setSelectedClip] = useState<VideoClipSegment | null>(null);

  // Export Modal State
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Auto-Save & Session Recovery State
  const [restoredDraftBanner, setRestoredDraftBanner] = useState<{ cueCount: number; updatedAt: number } | null>(null);
  const [lastSavedText, setLastSavedText] = useState<string>('');

  // Re-calculate clips whenever video duration, threshold, or subtitle cues change
  useEffect(() => {
    if (video && video.duration > 0) {
      const calculated = calculateVideoSegments(video.duration, chunkThreshold, allCues);
      setClips(calculated);
      if (calculated.length > 0 && !selectedClip) {
        setSelectedClip(calculated[0]);
      } else if (selectedClip) {
        const stillExists = calculated.find((c) => c.index === selectedClip.index);
        setSelectedClip(stillExists || calculated[0] || null);
      }
    }
  }, [video.duration, chunkThreshold, allCues]);

  // Load and recover saved draft from localStorage on mount
  useEffect(() => {
    if (!video || !video.name) return;
    const draftKey = `viral_flow_draft_${encodeURIComponent(video.name)}_${video.size}`;
    try {
      const savedStr = localStorage.getItem(draftKey) || localStorage.getItem('viral_flow_last_draft');
      if (savedStr) {
        const draft = JSON.parse(savedStr);
        if (draft && Array.isArray(draft.allCues) && draft.allCues.length > 0) {
          // If draft matches video or is recent
          if (draft.videoName === video.name || !draft.videoName) {
            setAllCues(draft.allCues);
            if (draft.targetLanguage) setTargetLanguage(draft.targetLanguage);
            if (draft.subtitleStyle) setSubtitleStyle(draft.subtitleStyle);
            if (draft.chunkThreshold) setChunkThreshold(draft.chunkThreshold);
            setRestoredDraftBanner({
              cueCount: draft.allCues.length,
              updatedAt: draft.updatedAt || Date.now(),
            });
            setLastSavedText('Restored from draft');
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load subtitle draft from storage:', e);
    }
  }, [video.name, video.size]);

  // Real-time Auto-Save to localStorage on every change
  useEffect(() => {
    if (allCues.length === 0 || !video || !video.name) return;
    const draftKey = `viral_flow_draft_${encodeURIComponent(video.name)}_${video.size}`;
    const payload = {
      videoName: video.name,
      videoSize: video.size,
      videoDuration: video.duration,
      allCues,
      targetLanguage,
      subtitleStyle,
      chunkThreshold,
      updatedAt: Date.now(),
    };
    try {
      localStorage.setItem(draftKey, JSON.stringify(payload));
      localStorage.setItem('viral_flow_last_draft', JSON.stringify(payload));
      const now = new Date();
      setLastSavedText(`Auto-saved at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
    } catch (e) {
      console.warn('Draft auto-save error:', e);
    }
  }, [allCues, targetLanguage, subtitleStyle, chunkThreshold, video.name, video.size, video.duration]);

  // Accidental Refresh Guard: Warn user before leaving if subtitles are present
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (allCues.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [allCues.length]);

  const handleDiscardDraft = () => {
    const draftKey = `viral_flow_draft_${encodeURIComponent(video.name)}_${video.size}`;
    localStorage.removeItem(draftKey);
    localStorage.removeItem('viral_flow_last_draft');
    setAllCues([]);
    setRestoredDraftBanner(null);
    setLastSavedText('');
  };

  // Trigger Gemini Subtitle OCR & Translation
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancelSubtitles = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGeneratingSubtitles(false);
    setSubtitleProgress({ percent: 0, status: 'Generation stopped' });
  };

  const handleGenerateSubtitles = async (
    mode: SubtitleExtractionMode = 'visual-ocr',
    forceRescan = false,
    scanOptions?: SubtitleScanOptions
  ) => {
    if (!apiKey || !apiKey.trim()) {
      onOpenApiKeyModal();
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setSubtitleError(null);
    setIsGeneratingSubtitles(true);

    // Calculate time range based on scope and custom start time
    let startTime = scanOptions?.customStartTime !== undefined ? scanOptions.customStartTime : 0;
    let endTime = scanOptions?.customEndTime !== undefined && scanOptions.customEndTime > startTime ? scanOptions.customEndTime : video.duration;

    if (scanOptions?.scope === 'current-clip' && selectedClip) {
      startTime = selectedClip.startTime;
      endTime = selectedClip.endTime;
    } else if (scanOptions?.scope === 'first-5min') {
      startTime = scanOptions?.customStartTime || 0;
      endTime = Math.min(startTime + 300, video.duration);
    }

    try {
      let result: SubtitleAnalysisResult;

      if (mode === 'visual-ocr') {
        const activeCached = forceRescan ? undefined : cachedFrames;
        if (activeCached && activeCached.length > 0) {
          setSubtitleProgress({ percent: 45, status: `Using ${activeCached.length} cached frames from memory. Calling Gemini...` });
        } else {
          setSubtitleProgress({ percent: 5, status: `Scanning video frames from ${Math.floor(startTime / 60)}m ${Math.floor(startTime % 60)}s to ${Math.floor(endTime / 60)}m...` });
        }

        // Visual frame OCR scanning of in-video burned-in subtitles with dense 2.5s sampling
        const scanRes = await scanAndTranslateVisualSubtitles({
          videoFile: video.file,
          apiKey,
          targetLanguage,
          modelId: selectedModel || 'gemini-3.6-flash',
          scanZone,
          startTime,
          endTime,
          sampleIntervalSeconds: scanOptions?.sampleIntervalSeconds || 2.5,
          cachedFrames: activeCached,
          signal: abortController.signal,
          onProgress: (percent, status) => {
            setSubtitleProgress({ percent, status });
          },
        });
        result = scanRes.result;
        setCachedFrames(scanRes.frames);
      } else {
        const activeCachedAudio = forceRescan ? undefined : (cachedAudio || undefined);
        if (activeCachedAudio) {
          setSubtitleProgress({ percent: 50, status: `Using cached audio (${Math.floor(activeCachedAudio.duration)}s) from memory. Calling Gemini...` });
        } else {
          setSubtitleProgress({ percent: 10, status: `Extracting speech audio (${Math.floor(startTime)}s - ${Math.floor(endTime)}s)...` });
        }

        // Direct Audio Speech-to-Subtitle AI (100% dialogue recognition from audio track)
        const audioRes = await detectAndTranslateSubtitles({
          videoFile: video.file,
          apiKey,
          targetLanguage,
          modelId: selectedModel || 'gemini-3.6-flash',
          startTime,
          duration: endTime > startTime ? (endTime - startTime) : undefined,
          cachedAudio: activeCachedAudio,
          signal: abortController.signal,
          onProgress: (percent, status) => {
            setSubtitleProgress({ percent, status });
          },
        });
        result = audioRes.result;
        setCachedAudio(audioRes.audio);
      }

      setAnalysisResult(result);
      setAllCues(result.cues);
      setSubtitleStyle((prev) => ({
        ...prev,
        maskOriginalSubtitles: true,
        backgroundOpacity: 0.85,
      }));
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('cancelled') || abortController.signal.aborted) {
        console.log('Subtitle generation successfully cancelled by user.');
        setSubtitleError(null);
      } else {
        console.error('Subtitle OCR/Translation failed:', err);
        setSubtitleError(err.message || 'Gemini service temporarily unavailable (503).');
      }
    } finally {
      setIsGeneratingSubtitles(false);
      abortControllerRef.current = null;
    }
  };

  const handleImportSRT = (importedCues: SubtitleCue[]) => {
    setAllCues(importedCues);
    setAnalysisResult({
      sourceLanguage: 'Imported .SRT File',
      hasBurnedInSubtitles: true,
      detectedAudioSummary: `Imported ${importedCues.length} subtitle cues from external file.`,
      cues: importedCues,
    });
  };

  const handleScanZoneChange = (newZone: SubtitleScanZone) => {
    setScanZone(newZone);
    setCachedFrames([]); // Invalidate memory cache when scan zone changes so next run scans the new region
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Studio Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cinema-panel p-5 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/40 transition flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" /> Change Reel
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white font-mono line-clamp-1">
                <DecryptedText text={video.name} speed={30} maxIterations={8} animateOn="mount" />
              </h2>
              <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                MASTER REEL
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-xs font-mono text-zinc-400">
                Total Runtime: <span className="text-amber-400 font-bold">{Math.floor(video.duration / 60)}m {Math.floor(video.duration % 60)}s</span> • {video.aspectRatio} • {video.width}x{video.height}px
              </p>
              {lastSavedText && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>{lastSavedText}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Master Export Trigger Button */}
        <button
          type="button"
          onClick={() => setIsExportOpen(true)}
          className="px-7 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-xs rounded-2xl shadow-2xl shadow-amber-500/30 hover:scale-105 transition-all flex items-center justify-center gap-2.5 cursor-pointer tracking-wider uppercase group"
        >
          <Download className="w-4 h-4 text-black stroke-[3]" />
          <span>Render &amp; Export All {clips.length} Parts (.MP4)</span>
        </button>
      </div>

      {/* Auto-Restored Session Notification Banner */}
      {restoredDraftBanner && (
        <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Save className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
                <span>📂 Restored Previous Subtitle Session</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  {restoredDraftBanner.cueCount} Cues Recovered
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Your previously adjusted subtitles and timestamps for <strong className="text-zinc-200">{video.name}</strong> were safely restored from local storage!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto font-mono text-xs">
            <button
              type="button"
              onClick={() => setRestoredDraftBanner(null)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black transition cursor-pointer shadow-md"
            >
              Keep Draft
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950 hover:text-rose-300 text-zinc-400 border border-zinc-800 transition cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Discard
            </button>
          </div>
        </div>
      )}

      {/* Two-Column Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left Column: Live Mobile / Video Player & Transport Controls */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-6 lg:sticky lg:top-4">
          <ClipPreviewCarousel
            videoFile={video.file}
            clips={clips}
            selectedClip={selectedClip}
            onSelectClip={setSelectedClip}
            subtitleStyle={subtitleStyle}
            logoConfig={logoConfig}
            transitionConfig={transitionConfig}
            allCues={allCues}
            currentSeekTime={seekTime}
          />
        </div>

        {/* Right Column: Studio Navigation Tabs & Active Editor Panels */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-6">
          {/* Control Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-amber-500/20 pb-3 overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('subtitles')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs transition-all tracking-wide cursor-pointer ${
                activeTab === 'subtitles'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/25'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <Languages className="w-4 h-4" /> 1. Subtitles ({targetLanguage})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs transition-all tracking-wide cursor-pointer ${
                activeTab === 'split'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/25'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <Scissors className="w-4 h-4" /> 2. Cut &amp; Split ({Math.floor(chunkThreshold / 60)}m)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logo')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs transition-all tracking-wide cursor-pointer ${
                activeTab === 'logo'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/25'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <Sparkles className="w-4 h-4" /> 3. Logo
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('styling')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs transition-all tracking-wide cursor-pointer ${
                activeTab === 'styling'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/25'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <Type className="w-4 h-4" /> 4. Typography
            </button>
          </div>

          {/* Tab Panels */}
          <div>
            {activeTab === 'subtitles' && (
              <SubtitleStudioPanel
                cues={allCues}
                onCuesChange={setAllCues}
                targetLanguage={targetLanguage}
                onTargetLanguageChange={setTargetLanguage}
                onGenerateSubtitles={handleGenerateSubtitles}
                onImportSRT={handleImportSRT}
                videoFile={video.file}
                videoDuration={video.duration}
                selectedClipTitle={selectedClip?.title || 'Part 1'}
                scanZone={scanZone}
                onScanZoneChange={handleScanZoneChange}
                hasCachedFrames={cachedFrames.length > 0}
                cachedFramesCount={cachedFrames.length}
                hasCachedAudio={!!cachedAudio}
                cachedAudioDuration={cachedAudio?.duration}
                errorMessage={subtitleError}
                onClearError={() => setSubtitleError(null)}
                isGenerating={isGeneratingSubtitles}
                progress={subtitleProgress}
                analysisResult={analysisResult}
                onSeekToTime={(time) => setSeekTime(time)}
                onCancelGeneration={handleCancelSubtitles}
              />
            )}

            {activeTab === 'split' && (
              <VideoSplitterControls
                duration={video.duration}
                chunkThreshold={chunkThreshold}
                onChunkThresholdChange={setChunkThreshold}
                transitionConfig={transitionConfig}
                onTransitionChange={setTransitionConfig}
                totalClipsCount={clips.length}
              />
            )}

            {activeTab === 'logo' && (
              <LogoAnimationConfig
                config={logoConfig}
                onChange={setLogoConfig}
              />
            )}

            {activeTab === 'styling' && (
              <SubtitleStyleCustomizer
                styleConfig={subtitleStyle}
                onChange={setSubtitleStyle}
              />
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportQueueModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        videoFile={video.file}
        clips={clips}
        subtitleStyle={subtitleStyle}
        logoConfig={logoConfig}
        transitionConfig={transitionConfig}
        allCues={allCues}
        targetLanguage={targetLanguage}
      />
    </div>
  );
};
