import type { LandmarkRecognitionResult } from './src/types';

const TAG_TYPES = new Set(['architectural', 'historical', 'trivia', 'viewpoint']);
const POI_CATEGORIES = new Set(['monument', 'museum', 'park', 'viewpoint', 'historic', 'transit']);

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} must be a non-empty string`);
}

function assertFiniteNumber(value: unknown, label: string, min?: number, max?: number): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be finite`);
  if (min !== undefined && value < min) throw new Error(`${label} must be >= ${min}`);
  if (max !== undefined && value > max) throw new Error(`${label} must be <= ${max}`);
}

export function validateLandmarkRecognition(value: unknown): LandmarkRecognitionResult {
  assertObject(value, 'recognition');
  assertString(value.landmarkName, 'landmarkName');
  assertString(value.city, 'city');
  assertString(value.country, 'country');
  assertString(value.yearCompletedOrPeriod, 'yearCompletedOrPeriod');
  assertString(value.architectOrBuilder, 'architectOrBuilder');
  assertString(value.architecturalStyle, 'architecturalStyle');
  assertString(value.shortVisualDescription, 'shortVisualDescription');
  assertFiniteNumber(value.confidenceScore, 'confidenceScore', 0, 100);

  if (!Array.isArray(value.alternateNames)) throw new Error('alternateNames must be an array');
  if (!Array.isArray(value.keyFocalPoints) || value.keyFocalPoints.length < 2 || value.keyFocalPoints.length > 4) {
    throw new Error('keyFocalPoints must contain 2 to 4 items');
  }
  for (const [index, pointValue] of value.keyFocalPoints.entries()) {
    assertObject(pointValue, `keyFocalPoints[${index}]`);
    assertString(pointValue.id, `keyFocalPoints[${index}].id`);
    assertString(pointValue.title, `keyFocalPoints[${index}].title`);
    assertString(pointValue.briefFact, `keyFocalPoints[${index}].briefFact`);
    assertFiniteNumber(pointValue.relativeX, `keyFocalPoints[${index}].relativeX`, 10, 90);
    assertFiniteNumber(pointValue.relativeY, `keyFocalPoints[${index}].relativeY`, 10, 90);
    if (typeof pointValue.arTagType !== 'string' || !TAG_TYPES.has(pointValue.arTagType)) throw new Error(`Invalid arTagType at index ${index}`);
  }

  if (value.coordinatesEstimate !== undefined) {
    assertObject(value.coordinatesEstimate, 'coordinatesEstimate');
    assertFiniteNumber(value.coordinatesEstimate.latitude, 'coordinatesEstimate.latitude', -90, 90);
    assertFiniteNumber(value.coordinatesEstimate.longitude, 'coordinatesEstimate.longitude', -180, 180);
  }

  if (!Array.isArray(value.nearbyPOIs) || value.nearbyPOIs.length < 3 || value.nearbyPOIs.length > 5) {
    throw new Error('nearbyPOIs must contain 3 to 5 items for a verified recognition response');
  }
  for (const [index, poiValue] of value.nearbyPOIs.entries()) {
    assertObject(poiValue, `nearbyPOIs[${index}]`);
    assertString(poiValue.id, `nearbyPOIs[${index}].id`);
    assertString(poiValue.name, `nearbyPOIs[${index}].name`);
    assertString(poiValue.shortDescription, `nearbyPOIs[${index}].shortDescription`);
    assertFiniteNumber(poiValue.distanceMeters, `nearbyPOIs[${index}].distanceMeters`, 0);
    if (typeof poiValue.category !== 'string' || !POI_CATEGORIES.has(poiValue.category)) throw new Error(`Invalid POI category at index ${index}`);
    assertObject(poiValue.coordinates, `nearbyPOIs[${index}].coordinates`);
    assertFiniteNumber(poiValue.coordinates.latitude, `nearbyPOIs[${index}].coordinates.latitude`, -90, 90);
    assertFiniteNumber(poiValue.coordinates.longitude, `nearbyPOIs[${index}].coordinates.longitude`, -180, 180);
    if (poiValue.walkingTimeMinutes !== undefined) assertFiniteNumber(poiValue.walkingTimeMinutes, `nearbyPOIs[${index}].walkingTimeMinutes`, 0);
  }

  return value as unknown as LandmarkRecognitionResult;
}