import React, { useMemo } from 'react';
import {
  X,
  BookOpen,
  MapPin,
  Calendar,
  Trash2,
  ArrowRight,
  Award,
  Share2,
  RotateCcw,
  Plus,
  Compass,
  HardDrive,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { SavedTour } from '../types';

interface TravelPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTours: SavedTour[];
  onSelectTour: (tour: SavedTour) => void;
  onDeleteTour: (id: string) => void;
  onClearAll: () => void;
  onShareTour?: (tour: SavedTour) => void;
  onIncrementVisit?: (id: string) => void;
}

export const TravelPassportModal: React.FC<TravelPassportModalProps> = ({
  isOpen,
  onClose,
  savedTours,
  onSelectTour,
  onDeleteTour,
  onClearAll,
  onShareTour,
  onIncrementVisit,
}) => {
  if (!isOpen) return null;

  // Calculate stats
  const { uniqueCities, uniqueCountries, totalVisits, totalRevisits } = useMemo(() => {
    let cities = new Set<string>();
    let countries = new Set<string>();
    let visits = 0;
    let revisits = 0;
    for (const t of savedTours) {
      cities.add(t.recognition.city);
      countries.add(t.recognition.country);
      visits += (t.visitCount || 1);
      revisits += Math.max(0, (t.visitCount || 1) - 1);
    }
    return {
      uniqueCities: cities.size,
      uniqueCountries: countries.size,
      totalVisits: visits,
      totalRevisits: revisits,
    };
  }, [savedTours]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] transition-colors">
        {/* Header bar */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-900 dark:bg-slate-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Traveler's Passport & Field Journal</h3>
              <p className="text-xs text-slate-400">Your city expedition history & recorded AR tours</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats strip with Revisit Tracking */}
        <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800 bg-amber-50/60 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-center p-3">
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{savedTours.length}</div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Landmarks</div>
          </div>
          <div>
            <div className="text-lg font-black text-amber-700 dark:text-amber-400">{totalRevisits}</div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Revisits</div>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{uniqueCities}</div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Cities</div>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{uniqueCountries}</div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Countries</div>
          </div>
        </div>

        {/* List of saved tours */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {savedTours.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Award className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">Passport is Empty</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                Snap or upload city photos to collect landmark stamps and record narrated AR tours.
              </p>
            </div>
          ) : (
            savedTours.map((tour) => {
              const visitCount = tour.visitCount || 1;
              const revisitCount = Math.max(0, visitCount - 1);

              return (
                <div
                  key={tour.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-xs transition-all bg-white dark:bg-slate-900 gap-3"
                >
                  <div
                    onClick={() => {
                      onSelectTour(tour);
                      onClose();
                    }}
                    className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0"
                  >
                    <img
                      src={tour.image}
                      alt={tour.recognition.landmarkName}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0 shadow-2xs"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {tour.recognition.landmarkName}
                        </h4>

                        {/* Revisit Counter Badge */}
                        {revisitCount > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs font-mono shrink-0"
                            title={`Visited ${visitCount} times total (${revisitCount} revisits)`}
                          >
                            <RotateCcw className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400 shrink-0" />
                            <span>Revisited {revisitCount}x</span>
                            <span className="text-amber-700/70 dark:text-amber-400/70 font-normal">({visitCount} total)</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0"
                            title="First recorded exploration"
                          >
                            <Compass className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>1st Visit</span>
                          </span>
                        )}

                        {/* Offline Ready IndexedDB Badge */}
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0"
                          title="Tour history, timeline, secrets, and focal points stored in IndexedDB for offline access"
                        >
                          <HardDrive className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Offline Ready</span>
                        </span>

                        {/* Cached Audio Narration Badge */}
                        {(tour.audioNarration?.audioBase64 || tour.audioNarration?.audioDataUrl) && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0"
                            title="Cached Voice Narration Audio available offline"
                          >
                            <Volume2 className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                            <span>Audio Cached</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                          {tour.recognition.city}, {tour.recognition.country}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                          <Calendar className="w-3 h-3 shrink-0" />
                          {new Date(tour.timestamp).toLocaleDateString()}
                        </span>
                        {tour.lastVisitedAt && tour.lastVisitedAt !== tour.timestamp && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                              Last visited {new Date(tour.lastVisitedAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* Log Revisit Counter Button */}
                    {onIncrementVisit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onIncrementVisit(tour.id);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/70 hover:text-amber-900 dark:hover:text-amber-300 hover:border-amber-300 dark:hover:border-amber-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Log another return visit to this landmark"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs">Log Revisit</span>
                      </button>
                    )}

                    {onShareTour && (
                      <button
                        onClick={() => onShareTour(tour)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Share this tour"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onSelectTour(tour);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Launch AR</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteTour(tour.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      title="Remove from passport"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {savedTours.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>IndexedDB & Service Worker Cache Active — View all tours and listen to audio offline</span>
            </span>
            <button
              onClick={onClearAll}
              className="text-rose-600 dark:text-rose-400 hover:underline font-medium cursor-pointer"
            >
              Clear Journal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
