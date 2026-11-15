import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { HomeActionPanel } from '../components/dashboard/HomeNextAction';
import DashboardProgress from '../components/dashboard/DashboardProgress';
import { loadHomeLearningState, resolveHomePrimaryAction, type HomeLearningState } from '../lib/home-primary-action';
import { loadLatestVocabAttemptSummary, type VocabAttemptSummary } from '../lib/vocab-lesson-attempt';
import { loadLearningPath } from '../lib/learning-path';
import type { LearningPath } from '../types/learning-path';
import type { DashboardActivity } from '../lib/dashboard-gates';

vi.mock('../lib/vocab-lesson-attempt', () => ({ loadLatestVocabAttemptSummary: vi.fn() }));
vi.mock('../lib/learning-path', () => ({ loadLearningPath: vi.fn() }));

const saved: VocabAttemptSummary = {
  language: 'es', lessonId: 'saved-lesson', attemptId: 'saved-attempt', title: 'Greetings',
  stage: 'Words', position: 4, itemCount: 15, updatedAt: 1234,
  route: '/vocab-lessons?lesson=saved-lesson',
};
const path: LearningPath = {
  language: 'es', completedCount: 1, totalCount: 3, completedAheadCount: 0,
  recommendedNodeId: 'vocab:next-lesson', testOutOptions: [],
  units: [{
    id: 'foundations', title: 'Foundations', description: '', strands: [], checkpoints: [],
    nodes: [
      { id: 'earlier', kind: 'grammar', lessonId: 'earlier', title: 'Earlier', route: '/grammar?lesson=earlier', state: 'completed', unitId: 'foundations' },
      { id: 'vocab:next-lesson', kind: 'vocab', lessonId: 'vocab/next-lesson', title: 'Everyday words', route: '/vocab-lessons?lesson=next-lesson', state: 'available', unitId: 'foundations' },
      { id: 'locked', kind: 'grammar', lessonId: 'later', title: 'Later', route: '/grammar?lesson=later', state: 'locked', unitId: 'foundations' },
    ],
  }],
};
const ready: HomeLearningState = { status: 'ready', attempt: saved, path };
const blank = { totalWords: 0, totalStudySeconds: 0, lessonsTouched: 0, bonusXP: 0 };
const renderPanel = (learning: HomeLearningState, dueCards = 0, language = 'es') => renderToStaticMarkup(
  <MemoryRouter><HomeActionPanel dueCards={dueCards} language={language} learning={learning} onRetry={() => {}} /></MemoryRouter>,
);

beforeEach(() => vi.resetAllMocks());

describe('Home primary action', () => {
  it('prioritizes due reviews over the saved attempt and preserves the existing unscoped Review route', () => {
    expect(resolveHomePrimaryAction({ dueCards: 2, language: 'es', learning: ready })).toMatchObject({ kind: 'due', route: '/review' });
    const html = renderPanel(ready, 2);
    expect(html.indexOf('Open due reviews')).toBeLessThan(html.indexOf('Resume lesson'));
    expect(html).toContain('href="/review"');
    expect(html).toContain('href="/vocab-lessons?lesson=saved-lesson"');
    expect(html).toContain('Words · 4 of 15');
  });

  it('resumes the exact current-language lesson before choosing any path node', () => {
    expect(resolveHomePrimaryAction({ dueCards: 0, language: 'es', learning: ready })).toMatchObject({
      kind: 'resume', route: saved.route, label: 'Resume lesson',
    });
    const html = renderPanel(ready);
    expect(html).toContain('Spanish · Words · 4 of 15');
    expect(html).toContain('No reviews are due right now.');
    expect(html).not.toContain('All caught up');
    expect(html).not.toContain('Everyday words');
  });

  it('uses the canonical recommended node and its direct instructional route, not a catalog', () => {
    const action = resolveHomePrimaryAction({ dueCards: 0, language: 'es', learning: { status: 'ready', attempt: null, path } });
    expect(action).toMatchObject({ kind: 'path', title: 'Next: Everyday words', route: '/vocab-lessons?lesson=next-lesson' });
    const scriptPath: LearningPath = {
      ...path, language: 'ar', recommendedNodeId: 'letters:Arabic',
      units: [{ ...path.units[0], nodes: [{
        id: 'letters:Arabic', kind: 'letters', lessonId: 'letters/Arabic', title: 'Arabic letters',
        route: '/letters/ar?mode=learn&alphabet=Arabic&group=next', state: 'available', unitId: 'foundations',
      }] }],
    };
    expect(resolveHomePrimaryAction({ dueCards: 0, language: 'ar', learning: { status: 'ready', attempt: null, path: scriptPath } }))
      .toMatchObject({ kind: 'path', route: '/letters/ar?mode=learn&alphabet=Arabic&group=next' });
  });

  it('labels unconfirmed completion as finishing rather than starting another lesson', () => {
    const html = renderPanel({ status: 'ready', attempt: { ...saved, stage: 'Finishing lesson', position: 1, itemCount: 1 }, path: null });
    expect(html).toContain('Finish Greetings');
    expect(html).toContain('Finish lesson');
    expect(html).toContain('completion to be confirmed');
    expect(html).not.toContain('Start this step');
  });

  it('does not expose a stale language attempt or path while a language change loads', () => {
    expect(resolveHomePrimaryAction({ dueCards: 0, language: 'ja', learning: ready }).kind).toBe('loading');
    const html = renderPanel(ready, 0, 'ja');
    expect(html).not.toContain(saved.route);
    expect(html).not.toContain('Resume lesson');
    expect(resolveHomePrimaryAction({ dueCards: 0, language: 'ja', learning: { status: 'ready', attempt: null, path } }).kind).toBe('loading');
  });

  it('keeps loading and unreadable saved state distinct from no attempt, with explicit recovery', () => {
    const loading = renderPanel({ status: 'loading' });
    expect(loading).toContain('role="status"');
    expect(loading).not.toContain('Start this step');
    const error = renderPanel({ status: 'error' });
    expect(error).toContain('Retry loading your next step');
    expect(error).not.toContain('Start this step');
    const dueWithError = renderPanel({ status: 'error' }, 2);
    expect(dueWithError).toContain('Open due reviews');
    expect(dueWithError).toContain('Retry loading your next step');
  });

  it('does not mistake a locked or unresolved next step for a completed path', () => {
    expect(resolveHomePrimaryAction({
      dueCards: 0, language: 'es', learning: { status: 'ready', attempt: null, path: { ...path, recommendedNodeId: 'locked' } },
    }).kind).toBe('error');
    expect(resolveHomePrimaryAction({
      dueCards: 0, language: 'es', learning: { status: 'ready', attempt: null, path: { ...path, recommendedNodeId: null } },
    }).kind).toBe('error');
  });

  it('names unsupported languages rather than inventing another language’s lessons', () => {
    const html = renderPanel({ status: 'ready', attempt: null, path: null }, 0, 'xx');
    expect(html).toContain('No guided lessons for');
    expect(html).not.toContain('/vocab-lessons');
    expect(html).not.toContain('/letters/');
  });
});

describe('Home continuation loading', () => {
  it('only loads the path after confirming that the current language has no saved attempt', async () => {
    vi.mocked(loadLatestVocabAttemptSummary).mockResolvedValue(saved);
    expect(await loadHomeLearningState('es')).toEqual({ status: 'ready', attempt: saved, path: null });
    expect(loadLatestVocabAttemptSummary).toHaveBeenCalledWith('es');
    expect(loadLearningPath).not.toHaveBeenCalled();
    vi.mocked(loadLatestVocabAttemptSummary).mockResolvedValue(null);
    vi.mocked(loadLearningPath).mockResolvedValue(path);
    expect(await loadHomeLearningState('es')).toEqual({ status: 'ready', attempt: null, path });
    expect(loadLearningPath).toHaveBeenCalledWith('es');
  });

  it('propagates read errors without treating an unreadable saved attempt as fresh progress', async () => {
    vi.mocked(loadLatestVocabAttemptSummary).mockRejectedValue(new Error('Storage unavailable'));
    await expect(loadHomeLearningState('es')).rejects.toThrow('Storage unavailable');
    expect(loadLearningPath).not.toHaveBeenCalled();
    vi.mocked(loadLatestVocabAttemptSummary).mockResolvedValue(null);
    vi.mocked(loadLearningPath).mockRejectedValue(new Error('Offline'));
    await expect(loadHomeLearningState('es')).rejects.toThrow('Offline');
  });
});

describe('early Home progress', () => {
  const renderProgress = (activity: DashboardActivity = blank, totalXP = 0) => renderToStaticMarkup(
    <MemoryRouter><DashboardProgress activity={activity} totalXP={totalXP} /></MemoryRouter>,
  );
  it('has nothing to instrument before the learner begins', () => {
    expect(renderProgress()).toBe('');
  });
  it('keeps genuine earned XP and badges reachable without rounded-to-zero metrics', () => {
    const html = renderProgress({ ...blank, totalStudySeconds: 8, bonusXP: 25, earnedBadges: 1 }, 25);
    expect(html).toContain('8s studied');
    expect(html).toContain('25 XP earned');
    expect(html).toContain('1 badge earned');
    expect(html).toContain('href="/achievements"');
    expect(html).not.toMatch(/0m|0 saved cards|0 XP|0 badge/);
    expect(renderProgress(blank, 10)).toContain('10 XP earned');
  });
  it('describes saved cards without claiming that every card is learned lexical vocabulary', () => {
    const html = renderProgress({ ...blank, totalWords: 1 });
    expect(html).toContain('1 saved card');
    expect(html).not.toContain('Words Learned');
  });
});
