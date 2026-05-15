import { describe, expect, test } from 'vitest';
import { buildPrompt, parseResponse } from '../claude';

describe('buildPrompt', () => {
  test('includes header and serialized items', () => {
    const prompt = buildPrompt([
      { id: '1', title: 'Rust in 100 Seconds' },
      { id: '2', title: 'Healthy breakfast ideas' },
    ]);
    expect(prompt).toContain('You are categorizing YouTube videos');
    expect(prompt).toContain('Rust in 100 Seconds');
    expect(prompt).toContain('Healthy breakfast ideas');
    expect(prompt).toContain('"id": "1"');
  });

  test('empty array still produces valid prompt', () => {
    const prompt = buildPrompt([]);
    expect(prompt).toContain('Items:\n[]');
  });
});

describe('parseResponse', () => {
  test('happy path returns matched categories', () => {
    const text = JSON.stringify([
      { id: '1', category: 'Tech' },
      { id: '2', category: 'Cooking' },
    ]);
    const r = parseResponse(text, ['1', '2']);
    expect(r).toEqual([
      { id: '1', category: 'Tech' },
      { id: '2', category: 'Cooking' },
    ]);
  });

  test('strips ```json markdown code fence', () => {
    const text = '```json\n[{"id":"1","category":"Tech"}]\n```';
    const r = parseResponse(text, ['1']);
    expect(r).toEqual([{ id: '1', category: 'Tech' }]);
  });

  test('strips bare ``` markdown code fence', () => {
    const text = '```\n[{"id":"1","category":"Tech"}]\n```';
    const r = parseResponse(text, ['1']);
    expect(r).toEqual([{ id: '1', category: 'Tech' }]);
  });

  test('invalid category coerces to "Other"', () => {
    const text = JSON.stringify([{ id: '1', category: 'Spaceships' }]);
    const r = parseResponse(text, ['1']);
    expect(r).toEqual([{ id: '1', category: 'Other' }]);
  });

  test('missing id in response defaults to "Other"', () => {
    const text = JSON.stringify([{ id: '1', category: 'Tech' }]);
    const r = parseResponse(text, ['1', '2', '3']);
    expect(r).toEqual([
      { id: '1', category: 'Tech' },
      { id: '2', category: 'Other' },
      { id: '3', category: 'Other' },
    ]);
  });

  test('unparseable JSON returns all "Other"', () => {
    const r = parseResponse('completely not json', ['1', '2']);
    expect(r).toEqual([
      { id: '1', category: 'Other' },
      { id: '2', category: 'Other' },
    ]);
  });

  test('non-array JSON returns all "Other"', () => {
    const r = parseResponse('{"id":"1","category":"Tech"}', ['1']);
    expect(r).toEqual([{ id: '1', category: 'Other' }]);
  });

  test('preserves expectedIds order even if response is shuffled', () => {
    const text = JSON.stringify([
      { id: '2', category: 'Cooking' },
      { id: '1', category: 'Tech' },
    ]);
    const r = parseResponse(text, ['1', '2']);
    expect(r).toEqual([
      { id: '1', category: 'Tech' },
      { id: '2', category: 'Cooking' },
    ]);
  });
});
