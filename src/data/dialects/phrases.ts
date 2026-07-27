import type { DialectCode } from '../../lib/arabic-dialects';

/**
 * Curated dialect reference data for the Dialects hub.
 *
 * Everything here is limited to the most common, widely-taught and stable
 * forms so the comparison stays trustworthy. Where a dialect genuinely varies
 * or a form is uncertain, prefer the most standard teaching form. Arabic is
 * given fully vocalised where it helps; transliteration uses a light scheme.
 */

export interface PhraseForm {
  ar: string;
  tr: string;
}

export interface DialectPhrase {
  en: string;
  /** One form per dialect (msa + the five spoken varieties). */
  forms: Record<DialectCode, PhraseForm>;
}

/** A signature pronunciation / grammar feature of a dialect. */
export interface DialectFeature {
  label: string;
  note: string;
}

export interface DialectProfile {
  pronunciation: DialectFeature[];
  grammar: DialectFeature[];
}

// ── Signature features per dialect ─────────────────────────────────────────
export const DIALECT_PROFILES: Record<DialectCode, DialectProfile> = {
  msa: {
    pronunciation: [
      { label: 'ق = uvular /q/', note: 'Pronounced far back, distinct from ك /k/.' },
      { label: 'Full iʿrāb', note: 'Careful speech keeps case endings (-u, -a, -i).' },
      { label: 'Every letter sounded', note: 'ث/ذ/ظ and the emphatics are all kept distinct.' },
    ],
    grammar: [
      { label: 'Present: bare prefix', note: 'يَكْتُبُ (yaktubu) — he writes.' },
      { label: 'Future: سـ / سوف', note: 'سَيَكْتُبُ (sa-yaktubu) — he will write.' },
      { label: 'Negation by tense', note: 'لا present, لم + jussive past, لن future.' },
      { label: 'Question words', note: 'ماذا (mādhā) what · أين (ayna) where · كيف (kayfa) how · لماذا (limādhā) why.' },
    ],
  },
  egyptian: {
    pronunciation: [
      { label: 'ج = hard "g"', note: 'جَمَل → "gamal" (camel).' },
      { label: 'ق → glottal stop', note: 'قَلْب → "ʾalb" (heart).' },
      { label: 'ث/ذ shift', note: 'Often become س/ز or ت/د.' },
    ],
    grammar: [
      { label: 'Present: bi- prefix', note: 'بَكْتِب (baktib) — I write / am writing.' },
      { label: 'Future: ḥa-/ha-', note: 'هَكْتِب (haktib) — I will write.' },
      { label: 'Negation: ma…sh', note: 'مَكَتَبْتِش (ma-katabtish) — I didn\u2019t write.' },
      { label: 'Question words', note: 'إيه (ēh) what · فين (fēn) where · إزّاي (izzāy) how · ليه (lēh) why.' },
    ],
  },
  levantine: {
    pronunciation: [
      { label: 'ق → glottal stop', note: 'City speech: قَلْب → "ʾalb".' },
      { label: 'imāla', note: 'Long ā leans toward "e" (e.g. "shū" vowels).' },
      { label: 'ث/ذ shift', note: 'Often t/d or s/z.' },
    ],
    grammar: [
      { label: 'Present: ʿam', note: 'عَم بِكْتُب (ʿam biktob) — I\u2019m writing.' },
      { label: 'Future: raḥ / laḥ', note: 'رَح إكْتُب (raḥ iktob) — I\u2019ll write.' },
      { label: 'Negation: ما (+ -sh south)', note: 'ما بِكْتُب (mā biktob) — I don\u2019t write.' },
      { label: 'Question words', note: 'شو (shū) what · وين (wēn) where · كيف (kīf) how · ليش (lēsh) why.' },
    ],
  },
  gulf: {
    pronunciation: [
      { label: 'ق kept as /g/', note: 'قال → "gāl" (he said).' },
      { label: 'ك → "ch"', note: 'Before front vowels: كَيْف → "chēf" in some areas.' },
      { label: 'Closest to MSA', note: 'Retains more classical sounds than most dialects.' },
    ],
    grammar: [
      { label: 'Progressive: gāʿid', note: 'قاعِد أكْتِب (gāʿid aktib) — I\u2019m writing.' },
      { label: 'Future: ب / راح', note: 'بَكْتِب (baktib) — I\u2019ll write.' },
      { label: 'Negation: مو / ما', note: 'مو زَيْن (mū zēn) — not good.' },
      { label: 'Question words', note: 'وش/شنو (wēsh/shinu) what · وين (wēn) where · شلون (shlōn) how · ليش (lēsh) why.' },
    ],
  },
  iraqi: {
    pronunciation: [
      { label: 'ق → /g/', note: 'قال → "gāl".' },
      { label: 'ك → "ch"', note: 'كان → "chān" (was) in many words.' },
      { label: 'Vowel shifts', note: 'Mesopotamian imāla and stress patterns.' },
    ],
    grammar: [
      { label: 'Present: da- prefix', note: 'دَأَكْتِب (da-aktib) — I\u2019m writing.' },
      { label: 'There is/isn\u2019t: aku/māku', note: 'أكو (aku) there is · ماكو (māku) there isn\u2019t.' },
      { label: 'Future: راح / حـ', note: 'راح أكْتِب (raḥ aktib) — I\u2019ll write.' },
      { label: 'Question words', note: 'شنو (shinu) what · وين (wēn) where · شلون (shlōn) how · ليش (lēsh) why.' },
    ],
  },
  maghrebi: {
    pronunciation: [
      { label: 'Heavy vowel reduction', note: 'Short vowels drop: كتب → "kteb", clusters abound.' },
      { label: 'French & Berber loans', note: 'Everyday vocabulary borrows widely.' },
      { label: 'Most distinct branch', note: 'Hard for speakers of Mashriqi dialects to follow.' },
    ],
    grammar: [
      { label: 'Present: ka-/ta- prefix', note: 'كَنْكْتِب (kanktb) — I write.' },
      { label: 'Future: غادي (ghādi)', note: 'غادي نْكْتِب (ghādi nktb) — I\u2019ll write.' },
      { label: 'Negation: ma…sh', note: 'ماكْتبْتْش (ma-ktebtsh) — I didn\u2019t write.' },
      { label: 'Question words', note: 'أش/شنو (ash/shnu) what · فين (fīn) where · كيفاش (kīfāsh) how · علاش (ʿlāsh) why.' },
    ],
  },
};

// ── Everyday phrase comparison ─────────────────────────────────────────────
// High-confidence, widely-taught forms only.
export const DIALECT_PHRASES: DialectPhrase[] = [
  {
    en: 'Hello',
    forms: {
      msa: { ar: 'مَرْحَبًا', tr: 'marḥaban' },
      egyptian: { ar: 'أَهْلاً', tr: 'ahlan' },
      levantine: { ar: 'مَرْحَبا', tr: 'marḥaba' },
      gulf: { ar: 'هَلا', tr: 'hala' },
      iraqi: { ar: 'هَلو', tr: 'hallo' },
      maghrebi: { ar: 'السَّلام', tr: 'as-salām' },
    },
  },
  {
    en: 'How are you? (to a man)',
    forms: {
      msa: { ar: 'كَيْفَ حالُكَ؟', tr: 'kayfa ḥāluka?' },
      egyptian: { ar: 'إِزَّيَّك؟', tr: 'izzayyak?' },
      levantine: { ar: 'كِيفَك؟', tr: 'kīfak?' },
      gulf: { ar: 'شْلونَك؟', tr: 'shlōnak?' },
      iraqi: { ar: 'شْلونَك؟', tr: 'shlōnak?' },
      maghrebi: { ar: 'كِي دايِر؟', tr: 'kī dāyer?' },
    },
  },
  {
    en: "I'm fine / good",
    forms: {
      msa: { ar: 'أَنا بِخَيْر', tr: 'anā bi-khayr' },
      egyptian: { ar: 'كُوَيِّس', tr: 'kwayyis' },
      levantine: { ar: 'مْنيح', tr: 'mnīḥ' },
      gulf: { ar: 'زَيْن', tr: 'zēn' },
      iraqi: { ar: 'زَيْن', tr: 'zēn' },
      maghrebi: { ar: 'لا باس', tr: 'lā bās' },
    },
  },
  {
    en: 'Thank you',
    forms: {
      msa: { ar: 'شُكْرًا', tr: 'shukran' },
      egyptian: { ar: 'شُكْرًا', tr: 'shukran' },
      levantine: { ar: 'شُكْرًا', tr: 'shukran' },
      gulf: { ar: 'مَشْكُور', tr: 'mashkūr' },
      iraqi: { ar: 'مَمْنون', tr: 'mamnūn' },
      maghrebi: { ar: 'شُكْرًا', tr: 'shukran' },
    },
  },
  {
    en: 'Yes',
    forms: {
      msa: { ar: 'نَعَم', tr: 'naʿam' },
      egyptian: { ar: 'أَيْوَه', tr: 'aywa' },
      levantine: { ar: 'إيه', tr: 'ē' },
      gulf: { ar: 'إي', tr: 'ī' },
      iraqi: { ar: 'إي', tr: 'ī' },
      maghrebi: { ar: 'إيه', tr: 'īyeh' },
    },
  },
  {
    en: 'No',
    forms: {
      msa: { ar: 'لا', tr: 'lā' },
      egyptian: { ar: 'لأ', tr: 'laʾ' },
      levantine: { ar: 'لأ', tr: 'laʾ' },
      gulf: { ar: 'لا', tr: 'lā' },
      iraqi: { ar: 'لا', tr: 'lā' },
      maghrebi: { ar: 'لا', tr: 'lā' },
    },
  },
  {
    en: 'What?',
    forms: {
      msa: { ar: 'ماذا؟', tr: 'mādhā?' },
      egyptian: { ar: 'إيه؟', tr: 'ēh?' },
      levantine: { ar: 'شو؟', tr: 'shū?' },
      gulf: { ar: 'وِش؟', tr: 'wēsh?' },
      iraqi: { ar: 'شِنو؟', tr: 'shinu?' },
      maghrebi: { ar: 'أَش؟', tr: 'ash?' },
    },
  },
  {
    en: 'Where?',
    forms: {
      msa: { ar: 'أَيْنَ؟', tr: 'ayna?' },
      egyptian: { ar: 'فين؟', tr: 'fēn?' },
      levantine: { ar: 'وين؟', tr: 'wēn?' },
      gulf: { ar: 'وين؟', tr: 'wēn?' },
      iraqi: { ar: 'وين؟', tr: 'wēn?' },
      maghrebi: { ar: 'فين؟', tr: 'fīn?' },
    },
  },
  {
    en: 'How much? (price)',
    forms: {
      msa: { ar: 'بِكَمْ؟', tr: 'bikam?' },
      egyptian: { ar: 'بِكامْ؟', tr: 'bikām?' },
      levantine: { ar: 'قَدّيش؟', tr: 'ʾaddēsh?' },
      gulf: { ar: 'بِكَمْ؟', tr: 'bikam?' },
      iraqi: { ar: 'بيش؟', tr: 'beesh?' },
      maghrebi: { ar: 'بِشْحال؟', tr: 'bishḥāl?' },
    },
  },
  {
    en: 'I want',
    forms: {
      msa: { ar: 'أُريدُ', tr: 'urīdu' },
      egyptian: { ar: 'عايِز', tr: 'ʿāyiz' },
      levantine: { ar: 'بِدّي', tr: 'biddi' },
      gulf: { ar: 'أَبْغى', tr: 'abgha' },
      iraqi: { ar: 'أَريد', tr: 'arīd' },
      maghrebi: { ar: 'بْغيت', tr: 'bghīt' },
    },
  },
  {
    en: 'There is / there are',
    forms: {
      msa: { ar: 'هُناكَ', tr: 'hunāka' },
      egyptian: { ar: 'فيه', tr: 'fīh' },
      levantine: { ar: 'في', tr: 'fī' },
      gulf: { ar: 'فيه', tr: 'fīh' },
      iraqi: { ar: 'أَكو', tr: 'aku' },
      maghrebi: { ar: 'كايِن', tr: 'kāyen' },
    },
  },
  {
    en: "What's your name? (to a man)",
    forms: {
      msa: { ar: 'ما اسْمُكَ؟', tr: 'mā-smuka?' },
      egyptian: { ar: 'اسْمَك إيه؟', tr: 'ismak ēh?' },
      levantine: { ar: 'شو اسْمَك؟', tr: 'shū ismak?' },
      gulf: { ar: 'وِش اسْمَك؟', tr: 'wēsh ismak?' },
      iraqi: { ar: 'شِنو اسْمَك؟', tr: 'shinu ismak?' },
      maghrebi: { ar: 'أَشْنو سْميتَك؟', tr: 'ashnu smītek?' },
    },
  },
  {
    en: 'Now',
    forms: {
      msa: { ar: 'الآنَ', tr: 'al-ān' },
      egyptian: { ar: 'دِلْوَقْتي', tr: 'dilwaʾti' },
      levantine: { ar: 'هَلَّق', tr: 'hallaʾ' },
      gulf: { ar: 'الحين', tr: 'al-ḥīn' },
      iraqi: { ar: 'هَسّه', tr: 'hassa' },
      maghrebi: { ar: 'دابا', tr: 'dāba' },
    },
  },
  {
    en: 'A little / a bit',
    forms: {
      msa: { ar: 'قَليلاً', tr: 'qalīlan' },
      egyptian: { ar: 'شْوَيّة', tr: 'shwayya' },
      levantine: { ar: 'شْوَيّ', tr: 'shwayy' },
      gulf: { ar: 'شْوَيّ', tr: 'shwayy' },
      iraqi: { ar: 'شْوَيّة', tr: 'shwayya' },
      maghrebi: { ar: 'شْوِيّة', tr: 'shwiyya' },
    },
  },
  {
    en: 'Good / nice',
    forms: {
      msa: { ar: 'جَيِّد', tr: 'jayyid' },
      egyptian: { ar: 'كُوَيِّس', tr: 'kwayyis' },
      levantine: { ar: 'مْنيح', tr: 'mnīḥ' },
      gulf: { ar: 'زَيْن', tr: 'zēn' },
      iraqi: { ar: 'زَيْن', tr: 'zēn' },
      maghrebi: { ar: 'مَزْيان', tr: 'mezyān' },
    },
  },
  {
    en: 'Goodbye',
    forms: {
      msa: { ar: 'مَعَ السَّلامة', tr: 'maʿa s-salāma' },
      egyptian: { ar: 'مَعَ السَّلامة', tr: 'maʿa s-salāma' },
      levantine: { ar: 'بَاي', tr: 'bāy' },
      gulf: { ar: 'فِي أَمانِ الله', tr: 'fī amāni-llāh' },
      iraqi: { ar: 'فِي أَمانِ الله', tr: 'fī amāni-llāh' },
      maghrebi: { ar: 'بِسْلامة', tr: 'bslāma' },
    },
  },
];
