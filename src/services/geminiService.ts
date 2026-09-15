import {
  AudioNarrationResult,
  LandmarkHistoryResult,
  LandmarkQuizResult,
  LandmarkRecognitionResult,
  LandmarkWeatherData,
} from '../types';

export async function recognizeLandmark(
  imageBase64: string,
  mimeType = 'image/jpeg',
): Promise<LandmarkRecognitionResult> {
  const response = await fetch('/api/recognize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Recognition failed with HTTP ${response.status}`);
  }

  return response.json();
}

export async function fetchLandmarkHistory(
  landmarkName: string,
  city: string,
  country: string,
  alternateNames: string[] = [],
): Promise<LandmarkHistoryResult> {
  const response = await fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ landmarkName, city, country, alternateNames }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `History search failed with HTTP ${response.status}`);
  }

  return response.json();
}

export async function generateAudioNarration(
  text: string,
  voiceName = 'Kore',
): Promise<AudioNarrationResult> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceName }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Audio narration generation failed with HTTP ${response.status}`);
  }

  return response.json();
}

export async function fetchLandmarkWeather(
  latitude?: number,
  longitude?: number,
  landmarkName?: string,
  city?: string,
  country?: string,
): Promise<LandmarkWeatherData> {
  const response = await fetch('/api/weather', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude, landmarkName, city, country }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Weather fetch failed with HTTP ${response.status}`);
  }

  return response.json();
}

export async function fetchLandmarkQuiz(
  landmarkName: string,
  city?: string,
  country?: string,
  historyContext?: any,
): Promise<LandmarkQuizResult> {
  const response = await fetch('/api/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ landmarkName, city, country, historyContext }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Quiz generation failed with HTTP ${response.status}`);
  }

  return response.json();
}
