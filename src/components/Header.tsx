import React from 'react';
import { Compass, BookOpen, Volume2, Sparkles, Camera, Share2 } from 'lucide-react';

interface HeaderProps {
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
  savedToursCount: number;
  onOpenPassport: () => void;
  onNewScan: () => void;
  hasActiveLandmark: boolean;
  onOpenShare?: () => void;
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
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-sm">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                CityLens <span className="text-amber-600 font-mono text-sm px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200">AR</span>
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Multimodal Urban Tourism
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Gemini Pro Vision • Search Grounding • Flash TTS
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Voice Selector */}
          <div className="relative flex items-center bg-slate-100/90 rounded-lg px-2.5 py-1.5 border border-slate-200 text-xs">
            <Volume2 className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
            <span className="text-slate-500 mr-1.5 hidden md:inline">Voice:</span>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => onSelectVoice(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.label})
                </option>
              ))}
            </select>
          </div>

          {/* Travel Passport / Saved Tours */}
          <button
            id="passport-btn"
            onClick={onOpenPassport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
            title="View Discovered Landmarks in Passport"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Passport</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 text-amber-800 font-bold">
              {savedToursCount}
            </span>
          </button>

          {/* Share Tour Button when landmark is active */}
          {hasActiveLandmark && onOpenShare && (
            <button
              id="share-tour-btn"
              onClick={onOpenShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold shadow-xs transition-colors"
              title="Share Landmark Tour & Social Card"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Share Tour</span>
            </button>
          )}

          {/* New Scan button */}
          {hasActiveLandmark && (
            <button
              id="new-scan-btn"
              onClick={onNewScan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Scan Another</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
