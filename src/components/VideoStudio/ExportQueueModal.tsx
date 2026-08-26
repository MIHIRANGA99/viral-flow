import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  X,
  FileText,
  Archive,
  Loader2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import type {
  VideoClipSegment,
  SubtitleStyleConfig,
  LogoConfig,
  TransitionConfig,
  SubtitleCue,
  TargetLanguage,
} from '../../types/studio';
import { renderClipClientSide } from '../../services/clientVideoRenderer';
import { generateSRTContent } from '../../utils/srtParser';

interface ExportQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoFile: File;
  clips: VideoClipSegment[];
  subtitleStyle: SubtitleStyleConfig;
  logoConfig: LogoConfig;
  transitionConfig: TransitionConfig;
  allCues: SubtitleCue[];
  targetLanguage: TargetLanguage;
}

interface RenderedClipOutput {
  clip: VideoClipSegment;
  videoBlob: Blob;
  videoUrl: string;
  srtContent: string;
}

export const ExportQueueModal: React.FC<ExportQueueModalProps> = ({
  isOpen,
  onClose,
  videoFile,
  clips,
  subtitleStyle,
  logoConfig,
  transitionConfig,
  allCues,
  targetLanguage,
}) => {
  const [isRendering, setIsRendering] = useState(false);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [currentClipStatus, setCurrentClipStatus] = useState('');
  const [currentClipPercent, setCurrentClipPercent] = useState(0);
  const [renderedOutputs, setRenderedOutputs] = useState<RenderedClipOutput[]>([]);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderedOutputs([]);
    const outputs: RenderedClipOutput[] = [];

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      setCurrentClipIndex(i + 1);
      setCurrentClipStatus(`Rendering ${clip.title}...`);
      setCurrentClipPercent(0);

      try {
        const videoBlob = await renderClipClientSide({
          videoFile,
          clip,
          subtitleStyle,
          logoConfig,
          transitionConfig,
          cues: allCues,
          onProgress: (p, status) => {
            setCurrentClipPercent(p);
            setCurrentClipStatus(status);
          },
        });

        const videoUrl = URL.createObjectURL(videoBlob);
        const srtContent = generateSRTContent(clip.cues, clip.startTime);

        outputs.push({
          clip,
          videoBlob,
          videoUrl,
          srtContent,
        });

        setRenderedOutputs([...outputs]);
      } catch (err: any) {
        console.error(`Failed to render clip ${clip.index}:`, err);
      }
    }

    setIsRendering(false);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleDownloadSingleClip = (output: RenderedClipOutput) => {
    const a = document.createElement('a');
    a.href = output.videoUrl;
    a.download = `clip_part_${output.clip.index}_${targetLanguage.toLowerCase()}.mp4`;
    a.click();
  };

  const handleDownloadSingleSRT = (output: RenderedClipOutput) => {
    const blob = new Blob([output.srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clip_part_${output.clip.index}_${targetLanguage.toLowerCase()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    if (renderedOutputs.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder(`ViralStudio_Clips_${targetLanguage}`);

      for (let i = 0; i < renderedOutputs.length; i++) {
        const out = renderedOutputs[i];
        const partName = `Part_${out.clip.index}`;
        folder?.file(`${partName}.mp4`, out.videoBlob);
        folder?.file(`${partName}_${targetLanguage}.srt`, out.srtContent);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ViralStudio_Export_${clips.length}_Clips_${targetLanguage}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP package:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const isComplete = renderedOutputs.length === clips.length && clips.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <div className="cinema-panel rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-amber-500/30">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 sm:p-7 border-b border-amber-500/20 bg-zinc-950/70">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-mono tracking-tight">Master Cinema Render Queue</h2>
              <p className="text-xs text-zinc-400">
                Hardware Client-Side Pipeline • Studio Bitrate • Rec.709 • Fade Dissolves • Sinhala Burn-In
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-zinc-400 hover:text-white rounded-2xl hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Action Trigger Banner */}
          {!isRendering && renderedOutputs.length === 0 && (
            <div className="text-center py-10 space-y-5">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-black text-white mb-2 font-mono">
                  Ready to Render {clips.length} Studio Master Clips
                </h3>
                <p className="text-xs text-zinc-400 mb-7 leading-relaxed">
                  Each part is rendered directly inside your browser with audio/video fade transitions, animated watermark branding, and burned-in {targetLanguage} subtitles.
                </p>
                <button
                  type="button"
                  onClick={handleStartRender}
                  className="px-8 py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-sm rounded-2xl shadow-2xl shadow-amber-500/30 hover:scale-105 transition-all flex items-center justify-center gap-3 mx-auto cursor-pointer uppercase tracking-wider font-mono"
                >
                  <Sparkles className="w-5 h-5 text-black fill-current" />
                  Initiate Client-Side Master Render
                </button>
              </div>
            </div>
          )}

          {/* Active Render Progress */}
          {isRendering && (
            <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-3.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-amber-300 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  Rendering Part {currentClipIndex} of {clips.length}: {currentClipStatus}
                </span>
                <span className="font-black text-amber-300">
                  {currentClipPercent}%
                </span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-300 h-3 rounded-full transition-all duration-200"
                  style={{ width: `${currentClipPercent}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-zinc-400 flex justify-between">
                <span>Completed: {renderedOutputs.length} / {clips.length} parts</span>
                <span className="text-amber-400/80">Rec.709 Studio Quality Encoding</span>
              </div>
            </div>
          )}

          {/* Rendered Clips Table / List */}
          {renderedOutputs.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest font-mono">
                  RENDERED MASTER PARTS ({renderedOutputs.length} / {clips.length})
                </h4>
                {isComplete && (
                  <button
                    type="button"
                    onClick={handleDownloadAllZip}
                    disabled={isZipping}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-xs rounded-2xl shadow-xl shadow-amber-500/25 transition-all disabled:opacity-50 cursor-pointer font-mono"
                  >
                    {isZipping ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Packaging ZIP...
                      </>
                    ) : (
                      <>
                        <Archive className="w-4 h-4" /> Download Complete ZIP Package
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {renderedOutputs.map((out) => (
                  <div
                    key={out.clip.id}
                    className="cinema-card rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-zinc-800"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white font-mono">{out.clip.title}</div>
                        <div className="text-xs text-zinc-400 font-mono">
                          Runtime: {Math.round(out.clip.duration)}s • Subtitles: {out.clip.cues.length} Cues • Fade Transitions Included
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadSingleSRT(out)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 text-xs font-bold rounded-xl border border-zinc-800 transition cursor-pointer font-mono"
                      >
                        <FileText className="w-3.5 h-3.5" /> .SRT
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadSingleClip(out)}
                        className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer font-mono"
                      >
                        <Download className="w-3.5 h-3.5 stroke-[2.5]" /> Download .MP4
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-zinc-950/80 border-t border-amber-500/20 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>100% Client-Side Video Processing • Zero Upload Storage</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl transition cursor-pointer font-bold border border-zinc-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
