import type { MinimalPair } from './ja-pairs';

// Arabic (MSA) minimal pairs — the contrasts that trip up English speakers most:
// emphatic vs plain consonants, throat letters (ح ه ع ء), similar consonants
// (ق ك، خ غ، ح خ) and short vs long vowels. Readings use scholarly translit.
export const arMinimalPairs: MinimalPair[] = [
  // ── Emphatic vs plain ──────────────────────────────────
  { id: 'ar-1', wordA: 'سَيْف', wordB: 'صَيْف', readingA: 'sayf', readingB: 'ṣayf', meaningA: 'sword', meaningB: 'summer', hint: 'Plain س vs emphatic ص — ص is heavier, the tongue lower and back raised.', category: 'emphatic' },
  { id: 'ar-2', wordA: 'تِين', wordB: 'طِين', readingA: 'tīn', readingB: 'ṭīn', meaningA: 'figs', meaningB: 'clay / mud', hint: 'Plain ت vs emphatic ط — ط is dark and hollow.', category: 'emphatic' },
  { id: 'ar-3', wordA: 'دَلَّ', wordB: 'ضَلَّ', readingA: 'dalla', readingB: 'ḍalla', meaningA: 'he showed / guided', meaningB: 'he went astray', hint: 'Plain د vs emphatic ض — the famous "letter of the ḍād".', category: 'emphatic' },
  { id: 'ar-4', wordA: 'ذِلّ', wordB: 'ظِلّ', readingA: 'dhill', readingB: 'ẓill', meaningA: 'humiliation', meaningB: 'shade', hint: 'Plain ذ vs emphatic ظ — both "th/dh", but ظ is heavy.', category: 'emphatic' },
  { id: 'ar-5', wordA: 'سَدّ', wordB: 'صَدّ', readingA: 'sadd', readingB: 'ṣadd', meaningA: 'dam', meaningB: 'he repelled', hint: 'Plain س vs emphatic ص.', category: 'emphatic' },
  { id: 'ar-6', wordA: 'تابَ', wordB: 'طابَ', readingA: 'tāba', readingB: 'ṭāba', meaningA: 'he repented', meaningB: 'it became pleasant', hint: 'Plain ت vs emphatic ط.', category: 'emphatic' },

  // ── Throat letters ─────────────────────────────────────
  { id: 'ar-7', wordA: 'حال', wordB: 'هال', readingA: 'ḥāl', readingB: 'hāl', meaningA: 'state / condition', meaningB: 'cardamom', hint: 'ح (constricted, from deep in the throat) vs ه (light English "h").', category: 'throat' },
  { id: 'ar-8', wordA: 'عِلْم', wordB: 'أَلَم', readingA: 'ʿilm', readingB: 'alam', meaningA: 'knowledge', meaningB: 'pain', hint: 'ع (voiced pharyngeal squeeze) vs ء/أ (plain glottal stop).', category: 'throat' },
  { id: 'ar-9', wordA: 'عَيْن', wordB: 'أَيْن', readingA: 'ʿayn', readingB: 'ayn', meaningA: 'eye / spring', meaningB: 'where', hint: 'ع vs hamza — the single hardest contrast for English speakers.', category: 'throat' },
  { id: 'ar-10', wordA: 'حَبّ', wordB: 'هَبّ', readingA: 'ḥabb', readingB: 'habb', meaningA: 'seeds / grain', meaningB: 'it blew (wind)', hint: 'ح vs ه.', category: 'throat' },
  { id: 'ar-11', wordA: 'عَدّ', wordB: 'أَدّى', readingA: 'ʿadda', readingB: 'addā', meaningA: 'he counted', meaningB: 'he carried out', hint: 'ع vs hamza onset.', category: 'throat' },

  // ── Similar consonants ─────────────────────────────────
  { id: 'ar-12', wordA: 'قَلْب', wordB: 'كَلْب', readingA: 'qalb', readingB: 'kalb', meaningA: 'heart', meaningB: 'dog', hint: 'ق (deep, from the uvula) vs ك (front "k"). Say the wrong one and "my heart" becomes "my dog"!', category: 'similar' },
  { id: 'ar-13', wordA: 'خَيْر', wordB: 'غَيْر', readingA: 'khayr', readingB: 'ghayr', meaningA: 'good / goodness', meaningB: 'other than', hint: 'خ (voiceless "kh", Scottish loch) vs غ (voiced gargled "gh").', category: 'similar' },
  { id: 'ar-14', wordA: 'قال', wordB: 'كال', readingA: 'qāla', readingB: 'kāla', meaningA: 'he said', meaningB: 'he measured', hint: 'ق vs ك.', category: 'similar' },
  { id: 'ar-15', wordA: 'حَرْب', wordB: 'خَرْب', readingA: 'ḥarb', readingB: 'kharb', meaningA: 'war', meaningB: 'destruction', hint: 'ح (throat) vs خ (rasping "kh").', category: 'similar' },
  { id: 'ar-16', wordA: 'سِنّ', wordB: 'ثِنّ', readingA: 'sinn', readingB: 'thinn', meaningA: 'tooth / age', meaningB: '(rare) fold', hint: 'س ("s") vs ث ("th" as in think) — keep the tongue behind the teeth for ث.', category: 'similar' },

  // ── Short vs long vowels ───────────────────────────────
  { id: 'ar-17', wordA: 'كَتَبَ', wordB: 'كاتَبَ', readingA: 'kataba', readingB: 'kātaba', meaningA: 'he wrote', meaningB: 'he corresponded with', hint: 'Short a vs long ā changes the verb form entirely.', category: 'vowel-length' },
  { id: 'ar-18', wordA: 'عالِم', wordB: 'عالَم', readingA: 'ʿālim', readingB: 'ʿālam', meaningA: 'scholar', meaningB: 'world', hint: 'Vowel quality on the second syllable: -im vs -am.', category: 'vowel-length' },
  { id: 'ar-19', wordA: 'جَمَل', wordB: 'جَمِيل', readingA: 'jamal', readingB: 'jamīl', meaningA: 'camel', meaningB: 'beautiful', hint: 'Short a vs long ī.', category: 'vowel-length' },
  { id: 'ar-20', wordA: 'دَرَسَ', wordB: 'دارِس', readingA: 'darasa', readingB: 'dāris', meaningA: 'he studied', meaningB: 'a student / one studying', hint: 'Long ā (dā-) marks the active participle.', category: 'vowel-length' },
];
