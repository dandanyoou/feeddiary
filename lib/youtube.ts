// YouTube URL parsing + oEmbed title fetching.
//
// Flow:
//   parseUrls(text) → ParsedVideo[]  (extract 11-char IDs from pasted text)
//   dedupeVideos(videos) → ParsedVideo[]  (drop duplicate IDs)
//   fetchTitle(video) → TitledVideo  (oEmbed with timeout, falls back to ID)

export interface ParsedVideo {
  id: string;
  url: string;
}

export interface TitledVideo extends ParsedVideo {
  title: string;
}

// YouTube video IDs are exactly 11 chars from the base64url-ish alphabet.
const YOUTUBE_PATTERNS: RegExp[] = [
  /youtube\.com\/watch\?(?:[^#\s]*&)?v=([A-Za-z0-9_-]{11})/,
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
];

const OEMBED_TIMEOUT_MS = 3000;

export function parseUrl(url: unknown): ParsedVideo | null {
  if (typeof url !== 'string') return null;
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) return { id: match[1], url };
  }
  return null;
}

export function parseUrls(text: string): ParsedVideo[] {
  return text
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseUrl)
    .filter((v): v is ParsedVideo => v !== null);
}

export function dedupeVideos(videos: ParsedVideo[]): ParsedVideo[] {
  const seen = new Set<string>();
  const out: ParsedVideo[] = [];
  for (const v of videos) {
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    out.push(v);
  }
  return out;
}

export async function fetchTitle(video: ParsedVideo): Promise<TitledVideo> {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${video.id}&format=json`;
  try {
    const res = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(OEMBED_TIMEOUT_MS),
    });
    if (!res.ok) return { ...video, title: video.id };
    const data = (await res.json()) as { title?: string };
    return { ...video, title: data.title ?? video.id };
  } catch {
    return { ...video, title: video.id };
  }
}

export async function fetchTitles(videos: ParsedVideo[]): Promise<TitledVideo[]> {
  return Promise.all(videos.map(fetchTitle));
}
