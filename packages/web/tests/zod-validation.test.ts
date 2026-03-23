import { describe, test, expect } from 'vitest';
import {
  HealthCheckResponse,
  GetMyProfileResponse,
  AdminListBadgesResponse,
} from '@/lib/api/generated/zod/decodedApi.zod';

/**
 * TEST-01: Zod schema validation tests.
 *
 * Strategy: Use .safeParse() to verify generated schemas catch shape mismatches
 * as ZodError instances, not runtime TypeErrors from undefined property access.
 *
 * Fixtures are static objects matching the OpenAPI spec shape.
 * Real integration tests against a live backend are out of scope (see REQUIREMENTS.md).
 */

describe('Zod Schema: HealthCheckResponse', () => {
  const validFixture = {
    database: { status: 'up', detail: null },
    decoded_ai_grpc: { status: 'up', detail: null },
    meilisearch: { status: 'up', detail: null },
    status: 'ok',
    storage: { status: 'up', detail: null },
  };

  test('valid health check response passes safeParse', () => {
    const result = HealthCheckResponse.safeParse(validFixture);
    expect(result.success).toBe(true);
  });

  test('missing required dependency field yields ZodError', () => {
    const bad = {
      // database missing
      decoded_ai_grpc: { status: 'up', detail: null },
      meilisearch: { status: 'up', detail: null },
      status: 'degraded',
      storage: { status: 'up', detail: null },
    };
    const result = HealthCheckResponse.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

describe('Zod Schema: GetMyProfileResponse', () => {
  const validFixture = {
    avatar_url: 'https://example.com/avatar.jpg',
    bio: 'Hello world',
    display_name: 'Test User',
    email: 'test@example.com',
    id: '00000000-0000-0000-0000-000000000001',
    is_admin: false,
    rank: 'beginner',
    total_points: 100,
    username: 'testuser',
  };

  test('valid profile response passes safeParse', () => {
    const result = GetMyProfileResponse.safeParse(validFixture);
    expect(result.success).toBe(true);
  });

  test('wrong type (email as number) yields ZodError', () => {
    const bad = { ...validFixture, email: 12345 };
    const result = GetMyProfileResponse.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('email'))).toBe(true);
    }
  });

  test('missing required field (id) yields ZodError', () => {
    const { id: _, ...bad } = validFixture;
    const result = GetMyProfileResponse.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('id'))).toBe(true);
    }
  });
});

describe('Zod Schema: AdminListBadgesResponse', () => {
  const validFixture = {
    data: [
      {
        created_at: '2026-01-01T00:00:00Z',
        criteria: { target: null, threshold: 10, type: 'count' },
        description: null,
        icon_url: null,
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Test Badge',
        rarity: 'common',
        type: 'achievement',
      },
    ],
    pagination: {
      current_page: 1,
      per_page: 50,
      total_items: 1,
      total_pages: 1,
    },
  };

  test('valid paginated response passes safeParse', () => {
    const result = AdminListBadgesResponse.safeParse(validFixture);
    expect(result.success).toBe(true);
  });

  test('missing pagination yields ZodError', () => {
    const bad = { data: [] };
    const result = AdminListBadgesResponse.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  test('wrong pagination field type (string instead of number) yields ZodError', () => {
    const bad = {
      data: [],
      pagination: {
        current_page: 'one',
        per_page: 50,
        total_items: 0,
        total_pages: 0,
      },
    };
    const result = AdminListBadgesResponse.safeParse(bad);
    expect(result.success).toBe(false);
  });
});
