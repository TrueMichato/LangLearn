import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retainedCheckpointIds } from '../src/retention.ts';

const hour = 3600000;
const day = 24 * hour;

for (const cadence of [30000, 60000]) {
  test(`45 days of eight-hour active capture at ${cadence / 1000}s stays bounded and preserves tier anchors`, () => {
    const start = Date.UTC(2026, 0, 1, 8);
    let retained = [{ id: 'initial-empty', storedMs: start - cadence, sequence: 0 }];
    const all = [...retained];
    let sequence = 0;
    let maximum = 0;
    let firstNonemptyId = null;
    for (let date = 0; date < 45; date++) {
      for (let time = 0; time < 8 * hour; time += cadence) {
        const item = { id: `synthetic-${++sequence}`, storedMs: start + date * day + time, sequence };
        firstNonemptyId ??= item.id;
        all.push(item);
        retained.push(item);
        const selected = retainedCheckpointIds(retained, item.storedMs, firstNonemptyId, item.id);
        retained = retained.filter((candidate) => selected.has(candidate.id));
        maximum = Math.max(maximum, retained.length);
        assert.ok(retained.length <= 63);
        assert.ok(retained.some((candidate) => candidate.id === firstNonemptyId));
        assert.ok(retained.some((candidate) => candidate.id === item.id));
      }
    }
    const last = all.at(-1);
    const expected = retainedCheckpointIds(all, last.storedMs, firstNonemptyId, last.id);
    assert.deepEqual(new Set(retained.map((item) => item.id)), expected);
    assert.equal(retained.some((item) => item.id === 'initial-empty'), false);
    assert.ok(sequence > 20000);
    assert.ok(maximum < 63);
    for (const item of all.slice(-8)) assert.ok(expected.has(item.id));
    const cutoff = Math.floor(last.storedMs / day) - 29;
    for (let bucket = cutoff; bucket <= Math.floor(last.storedMs / day); bucket++) {
      const daily = all.findLast((item) => Math.floor(item.storedMs / day) === bucket);
      assert.ok(daily && expected.has(daily.id));
    }
    // The pinned useful baseline survives after the daily window advances.
    const muchLater = { id: 'after-long-gap', sequence: ++sequence, storedMs: last.storedMs + 90 * day };
    const afterGap = retainedCheckpointIds([...retained, muchLater], muchLater.storedMs, firstNonemptyId, muchLater.id);
    assert.ok(afterGap.has(firstNonemptyId));
    assert.ok(afterGap.has(muchLater.id));
    assert.ok(afterGap.size <= 9);
  });
}

test('UTC bucket edges choose the newest server sequence, including equal timestamps', () => {
  const now = Date.UTC(2026, 5, 1, 0, 0);
  const items = [
    { id: 'baseline', sequence: 1, storedMs: now - 60 * day },
    { id: 'expired-day', sequence: 2, storedMs: now - 30 * day },
    { id: 'first-retained-day', sequence: 3, storedMs: now - 29 * day },
    { id: 'previous-hour', sequence: 4, storedMs: now - 1 },
    ...Array.from({ length: 10 }, (_, index) => ({ id: `now-${index}`, sequence: index + 5, storedMs: now })),
  ];
  const selected = retainedCheckpointIds(items, now, 'baseline', 'now-9');
  assert.ok(selected.has('baseline'));
  assert.ok(selected.has('first-retained-day'));
  assert.ok(selected.has('previous-hour'));
  assert.equal(selected.has('expired-day'), false);
  assert.equal(selected.has('now-0'), false);
  assert.ok(selected.has('now-9'));
});
