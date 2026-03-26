import { describe, test, expect } from 'vitest';
import { dataUrlToBlob } from '@/lib/hooks/useVtonTryOn';

// Minimal 1×1 transparent PNG encoded as base64
// This is a valid PNG that can be decoded by atob() in Node 22+
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const PNG_DATA_URL = `data:image/png;base64,${TINY_PNG_BASE64}`;
const JPEG_DATA_URL = `data:image/jpeg;base64,${TINY_PNG_BASE64}`;

// ----------------------------------------------------------------------------
// dataUrlToBlob
// ----------------------------------------------------------------------------

describe('dataUrlToBlob', () => {
  test('converts a PNG data URL to a Blob with correct mime type', async () => {
    const blob = await dataUrlToBlob(PNG_DATA_URL);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
  });

  test('returns a Blob with size > 0', async () => {
    const blob = await dataUrlToBlob(PNG_DATA_URL);
    expect(blob.size).toBeGreaterThan(0);
  });

  test('handles image/jpeg mime type', async () => {
    const blob = await dataUrlToBlob(JPEG_DATA_URL);
    expect(blob.type).toBe('image/jpeg');
  });
});
