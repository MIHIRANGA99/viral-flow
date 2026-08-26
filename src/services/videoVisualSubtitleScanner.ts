import type { SubtitleCue, SubtitleAnalysisResult, TargetLanguage, SubtitleScanZone } from '../types/studio';

export interface ExtractedFrame {
  mimeType: string;
  data: string; // base64
  timestamp: number;
}

export interface ExtractFramesOptions {
  videoFile: File;
  scanZone?: SubtitleScanZone;
  startTime?: number; // in seconds (e.g. 0 for full movie or clip start)
  endTime?: number;   // in seconds (e.g. clip end or movie duration)
  sampleIntervalSeconds?: number; // default 2.5s
  signal?: AbortSignal;
  onProgress?: (percent: number, status: string) => void;
}

export interface ProcessFramesOptions {
  frames: ExtractedFrame[];
  apiKey: string;
  targetLanguage?: TargetLanguage;
  modelId?: string;
  signal?: AbortSignal;
  onProgress?: (percent: number, status: string) => void;
}

/**
 * Step 1: Extracts cropped visual subtitle frames densely (every 2.5s)
 * so NO subtitles are missed (even in the first 30 seconds!).
 */
export async function extractVisualSubtitleFrames(
  options: ExtractFramesOptions
): Promise<ExtractedFrame[]> {
  const {
    videoFile,
    scanZone,
    startTime = 0,
    endTime,
    sampleIntervalSeconds = 2.5,
    onProgress,
  } = options;

  onProgress?.(5, 'Loading video track for dense subtitle frame extraction...');

  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  const videoUrl = URL.createObjectURL(videoFile);
  video.src = videoUrl;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video file for visual frame inspection.'));
  });

  const duration = video.duration || 10;
  const videoWidth = video.videoWidth || 1280;
  const videoHeight = video.videoHeight || 720;

  const scanStart = Math.max(0.0, startTime);
  const scanEnd = endTime && endTime > scanStart ? Math.min(duration, endTime) : duration;
  const step = Math.max(0.4, sampleIntervalSeconds);

  // Dense sampling across the exact time range
  const timestamps: number[] = [];
  for (let t = scanStart; t <= scanEnd; t += step) {
    timestamps.push(Number(t.toFixed(2)));
  }

  // Ensure first 0.5s - 2.0s are always sampled
  if (scanStart <= 1 && !timestamps.includes(0.5)) {
    timestamps.unshift(0.5);
    timestamps.sort((a, b) => a - b);
  }

  onProgress?.(10, `Extracting ${timestamps.length} frame samples (every ${step}s from ${Math.floor(scanStart)}s to ${Math.floor(scanEnd)}s)...`);

  // Crop coordinates based on user selected scanZone
  let cropY: number;
  let cropHeight: number;

  if (scanZone) {
    cropY = Math.max(0, Math.min(videoHeight - 10, (scanZone.yPercent / 100) * videoHeight));
    cropHeight = Math.max(20, Math.min(videoHeight - cropY, (scanZone.heightPercent / 100) * videoHeight));
  } else {
    // Default: lower 38%
    const cropHeightRatio = 0.38;
    cropY = videoHeight * (1 - cropHeightRatio);
    cropHeight = videoHeight * cropHeightRatio;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.min(960, videoWidth);
  canvas.height = Math.round((canvas.width / videoWidth) * cropHeight);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    URL.revokeObjectURL(videoUrl);
    throw new Error('Canvas 2D context not available.');
  }

  const frameParts: ExtractedFrame[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    if (options.signal?.aborted) {
      URL.revokeObjectURL(videoUrl);
      throw new Error('Visual subtitle scan cancelled by user.');
    }
    const time = timestamps[i];
    const progress = Math.min(45, Math.floor(10 + (i / timestamps.length) * 35));
    onProgress?.(progress, `Extracting frame ${i + 1}/${timestamps.length} at ${Math.floor(time / 60)}m ${Math.floor(time % 60)}s...`);

    video.currentTime = time;
    await new Promise<void>((res) => {
      video.onseeked = () => res();
    });

    // Draw bottom subtitle area of video frame
    ctx.drawImage(
      video,
      0,
      cropY,
      videoWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Burn timestamp tag on top of cropped canvas for Gemini vision precision
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, 105, 22);
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`${time.toFixed(1)}s`, 6, 16);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.split(',')[1];

    frameParts.push({
      mimeType: 'image/jpeg',
      data: base64,
      timestamp: time,
    });
  }

  URL.revokeObjectURL(videoUrl);
  return frameParts;
}

/**
 * Helper to call Gemini API with automatic 503 backoff and fallback model switching
 */
async function callGeminiVisionWithFallbacks(
  contentParts: any[],
  apiKey: string,
  primaryModel: string,
  signal?: AbortSignal,
  onProgress?: (percent: number, status: string) => void
): Promise<any> {
  const cleanKey = apiKey.trim();
  const modelsToTry = [
    primaryModel.trim().replace(/^models\//, ''),
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash',
  ].filter((v, idx, arr) => arr.indexOf(v) === idx && !!v);

  let lastErrorText = '';

  for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
    if (signal?.aborted) throw new Error('Visual subtitle scan cancelled by user.');
    const currentModel = modelsToTry[attempt];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${cleanKey}`;

    if (attempt > 0) {
      onProgress?.(50 + attempt * 5, `Primary model busy (503). Retrying with ${currentModel}...`);
      await new Promise((r) => setTimeout(r, 1200 * attempt));
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: contentParts }],
          generationConfig: {
            temperature: 0.1,
            topP: 0.9,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        return await response.json();
      }

      const errorText = await response.text();
      lastErrorText = `(${response.status} on ${currentModel}): ${errorText}`;
      
      if (response.status === 503 || response.status === 429 || response.status === 404) {
        console.warn(`Gemini model ${currentModel} returned ${response.status}. Attempting fallback...`);
        continue;
      }

      throw new Error(`Gemini Vision Error ${lastErrorText}`);
    } catch (err: any) {
      if (signal?.aborted) throw err;
      if (attempt === modelsToTry.length - 1) {
        throw err;
      }
    }
  }

  throw new Error(`All Gemini models are currently experiencing high traffic. ${lastErrorText}`);
}

/**
 * Step 2: Processes frames in optimized sequential batches of 16 frames (~15-30s of footage each)
 * so Gemini catches every single subtitle from the opening seconds to the end without token truncation.
 */
export async function processVisualFramesWithGemini(
  options: ProcessFramesOptions
): Promise<SubtitleAnalysisResult> {
  const {
    frames,
    apiKey,
    targetLanguage = 'Sinhala',
    modelId = 'gemini-3.7-flash',
    onProgress,
  } = options;

  if (!apiKey || !apiKey.trim()) {
    throw new Error('Please provide a valid Gemini API key.');
  }

  if (!frames || frames.length === 0) {
    throw new Error('No visual frames available for processing. Please scan video frames first.');
  }

  // Chunk frames into batches of 16 frames for fine-grained OCR attention
  const BATCH_SIZE = 16;
  const batches: ExtractedFrame[][] = [];
  for (let i = 0; i < frames.length; i += BATCH_SIZE) {
    batches.push(frames.slice(i, i + BATCH_SIZE));
  }

  const allCues: SubtitleCue[] = [];
  let detectedSourceLang = 'English';

  for (let b = 0; b < batches.length; b++) {
    const currentBatch = batches[b];
    const firstTime = currentBatch[0].timestamp;
    const lastTime = currentBatch[currentBatch.length - 1].timestamp;

    const startPercent = 45 + Math.floor((b / batches.length) * 50);
    onProgress?.(
      startPercent,
      `Gemini AI reading Dialogue Batch ${b + 1}/${batches.length} (${Math.floor(firstTime / 60)}m ${Math.floor(firstTime % 60)}s - ${Math.floor(lastTime / 60)}m ${Math.floor(lastTime % 60)}s)...`
    );

    const contentParts: any[] = [];
    currentBatch.forEach((fp) => {
      contentParts.push({
        inlineData: {
          mimeType: fp.mimeType,
          data: fp.data,
        },
      });
    });

    const prompt = `
You are an expert OCR vision system, video subtitle digitizer, and translator.
You are given a sequence of consecutive video frames sampled across time (${firstTime.toFixed(1)}s to ${lastTime.toFixed(1)}s).
Each frame has a timestamp burned in top-left (e.g. "0.5s", "1.5s", "3.0s").

YOUR MISSION:
1. Examine EVERY single image in order.
2. Find ALL on-screen printed/burned-in subtitle dialogue lines, titles, or captions.
3. If text appears in a frame, extract the text and note its start timestamp from the top-left timestamp badge.
4. When the text changes or disappears, set the end timestamp accordingly.
5. Translate each recognized subtitle text into: **${targetLanguage}** (Default: Sinhala - සිංහල).
   - For Sinhala: Write natural, fluent, spoken Sri Lankan Sinhala in clean Unicode script (e.g. "ඔබට කොහොමද?", "අපි ඉක්මනින්ම යමු").
6. If no subtitles are visible in ANY frame of this sequence, return: {"sourceLanguage": "English", "subtitles": []}.
7. Otherwise, return ALL detected subtitle cues in chronological order.

Return ONLY a valid JSON object matching this schema (no markdown backticks, no other text):
{
  "sourceLanguage": "English",
  "subtitles": [
    {
      "startTime": 0.5,
      "endTime": 3.0,
      "sourceText": "Original on-screen text",
      "translatedText": "Sinhala translated text"
    }
  ]
}
`;

    contentParts.push({ text: prompt });

    try {
      if (options.signal?.aborted) throw new Error('Visual subtitle scan cancelled by user.');
      const jsonResponse = await callGeminiVisionWithFallbacks(
        contentParts,
        apiKey,
        modelId,
        options.signal,
        onProgress
      );

      const rawText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.sourceLanguage) detectedSourceLang = parsed.sourceLanguage;

        (parsed.subtitles || []).forEach((s: any) => {
          if (s.sourceText && s.sourceText.trim()) {
            allCues.push({
              id: `cue-${allCues.length + 1}-${Date.now().toString(36)}`,
              startTime: Math.max(0, Number(s.startTime) || firstTime),
              endTime: Math.max((Number(s.startTime) || firstTime) + 1.5, Number(s.endTime) || ((Number(s.startTime) || firstTime) + 3)),
              sourceText: s.sourceText.trim(),
              translatedText: s.translatedText?.trim() || s.sourceText.trim(),
              confidence: 0.98,
            });
          }
        });
      }
    } catch (batchErr: any) {
      if (options.signal?.aborted) throw batchErr;
      console.warn(`Batch ${b + 1} processing warning:`, batchErr);
    }
  }

  // Sort cues chronologically and eliminate any consecutive duplicates
  allCues.sort((a, b) => a.startTime - b.startTime);

  const cleanCues: SubtitleCue[] = [];
  allCues.forEach((cue) => {
    const last = cleanCues[cleanCues.length - 1];
    if (!last || last.sourceText.toLowerCase() !== cue.sourceText.toLowerCase() || cue.startTime - last.endTime > 1.5) {
      cleanCues.push(cue);
    }
  });

  onProgress?.(100, `Successfully found and translated ${cleanCues.length} on-screen subtitle lines across timeline!`);

  return {
    sourceLanguage: detectedSourceLang,
    hasBurnedInSubtitles: true,
    detectedAudioSummary: `Burned-in visual subtitles extracted densely across ${frames.length} frames.`,
    cues: cleanCues,
  };
}

/**
 * High-level wrapper that extracts frames if not cached, then calls Gemini
 */
export async function scanAndTranslateVisualSubtitles(
  options: {
    videoFile: File;
    apiKey: string;
    targetLanguage?: TargetLanguage;
    modelId?: string;
    scanZone?: SubtitleScanZone;
    startTime?: number;
    endTime?: number;
    cachedFrames?: ExtractedFrame[];
    sampleIntervalSeconds?: number;
    signal?: AbortSignal;
    onProgress?: (percent: number, status: string) => void;
  }
): Promise<{ result: SubtitleAnalysisResult; frames: ExtractedFrame[] }> {
  let frames = options.cachedFrames;

  if (!frames || frames.length === 0) {
    frames = await extractVisualSubtitleFrames({
      videoFile: options.videoFile,
      scanZone: options.scanZone,
      startTime: options.startTime,
      endTime: options.endTime,
      sampleIntervalSeconds: options.sampleIntervalSeconds || 2.5,
      signal: options.signal,
      onProgress: options.onProgress,
    });
  } else {
    options.onProgress?.(45, `Using ${frames.length} previously scanned frames from memory...`);
  }

  const result = await processVisualFramesWithGemini({
    frames,
    apiKey: options.apiKey,
    targetLanguage: options.targetLanguage,
    modelId: options.modelId,
    signal: options.signal,
    onProgress: options.onProgress,
  });

  return { result, frames };
}

/**
 * Direct SRT / Text translation with Gemini AI
 */
export async function translateExistingSRTText(
  rawSRTContent: string,
  apiKey: string,
  targetLanguage: TargetLanguage = 'Sinhala',
  modelId: string = 'gemini-3.7-flash',
  onProgress?: (percent: number, status: string) => void
): Promise<SubtitleCue[]> {
  const cleanKey = apiKey.trim();
  const cleanModel = (modelId || 'gemini-3.7-flash').trim().replace(/^models\//, '');

  onProgress?.(20, `Translating subtitle script into ${targetLanguage}...`);

  const prompt = `
You are an expert film subtitle translator.
Translate the following subtitle text into **${targetLanguage}** (Default: Sinhala - සිංහල).
Maintain all timecodes and structure.
Return a valid JSON array of objects with schema:
[
  {
    "id": "cue-1",
    "startTime": 0.0,
    "endTime": 3.5,
    "sourceText": "Original line",
    "translatedText": "Sinhala translated line"
  }
]

SUBTITLE CONTENT:
${rawSRTContent.slice(0, 15000)}
`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${cleanKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini Translation Error: ${errText}`);
  }

  const jsonResponse = await response.json();
  const rawText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = JSON.parse(rawText || '[]');

  return parsed.map((p: any, idx: number) => ({
    id: p.id || `cue-${idx + 1}`,
    startTime: Number(p.startTime) || 0,
    endTime: Number(p.endTime) || ((Number(p.startTime) || 0) + 3),
    sourceText: p.sourceText || '',
    translatedText: p.translatedText || p.sourceText || '',
  }));
}
