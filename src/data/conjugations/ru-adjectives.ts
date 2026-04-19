export type RuAdjectiveCaseName =
  | 'nominative'
  | 'genitive'
  | 'dative'
  | 'accusative_inanimate'
  | 'accusative_animate'
  | 'instrumental'
  | 'prepositional';

export const RU_ADJ_CASE_LABELS: Record<RuAdjectiveCaseName, string> = {
  nominative: 'Nominative (какой?)',
  genitive: 'Genitive (какого?)',
  dative: 'Dative (какому?)',
  accusative_inanimate: 'Accusative inanimate (какой?)',
  accusative_animate: 'Accusative animate (какого?)',
  instrumental: 'Instrumental (каким?)',
  prepositional: 'Prepositional (о каком?)',
};

export interface RuAdjective {
  masculine_nom: string;
  meaning: string;
  stem_type: 'hard' | 'soft' | 'mixed';
  declensions: Record<RuAdjectiveCaseName, {
    masculine: string;
    feminine: string;
    neuter: string;
    plural: string;
  }>;
}

export const RU_ADJECTIVES: RuAdjective[] = [
  // ── Hard stem (8) ──
  {
    masculine_nom: 'новый',
    meaning: 'new',
    stem_type: 'hard',
    declensions: {
      nominative:           { masculine: 'новый',   feminine: 'новая',  neuter: 'новое',  plural: 'новые' },
      genitive:             { masculine: 'нового',  feminine: 'новой',  neuter: 'нового', plural: 'новых' },
      dative:               { masculine: 'новому',  feminine: 'новой',  neuter: 'новому', plural: 'новым' },
      accusative_inanimate: { masculine: 'новый',   feminine: 'новую',  neuter: 'новое',  plural: 'новые' },
      accusative_animate:   { masculine: 'нового',  feminine: 'новую',  neuter: 'новое',  plural: 'новых' },
      instrumental:         { masculine: 'новым',   feminine: 'новой',  neuter: 'новым',  plural: 'новыми' },
      prepositional:        { masculine: 'новом',   feminine: 'новой',  neuter: 'новом',  plural: 'новых' },
    },
  },
  {
    masculine_nom: 'красивый',
    meaning: 'beautiful',
    stem_type: 'hard',
    declensions: {
      nominative:           { masculine: 'красивый',   feminine: 'красивая',  neuter: 'красивое',  plural: 'красивые' },
      genitive:             { masculine: 'красивого',  feminine: 'красивой',  neuter: 'красивого', plural: 'красивых' },
      dative:               { masculine: 'красивому',  feminine: 'красивой',  neuter: 'красивому', plural: 'красивым' },
      accusative_inanimate: { masculine: 'красивый',   feminine: 'красивую',  neuter: 'красивое',  plural: 'красивые' },
      accusative_animate:   { masculine: 'красивого',  feminine: 'красивую',  neuter: 'красивое',  plural: 'красивых' },
      instrumental:         { masculine: 'красивым',   feminine: 'красивой',  neuter: 'красивым',  plural: 'красивыми' },
      prepositional:        { masculine: 'красивом',   feminine: 'красивой',  neuter: 'красивом',  plural: 'красивых' },
    },
  },
  {
    masculine_nom: 'старый',
    meaning: 'old',
    stem_type: 'hard',
    declensions: {
      nominative:           { masculine: 'старый',   feminine: 'старая',  neuter: 'старое',  plural: 'старые' },
      genitive:             { masculine: 'старого',  feminine: 'старой',  neuter: 'старого', plural: 'старых' },
      dative:               { masculine: 'старому',  feminine: 'старой',  neuter: 'старому', plural: 'старым' },
      accusative_inanimate: { masculine: 'старый',   feminine: 'старую',  neuter: 'старое',  plural: 'старые' },
      accusative_animate:   { masculine: 'старого',  feminine: 'старую',  neuter: 'старое',  plural: 'старых' },
      instrumental:         { masculine: 'старым',   feminine: 'старой',  neuter: 'старым',  plural: 'старыми' },
      prepositional:        { masculine: 'старом',   feminine: 'старой',  neuter: 'старом',  plural: 'старых' },
    },
  },
  {
    masculine_nom: 'большой',
    meaning: 'big',
    stem_type: 'hard',
    declensions: {
      nominative:           { masculine: 'большой',   feminine: 'большая',  neuter: 'большое',  plural: 'большие' },
      genitive:             { masculine: 'большого',  feminine: 'большой',  neuter: 'большого', plural: 'больших' },
      dative:               { masculine: 'большому',  feminine: 'большой',  neuter: 'большому', plural: 'большим' },
      accusative_inanimate: { masculine: 'большой',   feminine: 'большую',  neuter: 'большое',  plural: 'большие' },
      accusative_animate:   { masculine: 'большого',  feminine: 'большую',  neuter: 'большое',  plural: 'больших' },
      instrumental:         { masculine: 'большим',   feminine: 'большой',  neuter: 'большим',  plural: 'большими' },
      prepositional:        { masculine: 'большом',   feminine: 'большой',  neuter: 'большом',  plural: 'больших' },
    },
  },
  {
    masculine_nom: 'молодой',
    meaning: 'young',
    stem_type: 'hard',
    declensions: {
      nominative:           { masculine: 'молодой',   feminine: 'молодая',  neuter: 'молодое',  plural: 'молодые' },
      genitive:             { masculine: 'молодого',  feminine: 'молодой',  neuter: 'молодого', plural: 'молодых' },
      dative:               { masculine: 'молодому',  feminine: 'молодой',  neuter: 'молодому', plural: 'молодым' },
      accusative_inanimate: { masculine: 'молодой',   feminine: 'молодую',  neuter: 'молодое',  plural: 'молодые' },
      accusative_animate:   { masculine: 'молодого',  feminine: 'молодую',  neuter: 'молодое',  plural: 'молодых' },
      instrumental:         { masculine: 'молодым',   feminine: 'молодой',  neuter: 'молодым',  plural: 'молодыми' },
      prepositional:        { masculine: 'молодом',   feminine: 'молодой',  neuter: 'молодом',  plural: 'молодых' },
    },
  },
  {
    masculine_nom: 'хороший',
    meaning: 'good',
    stem_type: 'mixed',
    declensions: {
      nominative:           { masculine: 'хороший',   feminine: 'хорошая',  neuter: 'хорошее',  plural: 'хорошие' },
      genitive:             { masculine: 'хорошего',  feminine: 'хорошей',  neuter: 'хорошего', plural: 'хороших' },
      dative:               { masculine: 'хорошему',  feminine: 'хорошей',  neuter: 'хорошему', plural: 'хорошим' },
      accusative_inanimate: { masculine: 'хороший',   feminine: 'хорошую',  neuter: 'хорошее',  plural: 'хорошие' },
      accusative_animate:   { masculine: 'хорошего',  feminine: 'хорошую',  neuter: 'хорошее',  plural: 'хороших' },
      instrumental:         { masculine: 'хорошим',   feminine: 'хорошей',  neuter: 'хорошим',  plural: 'хорошими' },
      prepositional:        { masculine: 'хорошем',   feminine: 'хорошей',  neuter: 'хорошем',  plural: 'хороших' },
    },
  },
  {
    masculine_nom: 'плохой',
    meaning: 'bad',
    stem_type: 'hard',
    declensions: {
      nominative:           { masculine: 'плохой',   feminine: 'плохая',  neuter: 'плохое',  plural: 'плохие' },
      genitive:             { masculine: 'плохого',  feminine: 'плохой',  neuter: 'плохого', plural: 'плохих' },
      dative:               { masculine: 'плохому',  feminine: 'плохой',  neuter: 'плохому', plural: 'плохим' },
      accusative_inanimate: { masculine: 'плохой',   feminine: 'плохую',  neuter: 'плохое',  plural: 'плохие' },
      accusative_animate:   { masculine: 'плохого',  feminine: 'плохую',  neuter: 'плохое',  plural: 'плохих' },
      instrumental:         { masculine: 'плохим',   feminine: 'плохой',  neuter: 'плохим',  plural: 'плохими' },
      prepositional:        { masculine: 'плохом',   feminine: 'плохой',  neuter: 'плохом',  plural: 'плохих' },
    },
  },
  {
    masculine_nom: 'дорогой',
    meaning: 'expensive / dear',
    stem_type: 'hard',
    declensions: {
      nominative:           { masculine: 'дорогой',   feminine: 'дорогая',  neuter: 'дорогое',  plural: 'дорогие' },
      genitive:             { masculine: 'дорогого',  feminine: 'дорогой',  neuter: 'дорогого', plural: 'дорогих' },
      dative:               { masculine: 'дорогому',  feminine: 'дорогой',  neuter: 'дорогому', plural: 'дорогим' },
      accusative_inanimate: { masculine: 'дорогой',   feminine: 'дорогую',  neuter: 'дорогое',  plural: 'дорогие' },
      accusative_animate:   { masculine: 'дорогого',  feminine: 'дорогую',  neuter: 'дорогое',  plural: 'дорогих' },
      instrumental:         { masculine: 'дорогим',   feminine: 'дорогой',  neuter: 'дорогим',  plural: 'дорогими' },
      prepositional:        { masculine: 'дорогом',   feminine: 'дорогой',  neuter: 'дорогом',  plural: 'дорогих' },
    },
  },
  // ── Soft stem (3) ──
  {
    masculine_nom: 'синий',
    meaning: 'dark blue',
    stem_type: 'soft',
    declensions: {
      nominative:           { masculine: 'синий',   feminine: 'синяя',  neuter: 'синее',  plural: 'синие' },
      genitive:             { masculine: 'синего',  feminine: 'синей',  neuter: 'синего', plural: 'синих' },
      dative:               { masculine: 'синему',  feminine: 'синей',  neuter: 'синему', plural: 'синим' },
      accusative_inanimate: { masculine: 'синий',   feminine: 'синюю',  neuter: 'синее',  plural: 'синие' },
      accusative_animate:   { masculine: 'синего',  feminine: 'синюю',  neuter: 'синее',  plural: 'синих' },
      instrumental:         { masculine: 'синим',   feminine: 'синей',  neuter: 'синим',  plural: 'синими' },
      prepositional:        { masculine: 'синем',   feminine: 'синей',  neuter: 'синем',  plural: 'синих' },
    },
  },
  {
    masculine_nom: 'последний',
    meaning: 'last',
    stem_type: 'soft',
    declensions: {
      nominative:           { masculine: 'последний',   feminine: 'последняя',  neuter: 'последнее',  plural: 'последние' },
      genitive:             { masculine: 'последнего',  feminine: 'последней',  neuter: 'последнего', plural: 'последних' },
      dative:               { masculine: 'последнему',  feminine: 'последней',  neuter: 'последнему', plural: 'последним' },
      accusative_inanimate: { masculine: 'последний',   feminine: 'последнюю',  neuter: 'последнее',  plural: 'последние' },
      accusative_animate:   { masculine: 'последнего',  feminine: 'последнюю',  neuter: 'последнее',  plural: 'последних' },
      instrumental:         { masculine: 'последним',   feminine: 'последней',  neuter: 'последним',  plural: 'последними' },
      prepositional:        { masculine: 'последнем',   feminine: 'последней',  neuter: 'последнем',  plural: 'последних' },
    },
  },
  {
    masculine_nom: 'домашний',
    meaning: 'home / domestic',
    stem_type: 'soft',
    declensions: {
      nominative:           { masculine: 'домашний',   feminine: 'домашняя',  neuter: 'домашнее',  plural: 'домашние' },
      genitive:             { masculine: 'домашнего',  feminine: 'домашней',  neuter: 'домашнего', plural: 'домашних' },
      dative:               { masculine: 'домашнему',  feminine: 'домашней',  neuter: 'домашнему', plural: 'домашним' },
      accusative_inanimate: { masculine: 'домашний',   feminine: 'домашнюю',  neuter: 'домашнее',  plural: 'домашние' },
      accusative_animate:   { masculine: 'домашнего',  feminine: 'домашнюю',  neuter: 'домашнее',  plural: 'домашних' },
      instrumental:         { masculine: 'домашним',   feminine: 'домашней',  neuter: 'домашним',  plural: 'домашними' },
      prepositional:        { masculine: 'домашнем',   feminine: 'домашней',  neuter: 'домашнем',  plural: 'домашних' },
    },
  },
  // ── Mixed / special (4) ──
  {
    masculine_nom: 'русский',
    meaning: 'Russian',
    stem_type: 'mixed',
    declensions: {
      nominative:           { masculine: 'русский',   feminine: 'русская',  neuter: 'русское',  plural: 'русские' },
      genitive:             { masculine: 'русского',  feminine: 'русской',  neuter: 'русского', plural: 'русских' },
      dative:               { masculine: 'русскому',  feminine: 'русской',  neuter: 'русскому', plural: 'русским' },
      accusative_inanimate: { masculine: 'русский',   feminine: 'русскую',  neuter: 'русское',  plural: 'русские' },
      accusative_animate:   { masculine: 'русского',  feminine: 'русскую',  neuter: 'русское',  plural: 'русских' },
      instrumental:         { masculine: 'русским',   feminine: 'русской',  neuter: 'русским',  plural: 'русскими' },
      prepositional:        { masculine: 'русском',   feminine: 'русской',  neuter: 'русском',  plural: 'русских' },
    },
  },
  {
    masculine_nom: 'маленький',
    meaning: 'small',
    stem_type: 'mixed',
    declensions: {
      nominative:           { masculine: 'маленький',   feminine: 'маленькая',  neuter: 'маленькое',  plural: 'маленькие' },
      genitive:             { masculine: 'маленького',  feminine: 'маленькой',  neuter: 'маленького', plural: 'маленьких' },
      dative:               { masculine: 'маленькому',  feminine: 'маленькой',  neuter: 'маленькому', plural: 'маленьким' },
      accusative_inanimate: { masculine: 'маленький',   feminine: 'маленькую',  neuter: 'маленькое',  plural: 'маленькие' },
      accusative_animate:   { masculine: 'маленького',  feminine: 'маленькую',  neuter: 'маленькое',  plural: 'маленьких' },
      instrumental:         { masculine: 'маленьким',   feminine: 'маленькой',  neuter: 'маленьким',  plural: 'маленькими' },
      prepositional:        { masculine: 'маленьком',   feminine: 'маленькой',  neuter: 'маленьком',  plural: 'маленьких' },
    },
  },
  {
    masculine_nom: 'короткий',
    meaning: 'short',
    stem_type: 'mixed',
    declensions: {
      nominative:           { masculine: 'короткий',   feminine: 'короткая',  neuter: 'короткое',  plural: 'короткие' },
      genitive:             { masculine: 'короткого',  feminine: 'короткой',  neuter: 'короткого', plural: 'коротких' },
      dative:               { masculine: 'короткому',  feminine: 'короткой',  neuter: 'короткому', plural: 'коротким' },
      accusative_inanimate: { masculine: 'короткий',   feminine: 'короткую',  neuter: 'короткое',  plural: 'короткие' },
      accusative_animate:   { masculine: 'короткого',  feminine: 'короткую',  neuter: 'короткое',  plural: 'коротких' },
      instrumental:         { masculine: 'коротким',   feminine: 'короткой',  neuter: 'коротким',  plural: 'короткими' },
      prepositional:        { masculine: 'коротком',   feminine: 'короткой',  neuter: 'коротком',  plural: 'коротких' },
    },
  },
  {
    masculine_nom: 'лёгкий',
    meaning: 'easy / light',
    stem_type: 'mixed',
    declensions: {
      nominative:           { masculine: 'лёгкий',   feminine: 'лёгкая',  neuter: 'лёгкое',  plural: 'лёгкие' },
      genitive:             { masculine: 'лёгкого',  feminine: 'лёгкой',  neuter: 'лёгкого', plural: 'лёгких' },
      dative:               { masculine: 'лёгкому',  feminine: 'лёгкой',  neuter: 'лёгкому', plural: 'лёгким' },
      accusative_inanimate: { masculine: 'лёгкий',   feminine: 'лёгкую',  neuter: 'лёгкое',  plural: 'лёгкие' },
      accusative_animate:   { masculine: 'лёгкого',  feminine: 'лёгкую',  neuter: 'лёгкое',  plural: 'лёгких' },
      instrumental:         { masculine: 'лёгким',   feminine: 'лёгкой',  neuter: 'лёгким',  plural: 'лёгкими' },
      prepositional:        { masculine: 'лёгком',   feminine: 'лёгкой',  neuter: 'лёгком',  plural: 'лёгких' },
    },
  },
];
