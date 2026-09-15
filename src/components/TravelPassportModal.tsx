import React from 'react';
import { X, BookOpen, MapPin, Calendar, Trash2, ArrowRight, Award, Share2 } from 'lucide-react';
import { SavedTour } from '../types';

interface TravelPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTours: SavedTour[];
  onSelectTour: (tour: SavedTour) => void;
  onDeleteTour: (id: string) => void;
  onClearAll: () => void;
  onShareTour?: (tour: SavedTour) => void;
}

export const TravelPassportModal: React.FC<TravelPassportModalProps> = ({
  isOpen,
  onClose,
  savedTours,
  onSelectTour,
  onDeleteTour,
  onClearAll,
  onShareTour,
}) => {
  if (!isOpen) return null;

  // Calculate stats
  const uniqueCities = new Set(savedTours.map((t) => t.recognition.city)).size;
  const uniqueCountries = new Set(savedTours.map((t) => t.recognition.country)).size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header bar */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 bg-amber-50/60 border-b border-slate-200 text-center p-3">
          <div>
            <div className="text-lg font-black text-slate-900">{savedTours.length}</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Landmarks</div>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">{uniqueCities}</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Cities</div>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">{uniqueCountries}</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Countries</div>
          </div>
        </div>

        {/* List of saved tours */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {savedTours.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Award className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-sm text-slate-700">Passport is Empty</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Snap or upload city photos to collect landmark stamps and record narrated AR tours.
              </p>
            </div>
          ) : (
            savedTours.map((tour) => (
              <div
                key={tour.id}
                className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-xs transition-all bg-white"
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
                    className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-amber-600 transition-colors">
                      {tour.recognition.landmarkName}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-500" />
                        {tour.recognition.city}, {tour.recognition.country}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(tour.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {onShareTour && (
                    <button
                      onClick={() => onShareTour(tour)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
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
                    className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold text-xs flex items-center gap-1 transition-colors"
                  >
                    <span>Launch AR</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDeleteTour(tour.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove from passport"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {savedTours.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>Stored securely in your local browser profile</span>
            <button
              onClick={onClearAll}
              className="text-rose-600 hover:underline font-medium"
            >
              Clear Journal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
