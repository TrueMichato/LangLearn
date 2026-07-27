// Romanian adjective agreement. Romanian adjectives agree with their noun in
// gender and number. Most have four distinct forms; some (like "mare") have
// fewer. The drill practises producing each agreement form from the base
// (masculine singular) form.

export type RoAdjFormName = 'masc_sg' | 'fem_sg' | 'masc_pl' | 'fem_pl';

export const RO_ADJ_FORM_LABELS: Record<RoAdjFormName, string> = {
  masc_sg: 'Masculin singular',
  fem_sg: 'Feminin singular',
  masc_pl: 'Masculin plural',
  fem_pl: 'Feminin plural',
};

export interface RoAdjective {
  base: string;
  meaning: string;
  forms: Record<RoAdjFormName, string>;
}

export const RO_ADJECTIVES: RoAdjective[] = [
  { base: 'bun', meaning: 'good', forms: { masc_sg: 'bun', fem_sg: 'bună', masc_pl: 'buni', fem_pl: 'bune' } },
  { base: 'frumos', meaning: 'beautiful / handsome', forms: { masc_sg: 'frumos', fem_sg: 'frumoasă', masc_pl: 'frumoși', fem_pl: 'frumoase' } },
  { base: 'mic', meaning: 'small', forms: { masc_sg: 'mic', fem_sg: 'mică', masc_pl: 'mici', fem_pl: 'mici' } },
  { base: 'mare', meaning: 'big / large', forms: { masc_sg: 'mare', fem_sg: 'mare', masc_pl: 'mari', fem_pl: 'mari' } },
  { base: 'nou', meaning: 'new', forms: { masc_sg: 'nou', fem_sg: 'nouă', masc_pl: 'noi', fem_pl: 'noi' } },
  { base: 'vechi', meaning: 'old (of things)', forms: { masc_sg: 'vechi', fem_sg: 'veche', masc_pl: 'vechi', fem_pl: 'vechi' } },
  { base: 'roșu', meaning: 'red', forms: { masc_sg: 'roșu', fem_sg: 'roșie', masc_pl: 'roșii', fem_pl: 'roșii' } },
  { base: 'alb', meaning: 'white', forms: { masc_sg: 'alb', fem_sg: 'albă', masc_pl: 'albi', fem_pl: 'albe' } },
  { base: 'negru', meaning: 'black', forms: { masc_sg: 'negru', fem_sg: 'neagră', masc_pl: 'negri', fem_pl: 'negre' } },
  { base: 'înalt', meaning: 'tall / high', forms: { masc_sg: 'înalt', fem_sg: 'înaltă', masc_pl: 'înalți', fem_pl: 'înalte' } },
  { base: 'scump', meaning: 'expensive / dear', forms: { masc_sg: 'scump', fem_sg: 'scumpă', masc_pl: 'scumpi', fem_pl: 'scumpe' } },
  { base: 'ieftin', meaning: 'cheap', forms: { masc_sg: 'ieftin', fem_sg: 'ieftină', masc_pl: 'ieftini', fem_pl: 'ieftine' } },
  { base: 'tânăr', meaning: 'young', forms: { masc_sg: 'tânăr', fem_sg: 'tânără', masc_pl: 'tineri', fem_pl: 'tinere' } },
  { base: 'bătrân', meaning: 'old (of people)', forms: { masc_sg: 'bătrân', fem_sg: 'bătrână', masc_pl: 'bătrâni', fem_pl: 'bătrâne' } },
  { base: 'obosit', meaning: 'tired', forms: { masc_sg: 'obosit', fem_sg: 'obosită', masc_pl: 'obosiți', fem_pl: 'obosite' } },
  { base: 'deștept', meaning: 'clever / smart', forms: { masc_sg: 'deștept', fem_sg: 'deșteaptă', masc_pl: 'deștepți', fem_pl: 'deștepte' } },
  { base: 'fericit', meaning: 'happy', forms: { masc_sg: 'fericit', fem_sg: 'fericită', masc_pl: 'fericiți', fem_pl: 'fericite' } },
  { base: 'trist', meaning: 'sad', forms: { masc_sg: 'trist', fem_sg: 'tristă', masc_pl: 'triști', fem_pl: 'triste' } },
  { base: 'gras', meaning: 'fat', forms: { masc_sg: 'gras', fem_sg: 'grasă', masc_pl: 'grași', fem_pl: 'grase' } },
  { base: 'slab', meaning: 'thin / weak', forms: { masc_sg: 'slab', fem_sg: 'slabă', masc_pl: 'slabi', fem_pl: 'slabe' } },
  { base: 'lung', meaning: 'long', forms: { masc_sg: 'lung', fem_sg: 'lungă', masc_pl: 'lungi', fem_pl: 'lungi' } },
  { base: 'scurt', meaning: 'short', forms: { masc_sg: 'scurt', fem_sg: 'scurtă', masc_pl: 'scurți', fem_pl: 'scurte' } },
  { base: 'gros', meaning: 'thick', forms: { masc_sg: 'gros', fem_sg: 'groasă', masc_pl: 'groși', fem_pl: 'groase' } },
  { base: 'curat', meaning: 'clean', forms: { masc_sg: 'curat', fem_sg: 'curată', masc_pl: 'curați', fem_pl: 'curate' } },
  { base: 'greu', meaning: 'heavy / difficult', forms: { masc_sg: 'greu', fem_sg: 'grea', masc_pl: 'grei', fem_pl: 'grele' } },
  { base: 'ușor', meaning: 'light / easy', forms: { masc_sg: 'ușor', fem_sg: 'ușoară', masc_pl: 'ușori', fem_pl: 'ușoare' } },
  { base: 'galben', meaning: 'yellow', forms: { masc_sg: 'galben', fem_sg: 'galbenă', masc_pl: 'galbeni', fem_pl: 'galbene' } },
  { base: 'verde', meaning: 'green', forms: { masc_sg: 'verde', fem_sg: 'verde', masc_pl: 'verzi', fem_pl: 'verzi' } },
  { base: 'albastru', meaning: 'blue', forms: { masc_sg: 'albastru', fem_sg: 'albastră', masc_pl: 'albaștri', fem_pl: 'albastre' } },
];
