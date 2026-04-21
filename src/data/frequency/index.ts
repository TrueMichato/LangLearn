import { jaFrequencyMap } from './ja-frequency';
import { ruFrequencyMap } from './ru-frequency';

export function getFrequencyRank(word: string, language: string): number | undefined {
  switch (language) {
    case 'ja': return jaFrequencyMap.get(word);
    case 'ru': return ruFrequencyMap.get(word);
    default: return undefined;
  }
}

export type FrequencyTier = 'essential' | 'common' | 'intermediate' | 'advanced' | 'unknown';

export function getFrequencyTier(rank: number | undefined): FrequencyTier {
  if (!rank) return 'unknown';
  if (rank <= 100) return 'essential';
  if (rank <= 500) return 'common';
  if (rank <= 1500) return 'intermediate';
  return 'advanced';
}

export function getFrequencyLabel(tier: string): string {
  switch (tier) {
    case 'essential': return '⭐ Top 100';
    case 'common': return '📗 Top 500';
    case 'intermediate': return '📘 Top 1500';
    case 'advanced': return '📕 Advanced';
    default: return '';
  }
}

export { jaFrequencyMap } from './ja-frequency';
export { ruFrequencyMap } from './ru-frequency';
