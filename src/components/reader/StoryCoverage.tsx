import { useEffect, useRef, useState } from 'react';
import type { KnowledgeLoadState } from '../../hooks/useKnowledge';
import { analyzeReaderText, loadReaderStory, scheduleReaderAnalysis } from '../../lib/reader-coverage';
import CoverageSummary, { type ReaderCoverageState } from './CoverageSummary';

export default function StoryCoverage({ text, storyId, language, knowledge, lazy = true }: {
  text?: string; storyId?: string; language: string; knowledge: KnowledgeLoadState; lazy?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!lazy);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ key: string; state: ReaderCoverageState }>();
  const key = `${language}\0${storyId ?? ''}\0${text ?? ''}\0${knowledge.snapshot?.revision ?? knowledge.status}\0${retry}`;
  useEffect(() => {
    if (visible) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Older browsers opt in rather than fetching an entire library at once.
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '100px' });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);
  useEffect(() => {
    if (!visible || knowledge.status !== 'ready' || knowledge.language !== language) return;
    let cancelled = false;
    void scheduleReaderAnalysis(async () => {
      if (cancelled) return;
      const content = text ?? await loadReaderStory(storyId!, language);
      if (cancelled) return;
      return analyzeReaderText(content, knowledge.snapshot);
    }).then((coverage) => {
      if (!cancelled && coverage) setResult({ key, state: { status: 'ready', coverage } });
    }, () => {
      if (!cancelled) setResult({ key, state: { status: 'error' } });
    });
    return () => { cancelled = true; };
  }, [key, visible, knowledge, text, storyId, language]);
  const state: ReaderCoverageState = !visible ? { status: 'idle' }
    : knowledge.status === 'error' ? { status: 'error' }
      : result?.key === key ? result.state : { status: 'loading' };
  return <div ref={ref} className="mt-2">
    <CoverageSummary state={state}
      errorMessage={knowledge.status === 'error' ? 'Learning evidence could not be loaded. Leave Reader and open it again to retry. You can still read.' : undefined}
      onRetry={knowledge.status === 'error' ? undefined : () => setRetry((value) => value + 1)} />
    {!visible && <button type="button" onClick={() => setVisible(true)}
      className="min-h-[44px] text-xs text-indigo-600 dark:text-indigo-400 underline">Estimate vocabulary</button>}
  </div>;
}
