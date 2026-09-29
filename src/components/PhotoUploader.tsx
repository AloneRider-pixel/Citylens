import React, { useRef, useState } from 'react';
import { Camera, Upload, Sparkles, MapPin, ArrowRight, Eye, BookOpen, HardDrive, WifiOff } from 'lucide-react';
import { SAMPLE_LANDMARKS } from '../data/sampleLandmarks';
import { SampleLandmark } from '../types';

interface PhotoUploaderProps {
  onPhotoSelected: (imageBase64: string, sampleData?: SampleLandmark) => void;
  onOpenCamera: () => void;
  onOpenPassport?: () => void;
  savedToursCount?: number;
  isOffline?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onPhotoSelected,
  onOpenCamera,
  onOpenPassport,
  savedToursCount = 0,
  isOffline = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        onPhotoSelected(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      {/* Intro hero banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          AR Urban Travel Companion
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
          Point, Recognize & Hear the City’s Story
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Snap a photo of any city landmark. Gemini Pro vision recognizes the monument, Google Search grounds its deep history, and an AR voice narrator brings the clip to life.
        </p>
      </div>

      {/* Offline Alert & Quick Passport Access Card */}
      {isOffline && savedToursCount > 0 && onOpenPassport && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Offline Cache Ready</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-700">
                  {savedToursCount} Tours Saved
                </span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                You can explore your previously visited landmarks, 360° VR environments, and voice clips without internet.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenPassport}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-amber-400 dark:text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open Offline Passport</span>
          </button>
        </div>
      )}

      {/* Main capture & upload card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {/* Option A: Take photo with camera */}
        <div
          onClick={onOpenCamera}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-slate-900 dark:border-amber-500/50 bg-slate-950 dark:bg-slate-900 p-6 text-white shadow-lg hover:shadow-xl dark:hover:border-amber-400 transition-all duration-200 flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              Snap with Camera
              <span className="text-[10px] bg-amber-400/20 text-amber-300 font-mono px-1.5 py-0.5 rounded uppercase font-semibold">
                Live AR
              </span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed mb-4">
              Open your phone or laptop camera to point at a landmark or city skyline right now.
            </p>
          </div>
          <div className="flex items-center text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
            <span>Launch City Viewfinder</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        {/* Option B: Upload photo file or drag-and-drop */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 transition-all duration-200 flex flex-col justify-between bg-white dark:bg-slate-900 ${
            isDragging
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30'
              : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-amber-500/50 hover:bg-slate-50/80 dark:hover:bg-slate-850'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          <div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-slate-800 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Upload City Photo
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Drop a photo from your camera roll, vacation album, or screenshots (JPG, PNG, WebP).
            </p>
          </div>
          <div className="flex items-center text-xs font-semibold text-slate-700 dark:text-amber-400">
            <span>Choose Image File</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </div>

      {/* Preset Landmark Sampler for immediate 1-click test */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Or Explore World Landmarks (1-Click Test)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a world monument to immediately test recognition, search grounding, and AR speech.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SAMPLE_LANDMARKS.map((landmark) => (
            <button
              key={landmark.id}
              onClick={() => onPhotoSelected(landmark.thumbnail, landmark)}
              className="group text-left bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-400 dark:hover:border-amber-500/60 hover:shadow-md transition-all cursor-pointer flex flex-col"
            >
              <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={landmark.thumbnail}
                  alt={landmark.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-amber-300">
                    <MapPin className="w-3 h-3" />
                    <span>{landmark.city}, {landmark.country}</span>
                  </div>
                </div>
              </div>
              <div className="p-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {landmark.name}
                </span>
                <span className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
