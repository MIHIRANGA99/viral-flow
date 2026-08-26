import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Film,
  Clock,
  Rewind,
  FastForward,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Smartphone,
  Monitor,
} from 'lucide-react';
import type {
  VideoClipSegment,
  SubtitleStyleConfig,
  LogoConfig,
  TransitionConfig,
  SubtitleCue,
} from '../../types/studio';
import { formatDuration } from '../../services/videoChunker';

interface ClipPreviewCarouselProps {
  videoFile: File;
  clips: VideoClipSegment[];
  selectedClip: VideoClipSegment | null;
  onSelectClip: (clip: VideoClipSegment) => void;
  subtitleStyle: SubtitleStyleConfig;
  logoConfig: LogoConfig;
  transitionConfig: TransitionConfig;
  allCues: SubtitleCue[];
  currentSeekTime?: number;
}

export const ClipPreviewCarousel: React.FC<ClipPreviewCarouselProps> = ({
  videoFile,
  clips,
  selectedClip,
  onSelectClip,
  subtitleStyle,
  logoConfig,
  transitionConfig,
  allCues,
  currentSeekTime,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<'auto' | 'phone' | 'landscape'>('auto');
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 1080, height: 1920 });

  // Setup video object URL
  useEffect(() => {
    if (!videoRef.current || !videoFile) return;
    const url = URL.createObjectURL(videoFile);
    videoRef.current.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);

  // Load logo image object for live preview
  useEffect(() => {
    if (logoConfig.objectUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoConfig.objectUrl;
      img.onload = () => {
        logoImageRef.current = img;
      };
    } else {
      logoImageRef.current = null;
    }
  }, [logoConfig.objectUrl]);

  // Jump to selected clip start time
  useEffect(() => {
    if (selectedClip && videoRef.current) {
      videoRef.current.currentTime = selectedClip.startTime;
      setCurrentTime(selectedClip.startTime);
    }
  }, [selectedClip]);

  // External seek
  useEffect(() => {
    if (currentSeekTime !== undefined && videoRef.current) {
      videoRef.current.currentTime = currentSeekTime;
      setCurrentTime(currentSeekTime);
    }
  }, [currentSeekTime]);

  // Update playback rate
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Step / Jump time function
  const stepTime = (deltaSeconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration || 3600, videoRef.current.currentTime + deltaSeconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Keyboard Shortcuts Listener for Precision Scrubbing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepTime(e.shiftKey ? -10 : -1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepTime(e.shiftKey ? 10 : 1);
      } else if (e.key === ',' || e.key === '<') {
        e.preventDefault();
        stepTime(-0.1);
      } else if (e.key === '.' || e.key === '>') {
        e.preventDefault();
        stepTime(0.1);
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        stepTime(-10);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        stepTime(10);
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration]);

  // Canvas render loop for live animated logo, subtitle overlay, and transitions
  useEffect(() => {
    let animId: number;

    const render = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;

          // 1. Draw video frame
          ctx.drawImage(video, 0, 0, w, h);

          const clipStart = selectedClip ? selectedClip.startTime : 0;
          const clipEnd = selectedClip ? selectedClip.endTime : video.duration || 1;
          const clipDuration = clipEnd - clipStart;
          const timeInClip = Math.max(0, video.currentTime - clipStart);

          // 2. Fade Transition preview
          let fadeAlpha = 0;
          const fadeIn = transitionConfig.fadeInDuration;
          const fadeOut = transitionConfig.fadeOutDuration;

          if (timeInClip < fadeIn && fadeIn > 0) {
            fadeAlpha = 1 - timeInClip / fadeIn;
          } else if (timeInClip > clipDuration - fadeOut && fadeOut > 0) {
            fadeAlpha = (timeInClip - (clipDuration - fadeOut)) / fadeOut;
          }

          if (fadeAlpha > 0) {
            ctx.fillStyle = transitionConfig.transitionType === 'fade-to-white'
              ? `rgba(255, 255, 255, ${fadeAlpha})`
              : `rgba(0, 0, 0, ${fadeAlpha})`;
            ctx.fillRect(0, 0, w, h);
          }

          // 3. Draw Subtitles
          drawPreviewSubtitles(ctx, allCues, video.currentTime, subtitleStyle, w, h);

          // 4. Draw Animated Logo
          if (logoImageRef.current && logoConfig.file) {
            drawPreviewLogo(ctx, logoImageRef.current, logoConfig, w, h, timeInClip);
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedClip, subtitleStyle, logoConfig, transitionConfig, allCues]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      const w = videoRef.current.videoWidth || 1080;
      const h = videoRef.current.videoHeight || 1920;
      setVideoDimensions({ width: w, height: h });
      if (canvasRef.current) {
        canvasRef.current.width = w;
        canvasRef.current.height = h;
      }
    }
  };

  const formatDetailedTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const isPortrait = viewMode === 'phone' ? true : viewMode === 'landscape' ? false : (videoDimensions.height > videoDimensions.width);

  return (
    <div className="cinema-panel rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
      {/* Hidden Native Video Element */}
      <video
        ref={videoRef}
        muted={isMuted}
        playsInline
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
          }
        }}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Screen Header Bar with Aspect Ratio Switcher */}
      <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          {isPortrait ? <Smartphone className="w-4 h-4 text-amber-400" /> : <Film className="w-4 h-4 text-amber-400" />}
          <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider">
            {isPortrait ? 'Mobile Reel Screen' : 'Master Screen'}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center bg-zinc-950 p-0.5 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode('phone')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                viewMode === 'phone' || (viewMode === 'auto' && isPortrait)
                  ? 'bg-amber-500 text-black font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Mobile 9:16 Portrait Ratio"
            >
              <Smartphone className="w-3 h-3" /> 9:16
            </button>
            <button
              type="button"
              onClick={() => setViewMode('landscape')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                viewMode === 'landscape'
                  ? 'bg-amber-500 text-black font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Landscape 16:9 Ratio"
            >
              <Monitor className="w-3.5 h-3.5" /> 16:9
            </button>
          </div>

          <span className="text-amber-300 font-bold bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800 text-[11px]">
            {formatDetailedTime(currentTime)}
          </span>
        </div>
      </div>

      {/* Main Canvas Player Screen */}
      <div className="flex justify-center w-full py-1">
        <div
          className={`relative overflow-hidden bg-black flex items-center justify-center group ${
            isPortrait
              ? 'rounded-[32px] border-[5px] border-zinc-800 shadow-2xl w-full max-w-[320px] sm:max-w-[340px] aspect-[9/16] max-h-[520px] ring-2 ring-amber-500/20'
              : 'rounded-3xl border border-amber-500/20 shadow-2xl w-full aspect-video ring-1 ring-amber-500/10'
          }`}
        >
          {/* Dynamic Island / Notch on mobile view */}
          {isPortrait && (
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-zinc-900 rounded-full z-20 pointer-events-none border border-zinc-800/80 shadow-md"></div>
          )}

          <canvas
            ref={canvasRef}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
          />

          {/* Play Overlay Button */}
          {!isPlaying && (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute p-5 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-2xl shadow-amber-500/40 hover:scale-110 transition-all cursor-pointer z-10"
            >
              <Play className="w-8 h-8 fill-current ml-0.5" />
            </button>
          )}

          {/* Video Control Bar HUD (Overlay on hover) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            {/* Progress Slider */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-zinc-800/90 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />

            <div className="flex items-center justify-between text-[11px] text-white font-mono flex-wrap gap-1.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-amber-500 hover:text-black transition border border-zinc-700 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 transition border border-zinc-700 cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-zinc-300" />}
                </button>

                <span className="font-mono text-[10px] text-amber-400 font-bold bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </span>
              </div>

              {selectedClip && (
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/30">
                  {selectedClip.title}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Frame-Accurate Scrubbing & Video Transport Controls */}
      <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-amber-500/25 space-y-2.5 shadow-xl text-xs font-mono">
        {/* Jump & Step Controls */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {/* -10s Jump */}
          <button
            type="button"
            onClick={() => stepTime(-10)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/40 text-[11px] font-bold transition cursor-pointer"
            title="Jump 10s backward (Shift+← / J)"
          >
            <Rewind className="w-3 h-3" /> -10s
          </button>

          {/* -1s Step */}
          <button
            type="button"
            onClick={() => stepTime(-1)}
            className="flex items-center gap-0.5 px-2 py-1.5 rounded-xl bg-zinc-900 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/40 text-[11px] font-bold transition cursor-pointer"
            title="Step 1s backward (←)"
          >
            <ChevronLeft className="w-3 h-3" /> -1s
          </button>

          {/* -0.1s Frame Step */}
          <button
            type="button"
            onClick={() => stepTime(-0.1)}
            className="px-1.5 py-1.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-[10px] font-bold transition cursor-pointer"
            title="Step 1 frame backward (,)"
          >
            -0.1s
          </button>

          {/* Center Play / Pause */}
          <button
            type="button"
            onClick={togglePlay}
            className="p-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/25 transition cursor-pointer"
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 stroke-[3]" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          {/* +0.1s Frame Step */}
          <button
            type="button"
            onClick={() => stepTime(0.1)}
            className="px-1.5 py-1.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-[10px] font-bold transition cursor-pointer"
            title="Step 1 frame forward (.)"
          >
            +0.1s
          </button>

          {/* +1s Step */}
          <button
            type="button"
            onClick={() => stepTime(1)}
            className="flex items-center gap-0.5 px-2 py-1.5 rounded-xl bg-zinc-900 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/40 text-[11px] font-bold transition cursor-pointer"
            title="Step 1s forward (→)"
          >
            +1s <ChevronRight className="w-3 h-3" />
          </button>

          {/* +10s Jump */}
          <button
            type="button"
            onClick={() => stepTime(10)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/40 text-[11px] font-bold transition cursor-pointer"
            title="Jump 10s forward (Shift+→ / L)"
          >
            +10s <FastForward className="w-3 h-3" />
          </button>
        </div>

        {/* Speed Switcher */}
        <div className="flex items-center justify-between gap-2 border-t border-zinc-800/60 pt-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Gauge className="w-3 h-3 text-amber-400" />
            <span className="text-zinc-400 text-[10px]">Speed:</span>
            {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => handleSpeedChange(speed)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  playbackSpeed === speed
                    ? 'bg-amber-500 text-black font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <span className="text-[10px] text-zinc-500">
            ⌨️ Space, ←/→
          </span>
        </div>
      </div>

      {/* Sliced Clips Timeline Mini Selector */}
      <div className="space-y-2 pt-1 border-t border-zinc-800/80">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Clock className="w-3 h-3 text-amber-400" /> Parts ({clips.length})
          </span>
          <span className="text-[10px] font-mono text-zinc-500">Click to preview</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {clips.map((clip) => {
            const isSelected = selectedClip?.id === clip.id;
            return (
              <button
                key={clip.id}
                type="button"
                onClick={() => onSelectClip(clip)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-950/70 border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400'
                    : 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:border-amber-500/40 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-black text-white gap-2 font-mono">
                  <span>Part {clip.index}</span>
                  <span className="text-amber-400 font-bold">{formatDuration(clip.duration)}</span>
                </div>
                <div className="text-[9px] text-zinc-500 font-mono mt-0.5">
                  {clip.cues.length} subs
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function drawPreviewLogo(
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement,
  config: LogoConfig,
  w: number,
  h: number,
  timeSec: number
) {
  ctx.save();
  const baseWidth = w * config.scale;
  const aspectRatio = (logoImg.height || 1) / (logoImg.width || 1);
  const baseHeight = baseWidth * aspectRatio;
  const margin = (config.margin / 1000) * w;

  let x = margin;
  let y = margin;

  if (config.position === 'top-right') {
    x = w - baseWidth - margin;
    y = margin;
  } else if (config.position === 'bottom-left') {
    x = margin;
    y = h - baseHeight - margin;
  } else if (config.position === 'bottom-right') {
    x = w - baseWidth - margin;
    y = h - baseHeight - margin;
  } else if (config.position === 'center') {
    x = (w - baseWidth) / 2;
    y = (h - baseHeight) / 2;
  }

  let scale = 1.0;
  let alpha = config.opacity;

  if (config.animation === 'fade-in') {
    alpha = Math.min(config.opacity, (timeSec / 1.5) * config.opacity);
  } else if (config.animation === 'pulse') {
    scale = 1.0 + Math.sin(timeSec * 3 * config.animationSpeed) * 0.06;
  } else if (config.animation === 'gentle-bounce') {
    const bounceOffset = Math.abs(Math.sin(timeSec * 4 * config.animationSpeed)) * (h * 0.02);
    y -= bounceOffset;
  }

  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.translate(x + baseWidth / 2, y + baseHeight / 2);
  ctx.scale(scale, scale);
  ctx.drawImage(logoImg, -baseWidth / 2, -baseHeight / 2, baseWidth, baseHeight);
  ctx.restore();
}

function drawPreviewSubtitles(
  ctx: CanvasRenderingContext2D,
  cues: SubtitleCue[],
  currentTime: number,
  style: SubtitleStyleConfig,
  w: number,
  h: number
) {
  const activeCue = cues.find((c) => currentTime >= c.startTime && currentTime <= c.endTime);
  if (!activeCue) return;

  const text = activeCue.translatedText || activeCue.sourceText;
  if (!text || !text.trim()) return;

  ctx.save();
  const fontSize = (style.fontSize / 1080) * h;
  const fontWeight = style.bold ? 'bold' : 'normal';

  ctx.font = `${fontWeight} ${fontSize}px "${style.fontFamily}", sans-serif`;
  ctx.textAlign = style.alignment;
  ctx.textBaseline = 'middle';

  // Calculate maximum line width allowed based on maxWidthPercent
  const maxLineWidth = w * ((style.maxWidthPercent || 82) / 100);

  // Word wrap lines (supports Sinhala spaces and English)
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxLineWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  const lineHeight = fontSize * 1.35;
  const totalTextHeight = lines.length * lineHeight;
  const padding = (style.backgroundPadding / 1080) * h;
  const radius = (style.borderRadius / 1080) * h;

  let x = w / 2;
  if (style.alignment === 'left') x = 0.08 * w;
  if (style.alignment === 'right') x = 0.92 * w;

  const yCenter = h - ((style.positionY / 100) * h);
  const startY = yCenter - (totalTextHeight / 2);

  // Background Box / Mask (Calculated across all wrapped lines)
  if (style.maskOriginalSubtitles && style.backgroundOpacity > 0) {
    let maxMeasuredWidth = 0;
    lines.forEach((l) => {
      const m = ctx.measureText(l);
      if (m.width > maxMeasuredWidth) maxMeasuredWidth = m.width;
    });

    const boxWidth = Math.min(w * 0.96, maxMeasuredWidth + padding * 2.8);
    const boxHeight = totalTextHeight + padding * 1.5;
    let boxX = x - boxWidth / 2;
    if (style.alignment === 'left') boxX = x - padding;
    if (style.alignment === 'right') boxX = x - boxWidth + padding;
    const boxY = startY - padding * 0.75;

    ctx.save();
    ctx.globalAlpha = style.backgroundOpacity;
    ctx.fillStyle = style.backgroundColor;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
      ctx.fill();
    } else {
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    }
    ctx.restore();
  }

  // Draw each text line
  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight + lineHeight / 2;

    // Text Outline
    if (style.outlineWidth > 0) {
      ctx.strokeStyle = style.outlineColor;
      ctx.lineWidth = (style.outlineWidth / 1080) * h;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(line, x, lineY);
    }

    // Text Fill
    ctx.fillStyle = style.textColor;
    ctx.fillText(line, x, lineY);
  });

  ctx.restore();
}
