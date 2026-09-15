export type ARTagType = 'architectural' | 'historical' | 'trivia' | 'viewpoint';

export interface KeyFocalPoint {
  id: string;
  title: string;
  relativeX: number; // 0 - 100%
  relativeY: number; // 0 - 100%
  briefFact: string;
  arTagType: ARTagType;
}

export interface NearbyPointOfInterest {
  id: string;
  name: string;
  category: 'monument' | 'museum' | 'park' | 'viewpoint' | 'historic' | 'transit';
  distanceMeters: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  shortDescription: string;
  walkingTimeMinutes?: number;
}

export interface LandmarkRecognitionResult {
  landmarkName: string;
  alternateNames: string[];
  city: string;
  country: string;
  coordinatesEstimate?: {
    latitude: number;
    longitude: number;
  };
  yearCompletedOrPeriod: string;
  architectOrBuilder: string;
  architecturalStyle: string;
  confidenceScore: number;
  shortVisualDescription: string;
  keyFocalPoints: KeyFocalPoint[];
  nearbyPOIs?: NearbyPointOfInterest[];
  modelUsed?: string;
}

export interface TimelineMilestone {
  era: string;
  yearOrPeriod: string;
  event: string;
  significance: string;
}

export interface SecretTrivia {
  title: string;
  description: string;
}

export interface SearchSource {
  title: string;
  url: string;
}

export interface LandmarkHistoryResult {
  originStory: string;
  historicalTimeline: TimelineMilestone[];
  hiddenSecrets: SecretTrivia[];
  visitorTips: string[];
  modernContext: string;
  narratedMonologue: string;
  searchSources: SearchSource[];
  modelUsed?: string;
}

export interface LandmarkWeatherData {
  temperatureC: number;
  temperatureF: number;
  apparentTemperatureC: number;
  apparentTemperatureF: number;
  condition: string;
  weatherCode: number;
  isDay: boolean;
  relativeHumidity: number;
  windSpeedKmh: number;
  windDirectionText: string;
  cloudCoverPercent: number;
  precipitationMm: number;
  uvIndex: number;
  sunriseTime?: string;
  sunsetTime?: string;
  visitingAdvisory: string;
  photoTip: string;
  lastUpdated: string;
  source: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  explanation: string;
  historicalContextSnippet?: string;
}

export interface LandmarkQuizResult {
  landmarkName: string;
  questions: QuizQuestion[];
  modelUsed?: string;
}

export interface AudioNarrationResult {
  audioBase64: string;
  mimeType: string;
  voiceName: string;
  audioDataUrl?: string;
}

export interface SavedTour {
  id: string;
  timestamp: number;
  image: string;
  recognition: LandmarkRecognitionResult;
  history: LandmarkHistoryResult;
  audioNarration?: AudioNarrationResult;
  visitCount?: number; // Total visits recorded (1 = initial discovery, 2+ = revisited)
  lastVisitedAt?: number;
  isCachedOffline?: boolean;
  cachedAt?: number;
}

export type ProcessingStep = 'idle' | 'recognizing' | 'fetching_history' | 'generating_audio' | 'completed' | 'error';

export interface SampleLandmark {
  id: string;
  name: string;
  city: string;
  country: string;
  thumbnail: string;
  presetRecognition: LandmarkRecognitionResult;
}
