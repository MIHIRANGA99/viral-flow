import React, { useState, useRef } from 'react';
import { UploadCloud, Film, AlertCircle, FileVideo, CheckCircle2, Clock } from 'lucide-react';
import type { VideoMetadata } from '../types';

interface VideoUploaderProps {
  onVideoSelected: (metadata: VideoMetadata) => void;
  isLoading: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoSelected, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingMeta, setProcessingMeta] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processVideoFile = (file: File) => {
    setError(null);

    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv|avi|m4v)$/i)) {
      setError('Please select a valid video file (MP4, WebM, MOV, MKV).');
      return;
    }

    setProcessingMeta(true);
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.src = objectUrl;

    const buildMetadata = (duration: number) => {
      const width = video.videoWidth || 1080;
      const height = video.videoHeight || 1920;
      const validDuration = isFinite(duration) && duration > 0 ? duration : 15;

      let aspectRatio = '16:9 (Landscape)';
      const ratio = width / height;
      if (ratio <= 0.65) {
        aspectRatio = '9:16 (Vertical Reel/TikTok)';
      } else if (ratio <= 0.9) {
        aspectRatio = '4:5 (Vertical Feed)';
      } else if (ratio >= 0.95 && ratio <= 1.05) {
        aspectRatio = '1:1 (Square)';
      }

      const metadata: VideoMetadata = {
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'video/mp4',
        duration: validDuration,
        width,
        height,
        aspectRatio,
        objectUrl,
      };

      setProcessingMeta(false);
      onVideoSelected(metadata);
    };

    video.onloadedmetadata = () => {
      if (!isFinite(video.duration) || isNaN(video.duration)) {
        // WebM without duration headers: seek to end to read true duration
        video.currentTime = 1e101;
        video.ontimeupdate = () => {
          video.ontimeupdate = null;
          const trueDuration = video.currentTime;
          video.currentTime = 0;
          buildMetadata(trueDuration);
        };
      } else {
        buildMetadata(video.duration);
      }
    };

    video.onerror = () => {
      setProcessingMeta(false);
      const metadata: VideoMetadata = {
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'video/mp4',
        duration: 15,
        width: 1080,
        height: 1920,
        aspectRatio: '9:16 (Vertical Reel/TikTok)',
        objectUrl,
      };
      onVideoSelected(metadata);
    };
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
      processVideoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processVideoFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
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
            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-700/80 bg-slate-900/40 hover:bg-slate-900/70 hover:border-indigo-500/50'
        } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-pink-500/20 border border-indigo-500/30 flex items-center justify-center mb-5 text-indigo-400 group-hover:scale-110 group-hover:text-indigo-300 transition duration-300 shadow-lg shadow-indigo-500/10">
            <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
            Select or Drop Your Video File
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            Drag & drop any video clip here, or click to browse from your local drive. Runs 100% on your machine.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-300">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              MP4, WebM, MOV, MKV
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-medium text-indigo-300">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Optimized for Short Clips (≤ 20s)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Direct Multimodal Video AI
            </span>
          </div>

          <button
            type="button"
            disabled={processingMeta}
            className="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer group-hover:shadow-indigo-500/50"
          >
            <FileVideo className="w-4 h-4" />
            <span>{processingMeta ? 'Inspecting Video...' : 'Browse Local Files'}</span>
          </button>
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
