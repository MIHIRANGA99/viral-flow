export interface VideoMetadata {
  file: File;
  name: string;
  size: number;
  type: string;
  duration: number; // in seconds
  width: number;
  height: number;
  aspectRatio: string; // e.g. "9:16 (Vertical Reel/TikTok)" or "16:9 (Landscape)"
  objectUrl: string;
}

export interface LogoOverlayConfig {
  enabled: boolean;
  imageUrl: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 0 - 100
  opacity: number; // 0 to 1
  borderRadius: number; // in px or percentage
}

export interface WatermarkConfig {
  enabled: boolean;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 0 - 100
  height: number; // percentage 0 - 100
  mode: 'inpaint' | 'blur' | 'crop' | 'logo';
  cropZoom: number; // e.g. 1.06
  blurStrength: number; // e.g. 12
  logoOverlay?: LogoOverlayConfig;
}

export interface MusicAdjustmentConfig {
  startOffset: number; // in seconds
  fadeIn: number; // in seconds (e.g. 0 to 3s)
  fadeOut: number; // in seconds (e.g. 0 to 3s)
  speed: number; // 0.8x to 1.5x
  loop: boolean;
}

export interface SceneBreakdown {
  timestamp: string; // "00:02"
  seconds: number;
  description: string;
  visualHook: string;
  viralPotential: 'High' | 'Medium' | 'Low';
}

export interface TikTokCopy {
  hooks: string[]; // 3 hook variations
  titles: string[]; // 3 punchy titles
  caption: string;
  hashtags: {
    trending: string[];
    niche: string[];
    broad: string[];
  };
  bestThumbnailTime: string;
  thumbnailReason: string;
  fullCopy: string;
}

export interface FacebookCopy {
  postTitle: string;
  reelsTitle: string;
  description: string;
  engagementQuestion: string;
  hashtags: string[];
  fullCopy: string;
}

export interface GoogleFlowMusicPrompt {
  prompt: string; // Ready to paste into Google MusicFX / Google Flow
  genre: string;
  bpm: number | string;
  mood: string;
  instruments: string[];
  styleNotes: string;
  pacingSync: string;
}

export interface VideoAnalysisResult {
  id: string;
  createdAt: string;
  fileName: string;
  videoDuration: number;
  aspectRatio: string;
  
  videoSummary: {
    synopsis: string;
    mood: string;
    visualPacing: string;
    detectedAudioOrAction: string;
    retentionScore: number; // 0 - 100
    keyThemes: string[];
  };

  scenes: SceneBreakdown[];
  tiktok: TikTokCopy;
  facebook: FacebookCopy;
  musicPrompt: GoogleFlowMusicPrompt;
}

export interface AnalysisHistoryItem {
  id: string;
  createdAt: string;
  fileName: string;
  videoDuration: number;
  aspectRatio: string;
  result: VideoAnalysisResult;
}

export type ActiveTab = 'tiktok' | 'facebook' | 'music' | 'scenes' | 'json';
