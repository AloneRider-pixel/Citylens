import React from 'react';
import {
  Compass,
  BookOpen,
  Volume2,
  Sparkles,
  Camera,
  Share2,
  WifiOff,
  HardDrive,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
  savedToursCount: number;
  onOpenPassport: () => void;
  onNewScan: () => void;
  hasActiveLandmark: boolean;
  onOpenShare?: () => void;
  isOffline?: boolean;
}

const VOICES = [
  { id: 'Kore', name: 'Kore', label: 'Warm Storyteller' },
  { id: 'Puck', name: 'Puck', label: 'Spirited Explorer' },
  { id: 'Fenrir', name: 'Fenrir', label: 'Classic Historian' },
  { id: 'Zephyr', name: 'Zephyr', label: 'Serene Guide' },
];

export const Header: React.FC<HeaderProps> = ({
  selectedVoice,
  onSelectVoice,
  savedToursCount,
  onOpenPassport,
  onNewScan,
  hasActiveLandmark,
  onOpenShare,
  isOffline = false,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950 flex items-center justify-center shadow-sm transition-colors">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                CityLens <span className="text-amber-600 dark:text-amber-400 font-mono text-sm px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/50 rounded border border-amber-200 dark:border-amber-800/80">AR</span>
              </h1>
              {isOffline ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-full shadow-2xs">
                  <WifiOff className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                  <span>Offline Mode</span>
                </span>
              ) : (
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  Multimodal Urban Tourism
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {isOffline ? 'Viewing cached tours & offline audio from IndexedDB' : 'Gemini Pro Vision • Search Grounding • Flash TTS'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Theme Toggle - High-Contrast Night Urban Exploration */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title={isDark ? "Switch to Day Mode" : "Switch to High-Contrast Night Exploration Mode"}
            aria-label={isDark ? "Switch to Day Mode" : "Switch to High-Contrast Night Exploration Mode"}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                <span className="hidden sm:inline text-amber-300">Night Vision</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Day</span>
              </>
            )}
          </button>

          {/* Voice Selector */}
          <div className="relative flex items-center bg-slate-100/90 dark:bg-slate-900 rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 text-xs">
            <Volume2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 mr-1.5" />
            <span className="text-slate-500 dark:text-slate-400 mr-1.5 hidden md:inline">Voice:</span>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => onSelectVoice(e.target.value)}
              className="bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id} className="dark:bg-slate-900 dark:text-slate-200">
                  {v.name} ({v.label})
                </option>
              ))}
            </select>
          </div>

          {/* Travel Passport / Saved Tours */}
          <button
            id="passport-btn"
            onClick={onOpenPassport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="View Discovered Landmarks in Passport"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Passport</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700">
              {savedToursCount}
            </span>
          </button>

          {/* Share Tour Button when landmark is active */}
          {hasActiveLandmark && onOpenShare && (
            <button
              id="share-tour-btn"
              onClick={onOpenShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/70 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Share Landmark Tour & Social Card"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Share Tour</span>
            </button>
          )}

          {/* New Scan button */}
          {hasActiveLandmark && (
            <button
              id="new-scan-btn"
              onClick={onNewScan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400 dark:text-slate-950" />
              <span>Scan Another</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
