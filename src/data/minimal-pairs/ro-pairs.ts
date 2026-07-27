import type { MinimalPair } from './ja-pairs';

export const roMinimalPairs: MinimalPair[] = [
  // A-vowels: a vs ă vs â
  { id: 'ro-1', wordA: 'casă', wordB: 'casa', readingA: 'KAH-suh', readingB: 'KAH-sah', meaningA: 'a house', meaningB: 'the house', hint: 'final ă (schwa) vs a (definite article)', category: 'a-vowels' },
  { id: 'ro-2', wordA: 'văr', wordB: 'var', readingA: 'vuhr', readingB: 'var', meaningA: 'cousin', meaningB: 'lime (whitewash)', hint: 'ă (schwa) vs a', category: 'a-vowels' },
  { id: 'ro-3', wordA: 'păr', wordB: 'par', readingA: 'puhr', readingB: 'par', meaningA: 'hair', meaningB: 'stake / it seems', hint: 'ă (schwa) vs a', category: 'a-vowels' },
  { id: 'ro-4', wordA: 'râu', wordB: 'rău', readingA: 'ruh-oo (â)', readingB: 'ruh-oo (ă)', meaningA: 'river', meaningB: 'bad', hint: 'â (central) vs ă (schwa)', category: 'a-vowels' },

  // Ș & Ț vs S & T (comma-below consonants)
  { id: 'ro-5', wordA: 'și', wordB: 'si', readingA: 'shee', readingB: 'see', meaningA: 'and', meaningB: 'the note B (si)', hint: 'ș (sh) vs s', category: 'diacritic-consonants' },
  { id: 'ro-6', wordA: 'șold', wordB: 'sold', readingA: 'shold', readingB: 'sold', meaningA: 'hip', meaningB: 'balance / sale', hint: 'ș (sh) vs s', category: 'diacritic-consonants' },
  { id: 'ro-7', wordA: 'rață', wordB: 'rata', readingA: 'RAH-tsuh', readingB: 'RAH-tah', meaningA: 'duck', meaningB: 'the installment', hint: 'ț (ts) vs t', category: 'diacritic-consonants' },
  { id: 'ro-8', wordA: 'roți', wordB: 'roti', readingA: 'rots', readingB: 'roh-TEE', meaningA: 'wheels', meaningB: 'to brown (roast)', hint: 'ț (ts) vs t', category: 'diacritic-consonants' },

  // Soft vs hard C & G (ce/ci/ge/gi vs che/chi/ghe/ghi)
  { id: 'ro-9', wordA: 'cei', wordB: 'chei', readingA: 'chay', readingB: 'kay', meaningA: 'those (m. pl.)', meaningB: 'keys', hint: 'ce (ch) vs che (hard k)', category: 'c-g-soft' },
  { id: 'ro-10', wordA: 'gene', wordB: 'ghene', readingA: 'JEH-neh', readingB: 'GHEH-neh', meaningA: 'eyelashes', meaningB: 'refuse chutes', hint: 'ge (j) vs ghe (hard g)', category: 'c-g-soft' },
  { id: 'ro-11', wordA: 'unchi', wordB: 'unghi', readingA: 'OON-kee', readingB: 'OON-ghee', meaningA: 'uncle', meaningB: 'angle', hint: 'chi (hard k) vs ghi (hard g)', category: 'c-g-soft' },
  { id: 'ro-12', wordA: 'cer', wordB: 'ger', readingA: 'cher', readingB: 'jer', meaningA: 'sky', meaningB: 'frost', hint: 'ce (ch) vs ge (j)', category: 'c-g-soft' },

  // Î/I & diphthongs
  { id: 'ro-13', wordA: 'în', wordB: 'in', readingA: 'uhn', readingB: 'een', meaningA: 'in', meaningB: 'flax / linen', hint: 'î (central) vs i (ee)', category: 'i-diphthong' },
  { id: 'ro-14', wordA: 'lac', wordB: 'leac', readingA: 'lak', readingB: 'lyak', meaningA: 'lake', meaningB: 'remedy', hint: 'a vs ea (diphthong)', category: 'i-diphthong' },

  // Consonant contrasts
  { id: 'ro-15', wordA: 'vând', wordB: 'vânt', readingA: 'vuhnd', readingB: 'vuhnt', meaningA: 'I sell', meaningB: 'wind', hint: 'final d vs t', category: 'consonant' },
  { id: 'ro-16', wordA: 'pară', wordB: 'bară', readingA: 'PAH-ruh', readingB: 'BAH-ruh', meaningA: 'pear', meaningB: 'bar / beam', hint: 'p vs b', category: 'consonant' },

  // More contrasts
  { id: 'ro-17', wordA: 'fată', wordB: 'față', readingA: 'FAH-tuh', readingB: 'FAH-tsuh', meaningA: 'girl', meaningB: 'face', hint: 't vs ț (ts)', category: 'diacritic-consonants' },
  { id: 'ro-18', wordA: 'peste', wordB: 'pește', readingA: 'PES-teh', readingB: 'PESH-teh', meaningA: 'over / on', meaningB: 'fish', hint: 's vs ș (sh)', category: 'diacritic-consonants' },
  { id: 'ro-19', wordA: 'coș', wordB: 'cos', readingA: 'kosh', readingB: 'kos', meaningA: 'basket', meaningB: 'I sew', hint: 'ș (sh) vs s', category: 'diacritic-consonants' },
  { id: 'ro-20', wordA: 'vase', wordB: 'vaze', readingA: 'VAH-seh', readingB: 'VAH-zeh', meaningA: 'dishes / vessels', meaningB: 'vases', hint: 's (z-sound) vs z', category: 'consonant' },
  { id: 'ro-21', wordA: 'gât', wordB: 'cât', readingA: 'guht', readingB: 'kuht', meaningA: 'neck / throat', meaningB: 'how much', hint: 'g vs k', category: 'consonant' },
  { id: 'ro-22', wordA: 'sat', wordB: 'sac', readingA: 'sat', readingB: 'sak', meaningA: 'village', meaningB: 'sack / bag', hint: 'final t vs c (k)', category: 'consonant' },
  { id: 'ro-23', wordA: 'tată', wordB: 'toată', readingA: 'TAH-tuh', readingB: 'TWAH-tuh', meaningA: 'father', meaningB: 'all / whole (fem.)', hint: 'a vs oa (diphthong)', category: 'i-diphthong' },
  { id: 'ro-24', wordA: 'car', wordB: 'cară', readingA: 'kar', readingB: 'KAH-ruh', meaningA: 'cart', meaningB: '(he/she) carries', hint: 'final a vs ă (schwa)', category: 'a-vowels' },
];
