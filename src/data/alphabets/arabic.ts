import type { Character } from './hiragana';

// Arabic script — Modern Standard Arabic (MSA)
//
// Arabic is written right-to-left and cursively: most letters change shape
// depending on position (isolated / initial / medial / final). Six letters
// are "non-connectors" (ا د ذ ر ز و) — they never join to the letter that
// follows them. The `char` here is the ISOLATED form; positional behaviour and
// an example word are described in `meaning`. `pronunciation` is the Arabic
// letter NAME so the ar-SA TTS voice reads it naturally.
//
// Sound values follow MSA. Where a major spoken dialect differs notably
// (e.g. ج pronounced /g/ in Egyptian, ق as a glottal stop in Levantine/
// Egyptian city speech), that is noted so dialect learners aren't surprised.

export const ARABIC_LETTERS: Character[] = [
  { char: 'ا', romanji: 'alif — ā', pronunciation: 'أَلِف', group: 'Alif & Hamza', strokes: 1, meaning: '[aː] Long "a" and the seat for hamza. Non-connector. Example: باب (bāb) "door". IPA /aː/.' },
  { char: 'ب', romanji: 'bāʾ — b', pronunciation: 'بَاء', group: 'Tooth Letters (ب ت ث)', strokes: 1, meaning: '[b] Like English "b". One dot below. Connects both sides. Example: بَيْت (bayt) "house". IPA /b/.' },
  { char: 'ت', romanji: 'tāʾ — t', pronunciation: 'تَاء', group: 'Tooth Letters (ب ت ث)', strokes: 1, meaning: '[t] Like "t". Two dots above. Example: تِين (tīn) "figs". IPA /t/.' },
  { char: 'ث', romanji: 'thāʾ — th', pronunciation: 'ثَاء', group: 'Tooth Letters (ب ت ث)', strokes: 1, meaning: '[θ] "th" as in "think". Three dots above. Example: ثَلاثة (thalātha) "three". IPA /θ/.' },
  { char: 'ج', romanji: 'jīm — j', pronunciation: 'جِيم', group: 'Loop Letters (ج ح خ)', strokes: 1, meaning: '[d͡ʒ] "j" as in "jam" (hard "g" in Egyptian). One dot below. Example: جَمَل (jamal) "camel". IPA /d͡ʒ/.' },
  { char: 'ح', romanji: 'ḥāʾ — ḥ', pronunciation: 'حَاء', group: 'Loop Letters (ج ح خ)', strokes: 1, meaning: '[ħ] Breathy, constricted "h" from deep in the throat. No dot. Example: حُبّ (ḥubb) "love". IPA /ħ/.' },
  { char: 'خ', romanji: 'khāʾ — kh', pronunciation: 'خَاء', group: 'Loop Letters (ج ح خ)', strokes: 1, meaning: '[x] "ch" as in Scottish "loch". One dot above. Example: خُبْز (khubz) "bread". IPA /x/.' },
  { char: 'د', romanji: 'dāl — d', pronunciation: 'دَال', group: 'Daal & Raa (د ذ ر ز)', strokes: 1, meaning: '[d] Like "d". Non-connector. Example: دَار (dār) "home". IPA /d/.' },
  { char: 'ذ', romanji: 'dhāl — dh', pronunciation: 'ذَال', group: 'Daal & Raa (د ذ ر ز)', strokes: 1, meaning: '[ð] "th" as in "this". One dot above. Non-connector. Example: ذَهَب (dhahab) "gold". IPA /ð/.' },
  { char: 'ر', romanji: 'rāʾ — r', pronunciation: 'رَاء', group: 'Daal & Raa (د ذ ر ز)', strokes: 1, meaning: '[r] Rolled/tapped "r". Non-connector. Example: رَجُل (rajul) "man". IPA /r/.' },
  { char: 'ز', romanji: 'zāy — z', pronunciation: 'زَاي', group: 'Daal & Raa (د ذ ر ز)', strokes: 1, meaning: '[z] Like "z". One dot above. Non-connector. Example: زَيْت (zayt) "oil". IPA /z/.' },
  { char: 'س', romanji: 'sīn — s', pronunciation: 'سِين', group: 'Seen Letters (س ش)', strokes: 1, meaning: '[s] Like "s". Three teeth. Example: سَمَك (samak) "fish". IPA /s/.' },
  { char: 'ش', romanji: 'shīn — sh', pronunciation: 'شِين', group: 'Seen Letters (س ش)', strokes: 1, meaning: '[ʃ] "sh" as in "ship". Three teeth + three dots. Example: شَمْس (shams) "sun". IPA /ʃ/.' },
  { char: 'ص', romanji: 'ṣād — ṣ', pronunciation: 'صَاد', group: 'Emphatic (ص ض ط ظ)', strokes: 1, meaning: '[sˤ] Emphatic "s" — pronounced with the tongue heavy and the back raised. Example: صَباح (ṣabāḥ) "morning". IPA /sˤ/.' },
  { char: 'ض', romanji: 'ḍād — ḍ', pronunciation: 'ضَاد', group: 'Emphatic (ص ض ط ظ)', strokes: 1, meaning: '[dˤ] Emphatic "d". Arabic is called "the language of the ḍād". One dot above. Example: ضَيْف (ḍayf) "guest". IPA /dˤ/.' },
  { char: 'ط', romanji: 'ṭāʾ — ṭ', pronunciation: 'طَاء', group: 'Emphatic (ص ض ط ظ)', strokes: 2, meaning: '[tˤ] Emphatic "t" — heavy and dark. Example: طَالِب (ṭālib) "student". IPA /tˤ/.' },
  { char: 'ظ', romanji: 'ẓāʾ — ẓ', pronunciation: 'ظَاء', group: 'Emphatic (ص ض ط ظ)', strokes: 2, meaning: '[ðˤ] Emphatic "dh/z". One dot above. Example: ظَهْر (ẓahr) "back". IPA /ðˤ/.' },
  { char: 'ع', romanji: 'ʿayn — ʿ', pronunciation: 'عَيْن', group: 'ʿAyn & Ghayn (ع غ)', strokes: 1, meaning: '[ʕ] Voiced pharyngeal — a tight "squeeze" from the throat with no English equivalent. Example: عَيْن (ʿayn) "eye". IPA /ʕ/.' },
  { char: 'غ', romanji: 'ghayn — gh', pronunciation: 'غَيْن', group: 'ʿAyn & Ghayn (ع غ)', strokes: 1, meaning: '[ɣ] Like the French/Parisian "r" — a gargled "gh". One dot above. Example: غُرْفة (ghurfa) "room". IPA /ɣ/.' },
  { char: 'ف', romanji: 'fāʾ — f', pronunciation: 'فَاء', group: 'Faa & Qaaf (ف ق)', strokes: 1, meaning: '[f] Like "f". One dot above. Example: فَم (fam) "mouth". IPA /f/.' },
  { char: 'ق', romanji: 'qāf — q', pronunciation: 'قَاف', group: 'Faa & Qaaf (ف ق)', strokes: 1, meaning: '[q] Deep "k" from far back (uvula). Two dots above. Often a glottal stop in Egyptian/Levantine city speech. Example: قَلْب (qalb) "heart". IPA /q/.' },
  { char: 'ك', romanji: 'kāf — k', pronunciation: 'كَاف', group: 'Kaaf, Laam, Meem (ك ل م)', strokes: 1, meaning: '[k] Like "k". Example: كِتاب (kitāb) "book". IPA /k/.' },
  { char: 'ل', romanji: 'lām — l', pronunciation: 'لَام', group: 'Kaaf, Laam, Meem (ك ل م)', strokes: 1, meaning: '[l] Like "l". With alif forms the ligature لا (lā). Example: لَيْل (layl) "night". IPA /l/.' },
  { char: 'م', romanji: 'mīm — m', pronunciation: 'مِيم', group: 'Kaaf, Laam, Meem (ك ل م)', strokes: 1, meaning: '[m] Like "m". Round head with a tail. Example: ماء (māʾ) "water". IPA /m/.' },
  { char: 'ن', romanji: 'nūn — n', pronunciation: 'نُون', group: 'Noon, Haa, Waaw, Yaa (ن ه و ي)', strokes: 1, meaning: '[n] Like "n". One dot above; deep bowl in isolation. Example: نَهْر (nahr) "river". IPA /n/.' },
  { char: 'ه', romanji: 'hāʾ — h', pronunciation: 'هَاء', group: 'Noon, Haa, Waaw, Yaa (ن ه و ي)', strokes: 1, meaning: '[h] Light "h" as in "hat". Changes shape a lot by position. Example: هُوَ (huwa) "he". IPA /h/.' },
  { char: 'و', romanji: 'wāw — w / ū', pronunciation: 'وَاو', group: 'Noon, Haa, Waaw, Yaa (ن ه و ي)', strokes: 1, meaning: '[w] / [uː] Consonant "w" or long vowel "ū". Non-connector. Example: وَرْد (ward) "roses"; نُور (nūr) "light". IPA /w/, /uː/.' },
  { char: 'ي', romanji: 'yāʾ — y / ī', pronunciation: 'يَاء', group: 'Noon, Haa, Waaw, Yaa (ن ه و ي)', strokes: 1, meaning: '[j] / [iː] Consonant "y" or long vowel "ī". Two dots below. Example: يَد (yad) "hand"; كَبِير (kabīr) "big". IPA /j/, /iː/.' },
];

// Short vowels, long-vowel carriers, and diacritics (tashkīl / ḥarakāt).
// These are written above/below a consonant; here they sit on a dotted circle
// placeholder (ـ) so the mark is visible on its own.
export const ARABIC_HARAKAT: Character[] = [
  { char: 'َ', romanji: 'fatḥa — a', pronunciation: 'فَتْحة', group: 'Short Vowels', strokes: 1, meaning: '[a] Short "a" — a small slash ABOVE the letter. بَ = "ba". IPA /a/.' },
  { char: 'ِ', romanji: 'kasra — i', pronunciation: 'كَسْرة', group: 'Short Vowels', strokes: 1, meaning: '[i] Short "i" — a small slash BELOW the letter. بِ = "bi". IPA /i/.' },
  { char: 'ُ', romanji: 'ḍamma — u', pronunciation: 'ضَمّة', group: 'Short Vowels', strokes: 1, meaning: '[u] Short "u" — a tiny wāw ABOVE the letter. بُ = "bu". IPA /u/.' },
  { char: 'ْ', romanji: 'sukūn — (no vowel)', pronunciation: 'سُكُون', group: 'Other Marks', strokes: 1, meaning: '[∅] Sukūn — a small circle marking NO vowel (the consonant closes a syllable). بْ = "b". ' },
  { char: 'ّ', romanji: 'shadda — doubling', pronunciation: 'شَدّة', group: 'Other Marks', strokes: 1, meaning: '[ː] Shadda — doubles/lengthens the consonant. رَبّ (rabb) "lord". Written as a small "w"-shape above.' },
  { char: 'ً', romanji: 'tanwīn fatḥ — an', pronunciation: 'تَنْوِين', group: 'Nunation (Tanwīn)', strokes: 1, meaning: '[an] Double fatḥa = final "-an", the indefinite accusative. شُكْرًا (shukran) "thanks". Often written on an added alif.' },
  { char: 'ٍ', romanji: 'tanwīn kasr — in', pronunciation: 'تَنْوِين', group: 'Nunation (Tanwīn)', strokes: 1, meaning: '[in] Double kasra = final "-in", the indefinite genitive. بَيْتٍ (baytin) "of a house".' },
  { char: 'ٌ', romanji: 'tanwīn ḍamm — un', pronunciation: 'تَنْوِين', group: 'Nunation (Tanwīn)', strokes: 1, meaning: '[un] Double ḍamma = final "-un", the indefinite nominative. بَيْتٌ (baytun) "a house".' },
  { char: 'ـَا', romanji: 'long ā (alif)', pronunciation: 'أَلِف مَدّ', group: 'Long Vowels', strokes: 1, meaning: '[aː] fatḥa + alif = long "ā". بَاب (bāb) "door". IPA /aː/.' },
  { char: 'ـُو', romanji: 'long ū (wāw)', pronunciation: 'واو مَدّ', group: 'Long Vowels', strokes: 1, meaning: '[uː] ḍamma + wāw = long "ū". نُور (nūr) "light". IPA /uː/.' },
  { char: 'ـِي', romanji: 'long ī (yāʾ)', pronunciation: 'ياء مَدّ', group: 'Long Vowels', strokes: 1, meaning: '[iː] kasra + yāʾ = long "ī". كَبِير (kabīr) "big". IPA /iː/.' },
];

// Special letters, ligatures and hamza carriers that beginners meet early.
export const ARABIC_SPECIAL: Character[] = [
  { char: 'ء', romanji: 'hamza — ʾ', pronunciation: 'هَمْزة', group: 'Hamza', strokes: 1, meaning: '[ʔ] Glottal stop — the catch in "uh-oh". Sits on a carrier (أ إ ؤ ئ) or alone. IPA /ʔ/.' },
  { char: 'أ', romanji: 'alif + hamza above', pronunciation: 'أَلِف هَمْزة', group: 'Hamza', strokes: 1, meaning: '[ʔa/ʔu] Hamza on alif, above = "a"/"u" onset. أَب (ʾab) "father".' },
  { char: 'إ', romanji: 'alif + hamza below', pronunciation: 'أَلِف هَمْزة', group: 'Hamza', strokes: 1, meaning: '[ʔi] Hamza on alif, below = "i" onset. إِسْم (ʾism) "name".' },
  { char: 'آ', romanji: 'alif madda — ā', pronunciation: 'أَلِف مَدّة', group: 'Hamza', strokes: 1, meaning: '[ʔaː] Alif with madda = a long "ā" onset. آسِف (ʾāsif) "sorry".' },
  { char: 'ة', romanji: 'tāʾ marbūṭa', pronunciation: 'تاء مَرْبُوطة', group: 'Special Forms', strokes: 1, meaning: '[a(t)] "Tied tāʾ" — marks most feminine nouns; a silent "-a" that becomes "-at" in construct. مَدْرَسة (madrasa) "school". Final only.' },
  { char: 'ى', romanji: 'alif maqṣūra', pronunciation: 'أَلِف مَقْصُورة', group: 'Special Forms', strokes: 1, meaning: '[aː] "Dotless yāʾ" pronounced as a final long "ā". عَلى (ʿalā) "on". Final only.' },
  { char: 'لا', romanji: 'lām-alif (lā)', pronunciation: 'لَام أَلِف', group: 'Special Forms', strokes: 1, meaning: '[laː] Obligatory ligature of lām + alif. لا (lā) "no". Any لا is written this way.' },
  { char: 'ال', romanji: 'al- (definite article)', pronunciation: 'أَل', group: 'Special Forms', strokes: 1, meaning: '["the"] The prefix "al-" attaches to a noun. Before "sun letters" the ل assimilates: الشَّمْس = "ash-shams" not "al-shams".' },
];

// Eastern Arabic numerals (used across the Mashriq). Written LEFT-TO-RIGHT
// even inside RTL text, exactly like Western numerals.
export const ARABIC_NUMERALS: Character[] = [
  { char: '٠', romanji: '0 — ṣifr', pronunciation: 'صِفْر', group: 'Numerals (٠–٩)', strokes: 1, meaning: '[0] "ṣifr" — the origin of the English word "zero". Note: ٠ (a dot) is zero, not five.' },
  { char: '١', romanji: '1 — wāḥid', pronunciation: 'واحِد', group: 'Numerals (٠–٩)', strokes: 1, meaning: '[1] "wāḥid".' },
  { char: '٢', romanji: '2 — ithnān', pronunciation: 'اِثْنان', group: 'Numerals (٠–٩)', strokes: 1, meaning: '[2] "ithnān".' },
  { char: '٣', romanji: '3 — thalātha', pronunciation: 'ثَلاثة', group: 'Numerals (٠–٩)', strokes: 1, meaning: '[3] "thalātha".' },
  { char: '٤', romanji: '4 — arbaʿa', pronunciation: 'أَرْبَعة', group: 'Numerals (٠–٩)', strokes: 1, meaning: '[4] "arbaʿa".' },
  { char: '٥', romanji: '5 — khamsa', pronunciation: 'خَمْسة', group: 'Numerals (٠–٩)', strokes: 1, meaning: '[5] "khamsa". Note: ٥ looks like a Western 0.' },
  { char: '٦', romanji: '6 — sitta', pronunciation: 'سِتّة', group: 'Numerals (٠–٩)', strokes: 1, meaning: '[6] "sitta".' },
  { char: '٧', romanji: '7 — sabʿa', pronunciation: 'سَبْعة', group: 'Numerals (٠–٩)', strokes: 1, meaning: '[7] "sabʿa".' },
  { char: '٨', romanji: '8 — thamāniya', pronunciation: 'ثَمانية', group: 'Numerals (٠–٩)', strokes: 1, meaning: '[8] "thamāniya".' },
  { char: '٩', romanji: '9 — tisʿa', pronunciation: 'تِسْعة', group: 'Numerals (٠–٩)', strokes: 1, meaning: '[9] "tisʿa".' },
];
