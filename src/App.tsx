/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { AlertTriangle, RefreshCw, Sparkles, MapPin, WifiOff, HardDrive } from 'lucide-react';
import { Header } from './components/Header';
import { PhotoUploader } from './components/PhotoUploader';
import { ScanningOverlay } from './components/ScanningOverlay';
import { ARViewfinder, ARFilterMode } from './components/ARViewfinder';
import { NarratedClipPlayer } from './components/NarratedClipPlayer';
import { LandmarkHistoryView } from './components/LandmarkHistoryView';
import { LandmarkMapView } from './components/LandmarkMapView';
import { LandmarkChallengeQuiz } from './components/LandmarkChallengeQuiz';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { TravelPassportModal } from './components/TravelPassportModal';
import { ShareTourModal } from './components/ShareTourModal';
import { SAMPLE_LANDMARKS } from './data/sampleLandmarks';
import { tourCacheDB } from './services/tourCacheDB';
import { isOnline, subscribeToNetworkChanges } from './serviceWorkerRegistration';
import {
  recognizeLandmark,
  fetchLandmarkHistory,
  generateAudioNarration,
} from './services/geminiService';
import {
  AudioNarrationResult,
  KeyFocalPoint,
  LandmarkHistoryResult,
  LandmarkRecognitionResult,
  ProcessingStep,
  SampleLandmark,
  SavedTour,
} from './types';

const LOCAL_STORAGE_KEY = 'citylens_ar_saved_tours';

export default function App() {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<LandmarkRecognitionResult | null>(null);
  const [history, setHistory] = useState<LandmarkHistoryResult | null>(null);
  const [audioNarration, setAudioNarration] = useState<AudioNarrationResult | null>(null);
  const [activePointId, setActivePointId] = useState<string | null>(null);

  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [isRegeneratingAudio, setIsRegeneratingAudio] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [savedTours, setSavedTours] = useState<SavedTour[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(() => !isOnline());

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<ARFilterMode>('normal');
  const [tourToShare, setTourToShare] = useState<{
    image: string;
    recognition: LandmarkRecognitionResult;
    history: LandmarkHistoryResult;
  } | null>(null);

  // Monitor online / offline network connectivity
  useEffect(() => {
    setIsOffline(!isOnline());
    const unsubscribe = subscribeToNetworkChanges((online) => {
      setIsOffline(!online);
    });
    return unsubscribe;
  }, []);

  // Load saved tours and cached narration audio from IndexedDB on mount
  useEffect(() => {
    let isMounted = true;
    const loadCachedTours = async () => {
      try {
        const cached = await tourCacheDB.getAllTours();
        if (isMounted && cached && cached.length > 0) {
          setSavedTours(cached);
        }
      } catch (e) {
        console.warn('Failed to load saved tours from IndexedDB, using localStorage fallback', e);
        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (isMounted && stored) {
            setSavedTours(JSON.parse(stored));
          }
        } catch {}
      }
    };
    loadCachedTours();
    return () => {
      isMounted = false;
    };
  }, []);

  // Check URL query parameters for shared links (e.g. ?landmark=Eiffel+Tower)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const landmarkQuery = searchParams.get('landmark');
      if (landmarkQuery) {
        const found = SAMPLE_LANDMARKS.find(
          (s) =>
            s.name.toLowerCase() === landmarkQuery.toLowerCase() ||
            s.presetRecognition.landmarkName.toLowerCase() === landmarkQuery.toLowerCase()
        );
        if (found) {
          handlePhotoSelected(found.thumbnail, found);
        }
      }
    } catch (e) {
      console.warn('Failed to parse landmark query parameter', e);
    }
  }, []);

  // Save tours to IndexedDB cache with localStorage backup
  const persistTours = async (tours: SavedTour[]) => {
    setSavedTours(tours);
    try {
      // Save full tour and audio to IndexedDB
      if (tours.length > 0) {
        await tourCacheDB.saveTour(tours[0]);
      }
    } catch (e) {
      console.warn('Failed to persist tour to IndexedDB:', e);
    }
  };

  /**
   * Main pipeline trigger when photo is captured or selected
   */
  const handlePhotoSelected = async (imageBase64: string, sampleData?: SampleLandmark) => {
    setActiveImage(imageBase64);
    setErrorMessage(null);
    setRecognition(null);
    setHistory(null);
    setAudioNarration(null);
    setActivePointId(null);

    try {
      let recResult: LandmarkRecognitionResult;

      if (sampleData) {
        // Fast-path for preset world landmarks with rich curated geometry
        recResult = sampleData.presetRecognition;
        setRecognition(recResult);
        setProcessingStep('fetching_history');
      } else {
        // Run full Gemini Pro vision recognition
        setProcessingStep('recognizing');
        recResult = await recognizeLandmark(imageBase64);
        setRecognition(recResult);
        setProcessingStep('fetching_history');
      }

      // Step 2: Fetch grounded history via Gemini 3.5 Flash with Google Search
      const histResult = await fetchLandmarkHistory(
        recResult.landmarkName,
        recResult.city,
        recResult.country,
        recResult.alternateNames
      );
      setHistory(histResult);

      // Step 3: Synthesize AR speech audio narration via Gemini 3.1 Flash TTS
      setProcessingStep('generating_audio');
      const audioResult = await generateAudioNarration(
        histResult.narratedMonologue,
        selectedVoice
      );
      setAudioNarration(audioResult);

      setProcessingStep('completed');

      // Add or update entry in Travel Passport with Revisit tracking
      const landmarkKey = recResult.landmarkName.toLowerCase().trim();
      const existingTourIndex = savedTours.findIndex(
        (t) => t.recognition.landmarkName.toLowerCase().trim() === landmarkKey
      );

      let updatedTours: SavedTour[];
      if (existingTourIndex >= 0) {
        const existing = savedTours[existingTourIndex];
        const newVisitCount = (existing.visitCount || 1) + 1;
        const updatedTour: SavedTour = {
          ...existing,
          lastVisitedAt: Date.now(),
          visitCount: newVisitCount,
          image: imageBase64, // Keep most recent photo capture
          recognition: recResult,
          history: histResult,
          audioNarration: audioResult,
        };
        // Place updated tour at top of passport
        updatedTours = [
          updatedTour,
          ...savedTours.filter((_, idx) => idx !== existingTourIndex),
        ];
      } else {
        const newTour: SavedTour = {
          id: `tour-${Date.now()}`,
          timestamp: Date.now(),
          lastVisitedAt: Date.now(),
          visitCount: 1,
          image: imageBase64,
          recognition: recResult,
          history: histResult,
          audioNarration: audioResult,
        };
        updatedTours = [newTour, ...savedTours];
      }

      persistTours(updatedTours);

      // Celebrate discovery with confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (err: any) {
      console.error('Pipeline error:', err);
      setErrorMessage(err.message || 'An error occurred during analysis');
      setProcessingStep('error');
    }
  };

  /**
   * Regenerate audio narration with a newly selected voice
   */
  const handleRegenerateVoice = async (newVoice: string) => {
    if (!history) return;
    setSelectedVoice(newVoice);
    setIsRegeneratingAudio(true);

    try {
      const result = await generateAudioNarration(history.narratedMonologue, newVoice);
      setAudioNarration(result);
    } catch (err: any) {
      console.error('Failed to regenerate audio:', err);
      alert('Could not generate speech with the selected voice.');
    } finally {
      setIsRegeneratingAudio(false);
    }
  };

  const handleIncrementVisit = (id: string) => {
    const updated = savedTours.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          visitCount: (t.visitCount || 1) + 1,
          lastVisitedAt: Date.now(),
        };
      }
      return t;
    });
    persistTours(updated);
  };

  const handleSelectTourFromPassport = (tour: SavedTour) => {
    setActiveImage(tour.image);
    setRecognition(tour.recognition);
    setHistory(tour.history);
    setAudioNarration(tour.audioNarration || null);
    setActivePointId(null);
    setProcessingStep('completed');
    // Increment revisit count when re-launching tour from passport
    handleIncrementVisit(tour.id);
  };

  const handleDeleteTour = async (id: string) => {
    const filtered = savedTours.filter((t) => t.id !== id);
    setSavedTours(filtered);
    try {
      await tourCacheDB.deleteTour(id);
    } catch (e) {
      console.warn('Failed to delete tour from cache:', e);
    }
  };

  const handleClearAllTours = async () => {
    if (confirm('Clear all entries from your Traveler Passport?')) {
      setSavedTours([]);
      try {
        await tourCacheDB.clearAll();
      } catch (e) {
        console.warn('Failed to clear cache:', e);
      }
    }
  };

  const handleResetToNewScan = () => {
    setActiveImage(null);
    setRecognition(null);
    setHistory(null);
    setAudioNarration(null);
    setActivePointId(null);
    setProcessingStep('idle');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* App Header */}
      <Header
        selectedVoice={selectedVoice}
        onSelectVoice={setSelectedVoice}
        savedToursCount={savedTours.length}
        onOpenPassport={() => setIsPassportOpen(true)}
        onNewScan={handleResetToNewScan}
        hasActiveLandmark={Boolean(activeImage && processingStep === 'completed')}
        isOffline={isOffline}
        onOpenShare={() => {
          setTourToShare(null);
          setIsShareModalOpen(true);
        }}
      />

      {/* Offline Status Alert Banner */}
      {isOffline && (
        <div className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/20 dark:border-amber-800/50 px-4 py-2.5 text-center text-xs text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
          <span className="font-bold">Offline Field Mode Active:</span>
          <span>
            You are exploring offline. Your saved landmarks, historical timelines, and voice narrations are loaded from IndexedDB.
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* State 1: Photo selection & Camera launch */}
        {processingStep === 'idle' && (
          <PhotoUploader
            onPhotoSelected={handlePhotoSelected}
            onOpenCamera={() => setIsCameraOpen(true)}
            onOpenPassport={() => setIsPassportOpen(true)}
            savedToursCount={savedTours.length}
            isOffline={isOffline}
          />
        )}

        {/* State 2: Processing Overlay */}
        {(processingStep === 'recognizing' ||
          processingStep === 'fetching_history' ||
          processingStep === 'generating_audio') &&
          activeImage && (
            <ScanningOverlay
              currentStep={processingStep}
              imagePreview={activeImage}
            />
          )}

        {/* State 3: Error Banner */}
        {processingStep === 'error' && (
          <div className="max-w-2xl mx-auto mt-12 p-6 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Analysis Notice</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
              {errorMessage || 'Unable to complete landmark recognition and search grounding.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleResetToNewScan}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
              >
                Scan Another Landmark
              </button>
              {activeImage && (
                <button
                  onClick={() => handlePhotoSelected(activeImage)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Scan</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* State 4: Completed Interactive AR Experience */}
        {processingStep === 'completed' && activeImage && recognition && history && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
            {/* Top Interactive AR Viewfinder */}
            <ARViewfinder
              imageSrc={activeImage}
              recognition={recognition}
              activePointId={activePointId}
              onSelectPoint={(point) => setActivePointId(point ? point.id : null)}
              currentFilter={currentFilter}
              onFilterChange={setCurrentFilter}
              onOpenShare={() => {
                setTourToShare(null);
                setIsShareModalOpen(true);
              }}
            />

            {/* Middle Narrated Clip Audio Player */}
            <NarratedClipPlayer
              narrationText={history.narratedMonologue}
              audioResult={audioNarration}
              landmarkName={recognition.landmarkName}
              selectedVoice={selectedVoice}
              onRegenerateVoice={handleRegenerateVoice}
              isRegeneratingAudio={isRegeneratingAudio}
            />

            {/* Grounded History, Timeline, Secrets & Sources */}
            <LandmarkHistoryView
              recognition={recognition}
              history={history}
            />

            {/* Geographic Map View & Nearby Points of Interest */}
            <LandmarkMapView recognition={recognition} />

            {/* Landmark Challenge Trivia Quiz */}
            <LandmarkChallengeQuiz
              recognition={recognition}
              history={history}
            />
          </div>
        )}
      </main>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => handlePhotoSelected(dataUrl)}
      />

      {/* Traveler Passport & Field Journal Modal */}
      <TravelPassportModal
        isOpen={isPassportOpen}
        onClose={() => setIsPassportOpen(false)}
        savedTours={savedTours}
        onSelectTour={handleSelectTourFromPassport}
        onDeleteTour={handleDeleteTour}
        onClearAll={handleClearAllTours}
        onIncrementVisit={handleIncrementVisit}
        onShareTour={(tour) => {
          setTourToShare(tour);
          setIsShareModalOpen(true);
        }}
      />

      {/* Social Media Card & Share Tour Modal */}
      {((tourToShare && tourToShare.recognition && tourToShare.history) ||
        (recognition && history && activeImage)) && (
        <ShareTourModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setTourToShare(null);
          }}
          imageSrc={tourToShare ? tourToShare.image : activeImage!}
          recognition={tourToShare ? tourToShare.recognition : recognition!}
          history={tourToShare ? tourToShare.history : history!}
          lensFilter={currentFilter !== 'normal' ? currentFilter : undefined}
        />
      )}
    </div>
  );
}
