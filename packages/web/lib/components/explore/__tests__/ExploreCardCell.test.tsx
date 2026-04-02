/**
 * @vitest-environment jsdom
 *
 * ExploreCardCell unit tests
 *
 * Tests spotCount badge pill rendering behavior.
 * Component dependencies (GSAP, next/image, Zustand stores) are mocked
 * so tests focus on badge visibility logic only.
 */
import React from 'react';
import { describe, test, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// --- Mocks ---

vi.mock('gsap', () => ({
  gsap: { registerPlugin: vi.fn() },
  default: { registerPlugin: vi.fn() },
}));

vi.mock('gsap/Flip', () => ({
  Flip: { getState: vi.fn(), from: vi.fn() },
  default: { getState: vi.fn(), from: vi.fn() },
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/stores/transitionStore', () => ({
  useTransitionStore: () => vi.fn(),
}));

vi.mock('@/lib/hooks/useTrackEvent', () => ({
  useTrackEvent: () => vi.fn(),
}));

vi.mock('@/lib/design-system', () => ({
  Card: ({ children, className }: React.PropsWithChildren<{ className?: string; variant?: string; size?: string; interactive?: boolean }>) => (
    <div className={className}>{children}</div>
  ),
}));

// --- Tests ---

import { ExploreCardCell } from '../ExploreCardCell';
import type { ItemConfig } from '@/lib/components/ThiingsGrid';

function makeConfig(overrides: Partial<ItemConfig['item']> = {}): ItemConfig {
  return {
    isMoving: false,
    position: { x: 0, y: 0 },
    gridIndex: 0,
    item: {
      id: 'test-post-id',
      imageUrl: 'https://example.com/image.jpg',
      postId: 'test-post-id',
      postSource: 'post',
      postAccount: 'test-account',
      postCreatedAt: '2026-01-01T00:00:00Z',
      ...overrides,
    },
  };
}

describe('ExploreCardCell — spotCount badge pill', () => {
  test('Test 1: spotCount=5 → badge pill is rendered with text "5"', () => {
    const config = makeConfig({ spotCount: 5 });
    render(<ExploreCardCell {...config} />);
    // Badge should show spot count number
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('Test 2: spotCount=0 → badge pill is NOT rendered', () => {
    const config = makeConfig({ spotCount: 0 });
    render(<ExploreCardCell {...config} />);
    // No numeric badge element for zero
    const badge = screen.queryByRole('presentation');
    // Should not find any element containing just "0" as a badge
    expect(screen.queryByLabelText(/0 spots/)).not.toBeInTheDocument();
  });

  test('Test 3: spotCount=undefined → badge pill is NOT rendered', () => {
    // spotCount not set (undefined)
    const config = makeConfig();
    render(<ExploreCardCell {...config} />);
    expect(screen.queryByLabelText(/spots/)).not.toBeInTheDocument();
  });

  test('Test 4: editorialTitle present → overlay text is rendered (regression guard)', () => {
    const config = makeConfig({ editorialTitle: 'Vogue Korea' });
    render(<ExploreCardCell {...config} />);
    expect(screen.getByText('Vogue Korea')).toBeInTheDocument();
  });
});
