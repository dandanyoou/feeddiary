import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { _resetForTests, rateLimit } from '../ratelimit';

const OPTS = { maxRequests: 3, windowMs: 1000 };

describe('rateLimit', () => {
  beforeEach(() => {
    _resetForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('allows up to maxRequests', () => {
    for (let i = 0; i < 3; i++) {
      const r = rateLimit('1.2.3.4', OPTS);
      expect(r.ok).toBe(true);
      expect(r.remaining).toBe(2 - i);
    }
  });

  test('blocks the maxRequests+1th request', () => {
    for (let i = 0; i < 3; i++) rateLimit('1.2.3.4', OPTS);
    const r = rateLimit('1.2.3.4', OPTS);
    expect(r.ok).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterMs).toBeGreaterThan(0);
    expect(r.retryAfterMs).toBeLessThanOrEqual(1000);
  });

  test('sliding window: requests slide off after windowMs', () => {
    for (let i = 0; i < 3; i++) rateLimit('1.2.3.4', OPTS);
    expect(rateLimit('1.2.3.4', OPTS).ok).toBe(false);

    vi.advanceTimersByTime(1001);

    const r = rateLimit('1.2.3.4', OPTS);
    expect(r.ok).toBe(true);
  });

  test('different IPs are independent', () => {
    for (let i = 0; i < 3; i++) rateLimit('1.1.1.1', OPTS);
    expect(rateLimit('1.1.1.1', OPTS).ok).toBe(false);
    expect(rateLimit('2.2.2.2', OPTS).ok).toBe(true);
  });

  test('partial slide: only oldest timestamps expire', () => {
    rateLimit('1.2.3.4', OPTS); // t=0
    vi.advanceTimersByTime(500);
    rateLimit('1.2.3.4', OPTS); // t=500
    rateLimit('1.2.3.4', OPTS); // t=500
    expect(rateLimit('1.2.3.4', OPTS).ok).toBe(false);

    vi.advanceTimersByTime(501); // now=1001, first ts (0) expired
    const r = rateLimit('1.2.3.4', OPTS);
    expect(r.ok).toBe(true);
  });
});
