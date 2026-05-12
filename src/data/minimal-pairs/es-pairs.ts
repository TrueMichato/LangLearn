import type { MinimalPair } from './ja-pairs';

// Spanish minimal pairs — Latin American / neutral
// Inspired by StudySpanish pronunciation lessons and classic L2-Spanish phonetic exercises.
export const esMinimalPairs: MinimalPair[] = [
  // Rolled R (r vs rr) — the most famous Spanish contrast
  { id: 'es-1', wordA: 'pero', wordB: 'perro', readingA: 'PEH-roh', readingB: 'PEH-rroh', meaningA: 'but', meaningB: 'dog', hint: 'Single r (tap) vs rr (trill) — the most famous Spanish minimal pair.', category: 'rolled' },
  { id: 'es-2', wordA: 'caro', wordB: 'carro', readingA: 'KAH-roh', readingB: 'KAH-rroh', meaningA: 'expensive', meaningB: 'car', hint: 'Single r (tap) vs rr (trill).', category: 'rolled' },
  { id: 'es-3', wordA: 'coro', wordB: 'corro', readingA: 'KOH-roh', readingB: 'KOH-rroh', meaningA: 'choir', meaningB: 'I run', hint: 'Single r (tap) vs rr (trill).', category: 'rolled' },
  { id: 'es-4', wordA: 'para', wordB: 'parra', readingA: 'PAH-rah', readingB: 'PAH-rrah', meaningA: 'for / stops', meaningB: 'grapevine', hint: 'Single r (tap) vs rr (trill).', category: 'rolled' },
  { id: 'es-5', wordA: 'cero', wordB: 'cerro', readingA: 'SEH-roh', readingB: 'SEH-rroh', meaningA: 'zero', meaningB: 'hill', hint: 'Single r (tap) vs rr (trill).', category: 'rolled' },

  // LL vs Y (yeísmo) — merged in most dialects, distinguished in some
  { id: 'es-6', wordA: 'pollo', wordB: 'poyo', readingA: 'POH-yoh', readingB: 'POH-yoh', meaningA: 'chicken', meaningB: 'stone bench', hint: 'll vs y — identical in yeísmo dialects (most of LatAm/Spain), but historically distinct.', category: 'yeismo' },
  { id: 'es-7', wordA: 'calló', wordB: 'cayó', readingA: 'kah-YOH', readingB: 'kah-YOH', meaningA: 'he/she silenced', meaningB: 'he/she fell', hint: 'll vs y — homophones in yeísmo; meaning distinguished only by context.', category: 'yeismo' },
  { id: 'es-8', wordA: 'valla', wordB: 'vaya', readingA: 'BAH-yah', readingB: 'BAH-yah', meaningA: 'fence', meaningB: 'go (subjunctive)', hint: 'll vs y — homophones in yeísmo dialects.', category: 'yeismo' },

  // B vs V — identical sounds in modern Spanish
  { id: 'es-9', wordA: 'baca', wordB: 'vaca', readingA: 'BAH-kah', readingB: 'BAH-kah', meaningA: 'roof rack', meaningB: 'cow', hint: 'b vs v are pronounced identically in modern Spanish — only spelling differs.', category: 'b-v' },
  { id: 'es-10', wordA: 'bote', wordB: 'vote', readingA: 'BOH-teh', readingB: 'BOH-teh', meaningA: 'boat / jar', meaningB: 'vote (subjunctive)', hint: 'b vs v — same sound, different spelling.', category: 'b-v' },
  { id: 'es-11', wordA: 'haber', wordB: 'a ver', readingA: 'ah-BEHR', readingB: 'ah-BEHR', meaningA: 'to have (aux)', meaningB: 'let\'s see', hint: 'Homophones — b/v identical, and the word boundary is inaudible.', category: 'b-v' },

  // C / Z / S sibilants — distinción (Spain) vs seseo (LatAm)
  { id: 'es-12', wordA: 'casa', wordB: 'caza', readingA: 'KAH-sah', readingB: 'KAH-thah', meaningA: 'house', meaningB: 'hunt', hint: 's vs z — distinguished in Spain (th sound), identical in LatAm (seseo).', category: 'c-z-s' },
  { id: 'es-13', wordA: 'caso', wordB: 'cazo', readingA: 'KAH-soh', readingB: 'KAH-thoh', meaningA: 'case', meaningB: 'saucepan / I hunt', hint: 's vs z — th in Spain, merged in LatAm.', category: 'c-z-s' },
  { id: 'es-14', wordA: 'cien', wordB: 'sien', readingA: 'THYEHN', readingB: 'SYEHN', meaningA: 'hundred', meaningB: 'temple (head)', hint: 'c (before e/i) vs s — th in Spain, merged in LatAm.', category: 'c-z-s' },
  { id: 'es-15', wordA: 'coser', wordB: 'cocer', readingA: 'koh-SEHR', readingB: 'koh-THEHR', meaningA: 'to sew', meaningB: 'to cook / boil', hint: 's vs c (before e) — th in Spain, merged in LatAm.', category: 'c-z-s' },

  // N vs Ñ — always distinguished
  { id: 'es-16', wordA: 'año', wordB: 'ano', readingA: 'AH-nyoh', readingB: 'AH-noh', meaningA: 'year', meaningB: 'anus', hint: 'ñ (ny) vs n — critical distinction; the tilde matters!', category: 'n-ñ' },
  { id: 'es-17', wordA: 'mañana', wordB: 'manana', readingA: 'mah-NYAH-nah', readingB: 'mah-NAH-nah', meaningA: 'tomorrow / morning', meaningB: '(not a word)', hint: 'ñ (ny) vs n — "manana" without the tilde is meaningless in Spanish.', category: 'n-ñ' },

  // Accent / stress shift
  { id: 'es-18', wordA: 'papa', wordB: 'papá', readingA: 'PAH-pah', readingB: 'pah-PAH', meaningA: 'pope / potato', meaningB: 'dad', hint: 'Stress on first vs last syllable — the accent mark changes meaning.', category: 'accent-stress' },
  { id: 'es-19', wordA: 'esta', wordB: 'está', readingA: 'EHS-tah', readingB: 'ehs-TAH', meaningA: 'this (demonstrative)', meaningB: 'is (estar)', hint: 'Stress on first vs last syllable — accent mark distinguishes word class.', category: 'accent-stress' },
  { id: 'es-20', wordA: 'termino', wordB: 'terminó', readingA: 'tehr-MEE-noh', readingB: 'tehr-mee-NOH', meaningA: 'I finish', meaningB: 'he/she finished', hint: 'Stress shift changes person and tense — present 1st vs preterite 3rd.', category: 'accent-stress' },

  // v2 additions
  { id: 'es-21', wordA: 'cabo', wordB: 'cavo', readingA: 'KAH-boh', readingB: 'KAH-boh', meaningA: 'cape, end', meaningB: 'I dig', hint: 'b vs v — pronounced identically in modern Spanish but spelled differently (common spelling pitfall).', category: 'b-v' },
  { id: 'es-22', wordA: 'bota', wordB: 'vota', readingA: 'BOH-tah', readingB: 'BOH-tah', meaningA: 'boot', meaningB: 'he/she votes', hint: 'b vs v — homophones; only context distinguishes them.', category: 'b-v' },
  { id: 'es-23', wordA: 'sabia', wordB: 'savia', readingA: 'SAH-byah', readingB: 'SAH-byah', meaningA: 'wise (fem.)', meaningB: 'sap (of a plant)', hint: 'b vs v — identical pronunciation [ˈsa.βja]; the spelling is the only clue.', category: 'b-v' },
  { id: 'es-24', wordA: 'casar', wordB: 'cazar', readingA: 'kah-SAR', readingB: 'kah-SAR', meaningA: 'to marry', meaningB: 'to hunt', hint: 's vs z — merged in LatAm seseo (both kah-SAR); distinguished in Spain (kah-THAR).', category: 'c-z-s' },
  { id: 'es-25', wordA: 'cocer', wordB: 'coser', readingA: 'koh-SEHR', readingB: 'koh-SEHR', meaningA: 'to cook / boil', meaningB: 'to sew', hint: 'c (before e) vs s — homophones in LatAm seseo; distinguished in Spain (koh-THEHR vs koh-SEHR).', category: 'c-z-s' },
  { id: 'es-26', wordA: 'mono', wordB: 'moño', readingA: 'MOH-noh', readingB: 'MOH-nyoh', meaningA: 'monkey', meaningB: 'hair bun', hint: 'n vs ñ — the tilde adds a palatal "ny" glide.', category: 'n-ñ' },
  { id: 'es-27', wordA: 'pena', wordB: 'peña', readingA: 'PEH-nah', readingB: 'PEH-nyah', meaningA: 'sorrow, pity', meaningB: 'boulder, rock / social club', hint: 'n vs ñ — the tilde changes both sound and meaning.', category: 'n-ñ' },
  { id: 'es-28', wordA: 'amargo', wordB: 'amarro', readingA: 'ah-MAR-goh', readingB: 'ah-MAH-rroh', meaningA: 'bitter', meaningB: 'I moor / tie up', hint: 'Different consonant cluster — rg (tap + g) vs rr (trill); both stress the second syllable.', category: 'rolled' },
  { id: 'es-29', wordA: 'ahora', wordB: 'ahorra', readingA: 'ah-OH-rah', readingB: 'ah-OH-rrah', meaningA: 'now', meaningB: 'he/she saves (money)', hint: 'Single r (tap) vs rr (trill) — silent h in both; only the trill distinguishes them.', category: 'rolled' },
  { id: 'es-30', wordA: 'mas', wordB: 'más', readingA: 'mahs', readingB: 'MAHS', meaningA: 'but (archaic/literary)', meaningB: 'more', hint: 'Written accent (tilde diacrítica) distinguishes stressed "más" (more) from unstressed conjunction "mas" (but).', category: 'accent-stress' },
];
