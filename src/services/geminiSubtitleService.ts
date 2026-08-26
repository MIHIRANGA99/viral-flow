import type { SubtitleCue, SubtitleAnalysisResult, TargetLanguage } from '../types/studio';
import { extractAudioFromVideo } from './audioExtractor';
import type { ExtractedAudioResult } from './audioExtractor';

export interface DetectSubtitlesOptions {
  videoFile: File;
  apiKey: string;
  targetLanguage?: TargetLanguage;
  modelId?: string;
  startTime?: number; // in seconds
  duration?: number;  // in seconds
  cachedAudio?: ExtractedAudioResult;
  signal?: AbortSignal;
  onProgress?: (percent: number, status: string) => void;
}

export async function detectAndTranslateSubtitles(
  options: DetectSubtitlesOptions
): Promise<{ result: SubtitleAnalysisResult; audio: ExtractedAudioResult }> {
  const {
    videoFile,
    apiKey,
    targetLanguage = 'Sinhala',
    modelId = 'gemini-3.6-flash',
    startTime = 0,
    duration,
    cachedAudio,
    signal,
    onProgress,
  } = options;

  if (signal?.aborted) {
    throw new Error('Subtitle generation cancelled by user.');
  }

  if (!apiKey || !apiKey.trim()) {
    throw new Error('Please provide a valid Gemini API key to generate and translate subtitles.');
  }

  const cleanKey = apiKey.trim();
  const primaryModel = (modelId || 'gemini-3.6-flash').trim().replace(/^models\//, '');

  let audioData: ExtractedAudioResult;

  if (cachedAudio && cachedAudio.base64) {
    onProgress?.(50, `Using cached audio (${audioDataDurationFormatted(cachedAudio.duration)}) from memory...`);
    audioData = cachedAudio;
  } else {
    onProgress?.(15, `Extracting audio stream from video (${Math.floor(startTime)}s - ${duration ? Math.floor(startTime + duration) : 'End'}s)...`);
    audioData = await extractAudioFromVideo(videoFile, {
      startTime,
      duration,
      signal,
      onProgress: (p, status) => {
        onProgress?.(Math.min(50, Math.floor(15 + p * 0.35)), status);
      },
    });
  }

  onProgress?.(55, `Gemini Speech AI listening to audio & translating dialogue to ${targetLanguage}...`);

  const prompt = `
You are an expert multilingual subtitle generator, translator, and audio transcription engine.
Analyze the attached audio track.

CRITICAL INSTRUCTIONS:
1. Listen carefully to every spoken voice, character dialogue, monologue, or lyric in the audio.
2. Transcribe the speech line by line with ACCURATE start and end timestamps (in seconds with 2 decimal places, e.g. 1.25, 4.80) measured from the start of this audio clip (0.00s).
3. Translate EVERY transcribed dialogue line into: **${targetLanguage}** (Default: Sinhala - සිංහල).
   - For Sinhala: Write natural, fluent, spoken Sri Lankan Sinhala in clean Unicode script (e.g., "ඔබට කොහොමද?", "අපි දැන් යමු").
   - Ensure accurate timing synchronization so words match the spoken pacing.
4. If no speech is detected in the audio track, return {"sourceLanguage": "Unknown", "hasBurnedInSubtitles": false, "detectedAudioSummary": "No speech detected in this audio segment.", "subtitles": []}.
5. Return ONLY a valid, parseable JSON object matching this schema (no markdown backticks, no wrapping text outside JSON):

{
  "sourceLanguage": "English",
  "hasBurnedInSubtitles": false,
  "detectedAudioSummary": "Clear character dialogue explaining the story.",
  "subtitles": [
    {
      "id": "cue-1",
      "startTime": 0.00,
      "endTime": 3.50,
      "sourceText": "Original spoken dialogue line in source language",
      "translatedText": "Sinhala translated subtitle line in Unicode"
    }
  ]
}
`;

  // Active Google Gemini Models (updated to active production endpoints)
  const modelsToTry = [
    primaryModel,
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash',
  ].filter((v, idx, arr) => arr.indexOf(v) === idx && !!v);

  const errorsList: string[] = [];
  let jsonResponse: any = null;

  for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
    const currentModel = modelsToTry[attempt];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${cleanKey}`;

    // Up to 2 retries on 503 for the model before switching
    for (let retry = 0; retry < 2; retry++) {
      if (attempt > 0 || retry > 0) {
        onProgress?.(
          60 + attempt * 8 + retry * 3,
          retry > 0
            ? `${currentModel} busy (503). Retrying in 2s...`
            : `Attempting next model: ${currentModel}...`
        );
        await new Promise((r) => setTimeout(r, 1500 * (retry + 1)));
      }

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: audioData.mimeType,
                      data: audioData.base64,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              topP: 0.95,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (response.ok) {
          jsonResponse = await response.json();
          break;
        }

        const errorText = await response.text();
        let parsedError = errorText;
        try {
          const errJson = JSON.parse(errorText);
          parsedError = errJson.error?.message || errorText;
        } catch (_) {}

        errorsList.push(`[${currentModel} (${response.status})]: ${parsedError}`);

        if (response.status === 503 && retry === 0) {
          // Retry once on 503
          continue;
        }

        if (response.status === 503 || response.status === 429 || response.status === 404 || response.status === 400) {
          console.warn(`Gemini model ${currentModel} returned ${response.status}. Trying next fallback...`);
          break; // move to next model in modelsToTry
        }

        throw new Error(`Gemini Audio AI Error: ${parsedError}`);
      } catch (err: any) {
        errorsList.push(`[${currentModel}]: ${err.message}`);
        if (retry === 1) break;
      }
    }

    if (jsonResponse) break;
  }

  if (!jsonResponse) {
    throw new Error(`All Gemini models are currently busy (503). Your audio is saved in memory! Click '⚡ Instant Retry' to connect immediately.`);
  }

  onProgress?.(90, 'Parsing subtitles and formatting Sinhala Unicode script...');
  const rawText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini did not return any subtitle text or transcription.');
  }

  let parsed: any;
  try {
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse Gemini response as JSON:', rawText);
    throw new Error('Failed to parse subtitle JSON response from Gemini.');
  }

  const cues: SubtitleCue[] = (parsed.subtitles || []).map((s: any, idx: number) => {
    const rawStart = Number(s.startTime) || 0;
    const rawEnd = Number(s.endTime) || (rawStart + 3);

    // If Gemini already included global timeline offset (rawStart >= startTime && startTime > 0), preserve it;
    // Otherwise add startTime offset mathematically
    const computedStart = (startTime > 0 && rawStart >= startTime) ? rawStart : (startTime + rawStart);
    const computedEnd = (startTime > 0 && rawEnd >= startTime) ? rawEnd : (startTime + rawEnd);

    return {
      id: s.id || `cue-${idx + 1}-${Date.now().toString(36)}`,
      startTime: Number(computedStart.toFixed(2)),
      endTime: Number(computedEnd.toFixed(2)),
      sourceText: (s.sourceText || '').trim(),
      translatedText: (s.translatedText || s.sourceText || '').trim(),
      confidence: s.confidence || 0.98,
    };
  });

  onProgress?.(100, `Successfully transcribed & translated ${cues.length} dialogue lines from audio!`);

  return {
    result: {
      sourceLanguage: parsed.sourceLanguage || 'Spoken Dialogue',
      hasBurnedInSubtitles: !!parsed.hasBurnedInSubtitles,
      detectedAudioSummary: parsed.detectedAudioSummary || `Audio speech track transcribed across ${audioData.duration.toFixed(0)}s.`,
      cues,
    },
    audio: audioData,
  };
}

function audioDataDurationFormatted(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${s}s`;
}
