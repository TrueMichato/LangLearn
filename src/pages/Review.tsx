import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useReviewStore, type PracticeMode, type QueueItem } from '../stores/reviewStore';
import { useTimerStore } from '../stores/timerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useStudySetsStore } from '../stores/studySetsStore';
import { buildReviewSession, prepareReviewCards, reviewScopeLabel, type ReviewAttempt } from '../lib/review-session';
import { get7DayRetention } from '../lib/analytics';
import ReviewHome from '../components/srs/ReviewHome';
import ReviewSummary from '../components/srs/ReviewSummary';
import Flashcard from '../components/srs/Flashcard';
import ReverseCard from '../components/srs/ReverseCard';
import ListeningCard from '../components/srs/ListeningCard';
import MultipleChoiceCard from '../components/srs/MultipleChoiceCard';
import ClozeCard from '../components/srs/ClozeCard';
import GrammarCard from '../components/srs/GrammarCard';
import StudyCard from '../components/srs/StudyCard';
import GradeButtons from '../components/srs/GradeButtons';
import PracticeModeSelector from '../components/srs/PracticeModeSelector';
import { SkeletonFlashcard } from '../components/common/Skeleton';
import type { SM2Grade } from '../lib/sm2';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { hasBlank } from '../lib/grammar-cards';
import { isRuleRecallCard } from '../lib/grammar-review-scope';

const MODE_KEY = 'langlearn-practice-mode';
const MODES: PracticeMode[] = ['word-to-meaning', 'meaning-to-word', 'random', 'both'];
const MODE_LABELS: Record<PracticeMode, string> = {
  'word-to-meaning': 'Word → Meaning', 'meaning-to-word': 'Meaning → Word', random: 'Random', both: 'Both sides',
};
const TYPE_LABELS = {
  classic: 'Classic', reverse: 'Reverse', listening: 'Listening', 'multiple-choice': 'Pick the meaning',
  cloze: 'Fill in the blank', study: 'Study',
};
const secondary = 'min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700';

export function ReviewCardDirection({ current, mode, disabled, onChange }: {
  current: QueueItem; mode: PracticeMode | null; disabled: boolean; onChange: () => void;
}) {
  if (current.cardType === 'grammar') {
    const { grammarFormat, grammarKind, contextSentence } = current.word;
    return <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
      {grammarFormat !== 'qa' && hasBlank(contextSentence) ? 'Complete the blank' : grammarKind === 'concept' ? (isRuleRecallCard(current.word) ? 'Recall the rule' : 'Recall the concept') : 'Answer the question'}
    </span>;
  }
  return <button disabled={disabled} onClick={onChange}
    className="min-h-[44px] rounded-xl px-2 text-left text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700">
    {MODE_LABELS[mode ?? 'word-to-meaning']} · Change direction
  </button>;
}

function rememberedDirection(): PracticeMode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (MODES.includes(stored as PracticeMode)) return stored as PracticeMode;
  } catch { /* Storage is optional for recall direction. */ }
  return 'word-to-meaning';
}

export default function ReviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.toString();
  const { queue, currentIndex, cardsReviewed, isFlipped, practiceMode, isGrading } = useReviewStore();
  const [attempt, setAttempt] = useState<ReviewAttempt | null>(null);
  const [totalEligible, setTotalEligible] = useState(0);
  const [initialBatch, setInitialBatch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gradeError, setGradeError] = useState('');
  const [showDirection, setShowDirection] = useState(false);
  const [writingGrammar, setWritingGrammar] = useState(false);
  const [changingDirection, setChangingDirection] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [retention, setRetention] = useState<{ percent: number; reviewCount: number } | null>(null);
  const loadRevision = useRef(0);
  const grading = useRef(false);
  const lastGrade = useRef<SM2Grade>(4);
  const stopTimer = useTimerStore((state) => state.stop);

  const startSession = useCallback(async (nextAttempt: ReviewAttempt) => {
    const revision = ++loadRevision.current;
    setAttempt(nextAttempt);
    setLoading(true);
    setError('');
    setGradeError('');
    setShowDirection(false);
    setWritingGrammar(false);
    setChangingDirection(false);
    useReviewStore.getState().reset();
    try {
      await stopTimer();
      if (nextAttempt.source.type === 'set') useStudySetsStore.getState().ensureDefaults();
      const direction = useReviewStore.getState().practiceMode ?? rememberedDirection();
      const settings = useSettingsStore.getState();
      const result = await buildReviewSession(nextAttempt, {
        batchSize: settings.reviewBatchSize, adaptive: settings.adaptiveReview, direction,
      });
      if (revision !== loadRevision.current) return;
      useReviewStore.getState().setPracticeMode(direction);
      useReviewStore.getState().setQueue(result.items, nextAttempt.kind);
      setInitialBatch(result.items.length);
      setTotalEligible(result.totalEligible);
      setLoading(false);
    } catch (failure) {
      if (revision !== loadRevision.current) return;
      setError(failure instanceof Error ? failure.message : 'These cards could not be loaded. Please try again.');
      setLoading(false);
    }
  }, [stopTimer]);

  // Only navigation or an explicit Start/Retry creates a new queue. Settings,
  // direction changes and home counts must never silently rebuild an attempt.
  useEffect(() => {
    const params = new URLSearchParams(query);
    const setId = params.get('set');
    const deck = params.get('deck');
    const language = params.get('language') || undefined;
    const kind = params.get('session') === 'practice' ? 'practice' : 'scheduled';
    if (setId) {
      const set = useStudySetsStore.getState().sets.find((value) => value.id === setId);
      void startSession({ kind, source: { type: 'set', setId, language: language || set?.language }, label: set?.name ?? 'Study set' });
    } else if (deck === 'mistakes') {
      void startSession({ kind, source: { type: 'mistakes', language, languages: [...useSettingsStore.getState().activeLanguages] }, label: 'Fix your misses' });
    } else if (deck === 'topic' && params.get('topic')) {
      const topicId = params.get('topic')!;
      void startSession({ kind, source: { type: 'topic', topicId, language }, label: `Grammar: ${topicId}` });
    } else {
      ++loadRevision.current;
      useReviewStore.getState().reset();
      setAttempt(null);
      setLoading(false);
      setError('');
      void stopTimer();
    }
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- Monotonic async token, not a DOM ref.
      ++loadRevision.current;
      useReviewStore.getState().reset();
      void stopTimer();
    };
  }, [query, startSession, stopTimer]);

  const exitSession = useCallback(() => {
    ++loadRevision.current;
    useReviewStore.getState().reset();
    setAttempt(null);
    setLoading(false);
    setError('');
    setGradeError('');
    setShowDirection(false);
    setChangingDirection(false);
    void stopTimer();
    if (query) navigate('/review', { replace: true });
  }, [navigate, query, stopTimer]);

  const complete = !loading && !!attempt && queue.length > 0 && currentIndex >= queue.length;
  useEffect(() => {
    if (complete) void stopTimer();
  }, [complete, stopTimer]);

  const current = queue[currentIndex];
  const grade = useCallback(async (value: SM2Grade) => {
    const state = useReviewStore.getState();
    if (!current || !state.sessionKind || state.queue[state.currentIndex] !== current || grading.current || changingDirection || showDirection) return;
    grading.current = true;
    lastGrade.current = value;
    setGradeError('');
    const sessionId = useReviewStore.getState().sessionId;
    try {
      await useTimerStore.getState().start('srs');
      if (useReviewStore.getState().sessionId !== sessionId) return;
      const settings = useSettingsStore.getState();
      await useReviewStore.getState().gradeCurrent(value, {
        scheduler: settings.scheduler, requestRetention: settings.fsrsRequestRetention,
      }, current);
    } catch {
      if (useReviewStore.getState().sessionId === sessionId) {
        setGradeError('This answer could not be saved. Your card is still here. Please try again.');
      }
    } finally { grading.current = false; }
  }, [current, changingDirection, showDirection]);

  useEffect(() => {
    if (!showDirection) return;
    let live = true;
    get7DayRetention().then((value) => { if (live) setRetention(value); }).catch(() => { /* Optional context. */ });
    return () => { live = false; };
  }, [showDirection]);

  async function changeDirection(mode: PracticeMode) {
    const revision = ++loadRevision.current;
    setChangingDirection(true);
    setGradeError('');
    const snapshot = useReviewStore.getState();
    try {
      const items = await prepareReviewCards(snapshot.queue, mode);
      const live = useReviewStore.getState();
      if (revision !== loadRevision.current || snapshot.sessionId !== live.sessionId || snapshot.currentIndex !== live.currentIndex) return;
      useReviewStore.setState({ queue: items, practiceMode: mode, isFlipped: false });
      try { localStorage.setItem(MODE_KEY, mode); } catch { /* Direction persistence is optional. */ }
      setShowDirection(false);
    } catch {
      if (revision === loadRevision.current) setGradeError('The recall direction could not be changed. Choose it again to retry.');
    } finally {
      if (revision === loadRevision.current) setChangingDirection(false);
    }
  }

  function cancelDirection() {
    ++loadRevision.current;
    setChangingDirection(false);
    setShowDirection(false);
  }

  const selfGrading = current?.cardType === 'multiple-choice' || current?.cardType === 'cloze';
  const shortcuts: Record<string, () => void> = { Escape: showDirection ? cancelDirection : exitSession };
  if (current && !showDirection && !changingDirection) {
    if (!selfGrading && current.cardType !== 'study' && !isFlipped) shortcuts.Space = useReviewStore.getState().flip;
    if (!selfGrading && (isFlipped || current.cardType === 'study')) {
      for (const [key, value] of Object.entries({ '1': 0, '2': 3, '3': 4, '4': 5 })) {
        shortcuts[key] = () => { void grade(value as SM2Grade); };
      }
    }
  }
  useKeyboardShortcuts(shortcuts, !!attempt && !loading && !isGrading);

  if (!attempt) return <ReviewHome onStart={(value) => { void startSession(value); }} showAll={showAll} onShowAll={setShowAll} focusSets={searchParams.get('view') === 'sets'} />;

  if (loading) return <div className="space-y-4"><p role="status" className="text-slate-500 dark:text-slate-400">Preparing {attempt.kind === 'practice' ? 'practice' : 'reviews'}…</p><SkeletonFlashcard /><button onClick={exitSession} className={secondary}>Back to Review</button></div>;
  if (error) return <div role="alert" className="space-y-4 text-slate-700 dark:text-slate-200"><h1 className="text-xl font-semibold">Let's try that again</h1><p>{error}</p><div className="flex flex-wrap gap-2"><button onClick={() => { void startSession(attempt); }} className={secondary}>Retry loading</button><button onClick={exitSession} className={secondary}>Back to Review</button></div></div>;
  if (!queue.length) return <ReviewSummary empty attempt={attempt} cardsReviewed={0} onStart={(value) => { void startSession(value); }} onExit={exitSession} />;
  if (complete) return <ReviewSummary attempt={attempt} cardsReviewed={cardsReviewed} onStart={(value) => { void startSession(value); }} onExit={exitSession} />;
  if (showDirection) return (
    <div>
      <button onClick={cancelDirection} className={secondary}>Back to cards</button>
      <div inert={changingDirection}><PracticeModeSelector onSelect={(mode) => { void changeDirection(mode); }} retention={retention} /></div>
      {changingDirection && <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Changing recall direction…</p>}
      {gradeError && <p role="alert" className="text-sm text-slate-700 dark:text-slate-200">{gradeError}</p>}
    </div>
  );
  const canGrade = !selfGrading && (isFlipped || current.cardType === 'study');
  const onGrade = (value: SM2Grade) => { void grade(value); };

  return (
    <div>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{attempt.kind === 'practice' ? 'Practice' : 'Review'}</h1>
          <p className="break-words text-sm text-slate-500 dark:text-slate-400">{attempt.label}</p>
          {attempt.label !== reviewScopeLabel(attempt.source) && <p className="text-xs text-slate-500 dark:text-slate-400">{reviewScopeLabel(attempt.source)}</p>}
          <p className="text-xs text-slate-500 dark:text-slate-400">{initialBatch} of {totalEligible} {attempt.kind === 'practice' ? 'available' : attempt.source.type === 'mistakes' || attempt.source.type === 'topic' ? 'focused' : 'due'} card{totalEligible === 1 ? '' : 's'}</p>
        </div>
        <button onClick={exitSession} aria-label={`Exit ${attempt.kind === 'practice' ? 'practice' : 'review'}`}
          className="min-h-[44px] shrink-0 rounded-xl px-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Exit</button>
      </header>
      <div className="mb-3 flex items-center justify-between gap-2">
        <ReviewCardDirection current={current} mode={practiceMode} disabled={isGrading || changingDirection} onChange={() => setShowDirection(true)} />
        <span className="shrink-0 text-sm text-slate-500 dark:text-slate-400">{currentIndex + 1} / {queue.length}</span>
      </div>
      <div aria-hidden="true" className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400 transition-[width] duration-300" style={{ width: `${currentIndex / queue.length * 100}%` }} />
      </div>
      {current.cardType !== 'grammar' && <p className="mb-2 text-center text-xs text-slate-500 dark:text-slate-400">{TYPE_LABELS[current.cardType]}</p>}
      <div key={`${useReviewStore.getState().sessionId}-${currentIndex}-${practiceMode}`} inert={isGrading} aria-busy={isGrading}>
        {current.cardType === 'study' && <StudyCard word={current.word} />}
        {current.cardType === 'classic' && <Flashcard word={current.word} isFlipped={isFlipped} onFlip={useReviewStore.getState().flip} />}
        {current.cardType === 'reverse' && <ReverseCard word={current.word} isFlipped={isFlipped} onFlip={useReviewStore.getState().flip} />}
        {current.cardType === 'listening' && <ListeningCard word={current.word} isFlipped={isFlipped} onFlip={useReviewStore.getState().flip} />}
        {current.cardType === 'grammar' && <GrammarCard word={current.word} isFlipped={isFlipped} onFlip={useReviewStore.getState().flip}
          writing={writingGrammar} onWritingChange={setWritingGrammar} />}
        {current.cardType === 'multiple-choice' && <MultipleChoiceCard word={current.word} distractors={current.distractors!} onGrade={onGrade} />}
        {current.cardType === 'cloze' && <ClozeCard word={current.word} onGrade={onGrade} />}
        {canGrade && <GradeButtons onGrade={onGrade} />}
      </div>
      {gradeError && <div role="alert" className="mt-3 text-sm text-slate-700 dark:text-slate-200"><p>{gradeError}</p><button className={secondary} onClick={() => { void grade(lastGrade.current); }}>Retry answer</button></div>}
      <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
        {attempt.kind === 'practice' ? "Practice won't change your review dates. Missed cards repeat in this session." : "No worries if you didn't know — it'll come back later."}
      </p>
      <p className="mt-2 hidden text-center text-xs text-slate-500 dark:text-slate-400 sm:block">Space: flip · 1–4: grade · Esc: exit</p>
    </div>
  );
}
