import type { VideoClipSegment, SubtitleCue } from '../types/studio';

export function calculateVideoSegments(
  videoDuration: number,
  chunkDurationThreshold: number, // in seconds
  allCues: SubtitleCue[] = []
): VideoClipSegment[] {
  if (videoDuration <= 0 || chunkDurationThreshold <= 0) {
    return [];
  }

  const segments: VideoClipSegment[] = [];
  let currentTime = 0;
  let index = 1;

  while (currentTime < videoDuration) {
    const startTime = currentTime;
    const endTime = Math.min(currentTime + chunkDurationThreshold, videoDuration);
    const duration = endTime - startTime;

    // Filter subtitle cues that fall within this segment
    const segmentCues = allCues.filter(
      (cue) => cue.startTime < endTime && cue.endTime > startTime
    );

    segments.push({
      id: `clip-${index}-${Date.now().toString(36)}`,
      index,
      title: `Part ${index} (${formatDuration(startTime)} - ${formatDuration(endTime)})`,
      startTime,
      endTime,
      duration,
      cues: segmentCues,
    });

    currentTime += chunkDurationThreshold;
    index++;
  }

  return segments;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Capture a thumbnail frame at a specific timestamp using an offscreen video & canvas
 */
export async function captureVideoThumbnail(
  videoFile: File | string,
  timestamp: number
): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';

    const url = typeof videoFile === 'string' ? videoFile : URL.createObjectURL(videoFile);
    video.src = url;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timestamp, video.duration - 0.1);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = Math.min(320, video.videoWidth || 320);
      canvas.height = (canvas.width / (video.videoWidth || 16)) * (video.videoHeight || 9);

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (typeof videoFile !== 'string') {
          URL.revokeObjectURL(url);
        }
        resolve(dataUrl);
      } else {
        resolve('');
      }
    };

    video.onerror = () => {
      if (typeof videoFile !== 'string') URL.revokeObjectURL(url);
      resolve('');
    };
  });
}
