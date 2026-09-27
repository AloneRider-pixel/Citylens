import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLandmarkRecognition } from './server-validation';

const valid = {
  landmarkName: 'Test Landmark',
  alternateNames: [],
  city: 'Test City',
  country: 'Test Country',
  yearCompletedOrPeriod: '2020',
  architectOrBuilder: 'Test Builder',
  architecturalStyle: 'Modern',
  confidenceScore: 82,
  shortVisualDescription: 'A landmark used for validation.',
  keyFocalPoints: [
    { id: 'p1', title: 'Point One', relativeX: 50, relativeY: 40, briefFact: 'Fact one', arTagType: 'architectural' },
    { id: 'p2', title: 'Point Two', relativeX: 60, relativeY: 50, briefFact: 'Fact two', arTagType: 'historical' },
  ],
  nearbyPOIs: [
    { id: 'a', name: 'Museum', category: 'museum', distanceMeters: 100, coordinates: { latitude: 10, longitude: 20 }, shortDescription: 'Museum' },
    { id: 'b', name: 'Park', category: 'park', distanceMeters: 200, coordinates: { latitude: 10.1, longitude: 20.1 }, shortDescription: 'Park' },
    { id: 'c', name: 'Viewpoint', category: 'viewpoint', distanceMeters: 300, coordinates: { latitude: 10.2, longitude: 20.2 }, shortDescription: 'Viewpoint' },
  ],
};

test('accepts a structurally valid recognition response', () => {
  assert.equal(validateLandmarkRecognition(valid).confidenceScore, 82);
});

test('rejects out-of-range confidence values', () => {
  assert.throws(() => validateLandmarkRecognition({ ...valid, confidenceScore: 101 }), /confidenceScore/);
});

test('rejects malformed focal-point coordinates', () => {
  const payload = structuredClone(valid);
  payload.keyFocalPoints[0].relativeX = 4;
  assert.throws(() => validateLandmarkRecognition(payload), /relativeX/);
});

test('rejects missing nearby POIs instead of accepting unverifiable output', () => {
  assert.throws(() => validateLandmarkRecognition({ ...valid, nearbyPOIs: [] }), /nearbyPOIs/);
});

test('rejects invalid POI coordinates', () => {
  const payload = structuredClone(valid);
  payload.nearbyPOIs[0].coordinates.latitude = 95;
  assert.throws(() => validateLandmarkRecognition(payload), /latitude/);
});