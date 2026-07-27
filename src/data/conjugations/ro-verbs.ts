export type RoFormName =
  | 'prezent_eu'
  | 'prezent_tu'
  | 'prezent_el'
  | 'prezent_noi'
  | 'prezent_voi'
  | 'prezent_ei'
  | 'imperfect_eu'
  | 'imperfect_tu'
  | 'imperfect_el'
  | 'imperfect_noi'
  | 'imperfect_voi'
  | 'imperfect_ei'
  | 'perfect_eu'
  | 'perfect_tu'
  | 'perfect_el'
  | 'perfect_noi'
  | 'perfect_voi'
  | 'perfect_ei'
  | 'viitor_eu'
  | 'viitor_tu'
  | 'viitor_el'
  | 'viitor_noi'
  | 'viitor_voi'
  | 'viitor_ei'
  | 'conjunctiv_eu'
  | 'conjunctiv_tu'
  | 'conjunctiv_el'
  | 'conjunctiv_noi'
  | 'conjunctiv_voi'
  | 'conjunctiv_ei'
  | 'conditional_eu'
  | 'conditional_tu'
  | 'conditional_el'
  | 'conditional_noi'
  | 'conditional_voi'
  | 'conditional_ei'
  | 'imperativ_tu';

export const RO_FORM_LABELS: Record<RoFormName, string> = {
  prezent_eu: 'Prezent eu',
  prezent_tu: 'Prezent tu',
  prezent_el: 'Prezent el/ea',
  prezent_noi: 'Prezent noi',
  prezent_voi: 'Prezent voi',
  prezent_ei: 'Prezent ei/ele',
  imperfect_eu: 'Imperfect eu',
  imperfect_tu: 'Imperfect tu',
  imperfect_el: 'Imperfect el/ea',
  imperfect_noi: 'Imperfect noi',
  imperfect_voi: 'Imperfect voi',
  imperfect_ei: 'Imperfect ei/ele',
  perfect_eu: 'Perfect compus eu',
  perfect_tu: 'Perfect compus tu',
  perfect_el: 'Perfect compus el/ea',
  perfect_noi: 'Perfect compus noi',
  perfect_voi: 'Perfect compus voi',
  perfect_ei: 'Perfect compus ei/ele',
  viitor_eu: 'Viitor eu',
  viitor_tu: 'Viitor tu',
  viitor_el: 'Viitor el/ea',
  viitor_noi: 'Viitor noi',
  viitor_voi: 'Viitor voi',
  viitor_ei: 'Viitor ei/ele',
  conjunctiv_eu: 'Conjunctiv (să) eu',
  conjunctiv_tu: 'Conjunctiv (să) tu',
  conjunctiv_el: 'Conjunctiv (să) el/ea',
  conjunctiv_noi: 'Conjunctiv (să) noi',
  conjunctiv_voi: 'Conjunctiv (să) voi',
  conjunctiv_ei: 'Conjunctiv (să) ei/ele',
  conditional_eu: 'Condițional eu',
  conditional_tu: 'Condițional tu',
  conditional_el: 'Condițional el/ea',
  conditional_noi: 'Condițional noi',
  conditional_voi: 'Condițional voi',
  conditional_ei: 'Condițional ei/ele',
  imperativ_tu: 'Imperativ (tu)',
};

export interface RoVerb {
  infinitive: string;
  meaning: string;
  type: 'group-1' | 'group-2' | 'group-3' | 'group-4' | 'irregular';
  conjugations: Record<RoFormName, string>;
}

export const RO_VERBS: RoVerb[] = [
  {
    infinitive: 'a fi',
    meaning: 'to be',
    type: 'irregular',
    conjugations: {
      prezent_eu: 'sunt', prezent_tu: 'ești', prezent_el: 'este', prezent_noi: 'suntem', prezent_voi: 'sunteți', prezent_ei: 'sunt',
      imperfect_eu: 'eram', imperfect_tu: 'erai', imperfect_el: 'era', imperfect_noi: 'eram', imperfect_voi: 'erați', imperfect_ei: 'erau',
      perfect_eu: 'am fost', perfect_tu: 'ai fost', perfect_el: 'a fost', perfect_noi: 'am fost', perfect_voi: 'ați fost', perfect_ei: 'au fost',
      viitor_eu: 'voi fi', viitor_tu: 'vei fi', viitor_el: 'va fi', viitor_noi: 'vom fi', viitor_voi: 'veți fi', viitor_ei: 'vor fi',
      conjunctiv_eu: 'să fiu', conjunctiv_tu: 'să fii', conjunctiv_el: 'să fie', conjunctiv_noi: 'să fim', conjunctiv_voi: 'să fiți', conjunctiv_ei: 'să fie',
      conditional_eu: 'aș fi', conditional_tu: 'ai fi', conditional_el: 'ar fi', conditional_noi: 'am fi', conditional_voi: 'ați fi', conditional_ei: 'ar fi',
      imperativ_tu: 'fii',
    },
  },
  {
    infinitive: 'a avea',
    meaning: 'to have',
    type: 'irregular',
    conjugations: {
      prezent_eu: 'am', prezent_tu: 'ai', prezent_el: 'are', prezent_noi: 'avem', prezent_voi: 'aveți', prezent_ei: 'au',
      imperfect_eu: 'aveam', imperfect_tu: 'aveai', imperfect_el: 'avea', imperfect_noi: 'aveam', imperfect_voi: 'aveați', imperfect_ei: 'aveau',
      perfect_eu: 'am avut', perfect_tu: 'ai avut', perfect_el: 'a avut', perfect_noi: 'am avut', perfect_voi: 'ați avut', perfect_ei: 'au avut',
      viitor_eu: 'voi avea', viitor_tu: 'vei avea', viitor_el: 'va avea', viitor_noi: 'vom avea', viitor_voi: 'veți avea', viitor_ei: 'vor avea',
      conjunctiv_eu: 'să am', conjunctiv_tu: 'să ai', conjunctiv_el: 'să aibă', conjunctiv_noi: 'să avem', conjunctiv_voi: 'să aveți', conjunctiv_ei: 'să aibă',
      conditional_eu: 'aș avea', conditional_tu: 'ai avea', conditional_el: 'ar avea', conditional_noi: 'am avea', conditional_voi: 'ați avea', conditional_ei: 'ar avea',
      imperativ_tu: 'ai',
    },
  },
  {
    infinitive: 'a merge',
    meaning: 'to go / to walk',
    type: 'group-3',
    conjugations: {
      prezent_eu: 'merg', prezent_tu: 'mergi', prezent_el: 'merge', prezent_noi: 'mergem', prezent_voi: 'mergeți', prezent_ei: 'merg',
      imperfect_eu: 'mergeam', imperfect_tu: 'mergeai', imperfect_el: 'mergea', imperfect_noi: 'mergeam', imperfect_voi: 'mergeați', imperfect_ei: 'mergeau',
      perfect_eu: 'am mers', perfect_tu: 'ai mers', perfect_el: 'a mers', perfect_noi: 'am mers', perfect_voi: 'ați mers', perfect_ei: 'au mers',
      viitor_eu: 'voi merge', viitor_tu: 'vei merge', viitor_el: 'va merge', viitor_noi: 'vom merge', viitor_voi: 'veți merge', viitor_ei: 'vor merge',
      conjunctiv_eu: 'să merg', conjunctiv_tu: 'să mergi', conjunctiv_el: 'să meargă', conjunctiv_noi: 'să mergem', conjunctiv_voi: 'să mergeți', conjunctiv_ei: 'să meargă',
      conditional_eu: 'aș merge', conditional_tu: 'ai merge', conditional_el: 'ar merge', conditional_noi: 'am merge', conditional_voi: 'ați merge', conditional_ei: 'ar merge',
      imperativ_tu: 'mergi',
    },
  },
  {
    infinitive: 'a vorbi',
    meaning: 'to speak / to talk',
    type: 'group-4',
    conjugations: {
      prezent_eu: 'vorbesc', prezent_tu: 'vorbești', prezent_el: 'vorbește', prezent_noi: 'vorbim', prezent_voi: 'vorbiți', prezent_ei: 'vorbesc',
      imperfect_eu: 'vorbeam', imperfect_tu: 'vorbeai', imperfect_el: 'vorbea', imperfect_noi: 'vorbeam', imperfect_voi: 'vorbeați', imperfect_ei: 'vorbeau',
      perfect_eu: 'am vorbit', perfect_tu: 'ai vorbit', perfect_el: 'a vorbit', perfect_noi: 'am vorbit', perfect_voi: 'ați vorbit', perfect_ei: 'au vorbit',
      viitor_eu: 'voi vorbi', viitor_tu: 'vei vorbi', viitor_el: 'va vorbi', viitor_noi: 'vom vorbi', viitor_voi: 'veți vorbi', viitor_ei: 'vor vorbi',
      conjunctiv_eu: 'să vorbesc', conjunctiv_tu: 'să vorbești', conjunctiv_el: 'să vorbească', conjunctiv_noi: 'să vorbim', conjunctiv_voi: 'să vorbiți', conjunctiv_ei: 'să vorbească',
      conditional_eu: 'aș vorbi', conditional_tu: 'ai vorbi', conditional_el: 'ar vorbi', conditional_noi: 'am vorbi', conditional_voi: 'ați vorbi', conditional_ei: 'ar vorbi',
      imperativ_tu: 'vorbește',
    },
  },
  {
    infinitive: 'a mânca',
    meaning: 'to eat',
    type: 'group-1',
    conjugations: {
      prezent_eu: 'mănânc', prezent_tu: 'mănânci', prezent_el: 'mănâncă', prezent_noi: 'mâncăm', prezent_voi: 'mâncați', prezent_ei: 'mănâncă',
      imperfect_eu: 'mâncam', imperfect_tu: 'mâncai', imperfect_el: 'mânca', imperfect_noi: 'mâncam', imperfect_voi: 'mâncați', imperfect_ei: 'mâncau',
      perfect_eu: 'am mâncat', perfect_tu: 'ai mâncat', perfect_el: 'a mâncat', perfect_noi: 'am mâncat', perfect_voi: 'ați mâncat', perfect_ei: 'au mâncat',
      viitor_eu: 'voi mânca', viitor_tu: 'vei mânca', viitor_el: 'va mânca', viitor_noi: 'vom mânca', viitor_voi: 'veți mânca', viitor_ei: 'vor mânca',
      conjunctiv_eu: 'să mănânc', conjunctiv_tu: 'să mănânci', conjunctiv_el: 'să mănânce', conjunctiv_noi: 'să mâncăm', conjunctiv_voi: 'să mâncați', conjunctiv_ei: 'să mănânce',
      conditional_eu: 'aș mânca', conditional_tu: 'ai mânca', conditional_el: 'ar mânca', conditional_noi: 'am mânca', conditional_voi: 'ați mânca', conditional_ei: 'ar mânca',
      imperativ_tu: 'mănâncă',
    },
  },
  {
    infinitive: 'a bea',
    meaning: 'to drink',
    type: 'group-2',
    conjugations: {
      prezent_eu: 'beau', prezent_tu: 'bei', prezent_el: 'bea', prezent_noi: 'bem', prezent_voi: 'beți', prezent_ei: 'beau',
      imperfect_eu: 'beam', imperfect_tu: 'beai', imperfect_el: 'bea', imperfect_noi: 'beam', imperfect_voi: 'beați', imperfect_ei: 'beau',
      perfect_eu: 'am băut', perfect_tu: 'ai băut', perfect_el: 'a băut', perfect_noi: 'am băut', perfect_voi: 'ați băut', perfect_ei: 'au băut',
      viitor_eu: 'voi bea', viitor_tu: 'vei bea', viitor_el: 'va bea', viitor_noi: 'vom bea', viitor_voi: 'veți bea', viitor_ei: 'vor bea',
      conjunctiv_eu: 'să beau', conjunctiv_tu: 'să bei', conjunctiv_el: 'să bea', conjunctiv_noi: 'să bem', conjunctiv_voi: 'să beți', conjunctiv_ei: 'să bea',
      conditional_eu: 'aș bea', conditional_tu: 'ai bea', conditional_el: 'ar bea', conditional_noi: 'am bea', conditional_voi: 'ați bea', conditional_ei: 'ar bea',
      imperativ_tu: 'bea',
    },
  },
  {
    infinitive: 'a face',
    meaning: 'to do / to make',
    type: 'group-3',
    conjugations: {
      prezent_eu: 'fac', prezent_tu: 'faci', prezent_el: 'face', prezent_noi: 'facem', prezent_voi: 'faceți', prezent_ei: 'fac',
      imperfect_eu: 'făceam', imperfect_tu: 'făceai', imperfect_el: 'făcea', imperfect_noi: 'făceam', imperfect_voi: 'făceați', imperfect_ei: 'făceau',
      perfect_eu: 'am făcut', perfect_tu: 'ai făcut', perfect_el: 'a făcut', perfect_noi: 'am făcut', perfect_voi: 'ați făcut', perfect_ei: 'au făcut',
      viitor_eu: 'voi face', viitor_tu: 'vei face', viitor_el: 'va face', viitor_noi: 'vom face', viitor_voi: 'veți face', viitor_ei: 'vor face',
      conjunctiv_eu: 'să fac', conjunctiv_tu: 'să faci', conjunctiv_el: 'să facă', conjunctiv_noi: 'să facem', conjunctiv_voi: 'să faceți', conjunctiv_ei: 'să facă',
      conditional_eu: 'aș face', conditional_tu: 'ai face', conditional_el: 'ar face', conditional_noi: 'am face', conditional_voi: 'ați face', conditional_ei: 'ar face',
      imperativ_tu: 'fă',
    },
  },
  {
    infinitive: 'a vrea',
    meaning: 'to want',
    type: 'irregular',
    conjugations: {
      prezent_eu: 'vreau', prezent_tu: 'vrei', prezent_el: 'vrea', prezent_noi: 'vrem', prezent_voi: 'vreți', prezent_ei: 'vor',
      imperfect_eu: 'voiam', imperfect_tu: 'voiai', imperfect_el: 'voia', imperfect_noi: 'voiam', imperfect_voi: 'voiați', imperfect_ei: 'voiau',
      perfect_eu: 'am vrut', perfect_tu: 'ai vrut', perfect_el: 'a vrut', perfect_noi: 'am vrut', perfect_voi: 'ați vrut', perfect_ei: 'au vrut',
      viitor_eu: 'voi vrea', viitor_tu: 'vei vrea', viitor_el: 'va vrea', viitor_noi: 'vom vrea', viitor_voi: 'veți vrea', viitor_ei: 'vor vrea',
      conjunctiv_eu: 'să vreau', conjunctiv_tu: 'să vrei', conjunctiv_el: 'să vrea', conjunctiv_noi: 'să vrem', conjunctiv_voi: 'să vreți', conjunctiv_ei: 'să vrea',
      conditional_eu: 'aș vrea', conditional_tu: 'ai vrea', conditional_el: 'ar vrea', conditional_noi: 'am vrea', conditional_voi: 'ați vrea', conditional_ei: 'ar vrea',
      imperativ_tu: '—',
    },
  },
  {
    infinitive: 'a putea',
    meaning: 'to be able / can',
    type: 'group-2',
    conjugations: {
      prezent_eu: 'pot', prezent_tu: 'poți', prezent_el: 'poate', prezent_noi: 'putem', prezent_voi: 'puteți', prezent_ei: 'pot',
      imperfect_eu: 'puteam', imperfect_tu: 'puteai', imperfect_el: 'putea', imperfect_noi: 'puteam', imperfect_voi: 'puteați', imperfect_ei: 'puteau',
      perfect_eu: 'am putut', perfect_tu: 'ai putut', perfect_el: 'a putut', perfect_noi: 'am putut', perfect_voi: 'ați putut', perfect_ei: 'au putut',
      viitor_eu: 'voi putea', viitor_tu: 'vei putea', viitor_el: 'va putea', viitor_noi: 'vom putea', viitor_voi: 'veți putea', viitor_ei: 'vor putea',
      conjunctiv_eu: 'să pot', conjunctiv_tu: 'să poți', conjunctiv_el: 'să poată', conjunctiv_noi: 'să putem', conjunctiv_voi: 'să puteți', conjunctiv_ei: 'să poată',
      conditional_eu: 'aș putea', conditional_tu: 'ai putea', conditional_el: 'ar putea', conditional_noi: 'am putea', conditional_voi: 'ați putea', conditional_ei: 'ar putea',
      imperativ_tu: '—',
    },
  },
  {
    infinitive: 'a vedea',
    meaning: 'to see',
    type: 'group-2',
    conjugations: {
      prezent_eu: 'văd', prezent_tu: 'vezi', prezent_el: 'vede', prezent_noi: 'vedem', prezent_voi: 'vedeți', prezent_ei: 'văd',
      imperfect_eu: 'vedeam', imperfect_tu: 'vedeai', imperfect_el: 'vedea', imperfect_noi: 'vedeam', imperfect_voi: 'vedeați', imperfect_ei: 'vedeau',
      perfect_eu: 'am văzut', perfect_tu: 'ai văzut', perfect_el: 'a văzut', perfect_noi: 'am văzut', perfect_voi: 'ați văzut', perfect_ei: 'au văzut',
      viitor_eu: 'voi vedea', viitor_tu: 'vei vedea', viitor_el: 'va vedea', viitor_noi: 'vom vedea', viitor_voi: 'veți vedea', viitor_ei: 'vor vedea',
      conjunctiv_eu: 'să văd', conjunctiv_tu: 'să vezi', conjunctiv_el: 'să vadă', conjunctiv_noi: 'să vedem', conjunctiv_voi: 'să vedeți', conjunctiv_ei: 'să vadă',
      conditional_eu: 'aș vedea', conditional_tu: 'ai vedea', conditional_el: 'ar vedea', conditional_noi: 'am vedea', conditional_voi: 'ați vedea', conditional_ei: 'ar vedea',
      imperativ_tu: 'vezi',
    },
  },
  {
    infinitive: 'a veni',
    meaning: 'to come',
    type: 'group-4',
    conjugations: {
      prezent_eu: 'vin', prezent_tu: 'vii', prezent_el: 'vine', prezent_noi: 'venim', prezent_voi: 'veniți', prezent_ei: 'vin',
      imperfect_eu: 'veneam', imperfect_tu: 'veneai', imperfect_el: 'venea', imperfect_noi: 'veneam', imperfect_voi: 'veneați', imperfect_ei: 'veneau',
      perfect_eu: 'am venit', perfect_tu: 'ai venit', perfect_el: 'a venit', perfect_noi: 'am venit', perfect_voi: 'ați venit', perfect_ei: 'au venit',
      viitor_eu: 'voi veni', viitor_tu: 'vei veni', viitor_el: 'va veni', viitor_noi: 'vom veni', viitor_voi: 'veți veni', viitor_ei: 'vor veni',
      conjunctiv_eu: 'să vin', conjunctiv_tu: 'să vii', conjunctiv_el: 'să vină', conjunctiv_noi: 'să venim', conjunctiv_voi: 'să veniți', conjunctiv_ei: 'să vină',
      conditional_eu: 'aș veni', conditional_tu: 'ai veni', conditional_el: 'ar veni', conditional_noi: 'am veni', conditional_voi: 'ați veni', conditional_ei: 'ar veni',
      imperativ_tu: 'vino',
    },
  },
  {
    infinitive: 'a da',
    meaning: 'to give',
    type: 'irregular',
    conjugations: {
      prezent_eu: 'dau', prezent_tu: 'dai', prezent_el: 'dă', prezent_noi: 'dăm', prezent_voi: 'dați', prezent_ei: 'dau',
      imperfect_eu: 'dădeam', imperfect_tu: 'dădeai', imperfect_el: 'dădea', imperfect_noi: 'dădeam', imperfect_voi: 'dădeați', imperfect_ei: 'dădeau',
      perfect_eu: 'am dat', perfect_tu: 'ai dat', perfect_el: 'a dat', perfect_noi: 'am dat', perfect_voi: 'ați dat', perfect_ei: 'au dat',
      viitor_eu: 'voi da', viitor_tu: 'vei da', viitor_el: 'va da', viitor_noi: 'vom da', viitor_voi: 'veți da', viitor_ei: 'vor da',
      conjunctiv_eu: 'să dau', conjunctiv_tu: 'să dai', conjunctiv_el: 'să dea', conjunctiv_noi: 'să dăm', conjunctiv_voi: 'să dați', conjunctiv_ei: 'să dea',
      conditional_eu: 'aș da', conditional_tu: 'ai da', conditional_el: 'ar da', conditional_noi: 'am da', conditional_voi: 'ați da', conditional_ei: 'ar da',
      imperativ_tu: 'dă',
    },
  },
  {
    infinitive: 'a lua',
    meaning: 'to take',
    type: 'irregular',
    conjugations: {
      prezent_eu: 'iau', prezent_tu: 'iei', prezent_el: 'ia', prezent_noi: 'luăm', prezent_voi: 'luați', prezent_ei: 'iau',
      imperfect_eu: 'luam', imperfect_tu: 'luai', imperfect_el: 'lua', imperfect_noi: 'luam', imperfect_voi: 'luați', imperfect_ei: 'luau',
      perfect_eu: 'am luat', perfect_tu: 'ai luat', perfect_el: 'a luat', perfect_noi: 'am luat', perfect_voi: 'ați luat', perfect_ei: 'au luat',
      viitor_eu: 'voi lua', viitor_tu: 'vei lua', viitor_el: 'va lua', viitor_noi: 'vom lua', viitor_voi: 'veți lua', viitor_ei: 'vor lua',
      conjunctiv_eu: 'să iau', conjunctiv_tu: 'să iei', conjunctiv_el: 'să ia', conjunctiv_noi: 'să luăm', conjunctiv_voi: 'să luați', conjunctiv_ei: 'să ia',
      conditional_eu: 'aș lua', conditional_tu: 'ai lua', conditional_el: 'ar lua', conditional_noi: 'am lua', conditional_voi: 'ați lua', conditional_ei: 'ar lua',
      imperativ_tu: 'ia',
    },
  },
  {
    infinitive: 'a cânta',
    meaning: 'to sing',
    type: 'group-1',
    conjugations: {
      prezent_eu: 'cânt', prezent_tu: 'cânți', prezent_el: 'cântă', prezent_noi: 'cântăm', prezent_voi: 'cântați', prezent_ei: 'cântă',
      imperfect_eu: 'cântam', imperfect_tu: 'cântai', imperfect_el: 'cânta', imperfect_noi: 'cântam', imperfect_voi: 'cântați', imperfect_ei: 'cântau',
      perfect_eu: 'am cântat', perfect_tu: 'ai cântat', perfect_el: 'a cântat', perfect_noi: 'am cântat', perfect_voi: 'ați cântat', perfect_ei: 'au cântat',
      viitor_eu: 'voi cânta', viitor_tu: 'vei cânta', viitor_el: 'va cânta', viitor_noi: 'vom cânta', viitor_voi: 'veți cânta', viitor_ei: 'vor cânta',
      conjunctiv_eu: 'să cânt', conjunctiv_tu: 'să cânți', conjunctiv_el: 'să cânte', conjunctiv_noi: 'să cântăm', conjunctiv_voi: 'să cântați', conjunctiv_ei: 'să cânte',
      conditional_eu: 'aș cânta', conditional_tu: 'ai cânta', conditional_el: 'ar cânta', conditional_noi: 'am cânta', conditional_voi: 'ați cânta', conditional_ei: 'ar cânta',
      imperativ_tu: 'cântă',
    },
  },
  {
    infinitive: 'a lucra',
    meaning: 'to work',
    type: 'group-1',
    conjugations: {
      prezent_eu: 'lucrez', prezent_tu: 'lucrezi', prezent_el: 'lucrează', prezent_noi: 'lucrăm', prezent_voi: 'lucrați', prezent_ei: 'lucrează',
      imperfect_eu: 'lucram', imperfect_tu: 'lucrai', imperfect_el: 'lucra', imperfect_noi: 'lucram', imperfect_voi: 'lucrați', imperfect_ei: 'lucrau',
      perfect_eu: 'am lucrat', perfect_tu: 'ai lucrat', perfect_el: 'a lucrat', perfect_noi: 'am lucrat', perfect_voi: 'ați lucrat', perfect_ei: 'au lucrat',
      viitor_eu: 'voi lucra', viitor_tu: 'vei lucra', viitor_el: 'va lucra', viitor_noi: 'vom lucra', viitor_voi: 'veți lucra', viitor_ei: 'vor lucra',
      conjunctiv_eu: 'să lucrez', conjunctiv_tu: 'să lucrezi', conjunctiv_el: 'să lucreze', conjunctiv_noi: 'să lucrăm', conjunctiv_voi: 'să lucrați', conjunctiv_ei: 'să lucreze',
      conditional_eu: 'aș lucra', conditional_tu: 'ai lucra', conditional_el: 'ar lucra', conditional_noi: 'am lucra', conditional_voi: 'ați lucra', conditional_ei: 'ar lucra',
      imperativ_tu: 'lucrează',
    },
  },
  {
    infinitive: 'a citi',
    meaning: 'to read',
    type: 'group-4',
    conjugations: {
      prezent_eu: 'citesc', prezent_tu: 'citești', prezent_el: 'citește', prezent_noi: 'citim', prezent_voi: 'citiți', prezent_ei: 'citesc',
      imperfect_eu: 'citeam', imperfect_tu: 'citeai', imperfect_el: 'citea', imperfect_noi: 'citeam', imperfect_voi: 'citeați', imperfect_ei: 'citeau',
      perfect_eu: 'am citit', perfect_tu: 'ai citit', perfect_el: 'a citit', perfect_noi: 'am citit', perfect_voi: 'ați citit', perfect_ei: 'au citit',
      viitor_eu: 'voi citi', viitor_tu: 'vei citi', viitor_el: 'va citi', viitor_noi: 'vom citi', viitor_voi: 'veți citi', viitor_ei: 'vor citi',
      conjunctiv_eu: 'să citesc', conjunctiv_tu: 'să citești', conjunctiv_el: 'să citească', conjunctiv_noi: 'să citim', conjunctiv_voi: 'să citiți', conjunctiv_ei: 'să citească',
      conditional_eu: 'aș citi', conditional_tu: 'ai citi', conditional_el: 'ar citi', conditional_noi: 'am citi', conditional_voi: 'ați citi', conditional_ei: 'ar citi',
      imperativ_tu: 'citește',
    },
  },
  {
    infinitive: 'a dormi',
    meaning: 'to sleep',
    type: 'group-4',
    conjugations: {
      prezent_eu: 'dorm', prezent_tu: 'dormi', prezent_el: 'doarme', prezent_noi: 'dormim', prezent_voi: 'dormiți', prezent_ei: 'dorm',
      imperfect_eu: 'dormeam', imperfect_tu: 'dormeai', imperfect_el: 'dormea', imperfect_noi: 'dormeam', imperfect_voi: 'dormeați', imperfect_ei: 'dormeau',
      perfect_eu: 'am dormit', perfect_tu: 'ai dormit', perfect_el: 'a dormit', perfect_noi: 'am dormit', perfect_voi: 'ați dormit', perfect_ei: 'au dormit',
      viitor_eu: 'voi dormi', viitor_tu: 'vei dormi', viitor_el: 'va dormi', viitor_noi: 'vom dormi', viitor_voi: 'veți dormi', viitor_ei: 'vor dormi',
      conjunctiv_eu: 'să dorm', conjunctiv_tu: 'să dormi', conjunctiv_el: 'să doarmă', conjunctiv_noi: 'să dormim', conjunctiv_voi: 'să dormiți', conjunctiv_ei: 'să doarmă',
      conditional_eu: 'aș dormi', conditional_tu: 'ai dormi', conditional_el: 'ar dormi', conditional_noi: 'am dormi', conditional_voi: 'ați dormi', conditional_ei: 'ar dormi',
      imperativ_tu: 'dormi',
    },
  },
  {
    infinitive: 'a scrie',
    meaning: 'to write',
    type: 'group-3',
    conjugations: {
      prezent_eu: 'scriu', prezent_tu: 'scrii', prezent_el: 'scrie', prezent_noi: 'scriem', prezent_voi: 'scrieți', prezent_ei: 'scriu',
      imperfect_eu: 'scriam', imperfect_tu: 'scriai', imperfect_el: 'scria', imperfect_noi: 'scriam', imperfect_voi: 'scriați', imperfect_ei: 'scriau',
      perfect_eu: 'am scris', perfect_tu: 'ai scris', perfect_el: 'a scris', perfect_noi: 'am scris', perfect_voi: 'ați scris', perfect_ei: 'au scris',
      viitor_eu: 'voi scrie', viitor_tu: 'vei scrie', viitor_el: 'va scrie', viitor_noi: 'vom scrie', viitor_voi: 'veți scrie', viitor_ei: 'vor scrie',
      conjunctiv_eu: 'să scriu', conjunctiv_tu: 'să scrii', conjunctiv_el: 'să scrie', conjunctiv_noi: 'să scriem', conjunctiv_voi: 'să scrieți', conjunctiv_ei: 'să scrie',
      conditional_eu: 'aș scrie', conditional_tu: 'ai scrie', conditional_el: 'ar scrie', conditional_noi: 'am scrie', conditional_voi: 'ați scrie', conditional_ei: 'ar scrie',
      imperativ_tu: 'scrie',
    },
  },
  {
    infinitive: 'a sta',
    meaning: 'to stay / to stand',
    type: 'irregular',
    conjugations: {
      prezent_eu: 'stau', prezent_tu: 'stai', prezent_el: 'stă', prezent_noi: 'stăm', prezent_voi: 'stați', prezent_ei: 'stau',
      imperfect_eu: 'stăteam', imperfect_tu: 'stăteai', imperfect_el: 'stătea', imperfect_noi: 'stăteam', imperfect_voi: 'stăteați', imperfect_ei: 'stăteau',
      perfect_eu: 'am stat', perfect_tu: 'ai stat', perfect_el: 'a stat', perfect_noi: 'am stat', perfect_voi: 'ați stat', perfect_ei: 'au stat',
      viitor_eu: 'voi sta', viitor_tu: 'vei sta', viitor_el: 'va sta', viitor_noi: 'vom sta', viitor_voi: 'veți sta', viitor_ei: 'vor sta',
      conjunctiv_eu: 'să stau', conjunctiv_tu: 'să stai', conjunctiv_el: 'să stea', conjunctiv_noi: 'să stăm', conjunctiv_voi: 'să stați', conjunctiv_ei: 'să stea',
      conditional_eu: 'aș sta', conditional_tu: 'ai sta', conditional_el: 'ar sta', conditional_noi: 'am sta', conditional_voi: 'ați sta', conditional_ei: 'ar sta',
      imperativ_tu: 'stai',
    },
  },
  {
    infinitive: 'a ști',
    meaning: 'to know',
    type: 'irregular',
    conjugations: {
      prezent_eu: 'știu', prezent_tu: 'știi', prezent_el: 'știe', prezent_noi: 'știm', prezent_voi: 'știți', prezent_ei: 'știu',
      imperfect_eu: 'știam', imperfect_tu: 'știai', imperfect_el: 'știa', imperfect_noi: 'știam', imperfect_voi: 'știați', imperfect_ei: 'știau',
      perfect_eu: 'am știut', perfect_tu: 'ai știut', perfect_el: 'a știut', perfect_noi: 'am știut', perfect_voi: 'ați știut', perfect_ei: 'au știut',
      viitor_eu: 'voi ști', viitor_tu: 'vei ști', viitor_el: 'va ști', viitor_noi: 'vom ști', viitor_voi: 'veți ști', viitor_ei: 'vor ști',
      conjunctiv_eu: 'să știu', conjunctiv_tu: 'să știi', conjunctiv_el: 'să știe', conjunctiv_noi: 'să știm', conjunctiv_voi: 'să știți', conjunctiv_ei: 'să știe',
      conditional_eu: 'aș ști', conditional_tu: 'ai ști', conditional_el: 'ar ști', conditional_noi: 'am ști', conditional_voi: 'ați ști', conditional_ei: 'ar ști',
      imperativ_tu: 'știi',
    },
  },
  {
    infinitive: 'a spune',
    meaning: 'to say / to tell',
    type: 'group-3',
    conjugations: {
      prezent_eu: 'spun', prezent_tu: 'spui', prezent_el: 'spune', prezent_noi: 'spunem', prezent_voi: 'spuneți', prezent_ei: 'spun',
      imperfect_eu: 'spuneam', imperfect_tu: 'spuneai', imperfect_el: 'spunea', imperfect_noi: 'spuneam', imperfect_voi: 'spuneați', imperfect_ei: 'spuneau',
      perfect_eu: 'am spus', perfect_tu: 'ai spus', perfect_el: 'a spus', perfect_noi: 'am spus', perfect_voi: 'ați spus', perfect_ei: 'au spus',
      viitor_eu: 'voi spune', viitor_tu: 'vei spune', viitor_el: 'va spune', viitor_noi: 'vom spune', viitor_voi: 'veți spune', viitor_ei: 'vor spune',
      conjunctiv_eu: 'să spun', conjunctiv_tu: 'să spui', conjunctiv_el: 'să spună', conjunctiv_noi: 'să spunem', conjunctiv_voi: 'să spuneți', conjunctiv_ei: 'să spună',
      conditional_eu: 'aș spune', conditional_tu: 'ai spune', conditional_el: 'ar spune', conditional_noi: 'am spune', conditional_voi: 'ați spune', conditional_ei: 'ar spune',
      imperativ_tu: 'spune',
    },
  },
  {
    infinitive: 'a pune',
    meaning: 'to put',
    type: 'group-3',
    conjugations: {
      prezent_eu: 'pun', prezent_tu: 'pui', prezent_el: 'pune', prezent_noi: 'punem', prezent_voi: 'puneți', prezent_ei: 'pun',
      imperfect_eu: 'puneam', imperfect_tu: 'puneai', imperfect_el: 'punea', imperfect_noi: 'puneam', imperfect_voi: 'puneați', imperfect_ei: 'puneau',
      perfect_eu: 'am pus', perfect_tu: 'ai pus', perfect_el: 'a pus', perfect_noi: 'am pus', perfect_voi: 'ați pus', perfect_ei: 'au pus',
      viitor_eu: 'voi pune', viitor_tu: 'vei pune', viitor_el: 'va pune', viitor_noi: 'vom pune', viitor_voi: 'veți pune', viitor_ei: 'vor pune',
      conjunctiv_eu: 'să pun', conjunctiv_tu: 'să pui', conjunctiv_el: 'să pună', conjunctiv_noi: 'să punem', conjunctiv_voi: 'să puneți', conjunctiv_ei: 'să pună',
      conditional_eu: 'aș pune', conditional_tu: 'ai pune', conditional_el: 'ar pune', conditional_noi: 'am pune', conditional_voi: 'ați pune', conditional_ei: 'ar pune',
      imperativ_tu: 'pune',
    },
  },
  {
    infinitive: 'a crede',
    meaning: 'to believe / to think',
    type: 'group-3',
    conjugations: {
      prezent_eu: 'cred', prezent_tu: 'crezi', prezent_el: 'crede', prezent_noi: 'credem', prezent_voi: 'credeți', prezent_ei: 'cred',
      imperfect_eu: 'credeam', imperfect_tu: 'credeai', imperfect_el: 'credea', imperfect_noi: 'credeam', imperfect_voi: 'credeați', imperfect_ei: 'credeau',
      perfect_eu: 'am crezut', perfect_tu: 'ai crezut', perfect_el: 'a crezut', perfect_noi: 'am crezut', perfect_voi: 'ați crezut', perfect_ei: 'au crezut',
      viitor_eu: 'voi crede', viitor_tu: 'vei crede', viitor_el: 'va crede', viitor_noi: 'vom crede', viitor_voi: 'veți crede', viitor_ei: 'vor crede',
      conjunctiv_eu: 'să cred', conjunctiv_tu: 'să crezi', conjunctiv_el: 'să creadă', conjunctiv_noi: 'să credem', conjunctiv_voi: 'să credeți', conjunctiv_ei: 'să creadă',
      conditional_eu: 'aș crede', conditional_tu: 'ai crede', conditional_el: 'ar crede', conditional_noi: 'am crede', conditional_voi: 'ați crede', conditional_ei: 'ar crede',
      imperativ_tu: 'crede',
    },
  },
  {
    infinitive: 'a trăi',
    meaning: 'to live',
    type: 'group-4',
    conjugations: {
      prezent_eu: 'trăiesc', prezent_tu: 'trăiești', prezent_el: 'trăiește', prezent_noi: 'trăim', prezent_voi: 'trăiți', prezent_ei: 'trăiesc',
      imperfect_eu: 'trăiam', imperfect_tu: 'trăiai', imperfect_el: 'trăia', imperfect_noi: 'trăiam', imperfect_voi: 'trăiați', imperfect_ei: 'trăiau',
      perfect_eu: 'am trăit', perfect_tu: 'ai trăit', perfect_el: 'a trăit', perfect_noi: 'am trăit', perfect_voi: 'ați trăit', perfect_ei: 'au trăit',
      viitor_eu: 'voi trăi', viitor_tu: 'vei trăi', viitor_el: 'va trăi', viitor_noi: 'vom trăi', viitor_voi: 'veți trăi', viitor_ei: 'vor trăi',
      conjunctiv_eu: 'să trăiesc', conjunctiv_tu: 'să trăiești', conjunctiv_el: 'să trăiască', conjunctiv_noi: 'să trăim', conjunctiv_voi: 'să trăiți', conjunctiv_ei: 'să trăiască',
      conditional_eu: 'aș trăi', conditional_tu: 'ai trăi', conditional_el: 'ar trăi', conditional_noi: 'am trăi', conditional_voi: 'ați trăi', conditional_ei: 'ar trăi',
      imperativ_tu: 'trăiește',
    },
  },
  {
    infinitive: 'a găsi',
    meaning: 'to find',
    type: 'group-4',
    conjugations: {
      prezent_eu: 'găsesc', prezent_tu: 'găsești', prezent_el: 'găsește', prezent_noi: 'găsim', prezent_voi: 'găsiți', prezent_ei: 'găsesc',
      imperfect_eu: 'găseam', imperfect_tu: 'găseai', imperfect_el: 'găsea', imperfect_noi: 'găseam', imperfect_voi: 'găseați', imperfect_ei: 'găseau',
      perfect_eu: 'am găsit', perfect_tu: 'ai găsit', perfect_el: 'a găsit', perfect_noi: 'am găsit', perfect_voi: 'ați găsit', perfect_ei: 'au găsit',
      viitor_eu: 'voi găsi', viitor_tu: 'vei găsi', viitor_el: 'va găsi', viitor_noi: 'vom găsi', viitor_voi: 'veți găsi', viitor_ei: 'vor găsi',
      conjunctiv_eu: 'să găsesc', conjunctiv_tu: 'să găsești', conjunctiv_el: 'să găsească', conjunctiv_noi: 'să găsim', conjunctiv_voi: 'să găsiți', conjunctiv_ei: 'să găsească',
      conditional_eu: 'aș găsi', conditional_tu: 'ai găsi', conditional_el: 'ar găsi', conditional_noi: 'am găsi', conditional_voi: 'ați găsi', conditional_ei: 'ar găsi',
      imperativ_tu: 'găsește',
    },
  },
  {
    infinitive: 'a ajunge',
    meaning: 'to arrive / to reach',
    type: 'group-3',
    conjugations: {
      prezent_eu: 'ajung', prezent_tu: 'ajungi', prezent_el: 'ajunge', prezent_noi: 'ajungem', prezent_voi: 'ajungeți', prezent_ei: 'ajung',
      imperfect_eu: 'ajungeam', imperfect_tu: 'ajungeai', imperfect_el: 'ajungea', imperfect_noi: 'ajungeam', imperfect_voi: 'ajungeați', imperfect_ei: 'ajungeau',
      perfect_eu: 'am ajuns', perfect_tu: 'ai ajuns', perfect_el: 'a ajuns', perfect_noi: 'am ajuns', perfect_voi: 'ați ajuns', perfect_ei: 'au ajuns',
      viitor_eu: 'voi ajunge', viitor_tu: 'vei ajunge', viitor_el: 'va ajunge', viitor_noi: 'vom ajunge', viitor_voi: 'veți ajunge', viitor_ei: 'vor ajunge',
      conjunctiv_eu: 'să ajung', conjunctiv_tu: 'să ajungi', conjunctiv_el: 'să ajungă', conjunctiv_noi: 'să ajungem', conjunctiv_voi: 'să ajungeți', conjunctiv_ei: 'să ajungă',
      conditional_eu: 'aș ajunge', conditional_tu: 'ai ajunge', conditional_el: 'ar ajunge', conditional_noi: 'am ajunge', conditional_voi: 'ați ajunge', conditional_ei: 'ar ajunge',
      imperativ_tu: 'ajunge',
    },
  },
];
