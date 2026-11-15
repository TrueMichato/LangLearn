import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import DictionaryModal from '../components/dictionary/DictionaryModal';
import OnboardingOverlay from '../components/onboarding/OnboardingOverlay';
import AddWordModal from '../components/srs/AddWordModal';

function expectNamedDialog(html: string, title: string) {
  const labelId = html.match(/role="dialog"[^>]*aria-labelledby="([^"]+)"/)?.[1];
  expect(labelId).toBeDefined();
  expect(html).toContain('aria-modal="true"');
  expect(html).toContain(`id="${labelId}"`);
  expect(html).toContain(title);
}

function expectAssociatedField(html: string, name: string) {
  const field = html.match(new RegExp(`<(?:input|select)\\b[^>]*name="${name}"[^>]*>`))?.[0];
  const id = field?.match(/\bid="([^"]+)"/)?.[1];
  expect(id).toBeDefined();
  expect(html).toContain(`for="${id}"`);
  return field;
}

describe('modal accessibility markup (not browser focus behavior)', () => {
  it('names the dictionary and persistently labels its search and language fields', () => {
    const html = renderToStaticMarkup(<DictionaryModal isOpen onClose={() => {}} />);
    expectNamedDialog(html, 'Dictionary');
    expectAssociatedField(html, 'dictionarySearch');
    expectAssociatedField(html, 'dictionaryLanguage');
    expect(html).toContain('Search dictionary</label>');
    expect(html).toMatch(/<button[^>]*min-h-\[44px\][^>]*min-w-\[44px\][^>]*aria-label="Close dictionary"/);
    expect(renderToStaticMarkup(<DictionaryModal isOpen={false} onClose={() => {}} />)).toBe('');
  });

  it('makes Add Word a named keyboard destination without changing its initial values', () => {
    const html = renderToStaticMarkup(<AddWordModal isOpen onClose={() => {}} />);
    expectNamedDialog(html, 'Add Word');
    ['wordLanguage', 'word', 'reading', 'meaning', 'tags'].forEach((name) => {
      expectAssociatedField(html, name);
    });
    expect(html).toContain('aria-label="Close add word"');
    expect(html).toContain('aria-label="Look up word"');
    expect(expectAssociatedField(html, 'word')).toContain('aria-required="true"');
    expect(expectAssociatedField(html, 'meaning')).toContain('aria-required="true"');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Add<\/button>/);
    expect(renderToStaticMarkup(<AddWordModal isOpen={false} onClose={() => {}} />)).toBe('');
  });

  it('names onboarding from its current focusable heading and makes every off-slide panel inert', () => {
    const html = renderToStaticMarkup(<MemoryRouter><OnboardingOverlay /></MemoryRouter>);
    expectNamedDialog(html, 'Welcome to LangLearn');
    expect(html).toContain('Step 1 of 4.');
    expect(html).toMatch(/<h1[^>]*id="[^"]+-step-0"[^>]*tabindex="-1"/);
    expect(html.match(/aria-hidden="true" inert=""/g)).toHaveLength(3);
    expect(html).toContain('aria-hidden="false"');
    expect(html).toContain('overflow-y-auto');
  });
});
