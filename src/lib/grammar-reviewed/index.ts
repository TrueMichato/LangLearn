import { reviewed as ar } from './ar';
import { reviewed as es } from './es';
import { reviewed as ja } from './ja';
import { reviewed as pt } from './pt';
import { reviewed as ro } from './ro';
import { reviewed as ru } from './ru';

// One file per language, so each language's rollout lands without touching the others.
export const REVIEWED_GRAMMAR_LESSONS: Readonly<Record<string, readonly string[]>> = { ru, ja, ar, es, pt, ro };
