import type { VideoMetadata } from '../types';

export interface ConcatProgressCallback {
  (percent: number, status: string): void;
}

export interface ConcatResult {
  metadata: VideoMetadata;
  blob: Blob;
  downloadUrl: string;
}

export async function concatenateVideos(
  clips: VideoMetadata[],
  onProgress?: ConcatProgressCallback
): Promise<ConcatResult> {
  if (!clips || clips.length === 0) {
    throw new Error('No video clips provided for concatenation.');
  }

  if (clips.length === 1) {
    return {
      metadata: clips[0],
      blob: clips[0].file,
      downloadUrl: clips[0].objectUrl,
    };
  }

  return new Promise(async (resolve, reject) => {
    let currentVideoEl: HTMLVideoElement | null = null;
    let audioCtx: AudioContext | null = null;
    let isConcatActive = true;
    let rvfcHandle: number | null = null;
    let rafHandle: number | null = null;
    let recorder: MediaRecorder | null = null;

    const cleanup = () => {
      isConcatActive = false;
      if (currentVideoEl) {
        if (rvfcHandle !== null && 'cancelVideoFrameCallback' in currentVideoEl) {
          (currentVideoEl as any).cancelVideoFrameCallback(rvfcHandle);
        }
        currentVideoEl.pause();
        if (currentVideoEl.parentNode) {
          currentVideoEl.parentNode.removeChild(currentVideoEl);
        }
      }
      if (rafHandle !== null) {
        cancelAnimationFrame(rafHandle);
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };

    try {
      onProgress?.(5, `Preparing ${clips.length} video clips for concatenation...`);

      // Determine master resolution based on the first clip or highest resolution
      const targetWidth = clips[0].width || 1080;
      const targetHeight = clips[0].height || 1920;
      const totalDuration = clips.reduce((acc, c) => acc + (c.duration || 10), 0);

      // Create master offscreen canvas for frame compositing
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { alpha: false, desynchronized: false });
      if (!ctx) {
        throw new Error('Failed to initialize 2D canvas compositor.');
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Setup Web Audio Master Stream Destination
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const audioDest = audioCtx.createMediaStreamDestination();

      // Setup 30 FPS master canvas capture stream
      const videoStream = canvas.captureStream(30);
      const combinedTracks = [
        ...videoStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks(),
      ];
      const combinedStream = new MediaStream(combinedTracks);

      const mimeTypes = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      const selectedMime = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || 'video/webm';

      recorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 15000000, // 15 Mbps Ultra-HD
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        cleanup();

        const finalBlob = new Blob(chunks, { type: selectedMime });
        const ext = selectedMime.includes('mp4') ? 'mp4' : 'webm';
        const combinedName = `Combined_${clips.length}_Clips_${Math.round(totalDuration)}s.${ext}`;
        const downloadUrl = URL.createObjectURL(finalBlob);

        const combinedFile = new File([finalBlob], combinedName, { type: selectedMime });

        let aspectRatio = clips[0].aspectRatio;
        const ratio = targetWidth / targetHeight;
        if (ratio <= 0.65) {
          aspectRatio = '9:16 (Vertical Reel/TikTok)';
        } else if (ratio <= 0.9) {
          aspectRatio = '4:5 (Vertical Feed)';
        } else if (ratio >= 0.95 && ratio <= 1.05) {
          aspectRatio = '1:1 (Square)';
        } else {
          aspectRatio = '16:9 (Landscape)';
        }

        const combinedMetadata: VideoMetadata = {
          file: combinedFile,
          name: combinedName,
          size: finalBlob.size,
          type: selectedMime,
          duration: totalDuration,
          width: targetWidth,
          height: targetHeight,
          aspectRatio,
          objectUrl: downloadUrl,
        };

        onProgress?.(100, 'All clips stitched successfully!');
        resolve({ metadata: combinedMetadata, blob: finalBlob, downloadUrl });
      };

      recorder.start(200);

      // Sequentially process each clip
      let elapsedGlobalSeconds = 0;

      for (let i = 0; i < clips.length; i++) {
        if (!isConcatActive) break;

        const clip = clips[i];
        const clipNum = i + 1;
        const clipDuration = isFinite(clip.duration) && clip.duration > 0 ? clip.duration : 10;

        onProgress?.(
          Math.min(95, Math.floor(10 + (elapsedGlobalSeconds / totalDuration) * 80)),
          `Stitching Clip ${clipNum} of ${clips.length}: "${clip.name}" (${elapsedGlobalSeconds.toFixed(1)}s / ${totalDuration.toFixed(1)}s)...`
        );

        await new Promise<void>(async (resolveClip, rejectClip) => {
          try {
            const videoUrl = clip.objectUrl || URL.createObjectURL(clip.file);
            const videoEl = document.createElement('video');
            videoEl.src = videoUrl;
            videoEl.crossOrigin = 'anonymous';
            videoEl.muted = false;
            videoEl.playsInline = true;
            videoEl.preload = 'auto';
            videoEl.playbackRate = 1.0;

            // Pin to DOM to prevent Chromium decode throttling
            videoEl.style.position = 'fixed';
            videoEl.style.top = '0';
            videoEl.style.left = '0';
            videoEl.style.width = '32px';
            videoEl.style.height = '32px';
            videoEl.style.opacity = '0.001';
            videoEl.style.pointerEvents = 'none';
            videoEl.style.zIndex = '-99999';
            videoEl.style.transform = 'translateZ(0)';
            (videoEl.style as any).willChange = 'transform';
            document.body.appendChild(videoEl);

            currentVideoEl = videoEl;

            await new Promise((r) => {
              videoEl.onloadedmetadata = r;
              videoEl.load();
            });

            if (videoEl.readyState < 4) {
              await new Promise((r) => {
                const onCanPlay = () => {
                  videoEl.removeEventListener('canplaythrough', onCanPlay);
                  r(true);
                };
                videoEl.addEventListener('canplaythrough', onCanPlay);
                setTimeout(() => r(true), 2000);
              });
            }

            // Audio routing for current clip
            let audioSourceNode: MediaElementAudioSourceNode | null = null;
            let clipGainNode: GainNode | null = null;
            if (audioCtx) {
              try {
                audioSourceNode = audioCtx.createMediaElementSource(videoEl);
                clipGainNode = audioCtx.createGain();
                clipGainNode.gain.value = 1.0;
                audioSourceNode.connect(clipGainNode);
                clipGainNode.connect(audioDest);
              } catch (e) {
                console.warn('Audio node connection notice:', e);
              }
            }

            // Frame drawing loop for this clip
            let isCurrentClipRunning = true;

            const renderClipFrame = () => {
              if (!isCurrentClipRunning || !isConcatActive) return;

              // Draw letterboxed / aspect-fitted frame
              const cW = videoEl.videoWidth || targetWidth;
              const cH = videoEl.videoHeight || targetHeight;
              const scale = Math.min(targetWidth / cW, targetHeight / cH);
              const drawW = cW * scale;
              const drawH = cH * scale;
              const drawX = (targetWidth - drawW) / 2;
              const drawY = (targetHeight - drawH) / 2;

              ctx.fillStyle = '#000000';
              ctx.fillRect(0, 0, targetWidth, targetHeight);
              ctx.drawImage(videoEl, drawX, drawY, drawW, drawH);

              if ('requestVideoFrameCallback' in videoEl) {
                rvfcHandle = (videoEl as any).requestVideoFrameCallback(renderClipFrame);
              } else {
                rafHandle = requestAnimationFrame(renderClipFrame);
              }
            };

            const endCurrentClip = () => {
              if (!isCurrentClipRunning) return;
              isCurrentClipRunning = false;
              if (rvfcHandle !== null && 'cancelVideoFrameCallback' in videoEl) {
                (videoEl as any).cancelVideoFrameCallback(rvfcHandle);
              }
              if (rafHandle !== null) {
                cancelAnimationFrame(rafHandle);
              }
              videoEl.pause();
              if (videoEl.parentNode) {
                videoEl.parentNode.removeChild(videoEl);
              }
              if (audioSourceNode && clipGainNode) {
                try {
                  audioSourceNode.disconnect();
                  clipGainNode.disconnect();
                } catch {
                  // ignore
                }
              }
              elapsedGlobalSeconds += clipDuration;
              resolveClip();
            };

            videoEl.onended = endCurrentClip;

            // Kick off frame loop
            if ('requestVideoFrameCallback' in videoEl) {
              rvfcHandle = (videoEl as any).requestVideoFrameCallback(renderClipFrame);
            } else {
              rafHandle = requestAnimationFrame(renderClipFrame);
            }

            await videoEl.play();

            // Safety timeout
            setTimeout(() => {
              if (isCurrentClipRunning) {
                endCurrentClip();
              }
            }, (clipDuration + 1.2) * 1000);
          } catch (clipErr) {
            rejectClip(clipErr);
          }
        });
      }

      // Stop recorder once all clips are completed
      if (recorder && recorder.state === 'recording') {
        recorder.stop();
      }
    } catch (err: any) {
      cleanup();
      reject(err);
    }
  });
}
