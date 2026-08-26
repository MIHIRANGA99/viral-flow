import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Scan,
  Volume2,
  Loader2,
  Upload,
  RefreshCw,
  Zap,
  AlertTriangle,
  Crop,
  Maximize2,
  ArrowDown,
  ArrowUp,
  Move,
  Clock,
  ArrowLeftRight,
  FastForward,
  Rewind,
  Layers,
  Undo2,
  XCircle,
  Play,
} from 'lucide-react';
import type { SubtitleCue, TargetLanguage, SubtitleAnalysisResult, SubtitleScanZone } from '../../types/studio';
import { formatTimeSRT, generateSRTContent, parseSRT, parseTimeToSeconds } from '../../utils/srtParser';
import { ShinyText } from '../reactbits/ShinyText';
import { DecryptedText } from '../reactbits/DecryptedText';
import { RealFrameZonePreview } from './RealFrameZonePreview';

export type SubtitleExtractionMode = 'visual-ocr' | 'audio-speech' | 'import-srt';
export type SubtitleScanScope = 'current-clip' | 'full-video' | 'first-5min';

export interface SubtitleScanOptions {
  scope: SubtitleScanScope;
  sampleIntervalSeconds: number;
  customStartTime?: number;
  customEndTime?: number;
}

interface SubtitleStudioPanelProps {
  cues: SubtitleCue[];
  onCuesChange: (newCues: SubtitleCue[]) => void;
  targetLanguage: TargetLanguage;
  onTargetLanguageChange: (lang: TargetLanguage) => void;
  onGenerateSubtitles: (mode: SubtitleExtractionMode, forceRescan?: boolean, options?: SubtitleScanOptions) => void;
  onImportSRT: (cues: SubtitleCue[]) => void;
  videoFile?: File;
  videoDuration?: number;
  selectedClipTitle?: string;
  scanZone?: SubtitleScanZone;
  onScanZoneChange?: (zone: SubtitleScanZone) => void;
  hasCachedFrames?: boolean;
  cachedFramesCount?: number;
  hasCachedAudio?: boolean;
  cachedAudioDuration?: number;
  errorMessage?: string | null;
  onClearError?: () => void;
  isGenerating: boolean;
  progress: { percent: number; status: string };
  analysisResult: SubtitleAnalysisResult | null;
  onSeekToTime?: (time: number) => void;
  onCancelGeneration?: () => void;
}

export const SubtitleStudioPanel: React.FC<SubtitleStudioPanelProps> = ({
  cues,
  onCuesChange,
  targetLanguage,
  onTargetLanguageChange,
  onGenerateSubtitles,
  onImportSRT,
  videoFile,
  videoDuration,
  selectedClipTitle = 'Part 1',
  scanZone = { preset: 'bottom', yPercent: 62, heightPercent: 38 },
  onScanZoneChange,
  hasCachedFrames = false,
  cachedFramesCount = 0,
  hasCachedAudio = false,
  cachedAudioDuration = 0,
  errorMessage = null,
  onClearError,
  isGenerating,
  progress,
  analysisResult,
  onSeekToTime,
  onCancelGeneration,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState<SubtitleExtractionMode>('audio-speech');
  const [scanScope, setScanScope] = useState<SubtitleScanScope>('full-video');
  const [scanStartTime, setScanStartTime] = useState<number>(0);
  const [scanEndTime, setScanEndTime] = useState<number | undefined>(undefined);
  const [sampleInterval, setSampleInterval] = useState<number>(2.5);
  const srtInputRef = useRef<HTMLInputElement>(null);

  const formatSecondsToTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isMemoryAvailable = selectedMode === 'visual-ocr' ? hasCachedFrames : hasCachedAudio;

  // Timeline Time Shift & Bulk Alignment State
  const [shiftAmountSeconds, setShiftAmountSeconds] = useState<number>(-39.0);
  const [showTimeShiftPanel, setShowTimeShiftPanel] = useState<boolean>(true);
  const [alignTargetTimecode, setAlignTargetTimecode] = useState<string>('01:04.5');
  const [selectedFromCueId, setSelectedFromCueId] = useState<string>('');
  const [previousCuesHistory, setPreviousCuesHistory] = useState<SubtitleCue[] | null>(null);

  // Shifts all cues (or from a specific cue onwards) by offsetSeconds
  const handleShiftTimeline = (offsetSeconds: number, fromCueId?: string) => {
    if (cues.length === 0 || offsetSeconds === 0) return;
    setPreviousCuesHistory([...cues]);

    let shouldApply = !fromCueId;
    const updated = cues.map((cue) => {
      if (fromCueId && cue.id === fromCueId) {
        shouldApply = true;
      }
      if (shouldApply) {
        const newStart = Math.max(0, Number((cue.startTime + offsetSeconds).toFixed(2)));
        const newEnd = Math.max(newStart + 0.3, Number((cue.endTime + offsetSeconds).toFixed(2)));
        return {
          ...cue,
          startTime: newStart,
          endTime: newEnd,
        };
      }
      return cue;
    });

    onCuesChange(updated);
  };

  // 1-Click Sync/Align first cue (or selected cue) to exact target timecode (e.g. 01:04.5 or 64.5s)
  const handleAlignCueToTargetTime = (targetTimeStr: string, fromCueId?: string) => {
    if (cues.length === 0) return;
    const targetCue = fromCueId ? cues.find((c) => c.id === fromCueId) : cues[0];
    if (!targetCue) return;

    // Parse target timecode (MM:SS.sss or SS.s or HH:MM:SS)
    let targetSec = 0;
    const clean = targetTimeStr.trim().replace(/,/g, '.');
    const parts = clean.split(':');
    if (parts.length === 1) {
      targetSec = parseFloat(parts[0]) || 0;
    } else if (parts.length === 2) {
      targetSec = (parseFloat(parts[0]) || 0) * 60 + (parseFloat(parts[1]) || 0);
    } else if (parts.length === 3) {
      targetSec = (parseFloat(parts[0]) || 0) * 3600 + (parseFloat(parts[1]) || 0) * 60 + (parseFloat(parts[2]) || 0);
    }

    const delta = Number((targetSec - targetCue.startTime).toFixed(2));
    handleShiftTimeline(delta, fromCueId);
  };

  const handleUndoTimeShift = () => {
    if (previousCuesHistory) {
      onCuesChange(previousCuesHistory);
      setPreviousCuesHistory(null);
    }
  };

  const languages: TargetLanguage[] = [
    'Sinhala',
    'English',
    'Tamil',
    'Hindi',
    'Spanish',
    'French',
    'German',
    'Japanese',
    'Chinese',
    'Arabic',
  ];

  const handleUpdateCueText = (id: string, newText: string) => {
    onCuesChange(
      cues.map((c) => (c.id === id ? { ...c, translatedText: newText } : c))
    );
  };

  const handleUpdateCueTimes = (id: string, newStart: number, newEnd: number) => {
    const validStart = Math.max(0, Number(newStart.toFixed(2)));
    const validEnd = Math.max(validStart + 0.1, Number(newEnd.toFixed(2)));
    onCuesChange(
      cues.map((c) => (c.id === id ? { ...c, startTime: validStart, endTime: validEnd } : c))
    );
  };

  const handleAdjustCueEndTime = (id: string, deltaSeconds: number) => {
    const cue = cues.find((c) => c.id === id);
    if (!cue) return;
    const newEnd = Math.max(cue.startTime + 0.1, Number((cue.endTime + deltaSeconds).toFixed(2)));
    handleUpdateCueTimes(id, cue.startTime, newEnd);
  };

  const handleAdjustCueStartTime = (id: string, deltaSeconds: number) => {
    const cue = cues.find((c) => c.id === id);
    if (!cue) return;
    const newStart = Math.max(0, Number((cue.startTime + deltaSeconds).toFixed(2)));
    const newEnd = Math.max(newStart + 0.1, cue.endTime);
    handleUpdateCueTimes(id, newStart, newEnd);
  };

  const handleAddCue = () => {
    const lastCue = cues[cues.length - 1];
    const newStart = lastCue ? lastCue.endTime + 0.5 : 0;
    const newCue: SubtitleCue = {
      id: `cue-${Date.now().toString(36)}`,
      startTime: newStart,
      endTime: newStart + 3,
      sourceText: 'New subtitle dialogue line',
      translatedText: targetLanguage === 'Sinhala' ? 'නව උපසිරැසි පෙළ' : 'New subtitle text',
    };
    onCuesChange([...cues, newCue]);
  };

  const handleDeleteCue = (id: string) => {
    onCuesChange(cues.filter((c) => c.id !== id));
  };

  const handleDownloadSRT = () => {
    const srt = generateSRTContent(cues);
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles_${targetLanguage.toLowerCase()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUploadSRT = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      const parsed = parseSRT(text);
      if (parsed.length > 0) {
        onImportSRT(parsed);
      }
    }
  };

  const filteredCues = cues.filter(
    (c) =>
      c.sourceText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.translatedText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const triggerScan = (forceRescan = false) => {
    onGenerateSubtitles(selectedMode, forceRescan, {
      scope: scanScope,
      sampleIntervalSeconds: sampleInterval,
      customStartTime: scanStartTime,
      customEndTime: scanEndTime,
    });
  };

  return (
    <div className="cinema-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Hidden SRT file input */}
      <input
        ref={srtInputRef}
        type="file"
        accept=".srt,.vtt"
        onChange={handleFileUploadSRT}
        className="hidden"
      />

      {/* Header & Generation Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-amber-500/20">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Scan className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-black text-white font-mono tracking-tight flex items-center gap-2">
                <span>AI Subtitle &amp; Lyrics</span>
                <ShinyText text="Sinhala Studio" speed={3} className="font-mono text-lg font-black" />
              </h3>
              {isMemoryAvailable && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  {selectedMode === 'visual-ocr'
                    ? `${cachedFramesCount} Frames in Memory`
                    : `Audio in Memory (${formatSecondsToTime(cachedAudioDuration || 0)})`}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              {selectedMode === 'audio-speech'
                ? 'Speech AI listens to voice waveforms without skipping lines, translating directly to Sinhala'
                : 'Dense 2.5s frame scanning reads every dialogue from second 00:00 to end without skipping lines'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Target Language Dropdown */}
          <div className="flex items-center gap-2.5 bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 rounded-2xl px-4 py-2">
            <span className="text-xs font-mono text-zinc-400">Translate To:</span>
            <select
              value={targetLanguage}
              onChange={(e) => onTargetLanguageChange(e.target.value as TargetLanguage)}
              className="bg-transparent text-xs font-black text-amber-300 focus:outline-none cursor-pointer font-mono"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang} className="bg-zinc-950 text-white">
                  {lang === 'Sinhala' ? 'Sinhala (සිංහල) [Primary]' : lang}
                </option>
              ))}
            </select>
          </div>

          {/* AI Trigger & Cancel Buttons */}
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-2xl text-xs font-mono font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Processing ({progress.percent}%)...</span>
              </div>
              {onCancelGeneration && (
                <button
                  type="button"
                  onClick={onCancelGeneration}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl shadow-xl shadow-rose-600/30 transition-all cursor-pointer uppercase tracking-wider font-mono hover:scale-105"
                  title="Cancel current scanning/extraction task immediately"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel / Stop</span>
                </button>
              )}
            </div>
          ) : isMemoryAvailable ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => triggerScan(false)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-black font-black text-xs rounded-2xl shadow-xl shadow-emerald-500/25 transition-all cursor-pointer uppercase tracking-wider font-mono"
              >
                <Zap className="w-4 h-4 text-black fill-current" />
                Retry Gemini (Instant 0s Memory)
              </button>

              <button
                type="button"
                onClick={() => triggerScan(true)}
                title="Discard cached memory and extract again from scratch"
                className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl border border-zinc-800 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => triggerScan(false)}
              className="flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-xs rounded-2xl shadow-xl shadow-amber-500/25 transition-all cursor-pointer uppercase tracking-wider font-mono"
            >
              <Sparkles className="w-4 h-4 text-black fill-current" />
              {selectedMode === 'audio-speech' ? 'Transcribe & Translate Speech' : 'Scan Subtitles'} ({scanScope === 'full-video' ? 'Full Movie' : selectedClipTitle})
            </button>
          )}
        </div>
      </div>

      {/* Scope and Density Selector Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/70 border border-amber-500/20 space-y-3.5 text-xs font-mono">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-zinc-400 font-bold">Scan Scope:</span>
            <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setScanScope('full-video');
                  setScanStartTime(0);
                }}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  scanScope === 'full-video'
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🎬 Full Movie (00:00 - End)
              </button>
              <button
                type="button"
                onClick={() => setScanScope('current-clip')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  scanScope === 'current-clip'
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🎯 Current Part ({selectedClipTitle})
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanScope('first-5min');
                  setScanStartTime(0);
                }}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  scanScope === 'first-5min'
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ⏱️ First 5 Mins (Fast Test)
              </button>
            </div>
          </div>

          {/* Custom Frame Sample Interval (Gap) */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 font-bold">Sample Gap:</span>
              <div className="flex items-center bg-zinc-950 border border-amber-500/40 rounded-xl px-2.5 py-1 text-amber-300">
                <input
                  type="number"
                  min={0.5}
                  max={10.0}
                  step={0.1}
                  value={sampleInterval}
                  onChange={(e) => setSampleInterval(Math.max(0.5, Math.min(10.0, Number(e.target.value) || 1.0)))}
                  className="w-12 bg-transparent text-amber-300 font-bold text-center focus:outline-none"
                />
                <span className="text-zinc-500 text-[11px]">sec</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {[0.8, 1.0, 1.5, 2.0, 2.5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSampleInterval(val)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    sampleInterval === val
                      ? 'bg-amber-500 text-black border-amber-400 font-black'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {val.toFixed(1)}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start Frame / Custom Timecode Section */}
        <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              📍 Start Frame (Second):
            </span>
            <div className="flex items-center bg-zinc-950 border border-amber-500/50 rounded-xl px-3 py-1">
              <input
                type="number"
                min={0}
                max={videoDuration || 3600}
                step={1}
                value={scanStartTime}
                onChange={(e) => setScanStartTime(Math.max(0, Number(e.target.value) || 0))}
                className="w-16 bg-transparent text-amber-300 font-bold text-center focus:outline-none"
              />
              <span className="text-zinc-400 font-bold text-[11px]">s ({formatSecondsToTime(scanStartTime)})</span>
            </div>

            {/* Quick Start Jump Presets */}
            <div className="flex items-center gap-1">
              {[
                { label: '0s (From Start)', val: 0 },
                { label: '15s', val: 15 },
                { label: '30s', val: 30 },
                { label: '1 Min', val: 60 },
                { label: '2 Min', val: 120 },
                { label: '5 Min', val: 300 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setScanStartTime(p.val)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                    scanStartTime === p.val
                      ? 'bg-amber-500/30 text-amber-300 border-amber-400 font-black'
                      : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-bold">End Frame (Optional):</span>
            <div className="flex items-center bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1">
              <input
                type="number"
                min={scanStartTime + 1}
                max={videoDuration || 3600}
                placeholder="End"
                value={scanEndTime !== undefined ? scanEndTime : ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setScanEndTime(val);
                }}
                className="w-14 bg-transparent text-zinc-300 font-bold text-center focus:outline-none placeholder:text-zinc-600"
              />
              <span className="text-zinc-500 text-[10px]">
                {scanEndTime !== undefined ? `s (${formatSecondsToTime(scanEndTime)})` : 'Full'}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500">
              Scanning: <strong className="text-amber-400">{formatSecondsToTime(scanStartTime)}</strong> → <strong className="text-amber-400">{scanEndTime ? formatSecondsToTime(scanEndTime) : 'End of Video'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Error Alert Box with 1-click Memory Retry */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-start justify-between gap-3 text-xs font-mono text-rose-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-300 mb-0.5">Gemini API Service Busy (503 / Rate Limit)</div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">{errorMessage}</p>
              {hasCachedFrames && (
                <p className="text-emerald-400 text-[11px] mt-1 font-bold">
                  ✓ Your {cachedFramesCount} video frames are saved in memory! No need to re-scan.
                </p>
              )}
            </div>
          </div>
          {hasCachedFrames && (
            <button
              type="button"
              onClick={() => {
                onClearError?.();
                onGenerateSubtitles(selectedMode, false);
              }}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-black font-black text-xs rounded-xl shadow-md cursor-pointer shrink-0 uppercase tracking-wider font-mono"
            >
              ⚡ Instant Retry
            </button>
          )}
        </div>
      )}

      {/* Detection Mode Switcher Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setSelectedMode('audio-speech')}
          className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
            selectedMode === 'audio-speech'
              ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg ring-1 ring-amber-500/30'
              : 'cinema-card text-zinc-400 hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black font-mono text-amber-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> Audio Speech AI
            </span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
              100% ACCURATE
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Listens to spoken voices &amp; dialogue waveforms without skipping lines, translating directly to Sinhala.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedMode('visual-ocr')}
          className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
            selectedMode === 'visual-ocr'
              ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg ring-1 ring-amber-500/30'
              : 'cinema-card text-zinc-400 hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black font-mono text-zinc-200 flex items-center gap-1.5">
              <Scan className="w-3.5 h-3.5 text-amber-400" /> Visual OCR Scanner
            </span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
              ON-SCREEN TEXT
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Reads burned-in on-screen subtitle text visually from video frames in the selected region.
          </p>
        </button>

        <button
          type="button"
          onClick={() => srtInputRef.current?.click()}
          className="cinema-card p-3.5 rounded-2xl text-left border border-zinc-800 hover:border-amber-400 text-zinc-400 hover:text-white transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black font-mono text-zinc-200 flex items-center gap-1.5 group-hover:text-amber-300">
              <Upload className="w-3.5 h-3.5 text-amber-400" /> Import .SRT File
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Have an existing subtitle file? Click here to upload &amp; instantly auto-translate to Sinhala.
          </p>
        </button>
      </div>

      {/* Visual Subtitle Scan Zone Selector (Active in Visual OCR Mode) */}
      {selectedMode === 'visual-ocr' && (
        <div className="p-5 rounded-2xl bg-zinc-950/70 border border-amber-500/25 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Crop className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-white font-mono uppercase tracking-wider">
                In-Video Subtitle Scan Zone (Target Region)
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              Where are the hardcoded subtitles in your video?
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Zone Presets */}
            <div className="lg:col-span-8 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onScanZoneChange?.({
                      preset: 'bottom',
                      yPercent: 62,
                      heightPercent: 38,
                    })
                  }
                  className={`px-3 py-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    scanZone.preset === 'bottom'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Bottom (Default)</span>
                  <span className="text-[9px] text-zinc-500">Lower 38%</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onScanZoneChange?.({
                      preset: 'top',
                      yPercent: 0,
                      heightPercent: 32,
                    })
                  }
                  className={`px-3 py-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    scanZone.preset === 'top'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Top Zone</span>
                  <span className="text-[9px] text-zinc-500">Upper 32%</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onScanZoneChange?.({
                      preset: 'middle',
                      yPercent: 30,
                      heightPercent: 40,
                    })
                  }
                  className={`px-3 py-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    scanZone.preset === 'middle'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>Center / Middle</span>
                  <span className="text-[9px] text-zinc-500">Middle 40%</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onScanZoneChange?.({
                      preset: 'fullscreen',
                      yPercent: 0,
                      heightPercent: 100,
                    })
                  }
                  className={`px-3 py-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    scanZone.preset === 'fullscreen'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Full Screen</span>
                  <span className="text-[9px] text-zinc-500">Entire 100%</span>
                </button>
              </div>

              {/* Custom Sliders for Fine-Tuning */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                    <span>Vertical Position (Top Offset):</span>
                    <span className="text-amber-400 font-bold">{scanZone.yPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    step={1}
                    value={scanZone.yPercent}
                    onChange={(e) =>
                      onScanZoneChange?.({
                        preset: 'custom',
                        yPercent: Number(e.target.value),
                        heightPercent: Math.min(100 - Number(e.target.value), scanZone.heightPercent),
                      })
                    }
                    className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                    <span>Scan Height:</span>
                    <span className="text-amber-400 font-bold">{scanZone.heightPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={100 - scanZone.yPercent}
                    step={1}
                    value={scanZone.heightPercent}
                    onChange={(e) =>
                      onScanZoneChange?.({
                        preset: 'custom',
                        yPercent: scanZone.yPercent,
                        heightPercent: Number(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Real Movie Video Frame Monitor with Live Scan Zone Overlay */}
            <div className="lg:col-span-4 flex flex-col items-center">
              <RealFrameZonePreview
                videoFile={videoFile}
                scanZone={scanZone}
                videoDuration={videoDuration}
                onSetStartTime={(t) => setScanStartTime(Math.floor(t))}
              />
            </div>
          </div>
        </div>
      )}
      {/* Progress Bar while generating */}
      {isGenerating && (
        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-3 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200 font-mono">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" /> {progress.status}
            </span>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="font-black text-amber-300 bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
                {progress.percent}%
              </span>
              {onCancelGeneration && (
                <button
                  type="button"
                  onClick={onCancelGeneration}
                  className="flex items-center gap-1.5 px-3 py-1 bg-rose-600/90 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer font-mono hover:scale-105"
                  title="Stop and cancel current generation"
                >
                  <XCircle className="w-3.5 h-3.5" /> Stop / Cancel
                </button>
              )}
            </div>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-300 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Detection Meta Summary */}
      {analysisResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="cinema-card p-3.5 rounded-2xl flex items-center gap-3 border border-zinc-800">
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-xs font-mono">
              <span className="text-zinc-400">Audio Source Track: </span>
              <strong className="text-amber-300">
                <DecryptedText text={analysisResult.sourceLanguage} speed={25} maxIterations={10} animateOn="mount" />
              </strong>
            </div>
          </div>
          <div className="cinema-card p-3.5 rounded-2xl flex items-center gap-3 border border-zinc-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-xs font-mono">
              <span className="text-zinc-400">Synced Timeline: </span>
              <strong className="text-white">{cues.length} Subtitle Cues</strong>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Timeline Sync & Subtitle Time Shift Toolbar */}
      {cues.length > 0 && (
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-amber-500/30 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span>Timeline Sync &amp; Subtitle Shift Tool</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.2 rounded-full font-bold">
                    {cues.length} Cues
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Pull back or push forward all subtitles to match the exact video scene timings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {previousCuesHistory && (
                <button
                  type="button"
                  onClick={handleUndoTimeShift}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-300 hover:text-white rounded-xl text-xs font-mono font-bold border border-zinc-700 transition cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Undo Shift
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowTimeShiftPanel(!showTimeShiftPanel)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-mono font-bold border border-zinc-800 cursor-pointer"
              >
                {showTimeShiftPanel ? 'Hide Controls' : 'Show Controls'}
              </button>
            </div>
          </div>

          {showTimeShiftPanel && (
            <div className="space-y-4 text-xs font-mono">
              {/* Feature 1: Snap & Align First Cue */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>1-Click Real Dialogue Alignment:</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    AI generated Cue #1 at <strong className="text-white">{formatTimeSRT(cues[0]?.startTime || 0)}</strong>. Where does the actor actually speak in the video?
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5">
                    <span className="text-zinc-500 text-[10px] mr-1.5">Real Time:</span>
                    <input
                      type="text"
                      value={alignTargetTimecode}
                      onChange={(e) => setAlignTargetTimecode(e.target.value)}
                      placeholder="01:04.5"
                      className="w-20 bg-transparent text-amber-300 font-black text-center focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAlignCueToTargetTime(alignTargetTimecode, selectedFromCueId || undefined)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs rounded-xl shadow-md cursor-pointer tracking-wider uppercase flex items-center gap-1.5"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    🎯 Auto-Pull Back All Cues
                  </button>
                </div>
              </div>

              {/* Feature 2: Quick Jump Shifts */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <Rewind className="w-3.5 h-3.5" /> Pull Back:
                  </span>
                  {[-10, -5, -2, -1, -0.5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleShiftTimeline(s, selectedFromCueId || undefined)}
                      className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-800/50 rounded-lg text-[11px] font-bold transition cursor-pointer"
                    >
                      {s}s
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <FastForward className="w-3.5 h-3.5" /> Push Forward:
                  </span>
                  {[+0.5, +1, +2, +5, +10].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleShiftTimeline(s, selectedFromCueId || undefined)}
                      className="px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 hover:text-white border border-emerald-800/50 rounded-lg text-[11px] font-bold transition cursor-pointer"
                    >
                      +{s}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature 3: Custom Exact Shift Input */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Custom Shift Seconds:</span>
                  <div className="flex items-center bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1">
                    <input
                      type="number"
                      step="0.1"
                      value={shiftAmountSeconds}
                      onChange={(e) => setShiftAmountSeconds(Number(e.target.value))}
                      className="w-16 bg-transparent text-white font-bold text-center focus:outline-none"
                    />
                    <span className="text-zinc-500 text-[10px]">sec</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleShiftTimeline(shiftAmountSeconds, selectedFromCueId || undefined)}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Apply Exact Shift
                  </button>
                </div>

                {selectedFromCueId && (
                  <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                    <span>Shifting from selected cue onwards</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFromCueId('')}
                      className="text-zinc-400 hover:text-white ml-1 underline cursor-pointer"
                    >
                      (Reset to All)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtitles Table / Editor */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search dialogue or translation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-900/90 border border-zinc-800 text-xs text-white px-3.5 py-2 rounded-xl w-full max-w-xs focus:outline-none focus:border-amber-500 font-mono"
          />

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleAddCue}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-800 hover:border-amber-500/40 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" /> Add Cue
            </button>

            {cues.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadSRT}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-black rounded-xl border border-amber-500/30 transition cursor-pointer font-mono"
              >
                <Download className="w-3.5 h-3.5" /> Export .SRT
              </button>
            )}
          </div>
        </div>

        {/* Cues List */}
        <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
          {filteredCues.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-400" />
              <p className="text-xs font-bold text-zinc-300">No dialogue subtitles generated</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Click &quot;Auto-Transcribe &amp; Translate&quot; to transcribe and translate with Gemini AI.
              </p>
            </div>
          ) : (
            filteredCues.map((cue, index) => (
              <SubtitleCueRow
                key={cue.id}
                cue={cue}
                index={index}
                isSelectedFrom={selectedFromCueId === cue.id}
                onUpdateText={handleUpdateCueText}
                onUpdateTimes={handleUpdateCueTimes}
                onAdjustEndTime={handleAdjustCueEndTime}
                onAdjustStartTime={handleAdjustCueStartTime}
                onSelectFrom={(id) => {
                  if (selectedFromCueId === id) {
                    setSelectedFromCueId('');
                  } else {
                    setSelectedFromCueId(id);
                    setShowTimeShiftPanel(true);
                  }
                }}
                onDelete={handleDeleteCue}
                onSeek={(time) => onSeekToTime?.(time)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface SubtitleCueRowProps {
  cue: SubtitleCue;
  index: number;
  isSelectedFrom: boolean;
  onUpdateText: (id: string, text: string) => void;
  onUpdateTimes: (id: string, start: number, end: number) => void;
  onAdjustEndTime: (id: string, delta: number) => void;
  onAdjustStartTime: (id: string, delta: number) => void;
  onSelectFrom: (id: string) => void;
  onDelete: (id: string) => void;
  onSeek: (time: number) => void;
}

const formatCompactTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1);
  const [sec, ms] = s.split('.');
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${ms}`;
};

const SubtitleCueRow: React.FC<SubtitleCueRowProps> = ({
  cue,
  index,
  isSelectedFrom,
  onUpdateText,
  onUpdateTimes,
  onAdjustEndTime,
  onAdjustStartTime,
  onSelectFrom,
  onDelete,
  onSeek,
}) => {
  const [startInput, setStartInput] = useState(formatCompactTime(cue.startTime));
  const [endInput, setEndInput] = useState(formatCompactTime(cue.endTime));

  useEffect(() => {
    setStartInput(formatCompactTime(cue.startTime));
    setEndInput(formatCompactTime(cue.endTime));
  }, [cue.startTime, cue.endTime]);

  const commitStart = () => {
    const s = parseTimeToSeconds(startInput);
    if (!isNaN(s)) {
      onUpdateTimes(cue.id, s, cue.endTime);
    } else {
      setStartInput(formatCompactTime(cue.startTime));
    }
  };

  const commitEnd = () => {
    const e = parseTimeToSeconds(endInput);
    if (!isNaN(e)) {
      onUpdateTimes(cue.id, cue.startTime, e);
    } else {
      setEndInput(formatCompactTime(cue.endTime));
    }
  };

  const durationSec = Math.max(0.1, cue.endTime - cue.startTime).toFixed(1);

  return (
    <div className="cinema-card rounded-2xl p-3.5 transition-all flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3.5 group hover:border-amber-500/40">
      {/* Left: Timing & Play Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
        {/* Cue Index Badge & Play/Seek */}
        <button
          type="button"
          onClick={() => onSeek(cue.startTime)}
          className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black font-mono text-[11px] font-black border border-amber-500/30 transition flex items-center gap-1 cursor-pointer"
          title="Click to jump and play video at this cue"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>#{index + 1}</span>
        </button>

        {/* Start Time Editor */}
        <div className="flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-amber-500/60 rounded-xl px-2 py-1 gap-1">
          <span className="text-[10px] text-zinc-500 font-mono">In:</span>
          <input
            type="text"
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
            onBlur={commitStart}
            onKeyDown={(e) => e.key === 'Enter' && commitStart()}
            className="w-16 bg-transparent text-amber-300 font-mono text-xs font-bold text-center focus:outline-none"
            title="Cue Start Time (e.g. 01:04.5)"
          />
        </div>

        {/* Start Time Quick Step Buttons */}
        <div className="flex items-center gap-0.5 bg-zinc-900/90 border border-zinc-800 rounded-xl p-0.5" title="Quickly adjust Start Time">
          <button
            type="button"
            onClick={() => onAdjustStartTime(cue.id, -0.5)}
            className="px-1.5 py-0.5 rounded-lg bg-zinc-800 hover:bg-rose-950 hover:text-rose-300 text-zinc-400 text-[10px] font-mono font-bold transition cursor-pointer"
            title="Shift Start Time earlier by -0.5s"
          >
            -0.5s
          </button>
          <button
            type="button"
            onClick={() => onAdjustStartTime(cue.id, +0.5)}
            className="px-1.5 py-0.5 rounded-lg bg-zinc-800 hover:bg-emerald-950 hover:text-emerald-300 text-zinc-400 text-[10px] font-mono font-bold transition cursor-pointer"
            title="Shift Start Time later by +0.5s"
          >
            +0.5s
          </button>
        </div>

        <span className="text-zinc-600 text-xs font-mono">→</span>

        {/* End Time Editor (Directly Editable!) */}
        <div className="flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-amber-500/60 rounded-xl px-2 py-1 gap-1">
          <span className="text-[10px] text-zinc-500 font-mono">Out:</span>
          <input
            type="text"
            value={endInput}
            onChange={(e) => setEndInput(e.target.value)}
            onBlur={commitEnd}
            onKeyDown={(e) => e.key === 'Enter' && commitEnd()}
            className="w-16 bg-transparent text-amber-300 font-mono text-xs font-bold text-center focus:outline-none"
            title="Cue End Time (e.g. 01:08.2) - Edit directly!"
          />
        </div>

        {/* End Time Quick Step Buttons */}
        <div className="flex items-center gap-0.5 bg-zinc-900/90 border border-zinc-800 rounded-xl p-0.5" title="Quickly adjust End Time">
          <span className="text-[9px] font-mono text-zinc-500 px-1">End:</span>
          <button
            type="button"
            onClick={() => onAdjustEndTime(cue.id, -0.5)}
            className="px-1.5 py-0.5 rounded-lg bg-zinc-800 hover:bg-rose-950 hover:text-rose-300 text-zinc-400 text-[10px] font-mono font-bold transition cursor-pointer"
            title="Shorten End Time by -0.5s"
          >
            -0.5s
          </button>
          <button
            type="button"
            onClick={() => onAdjustEndTime(cue.id, +0.5)}
            className="px-1.5 py-0.5 rounded-lg bg-zinc-800 hover:bg-emerald-950 hover:text-emerald-300 text-zinc-400 text-[10px] font-mono font-bold transition cursor-pointer"
            title="Lengthen End Time by +0.5s"
          >
            +0.5s
          </button>
        </div>

        <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
          ({durationSec}s)
        </span>
      </div>

      {/* Center: Subtitle Text Editor */}
      <div className="flex-1 w-full space-y-1">
        <div className="text-[11px] text-zinc-400 font-sans italic line-clamp-1">
          &quot;{cue.sourceText}&quot;
        </div>
        <input
          type="text"
          value={cue.translatedText}
          onChange={(e) => onUpdateText(cue.id, e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-white font-medium text-xs px-3 py-1.5 rounded-xl focus:outline-none"
          placeholder="Enter translated subtitle..."
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 shrink-0 self-end xl:self-center">
        <button
          type="button"
          onClick={() => onSelectFrom(cue.id)}
          className={`p-2 rounded-xl transition cursor-pointer text-xs font-mono flex items-center gap-1 ${
            isSelectedFrom
              ? 'bg-amber-500/30 text-amber-300 border border-amber-400 font-bold'
              : 'text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10'
          }`}
          title="Select this cue to shift all subtitles from this point onwards"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden group-hover:inline text-[10px]">Shift From Here</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(cue.id)}
          className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
          title="Delete cue"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
