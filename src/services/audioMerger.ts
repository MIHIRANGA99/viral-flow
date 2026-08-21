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
    try {
      onProgress?.(5, 'Preparing media decoder & audio pipeline...');

      // Preload logo if logo overlay mode is enabled
      if (watermarkConfig?.enabled && watermarkConfig.mode === 'logo' && watermarkConfig.logoOverlay?.imageUrl) {
        await preloadLogo(watermarkConfig.logoOverlay.imageUrl);
      }

      const videoUrl = URL.createObjectURL(videoFile);
      const audioUrl = audioFile ? URL.createObjectURL(audioFile) : null;

      const videoEl = document.createElement('video');
      videoEl.src = videoUrl;
      videoEl.crossOrigin = 'anonymous';
      videoEl.muted = false;
      videoEl.playsInline = true;
      videoEl.playbackRate = 1.0;

      let audioEl: HTMLAudioElement | null = null;
      if (audioUrl) {
        audioEl = document.createElement('audio');
        audioEl.src = audioUrl;
        audioEl.crossOrigin = 'anonymous';
        audioEl.loop = musicAdjustment?.loop ?? true;
        if (musicAdjustment?.speed) {
          audioEl.playbackRate = musicAdjustment.speed;
        }
      }

      // Wait for metadata
      await Promise.all([
        new Promise((res) => {
          videoEl.onloadedmetadata = res;
          videoEl.load();
        }),
        audioEl
          ? new Promise((res) => {
              if (audioEl) {
                audioEl.onloadedmetadata = res;
                audioEl.load();
              } else {
                res(true);
              }
            })
          : Promise.resolve(),
      ]);

      const duration = isFinite(videoEl.duration) && videoEl.duration > 0 ? videoEl.duration : 15;
      const width = videoEl.videoWidth || 1080;
      const height = videoEl.videoHeight || 1920;

      onProgress?.(15, 'Setting up Audio & Hardware Video Pipeline...');

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
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
      if (audioEl) {
        const audioSource = audioCtx.createMediaElementSource(audioEl);
        const audioGain = audioCtx.createGain();
        audioGain.gain.value = musicVolume;
        audioSource.connect(audioGain);
        audioGain.connect(dest);

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

      // Video Canvas setup
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
      if (!ctx) {
        throw new Error('Failed to initialize 2D canvas context.');
      }

      let isRecordingActive = true;
      let rvfcHandle: number | null = null;
      let rafHandle: number | null = null;

      // Frame render routine synchronized with decoder
      const renderCurrentFrame = () => {
        if (!isRecordingActive) return;
        renderFrameWithWatermarkFilter(ctx, videoEl, watermarkConfig || { enabled: false, x: 0, y: 0, width: 0, height: 0, mode: 'crop', cropZoom: 1, blurStrength: 0 }, width, height);

        if ('requestVideoFrameCallback' in videoEl) {
          rvfcHandle = (videoEl as any).requestVideoFrameCallback(renderCurrentFrame);
        } else {
          rafHandle = requestAnimationFrame(renderCurrentFrame);
        }
      };

      // 60 FPS smooth capture stream from canvas
      const videoStream = canvas.captureStream(60);

      const combinedTracks = [
        ...videoStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ];

      const combinedStream = new MediaStream(combinedTracks);

      const mimeTypes = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      const selectedMime = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || 'video/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 10000000, // 10 Mbps crisp buttery smooth bitrate
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        isRecordingActive = false;
        if (rvfcHandle !== null && 'cancelVideoFrameCallback' in videoEl) {
          (videoEl as any).cancelVideoFrameCallback(rvfcHandle);
        }
        if (rafHandle !== null) {
          cancelAnimationFrame(rafHandle);
        }

        const finalBlob = new Blob(chunks, { type: selectedMime });
        const ext = selectedMime.includes('mp4') ? 'mp4' : 'webm';
        const rawName = videoFile.name.replace(/\.[^/.]+$/, '');
        const suffix = watermarkConfig?.enabled ? '_clean' : (audioFile ? '_with_music' : '_exported');
        const filename = `${rawName}${suffix}.${ext}`;
        const downloadUrl = URL.createObjectURL(finalBlob);

        URL.revokeObjectURL(videoUrl);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        audioCtx.close();

        onProgress?.(100, 'Rendering complete!');
        resolve({ blob: finalBlob, downloadUrl, filename });
      };

      onProgress?.(25, 'Rendering video frames smoothly...');

      // Initial frame render
      renderFrameWithWatermarkFilter(ctx, videoEl, watermarkConfig || { enabled: false, x: 0, y: 0, width: 0, height: 0, mode: 'crop', cropZoom: 1, blurStrength: 0 }, width, height);

      // Start recorder with 250ms chunks to reduce event overhead
      recorder.start(250);

      videoEl.currentTime = 0;
      if (audioEl) {
        audioEl.currentTime = musicAdjustment?.startOffset || 0;
      }

      // Kick off decoder synchronized rendering
      if ('requestVideoFrameCallback' in videoEl) {
        rvfcHandle = (videoEl as any).requestVideoFrameCallback(renderCurrentFrame);
      } else {
        rafHandle = requestAnimationFrame(renderCurrentFrame);
      }

      const playPromises: Promise<void>[] = [videoEl.play()];
      if (audioEl) playPromises.push(audioEl.play());
      await Promise.all(playPromises);

      const progressInterval = setInterval(() => {
        if (!videoEl.paused && duration > 0) {
          const current = videoEl.currentTime;
          const pct = Math.min(95, Math.floor(25 + (current / duration) * 70));
          onProgress?.(pct, `Processing video frames (${current.toFixed(1)}s / ${duration.toFixed(1)}s)...`);
        }
      }, 200);

      videoEl.onended = () => {
        clearInterval(progressInterval);
        if (audioEl) audioEl.pause();
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      };

      setTimeout(() => {
        if (recorder.state === 'recording') {
          clearInterval(progressInterval);
          videoEl.pause();
          if (audioEl) audioEl.pause();
          recorder.stop();
        }
      }, (duration + 1.2) * 1000);
    } catch (err: any) {
      reject(err);
    }
  });
}
