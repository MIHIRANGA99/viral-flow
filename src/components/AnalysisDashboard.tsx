import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Music,
  Share2,
  Flame,
  Clock,
  Layers,
  Code,
  Download,
  ExternalLink,
  MessageSquare,
  Hash,
  FileText,
  Zap,
  TrendingUp,
  Tag,
  Headphones,
  UploadCloud
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ActiveTab, VideoAnalysisResult } from '../types';

interface AnalysisDashboardProps {
  result: VideoAnalysisResult;
  onSeekVideo: (seconds: number) => void;
  onAttachMusic?: (file: File) => void;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  result,
  onSeekVideo,
  onAttachMusic,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tiktok');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, triggerConfetti = false) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (triggerConfetti) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const parseTimestampSeconds = (ts: string): number => {
    if (!ts) return 0;
    const parts = ts.split(':').map(Number);
    if (parts.length === 2) {
      return (isFinite(parts[0]) ? parts[0] * 60 : 0) + (isFinite(parts[1]) ? parts[1] : 0);
    } else if (parts.length === 3) {
      return (
        (isFinite(parts[0]) ? parts[0] * 3600 : 0) +
        (isFinite(parts[1]) ? parts[1] * 60 : 0) +
        (isFinite(parts[2]) ? parts[2] : 0)
      );
    }
    return 0;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    const md = `# ViralFlow Analysis: ${result.fileName}
Generated: ${new Date(result.createdAt).toLocaleString()}

## Video Overview
- **Synopsis:** ${result.videoSummary.synopsis}
- **Mood:** ${result.videoSummary.mood}
- **Pacing:** ${result.videoSummary.visualPacing}
- **Retention Score:** ${result.videoSummary.retentionScore}/100

---

## 🎵 Google Flow Music Prompt
> ${result.musicPrompt.prompt}
- **Genre:** ${result.musicPrompt.genre}
- **BPM:** ${result.musicPrompt.bpm}
- **Mood:** ${result.musicPrompt.mood}
- **Instruments:** ${result.musicPrompt.instruments.join(', ')}

---

## 📱 TikTok Viral Suite
### Hook Variations
${result.tiktok.hooks.map((h, i) => `${i + 1}. ${h}`).join('\n')}

### Title Options
${result.tiktok.titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

### Caption
${result.tiktok.caption}

### Hashtags
${[
  ...result.tiktok.hashtags.trending,
  ...result.tiktok.hashtags.niche,
  ...result.tiktok.hashtags.broad,
].join(' ')}

### Best Thumbnail Frame: ${result.tiktok.bestThumbnailTime}
Reason: ${result.tiktok.thumbnailReason}

---

## 📘 Facebook Viral Suite
### Post Title
${result.facebook.postTitle}

### Reels Title
${result.facebook.reelsTitle}

### Description
${result.facebook.description}

### Engagement Question
${result.facebook.engagementQuestion}

### Hashtags
${result.facebook.hashtags.join(' ')}
`;

    downloadFile(md, `${result.fileName.replace(/\.[^/.]+$/, '')}_viral_kit.md`, 'text/markdown');
  };

  const allTiktokHashtags = [
    ...(result.tiktok.hashtags.trending || []),
    ...(result.tiktok.hashtags.niche || []),
    ...(result.tiktok.hashtags.broad || []),
  ];

  const score = result.videoSummary.retentionScore || 85;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="w-full space-y-6">
      {/* Top Video Summary & Retention Radial Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-[#131d34] to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-pink-400" />
                AI Multimodal Synthesis
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-pink-500/15 text-pink-300 border border-pink-500/30">
                Mood: {result.videoSummary.mood}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
              {result.videoSummary.synopsis}
            </h3>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {result.videoSummary.keyThemes?.map((theme, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium"
                >
                  #{theme}
                </span>
              ))}
            </div>
          </div>

          {/* Retention Radial Gauge Section */}
          <div className="flex items-center gap-4 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 pt-3 lg:pt-0 lg:pl-6 justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              {/* Radial Progress Gauge */}
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 52 52">
                  <circle
                    cx="26"
                    cy="26"
                    r={radius}
                    className="stroke-slate-800"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="26"
                    cy="26"
                    r={radius}
                    className="stroke-amber-400 transition-all duration-1000 ease-out"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute font-black text-white text-base font-mono">
                  {score}
                </div>
              </div>

              <div className="text-left">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Viral Retention
                </div>
                <div className="font-bold text-white text-xs flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  {score >= 80 ? 'High Hook Potential' : 'Solid Engagement'}
                </div>
                <div className="text-slate-400 text-[10px]">{result.videoSummary.visualPacing}</div>
              </div>
            </div>

            <button
              onClick={exportMarkdown}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
              title="Download full kit as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export (.md)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-800/80 gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('tiktok')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'tiktok'
              ? 'bg-pink-600/15 border border-pink-500/50 text-pink-300 shadow-md shadow-pink-600/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Zap className="w-4 h-4 text-pink-500" />
          <span>TikTok Viral Kit</span>
        </button>

        <button
          onClick={() => setActiveTab('facebook')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'facebook'
              ? 'bg-blue-600/15 border border-blue-500/50 text-blue-300 shadow-md shadow-blue-600/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Share2 className="w-4 h-4 text-blue-500" />
          <span>Facebook Posts & Reels</span>
        </button>

        <button
          onClick={() => setActiveTab('music')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'music'
              ? 'bg-amber-600/15 border border-amber-500/50 text-amber-300 shadow-md shadow-amber-600/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Music className="w-4 h-4 text-amber-400" />
          <span>Google Flow Music Prompt</span>
        </button>

        <button
          onClick={() => setActiveTab('scenes')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'scenes'
              ? 'bg-indigo-600/15 border border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-600/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Scene Timeline ({result.scenes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('json')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'json'
              ? 'bg-slate-800 border border-slate-700 text-slate-200 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Raw JSON</span>
        </button>
      </div>

      {/* Tab 1: TikTok Viral Suite */}
      {activeTab === 'tiktok' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 3 First-3-Second Hooks */}
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-pink-500" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  First 3-Second Viral Hooks (Text on Screen / Spoken)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">Pique curiosity in 0-3s</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {result.tiktok.hooks.map((hook, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-pink-500/40 transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-500/20 text-pink-300">
                        Option {idx + 1}
                      </span>
                      <button
                        onClick={() => handleCopy(hook, `hook_${idx}`)}
                        className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
                        title="Copy Hook"
                      >
                        {copiedKey === `hook_${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-white font-medium leading-relaxed">"{hook}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Titles & Thumbnail Recommendation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Viral Titles */}
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Viral TikTok Titles
                </h4>
              </div>
              <div className="space-y-2.5">
                {result.tiktok.titles.map((title, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between gap-3 group hover:border-indigo-500/40 transition"
                  >
                    <span className="text-xs font-semibold text-slate-100">{title}</span>
                    <button
                      onClick={() => handleCopy(title, `title_${idx}`)}
                      className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition cursor-pointer shrink-0"
                    >
                      {copiedKey === `title_${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Thumbnail Timestamp */}
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Recommended Thumbnail Frame
                  </h4>
                </div>
                <button
                  onClick={() => onSeekVideo(parseTimestampSeconds(result.tiktok.bestThumbnailTime))}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-bold border border-amber-500/30 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Jump to {result.tiktok.bestThumbnailTime}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="text-xs font-semibold text-amber-200 mb-1">
                  Optimal Cover Frame at {result.tiktok.bestThumbnailTime}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.tiktok.thumbnailReason}
                </p>
              </div>
            </div>
          </div>

          {/* Hashtags Suite */}
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-pink-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  TikTok Hashtag Matrix ({allTiktokHashtags.length} Tags)
                </h4>
              </div>
              <button
                onClick={() =>
                  handleCopy(allTiktokHashtags.join(' '), 'all_tt_tags', true)
                }
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-pink-600 hover:bg-pink-500 text-white transition flex items-center gap-1.5 shadow-sm shadow-pink-600/30 cursor-pointer"
              >
                {copiedKey === 'all_tt_tags' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied All Tags!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All Hashtags</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <div className="text-[11px] font-bold text-pink-400 uppercase tracking-wider mb-2">
                  🔥 Viral & Trending
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.tiktok.hashtags.trending?.map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => handleCopy(tag, `tt_tr_${i}`)}
                      className="text-xs px-2 py-0.5 rounded bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/20 cursor-pointer transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-2">
                  🎯 Niche & Category
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.tiktok.hashtags.niche?.map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => handleCopy(tag, `tt_ni_${i}`)}
                      className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 cursor-pointer transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  🌐 Broad Reach
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.tiktok.hashtags.broad?.map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => handleCopy(tag, `tt_br_${i}`)}
                      className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 cursor-pointer transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-pink-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Full Ready-To-Publish TikTok Caption
                </h4>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    `${result.tiktok.titles[0]}\n\n${result.tiktok.caption}\n\n${allTiktokHashtags.join(' ')}`,
                    'full_tt_post',
                    true
                  )
                }
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white transition flex items-center gap-2 shadow-lg shadow-pink-600/20 cursor-pointer"
              >
                {copiedKey === 'full_tt_post' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied Full Post!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Full Post & Tags</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
              {`${result.tiktok.titles[0]}\n\n${result.tiktok.caption}\n\n${allTiktokHashtags.join(' ')}`}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>
                Length: {(result.tiktok.caption?.length || 0) + allTiktokHashtags.join(' ').length} / 2,200 chars
              </span>
              <span className="text-emerald-400">Optimized for TikTok algorithm</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Facebook Suite */}
      {activeTab === 'facebook' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Facebook Feed Headline
                </span>
                <button
                  onClick={() => handleCopy(result.facebook.postTitle, 'fb_title')}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  {copiedKey === 'fb_title' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <h4 className="text-sm font-bold text-white">{result.facebook.postTitle}</h4>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  Facebook Reels Title
                </span>
                <button
                  onClick={() => handleCopy(result.facebook.reelsTitle, 'fb_reels_title')}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  {copiedKey === 'fb_reels_title' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <h4 className="text-sm font-bold text-white">{result.facebook.reelsTitle}</h4>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Story-Driven Description & Engagement Question
                </h4>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    `${result.facebook.description}\n\n${result.facebook.engagementQuestion}`,
                    'fb_desc'
                  )
                }
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
              >
                {copiedKey === 'fb_desc' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy Description</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {result.facebook.description}
            </div>

            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
              <MessageSquare className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-bold text-blue-300 mb-0.5">
                  Comment Booster Question
                </div>
                <div className="text-xs text-white font-medium">
                  {result.facebook.engagementQuestion}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Facebook Hashtags
                </h4>
              </div>
              <button
                onClick={() =>
                  handleCopy(result.facebook.hashtags.join(' '), 'fb_tags')
                }
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
              >
                {copiedKey === 'fb_tags' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy Hashtags</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {result.facebook.hashtags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Full Ready-To-Publish Facebook Post
                </h4>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    `${result.facebook.postTitle}\n\n${result.facebook.description}\n\n${result.facebook.engagementQuestion}\n\n${result.facebook.hashtags.join(' ')}`,
                    'full_fb_post',
                    true
                  )
                }
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition flex items-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                {copiedKey === 'full_fb_post' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied Facebook Post!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Full Post</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
              {`${result.facebook.postTitle}\n\n${result.facebook.description}\n\n${result.facebook.engagementQuestion}\n\n${result.facebook.hashtags.join(' ')}`}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Google Flow / MusicFX Prompt */}
      {activeTab === 'music' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-indigo-600/10 border border-amber-500/30 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Google Flow & MusicFX Generation Prompt
                  </h4>
                  <p className="text-xs text-amber-200/80">
                    Paste directly into Google MusicFX / Google Flow for instant matching soundtrack
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://aitestkitchen.withgoogle.com/tools/music-fx"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition flex items-center gap-1"
                >
                  <span>Open MusicFX</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => handleCopy(result.musicPrompt.prompt, 'music_prompt', true)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {copiedKey === 'music_prompt' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied Prompt!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Music Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs sm:text-sm font-mono text-amber-100/90 leading-relaxed selection:bg-amber-500 selection:text-black">
              "{result.musicPrompt.prompt}"
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Genre</div>
                <div className="text-xs font-bold text-white mt-0.5">{result.musicPrompt.genre}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Tempo / BPM</div>
                <div className="text-xs font-bold text-white mt-0.5">{result.musicPrompt.bpm}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Mood / Vibe</div>
                <div className="text-xs font-bold text-white mt-0.5">{result.musicPrompt.mood}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Cues</div>
                <div className="text-xs font-bold text-white mt-0.5">Synchronized</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Recommended Instruments & Textures
              </h5>
              <div className="flex flex-wrap gap-2">
                {result.musicPrompt.instruments?.map((inst, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium"
                  >
                    🎵 {inst}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Video Pacing & Energy Synchronization
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                {result.musicPrompt.pacingSync || result.musicPrompt.styleNotes}
              </p>
            </div>
          </div>

          {/* Attach Generated Music CTA Banner */}
          {onAttachMusic && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                    Downloaded your track from MusicFX / Flow?
                  </h5>
                  <p className="text-xs text-slate-300">
                    Attach your generated audio file to preview it synced with the video and download the final clip.
                  </p>
                </div>
              </div>

              <div>
                <label className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20 shrink-0">
                  <UploadCloud className="w-4 h-4" />
                  <span>Attach Music File</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        onAttachMusic(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Scene Breakdown & Timeline */}
      {activeTab === 'scenes' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Detected Scene Markers & Hook Points (Click timestamp to jump player)
            </h4>
            <span className="text-xs text-slate-500">{result.scenes.length} Scenes Analyzed</span>
          </div>

          <div className="space-y-2.5">
            {result.scenes.map((scene, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition flex items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onSeekVideo(scene.seconds || parseTimestampSeconds(scene.timestamp))}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition shrink-0"
                    title="Seek to this moment"
                  >
                    <Clock className="w-3 h-3" />
                    <span>{scene.timestamp}</span>
                  </button>

                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-indigo-200 transition">
                      {scene.description}
                    </div>
                    {scene.visualHook && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Hook trigger: {scene.visualHook}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      scene.viralPotential === 'High'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : scene.viralPotential === 'Medium'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {scene.viralPotential || 'Normal'} Impact
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Raw JSON */}
      {activeTab === 'json' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Complete AI Response Structure</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  downloadFile(
                    JSON.stringify(result, null, 2),
                    `${result.fileName.replace(/\.[^/.]+$/, '')}_analysis.json`,
                    'application/json'
                  )
                }
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON</span>
              </button>
              <button
                onClick={() => handleCopy(JSON.stringify(result, null, 2), 'raw_json')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'raw_json' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy JSON</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300/90 overflow-x-auto max-h-[500px]">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
