import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PathNode from '../components/learn/PathNode';
import { PATH_KIND_DETAILS } from '../lib/path-node-presentation';
import type {
  LearningPathNode,
  LearningPathNodeKind,
} from '../types/learning-path';

const KINDS: LearningPathNodeKind[] = [
  'letters',
  'vocab',
  'grammar',
  'sentence',
  'cloze',
  'listening',
  'dictation',
  'conjugation',
  'translation',
  'minimal-pairs',
  'numbers',
  'reading',
  'lyrics',
  'tests',
];

function node(
  kind: LearningPathNodeKind,
  overrides: Partial<LearningPathNode> = {},
): LearningPathNode {
  return {
    id: `${kind}:step`,
    kind,
    lessonId: `${kind}:step`,
    title: `${PATH_KIND_DETAILS[kind].label} step`,
    route: `/practice/${kind}`,
    state: 'available',
    unitId: 'current',
    ...overrides,
  };
}

describe('PathNode presentation', () => {
  it('defines a visible label, icon, and accessible status for every node kind', () => {
    expect(Object.keys(PATH_KIND_DETAILS).sort()).toEqual([...KINDS].sort());

    for (const kind of KINDS) {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <PathNode node={node(kind)} isLast position={0} />
        </MemoryRouter>,
      );

      expect(html).toContain(PATH_KIND_DETAILS[kind].label);
      expect(html).toContain(PATH_KIND_DETAILS[kind].emoji);
      expect(html).toContain('Also available');
      expect(html).toContain(`${PATH_KIND_DETAILS[kind].label}. Also available.`);
    }
  });

  it('presents enrichment as optional exploration rather than required work', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PathNode
          node={node('reading', { requirement: 'enrichment' })}
          isLast
          position={0}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('Reading · Explore');
    expect(html).toContain('Optional enrichment. Explore.');
    expect(html).not.toContain('Also available');
    expect(html).not.toContain('bg-indigo-50');
  });

  it('renders locked steps as non-interactive status rows', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PathNode
          node={node('grammar', { state: 'locked' })}
          isLast
          position={0}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('Grammar · Locked');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('href=');
  });
});
