import type { WatermarkConfig } from '../types';

// Cache preloaded logo images to avoid repeated instantiations during rendering
const logoImageCache = new Map<string, HTMLImageElement>();

export function getLoadedLogoImage(url: string): HTMLImageElement {
  if (logoImageCache.has(url)) {
    return logoImageCache.get(url)!;
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  logoImageCache.set(url, img);
  return img;
}

export async function preloadLogo(url?: string): Promise<void> {
  if (!url) return;
  const img = getLoadedLogoImage(url);
  if (img.complete && img.naturalWidth > 0) return;
  try {
    if (img.decode) {
      await img.decode();
    } else {
      await new Promise((res) => {
        img.onload = () => res(true);
        img.onerror = () => res(false);
      });
    }
  } catch {
    // Ignore decode errors, fallback to standard drawing
  }
}

// Single reusable scratch canvas for zero-allocation inpainting
let sharedScratchCanvas: HTMLCanvasElement | null = null;
let sharedScratchCtx: CanvasRenderingContext2D | null = null;

function getScratchContext(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (!sharedScratchCanvas) {
    sharedScratchCanvas = document.createElement('canvas');
    sharedScratchCtx = sharedScratchCanvas.getContext('2d', { alpha: true });
  }
  if (sharedScratchCanvas.width !== width || sharedScratchCanvas.height !== height) {
    sharedScratchCanvas.width = width;
    sharedScratchCanvas.height = height;
  }
  return sharedScratchCtx ? { canvas: sharedScratchCanvas, ctx: sharedScratchCtx } : null;
}

export function renderFrameWithWatermarkFilter(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  config: WatermarkConfig,
  targetWidth: number,
  targetHeight: number
) {
  if (!config.enabled) {
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    return;
  }

  // Mode 1: Safe-Zone Margin Crop (100% Lossless & Zero Ghosting)
  if (config.mode === 'crop') {
    const zoom = config.cropZoom || 1.06;
    const scaledW = targetWidth * zoom;
    const scaledH = targetHeight * zoom;

    let offsetX = (targetWidth - scaledW) / 2;
    let offsetY = (targetHeight - scaledH) / 2;

    if (config.x < 30 && config.y < 30) {
      offsetX = (targetWidth - scaledW) * 0.9;
      offsetY = (targetHeight - scaledH) * 0.9;
    } else if (config.x > 60 && config.y < 30) {
      offsetX = (targetWidth - scaledW) * 0.1;
      offsetY = (targetHeight - scaledH) * 0.9;
    } else if (config.x < 30 && config.y > 60) {
      offsetX = (targetWidth - scaledW) * 0.9;
      offsetY = (targetHeight - scaledH) * 0.1;
    } else if (config.x > 60 && config.y > 60) {
      offsetX = (targetWidth - scaledW) * 0.1;
      offsetY = (targetHeight - scaledH) * 0.1;
    }

    ctx.drawImage(video, offsetX, offsetY, scaledW, scaledH);
    return;
  }

  // Draw base video frame
  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

  // Mode 4: Brand Logo Overlay
  if (config.mode === 'logo' && config.logoOverlay?.enabled) {
    const logoCfg = config.logoOverlay;
    if (logoCfg.imageUrl) {
      const logoImg = getLoadedLogoImage(logoCfg.imageUrl);
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = logoCfg.opacity ?? 0.95;

        const logoW = (logoCfg.width / 100) * targetWidth;
        const aspect = logoImg.naturalHeight / logoImg.naturalWidth;
        const logoH = logoW * aspect;
        const logoX = (logoCfg.x / 100) * targetWidth;
        const logoY = (logoCfg.y / 100) * targetHeight;

        if (logoCfg.borderRadius && logoCfg.borderRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(logoX, logoY, logoW, logoH, (logoCfg.borderRadius / 100) * logoW);
          ctx.clip();
        }

        ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
        ctx.restore();
        return;
      }
    }
  }

  const boxX = (config.x / 100) * targetWidth;
  const boxY = (config.y / 100) * targetHeight;
  const boxW = (config.width / 100) * targetWidth;
  const boxH = (config.height / 100) * targetHeight;

  if (boxW <= 0 || boxH <= 0) return;

  // Mode 2: Clean Adjacent Texture Inpainting (Reuses shared scratch canvas for high performance)
  if (config.mode === 'inpaint') {
    ctx.save();

    let sourceX = boxX;
    let sourceY = boxY + boxH * 1.1;

    if (boxY + boxH * 2.2 > targetHeight) {
      sourceY = Math.max(0, boxY - boxH * 1.1);
    }

    const vidScaleX = video.videoWidth / targetWidth;
    const vidScaleY = video.videoHeight / targetHeight;

    const scratch = getScratchContext(Math.ceil(boxW), Math.ceil(boxH));
    if (scratch) {
      scratch.ctx.clearRect(0, 0, boxW, boxH);
      scratch.ctx.drawImage(
        video,
        sourceX * vidScaleX,
        sourceY * vidScaleY,
        boxW * vidScaleX,
        boxH * vidScaleY,
        0,
        0,
        boxW,
        boxH
      );

      ctx.globalAlpha = 0.98;
      ctx.drawImage(scratch.canvas, boxX, boxY, boxW, boxH);
    }

    ctx.restore();
    return;
  }

  // Mode 3: Delogo Heavy Feathered Blur
  if (config.mode === 'blur') {
    ctx.save();
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxW, boxH);
    ctx.clip();

    ctx.filter = `blur(${config.blurStrength || 18}px)`;
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    ctx.restore();
  }
}
