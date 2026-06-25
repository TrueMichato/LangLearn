import { getMistakeCount } from './mistakes';
import { getTopicRetention, type TopicRetention } from './grammar-topics';
import { getWeakestWords } from './analytics';

export interface FocusCTA {
  id: string;
  title: string;
  reason: string;
  icon: string;
  route: string;
}

const WEAK_TOPIC_RETENTION_MAX = 60;
const MIN_TOPIC_CARDS = 3;

/**
 * Pure helper: choose the single most helpful "what next?" action from already
 * aggregated signals. Kind framing only — never implies failure.
 * Returns null when there's nothing pressing (caller shows an encouraging state).
 */
export function pickNextFocus(input: {
  mistakeCount: number;
  weakestTopic?: { topicId: string; retentionPercent: number; cardCount: number };
  weakestWordCount: number;
}): FocusCTA | null {
  const { mistakeCount, weakestTopic, weakestWordCount } = input;

  if (mistakeCount > 0) {
    return {
      id: 'mistakes',
      title: 'Fix your misses',
      reason: `${mistakeCount} card${mistakeCount === 1 ? '' : 's'} to revisit — a quick win`,
      icon: '💛',
      route: '/review?deck=mistakes',
    };
  }

  if (
    weakestTopic &&
    weakestTopic.cardCount >= MIN_TOPIC_CARDS &&
    weakestTopic.retentionPercent < WEAK_TOPIC_RETENTION_MAX
  ) {
    return {
      id: 'topic',
      title: `Focus on ${weakestTopic.topicId}`,
      reason: `${weakestTopic.retentionPercent}% retention — some extra practice will help`,
      icon: '🎯',
      route: `/review?deck=topic&topic=${encodeURIComponent(weakestTopic.topicId)}`,
    };
  }

  if (weakestWordCount > 0) {
    return {
      id: 'weak-words',
      title: 'Strengthen tricky words',
      reason: 'Give your weakest cards a little more love',
      icon: '💪',
      route: '/review',
    };
  }

  return null;
}

function weakestOf(topics: TopicRetention[]): TopicRetention | undefined {
  return topics
    .filter((t) => t.cardCount >= MIN_TOPIC_CARDS)
    .sort((a, b) => a.retentionPercent - b.retentionPercent)[0];
}

/** Load signals and choose the most helpful next action for the Analytics CTA. */
export async function getNextFocus(
  languages: string[],
  selectedLang?: string
): Promise<FocusCTA | null> {
  const langs = selectedLang ? [selectedLang] : languages;

  const [mistakeCount, weakest, topics] = await Promise.all([
    getMistakeCount(langs),
    getWeakestWords(3, selectedLang),
    selectedLang
      ? getTopicRetention(selectedLang)
      : Promise.all(languages.map((l) => getTopicRetention(l))).then((a) => a.flat()),
  ]);

  const weakestTopic = weakestOf(topics);

  return pickNextFocus({
    mistakeCount,
    weakestTopic: weakestTopic
      ? {
          topicId: weakestTopic.topicId,
          retentionPercent: weakestTopic.retentionPercent,
          cardCount: weakestTopic.cardCount,
        }
      : undefined,
    weakestWordCount: weakest.length,
  });
}
