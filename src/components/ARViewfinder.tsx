import React, { useState, useRef } from 'react';
import {
  Compass,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  Layers,
  Scan,
  CheckCircle2,
  Flame,
  Shield,
  Eye,
  X,
  Share2,
  Palette,
  Sliders,
  Wand2,
  RefreshCw,
  SunMedium,
  Zap,
} from 'lucide-react';
import { KeyFocalPoint, LandmarkRecognitionResult } from '../types';

export type ARFilterMode =
  | 'normal'
  | 'watercolor'
  | 'neon'
  | 'blueprint'
  | 'archival'
  | 'synthwave';

interface ARViewfinderProps {
  imageSrc: string;
  recognition: LandmarkRecognitionResult;
  activePointId: string | null;
  onSelectPoint: (point: KeyFocalPoint | null) => void;
  onOpenShare?: () => void;
  currentFilter?: ARFilterMode;
  onFilterChange?: (filter: ARFilterMode) => void;
}

interface FilterDefinition {
  id: ARFilterMode;
  name: string;
  shortLabel: string;
  tagline: string;
  badgeColor: string;
  activeBorder: string;
  icon: React.ElementType;
}

const FILTER_PRESETS: FilterDefinition[] = [
  {
    id: 'normal',
    name: 'Natural Camera',
    shortLabel: 'Standard',
    tagline: 'True-to-life optical fidelity',
    badgeColor: 'bg-slate-700 text-slate-100',
    activeBorder: 'border-amber-400 text-amber-400 bg-amber-500/10',
    icon: Eye,
  },
  {
    id: 'watercolor',
    name: 'Watercolor Sketch',
    shortLabel: 'Watercolor',
    tagline: 'Soft painterly pigments & textured wash',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    activeBorder: 'border-rose-400 text-rose-300 bg-rose-500/20',
    icon: Palette,
  },
  {
    id: 'neon',
    name: 'Futuristic Cyber-Neon',
    shortLabel: 'Cyber Neon',
    tagline: 'High-energy cyberpunk glow & glowing vectors',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    activeBorder: 'border-cyan-400 text-cyan-300 bg-cyan-500/20',
    icon: Zap,
  },
  {
    id: 'blueprint',
    name: 'Architectural Blueprint',
    shortLabel: 'Blueprint',
    tagline: 'Cyan drafting paper & engineering lines',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    activeBorder: 'border-blue-400 text-blue-300 bg-blue-500/20',
    icon: Layers,
  },
  {
    id: 'archival',
    name: 'Vintage Archival',
    shortLabel: 'Archival',
    tagline: '19th century sepia & historic daguerreotype',
    badgeColor: 'bg-amber-800/40 text-amber-200 border-amber-600/30',
    activeBorder: 'border-amber-400 text-amber-200 bg-amber-800/30',
    icon: SunMedium,
  },
  {
    id: 'synthwave',
    name: 'Retro Synthwave',
    shortLabel: 'Synthwave',
    tagline: '80s sunset magenta & cyber horizon',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    activeBorder: 'border-fuchsia-400 text-fuchsia-300 bg-fuchsia-500/20',
    icon: Wand2,
  },
];

export const ARViewfinder: React.FC<ARViewfinderProps> = ({
  imageSrc,
  recognition,
  activePointId,
  onSelectPoint,
  onOpenShare,
  currentFilter: externalFilter,
  onFilterChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [internalFilter, setInternalFilter] = useState<ARFilterMode>('normal');
  const [filterIntensity, setFilterIntensity] = useState<number>(85); // 40 - 100%
  const [isComparingOriginal, setIsComparingOriginal] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const [showHUD, setShowHUD] = useState(true);
  const [showLaser, setShowLaser] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const activeFilterMode = externalFilter || internalFilter;

  const handleSetFilter = (mode: ARFilterMode) => {
    setInternalFilter(mode);
    if (onFilterChange) {
      onFilterChange(mode);
    }
  };

  // 3D Parallax Tilt calculation on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 8, y: -y * 8 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const activePoint = recognition.keyFocalPoints.find((p) => p.id === activePointId);

  const getTagBadge = (type: string) => {
    switch (type) {
      case 'architectural':
        return { label: 'Arch Detail', icon: Layers, color: 'bg-cyan-500 text-slate-950' };
      case 'historical':
        return { label: 'Historical', icon: Shield, color: 'bg-amber-500 text-slate-950' };
      case 'trivia':
        return { label: 'Secret Trivia', icon: Flame, color: 'bg-rose-500 text-white' };
      case 'viewpoint':
      default:
        return { label: 'Vantage Point', icon: Eye, color: 'bg-emerald-500 text-slate-950' };
    }
  };

  const currentPreset = FILTER_PRESETS.find((p) => p.id === activeFilterMode) || FILTER_PRESETS[0];

  // Helper to compute CSS filter style based on mode, intensity, and comparison state
  const getImageFilterStyle = () => {
    if (isComparingOriginal || activeFilterMode === 'normal') {
      return 'none';
    }

    const intensityFactor = filterIntensity / 100;

    switch (activeFilterMode) {
      case 'watercolor':
        // Soft painterly saturation boost, heightened contrast, paper tone
        return `contrast(${100 + 40 * intensityFactor}%) saturate(${100 + 70 * intensityFactor}%) brightness(${100 + 8 * intensityFactor}%) sepia(${15 * intensityFactor}%)`;

      case 'neon':
        // Cyberpunk electric glow, cyan/magenta hue shift, high contrast
        return `contrast(${100 + 65 * intensityFactor}%) saturate(${100 + 110 * intensityFactor}%) hue-rotate(${185 * intensityFactor}deg) brightness(${90 + 10 * intensityFactor}%)`;

      case 'blueprint':
        // Inverted white linework on deep cyan blue
        return `invert(${95 * intensityFactor}%) hue-rotate(185deg) contrast(${100 + 55 * intensityFactor}%) brightness(88%) saturate(${160 * intensityFactor}%)`;

      case 'archival':
        // 19th-century sepia tone with contrast and aged brightness
        return `sepia(${88 * intensityFactor}%) contrast(${100 + 25 * intensityFactor}%) brightness(95%) grayscale(${25 * intensityFactor}%)`;

      case 'synthwave':
        // 80s magenta-purple sunset wash
        return `contrast(${100 + 45 * intensityFactor}%) saturate(${100 + 95 * intensityFactor}%) hue-rotate(${275 * intensityFactor}deg) brightness(96%)`;

      default:
        return 'none';
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
      {/* Hidden SVG Filters for Authentic Watercolor Displacement */}
      <svg className="hidden">
        <defs>
          <filter id="watercolor-paper-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Top Viewfinder Toolbar */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-amber-400">
            <Scan className="w-4 h-4 animate-spin-slow" />
            <span className="font-bold tracking-wider">AR RETICLE HUD</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-400 font-mono text-[11px]">
            GPS: {recognition.coordinatesEstimate?.latitude.toFixed(4) || '48.8584'}°N,{' '}
            {recognition.coordinatesEstimate?.longitude.toFixed(4) || '2.2945'}°E
          </span>
        </div>

        {/* Action controls & AR Filter Toggle Button */}
        <div className="flex items-center gap-2">
          {/* Main Filter Toggle Trigger */}
          <button
            id="ar-filter-toggle-btn"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeFilterMode !== 'normal'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                : showFilterDrawer
                ? 'bg-slate-800 border-amber-400 text-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title="Toggle Stylized Artistic Filters (Watercolor, Cyber Neon, Blueprint, etc.)"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Lens: {currentPreset.shortLabel}</span>
          </button>

          {/* Quick Laser Toggle */}
          <button
            onClick={() => setShowLaser(!showLaser)}
            className={`p-1.5 rounded-lg border text-[11px] transition-colors ${
              showLaser
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle Scanning Laser"
          >
            Laser
          </button>

          {/* HUD Toggle */}
          <button
            onClick={() => setShowHUD(!showHUD)}
            className={`p-1.5 rounded-lg border text-[11px] transition-colors ${
              showHUD
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Toggle AR Overlay Elements"
          >
            HUD
          </button>

          {/* Share Tour Button */}
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors flex items-center gap-1"
              title="Share Landmark Tour & Card"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px] font-semibold">Share</span>
            </button>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Artistic Filter Selection Ribbon */}
      {showFilterDrawer && (
        <div className="bg-slate-900 border-b border-slate-800 p-3 sm:px-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-[11px] font-mono text-slate-400 uppercase mr-1 shrink-0 flex items-center gap-1">
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                Artistic Styles:
              </span>
              {FILTER_PRESETS.map((preset) => {
                const isSelected = activeFilterMode === preset.id;
                const IconComponent = preset.icon;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSetFilter(preset.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? preset.activeBorder
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{preset.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Controls: Intensity slider & Hold to Compare */}
            <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
              {activeFilterMode !== 'normal' && (
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-mono text-slate-400">Intensity:</span>
                  <input
                    type="range"
                    min="35"
                    max="100"
                    value={filterIntensity}
                    onChange={(e) => setFilterIntensity(parseInt(e.target.value))}
                    className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-[11px] font-mono text-amber-400 w-8">{filterIntensity}%</span>
                </div>
              )}

              {/* Hold to Compare Original */}
              {activeFilterMode !== 'normal' && (
                <button
                  onMouseDown={() => setIsComparingOriginal(true)}
                  onMouseUp={() => setIsComparingOriginal(false)}
                  onTouchStart={() => setIsComparingOriginal(true)}
                  onTouchEnd={() => setIsComparingOriginal(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-colors select-none"
                  title="Hold to temporarily view original photo"
                >
                  Hold to Compare
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main AR Stage Viewport */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative aspect-16/10 sm:aspect-16/9 w-full overflow-hidden select-none bg-black flex items-center justify-center cursor-crosshair"
        style={{ perspective: 1000 }}
      >
        {/* The Base Photo with 3D Parallax & Artistic CSS Filters */}
        <div
          className="relative w-full h-full transition-transform duration-150 ease-out"
          style={{
            transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg) scale(1.02)`,
          }}
        >
          <img
            src={imageSrc}
            alt={recognition.landmarkName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-all duration-300"
            style={{
              filter: getImageFilterStyle(),
            }}
          />

          {/* OVERLAY EFFECT 1: Watercolor Paper Texture & Stipple Wash */}
          {activeFilterMode === 'watercolor' && !isComparingOriginal && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-35"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,248,220,0.4) 0%, rgba(240,230,210,0.8) 100%),
                  radial-gradient(rgba(0,0,0,0.1) 15%, transparent 16%)`,
                backgroundSize: '100% 100%, 6px 6px',
              }}
            />
          )}

          {/* Watercolor Vignette Brush Border */}
          {activeFilterMode === 'watercolor' && !isComparingOriginal && (
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(139,94,60,0.35)]" />
          )}

          {/* OVERLAY EFFECT 2: Futuristic Cyber Neon Grid & Chromatic Scanlines */}
          {activeFilterMode === 'neon' && !isComparingOriginal && (
            <>
              {/* Luminous cyan/magenta cyber grid */}
              <div
                className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #d946ef 1px, transparent 1px)',
                  backgroundSize: '36px 36px',
                }}
              />
              {/* Cyber laser scanlines */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(6, 182, 212, 0.4) 0px, rgba(6, 182, 212, 0.4) 1px, transparent 1px, transparent 4px)',
                }}
              />
              {/* Electric corner glow */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(6,182,212,0.45)]" />
            </>
          )}

          {/* OVERLAY EFFECT 3: Architectural Blueprint Drafting Grid */}
          {activeFilterMode === 'blueprint' && !isComparingOriginal && (
            <>
              <div
                className="absolute inset-0 pointer-events-none opacity-35"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="absolute inset-0 pointer-events-none border-2 border-cyan-400/40 m-4 rounded-xl" />
            </>
          )}

          {/* OVERLAY EFFECT 4: Vintage Archival Sepia Film Grain & Vignette */}
          {activeFilterMode === 'archival' && !isComparingOriginal && (
            <>
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(40,20,0,0.85)]" />
              <div
                className="absolute inset-0 pointer-events-none opacity-15 mix-blend-overlay"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 1px, transparent 1px), radial-gradient(circle at 75% 60%, rgba(0,0,0,0.4) 1px, transparent 1px)',
                  backgroundSize: '8px 8px, 12px 12px',
                }}
              />
            </>
          )}

          {/* OVERLAY EFFECT 5: Retro Synthwave Sunset Perspective Grid */}
          {activeFilterMode === 'synthwave' && !isComparingOriginal && (
            <>
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-fuchsia-950/60 via-transparent to-purple-950/40" />
              <div
                className="absolute bottom-0 inset-x-0 h-1/3 pointer-events-none opacity-35"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #ec4899 1px, transparent 1px), linear-gradient(to bottom, #a855f7 1px, transparent 1px)',
                  backgroundSize: '32px 16px',
                  transform: 'perspective(200px) rotateX(45deg)',
                }}
              />
            </>
          )}

          {/* Sweeping Laser Scanner Bar */}
          {showLaser && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-laser-sweep pointer-events-none opacity-80" />
          )}

          {/* Interactive Floating AR Hotspot Pins */}
          {recognition.keyFocalPoints.map((point) => {
            const isSelected = point.id === activePointId;
            const badge = getTagBadge(point.arTagType);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={point.id}
                style={{
                  left: `${point.relativeX}%`,
                  top: `${point.relativeY}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
              >
                {/* Connecting glowing tether circle */}
                <div
                  onClick={() => onSelectPoint(isSelected ? null : point)}
                  className={`relative cursor-pointer transition-transform duration-200 ${
                    isSelected ? 'scale-125' : 'hover:scale-115'
                  }`}
                >
                  {/* Outer pulsating radar ring */}
                  <span
                    className={`absolute -inset-2 rounded-full opacity-75 animate-ping pointer-events-none ${
                      isSelected ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                  />

                  {/* Core Pin Button */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 backdrop-blur-md transition-colors ${
                      isSelected
                        ? 'bg-amber-500 border-white text-slate-950 ring-4 ring-amber-400/40'
                        : 'bg-slate-950/80 border-amber-400 text-amber-300 hover:bg-amber-400 hover:text-slate-950'
                    }`}
                  >
                    <BadgeIcon className="w-4 h-4" />
                  </div>

                  {/* Floating Mini AR Label */}
                  <div
                    className={`absolute left-10 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold tracking-wide shadow-md border backdrop-blur-md pointer-events-none transition-opacity ${
                      isSelected
                        ? 'bg-amber-500/90 text-slate-950 border-amber-300 opacity-100'
                        : 'bg-black/75 text-white border-white/20 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {point.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Temporary Compare Banner when holding button */}
        {isComparingOriginal && (
          <div className="absolute top-6 inset-x-0 mx-auto w-max z-30 bg-amber-500 text-slate-950 px-3.5 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
            VIEWING ORIGINAL CAPTURE
          </div>
        )}

        {/* AR HUD Visual Elements (Compass, Telemetry, Reticles) */}
        {showHUD && (
          <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-6">
            {/* Top HUD bar */}
            <div className="flex items-center justify-between">
              {/* Compass Bearing & Filter Status */}
              <div className="flex items-center gap-2">
                <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1.5 flex items-center gap-2 text-white font-mono text-xs">
                  <Compass className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span>BEARING 274° WNW</span>
                </div>

                {activeFilterMode !== 'normal' && (
                  <div className="bg-black/60 backdrop-blur-md border border-amber-400/40 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{currentPreset.shortLabel.toUpperCase()} LENS</span>
                  </div>
                )}
              </div>

              {/* Landmark Name Banner */}
              <div className="bg-black/70 backdrop-blur-md border border-amber-500/50 rounded-xl px-3.5 py-1.5 text-center">
                <div className="text-[10px] uppercase font-mono tracking-widest text-amber-400">
                  AR IDENTIFIED TARGET
                </div>
                <div className="text-sm font-bold text-white tracking-wide">
                  {recognition.landmarkName}
                </div>
              </div>

              {/* Optical Spec */}
              <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1.5 text-right font-mono text-[11px] text-slate-300 hidden sm:block">
                <div>FOV 84° • 24mm</div>
                <div className="text-amber-400">CONFIDENCE {recognition.confidenceScore}%</div>
              </div>
            </div>

            {/* Viewfinder Target Framing Brackets */}
            <div className="absolute inset-8 sm:inset-14 border border-white/10 rounded-2xl pointer-events-none flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400" />

              {/* Center crosshair */}
              <div className="w-12 h-12 border border-amber-400/40 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              </div>
            </div>

            {/* Bottom HUD bar */}
            <div className="flex items-end justify-between">
              {/* Architectural spec pill */}
              <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded-xl p-2.5 max-w-xs text-xs text-white">
                <div className="text-[10px] font-mono text-cyan-400 uppercase">
                  {recognition.architecturalStyle || 'Historical Architecture'}
                </div>
                <div className="text-slate-300 text-[11px] mt-0.5 line-clamp-1">
                  Built {recognition.yearCompletedOrPeriod} • {recognition.architectOrBuilder}
                </div>
              </div>

              {/* Hint badge */}
              <div className="bg-black/60 backdrop-blur-md border border-amber-500/30 rounded-lg px-2.5 py-1 text-[11px] font-mono text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>TAP PINS FOR AR INSIGHTS</span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Holographic Info Card when a pin is selected */}
        {activePoint && (
          <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:max-w-sm z-30 bg-slate-900/95 backdrop-blur-xl border-2 border-amber-500 rounded-2xl p-4 shadow-2xl text-white animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-full ${
                    getTagBadge(activePoint.arTagType).color
                  }`}
                >
                  {getTagBadge(activePoint.arTagType).label}
                </span>
                <h4 className="font-bold text-sm text-white">{activePoint.title}</h4>
              </div>
              <button
                onClick={() => onSelectPoint(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activePoint.briefFact}
            </p>
          </div>
        )}
      </div>

      {/* AR Focal Points Quick Navigation Bar */}
      <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase shrink-0 mr-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          Focal Points:
        </span>
        {recognition.keyFocalPoints.map((point) => {
          const isSelected = point.id === activePointId;
          return (
            <button
              key={point.id}
              onClick={() => onSelectPoint(isSelected ? null : point)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>{point.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
