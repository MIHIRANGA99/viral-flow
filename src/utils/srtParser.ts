import type { SubtitleCue } from '../types/studio';

export function formatTimeSRT(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

export function formatTimeVTT(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim().replace(',', '.');
  const parts = clean.split(':');
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(clean) || 0;
}

export function generateSRTContent(cues: SubtitleCue[], offsetTime: number = 0): string {
  return cues
    .map((cue, index) => {
      const start = Math.max(0, cue.startTime - offsetTime);
      const end = Math.max(start + 0.1, cue.endTime - offsetTime);
      const text = cue.translatedText || cue.sourceText;
      return `${index + 1}\n${formatTimeSRT(start)} --> ${formatTimeSRT(end)}\n${text}\n`;
    })
    .join('\n');
}

export function generateVTTContent(cues: SubtitleCue[], offsetTime: number = 0): string {
  const body = cues
    .map((cue, index) => {
      const start = Math.max(0, cue.startTime - offsetTime);
      const end = Math.max(start + 0.1, cue.endTime - offsetTime);
      const text = cue.translatedText || cue.sourceText;
      return `${index + 1}\n${formatTimeVTT(start)} --> ${formatTimeVTT(end)}\n${text}\n`;
    })
    .join('\n');
  return `WEBVTT\n\n${body}`;
}

export function parseSRT(srtContent: string): SubtitleCue[] {
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 2) {
      const timeLine = lines.find((l) => l.includes('-->'));
      if (!timeLine) continue;

      const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
      const startTime = parseTimeToSeconds(startStr);
      const endTime = parseTimeToSeconds(endStr);

      const timeIndex = lines.indexOf(timeLine);
      const textLines = lines.slice(timeIndex + 1).join('\n');

      if (textLines) {
        cues.push({
          id: 'cue-' + Math.random().toString(36).substring(2, 9),
          startTime,
          endTime,
          sourceText: textLines,
          translatedText: textLines,
        });
      }
    }
  }

  return cues;
}
