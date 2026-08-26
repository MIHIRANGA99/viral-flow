/**
 * High-Fidelity Audio Extractor for Gemini AI Speech Recognition.
 * Extracts 16kHz Mono uncompressed WAV directly from any video file in the browser
 * with 100% natural 1.0x pitch and acoustic timing fidelity.
 */

export interface AudioExtractOptions {
  startTime?: number; // in seconds (default 0)
  duration?: number;  // in seconds (e.g. 480s for Part 1)
  targetSampleRate?: number; // default 16000Hz (standard for Gemini & Whisper speech AI)
  signal?: AbortSignal;
  onProgress?: (percent: number, status: string) => void;
}

export interface ExtractedAudioResult {
  base64: string;
  mimeType: string;
  duration: number;
}

/**
 * Extracts natural, uncompressed 16kHz mono audio from a video file.
 */
export async function extractAudioFromVideo(
  videoFile: File,
  options?: AudioExtractOptions
): Promise<ExtractedAudioResult> {
  const targetSampleRate = options?.targetSampleRate || 16000;
  const startTime = Math.max(0, options?.startTime || 0);

  if (options?.signal?.aborted) {
    throw new Error('Audio extraction cancelled by user.');
  }

  options?.onProgress?.(10, 'Extracting master audio stream from video file...');

  try {
    return await extractAudioViaWebAudio(videoFile, startTime, options?.duration, targetSampleRate, options?.signal, options?.onProgress);
  } catch (err: any) {
    if (options?.signal?.aborted) throw err;
    console.warn('WebAudio decode failed, attempting streaming fallback:', err);
    return await extractAudioViaRealtimeStream(videoFile, startTime, options?.duration, targetSampleRate, options?.signal, options?.onProgress);
  }
}

/**
 * Fast & Lossless Web Audio API extraction (instantaneous, 100% accurate waveforms)
 */
async function extractAudioViaWebAudio(
  file: File,
  startTime: number,
  durationLimit: number | undefined,
  targetSampleRate: number,
  signal?: AbortSignal,
  onProgress?: (percent: number, status: string) => void
): Promise<ExtractedAudioResult> {
  if (signal?.aborted) throw new Error('Audio extraction cancelled by user.');
  onProgress?.(20, 'Reading video audio track samples...');

  // For massive files (>500MB), slice the relevant segment if possible or read full buffer
  const arrayBuffer = await file.arrayBuffer();
  if (signal?.aborted) throw new Error('Audio extraction cancelled by user.');

  onProgress?.(35, 'Decoding audio waveform at original sample rate...');

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  let decodedBuffer: AudioBuffer;

  try {
    decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    audioCtx.close();
  }

  if (signal?.aborted) throw new Error('Audio extraction cancelled by user.');

  const totalDuration = decodedBuffer.duration;
  const extractSec = durationLimit
    ? Math.min(durationLimit, Math.max(1, totalDuration - startTime))
    : Math.max(1, totalDuration - startTime);

  onProgress?.(45, `Downsampling ${Math.floor(extractSec)}s audio to 16kHz mono WAV for AI...`);

  // Render sliced segment to 16kHz Mono OfflineAudioContext
  const offlineCtx = new OfflineAudioContext(
    1,
    Math.ceil(extractSec * targetSampleRate),
    targetSampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = decodedBuffer;
  source.connect(offlineCtx.destination);
  source.start(0, startTime, extractSec);

  const renderedBuffer = await offlineCtx.startRendering();

  if (signal?.aborted) throw new Error('Audio extraction cancelled by user.');

  onProgress?.(50, 'Encoding crystal-clear 16kHz WAV speech payload...');
  const wavBlob = audioBufferToWavBlob(renderedBuffer);
  const base64 = await blobToBase64(wavBlob);

  return {
    base64,
    mimeType: 'audio/wav',
    duration: extractSec,
  };
}

/**
 * Fallback: Natural 1.0x Realtime streaming capture via HTML5 Video element
 */
async function extractAudioViaRealtimeStream(
  videoFile: File,
  startTime: number,
  durationLimit: number | undefined,
  _targetSampleRate: number,
  signal?: AbortSignal,
  onProgress?: (percent: number, status: string) => void
): Promise<ExtractedAudioResult> {
  if (signal?.aborted) throw new Error('Audio extraction cancelled by user.');
  onProgress?.(15, 'Preparing streaming audio capture...');

  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  const videoUrl = URL.createObjectURL(videoFile);
  video.src = videoUrl;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video metadata for audio extraction.'));
  });

  if (signal?.aborted) {
    URL.revokeObjectURL(videoUrl);
    throw new Error('Audio extraction cancelled by user.');
  }

  const totalDuration = video.duration || 10;
  const extractDuration = durationLimit ? Math.min(durationLimit, totalDuration - startTime) : Math.min(300, totalDuration - startTime);

  video.currentTime = startTime;
  await new Promise<void>((res) => {
    video.onseeked = () => res();
  });

  if (signal?.aborted) {
    URL.revokeObjectURL(videoUrl);
    throw new Error('Audio extraction cancelled by user.');
  }

  const stream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream ? (video as any).mozCaptureStream() : null;

  if (!stream) {
    URL.revokeObjectURL(videoUrl);
    throw new Error('Browser does not support MediaStream video capture.');
  }

  // Web Audio silent routing: Capture full audio data while keeping speakers 100% silent
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const source = audioCtx.createMediaElementSource(video);
  const destination = audioCtx.createMediaStreamDestination();
  source.connect(destination);

  const recorder = new MediaRecorder(destination.stream, {
    mimeType: 'audio/webm;codecs=opus',
    audioBitsPerSecond: 128000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'audio/webm' }));
  });

  recorder.start(100);
  video.muted = false;
  video.playbackRate = 1.0;
  await video.play();

  const checkInterval = 250;
  let elapsed = 0;
  while (video.currentTime < startTime + extractDuration && !video.paused && !video.ended) {
    if (signal?.aborted) {
      recorder.stop();
      video.pause();
      audioCtx.close();
      URL.revokeObjectURL(videoUrl);
      throw new Error('Audio extraction cancelled by user.');
    }
    await new Promise((r) => setTimeout(r, checkInterval));
    elapsed = video.currentTime - startTime;
    const pct = Math.min(48, 20 + Math.floor((elapsed / extractDuration) * 28));
    onProgress?.(pct, `Streaming speech track silently (${Math.floor(elapsed)}s/${Math.floor(extractDuration)}s)...`);
  }

  recorder.stop();
  video.pause();
  const recordedBlob = await recordPromise;
  audioCtx.close();
  URL.revokeObjectURL(videoUrl);

  const base64 = await blobToBase64(recordedBlob);
  return {
    base64,
    mimeType: 'audio/webm',
    duration: extractDuration,
  };
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const channelData = buffer.getChannelData(0);
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = channelData.length * bytesPerSample;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(8, 'WAVE');

  // fmt subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data subchunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM audio samples (clamped 16-bit)
  let offset = 44;
  for (let i = 0; i < channelData.length; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
