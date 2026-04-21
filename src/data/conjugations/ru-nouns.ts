export type RuCaseName =
  | 'nominative'
  | 'genitive'
  | 'dative'
  | 'accusative'
  | 'instrumental'
  | 'prepositional';

export const RU_CASE_LABELS: Record<RuCaseName, string> = {
  nominative: 'Nominative (кто? что?)',
  genitive: 'Genitive (кого? чего?)',
  dative: 'Dative (кому? чему?)',
  accusative: 'Accusative (кого? что?)',
  instrumental: 'Instrumental (кем? чем?)',
  prepositional: 'Prepositional (о ком? о чём?)',
};

export interface RuNoun {
  nominative: string;
  meaning: string;
  gender: 'masculine' | 'feminine' | 'neuter';
  declensions: Record<RuCaseName, { singular: string; plural: string }>;
}

export const RU_NOUNS: RuNoun[] = [
  {
    nominative: 'дом',
    meaning: 'house',
    gender: 'masculine',
    declensions: {
      nominative: { singular: 'дом', plural: 'дома' },
      genitive: { singular: 'дома', plural: 'домов' },
      dative: { singular: 'дому', plural: 'домам' },
      accusative: { singular: 'дом', plural: 'дома' },
      instrumental: { singular: 'домом', plural: 'домами' },
      prepositional: { singular: 'доме', plural: 'домах' },
    },
  },
  {
    nominative: 'книга',
    meaning: 'book',
    gender: 'feminine',
    declensions: {
      nominative: { singular: 'книга', plural: 'книги' },
      genitive: { singular: 'книги', plural: 'книг' },
      dative: { singular: 'книге', plural: 'книгам' },
      accusative: { singular: 'книгу', plural: 'книги' },
      instrumental: { singular: 'книгой', plural: 'книгами' },
      prepositional: { singular: 'книге', plural: 'книгах' },
    },
  },
  {
    nominative: 'окно',
    meaning: 'window',
    gender: 'neuter',
    declensions: {
      nominative: { singular: 'окно', plural: 'окна' },
      genitive: { singular: 'окна', plural: 'окон' },
      dative: { singular: 'окну', plural: 'окнам' },
      accusative: { singular: 'окно', plural: 'окна' },
      instrumental: { singular: 'окном', plural: 'окнами' },
      prepositional: { singular: 'окне', plural: 'окнах' },
    },
  },
  {
    nominative: 'учитель',
    meaning: 'teacher',
    gender: 'masculine',
    declensions: {
      nominative: { singular: 'учитель', plural: 'учителя' },
      genitive: { singular: 'учителя', plural: 'учителей' },
      dative: { singular: 'учителю', plural: 'учителям' },
      accusative: { singular: 'учителя', plural: 'учителей' },
      instrumental: { singular: 'учителем', plural: 'учителями' },
      prepositional: { singular: 'учителе', plural: 'учителях' },
    },
  },
  {
    nominative: 'мать',
    meaning: 'mother',
    gender: 'feminine',
    declensions: {
      nominative: { singular: 'мать', plural: 'матери' },
      genitive: { singular: 'матери', plural: 'матерей' },
      dative: { singular: 'матери', plural: 'матерям' },
      accusative: { singular: 'мать', plural: 'матерей' },
      instrumental: { singular: 'матерью', plural: 'матерями' },
      prepositional: { singular: 'матери', plural: 'матерях' },
    },
  },
  {
    nominative: 'время',
    meaning: 'time',
    gender: 'neuter',
    declensions: {
      nominative: { singular: 'время', plural: 'времена' },
      genitive: { singular: 'времени', plural: 'времён' },
      dative: { singular: 'времени', plural: 'временам' },
      accusative: { singular: 'время', plural: 'времена' },
      instrumental: { singular: 'временем', plural: 'временами' },
      prepositional: { singular: 'времени', plural: 'временах' },
    },
  },
  {
    nominative: 'друг',
    meaning: 'friend',
    gender: 'masculine',
    declensions: {
      nominative: { singular: 'друг', plural: 'друзья' },
      genitive: { singular: 'друга', plural: 'друзей' },
      dative: { singular: 'другу', plural: 'друзьям' },
      accusative: { singular: 'друга', plural: 'друзей' },
      instrumental: { singular: 'другом', plural: 'друзьями' },
      prepositional: { singular: 'друге', plural: 'друзьях' },
    },
  },
  {
    nominative: 'школа',
    meaning: 'school',
    gender: 'feminine',
    declensions: {
      nominative: { singular: 'школа', plural: 'школы' },
      genitive: { singular: 'школы', plural: 'школ' },
      dative: { singular: 'школе', plural: 'школам' },
      accusative: { singular: 'школу', plural: 'школы' },
      instrumental: { singular: 'школой', plural: 'школами' },
      prepositional: { singular: 'школе', plural: 'школах' },
    },
  },
  {
    nominative: 'слово',
    meaning: 'word',
    gender: 'neuter',
    declensions: {
      nominative: { singular: 'слово', plural: 'слова' },
      genitive: { singular: 'слова', plural: 'слов' },
      dative: { singular: 'слову', plural: 'словам' },
      accusative: { singular: 'слово', plural: 'слова' },
      instrumental: { singular: 'словом', plural: 'словами' },
      prepositional: { singular: 'слове', plural: 'словах' },
    },
  },
  {
    nominative: 'город',
    meaning: 'city',
    gender: 'masculine',
    declensions: {
      nominative: { singular: 'город', plural: 'города' },
      genitive: { singular: 'города', plural: 'городов' },
      dative: { singular: 'городу', plural: 'городам' },
      accusative: { singular: 'город', plural: 'города' },
      instrumental: { singular: 'городом', plural: 'городами' },
      prepositional: { singular: 'городе', plural: 'городах' },
    },
  },
  {
    nominative: 'девушка',
    meaning: 'girl / young woman',
    gender: 'feminine',
    declensions: {
      nominative: { singular: 'девушка', plural: 'девушки' },
      genitive: { singular: 'девушки', plural: 'девушек' },
      dative: { singular: 'девушке', plural: 'девушкам' },
      accusative: { singular: 'девушку', plural: 'девушек' },
      instrumental: { singular: 'девушкой', plural: 'девушками' },
      prepositional: { singular: 'девушке', plural: 'девушках' },
    },
  },
  {
    nominative: 'море',
    meaning: 'sea',
    gender: 'neuter',
    declensions: {
      nominative: { singular: 'море', plural: 'моря' },
      genitive: { singular: 'моря', plural: 'морей' },
      dative: { singular: 'морю', plural: 'морям' },
      accusative: { singular: 'море', plural: 'моря' },
      instrumental: { singular: 'морем', plural: 'морями' },
      prepositional: { singular: 'море', plural: 'морях' },
    },
  },
  {
    nominative: 'имя',
    meaning: 'name',
    gender: 'neuter',
    declensions: {
      nominative: { singular: 'имя', plural: 'имена' },
      genitive: { singular: 'имени', plural: 'имён' },
      dative: { singular: 'имени', plural: 'именам' },
      accusative: { singular: 'имя', plural: 'имена' },
      instrumental: { singular: 'именем', plural: 'именами' },
      prepositional: { singular: 'имени', plural: 'именах' },
    },
  },
  {
    nominative: 'дочь',
    meaning: 'daughter',
    gender: 'feminine',
    declensions: {
      nominative: { singular: 'дочь', plural: 'дочери' },
      genitive: { singular: 'дочери', plural: 'дочерей' },
      dative: { singular: 'дочери', plural: 'дочерям' },
      accusative: { singular: 'дочь', plural: 'дочерей' },
      instrumental: { singular: 'дочерью', plural: 'дочерями' },
      prepositional: { singular: 'дочери', plural: 'дочерях' },
    },
  },
  {
    nominative: 'путь',
    meaning: 'path / way',
    gender: 'masculine',
    declensions: {
      nominative: { singular: 'путь', plural: 'пути' },
      genitive: { singular: 'пути', plural: 'путей' },
      dative: { singular: 'пути', plural: 'путям' },
      accusative: { singular: 'путь', plural: 'пути' },
      instrumental: { singular: 'путём', plural: 'путями' },
      prepositional: { singular: 'пути', plural: 'путях' },
    },
  },
  // Irregular plural (дети)
  {
    nominative: 'ребёнок',
    meaning: 'child',
    gender: 'masculine',
    declensions: {
      nominative: { singular: 'ребёнок', plural: 'дети' },
      genitive: { singular: 'ребёнка', plural: 'детей' },
      dative: { singular: 'ребёнку', plural: 'детям' },
      accusative: { singular: 'ребёнка', plural: 'детей' },
      instrumental: { singular: 'ребёнком', plural: 'детьми' },
      prepositional: { singular: 'ребёнке', plural: 'детях' },
    },
  },
  // Irregular plural (люди)
  {
    nominative: 'человек',
    meaning: 'person',
    gender: 'masculine',
    declensions: {
      nominative: { singular: 'человек', plural: 'люди' },
      genitive: { singular: 'человека', plural: 'людей' },
      dative: { singular: 'человеку', plural: 'людям' },
      accusative: { singular: 'человека', plural: 'людей' },
      instrumental: { singular: 'человеком', plural: 'людьми' },
      prepositional: { singular: 'человеке', plural: 'людях' },
    },
  },
  // Feminine, stress shift
  {
    nominative: 'рука',
    meaning: 'hand / arm',
    gender: 'feminine',
    declensions: {
      nominative: { singular: 'рука', plural: 'руки' },
      genitive: { singular: 'руки', plural: 'рук' },
      dative: { singular: 'руке', plural: 'рукам' },
      accusative: { singular: 'руку', plural: 'руки' },
      instrumental: { singular: 'рукой', plural: 'руками' },
      prepositional: { singular: 'руке', plural: 'руках' },
    },
  },
  // Feminine, stress shift
  {
    nominative: 'нога',
    meaning: 'leg / foot',
    gender: 'feminine',
    declensions: {
      nominative: { singular: 'нога', plural: 'ноги' },
      genitive: { singular: 'ноги', plural: 'ног' },
      dative: { singular: 'ноге', plural: 'ногам' },
      accusative: { singular: 'ногу', plural: 'ноги' },
      instrumental: { singular: 'ногой', plural: 'ногами' },
      prepositional: { singular: 'ноге', plural: 'ногах' },
    },
  },
  // Irregular genitive plural (глаз)
  {
    nominative: 'глаз',
    meaning: 'eye',
    gender: 'masculine',
    declensions: {
      nominative: { singular: 'глаз', plural: 'глаза' },
      genitive: { singular: 'глаза', plural: 'глаз' },
      dative: { singular: 'глазу', plural: 'глазам' },
      accusative: { singular: 'глаз', plural: 'глаза' },
      instrumental: { singular: 'глазом', plural: 'глазами' },
      prepositional: { singular: 'глазе', plural: 'глазах' },
    },
  },
  // Irregular plural (братья)
  {
    nominative: 'брат',
    meaning: 'brother',
    gender: 'masculine',
    declensions: {
      nominative: { singular: 'брат', plural: 'братья' },
      genitive: { singular: 'брата', plural: 'братьев' },
      dative: { singular: 'брату', plural: 'братьям' },
      accusative: { singular: 'брата', plural: 'братьев' },
      instrumental: { singular: 'братом', plural: 'братьями' },
      prepositional: { singular: 'брате', plural: 'братьях' },
    },
  },
  // Neuter, irregular plural (деревья)
  {
    nominative: 'дерево',
    meaning: 'tree',
    gender: 'neuter',
    declensions: {
      nominative: { singular: 'дерево', plural: 'деревья' },
      genitive: { singular: 'дерева', plural: 'деревьев' },
      dative: { singular: 'дереву', plural: 'деревьям' },
      accusative: { singular: 'дерево', plural: 'деревья' },
      instrumental: { singular: 'деревом', plural: 'деревьями' },
      prepositional: { singular: 'дереве', plural: 'деревьях' },
    },
  },
  // Feminine, stress shift + plural stem change
  {
    nominative: 'сестра',
    meaning: 'sister',
    gender: 'feminine',
    declensions: {
      nominative: { singular: 'сестра', plural: 'сёстры' },
      genitive: { singular: 'сестры', plural: 'сестёр' },
      dative: { singular: 'сестре', plural: 'сёстрам' },
      accusative: { singular: 'сестру', plural: 'сестёр' },
      instrumental: { singular: 'сестрой', plural: 'сёстрами' },
      prepositional: { singular: 'сестре', plural: 'сёстрах' },
    },
  },
  // Neuter, regular
  {
    nominative: 'место',
    meaning: 'place',
    gender: 'neuter',
    declensions: {
      nominative: { singular: 'место', plural: 'места' },
      genitive: { singular: 'места', plural: 'мест' },
      dative: { singular: 'месту', plural: 'местам' },
      accusative: { singular: 'место', plural: 'места' },
      instrumental: { singular: 'местом', plural: 'местами' },
      prepositional: { singular: 'месте', plural: 'местах' },
    },
  },
  // Feminine, soft-stem, 3rd declension
  {
    nominative: 'дверь',
    meaning: 'door',
    gender: 'feminine',
    declensions: {
      nominative: { singular: 'дверь', plural: 'двери' },
      genitive: { singular: 'двери', plural: 'дверей' },
      dative: { singular: 'двери', plural: 'дверям' },
      accusative: { singular: 'дверь', plural: 'двери' },
      instrumental: { singular: 'дверью', plural: 'дверьми' },
      prepositional: { singular: 'двери', plural: 'дверях' },
    },
  },
  // Feminine, soft-stem, 3rd declension
  {
    nominative: 'тетрадь',
    meaning: 'notebook',
    gender: 'feminine',
    declensions: {
      nominative: { singular: 'тетрадь', plural: 'тетради' },
      genitive: { singular: 'тетради', plural: 'тетрадей' },
      dative: { singular: 'тетради', plural: 'тетрадям' },
      accusative: { singular: 'тетрадь', plural: 'тетради' },
      instrumental: { singular: 'тетрадью', plural: 'тетрадями' },
      prepositional: { singular: 'тетради', plural: 'тетрадях' },
    },
  },
];
