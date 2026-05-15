import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { dedupeVideos, fetchTitle, parseUrl, parseUrls } from '../youtube';

describe('parseUrl', () => {
  test('youtube.com/watch?v=ID', () => {
    const r = parseUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(r).toEqual({ id: 'dQw4w9WgXcQ', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
  });

  test('youtube.com/watch?v=ID with extra params', () => {
    const r = parseUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s');
    expect(r?.id).toBe('dQw4w9WgXcQ');
  });

  test('youtube.com/watch with params before v=', () => {
    const r = parseUrl('https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ');
    expect(r?.id).toBe('dQw4w9WgXcQ');
  });

  test('youtu.be/ID short link', () => {
    const r = parseUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(r?.id).toBe('dQw4w9WgXcQ');
  });

  test('youtube.com/shorts/ID', () => {
    const r = parseUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ');
    expect(r?.id).toBe('dQw4w9WgXcQ');
  });

  test('invalid: not a YouTube URL', () => {
    expect(parseUrl('https://vimeo.com/123')).toBeNull();
  });

  test('invalid: malformed video id length', () => {
    expect(parseUrl('https://youtu.be/short')).toBeNull();
  });

  test('invalid: non-string input', () => {
    expect(parseUrl(null)).toBeNull();
    expect(parseUrl(undefined)).toBeNull();
    expect(parseUrl(42)).toBeNull();
  });
});

describe('parseUrls', () => {
  test('newline-separated list', () => {
    const text = `
      https://www.youtube.com/watch?v=AAAAAAAAAAA
      https://youtu.be/BBBBBBBBBBB

      https://www.youtube.com/shorts/CCCCCCCCCCC
    `;
    const r = parseUrls(text);
    expect(r.map((v) => v.id)).toEqual(['AAAAAAAAAAA', 'BBBBBBBBBBB', 'CCCCCCCCCCC']);
  });

  test('mixed valid and invalid lines drops invalid', () => {
    const text = `
      https://www.youtube.com/watch?v=AAAAAAAAAAA
      not-a-url
      https://vimeo.com/123
      https://youtu.be/BBBBBBBBBBB
    `;
    const r = parseUrls(text);
    expect(r.length).toBe(2);
  });

  test('empty string returns []', () => {
    expect(parseUrls('')).toEqual([]);
  });
});

describe('dedupeVideos', () => {
  test('drops repeat IDs, preserves order', () => {
    const input = [
      { id: 'A', url: 'urlA' },
      { id: 'B', url: 'urlB' },
      { id: 'A', url: 'urlA2' },
      { id: 'C', url: 'urlC' },
    ];
    expect(dedupeVideos(input).map((v) => v.id)).toEqual(['A', 'B', 'C']);
  });

  test('no duplicates returns input', () => {
    const input = [
      { id: 'A', url: 'urlA' },
      { id: 'B', url: 'urlB' },
    ];
    expect(dedupeVideos(input)).toEqual(input);
  });
});

describe('fetchTitle', () => {
  const video = { id: 'dQw4w9WgXcQ', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };

  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('happy path returns oEmbed title', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ title: 'Never Gonna Give You Up' }), { status: 200 }),
      ),
    );
    const r = await fetchTitle(video);
    expect(r.title).toBe('Never Gonna Give You Up');
  });

  test('non-200 response falls back to video id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    const r = await fetchTitle(video);
    expect(r.title).toBe('dQw4w9WgXcQ');
  });

  test('network error falls back to video id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const r = await fetchTitle(video);
    expect(r.title).toBe('dQw4w9WgXcQ');
  });

  test('oEmbed returns no title key falls back to video id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })),
    );
    const r = await fetchTitle(video);
    expect(r.title).toBe('dQw4w9WgXcQ');
  });
});
