import type {
  VideoClipSegment,
  SubtitleStyleConfig,
  LogoConfig,
  TransitionConfig,
  SubtitleCue,
} from '../types/studio';

export interface RenderOptions {
  videoFile: File;
  clip: VideoClipSegment;
  subtitleStyle: SubtitleStyleConfig;
  logoConfig: LogoConfig;
  transitionConfig: TransitionConfig;
  cues: SubtitleCue[];
  onProgress?: (percent: number, status: string) => void;
}

/**
 * High-Quality Client-Side Video Processor & Compositor.
 * Renders video slices with fade-in/fade-out, animated logo watermark, and Sinhala subtitles.
 */
export async function renderClipClientSide(options: RenderOptions): Promise<Blob> {
  const {
    videoFile,
    clip,
    subtitleStyle,
    logoConfig,
    transitionConfig,
    cues,
    onProgress,
  } = options;

  return new Promise(async (resolve, reject) => {
    try {
      onProgress?.(5, `Preparing clip: ${clip.title}...`);

      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = false; // We will capture audio track via Web Audio API or captureStream
      video.playsInline = true;

      const videoUrl = URL.createObjectURL(videoFile);
      video.src = videoUrl;

      // Load logo image if configured
      let logoImg: HTMLImageElement | null = null;
      if (logoConfig.objectUrl) {
        logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = logoConfig.objectUrl;
        await new Promise((res) => {
          logoImg!.onload = res;
          logoImg!.onerror = res;
        });
      }

      await new Promise<void>((res, rej) => {
        video.onloadedmetadata = () => res();
        video.onerror = () => rej(new Error('Failed to load video for rendering.'));
      });

      const videoWidth = video.videoWidth || 1920;
      const videoHeight = video.videoHeight || 1080;

      const canvas = document.createElement('canvas');
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        throw new Error('Canvas 2D context is not supported in this browser.');
      }

      // Audio setup using AudioContext to capture and process audio with fade-in / fade-out
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioSource = audioCtx.createMediaElementSource(video);
      const audioGain = audioCtx.createGain();
      const audioDestination = audioCtx.createMediaStreamDestination();

      audioSource.connect(audioGain);
      audioGain.connect(audioDestination);
      // Also connect to null destination or do not connect to audioCtx.destination to keep rendering silent to user speakers
      // audioGain.connect(audioCtx.destination);

      // Create stream from Canvas + Audio destination
      const canvasStream = canvas.captureStream(30); // 30 FPS or 60 FPS
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks(),
      ]);

      // Choose supported high quality MIME type
      const mimeTypes = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 8_000_000, // 8 Mbps for high quality
        audioBitsPerSecond: 192_000,  // 192 kbps
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        video.pause();
        URL.revokeObjectURL(videoUrl);
        audioCtx.close();
        const finalBlob = new Blob(chunks, { type: selectedMime });
        onProgress?.(100, `Completed ${clip.title}!`);
        resolve(finalBlob);
      };

      const startTime = clip.startTime;
      const endTime = clip.endTime;
      const totalClipDuration = endTime - startTime;

      video.currentTime = startTime;

      await new Promise<void>((res) => {
        video.onseeked = () => res();
      });

      onProgress?.(15, 'Rendering video frames, transitions, logo, and Sinhala subtitles...');

      recorder.start(100);
      await video.play();

      const renderFrame = () => {
        if (video.paused || video.ended || video.currentTime >= endTime) {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
          return;
        }

        const currentClipTime = video.currentTime - startTime;
        const progress = Math.min(100, Math.floor(15 + (currentClipTime / totalClipDuration) * 80));
        onProgress?.(progress, `Rendering (${Math.floor(currentClipTime)}s / ${Math.floor(totalClipDuration)}s)...`);

        // 1. Draw base video frame
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

        // 2. Apply Fade Transitions (Fade-in & Fade-out)
        const fadeIn = transitionConfig.fadeInDuration;
        const fadeOut = transitionConfig.fadeOutDuration;
        let fadeAlpha = 0;

        if (currentClipTime < fadeIn && fadeIn > 0) {
          fadeAlpha = 1 - currentClipTime / fadeIn;
        } else if (currentClipTime > totalClipDuration - fadeOut && fadeOut > 0) {
          fadeAlpha = (currentClipTime - (totalClipDuration - fadeOut)) / fadeOut;
        }

        // Adjust audio gain smoothly for audio fade
        if (fadeIn > 0 && currentClipTime < fadeIn) {
          audioGain.gain.value = Math.max(0.01, currentClipTime / fadeIn);
        } else if (fadeOut > 0 && currentClipTime > totalClipDuration - fadeOut) {
          audioGain.gain.value = Math.max(0.01, (totalClipDuration - currentClipTime) / fadeOut);
        } else {
          audioGain.gain.value = 1.0;
        }

        // Overlay fade color (e.g. black)
        if (fadeAlpha > 0) {
          ctx.save();
          ctx.fillStyle = transitionConfig.transitionType === 'fade-to-white' ? `rgba(255, 255, 255, ${fadeAlpha})` : `rgba(0, 0, 0, ${fadeAlpha})`;
          ctx.fillRect(0, 0, videoWidth, videoHeight);
          ctx.restore();
        }

        // 3. Render Animated Logo
        if (logoImg) {
          drawAnimatedLogo(ctx, logoImg, logoConfig, videoWidth, videoHeight, currentClipTime);
        }

        // 4. Render Sinhala Subtitles
        const activeCue = cues.find(
          (c) => video.currentTime >= c.startTime && video.currentTime <= c.endTime
        );

        if (activeCue) {
          const textToRender = activeCue.translatedText || activeCue.sourceText;
          drawSubtitles(ctx, textToRender, subtitleStyle, videoWidth, videoHeight);
        }

        requestAnimationFrame(renderFrame);
      };

      requestAnimationFrame(renderFrame);
    } catch (err) {
      console.error('Render error:', err);
      reject(err);
    }
  });
}

function drawAnimatedLogo(
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement,
  config: LogoConfig,
  canvasWidth: number,
  canvasHeight: number,
  timeSec: number
) {
  ctx.save();

  const baseWidth = canvasWidth * config.scale;
  const aspectRatio = (logoImg.height || 1) / (logoImg.width || 1);
  const baseHeight = baseWidth * aspectRatio;
  const margin = (config.margin / 1000) * canvasWidth;

  let x = margin;
  let y = margin;

  if (config.position === 'top-right') {
    x = canvasWidth - baseWidth - margin;
    y = margin;
  } else if (config.position === 'bottom-left') {
    x = margin;
    y = canvasHeight - baseHeight - margin;
  } else if (config.position === 'bottom-right') {
    x = canvasWidth - baseWidth - margin;
    y = canvasHeight - baseHeight - margin;
  } else if (config.position === 'center') {
    x = (canvasWidth - baseWidth) / 2;
    y = (canvasHeight - baseHeight) / 2;
  }

  let scaleModifier = 1.0;
  let alphaModifier = config.opacity;

  // Animation behaviors
  if (config.animation === 'fade-in') {
    alphaModifier = Math.min(config.opacity, (timeSec / 1.5) * config.opacity);
  } else if (config.animation === 'pulse') {
    scaleModifier = 1.0 + Math.sin(timeSec * Math.PI * (config.animationSpeed || 1)) * 0.08;
  } else if (config.animation === 'gentle-bounce') {
    y += Math.sin(timeSec * 3) * (canvasHeight * 0.008);
  } else if (config.animation === 'shimmer') {
    alphaModifier = config.opacity * (0.8 + Math.sin(timeSec * 4) * 0.2);
  }

  ctx.globalAlpha = Math.max(0, Math.min(1, alphaModifier));

  const centerX = x + baseWidth / 2;
  const centerY = y + baseHeight / 2;
  ctx.translate(centerX, centerY);
  ctx.scale(scaleModifier, scaleModifier);
  ctx.drawImage(logoImg, -baseWidth / 2, -baseHeight / 2, baseWidth, baseHeight);

  ctx.restore();
}

function drawSubtitles(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: SubtitleStyleConfig,
  canvasWidth: number,
  canvasHeight: number
) {
  if (!text || !text.trim()) return;

  ctx.save();

  // Responsive font size based on video height
  const baseFontSize = (style.fontSize / 1080) * canvasHeight;
  const fontWeight = style.bold ? 'bold' : '600';
  ctx.font = `${fontWeight} ${baseFontSize}px '${style.fontFamily}', 'Noto Sans Sinhala', 'Gemunu Libre', 'Inter', sans-serif`;
  ctx.textAlign = style.alignment;
  ctx.textBaseline = 'middle';

  // Subtitle position
  const yPos = canvasHeight - (canvasHeight * (style.positionY / 100));
  let xPos = canvasWidth / 2;
  if (style.alignment === 'left') xPos = canvasWidth * 0.1;
  if (style.alignment === 'right') xPos = canvasWidth * 0.9;

  // Word wrap lines for Sinhala
  const maxLineWidth = canvasWidth * ((style.maxWidthPercent || 82) / 100);
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

  const lineHeight = baseFontSize * 1.35;
  const totalTextHeight = lines.length * lineHeight;
  const startY = yPos - (totalTextHeight / 2);

  // Background Box / Subtitle Mask (to obscure original burned-in subtitles cleanly)
  if (style.maskOriginalSubtitles || style.backgroundOpacity > 0) {
    let maxMeasuredWidth = 0;
    lines.forEach((l) => {
      const m = ctx.measureText(l);
      if (m.width > maxMeasuredWidth) maxMeasuredWidth = m.width;
    });

    const pad = (style.backgroundPadding / 1080) * canvasHeight;
    const boxWidth = Math.min(canvasWidth * 0.92, maxMeasuredWidth + pad * 2.5);
    const boxHeight = totalTextHeight + pad * 1.5;
    const boxX = xPos - (style.alignment === 'center' ? boxWidth / 2 : (style.alignment === 'left' ? 0 : boxWidth));
    const boxY = startY - pad;

    ctx.fillStyle = style.backgroundColor;
    ctx.globalAlpha = style.backgroundOpacity;

    // Rounded rectangle backdrop
    const r = style.borderRadius;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, r);
    ctx.fill();
  }

  // Draw each text line with stroke outline & drop shadow
  ctx.globalAlpha = 1.0;
  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight + lineHeight / 2;

    // Outline / Stroke
    if (style.outlineWidth > 0) {
      ctx.strokeStyle = style.outlineColor;
      ctx.lineWidth = (style.outlineWidth / 1080) * canvasHeight;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(line, xPos, lineY);
    }

    // Main Text
    ctx.fillStyle = style.textColor;
    ctx.fillText(line, xPos, lineY);
  });

  ctx.restore();
}
