import type { WatermarkConfig, MusicAdjustmentConfig } from '../types';
import { renderFrameWithWatermarkFilter, preloadLogo } from '../utils/watermark';

export interface MergeOptions {
  videoFile: File;
  audioFile?: File | null;
  videoVolume?: number; // 0 to 1
  musicVolume?: number; // 0 to 1
  musicAdjustment?: MusicAdjustmentConfig;
  watermarkConfig?: WatermarkConfig;
  onProgress?: (percent: number, status: string) => void;
}

export async function mergeVideoAndAudio({
  videoFile,
  audioFile,
  videoVolume = 0.8,
  musicVolume = 1.0,
  musicAdjustment,
  watermarkConfig,
  onProgress,
}: MergeOptions): Promise<{ blob: Blob; downloadUrl: string; filename: string }> {
  return new Promise(async (resolve, reject) => {
    let videoEl: HTMLVideoElement | null = null;
    let audioEl: HTMLAudioElement | null = null;
    let audioCtx: AudioContext | null = null;
    let isRecordingActive = true;
    let rvfcHandle: number | null = null;
    let rafHandle: number | null = null;
    let progressInterval: any = null;

    const cleanup = () => {
      isRecordingActive = false;
      if (progressInterval) clearInterval(progressInterval);
      if (videoEl) {
        if (rvfcHandle !== null && 'cancelVideoFrameCallback' in videoEl) {
          (videoEl as any).cancelVideoFrameCallback(rvfcHandle);
        }
        videoEl.pause();
        if (videoEl.parentNode) {
          videoEl.parentNode.removeChild(videoEl);
        }
      }
      if (rafHandle !== null) {
        cancelAnimationFrame(rafHandle);
      }
      if (audioEl) {
        audioEl.pause();
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };

    try {
      onProgress?.(5, 'Pre-buffering video frames & GPU hardware decoder...');

      // Preload logo if logo overlay mode is enabled
      if (watermarkConfig?.enabled && watermarkConfig.mode === 'logo' && watermarkConfig.logoOverlay?.imageUrl) {
        await preloadLogo(watermarkConfig.logoOverlay.imageUrl);
      }

      const videoUrl = URL.createObjectURL(videoFile);
      const audioUrl = audioFile ? URL.createObjectURL(audioFile) : null;

      videoEl = document.createElement('video');
      videoEl.src = videoUrl;
      videoEl.crossOrigin = 'anonymous';
      videoEl.muted = false;
      videoEl.playsInline = true;
      videoEl.preload = 'auto';
      videoEl.playbackRate = 1.0;

      // Pin video to DOM with GPU acceleration layer to prevent Chromium background throttling
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

      if (audioUrl) {
        audioEl = document.createElement('audio');
        audioEl.src = audioUrl;
        audioEl.crossOrigin = 'anonymous';
        audioEl.preload = 'auto';
        audioEl.loop = musicAdjustment?.loop ?? true;
        if (musicAdjustment?.speed) {
          audioEl.playbackRate = musicAdjustment.speed;
        }
      }

      // Wait for full metadata
      await Promise.all([
        new Promise((res) => {
          if (!videoEl) return res(true);
          videoEl.onloadedmetadata = res;
          videoEl.load();
        }),
        audioEl
          ? new Promise((res) => {
              if (!audioEl) return res(true);
              audioEl.onloadedmetadata = res;
              audioEl.load();
            })
          : Promise.resolve(),
      ]);

      // Pre-buffer video into RAM/VRAM
      if (videoEl.readyState < 4) {
        await new Promise((res) => {
          if (!videoEl) return res(true);
          const handleCanPlay = () => {
            videoEl?.removeEventListener('canplaythrough', handleCanPlay);
            res(true);
          };
          videoEl.addEventListener('canplaythrough', handleCanPlay);
          setTimeout(() => res(true), 2500);
        });
      }

      const duration = isFinite(videoEl.duration) && videoEl.duration > 0 ? videoEl.duration : 15;
      const width = videoEl.videoWidth || 1080;
      const height = videoEl.videoHeight || 1920;

      onProgress?.(15, 'Configuring Audio Master & High-Res Canvas Compositor...');

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      // Video audio routing
      const videoSource = audioCtx.createMediaElementSource(videoEl);
      const videoGain = audioCtx.createGain();
      videoGain.gain.value = videoVolume;
      videoSource.connect(videoGain);

      const dest = audioCtx.createMediaStreamDestination();
      videoGain.connect(dest);

      // Background music routing
      let audioGain: GainNode | null = null;
      if (audioEl) {
        const audioSource = audioCtx.createMediaElementSource(audioEl);
        audioGain = audioCtx.createGain();
        audioGain.gain.value = musicVolume;
        audioSource.connect(audioGain);
        audioGain.connect(dest);
      }

      // High-resolution Canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false, desynchronized: false });
      if (!ctx) {
        throw new Error('Failed to initialize 2D canvas context.');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const renderConfig = watermarkConfig || {
        enabled: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        mode: 'crop',
        cropZoom: 1,
        blurStrength: 0,
      };

      // Frame render routine synchronized with GPU decoder
      const renderCurrentFrame = () => {
        if (!isRecordingActive || !videoEl) return;
        renderFrameWithWatermarkFilter(ctx, videoEl, renderConfig, width, height);

        if ('requestVideoFrameCallback' in videoEl) {
          rvfcHandle = (videoEl as any).requestVideoFrameCallback(renderCurrentFrame);
        } else {
          rafHandle = requestAnimationFrame(renderCurrentFrame);
        }
      };

      // 30 FPS capture stream from high-res canvas
      const videoStream = canvas.captureStream(30);

      const combinedTracks = [
        ...videoStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
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

      // 15 Mbps Ultra-HD bit rate for crystal-clear quality
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 15000000,
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
        const rawName = videoFile.name.replace(/\.[^/.]+$/, '');
        const suffix = watermarkConfig?.enabled ? '_clean' : (audioFile ? '_with_music' : '_exported');
        const filename = `${rawName}${suffix}.${ext}`;
        const downloadUrl = URL.createObjectURL(finalBlob);

        URL.revokeObjectURL(videoUrl);
        if (audioUrl) URL.revokeObjectURL(audioUrl);

        onProgress?.(100, 'Ultra-HD rendering complete!');
        resolve({ blob: finalBlob, downloadUrl, filename });
      };

      onProgress?.(25, 'Priming video playback & warming up decoder...');

      // 1. Seek to exact start timestamp and wait for seeked to complete
      videoEl.currentTime = 0;
      if (audioEl) {
        audioEl.currentTime = musicAdjustment?.startOffset || 0;
      }

      await new Promise((res) => {
        if (!videoEl) return res(true);
        const onSeeked = () => {
          videoEl?.removeEventListener('seeked', onSeeked);
          res(true);
        };
        videoEl.addEventListener('seeked', onSeeked);
        setTimeout(() => res(true), 400);
      });

      // 2. Prime the canvas with the clean initial frame
      renderFrameWithWatermarkFilter(ctx, videoEl, renderConfig, width, height);

      // 3. Start decoder frame loop
      if ('requestVideoFrameCallback' in videoEl) {
        rvfcHandle = (videoEl as any).requestVideoFrameCallback(renderCurrentFrame);
      } else {
        rafHandle = requestAnimationFrame(renderCurrentFrame);
      }

      // 4. Start playback FIRST so the browser hardware decoder is actively streaming
      const playPromises: Promise<void>[] = [videoEl.play()];
      if (audioEl) playPromises.push(audioEl.play());
      await Promise.all(playPromises);

      // 5. Wait for the first active decoded moving frame before engaging MediaRecorder
      const vidAny: any = videoEl;
      await new Promise<void>((resolveReady) => {
        if (vidAny && typeof vidAny.requestVideoFrameCallback === 'function') {
          vidAny.requestVideoFrameCallback(() => resolveReady());
        } else if (vidAny) {
          const onTimeUpdate = () => {
            vidAny.removeEventListener('timeupdate', onTimeUpdate);
            resolveReady();
          };
          vidAny.addEventListener('timeupdate', onTimeUpdate);
          setTimeout(() => resolveReady(), 150);
        } else {
          resolveReady();
        }
      });

      // 6. Schedule audio envelope automation synchronously with recording start
      if (audioCtx && audioGain && audioEl) {
        const now = audioCtx.currentTime;
        const endTime = now + duration;

        if (musicAdjustment?.fadeIn && musicAdjustment.fadeIn > 0) {
          audioGain.gain.setValueAtTime(0, now);
          audioGain.gain.linearRampToValueAtTime(musicVolume, now + musicAdjustment.fadeIn);
        } else {
          audioGain.gain.setValueAtTime(musicVolume, now);
        }

        if (musicAdjustment?.fadeOut && musicAdjustment.fadeOut > 0) {
          audioGain.gain.setValueAtTime(musicVolume, Math.max(now, endTime - musicAdjustment.fadeOut));
          audioGain.gain.linearRampToValueAtTime(0, endTime);
        }
      }

      // 7. Start recording ONLY when video is actively rolling (zero 1st/2nd second stutter)
      recorder.start(200);

      onProgress?.(30, 'Recording smooth 30 FPS stream...');

      progressInterval = setInterval(() => {
        if (videoEl && !videoEl.paused && duration > 0) {
          const current = videoEl.currentTime;
          const pct = Math.min(95, Math.floor(30 + (current / duration) * 65));
          onProgress?.(pct, `Processing Ultra-HD frames (${current.toFixed(1)}s / ${duration.toFixed(1)}s)...`);
        }
      }, 250);

      videoEl.onended = () => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      };

      // Safety timeout in case onended is delayed
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, (duration + 2.0) * 1000);
    } catch (err: any) {
      cleanup();
      reject(err);
    }
  });
}
