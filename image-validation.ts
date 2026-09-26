const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function validateImageInput(
  imageBase64: unknown,
  mimeType: unknown,
): { cleanBase64: string; mimeType: string } {
  if (typeof imageBase64 !== 'string' || imageBase64.trim() === '') {
    throw new Error('imageBase64 is required');
  }

  const requestedMime = typeof mimeType === 'string' && mimeType.trim()
    ? mimeType.trim().toLowerCase()
    : 'image/jpeg';

  if (!ALLOWED_IMAGE_TYPES.has(requestedMime)) {
    throw new Error('Unsupported image MIME type');
  }

  const cleanBase64 = imageBase64
    .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
    .trim();

  if (cleanBase64.length === 0 || cleanBase64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
    throw new Error('Invalid base64 image payload');
  }

  const padding = cleanBase64.endsWith('==') ? 2 : cleanBase64.endsWith('=') ? 1 : 0;
  const estimatedBytes = Math.floor((cleanBase64.length * 3) / 4) - padding;

  if (estimatedBytes > MAX_IMAGE_BYTES) {
    throw new Error('Image exceeds the 15 MB size limit');
  }

  return { cleanBase64, mimeType: requestedMime };
}
