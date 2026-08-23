import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Shell from '../components/layout/Shell';
import PathNode from '../components/learn/PathNode';
import type { LearningPathNode } from '../types/learning-path';

const NODE: LearningPathNode = {
  id: 'vocab:greetings',
  kind: 'vocab',
  lessonId: 'greetings',
  title: 'Greetings & Introductions',
  route: '/vocab-lessons?lesson=greetings',
  state: 'available',
  unitId: 'first-steps',
};

describe('Learn viewport contract', () => {
  it('uses the shared safe bottom clearance in the shell and navigation', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Shell />
      </MemoryRouter>,
    );

    expect(html).toContain('app-shell');
    expect(html).toContain('h-[var(--shell-bottom-clearance)]');
    expect(html).toContain('pb-[var(--safe-bottom)]');
  });

  it('keeps path focus targets clear of the fixed navigation', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PathNode node={NODE} isLast position={0} />
      </MemoryRouter>,
    );

    expect(html).toContain(
      'scroll-mb-[var(--shell-bottom-clearance)]',
    );
  });
});
