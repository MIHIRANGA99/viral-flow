export interface VideoMetadata {
  file: File;
  name: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  aspectRatio: string;
  objectUrl: string;
}

export interface SubtitleCue {
  id: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  sourceText: string;
  translatedText: string;
  confidence?: number;
}

export interface SubtitleStyleConfig {
  fontFamily: 'Noto Sans Sinhala' | 'Gemunu Libre' | 'Abhaya Libre' | 'Inter' | 'Impact';
  fontSize: number; // in px or rem scale
  textColor: string;
  outlineColor: string;
  outlineWidth: number;
  backgroundColor: string; // backdrop box color
  backgroundOpacity: number; // 0 to 1
  backgroundPadding: number;
  borderRadius: number;
  positionY: number; // percentage from bottom (e.g. 10%)
  alignment: 'center' | 'left' | 'right';
  bold: boolean;
  maxWidthPercent?: number; // 50 to 100 percentage of video width to wrap long text
  maskOriginalSubtitles: boolean; // Creates an opaque/blur box to cover original burned-in subs
}

export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
export type LogoAnimationType = 'static' | 'fade-in' | 'pulse' | 'gentle-bounce' | 'shimmer';

export interface LogoConfig {
  file: File | null;
  objectUrl: string | null;
  position: LogoPosition;
  scale: number; // 0.05 to 0.4
  opacity: number; // 0 to 1
  margin: number; // in px
  animation: LogoAnimationType;
  animationSpeed: number; // 0.5x to 2x
}

export interface VideoClipSegment {
  id: string;
  index: number;
  title: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  duration: number;  // in seconds
  thumbnailUrl?: string;
  cues: SubtitleCue[];
}

export interface TransitionConfig {
  fadeInDuration: number; // in seconds, e.g. 0.8
  fadeOutDuration: number; // in seconds, e.g. 0.8
  transitionType: 'fade-to-black' | 'cross-dissolve' | 'fade-to-white';
}

export interface SubtitleAnalysisResult {
  sourceLanguage: string;
  hasBurnedInSubtitles: boolean;
  detectedAudioSummary: string;
  cues: SubtitleCue[];
}

export interface RenderJobProgress {
  clipIndex: number;
  totalClips: number;
  clipTitle: string;
  percent: number;
  status: string;
}

export type TargetLanguage = 'Sinhala' | 'English' | 'Tamil' | 'Hindi' | 'Spanish' | 'French' | 'German' | 'Japanese' | 'Chinese' | 'Arabic';

export type SubtitleScanZonePreset = 'bottom' | 'top' | 'middle' | 'fullscreen' | 'custom';

export interface SubtitleScanZone {
  preset: SubtitleScanZonePreset;
  yPercent: number;      // 0 to 100 (top edge from top of video)
  heightPercent: number; // 10 to 100 (height of scanned crop box)
}

