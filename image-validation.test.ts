import test from 'node:test';
import assert from 'node:assert/strict';

import { validateImageInput } from './image-validation';

test('accepts supported MIME types and valid base64', () => {
  const result = validateImageInput('aGVsbG8=', 'image/png');
  assert.equal(result.cleanBase64, 'aGVsbG8=');
  assert.equal(result.mimeType, 'image/png');
});

test('rejects unsupported MIME types', () => {
  assert.throws(
    () => validateImageInput('aGVsbG8=', 'image/svg+xml'),
    /Unsupported image MIME type/,
  );
});

test('rejects malformed base64 payloads', () => {
  assert.throws(
    () => validateImageInput('not-base64!', 'image/jpeg'),
    /Invalid base64 image payload/,
  );
});

test('rejects payloads above the 15 MB decoded limit', () => {
  const oversized = 'A'.repeat(20 * 1024 * 1024);
  assert.throws(
    () => validateImageInput(oversized, 'image/jpeg'),
    /15 MB size limit/,
  );
});
