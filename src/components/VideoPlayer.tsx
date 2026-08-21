import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Sparkles,
  RefreshCw,
  Clock,
  Ratio,
  Smartphone,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Disc,
  Info,
  Music,
  Download,
  Sliders,
  X,
  UploadCloud,
  FileAudio,
  CheckCircle2,
  Eraser,
  Timer,
  Gauge,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import { FullScreenLoader } from './FullScreenLoader';
import type { VideoMetadata, WatermarkConfig, MusicAdjustmentConfig } from '../types';
import { mergeVideoAndAudio } from '../services/audioMerger';
import confetti from 'canvas-confetti';

const DEFAULT_LOGO_URL = '/assets/default_logo.jpg';

export interface VideoPlayerHandle {
  seekTo: (seconds: number) => void;
  attachMusicFile?: (file: File) => void;
}

interface VideoPlayerProps {
  metadata: VideoMetadata;
  onChangeVideo: () => void;
  onAnalyze: (customPrompt?: string) => void;
  isAnalyzing: boolean;
  hasResult: boolean;
  externalMusicFile?: File | null;
  onClearExternalMusic?: () => void;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  (
    {
      metadata,
      onChangeVideo,
      onAnalyze,
      isAnalyzing,
      hasResult,
      externalMusicFile,
      onClearExternalMusic,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(metadata.duration || 15);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [viewMode, setViewMode] = useState<'fit' | 'phone'>('fit');

    // Custom Creative Direction Prompt
    const [customPrompt, setCustomPrompt] = useState('');

    // Audio mixing & Adjustment state
    const [musicFile, setMusicFile] = useState<File | null>(null);
    const [musicUrl, setMusicUrl] = useState<string | null>(null);
    const [musicDuration, setMusicDuration] = useState(30);
    const [videoVolume, setVideoVolume] = useState(0.7);
    const [musicVolume, setMusicVolume] = useState(1.0);
    const [showMixer, setShowMixer] = useState(false);

    // Advanced Music Adjustment Suite
    const [musicAdjustment, setMusicAdjustment] = useState<MusicAdjustmentConfig>({
      startOffset: 0,
      fadeIn: 0.5,
      fadeOut: 1.0,
      speed: 1.0,
      loop: true,
    });

    // Watermark Remover & Logo Overlay State
    const [showWatermarkPanel, setShowWatermarkPanel] = useState(false);
    const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>({
      enabled: false,
      x: 3,
      y: 3,
      width: 22,
      height: 7,
      mode: 'logo',
      cropZoom: 1.06,
      blurStrength: 12,
      logoOverlay: {
        enabled: true,
        imageUrl: DEFAULT_LOGO_URL,
        x: 72, // Bottom-right default for vertical clips
        y: 91,
        width: 24,
        opacity: 0.95,
        borderRadius: 8,
      },
    });

    // Render / Export state
    const [isRendering, setIsRendering] = useState(false);
    const [renderProgress, setRenderProgress] = useState<{ percent: number; status: string }>({
      percent: 0,
      status: '',
    });

    const isVertical = metadata.aspectRatio.includes('9:16') || metadata.aspectRatio.includes('Vertical');

    useEffect(() => {
      if (externalMusicFile) {
        handleAttachMusic(externalMusicFile);
      }
    }, [externalMusicFile]);

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (videoRef.current && isFinite(seconds)) {
          videoRef.current.currentTime = seconds;
          if (audioRef.current) {
            audioRef.current.currentTime = (musicAdjustment.startOffset || 0) + seconds;
          }
          videoRef.current.play();
          setIsPlaying(true);
        }
      },
      attachMusicFile: (file: File) => {
        handleAttachMusic(file);
      },
    }));

    const handleAttachMusic = (file: File) => {
      if (musicUrl) {
        URL.revokeObjectURL(musicUrl);
      }
      const url = URL.createObjectURL(file);
      setMusicFile(file);
      setMusicUrl(url);
      setShowMixer(true);

      const probeAudio = new Audio(url);
      probeAudio.onloadedmetadata = () => {
        if (isFinite(probeAudio.duration) && probeAudio.duration > 0) {
          setMusicDuration(probeAudio.duration);
        }
      };

      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
      });
    };

    const handleRemoveMusic = () => {
      if (musicUrl) {
        URL.revokeObjectURL(musicUrl);
      }
      setMusicFile(null);
      setMusicUrl(null);
      onClearExternalMusic?.();
    };

    const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleAttachMusic(e.target.files[0]);
      }
    };

    const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const newUrl = URL.createObjectURL(file);
        setWatermarkConfig((p) => ({
          ...p,
          logoOverlay: {
            ...(p.logoOverlay || {
              enabled: true,
              imageUrl: newUrl,
              x: 72,
              y: 91,
              width: 24,
              opacity: 0.95,
              borderRadius: 8,
            }),
            imageUrl: newUrl,
            enabled: true,
          },
        }));
      }
    };

    const handleResetDefaultLogo = () => {
      setWatermarkConfig((p) => ({
        ...p,
        logoOverlay: {
          ...(p.logoOverlay || {
            enabled: true,
            imageUrl: DEFAULT_LOGO_URL,
            x: 72,
            y: 91,
            width: 24,
            opacity: 0.95,
            borderRadius: 8,
          }),
          imageUrl: DEFAULT_LOGO_URL,
          enabled: true,
        },
      }));
    };

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handleTimeUpdate = () => {
        if (video && isFinite(video.currentTime)) {
          const current = video.currentTime;
          setCurrentTime(current);

          if (audioRef.current) {
            const expectedAudioTime = (musicAdjustment.startOffset || 0) + current * (musicAdjustment.speed || 1);
            if (Math.abs(audioRef.current.currentTime - expectedAudioTime) > 0.35) {
              audioRef.current.currentTime = expectedAudioTime;
            }

            const vDur = isFinite(duration) && duration > 0 ? duration : 15;
            let targetGain = musicVolume;

            if (musicAdjustment.fadeIn > 0 && current < musicAdjustment.fadeIn) {
              targetGain = musicVolume * (current / musicAdjustment.fadeIn);
            } else if (musicAdjustment.fadeOut > 0 && current > vDur - musicAdjustment.fadeOut) {
              targetGain = musicVolume * Math.max(0, (vDur - current) / musicAdjustment.fadeOut);
            }

            audioRef.current.volume = isMuted ? 0 : Math.max(0, Math.min(1, targetGain));
          }
        }
      };

      const handleDurationChange = () => {
        if (video && isFinite(video.duration) && video.duration > 0) {
          setDuration(video.duration);
        } else if (metadata.duration && isFinite(metadata.duration)) {
          setDuration(metadata.duration);
        }
      };

      const handleEnded = () => {
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('durationchange', handleDurationChange);
      video.addEventListener('ended', handleEnded);

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('durationchange', handleDurationChange);
        video.removeEventListener('ended', handleEnded);
      };
    }, [metadata, musicAdjustment, duration, musicVolume, isMuted]);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.volume = isMuted ? 0 : videoVolume;
      }
      if (audioRef.current) {
        audioRef.current.playbackRate = musicAdjustment.speed || 1.0;
      }
    }, [videoVolume, musicAdjustment.speed, isMuted]);

    const togglePlay = () => {
      if (!videoRef.current) return;
      if (isPlaying) {
        videoRef.current.pause();
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        if (audioRef.current) {
          audioRef.current.currentTime = (musicAdjustment.startOffset || 0) + videoRef.current.currentTime * (musicAdjustment.speed || 1);
          audioRef.current.play();
        }
        setIsPlaying(true);
      }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      if (isFinite(time)) {
        setCurrentTime(time);
        if (videoRef.current) videoRef.current.currentTime = time;
        if (audioRef.current) audioRef.current.currentTime = (musicAdjustment.startOffset || 0) + time * (musicAdjustment.speed || 1);
      }
    };

    const toggleMute = () => {
      setIsMuted(!isMuted);
    };

    const changePlaybackRate = () => {
      if (!videoRef.current) return;
      const rates = [1, 1.5, 2, 0.5];
      const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
      videoRef.current.playbackRate = nextRate;
      if (audioRef.current) audioRef.current.playbackRate = nextRate * (musicAdjustment.speed || 1.0);
      setPlaybackRate(nextRate);
    };

    const formatTime = (secs: number) => {
      if (!isFinite(secs) || isNaN(secs) || secs < 0) return '00:00';
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes: number) => {
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const safeDuration = isFinite(duration) && duration > 0 ? duration : (metadata.duration || 15);

    const setPresetCorner = (corner: 'tl' | 'tr' | 'bl' | 'br') => {
      if (corner === 'tl') {
        setWatermarkConfig((prev) => ({
          ...prev,
          x: 3,
          y: 3,
          width: 22,
          height: 7.5,
          logoOverlay: prev.logoOverlay ? { ...prev.logoOverlay, x: 3, y: 3 } : undefined,
        }));
      } else if (corner === 'tr') {
        setWatermarkConfig((prev) => ({
          ...prev,
          x: 72,
          y: 3,
          width: 22,
          height: 7.5,
          logoOverlay: prev.logoOverlay ? { ...prev.logoOverlay, x: 72, y: 3 } : undefined,
        }));
      } else if (corner === 'bl') {
        setWatermarkConfig((prev) => ({
          ...prev,
          x: 3,
          y: 91,
          width: 22,
          height: 7.5,
          logoOverlay: prev.logoOverlay ? { ...prev.logoOverlay, x: 3, y: 91 } : undefined,
        }));
      } else if (corner === 'br') {
        setWatermarkConfig((prev) => ({
          ...prev,
          x: 72,
          y: 91,
          width: 22,
          height: 7.5,
          logoOverlay: prev.logoOverlay ? { ...prev.logoOverlay, x: 72, y: 91 } : undefined,
        }));
      }
    };

    const handleExport = async () => {
      setIsRendering(true);
      setRenderProgress({ percent: 5, status: 'Initializing video renderer...' });

      try {
        const { downloadUrl, filename } = await mergeVideoAndAudio({
          videoFile: metadata.file,
          audioFile: musicFile,
          videoVolume,
          musicVolume,
          musicAdjustment: musicFile ? musicAdjustment : undefined,
          watermarkConfig: watermarkConfig.enabled ? watermarkConfig : undefined,
          onProgress: (percent, status) => {
            setRenderProgress({ percent, status });
          },
        });

        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err: any) {
        console.error('Render error:', err);
        alert('Failed to export video: ' + err.message);
      } finally {
        setIsRendering(false);
      }
    };

    return (
      <div className="w-full space-y-4">
        {/* Full-Screen Render/Export Loader */}
        <FullScreenLoader
          isOpen={isRendering}
          progress={renderProgress.percent}
          status={renderProgress.status}
          fileName={metadata.name}
          type="export"
        />

        {/* Hidden Audio File Input */}
        <input
          type="file"
          ref={audioInputRef}
          onChange={handleAudioFileChange}
          accept="audio/mp3,audio/wav,audio/m4a,audio/aac,audio/ogg,audio/*"
          className="hidden"
        />

        {/* Hidden Custom Logo Input */}
        <input
          type="file"
          ref={logoInputRef}
          onChange={handleCustomLogoUpload}
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
        />

        {/* Hidden Background Audio Player */}
        {musicUrl && (
          <audio
            ref={audioRef}
            src={musicUrl}
            loop={musicAdjustment.loop}
            preload="auto"
          />
        )}

        {/* Main Video Box */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-4">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate" title={metadata.name}>
                {metadata.name}
              </h4>
              <div className="flex items-center gap-2.5 mt-1 text-[11px] text-slate-400">
                <span className="font-mono text-slate-300">{formatFileSize(metadata.size)}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300 font-mono">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  {isFinite(safeDuration) ? safeDuration.toFixed(1) : '15.0'}s
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-indigo-300 font-medium">
                  <Ratio className="w-3 h-3 text-indigo-400" />
                  {metadata.aspectRatio}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Watermark / Logo Overlay Button Toggle */}
              <button
                onClick={() => {
                  setShowWatermarkPanel(!showWatermarkPanel);
                  if (!watermarkConfig.enabled) {
                    setWatermarkConfig((p) => ({ ...p, enabled: true }));
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 cursor-pointer ${
                  watermarkConfig.enabled
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm shadow-rose-500/10'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Watermark Remover & Brand Logo Overlay"
              >
                <Eraser className="w-3.5 h-3.5 text-rose-400" />
                <span>Watermark / Logo</span>
                {watermarkConfig.enabled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                )}
              </button>

              {isVertical && (
                <button
                  onClick={() => setViewMode(viewMode === 'fit' ? 'phone' : 'fit')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 cursor-pointer ${
                    viewMode === 'phone'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title="Toggle Phone Frame"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Phone Frame</span>
                </button>
              )}

              <button
                onClick={onChangeVideo}
                disabled={isAnalyzing}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Change</span>
              </button>
            </div>
          </div>

          {/* Video Player Display Container (Auto-adapts to 9:16 vertical ratio) */}
          <div className="flex justify-center">
            <div
              ref={videoContainerRef}
              className={`relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 group transition-all duration-300 ${
                isVertical
                  ? viewMode === 'phone'
                    ? 'w-[260px] sm:w-[290px] aspect-[9/16] ring-4 ring-slate-800/80'
                    : 'w-[260px] sm:w-[310px] aspect-[9/16] ring-2 ring-slate-800/80'
                  : 'w-full aspect-video max-h-[380px]'
              }`}
            >
              <video
                ref={videoRef}
                src={metadata.objectUrl}
                className="w-full h-full object-contain cursor-pointer transition-transform duration-200"
                style={
                  watermarkConfig.enabled && watermarkConfig.mode === 'crop'
                    ? {
                        transform: `scale(${watermarkConfig.cropZoom || 1.06})`,
                        transformOrigin:
                          watermarkConfig.x < 30 && watermarkConfig.y < 30
                            ? 'bottom right'
                            : watermarkConfig.x > 60 && watermarkConfig.y < 30
                            ? 'bottom left'
                            : watermarkConfig.x < 30 && watermarkConfig.y > 60
                            ? 'top right'
                            : 'center center',
                      }
                    : undefined
                }
                onClick={togglePlay}
                playsInline
              />

              {/* Mode: Brand Logo Overlay Preview */}
              {watermarkConfig.enabled && watermarkConfig.mode === 'logo' && watermarkConfig.logoOverlay?.enabled && (
                <div
                  className="absolute pointer-events-none transition-all duration-150 z-20"
                  style={{
                    left: `${watermarkConfig.logoOverlay.x}%`,
                    top: `${watermarkConfig.logoOverlay.y}%`,
                    width: `${watermarkConfig.logoOverlay.width}%`,
                    opacity: watermarkConfig.logoOverlay.opacity ?? 0.95,
                  }}
                >
                  <img
                    src={watermarkConfig.logoOverlay.imageUrl}
                    alt="Brand Logo"
                    className="w-full h-auto object-contain shadow-2xl transition-all"
                    style={{
                      borderRadius: `${watermarkConfig.logoOverlay.borderRadius || 6}px`,
                      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
                    }}
                  />
                  {showWatermarkPanel && (
                    <div className="absolute inset-0 border border-dashed border-amber-400 rounded pointer-events-none" />
                  )}
                </div>
              )}

              {/* Mode: Inpaint / Blur Filter Simulation */}
              {watermarkConfig.enabled && watermarkConfig.mode !== 'crop' && watermarkConfig.mode !== 'logo' && (
                <div
                  className="absolute pointer-events-none transition-all duration-100 z-10 overflow-hidden"
                  style={{
                    left: `${watermarkConfig.x}%`,
                    top: `${watermarkConfig.y}%`,
                    width: `${watermarkConfig.width}%`,
                    height: `${watermarkConfig.height}%`,
                    backdropFilter: `blur(${watermarkConfig.blurStrength || 16}px) saturate(160%) brightness(0.95)`,
                    WebkitBackdropFilter: `blur(${watermarkConfig.blurStrength || 16}px) saturate(160%) brightness(0.95)`,
                    maskImage: 'radial-gradient(ellipse at center, black 65%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 65%, transparent 100%)',
                    borderRadius: '8px',
                  }}
                >
                  {showWatermarkPanel && (
                    <div className="absolute inset-0 border border-dashed border-rose-400/80 rounded flex items-center justify-center">
                      <span className="text-[9px] bg-rose-500 text-white font-mono px-1 rounded shadow">
                        {watermarkConfig.mode === 'inpaint' ? 'Clone' : 'Blur'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Background Music Active Indicator Badge */}
              {musicFile && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-500/20 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-lg z-20">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="truncate max-w-[110px]">{musicFile.name}</span>
                </div>
              )}

              {/* TikTok UI Overlay */}
              {isVertical && viewMode === 'phone' && (
                <div className="absolute right-2.5 bottom-16 flex flex-col items-center gap-3.5 pointer-events-none opacity-85 z-20">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                      <Heart className="w-4 h-4 fill-white/20 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-white shadow-black">94.2k</span>
                  </div>

                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-white">1,480</span>
                  </div>

                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                      <Bookmark className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-white">8.9k</span>
                  </div>

                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                      <Share2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-white">Share</span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-indigo-400 animate-spin">
                    <Disc className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* Center Play Button Overlay */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl hover:scale-110 hover:bg-indigo-500 transition cursor-pointer backdrop-blur-sm z-20"
                >
                  <Play className="w-6 h-6 ml-0.5" />
                </button>
              )}

              {/* Resolution Tag */}
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-white/10 pointer-events-none z-20">
                {metadata.width}x{metadata.height}
              </div>

              {/* Player Scrubber & Controls */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 pt-6 flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition z-20">
                <input
                  type="range"
                  min="0"
                  max={safeDuration}
                  step="0.01"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
                />

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-3">
                    <button onClick={togglePlay} className="hover:text-white cursor-pointer">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button onClick={toggleMute} className="hover:text-white cursor-pointer">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span className="font-mono text-[11px] text-slate-400">
                      {formatTime(currentTime)} / {formatTime(safeDuration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={changePlaybackRate}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white border border-slate-700 cursor-pointer font-mono"
                    >
                      {playbackRate}x
                    </button>
                    <button
                      onClick={() => videoRef.current?.requestFullscreen()}
                      className="hover:text-white cursor-pointer p-0.5"
                    >
                      <Maximize className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Watermark Remover & Logo Overlay Interactive Control Panel */}
          {showWatermarkPanel && (
            <div className="rounded-xl bg-slate-950/95 border border-rose-500/30 p-4 space-y-3 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eraser className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Watermark Cleaner & Brand Logo Overlay
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={watermarkConfig.enabled}
                      onChange={(e) =>
                        setWatermarkConfig((p) => ({ ...p, enabled: e.target.checked }))
                      }
                      className="accent-rose-500 rounded cursor-pointer"
                    />
                    <span>{watermarkConfig.enabled ? 'Active' : 'Disabled'}</span>
                  </label>
                  <button
                    onClick={() => setShowWatermarkPanel(false)}
                    className="text-slate-400 hover:text-white p-1 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 4 Removal / Branding Modes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setWatermarkConfig((p) => ({ ...p, mode: 'logo' }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
                    watermarkConfig.mode === 'logo'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Logo Overlay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWatermarkConfig((p) => ({ ...p, mode: 'crop' }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    watermarkConfig.mode === 'crop'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔍 Margin Crop
                </button>

                <button
                  type="button"
                  onClick={() => setWatermarkConfig((p) => ({ ...p, mode: 'inpaint' }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    watermarkConfig.mode === 'inpaint'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ✨ Smart Inpaint
                </button>

                <button
                  type="button"
                  onClick={() => setWatermarkConfig((p) => ({ ...p, mode: 'blur' }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    watermarkConfig.mode === 'blur'
                      ? 'bg-slate-800 border-slate-600 text-slate-200 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🌫️ De-Logo Blur
                </button>
              </div>

              {/* Mode: Logo Overlay Settings */}
              {watermarkConfig.mode === 'logo' && (
                <div className="space-y-3 pt-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={watermarkConfig.logoOverlay?.imageUrl || DEFAULT_LOGO_URL}
                        alt="Logo Thumbnail"
                        className="w-10 h-10 object-cover rounded-lg border border-slate-700 bg-black"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          SOLIVAST Brand Logo (Active)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Placed over corner logo or watermark
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition flex items-center gap-1 cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Change Logo</span>
                      </button>

                      {watermarkConfig.logoOverlay?.imageUrl !== DEFAULT_LOGO_URL && (
                        <button
                          type="button"
                          onClick={handleResetDefaultLogo}
                          className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                          title="Reset to default SOLIVAST logo"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Corner Snaps for Logo */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Quick Logo Positions (Vertical Video Optimized):</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPresetCorner('tl')}
                        className="py-1 px-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium cursor-pointer"
                      >
                        Top-Left
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetCorner('tr')}
                        className="py-1 px-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium cursor-pointer"
                      >
                        Top-Right
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetCorner('bl')}
                        className="py-1 px-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium cursor-pointer"
                      >
                        Bottom-Left
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetCorner('br')}
                        className="py-1 px-1 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] text-amber-300 font-bold cursor-pointer"
                      >
                        Bottom-Right (Default)
                      </button>
                    </div>

                    {/* Fine-Tuning Sliders for Logo with full 0-98% range */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-[10px] text-slate-400">
                      <div>
                        <span>X Pos: {Math.round(watermarkConfig.logoOverlay?.x ?? 72)}%</span>
                        <input
                          type="range"
                          min="0"
                          max="95"
                          step="0.5"
                          value={watermarkConfig.logoOverlay?.x ?? 72}
                          onChange={(e) =>
                            setWatermarkConfig((p) => ({
                              ...p,
                              logoOverlay: {
                                ...(p.logoOverlay || {
                                  enabled: true,
                                  imageUrl: DEFAULT_LOGO_URL,
                                  x: 72,
                                  y: 91,
                                  width: 24,
                                  opacity: 0.95,
                                  borderRadius: 8,
                                }),
                                x: parseFloat(e.target.value),
                              },
                            }))
                          }
                          className="w-full h-1 bg-slate-800 rounded accent-amber-400"
                        />
                      </div>

                      <div>
                        <span>Y Pos (0 - 98%): {Math.round(watermarkConfig.logoOverlay?.y ?? 91)}%</span>
                        <input
                          type="range"
                          min="0"
                          max="98"
                          step="0.5"
                          value={watermarkConfig.logoOverlay?.y ?? 91}
                          onChange={(e) =>
                            setWatermarkConfig((p) => ({
                              ...p,
                              logoOverlay: {
                                ...(p.logoOverlay || {
                                  enabled: true,
                                  imageUrl: DEFAULT_LOGO_URL,
                                  x: 72,
                                  y: 91,
                                  width: 24,
                                  opacity: 0.95,
                                  borderRadius: 8,
                                }),
                                y: parseFloat(e.target.value),
                              },
                            }))
                          }
                          className="w-full h-1 bg-slate-800 rounded accent-amber-400"
                        />
                      </div>

                      <div>
                        <span>Size: {Math.round(watermarkConfig.logoOverlay?.width ?? 24)}%</span>
                        <input
                          type="range"
                          min="5"
                          max="60"
                          step="0.5"
                          value={watermarkConfig.logoOverlay?.width ?? 24}
                          onChange={(e) =>
                            setWatermarkConfig((p) => ({
                              ...p,
                              logoOverlay: {
                                ...(p.logoOverlay || {
                                  enabled: true,
                                  imageUrl: DEFAULT_LOGO_URL,
                                  x: 72,
                                  y: 91,
                                  width: 24,
                                  opacity: 0.95,
                                  borderRadius: 8,
                                }),
                                width: parseFloat(e.target.value),
                              },
                            }))
                          }
                          className="w-full h-1 bg-slate-800 rounded accent-amber-400"
                        />
                      </div>

                      <div>
                        <span>Opacity: {Math.round((watermarkConfig.logoOverlay?.opacity ?? 0.95) * 100)}%</span>
                        <input
                          type="range"
                          min="0.2"
                          max="1.0"
                          step="0.05"
                          value={watermarkConfig.logoOverlay?.opacity ?? 0.95}
                          onChange={(e) =>
                            setWatermarkConfig((p) => ({
                              ...p,
                              logoOverlay: {
                                ...(p.logoOverlay || {
                                  enabled: true,
                                  imageUrl: DEFAULT_LOGO_URL,
                                  x: 72,
                                  y: 91,
                                  width: 24,
                                  opacity: 0.95,
                                  borderRadius: 8,
                                }),
                                opacity: parseFloat(e.target.value),
                              },
                            }))
                          }
                          className="w-full h-1 bg-slate-800 rounded accent-amber-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode: Inpaint / Blur Position Sliders with full range */}
              {watermarkConfig.mode !== 'crop' && watermarkConfig.mode !== 'logo' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Quick Corner Snaps:</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPresetCorner('tl')}
                      className="py-1 px-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium cursor-pointer"
                    >
                      Top-Left
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetCorner('tr')}
                      className="py-1 px-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium cursor-pointer"
                    >
                      Top-Right
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetCorner('bl')}
                      className="py-1 px-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium cursor-pointer"
                    >
                      Bottom-Left
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetCorner('br')}
                      className="py-1 px-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium cursor-pointer"
                    >
                      Bottom-Right
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10px] text-slate-400">
                    <div>
                      <span>X Pos: {Math.round(watermarkConfig.x)}%</span>
                      <input
                        type="range"
                        min="0"
                        max="95"
                        step="0.5"
                        value={watermarkConfig.x}
                        onChange={(e) =>
                          setWatermarkConfig((p) => ({ ...p, x: parseFloat(e.target.value) }))
                        }
                        className="w-full h-1 bg-slate-800 rounded accent-rose-500"
                      />
                    </div>
                    <div>
                      <span>Y Pos: {Math.round(watermarkConfig.y)}%</span>
                      <input
                        type="range"
                        min="0"
                        max="98"
                        step="0.5"
                        value={watermarkConfig.y}
                        onChange={(e) =>
                          setWatermarkConfig((p) => ({ ...p, y: parseFloat(e.target.value) }))
                        }
                        className="w-full h-1 bg-slate-800 rounded accent-rose-500"
                      />
                    </div>
                    <div>
                      <span>Width: {Math.round(watermarkConfig.width)}%</span>
                      <input
                        type="range"
                        min="5"
                        max="60"
                        step="0.5"
                        value={watermarkConfig.width}
                        onChange={(e) =>
                          setWatermarkConfig((p) => ({ ...p, width: parseFloat(e.target.value) }))
                        }
                        className="w-full h-1 bg-slate-800 rounded accent-rose-500"
                      />
                    </div>
                    <div>
                      <span>Height: {Math.round(watermarkConfig.height)}%</span>
                      <input
                        type="range"
                        min="2"
                        max="35"
                        step="0.5"
                        value={watermarkConfig.height}
                        onChange={(e) =>
                          setWatermarkConfig((p) => ({ ...p, height: parseFloat(e.target.value) }))
                        }
                        className="w-full h-1 bg-slate-800 rounded accent-rose-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mode: Safe Margin Crop */}
              {watermarkConfig.mode === 'crop' && (
                <div className="space-y-1.5 pt-1 text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span>Crop Zoom Factor:</span>
                    <span className="font-mono text-indigo-300">
                      {Math.round(((watermarkConfig.cropZoom || 1.06) - 1) * 100)}% Margin Cut
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.02"
                    max="1.15"
                    step="0.01"
                    value={watermarkConfig.cropZoom || 1.06}
                    onChange={(e) =>
                      setWatermarkConfig((p) => ({ ...p, cropZoom: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1 bg-slate-800 rounded accent-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Slightly zooms video by 2–8% to cleanly remove corner logos without blur.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Background Music & Comprehensive Audio Adjuster Suite */}
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Background Music Adjuster
                </span>
              </div>

              {!musicFile ? (
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Attach Generated Music</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMixer(!showMixer)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3 h-3 text-indigo-400" />
                    <span>{showMixer ? 'Hide Controls' : 'Audio Controls'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveMusic}
                    className="text-slate-400 hover:text-rose-400 p-1 rounded transition cursor-pointer"
                    title="Remove audio track"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Attached Track Info & Full Controls Suite */}
            {musicFile && (
              <div className="space-y-3 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileAudio className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-white font-medium truncate max-w-[180px]" title={musicFile.name}>
                      {musicFile.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({formatTime(musicDuration)})
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Synced
                  </span>
                </div>

                {showMixer && (
                  <div className="space-y-3 pt-2">
                    {/* Volume Sliders */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Original Video Sound</span>
                          <span className="font-mono text-white">{Math.round(videoVolume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={videoVolume}
                          onChange={(e) => setVideoVolume(parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-amber-300">
                          <span>Music Volume</span>
                          <span className="font-mono text-white">{Math.round(musicVolume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={musicVolume}
                          onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>
                    </div>

                    {/* Start Offset / Beat Alignment */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-medium flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Music Start Offset (Beat Align):</span>
                        </span>
                        <span className="font-mono font-bold text-amber-300">
                          {formatTime(musicAdjustment.startOffset)} ({musicAdjustment.startOffset.toFixed(1)}s)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, musicDuration - safeDuration)}
                        step="0.1"
                        value={musicAdjustment.startOffset}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setMusicAdjustment((p) => ({ ...p, startOffset: val }));
                          if (audioRef.current) {
                            audioRef.current.currentTime = val + currentTime * (musicAdjustment.speed || 1);
                          }
                        }}
                        className="w-full h-1.5 bg-slate-750 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>00:00 (Track start)</span>
                        <span>Drag to sync with drop/chorus</span>
                        <span>{formatTime(Math.max(0, musicDuration - safeDuration))}</span>
                      </div>
                    </div>

                    {/* Fade In, Fade Out & Tempo */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px]">
                      {/* Fade In */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>Fade In:</span>
                          <span className="font-mono text-white">{musicAdjustment.fadeIn.toFixed(1)}s</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          step="0.25"
                          value={musicAdjustment.fadeIn}
                          onChange={(e) =>
                            setMusicAdjustment((p) => ({ ...p, fadeIn: parseFloat(e.target.value) }))
                          }
                          className="w-full h-1 bg-slate-700 rounded accent-amber-400"
                        />
                      </div>

                      {/* Fade Out */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>Fade Out:</span>
                          <span className="font-mono text-white">{musicAdjustment.fadeOut.toFixed(1)}s</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          step="0.25"
                          value={musicAdjustment.fadeOut}
                          onChange={(e) =>
                            setMusicAdjustment((p) => ({ ...p, fadeOut: parseFloat(e.target.value) }))
                          }
                          className="w-full h-1 bg-slate-700 rounded accent-amber-400"
                        />
                      </div>

                      {/* Tempo / Speed */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span className="flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-indigo-400" />
                            <span>Tempo:</span>
                          </span>
                          <span className="font-mono text-white">{musicAdjustment.speed.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.8"
                          max="1.25"
                          step="0.05"
                          value={musicAdjustment.speed}
                          onChange={(e) => {
                            const spd = parseFloat(e.target.value);
                            setMusicAdjustment((p) => ({ ...p, speed: spd }));
                            if (audioRef.current) {
                              audioRef.current.playbackRate = spd;
                            }
                          }}
                          className="w-full h-1 bg-slate-700 rounded accent-indigo-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Export Clean/Merged Video Button */}
          {(musicFile || watermarkConfig.enabled) && (
            <button
              type="button"
              onClick={handleExport}
              disabled={isRendering}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400 hover:from-emerald-300 hover:to-emerald-200 transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isRendering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{renderProgress.status || 'Rendering Clean Video...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    Download Video{' '}
                    {watermarkConfig.enabled &&
                      (watermarkConfig.mode === 'logo'
                        ? '(With SOLIVAST Logo)'
                        : '(Watermark Cleaned)')}{' '}
                    {musicFile && '+ (Music Mixed & Trimmed)'}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Custom Creative Direction Prompt Box */}
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Custom Creative Direction / Instructions (Optional)</span>
              </label>
              <span className="text-[10px] text-slate-400">Guides AI titles & CTA</span>
            </div>

            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. 'I need the description and title to ask the audience to suggest a name for this character' or 'Focus on cinematic dramatic tension'..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() =>
                  setCustomPrompt(
                    'Ask the audience to suggest a creative name for the character in the video!'
                  )
                }
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 cursor-pointer"
              >
                + Suggest a name
              </button>
              <button
                type="button"
                onClick={() =>
                  setCustomPrompt(
                    'Focus on intense dramatic suspense with high-energy curiosity hooks!'
                  )
                }
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-pink-300 border border-slate-700 cursor-pointer"
              >
                + High Suspense
              </button>
              <button
                type="button"
                onClick={() =>
                  setCustomPrompt(
                    'Add a controversial question to trigger debate in the comment section!'
                  )
                }
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer"
              >
                + Debate Trigger
              </button>
            </div>
          </div>

          {/* Action Button: Analyze Full Video */}
          <div className="pt-2">
            <button
              onClick={() => onAnalyze(customPrompt)}
              disabled={isAnalyzing}
              className="w-full py-3 px-5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Video with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{hasResult ? 'Re-Analyze with Custom Prompt' : 'Analyze Full Video'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Video Technical Quick Specs Box */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 text-xs space-y-2.5">
          <div className="flex items-center gap-2 text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>Clip Properties</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Resolution</span>
              <span className="font-mono text-white font-semibold">
                {metadata.width} x {metadata.height}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Duration</span>
              <span className="font-mono text-white font-semibold">
                {isFinite(safeDuration) ? safeDuration.toFixed(1) : '15.0'}s
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Container</span>
              <span className="font-mono text-white font-semibold uppercase">
                {metadata.name.split('.').pop() || 'VIDEO'}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Watermark / Logo</span>
              <span
                className={`font-semibold ${
                  watermarkConfig.enabled ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {watermarkConfig.enabled
                  ? watermarkConfig.mode === 'logo'
                    ? 'SOLIVAST Logo'
                    : `Active (${watermarkConfig.mode})`
                  : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
