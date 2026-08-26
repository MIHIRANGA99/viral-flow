import React, { useState, useRef } from 'react';
import { UploadCloud, Film, AlertCircle, FileVideo, CheckCircle2, Layers } from 'lucide-react';
import type { VideoMetadata } from '../types';

interface VideoUploaderProps {
  onVideoSelected: (metadata: VideoMetadata) => void;
  onMultipleVideosSelected?: (metadatas: VideoMetadata[]) => void;
  isLoading: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onVideoSelected,
  onMultipleVideosSelected,
  isLoading,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingMeta, setProcessingMeta] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const processVideoFiles = async (fileList: FileList | File[]) => {
    setError(null);
    const validFiles: File[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv|avi|m4v)$/i)) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      setError('Please select valid video files (MP4, WebM, MOV, MKV).');
      return;
    }

    setProcessingMeta(true);

    try {
      if (validFiles.length === 1) {
        const meta = await extractSingleMetadata(validFiles[0]);
        setProcessingMeta(false);
        onVideoSelected(meta);
      } else {
        const metadatas = await Promise.all(validFiles.map((f) => extractSingleMetadata(f)));
        setProcessingMeta(false);
        if (onMultipleVideosSelected) {
          onMultipleVideosSelected(metadatas);
        } else {
          onVideoSelected(metadatas[0]);
        }
      }
    } catch (err: any) {
      setProcessingMeta(false);
      setError('Failed to process selected video files: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processVideoFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processVideoFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/*"
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative group rounded-3xl border-2 border-dashed transition-all duration-300 p-8 sm:p-12 text-center cursor-pointer overflow-hidden ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
            : 'border-amber-500/30 bg-[#0C0E14]/90 hover:bg-[#121520] hover:border-amber-400/70 shadow-2xl shadow-black/80'
        } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-rose-500/5 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-indigo-900/30 border border-amber-500/40 flex items-center justify-center mb-5 text-amber-400 group-hover:scale-110 group-hover:text-amber-300 transition duration-300 shadow-xl shadow-amber-500/10">
            <UploadCloud className="w-10 h-10 stroke-[2.2]" />
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
            Import Single Video or Multiple Clips
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
            Select one video or select multiple clips (e.g. 3 x 10s clips) to combine into a unified 30s master reel with AI analysis & music prompts.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-7">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-[11px] font-semibold text-zinc-300 shadow">
              <Film className="w-3.5 h-3.5 text-amber-400" />
              MP4, MOV, WebM, MKV
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-[11px] font-bold text-indigo-300 shadow">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Multi-Clip Stitcher (e.g. 3x10s = 30s)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 shadow">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              100% Client-Side Engine
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              disabled={processingMeta}
              className="px-7 py-3 rounded-2xl font-black text-xs text-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 transition shadow-xl shadow-amber-500/25 flex items-center gap-2.5 cursor-pointer group-hover:scale-105"
            >
              <FileVideo className="w-4 h-4 text-black stroke-[2.5]" />
              <span>{processingMeta ? 'Inspecting Media Tracks...' : 'Select Video(s) from Disk'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
