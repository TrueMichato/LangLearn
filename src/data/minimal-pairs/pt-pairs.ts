import type { MinimalPair } from './ja-pairs';

export const ptMinimalPairs: MinimalPair[] = [
  // Open vs closed vowels (á vs â, é vs ê, ó vs ô)
  { id: 'pt-1', wordA: 'avó', wordB: 'avô', readingA: 'ah-VAW', readingB: 'ah-VOH', meaningA: 'grandmother', meaningB: 'grandfather', hint: 'ó (open) vs ô (closed)', category: 'open-closed' },
  { id: 'pt-2', wordA: 'pé', wordB: 'pê', readingA: 'PEH', readingB: 'PAY', meaningA: 'foot', meaningB: 'letter P', hint: 'é (open) vs ê (closed)', category: 'open-closed' },
  { id: 'pt-3', wordA: 'pode', wordB: 'pôde', readingA: 'PAW-jee', readingB: 'POH-jee', meaningA: 'can (present)', meaningB: 'could (past)', hint: 'o (open) vs ô (closed)', category: 'open-closed' },
  { id: 'pt-4', wordA: 'seu', wordB: 'céu', readingA: 'SEH-oo', readingB: 'SEH-oo', meaningA: 'your', meaningB: 'sky', hint: 's vs c before eu', category: 'consonant' },

  // Nasal vs oral vowels (ã/õ vs a/o)
  { id: 'pt-5', wordA: 'lã', wordB: 'lá', readingA: 'LAHN', readingB: 'LAH', meaningA: 'wool', meaningB: 'there', hint: 'ã (nasal) vs á (oral)', category: 'nasal' },
  { id: 'pt-6', wordA: 'mão', wordB: 'mau', readingA: 'MAHW̃', readingB: 'MAH-oo', meaningA: 'hand', meaningB: 'bad', hint: 'ão (nasal) vs au (oral)', category: 'nasal' },
  { id: 'pt-7', wordA: 'pão', wordB: 'pau', readingA: 'PAHW̃', readingB: 'PAH-oo', meaningA: 'bread', meaningB: 'stick', hint: 'ão (nasal) vs au (oral)', category: 'nasal' },
  { id: 'pt-8', wordA: 'sim', wordB: 'si', readingA: 'SEEN', readingB: 'SEE', meaningA: 'yes', meaningB: 'B (music note)', hint: 'im (nasal) vs i (oral)', category: 'nasal' },

  // S/Z sounds (s vs z, ss vs s between vowels)
  { id: 'pt-9', wordA: 'caça', wordB: 'casa', readingA: 'KAH-sah', readingB: 'KAH-zah', meaningA: 'hunt', meaningB: 'house', hint: 'ç (ss) vs s (z between vowels)', category: 'sibilant' },
  { id: 'pt-10', wordA: 'aço', wordB: 'asso', readingA: 'AH-soo', readingB: 'AH-soo', meaningA: 'steel', meaningB: 'I roast', hint: 'ç vs ss (same sound)', category: 'sibilant' },
  { id: 'pt-11', wordA: 'preço', wordB: 'preso', readingA: 'PREH-soo', readingB: 'PREH-zoo', meaningA: 'price', meaningB: 'prisoner', hint: 'ç (s) vs s (z)', category: 'sibilant' },

  // R sounds (strong R vs tap r)
  { id: 'pt-12', wordA: 'caro', wordB: 'carro', readingA: 'KAH-roo', readingB: 'KAH-hoo', meaningA: 'expensive', meaningB: 'car', hint: 'r (tap) vs rr (strong)', category: 'r-sounds' },
  { id: 'pt-13', wordA: 'fera', wordB: 'ferra', readingA: 'FEH-rah', readingB: 'FEH-hah', meaningA: 'beast', meaningB: 'to brand (iron)', hint: 'r (tap) vs rr (strong)', category: 'r-sounds' },
  { id: 'pt-14', wordA: 'muro', wordB: 'murro', readingA: 'MOO-roo', readingB: 'MOO-hoo', meaningA: 'wall', meaningB: 'punch', hint: 'r (tap) vs rr (strong)', category: 'r-sounds' },

  // Stress position / accent marks
  { id: 'pt-15', wordA: 'sabia', wordB: 'sabiá', readingA: 'sah-BEE-ah', readingB: 'sah-bee-AH', meaningA: 'knew (she)', meaningB: 'thrush (bird)', hint: 'stress on 2nd vs 3rd syllable', category: 'stress' },
  { id: 'pt-16', wordA: 'secretaria', wordB: 'secretária', readingA: 'seh-kreh-tah-REE-ah', readingB: 'seh-kreh-TAH-ree-ah', meaningA: 'office', meaningB: 'secretary', hint: 'stress shift changes meaning', category: 'stress' },
  { id: 'pt-17', wordA: 'numero', wordB: 'número', readingA: 'noo-MEH-roo', readingB: 'NOO-meh-roo', meaningA: 'I number (verb)', meaningB: 'number (noun)', hint: 'stress on 2nd vs 1st syllable', category: 'stress' },

  // L vs lh, n vs nh (palatal consonants)
  { id: 'pt-18', wordA: 'fila', wordB: 'filha', readingA: 'FEE-lah', readingB: 'FEE-lyah', meaningA: 'line/queue', meaningB: 'daughter', hint: 'l vs lh (palatal)', category: 'palatal' },
  { id: 'pt-19', wordA: 'mina', wordB: 'minha', readingA: 'MEE-nah', readingB: 'MEE-nyah', meaningA: 'mine (noun)', meaningB: 'my (fem)', hint: 'n vs nh (palatal)', category: 'palatal' },
  { id: 'pt-20', wordA: 'sono', wordB: 'sonho', readingA: 'SOH-noo', readingB: 'SOH-nyoo', meaningA: 'sleep', meaningB: 'dream', hint: 'n vs nh (palatal)', category: 'palatal' },
];
