import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GuidedLearning from '../components/letters/GuidedLearning';
import { getAlphabetsForLanguage } from '../data/alphabets';
import { getOrderedGuidedGroups, resolveGuidedGroupEntry } from '../lib/guided-learning-progress';

const alphabet = getAlphabetsForLanguage('ja')[0];
const groups = getOrderedGuidedGroups(alphabet.characters.map((character) => character.group));
const stored = new Map<string, string>();

beforeEach(() => {
  stored.clear();
  vi.stubGlobal('localStorage', { getItem: (key: string) => stored.get(key) ?? null });
});
afterEach(() => vi.unstubAllGlobals());

function render(group?: string) {
  return renderToStaticMarkup(
    <GuidedLearning
      characters={alphabet.characters}
      language="ja"
      alphabetName={alphabet.name}
      requestedGroup={group}
      onProgress={() => {}}
    />,
  );
}

describe('direct guided teaching entry', () => {
  it('opens the actual first card rather than another column inventory', () => {
    const html = render('next');
    expect(html).toContain('>あ</p>');
    expect(html).not.toContain('Column by Column');
    expect(html).toMatch(/<button[^>]*min-h-\[44px\][^>]*>\s*← Back to columns/);
    expect(stored.size).toBe(0);
  });

  it('uses the next unlocked group and keeps completed groups available', () => {
    stored.set('langlearn-guided-ja-Hiragana', JSON.stringify(['Vowels']));
    expect(render('next')).toContain('>か</p>');
    expect(render('Vowels')).toContain('>あ</p>');
    expect(resolveGuidedGroupEntry('next', groups, new Set(groups)).group).toBe('Vowels');
  });

  it.each(['K-row', 'not-a-column', '0', ''])('rejects locked or malformed group %j rather than bypassing teaching gates', (group) => {
    const html = render(group);
    expect(html).toContain('role="alert"');
    expect(html).toContain('Column by Column');
    expect(html).not.toContain('← Back to columns');
    expect(resolveGuidedGroupEntry(group, groups, new Set()).group).toBe('');
  });

  it('preserves the independent column browser when group is omitted', () => {
    const html = render();
    expect(html).toContain('Column by Column');
    expect(html).toContain('K-row');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('← Back to columns');
  });
});
