/**
 * Arabic dialect model.
 *
 * The app teaches a single `ar` language whose shared "common route" is Modern
 * Standard Arabic (MSA / fuṣḥā) — the written register understood everywhere.
 * On top of that, a learner can pick a spoken dialect and optionally switch on
 * a "colloquial focus" that surfaces dialect-tagged vocabulary, phrases and
 * lessons (spoken forms, pronoun/verb differences, everyday words).
 *
 * Content is TAGGED with dialect codes rather than duplicated: an item tagged
 * `msa` is always shown; an item tagged `egyptian` is shown to Egyptian
 * learners (and to everyone when browsing "all"). This keeps one progress
 * stream, one streak and one SRS deck per learner.
 */

export type DialectCode = 'msa' | 'egyptian' | 'levantine' | 'gulf' | 'iraqi' | 'maghrebi';

export interface DialectInfo {
  code: DialectCode;
  /** Short English label. */
  name: string;
  /** Endonym in Arabic. */
  nativeName: string;
  flag: string;
  /** One-line description shown in Settings. */
  blurb: string;
  /** Rough number of speakers / where it is spoken, for the picker. */
  region: string;
}

export const DIALECTS: Record<DialectCode, DialectInfo> = {
  msa: {
    code: 'msa',
    name: 'Modern Standard Arabic',
    nativeName: 'الفُصْحى',
    flag: '📖',
    blurb: 'The formal written & broadcast standard, understood across the Arab world. The shared core of every route.',
    region: 'News, books, formal speech — everywhere',
  },
  egyptian: {
    code: 'egyptian',
    name: 'Egyptian',
    nativeName: 'المَصْري',
    flag: '🇪🇬',
    blurb: 'The most widely understood dialect thanks to Egyptian film & music. ج is a hard "g"; ق is often a glottal stop.',
    region: 'Egypt (~100M) + widely understood',
  },
  levantine: {
    code: 'levantine',
    name: 'Levantine',
    nativeName: 'الشَّامي',
    flag: '🇱🇧',
    blurb: 'Spoken across the Levant with soft, melodic vowels. ق is usually a glottal stop in city speech.',
    region: 'Syria, Lebanon, Jordan, Palestine',
  },
  gulf: {
    code: 'gulf',
    name: 'Gulf (Khaleeji)',
    nativeName: 'الخَلِيجي',
    flag: '🇸🇦',
    blurb: 'Spoken around the Arabian Gulf, closest of the dialects to MSA. ق is kept as /g/; ك can soften to "ch".',
    region: 'Saudi, UAE, Kuwait, Qatar, Bahrain, Oman',
  },
  iraqi: {
    code: 'iraqi',
    name: 'Iraqi (Mesopotamian)',
    nativeName: 'العِراقي',
    flag: '🇮🇶',
    blurb: 'Spoken across Iraq, blending Gulf and Levantine features. ق is often /g/; "shlōnak?" = how are you, "aku/māku" = there is/isn\'t.',
    region: 'Iraq & parts of eastern Syria',
  },
  maghrebi: {
    code: 'maghrebi',
    name: 'Maghrebi (Darija)',
    nativeName: 'الدَّارِجة',
    flag: '🇲🇦',
    blurb: 'North-West African Arabic with heavy vowel reduction and French/Berber influence. The most distinct branch.',
    region: 'Morocco, Algeria, Tunisia',
  },
};

export const DIALECT_CODES = Object.keys(DIALECTS) as DialectCode[];

export function getDialectInfo(code: string): DialectInfo | undefined {
  return DIALECTS[code as DialectCode];
}

export function getDialectLabel(code: string): string {
  const d = getDialectInfo(code);
  return d ? `${d.flag} ${d.name}` : code;
}

/**
 * Given the learner's chosen dialect, the set of content-tags whose items
 * should surface. Always includes `msa` (the shared core). `all` is included
 * so authors can tag pan-dialectal colloquial content generically.
 */
export function activeDialectTags(dialect: string): Set<string> {
  const tags = new Set<string>(['msa', 'all', 'standard']);
  if (dialect && dialect !== 'msa') tags.add(dialect);
  return tags;
}
