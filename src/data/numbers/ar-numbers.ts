// Arabic numbers with their fully spelled-out written forms (Tafqit-style).
// `word` is the standard written/counting form (diacritized); `reading` is the
// scholarly transliteration; `numeral` is the Eastern-Arabic digit form.
// Ranges let the practice drill scale from single digits up to thousands.
export interface NumberEntry {
  value: number;
  numeral: string; // Eastern-Arabic digits, e.g. ٧ or ٢٥
  word: string;    // spelled out in Arabic (diacritized)
  reading: string; // transliteration
  range: 'ones' | 'teens' | 'tens' | 'hundreds' | 'thousands';
}

export const arNumbers: NumberEntry[] = [
  // ── Ones (0–10) ──
  { value: 0, numeral: '٠', word: 'صِفْر', reading: 'ṣifr', range: 'ones' },
  { value: 1, numeral: '١', word: 'واحِد', reading: 'wāḥid', range: 'ones' },
  { value: 2, numeral: '٢', word: 'اِثْنان', reading: 'ithnān', range: 'ones' },
  { value: 3, numeral: '٣', word: 'ثَلاثة', reading: 'thalātha', range: 'ones' },
  { value: 4, numeral: '٤', word: 'أَرْبَعة', reading: 'arbaʿa', range: 'ones' },
  { value: 5, numeral: '٥', word: 'خَمْسة', reading: 'khamsa', range: 'ones' },
  { value: 6, numeral: '٦', word: 'سِتّة', reading: 'sitta', range: 'ones' },
  { value: 7, numeral: '٧', word: 'سَبْعة', reading: 'sabʿa', range: 'ones' },
  { value: 8, numeral: '٨', word: 'ثَمانية', reading: 'thamāniya', range: 'ones' },
  { value: 9, numeral: '٩', word: 'تِسْعة', reading: 'tisʿa', range: 'ones' },
  { value: 10, numeral: '١٠', word: 'عَشَرة', reading: 'ʿashara', range: 'ones' },

  // ── Teens (11–19) ──
  { value: 11, numeral: '١١', word: 'أَحَدَ عَشَر', reading: 'aḥada ʿashar', range: 'teens' },
  { value: 12, numeral: '١٢', word: 'اِثْنا عَشَر', reading: 'ithnā ʿashar', range: 'teens' },
  { value: 13, numeral: '١٣', word: 'ثَلاثةَ عَشَر', reading: 'thalāthata ʿashar', range: 'teens' },
  { value: 14, numeral: '١٤', word: 'أَرْبَعةَ عَشَر', reading: 'arbaʿata ʿashar', range: 'teens' },
  { value: 15, numeral: '١٥', word: 'خَمْسةَ عَشَر', reading: 'khamsata ʿashar', range: 'teens' },
  { value: 16, numeral: '١٦', word: 'سِتّةَ عَشَر', reading: 'sittata ʿashar', range: 'teens' },
  { value: 17, numeral: '١٧', word: 'سَبْعةَ عَشَر', reading: 'sabʿata ʿashar', range: 'teens' },
  { value: 18, numeral: '١٨', word: 'ثَمانيةَ عَشَر', reading: 'thamāniyata ʿashar', range: 'teens' },
  { value: 19, numeral: '١٩', word: 'تِسْعةَ عَشَر', reading: 'tisʿata ʿashar', range: 'teens' },

  // ── Tens & compounds (20–99) ──
  { value: 20, numeral: '٢٠', word: 'عِشْرُون', reading: 'ʿishrūn', range: 'tens' },
  { value: 21, numeral: '٢١', word: 'واحِد وعِشْرُون', reading: 'wāḥid wa-ʿishrūn', range: 'tens' },
  { value: 25, numeral: '٢٥', word: 'خَمْسة وعِشْرُون', reading: 'khamsa wa-ʿishrūn', range: 'tens' },
  { value: 30, numeral: '٣٠', word: 'ثَلاثُون', reading: 'thalāthūn', range: 'tens' },
  { value: 33, numeral: '٣٣', word: 'ثَلاثة وثَلاثُون', reading: 'thalātha wa-thalāthūn', range: 'tens' },
  { value: 40, numeral: '٤٠', word: 'أَرْبَعُون', reading: 'arbaʿūn', range: 'tens' },
  { value: 47, numeral: '٤٧', word: 'سَبْعة وأَرْبَعُون', reading: 'sabʿa wa-arbaʿūn', range: 'tens' },
  { value: 50, numeral: '٥٠', word: 'خَمْسُون', reading: 'khamsūn', range: 'tens' },
  { value: 60, numeral: '٦٠', word: 'سِتُّون', reading: 'sittūn', range: 'tens' },
  { value: 70, numeral: '٧٠', word: 'سَبْعُون', reading: 'sabʿūn', range: 'tens' },
  { value: 80, numeral: '٨٠', word: 'ثَمانُون', reading: 'thamānūn', range: 'tens' },
  { value: 90, numeral: '٩٠', word: 'تِسْعُون', reading: 'tisʿūn', range: 'tens' },
  { value: 99, numeral: '٩٩', word: 'تِسْعة وتِسْعُون', reading: 'tisʿa wa-tisʿūn', range: 'tens' },

  // ── Hundreds (100–999) ──
  { value: 100, numeral: '١٠٠', word: 'مِئة', reading: 'miʾa', range: 'hundreds' },
  { value: 200, numeral: '٢٠٠', word: 'مِئتان', reading: 'miʾatān', range: 'hundreds' },
  { value: 250, numeral: '٢٥٠', word: 'مِئتان وخَمْسُون', reading: 'miʾatān wa-khamsūn', range: 'hundreds' },
  { value: 300, numeral: '٣٠٠', word: 'ثَلاثُمِئة', reading: 'thalāthumiʾa', range: 'hundreds' },
  { value: 500, numeral: '٥٠٠', word: 'خَمْسُمِئة', reading: 'khamsumiʾa', range: 'hundreds' },
  { value: 700, numeral: '٧٠٠', word: 'سَبْعُمِئة', reading: 'sabʿumiʾa', range: 'hundreds' },

  // ── Thousands ──
  { value: 1000, numeral: '١٠٠٠', word: 'أَلْف', reading: 'alf', range: 'thousands' },
  { value: 2000, numeral: '٢٠٠٠', word: 'أَلْفان', reading: 'alfān', range: 'thousands' },
  { value: 3000, numeral: '٣٠٠٠', word: 'ثَلاثةُ آلاف', reading: 'thalāthatu ālāf', range: 'thousands' },
  { value: 1000000, numeral: '١٠٠٠٠٠٠', word: 'مِلْيُون', reading: 'milyūn', range: 'thousands' },
];
