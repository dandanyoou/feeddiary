import { describe, expect, test } from 'vitest';
import { generate, generateUnique } from '../slug';

describe('generate', () => {
  test('returns 8-char string', () => {
    expect(generate()).toHaveLength(8);
  });

  test('uses only base62 alphabet', () => {
    for (let i = 0; i < 100; i++) {
      expect(generate()).toMatch(/^[A-Za-z0-9]{8}$/);
    }
  });

  test('produces different slugs across calls (statistical sanity)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) seen.add(generate());
    expect(seen.size).toBeGreaterThan(95);
  });
});

describe('generateUnique', () => {
  test('returns first slug if not in use', async () => {
    const exists = async () => false;
    const slug = await generateUnique(exists);
    expect(slug).toMatch(/^[A-Za-z0-9]{8}$/);
  });

  test('retries when first slug is in use', async () => {
    let calls = 0;
    const exists = async () => {
      calls++;
      return calls < 3;
    };
    const slug = await generateUnique(exists);
    expect(slug).toMatch(/^[A-Za-z0-9]{8}$/);
    expect(calls).toBe(3);
  });

  test('throws after maxAttempts collisions', async () => {
    const exists = async () => true;
    await expect(generateUnique(exists, 3)).rejects.toThrow('SLUG_COLLISION_RETRIES_EXHAUSTED');
  });
});
