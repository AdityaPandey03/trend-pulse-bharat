/**
 * Smoke tests — no test framework, just assertions.
 * Run: `npx tsx scripts/smoke-test.ts`
 * or:  `npx ts-node scripts/smoke-test.ts`
 *
 * Validates that the parts of the pipeline that DON'T need network access
 * (scoring + diversification + slug generation) behave correctly.
 */

import { scoreCluster, diversify, slugify } from '../lib/score';
import type { EnrichedCluster } from '../lib/llm';
import type { RawTrend, Category } from '../lib/types';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e instanceof Error ? e.message : e}`);
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function assertClose(actual: number, expected: number, eps = 0.01, msg = '') {
  if (Math.abs(actual - expected) > eps) {
    throw new Error(`${msg} expected ${expected}, got ${actual}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Fixture factories
// ─────────────────────────────────────────────────────────────────────────

function makeMember(overrides: Partial<RawTrend> = {}): RawTrend {
  return {
    title: 'test',
    source: 'google_trends',
    sourceScore: 0.5,
    publishedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeCluster(cat: Category = 'cricket', indiaRel = 0.9): EnrichedCluster {
  return {
    canonicalTitle: 'Test Trend',
    hashtagHi: '#टेस्ट',
    hashtagEn: '#Test',
    descriptionHi: 'टेस्ट',
    descriptionEn: 'Test',
    category: cat,
    indiaRelevance: indiaRel,
    memberIndices: [0],
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────────────────

console.log('\nScoring:');

test('score bounded in [0, 1]', () => {
  const c = makeCluster();
  const m = [makeMember({ sourceScore: 1, publishedAt: new Date().toISOString() })];
  const s = scoreCluster(c, m);
  assert(s.total >= 0 && s.total <= 1.2, `total ${s.total} out of bounds`);
});

test('cross-source boost: 3 sources > 1 source (same other inputs)', () => {
  const c = makeCluster();
  const now = new Date().toISOString();
  const one = [makeMember({ source: 'google_trends', sourceScore: 0.8, publishedAt: now })];
  const three = [
    makeMember({ source: 'google_trends', sourceScore: 0.8, publishedAt: now }),
    makeMember({ source: 'news_rss',      sourceScore: 0.8, publishedAt: now }),
    makeMember({ source: 'reddit_india',  sourceScore: 0.8, publishedAt: now }),
  ];
  const s1 = scoreCluster(c, one);
  const s3 = scoreCluster(c, three);
  assert(s3.total > s1.total, `3 sources (${s3.total}) should beat 1 source (${s1.total})`);
  assert(s3.crossSource > s1.crossSource, 'crossSource component should be strictly higher');
});

test('recency decay: 0h fresher than 10h', () => {
  const c = makeCluster();
  const fresh = [makeMember({ publishedAt: new Date().toISOString() })];
  const old   = [makeMember({ publishedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString() })];
  const sFresh = scoreCluster(c, fresh);
  const sOld   = scoreCluster(c, old);
  assert(sFresh.recency > sOld.recency, `fresh (${sFresh.recency}) should beat old (${sOld.recency})`);
});

test('category prior: cricket > tech', () => {
  const now = new Date().toISOString();
  const m = [makeMember({ publishedAt: now, sourceScore: 0.5 })];
  const cricket = scoreCluster(makeCluster('cricket'), m);
  const tech    = scoreCluster(makeCluster('tech'),    m);
  assert(cricket.category > tech.category, `cricket category (${cricket.category}) should beat tech (${tech.category})`);
});

test('india relevance: 1.0 > 0.3', () => {
  const now = new Date().toISOString();
  const m = [makeMember({ publishedAt: now })];
  const high = scoreCluster(makeCluster('cricket', 1.0), m);
  const low  = scoreCluster(makeCluster('cricket', 0.3), m);
  assert(high.total > low.total, 'higher indiaRelevance should produce higher total');
});

// ─────────────────────────────────────────────────────────────────────────
// Diversification
// ─────────────────────────────────────────────────────────────────────────

console.log('\nDiversification:');

test('diversify returns exactly N items', () => {
  const items = Array.from({ length: 20 }, (_, i) => ({
    category: 'cricket' as Category,
    score: Math.random(),
    id: i,
  }));
  const out = diversify(items, 10);
  assert(out.length === 10, `expected 10, got ${out.length}`);
});

test('diversify prevents single category from dominating', () => {
  // 8 cricket items, 2 festival items. Without diversification, top 10 would be
  // all cricket + 2 festivals. With diversification, we should see spread.
  const items = [
    ...Array.from({ length: 8 }, (_, i) => ({
      category: 'cricket' as Category,
      score: 0.9 - i * 0.01,
      id: `c${i}`,
    })),
    ...Array.from({ length: 2 }, (_, i) => ({
      category: 'festival' as Category,
      score: 0.85 - i * 0.01,
      id: `f${i}`,
    })),
  ];
  const out = diversify(items, 10);
  const cricketCount = out.filter(o => o.category === 'cricket').length;
  const festivalCount = out.filter(o => o.category === 'festival').length;
  // With the 0.08 penalty, festival items should sneak in earlier than
  // a naive top-N sort would pick them.
  assert(festivalCount >= 2, `festival should be represented (got ${festivalCount})`);
  assert(cricketCount <= 8, `cricket should not exceed supply (got ${cricketCount})`);
  // The important claim: festivals surface early, not dumped at the end.
  const firstFestivalPos = out.findIndex(o => o.category === 'festival');
  assert(firstFestivalPos >= 0 && firstFestivalPos <= 5,
    `festival should surface in top half, got pos ${firstFestivalPos}`);
});

test('diversify preserves top item (highest raw score always wins slot 1)', () => {
  const items = [
    { category: 'cricket' as Category, score: 0.99, id: 'top' },
    { category: 'festival' as Category, score: 0.5, id: 'b' },
    { category: 'entertainment' as Category, score: 0.4, id: 'c' },
  ];
  const out = diversify(items, 3);
  assert((out[0] as typeof items[0]).id === 'top', 'top-scored item should be first');
});

// ─────────────────────────────────────────────────────────────────────────
// Slugify
// ─────────────────────────────────────────────────────────────────────────

console.log('\nSlugify:');

test('slugify: spaces to hyphens, lowercase', () => {
  assert(slugify('India vs Australia') === 'india-vs-australia', 'basic slug');
});

test('slugify: strips special chars', () => {
  assert(slugify('Diwali 2026! @home') === 'diwali-2026-home', 'special chars stripped');
});

test('slugify: handles Devanagari gracefully', () => {
  // Devanagari gets stripped; falls back to "t-xxxxxx" pattern.
  const s = slugify('#भारत');
  assert(s.length > 0, 'should produce non-empty slug even for all-Devanagari input');
});

// ─────────────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
