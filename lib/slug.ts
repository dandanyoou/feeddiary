// Short, URL-friendly card slug.
// 8-char base62 = 62^8 ≈ 2.18e14 keyspace. Collision probability with
// ~1M cards is ~1e-3 — well within the 5-retry tolerance.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const LENGTH = 8;

export function generate(): string {
  const buf = new Uint8Array(LENGTH);
  crypto.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < LENGTH; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return out;
}

/**
 * Generate a slug not already in use, by checking against a callback.
 * Throws if no unique slug found within maxAttempts.
 */
export async function generateUnique(
  exists: (slug: string) => Promise<boolean>,
  maxAttempts = 5,
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const slug = generate();
    if (!(await exists(slug))) return slug;
  }
  throw new Error('SLUG_COLLISION_RETRIES_EXHAUSTED');
}
