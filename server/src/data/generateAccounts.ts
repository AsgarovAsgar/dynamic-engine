import type { TableCellValue } from '../types/widgets.js';

/**
 * Fills out the accounts table beyond the hand-written rows.
 *
 * The client virtualizes past 100 rows, so a 10-row payload would leave that
 * path dead in every demo. Generating a realistic tail makes windowed rendering
 * observable — and a 2,988-row `totalRows` honest rather than aspirational.
 *
 * Deterministic: a seeded PRNG keeps the dataset identical across restarts, so
 * screenshots and sort order stay reproducible.
 */

const PREFIXES = [
  'Apex', 'Borealis', 'Cedar', 'Dalton', 'Everest', 'Fairview', 'Granite',
  'Harbor', 'Ironwood', 'Juniper', 'Keystone', 'Lakeside', 'Meridian',
  'Northwind', 'Oakfield', 'Pioneer', 'Quarry', 'Ridgeway', 'Summit',
  'Trident', 'Union', 'Valley', 'Westgate', 'Yarrow', 'Zenith',
];

const SUFFIXES = [
  'Manufacturing', 'Logistics', 'Retail', 'Foods', 'Tech', 'Energy',
  'Freight', 'Health', 'Textiles', 'Chemicals', 'Motors', 'Metals',
  'Media', 'Capital', 'Agriculture', 'Marine', 'Systems', 'Partners',
];

const REGIONS = ['South-East', 'West', 'Midwest', 'North'];

/** Mulberry32 — small, fast, and deterministic from a fixed seed. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateAccounts(
  count: number,
  startingScore: number,
): Array<Record<string, TableCellValue>> {
  const random = createRandom(0x5eed);
  const rows: Array<Record<string, TableCellValue>> = [];

  // Scores descend from where the hand-written rows leave off, so the default
  // sort stays coherent across the whole dataset.
  let score = startingScore;

  for (let index = 0; index < count; index += 1) {
    const prefix = PREFIXES[Math.floor(random() * PREFIXES.length)] ?? 'Apex';
    const suffix = SUFFIXES[Math.floor(random() * SUFFIXES.length)] ?? 'Systems';
    const region = REGIONS[Math.floor(random() * REGIONS.length)] ?? 'West';

    score = Math.max(0.05, score - random() * 0.002);

    rows.push({
      // Index keeps names unique when the prefix/suffix pair repeats.
      account: `${prefix} ${suffix} ${String(index + 11).padStart(4, '0')}`,
      exposure: Math.round((1_700_000 - index * 480 + random() * 90_000) / 1000) * 1000,
      score: Number(score.toFixed(2)),
      region,
    });
  }

  return rows;
}
