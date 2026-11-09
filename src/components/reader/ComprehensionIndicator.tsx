import { useKnowledge, type KnowledgeLoadState } from '../../hooks/useKnowledge';
import StoryCoverage from './StoryCoverage';
import type { WordStatusMap } from '../../lib/word-status';

export default function ComprehensionIndicator(props: {
  text: string; language: string; highlightEnabled: boolean; onToggleHighlight: () => void;
  wordStatusMap?: WordStatusMap;
  knowledge?: KnowledgeLoadState;
}) {
  if (props.knowledge) return <Indicator {...props} knowledge={props.knowledge} />;
  return <StandaloneIndicator {...props} />;
}

function StandaloneIndicator(props: Parameters<typeof ComprehensionIndicator>[0]) {
  const { language } = props;
  const knowledge = useKnowledge(language);
  return <Indicator {...props} knowledge={knowledge} />;
}
function Indicator({ text, language, highlightEnabled, onToggleHighlight, knowledge }: Parameters<typeof ComprehensionIndicator>[0] & { knowledge: KnowledgeLoadState }) {
  return <section aria-label="Vocabulary coverage" className="mb-3">
    <StoryCoverage text={text} language={language} knowledge={knowledge} lazy={false} />
    <button type="button" onClick={onToggleHighlight} aria-pressed={highlightEnabled}
      className="min-h-[44px] text-sm text-indigo-600 dark:text-indigo-400">
      {highlightEnabled ? 'Hide word familiarity' : 'Highlight word familiarity'}
    </button>
  </section>;
}
