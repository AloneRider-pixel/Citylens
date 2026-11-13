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
// Offline transport contract for the installed SDK. Never contacts Gemini.
test('GenAI SDK preserves image, search, JSON and audio contracts', async () => {
  const { GoogleGenAI, Modality } = await import('@google/genai');
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; body: any }> = [];
  let status = 200;
  let fixture: any = { candidates: [{ content: { parts: [{ text: '{"fixture":true}' }] }, groundingMetadata: { groundingChunks: [{ web: { uri: 'https://example.test/source', title: 'Fixture source' } }] } }] };
  globalThis.fetch = (async (input: any, init: any) => {
    const request = new Request(input, init);
    requests.push({ url: request.url, body: JSON.parse(await request.text()) });
    return new Response(JSON.stringify(status === 200 ? fixture : { error: { code: 429, message: 'Synthetic quota error', status: 'RESOURCE_EXHAUSTED' } }), { status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  try {
    const ai = new GoogleGenAI({ apiKey: 'synthetic-not-a-real-key', httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    const imageResponse = await ai.models.generateContent({ model: 'gemini-3.1-pro-preview', contents: { parts: [{ inlineData: { data: 'AQID', mimeType: 'image/jpeg' } }, { text: 'Synthetic landmark fixture' }] }, config: { responseMimeType: 'application/json' } });
    assert.equal(imageResponse.text, '{"fixture":true}');
    assert.equal(requests[0].body.contents[0].parts[0].inlineData.data, 'AQID');
    assert.equal(requests[0].body.generationConfig.responseMimeType, 'application/json');
    const searchResponse = await ai.models.generateContent({ model: 'gemini-3.5-flash', contents: 'Synthetic history fixture', config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json' } });
    assert.equal(searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks?.[0]?.web?.uri, 'https://example.test/source');
    assert.deepEqual(requests[1].body.tools, [{ googleSearch: {} }]);
    fixture = { candidates: [{ content: { parts: [{ inlineData: { data: 'AQID', mimeType: 'audio/pcm' } }] } }] };
    const audioResponse = await ai.models.generateContent({ model: 'gemini-3.1-flash-tts-preview', contents: [{ parts: [{ text: 'Synthetic narration fixture' }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } } });
    assert.equal(audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data, 'AQID');
    assert.deepEqual(requests[2].body.generationConfig.responseModalities, ['AUDIO']);
    assert.equal(requests[2].body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Kore');
    status = 429;
    await assert.rejects(ai.models.generateContent({ model: 'gemini-3.5-flash', contents: 'Synthetic error fixture' }), /Synthetic quota error/);
    assert.equal(requests.length, 4);
    assert.ok(requests.every(request => request.url.includes(':generateContent')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
