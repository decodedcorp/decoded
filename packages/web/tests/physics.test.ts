import { describe, test, expect, vi, afterEach } from 'vitest';
import { getDistance, debounce, throttle } from '@/lib/components/ThiingsGridPhysics';

// ----------------------------------------------------------------------------
// getDistance
// ----------------------------------------------------------------------------

describe('getDistance', () => {
  test('returns 0 for identical points', () => {
    expect(getDistance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
    expect(getDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  test('returns correct Euclidean distance for 3-4-5 right triangle', () => {
    expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  test('handles negative coordinates', () => {
    expect(getDistance({ x: -3, y: -4 }, { x: 0, y: 0 })).toBe(5);
    expect(getDistance({ x: -3, y: 0 }, { x: 0, y: -4 })).toBe(5);
  });

  test('is symmetric — order of points does not matter', () => {
    const d1 = getDistance({ x: 1, y: 2 }, { x: 4, y: 6 });
    const d2 = getDistance({ x: 4, y: 6 }, { x: 1, y: 2 });
    expect(d1).toBeCloseTo(d2);
  });
});

// ----------------------------------------------------------------------------
// debounce
// ----------------------------------------------------------------------------

describe('debounce', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('delays execution until delay elapses', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('does not fire before the delay window', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 200);

    debouncedFn();
    vi.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('resets timer on repeated calls — only fires once', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    vi.advanceTimersByTime(50);
    debouncedFn();
    vi.advanceTimersByTime(50);
    // only 50ms since last call — should not have fired yet
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    // now 100ms since last call
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('cancel prevents pending execution', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });
});

// ----------------------------------------------------------------------------
// throttle
// ----------------------------------------------------------------------------

describe('throttle', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('fires immediately on first call when leading:true (default)', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100, { leading: true, trailing: false });

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('suppresses subsequent calls within the limit window', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100, { leading: true, trailing: false });

    throttledFn();
    throttledFn();
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('allows another call after the limit window expires', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100, { leading: true, trailing: false });

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('fires trailing call when trailing:true (default) after limit elapses', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    // leading:true, trailing:true (defaults)
    const throttledFn = throttle(fn, 100);

    throttledFn(); // fires immediately (leading)
    expect(fn).toHaveBeenCalledTimes(1);

    throttledFn(); // within window — schedules trailing
    vi.advanceTimersByTime(100);
    // trailing call should have fired
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('does not fire if leading:false on first call', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100, { leading: false, trailing: true });

    throttledFn();
    // leading is false, so no immediate call
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    // trailing fires
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
