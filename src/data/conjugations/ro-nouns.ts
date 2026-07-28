// Romanian noun forms. Romanian marks definiteness with an *enclitic* article
// (attached to the end of the noun): casă → casa ("the house"). It also keeps a
// genitive-dative case. These three "forms" cover the essential noun declension
// a learner needs: indefinite, definite (nom/acc), and genitive-dative definite.

export type RoCaseName = 'nedefinit' | 'definit' | 'genitiv_dativ';

export const RO_CASE_LABELS: Record<RoCaseName, string> = {
  nedefinit: 'Nearticulat (a/some)',
  definit: 'Articulat N-Ac (the)',
  genitiv_dativ: 'Genitiv-Dativ articulat (of/to the)',
};

export interface RoNoun {
  nominative: string;
  meaning: string;
  gender: 'masculine' | 'feminine' | 'neuter';
  declensions: Record<RoCaseName, { singular: string; plural: string }>;
}

export const RO_NOUNS: RoNoun[] = [
  {
    nominative: 'casă',
    meaning: 'house',
    gender: 'feminine',
    declensions: {
      nedefinit: { singular: 'casă', plural: 'case' },
      definit: { singular: 'casa', plural: 'casele' },
      genitiv_dativ: { singular: 'casei', plural: 'caselor' },
    },
  },
  {
    nominative: 'băiat',
    meaning: 'boy',
    gender: 'masculine',
    declensions: {
      nedefinit: { singular: 'băiat', plural: 'băieți' },
      definit: { singular: 'băiatul', plural: 'băieții' },
      genitiv_dativ: { singular: 'băiatului', plural: 'băieților' },
    },
  },
  {
    nominative: 'fată',
    meaning: 'girl',
    gender: 'feminine',
    declensions: {
      nedefinit: { singular: 'fată', plural: 'fete' },
      definit: { singular: 'fata', plural: 'fetele' },
      genitiv_dativ: { singular: 'fetei', plural: 'fetelor' },
    },
  },
  {
    nominative: 'scaun',
    meaning: 'chair',
    gender: 'neuter',
    declensions: {
      nedefinit: { singular: 'scaun', plural: 'scaune' },
      definit: { singular: 'scaunul', plural: 'scaunele' },
      genitiv_dativ: { singular: 'scaunului', plural: 'scaunelor' },
    },
  },
  {
    nominative: 'carte',
    meaning: 'book',
    gender: 'feminine',
    declensions: {
      nedefinit: { singular: 'carte', plural: 'cărți' },
      definit: { singular: 'cartea', plural: 'cărțile' },
      genitiv_dativ: { singular: 'cărții', plural: 'cărților' },
    },
  },
  {
    nominative: 'om',
    meaning: 'man / person',
    gender: 'masculine',
    declensions: {
      nedefinit: { singular: 'om', plural: 'oameni' },
      definit: { singular: 'omul', plural: 'oamenii' },
      genitiv_dativ: { singular: 'omului', plural: 'oamenilor' },
    },
  },
  {
    nominative: 'floare',
    meaning: 'flower',
    gender: 'feminine',
    declensions: {
      nedefinit: { singular: 'floare', plural: 'flori' },
      definit: { singular: 'floarea', plural: 'florile' },
      genitiv_dativ: { singular: 'florii', plural: 'florilor' },
    },
  },
  {
    nominative: 'copil',
    meaning: 'child',
    gender: 'masculine',
    declensions: {
      nedefinit: { singular: 'copil', plural: 'copii' },
      definit: { singular: 'copilul', plural: 'copiii' },
      genitiv_dativ: { singular: 'copilului', plural: 'copiilor' },
    },
  },
  {
    nominative: 'masă',
    meaning: 'table',
    gender: 'feminine',
    declensions: {
      nedefinit: { singular: 'masă', plural: 'mese' },
      definit: { singular: 'masa', plural: 'mesele' },
      genitiv_dativ: { singular: 'mesei', plural: 'meselor' },
    },
  },
  {
    nominative: 'tren',
    meaning: 'train',
    gender: 'neuter',
    declensions: {
      nedefinit: { singular: 'tren', plural: 'trenuri' },
      definit: { singular: 'trenul', plural: 'trenurile' },
      genitiv_dativ: { singular: 'trenului', plural: 'trenurilor' },
    },
  },
  {
    nominative: 'câine',
    meaning: 'dog',
    gender: 'masculine',
    declensions: {
      nedefinit: { singular: 'câine', plural: 'câini' },
      definit: { singular: 'câinele', plural: 'câinii' },
      genitiv_dativ: { singular: 'câinelui', plural: 'câinilor' },
    },
  },
  {
    nominative: 'oraș',
    meaning: 'city / town',
    gender: 'neuter',
    declensions: {
      nedefinit: { singular: 'oraș', plural: 'orașe' },
      definit: { singular: 'orașul', plural: 'orașele' },
      genitiv_dativ: { singular: 'orașului', plural: 'orașelor' },
    },
  },
  {
    nominative: 'profesoară',
    meaning: 'teacher (female)',
    gender: 'feminine',
    declensions: {
      nedefinit: { singular: 'profesoară', plural: 'profesoare' },
      definit: { singular: 'profesoara', plural: 'profesoarele' },
      genitiv_dativ: { singular: 'profesoarei', plural: 'profesoarelor' },
    },
  },
  {
    nominative: 'prieten',
    meaning: 'friend (male)',
    gender: 'masculine',
    declensions: {
      nedefinit: { singular: 'prieten', plural: 'prieteni' },
      definit: { singular: 'prietenul', plural: 'prietenii' },
      genitiv_dativ: { singular: 'prietenului', plural: 'prietenilor' },
    },
  },
  {
    nominative: 'apă',
    meaning: 'water',
    gender: 'feminine',
    declensions: {
      nedefinit: { singular: 'apă', plural: 'ape' },
      definit: { singular: 'apa', plural: 'apele' },
      genitiv_dativ: { singular: 'apei', plural: 'apelor' },
    },
  },
  {
    nominative: 'drum',
    meaning: 'road / way',
    gender: 'neuter',
    declensions: {
      nedefinit: { singular: 'drum', plural: 'drumuri' },
      definit: { singular: 'drumul', plural: 'drumurile' },
      genitiv_dativ: { singular: 'drumului', plural: 'drumurilor' },
    },
  },
];
