import React, { useState, useEffect, useRef } from 'react';
import type { SubtitleScanZone } from '../../types/studio';
import { Eye, ChevronLeft, ChevronRight, RefreshCw, Pin } from 'lucide-react';

interface RealFrameZonePreviewProps {
  videoFile?: File;
  scanZone: SubtitleScanZone;
  videoDuration?: number;
  onSetStartTime?: (time: number) => void;
}

export const RealFrameZonePreview: React.FC<RealFrameZonePreviewProps> = ({
  videoFile,
  scanZone,
  videoDuration = 60,
  onSetStartTime,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [sampleTime, setSampleTime] = useState<number>(Math.min(15, Math.max(1, (videoDuration || 60) * 0.05)));
  const [isLoadingFrame, setIsLoadingFrame] = useState(false);
  const [hasLoadedFrame, setHasLoadedFrame] = useState(false);

  // Setup offscreen hidden video element
  useEffect(() => {
    if (!videoFile) return;

    const vid = document.createElement('video');
    vid.crossOrigin = 'anonymous';
    vid.muted = true;
    vid.playsInline = true;
    vid.preload = 'auto';

    const url = URL.createObjectURL(videoFile);
    vid.src = url;
    videoRef.current = vid;

    vid.onloadedmetadata = () => {
      // Seek to sample time once metadata is loaded
      seekAndDrawFrame(sampleTime);
    };

    return () => {
      URL.revokeObjectURL(url);
      videoRef.current = null;
    };
  }, [videoFile]);

  const seekAndDrawFrame = async (time: number) => {
    const vid = videoRef.current;
    if (!vid) return;

    setIsLoadingFrame(true);
    vid.currentTime = Math.max(0, Math.min(vid.duration || videoDuration, time));

    await new Promise<void>((resolve) => {
      vid.onseeked = () => resolve();
    });

    const canvas = canvasRef.current;
    if (canvas && vid.videoWidth > 0 && vid.videoHeight > 0) {
      canvas.width = vid.videoWidth;
      canvas.height = vid.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        setHasLoadedFrame(true);
      }
    }
    setIsLoadingFrame(false);
  };

  const handleTimeChange = (newTime: number) => {
    setSampleTime(newTime);
    seekAndDrawFrame(newTime);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-2.5">
      {/* Live Monitor Canvas Container */}
      <div className="relative w-full aspect-video bg-zinc-950 rounded-2xl border-2 border-amber-500/40 overflow-hidden shadow-2xl group flex items-center justify-center">
        {/* Real Movie Frame Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
        />

        {/* Fallback if frame is loading */}
        {(isLoadingFrame || !hasLoadedFrame) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 text-zinc-400 text-xs font-mono gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
            <span>Capturing Real Movie Frame ({formatSeconds(sampleTime)})...</span>
          </div>
        )}

        {/* The Scanning Crop Zone Overlay (Directly on top of real movie frame!) */}
        <div
          className="absolute left-0 right-0 border-2 border-dashed border-amber-400 bg-amber-500/25 shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all duration-150 flex items-center justify-between px-3 pointer-events-none"
          style={{
            top: `${scanZone.yPercent}%`,
            height: `${scanZone.heightPercent}%`,
          }}
        >
          <span className="text-[10px] font-black font-mono text-black bg-amber-400 px-2 py-0.5 rounded shadow flex items-center gap-1">
            <Eye className="w-3 h-3 stroke-[2.5]" /> OCR SCAN ZONE ({scanZone.heightPercent}%)
          </span>
          <span className="text-[9px] font-mono text-amber-300 font-bold bg-black/80 px-1.5 py-0.5 rounded">
            Y: {scanZone.yPercent}%
          </span>
        </div>

        {/* Corner Indicator */}
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/85 backdrop-blur-md rounded-md border border-amber-500/30 text-[9px] font-mono text-amber-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>REAL FRAME @ {formatSeconds(sampleTime)}</span>
        </div>
      </div>

      {/* Frame Scrubber Controls: Let user find a timestamp where movie subtitles appear! */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs font-mono">
        <button
          type="button"
          onClick={() => handleTimeChange(Math.max(0, sampleTime - 30))}
          className="p-1 text-zinc-400 hover:text-amber-300 rounded hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1 text-[11px]"
          title="Jump 30 seconds back"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> -30s
        </button>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 shrink-0">Sample Scene:</span>
          <input
            type="range"
            min={0}
            max={videoDuration || 300}
            step={1}
            value={sampleTime}
            onChange={(e) => handleTimeChange(Number(e.target.value))}
            className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-amber-400 font-bold shrink-0">{formatSeconds(sampleTime)}</span>
        </div>

        <button
          type="button"
          onClick={() => handleTimeChange(Math.min(videoDuration || 300, sampleTime + 30))}
          className="p-1 text-zinc-400 hover:text-amber-300 rounded hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1 text-[11px]"
          title="Jump 30 seconds forward"
        >
          +30s <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {onSetStartTime && (
          <button
            type="button"
            onClick={() => onSetStartTime(sampleTime)}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-[10px] rounded-lg border border-amber-500/40 transition cursor-pointer flex items-center gap-1 shrink-0"
            title="Set this exact frame as the starting point for OCR scanning"
          >
            <Pin className="w-3 h-3" /> Set Start Frame ({formatSeconds(sampleTime)})
          </button>
        )}
      </div>
      <p className="text-[10px] text-zinc-500 font-mono text-center">
        💡 Use the scrubber above to find dialogue, align the golden box, and click "Set Start Frame" to begin scanning from that point.
      </p>
    </div>
  );
};
