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

  // ── Emphatic vs plain (batch 2) ──
  { id: 'ar-21', wordA: 'تابَ', wordB: 'طابَ', readingA: 'tāba', readingB: 'ṭāba', meaningA: 'he repented', meaningB: 'it became good', hint: 'Plain ت vs emphatic ط (repeat of the key contrast).', category: 'emphatic' },
  { id: 'ar-22', wordA: 'سَنّ', wordB: 'صَنّ', readingA: 'sann', readingB: 'ṣann', meaningA: 'to sharpen', meaningB: '(rare root)', hint: 'Plain س vs emphatic ص.', category: 'emphatic' },
  { id: 'ar-23', wordA: 'دِين', wordB: 'ضِدّ', readingA: 'dīn', readingB: 'ḍidd', meaningA: 'religion', meaningB: 'opposite', hint: 'Plain د vs emphatic ض — feel the tongue heaviness on ض.', category: 'emphatic' },

  // ── Throat letters (batch 2) ──
  { id: 'ar-24', wordA: 'حَجّ', wordB: 'هَجّ', readingA: 'ḥajj', readingB: 'hajj', meaningA: 'pilgrimage', meaningB: '(to rush)', hint: 'ح (deep, constricted) vs ه (light "h").', category: 'throat' },
  { id: 'ar-25', wordA: 'عَمّ', wordB: 'أَمّ', readingA: 'ʿamm', readingB: 'ʾumm', meaningA: 'paternal uncle', meaningB: 'mother', hint: 'ع (pharyngeal) vs hamza — a very common confusion.', category: 'throat' },
  { id: 'ar-26', wordA: 'سَعى', wordB: 'سَأَل', readingA: 'saʿā', readingB: 'saʾal', meaningA: 'he strove', meaningB: 'he asked', hint: 'ع vs hamza in medial position.', category: 'throat' },

  // ── Similar consonants (batch 2) ──
  { id: 'ar-27', wordA: 'كَتَبَ', wordB: 'قَطَعَ', readingA: 'kataba', readingB: 'qaṭaʿa', meaningA: 'he wrote', meaningB: 'he cut', hint: 'ك (front k) vs ق (deep, uvular).', category: 'similar' },
  { id: 'ar-28', wordA: 'غالِب', wordB: 'خالِد', readingA: 'ghālib', readingB: 'khālid', meaningA: 'victorious', meaningB: 'eternal (a name)', hint: 'غ (voiced gh) vs خ (voiceless kh).', category: 'similar' },

  // ── Vowel length (batch 2) ──
  { id: 'ar-29', wordA: 'سَلَم', wordB: 'سَلام', readingA: 'salam', readingB: 'salām', meaningA: 'peace (short)', meaningB: 'peace / greeting', hint: 'Short a vs long ā on the final syllable.', category: 'vowel-length' },
  { id: 'ar-30', wordA: 'مَلِك', wordB: 'مالِك', readingA: 'malik', readingB: 'mālik', meaningA: 'king', meaningB: 'owner', hint: 'Long ā (mā-) marks the active participle "owner".', category: 'vowel-length' },

  // ── batch 3 ──
  { id: 'ar-31', wordA: 'طَلَب', wordB: 'تَلَف', readingA: 'ṭalab', readingB: 'talaf', meaningA: 'request', meaningB: 'damage', hint: 'Emphatic ط vs plain ت.', category: 'emphatic' },
  { id: 'ar-32', wordA: 'بَصَل', wordB: 'بَسَل', readingA: 'baṣal', readingB: 'basal', meaningA: 'onions', meaningB: '(courage, rare)', hint: 'Emphatic ص vs plain س in the middle.', category: 'emphatic' },
  { id: 'ar-33', wordA: 'أَحَد', wordB: 'عَهْد', readingA: 'aḥad', readingB: 'ʿahd', meaningA: 'one / Sunday', meaningB: 'era, covenant', hint: 'Hamza + ح vs ع + ه — layered throat contrasts.', category: 'throat' },
  { id: 'ar-34', wordA: 'صَغِير', wordB: 'صَقِيل', readingA: 'ṣaghīr', readingB: 'ṣaqīl', meaningA: 'small', meaningB: 'polished', hint: 'غ (voiced gh) vs ق (uvular q).', category: 'similar' },
  { id: 'ar-35', wordA: 'كِتاب', wordB: 'قِطار', readingA: 'kitāb', readingB: 'qiṭār', meaningA: 'book', meaningB: 'train', hint: 'ك vs ق — listen for the deeper, further-back q.', category: 'similar' },
  { id: 'ar-36', wordA: 'شارِب', wordB: 'شارِع', readingA: 'shārib', readingB: 'shāriʿ', meaningA: 'drinking / moustache', meaningB: 'street', hint: 'Final ب vs ع — the ʿayn is a throat squeeze, not a stop.', category: 'throat' },

  // ── Emphatic vs plain (batch 3) ──
  { id: 'ar-37', wordA: 'سارَ', wordB: 'صارَ', readingA: 'sāra', readingB: 'ṣāra', meaningA: 'he walked / proceeded', meaningB: 'he became', hint: 'Plain س vs emphatic ص — ṣ is dark and heavy.', category: 'emphatic' },
  { id: 'ar-38', wordA: 'بَتّ', wordB: 'بَطّ', readingA: 'batt', readingB: 'baṭṭ', meaningA: 'a decisive settling', meaningB: 'ducks', hint: 'Plain ت vs emphatic ط.', category: 'emphatic' },
  { id: 'ar-39', wordA: 'حَدّ', wordB: 'حَضّ', readingA: 'ḥadd', readingB: 'ḥaḍḍ', meaningA: 'limit / edge', meaningB: 'urging on', hint: 'Plain د vs emphatic ض.', category: 'emphatic' },
  { id: 'ar-40', wordA: 'نَذَرَ', wordB: 'نَظَرَ', readingA: 'nadhara', readingB: 'naẓara', meaningA: 'he vowed', meaningB: 'he looked', hint: 'Plain ذ (soft "th") vs emphatic ظ (heavy).', category: 'emphatic' },

  // ── Throat letters (batch 3) ──
  { id: 'ar-41', wordA: 'سَحَر', wordB: 'سَهَر', readingA: 'saḥar', readingB: 'sahar', meaningA: 'dawn / daybreak', meaningB: 'staying up at night', hint: 'ح (deep, constricted) vs ه (light "h").', category: 'throat' },
  { id: 'ar-42', wordA: 'عَمَل', wordB: 'أَمَل', readingA: 'ʿamal', readingB: 'amal', meaningA: 'work', meaningB: 'hope', hint: 'ع (pharyngeal squeeze) vs hamza — one of the most useful pairs.', category: 'throat' },
  { id: 'ar-43', wordA: 'نَحْل', wordB: 'نَهْل', readingA: 'naḥl', readingB: 'nahl', meaningA: 'bees', meaningB: 'first watering / drinking', hint: 'ح vs ه.', category: 'throat' },

  // ── Similar consonants (batch 3) ──
  { id: 'ar-44', wordA: 'قَدَر', wordB: 'كَدَر', readingA: 'qadar', readingB: 'kadar', meaningA: 'fate / destiny', meaningB: 'gloom / turbidity', hint: 'ق (deep, uvular) vs ك (front "k").', category: 'similar' },
  { id: 'ar-45', wordA: 'غابَ', wordB: 'خابَ', readingA: 'ghāba', readingB: 'khāba', meaningA: 'he was absent', meaningB: 'he failed / was let down', hint: 'غ (voiced gargled gh) vs خ (voiceless kh).', category: 'similar' },
  { id: 'ar-46', wordA: 'ثَمّ', wordB: 'سَمّ', readingA: 'thamma', readingB: 'samm', meaningA: 'there / then', meaningB: 'poison', hint: 'ث ("th" as in think) vs س ("s").', category: 'similar' },

  // ── Short vs long vowels (batch 3) ──
  { id: 'ar-47', wordA: 'جَمَل', wordB: 'جَمال', readingA: 'jamal', readingB: 'jamāl', meaningA: 'camel', meaningB: 'beauty', hint: 'Short a vs long ā changes camel into beauty.', category: 'vowel-length' },
  { id: 'ar-48', wordA: 'دَرَسَ', wordB: 'دارَسَ', readingA: 'darasa', readingB: 'dārasa', meaningA: 'he studied', meaningB: 'he studied together with', hint: 'Long ā (dā-) makes it Form III — a mutual action.', category: 'vowel-length' },
];
