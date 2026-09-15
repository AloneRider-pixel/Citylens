import { SavedTour, AudioNarrationResult } from '../types';

const DB_NAME = 'CityLensOfflineDB';
const DB_VERSION = 1;
const STORE_TOURS = 'saved_tours';
const STORE_AUDIO = 'cached_audio';
const LOCAL_STORAGE_BACKUP_KEY = 'citylens_ar_saved_tours';

interface CachedAudioRecord {
  id: string; // tour id
  audioBase64: string;
  audioDataUrl?: string;
  mimeType: string;
  voiceName: string;
  cachedAt: number;
}

class TourCacheDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private isIDBAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  /**
   * Initialize or connect to the IndexedDB database instance
   */
  public async getDB(): Promise<IDBDatabase | null> {
    if (!this.isIDBAvailable()) {
      return null;
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        try {
          const request = window.indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // 1. Saved Tours Store (contains recognition, history, coordinates, timestamps)
            if (!db.objectStoreNames.contains(STORE_TOURS)) {
              const tourStore = db.createObjectStore(STORE_TOURS, { keyPath: 'id' });
              tourStore.createIndex('timestamp', 'timestamp', { unique: false });
              tourStore.createIndex('landmarkName', 'recognition.landmarkName', { unique: false });
              tourStore.createIndex('city', 'recognition.city', { unique: false });
            }

            // 2. Dedicated Audio Cache Store (stores WAV buffers/base64 safely without storage limits)
            if (!db.objectStoreNames.contains(STORE_AUDIO)) {
              db.createObjectStore(STORE_AUDIO, { keyPath: 'id' });
            }
          };

          request.onsuccess = () => {
            resolve(request.result);
          };

          request.onerror = () => {
            console.error('IndexedDB open error:', request.error);
            reject(request.error);
          };
        } catch (e) {
          console.warn('IndexedDB initialization failed:', e);
          reject(e);
        }
      });
    }

    return this.dbPromise;
  }

  /**
   * Save or update a tour in IndexedDB and cache its narration audio
   */
  public async saveTour(tour: SavedTour): Promise<void> {
    const db = await this.getDB();

    // Prepare tour record with offline cache metadata
    const tourToStore: SavedTour = {
      ...tour,
      isCachedOffline: true,
      cachedAt: tour.cachedAt || Date.now(),
    };

    if (!db) {
      // Fallback to localStorage if IDB is not supported
      this.saveToLocalStorageFallback(tourToStore);
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction([STORE_TOURS, STORE_AUDIO], 'readwrite');
        const tourStore = tx.objectStore(STORE_TOURS);
        const audioStore = tx.objectStore(STORE_AUDIO);

        // Put tour object
        tourStore.put(tourToStore);

        // If tour has audio narration, cache it in dedicated audio store for fast retrieval
        if (tourToStore.audioNarration) {
          const audioRecord: CachedAudioRecord = {
            id: tourToStore.id,
            audioBase64: tourToStore.audioNarration.audioBase64,
            audioDataUrl:
              tourToStore.audioNarration.audioDataUrl ||
              `data:${tourToStore.audioNarration.mimeType || 'audio/wav'};base64,${tourToStore.audioNarration.audioBase64}`,
            mimeType: tourToStore.audioNarration.mimeType || 'audio/wav',
            voiceName: tourToStore.audioNarration.voiceName,
            cachedAt: Date.now(),
          };
          audioStore.put(audioRecord);
        }

        tx.oncomplete = () => {
          // Also sync a lightweight summary to localStorage for fallback resilience
          this.syncLightweightLocalStorage();
          resolve();
        };

        tx.onerror = () => {
          console.error('Failed to save tour to IndexedDB:', tx.error);
          reject(tx.error);
        };
      } catch (err) {
        console.warn('Transaction error during tour save:', err);
        this.saveToLocalStorageFallback(tourToStore);
        resolve();
      }
    });
  }

  /**
   * Retrieve all saved tours with cached history and audio from IndexedDB
   */
  public async getAllTours(): Promise<SavedTour[]> {
    const db = await this.getDB();
    if (!db) {
      return this.loadFromLocalStorageFallback();
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_TOURS, STORE_AUDIO], 'readonly');
        const tourStore = tx.objectStore(STORE_TOURS);
        const audioStore = tx.objectStore(STORE_AUDIO);

        const tourRequest = tourStore.getAll();
        const audioRequest = audioStore.getAll();

        tx.oncomplete = () => {
          const tours: SavedTour[] = tourRequest.result || [];
          const audios: CachedAudioRecord[] = audioRequest.result || [];

          // Map audios by tour ID
          const audioMap = new Map<string, CachedAudioRecord>();
          for (const a of audios) {
            audioMap.set(a.id, a);
          }

          // Merge audio into tours if needed
          const enrichedTours = tours.map((tour) => {
            const cachedAudio = audioMap.get(tour.id);
            let finalAudio = tour.audioNarration;

            if (cachedAudio && (!finalAudio || !finalAudio.audioDataUrl)) {
              finalAudio = {
                audioBase64: cachedAudio.audioBase64,
                audioDataUrl: cachedAudio.audioDataUrl,
                mimeType: cachedAudio.mimeType,
                voiceName: cachedAudio.voiceName,
              };
            }

            return {
              ...tour,
              audioNarration: finalAudio,
              isCachedOffline: true,
            };
          });

          // Sort by last visited or timestamp descending
          enrichedTours.sort(
            (a, b) => (b.lastVisitedAt || b.timestamp) - (a.lastVisitedAt || a.timestamp)
          );

          // If IDB was empty, try migrating existing localStorage tours
          if (enrichedTours.length === 0) {
            const fallbackTours = this.loadFromLocalStorageFallback();
            if (fallbackTours.length > 0) {
              // Migrate all to IDB in background
              fallbackTours.forEach((t) => this.saveTour(t));
              resolve(fallbackTours);
              return;
            }
          }

          resolve(enrichedTours);
        };

        tx.onerror = () => {
          console.warn('Error reading from IndexedDB, falling back to localStorage:', tx.error);
          resolve(this.loadFromLocalStorageFallback());
        };
      } catch (err) {
        console.warn('Exception during IDB read:', err);
        resolve(this.loadFromLocalStorageFallback());
      }
    });
  }

  /**
   * Delete a tour and its cached audio from IndexedDB
   */
  public async deleteTour(id: string): Promise<void> {
    const db = await this.getDB();
    if (!db) {
      const current = this.loadFromLocalStorageFallback().filter((t) => t.id !== id);
      this.writeLocalStorage(current);
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction([STORE_TOURS, STORE_AUDIO], 'readwrite');
        tx.objectStore(STORE_TOURS).delete(id);
        tx.objectStore(STORE_AUDIO).delete(id);

        tx.oncomplete = () => {
          this.syncLightweightLocalStorage();
          resolve();
        };

        tx.onerror = () => {
          reject(tx.error);
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Clear all cached tours and audio narrations
   */
  public async clearAll(): Promise<void> {
    const db = await this.getDB();
    if (!db) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_BACKUP_KEY);
      }
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction([STORE_TOURS, STORE_AUDIO], 'readwrite');
        tx.objectStore(STORE_TOURS).clear();
        tx.objectStore(STORE_AUDIO).clear();

        tx.oncomplete = () => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(LOCAL_STORAGE_BACKUP_KEY);
          }
          resolve();
        };

        tx.onerror = () => {
          reject(tx.error);
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Calculate storage diagnostics and offline readiness metrics
   */
  public async getStorageMetrics(): Promise<{
    tourCount: number;
    audioCount: number;
    approxSizeMB: number;
    isOfflineReady: boolean;
  }> {
    const tours = await this.getAllTours();
    let totalChars = 0;
    let audioCount = 0;

    for (const t of tours) {
      totalChars += JSON.stringify(t.history || {}).length;
      totalChars += JSON.stringify(t.recognition || {}).length;
      totalChars += (t.image || '').length;
      if (t.audioNarration?.audioBase64) {
        totalChars += t.audioNarration.audioBase64.length;
        audioCount++;
      }
    }

    // 1 char ~= 1-2 bytes in UTF-16
    const approxSizeMB = Math.round((totalChars / (1024 * 1024)) * 10) / 10;

    return {
      tourCount: tours.length,
      audioCount,
      approxSizeMB,
      isOfflineReady: tours.length > 0,
    };
  }

  // --- Fallback & Sync Helpers ---

  private loadFromLocalStorageFallback(): SavedTour[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private writeLocalStorage(tours: SavedTour[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(tours));
    } catch (e) {
      console.warn('Failed to write localStorage backup:', e);
    }
  }

  private saveToLocalStorageFallback(tour: SavedTour): void {
    const current = this.loadFromLocalStorageFallback();
    const filtered = current.filter((t) => t.id !== tour.id);
    this.writeLocalStorage([tour, ...filtered]);
  }

  private async syncLightweightLocalStorage(): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db) return;

      const tx = db.transaction(STORE_TOURS, 'readonly');
      const store = tx.objectStore(STORE_TOURS);
      const req = store.getAll();

      req.onsuccess = () => {
        const allTours = req.result as SavedTour[];
        // To prevent localStorage quota exceeded errors with heavy audio,
        // create a lightweight copy for localStorage while full data stays in IndexedDB
        const lightCopy = allTours.map((t) => ({
          ...t,
          audioNarration: t.audioNarration
            ? {
                voiceName: t.audioNarration.voiceName,
                mimeType: t.audioNarration.mimeType,
                audioBase64: '', // full audio lives in IndexedDB
              }
            : undefined,
        }));
        this.writeLocalStorage(lightCopy);
      };
    } catch (e) {
      console.warn('Failed to sync lightweight localStorage:', e);
    }
  }
}

export const tourCacheDB = new TourCacheDatabase();
