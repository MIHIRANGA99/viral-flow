import type { VideoAnalysisResult } from '../types';

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export const GEMINI_MODELS: ModelOption[] = [
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Default & Ultra Fast Reasoning)', description: 'Next-gen multimodal reasoning with high performance' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Fast Multimodal)', description: 'Fast, high-rate limits and modern multimodal processing' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Universal Fallback)', description: 'High reliability and long context video support' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Multimodal Reasoning)', description: 'High precision scene & copywriting detail' },
];

export type GeminiModelId = string;

export async function fetchLiveGeminiModels(apiKey: string): Promise<ModelOption[]> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
    if (!res.ok) return GEMINI_MODELS;
    const data = await res.json();
    if (data.models && Array.isArray(data.models)) {
      const filtered = data.models
        .filter((m: any) => 
          m.supportedGenerationMethods?.includes('generateContent') && 
          !m.name?.includes('embedding') &&
          !m.name?.includes('aqa')
        )
        .map((m: any) => {
          const cleanId = m.name.replace(/^models\//, '');
          return {
            id: cleanId,
            name: m.displayName || cleanId,
            description: m.description ? m.description.slice(0, 80) + '...' : 'Available in your API key project',
          };
        });
      if (filtered.length > 0) return filtered;
    }
    return GEMINI_MODELS;
  } catch (err) {
    console.warn('Could not fetch live models:', err);
    return GEMINI_MODELS;
  }
}

export function buildPromptTemplate(userCustomPrompt?: string): string {
  let customDirective = '';
  if (userCustomPrompt && userCustomPrompt.trim()) {
    customDirective = `
=========================================
USER'S SPECIAL CREATIVE DIRECTION / PROMPT:
"${userCustomPrompt.trim()}"

CRITICAL REQUIREMENT:
You MUST directly integrate and prioritize the user's creative direction above into the generated content!
- The TikTok titles, hooks, and caption CTA must center on the user's request (e.g. if they ask for name suggestions, ask the audience to name the character/moment).
- The Facebook headline, story description, and engagement question must align with this specific angle.
- The Google Flow music prompt must match the requested style, vibe, or mood.
=========================================
`;
  }

  return `
You are an elite viral social media strategist, video editor, and AI music prompt engineer.
Analyze the attached video file comprehensively (visuals, pacing, audio/speech, mood, first-3-second hook, emotional progression).
${customDirective}
Generate an exceptional, ready-to-publish social media viral kit and background music prompt in strict JSON format.

Return ONLY a valid JSON object matching this structure (no markdown fences, no wrapping other than valid JSON):

{
  "videoSummary": {
    "synopsis": "Clear 2-3 sentence overview of what happens in the video.",
    "mood": "e.g. High-energy, Inspirational, Chill/Aesthetic, Cinematic, Comedic, etc.",
    "visualPacing": "e.g. Fast-cut, Slow-motion, Dynamic rhythm, Smooth panning",
    "detectedAudioOrAction": "Summary of audio, voiceover, sound cues, or key actions",
    "retentionScore": 85,
    "keyThemes": ["theme1", "theme2", "theme3"]
  },
  "scenes": [
    {
      "timestamp": "00:00",
      "seconds": 0,
      "description": "Scene overview",
      "visualHook": "Key visual trigger or action",
      "viralPotential": "High"
    }
  ],
  "tiktok": {
    "hooks": [
      "Hook 1: High curiosity gap (First 3 seconds text/voice)",
      "Hook 2: Relatable / Problem-first angle",
      "Hook 3: Shock / Contrarian value hook"
    ],
    "titles": [
      "Viral Title Option 1 (Punchy & Short)",
      "Viral Title Option 2 (Search-optimized)",
      "Viral Title Option 3 (Emotional/Dramatic)"
    ],
    "caption": "Compelling TikTok caption with an engaging CTA (e.g. 'Wait till the end 😳 Drop your thoughts below 👇')",
    "hashtags": {
      "trending": ["#fyp", "#viral", "#foryoupage"],
      "niche": ["#nicheTag1", "#nicheTag2", "#nicheTag3"],
      "broad": ["#video", "#trending", "#contentcreator"]
    },
    "bestThumbnailTime": "00:03",
    "thumbnailReason": "Why this specific frame makes the highest-converting thumbnail.",
    "fullCopy": "A combined, ready-to-copy TikTok post text including title, caption, CTA, and hashtags formatted with clean line breaks."
  },
  "facebook": {
    "postTitle": "Catchy Facebook Post Headline that stops the feed scroll",
    "reelsTitle": "Short, punchy Facebook Reels title",
    "description": "Engaging Facebook description. Use storytelling and relatable structure formatted with readable line breaks for Facebook feed.",
    "engagementQuestion": "A thought-provoking question to generate comment debates and shares.",
    "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4", "#Tag5"],
    "fullCopy": "A complete ready-to-copy Facebook post combining Headline, Story description, Engagement Question, and Hashtags."
  },
  "musicPrompt": {
    "prompt": "Detailed prompt for Google Flow / Google MusicFX / Lyria. Include Genre, exact BPM, mood, lead instruments, atmospheric textures, and rhythmic pacing matching this video.",
    "genre": "e.g. Synthwave / Lo-Fi Beats / Cinematic Orchestral / Upbeat Afro-Pop / Tech Deep House",
    "bpm": "120 BPM",
    "mood": "e.g. Euphoric & energetic with a rising bassline",
    "instruments": ["Deep 808 bass", "Warm analog synth pads", "Punchy trap drums", "Glistening pluck melody"],
    "styleNotes": "Tips on how the track should transition to match the video climax.",
    "pacingSync": "Explanation of how the music dynamics synchronize with the video's cuts and energy."
  }
}
`;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}

async function uploadToGeminiFileApi(
  file: File,
  apiKey: string,
  onProgress?: (progress: number, status: string) => void
): Promise<{ uri: string; mimeType: string; name: string }> {
  onProgress?.(5, 'Initiating file upload to Gemini...');

  const uploadInitUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
  const initResponse = await fetch(uploadInitUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': file.size.toString(),
      'X-Goog-Upload-Header-Content-Type': file.type || 'video/mp4',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: {
        display_name: file.name,
      },
    }),
  });

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    throw new Error(`Failed to initiate Gemini file upload (${initResponse.status}): ${errorText}`);
  }

  const uploadUrl = initResponse.headers.get('x-goog-upload-url');
  if (!uploadUrl) {
    throw new Error('Did not receive upload URL from Gemini API');
  }

  onProgress?.(15, 'Uploading video bytes...');

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': file.size.toString(),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Failed to upload file content (${uploadResponse.status}): ${errorText}`);
  }

  const fileData = await uploadResponse.json();
  const fileUri = fileData.file?.uri;
  const fileName = fileData.file?.name;
  const mimeType = fileData.file?.mimeType || file.type || 'video/mp4';

  let state = fileData.file?.state;
  let attempts = 0;
  
  if (state !== 'ACTIVE') {
    const normalizedName = fileName.startsWith('files/') ? fileName : `files/${fileName}`;
    const checkUrl = `https://generativelanguage.googleapis.com/v1beta/${normalizedName}?key=${apiKey}`;

    while (state === 'PROCESSING' && attempts < 30) {
      await new Promise((r) => setTimeout(r, 2000));
      attempts++;
      onProgress?.(
        Math.min(85, 60 + attempts * 2),
        `Processing video frames (${attempts * 2}s)...`
      );

      try {
        const checkRes = await fetch(checkUrl);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          state = checkData.state;
          if (state === 'ACTIVE') {
            break;
          }
          if (state === 'FAILED') {
            throw new Error('Gemini failed to process the video file.');
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes('Gemini failed')) {
          throw err;
        }
      }
    }
  }

  return { uri: fileUri, mimeType, name: fileName };
}

export async function analyzeVideoWithGemini(
  file: File,
  apiKey: string,
  modelId: string = 'gemini-3.7-flash',
  userCustomPrompt?: string,
  onProgress?: (progress: number, status: string) => void
): Promise<VideoAnalysisResult> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Please provide a valid Google Gemini API key.');
  }

  const cleanKey = apiKey.trim();
  const cleanModel = (modelId || 'gemini-3.7-flash').trim().replace(/^models\//, '');
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${cleanKey}`;
  const finalPrompt = buildPromptTemplate(userCustomPrompt);

  let contents: any[] = [];

  if (file.size <= 15 * 1024 * 1024) {
    onProgress?.(20, 'Encoding video locally...');
    try {
      const base64Data = await fileToBase64(file);
      onProgress?.(45, 'Sending video to Gemini AI...');
      contents = [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: file.type || 'video/mp4',
                data: base64Data,
              },
            },
            {
              text: finalPrompt,
            },
          ],
        },
      ];
    } catch (err) {
      console.warn('Base64 encoding fallback to File API', err);
      const uploaded = await uploadToGeminiFileApi(file, cleanKey, onProgress);
      contents = [
        {
          role: 'user',
          parts: [
            {
              fileData: {
                mimeType: uploaded.mimeType,
                fileUri: uploaded.uri,
              },
            },
            {
              text: finalPrompt,
            },
          ],
        },
      ];
    }
  } else {
    const uploaded = await uploadToGeminiFileApi(file, cleanKey, onProgress);
    contents = [
      {
        role: 'user',
        parts: [
          {
            fileData: {
              mimeType: uploaded.mimeType,
              fileUri: uploaded.uri,
            },
          },
          {
            text: finalPrompt,
          },
        ],
      },
    ];
  }

  onProgress?.(85, 'Analyzing scenes, custom hooks & crafting viral copy...');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedMsg = errorBody;
    try {
      const jsonErr = JSON.parse(errorBody);
      parsedMsg = jsonErr.error?.message || errorBody;
    } catch {
      // keep parsedMsg
    }
    throw new Error(`Gemini API Error (${response.status}): ${parsedMsg}`);
  }

  onProgress?.(95, 'Synthesizing viral packages & music prompts...');

  const data = await response.json();
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOutput) {
    throw new Error('Gemini API returned an empty response. Please try again.');
  }

  let parsed: any;
  try {
    let cleaned = textOutput.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    console.error('Failed to parse Gemini output:', textOutput);
    throw new Error(`Failed to parse AI output: ${err.message}`);
  }

  const result: VideoAnalysisResult = {
    id: 'vf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
    fileName: file.name,
    videoDuration: 0,
    aspectRatio: 'Unknown',
    videoSummary: parsed.videoSummary || {
      synopsis: 'Video analyzed successfully.',
      mood: 'Dynamic',
      visualPacing: 'Engaging',
      detectedAudioOrAction: 'Action detected.',
      retentionScore: 88,
      keyThemes: ['Viral', 'Social Media'],
    },
    scenes: parsed.scenes || [],
    tiktok: parsed.tiktok || {
      hooks: ['Watch this!'],
      titles: ['Amazing Video'],
      caption: 'Check this out! Drop a comment 👇',
      hashtags: { trending: ['#viral', '#fyp'], niche: ['#content'], broad: ['#video'] },
      bestThumbnailTime: '00:01',
      thumbnailReason: 'Key action moment.',
      fullCopy: 'Check this out! #viral #fyp',
    },
    facebook: parsed.facebook || {
      postTitle: 'Must Watch Moment',
      reelsTitle: 'Must Watch',
      description: 'You won\'t believe this moment. What do you think?',
      engagementQuestion: 'Have you seen anything like this before?',
      hashtags: ['#ViralVideo', '#MustWatch'],
      fullCopy: 'Must Watch Moment\n\nYou won\'t believe this moment. What do you think?\n\n#ViralVideo',
    },
    musicPrompt: parsed.musicPrompt || {
      prompt: 'Cinematic electronic beat with upbeat tempo, 120 BPM, punchy drums and deep bass.',
      genre: 'Electronic Pop',
      bpm: '120 BPM',
      mood: 'Energetic & Uplifting',
      instruments: ['Synthesizer', 'Drums', '808 Bass'],
      styleNotes: 'Builds up energy alongside the video action.',
      pacingSync: 'Matches high-energy visual cuts.',
    },
  };

  onProgress?.(100, 'Done!');
  return result;
}
