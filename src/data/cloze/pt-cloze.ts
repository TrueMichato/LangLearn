import type { ClozeSentence } from './ja-cloze';

export const ptClozeSentences: ClozeSentence[] = [
  // ── Beginner ──
  { id: 'pt-c001', target: 'Eu bebo água todos os dias', english: 'I drink water every day', blankedWord: 'água', blankedReading: 'AH-gwah', frequencyRank: 1, difficulty: 'beginner' },
  { id: 'pt-c002', target: 'Ela é uma estudante', english: 'She is a student', blankedWord: 'estudante', blankedReading: 'esh-too-DAHN-chee', frequencyRank: 2, difficulty: 'beginner' },
  { id: 'pt-c003', target: 'Hoje o tempo está bom', english: 'The weather is nice today', blankedWord: 'tempo', blankedReading: 'TEM-poo', frequencyRank: 3, difficulty: 'beginner' },
  { id: 'pt-c004', target: 'Eu gosto de gatos', english: 'I like cats', blankedWord: 'gatos', blankedReading: 'GAH-toosh', frequencyRank: 4, difficulty: 'beginner' },
  { id: 'pt-c005', target: 'Isto é um livro', english: 'This is a book', blankedWord: 'livro', blankedReading: 'LEE-vroo', frequencyRank: 5, difficulty: 'beginner' },
  { id: 'pt-c006', target: 'Eu vou à escola todos os dias', english: 'I go to school every day', blankedWord: 'escola', blankedReading: 'esh-KOH-lah', frequencyRank: 6, difficulty: 'beginner' },
  { id: 'pt-c007', target: 'Eu comi o café da manhã', english: 'I ate breakfast', blankedWord: 'café da manhã', blankedReading: 'kah-FEH dah mah-NYAH', frequencyRank: 7, difficulty: 'beginner' },
  { id: 'pt-c008', target: 'Nós assistimos um filme', english: 'We watched a movie', blankedWord: 'filme', blankedReading: 'FEE-oo-mee', frequencyRank: 8, difficulty: 'beginner' },
  { id: 'pt-c009', target: 'Onde fica a estação?', english: 'Where is the station?', blankedWord: 'estação', blankedReading: 'esh-tah-SAHW', frequencyRank: 9, difficulty: 'beginner' },
  { id: 'pt-c010', target: 'A casa é grande', english: 'The house is big', blankedWord: 'casa', blankedReading: 'KAH-zah', frequencyRank: 10, difficulty: 'beginner' },

  // ── Intermediate ──
  { id: 'pt-c011', target: 'Eu preciso comprar remédios na farmácia', english: 'I need to buy medicine at the pharmacy', blankedWord: 'farmácia', blankedReading: 'far-MAH-see-ah', frequencyRank: 11, difficulty: 'intermediate' },
  { id: 'pt-c012', target: 'O restaurante fecha às dez da noite', english: 'The restaurant closes at ten at night', blankedWord: 'restaurante', blankedReading: 'hes-tow-RAHN-chee', frequencyRank: 12, difficulty: 'intermediate' },
  { id: 'pt-c013', target: 'Ela trabalha numa empresa de tecnologia', english: 'She works at a technology company', blankedWord: 'empresa', blankedReading: 'em-PREH-zah', frequencyRank: 13, difficulty: 'intermediate' },
  { id: 'pt-c014', target: 'Nós viajamos para o Brasil no verão', english: 'We traveled to Brazil in the summer', blankedWord: 'viajamos', blankedReading: 'vee-ah-ZHAH-moosh', frequencyRank: 14, difficulty: 'intermediate' },
  { id: 'pt-c015', target: 'O médico disse que estou saudável', english: 'The doctor said I am healthy', blankedWord: 'saudável', blankedReading: 'sow-DAH-vew', frequencyRank: 15, difficulty: 'intermediate' },
  { id: 'pt-c016', target: 'Eu esqueci a senha do meu e-mail', english: 'I forgot my email password', blankedWord: 'esqueci', blankedReading: 'esh-keh-SEE', frequencyRank: 16, difficulty: 'intermediate' },
  { id: 'pt-c017', target: 'Ele conseguiu resolver o problema', english: 'He managed to solve the problem', blankedWord: 'conseguiu', blankedReading: 'kon-seh-GEE-oo', frequencyRank: 17, difficulty: 'intermediate' },
  { id: 'pt-c018', target: 'A reunião foi adiada para amanhã', english: 'The meeting was postponed to tomorrow', blankedWord: 'reunião', blankedReading: 'heh-oo-nee-OWN', frequencyRank: 18, difficulty: 'intermediate' },
  { id: 'pt-c019', target: 'Eu prefiro café sem açúcar', english: 'I prefer coffee without sugar', blankedWord: 'açúcar', blankedReading: 'ah-SOO-kar', frequencyRank: 19, difficulty: 'intermediate' },
  { id: 'pt-c020', target: 'O trânsito está muito congestionado', english: 'The traffic is very congested', blankedWord: 'congestionado', blankedReading: 'kon-zhes-chee-oh-NAH-doo', frequencyRank: 20, difficulty: 'intermediate' },

  // ── Advanced ──
  { id: 'pt-c021', target: 'O governo anunciou novas medidas econômicas', english: 'The government announced new economic measures', blankedWord: 'econômicas', blankedReading: 'eh-ko-NOH-mee-kahs', frequencyRank: 21, difficulty: 'advanced' },
  { id: 'pt-c022', target: 'A pesquisa científica trouxe resultados surpreendentes', english: 'The scientific research brought surprising results', blankedWord: 'surpreendentes', blankedReading: 'soor-pree-en-DEN-cheesh', frequencyRank: 22, difficulty: 'advanced' },
  { id: 'pt-c023', target: 'É imprescindível que todos participem da discussão', english: 'It is essential that everyone participates in the discussion', blankedWord: 'imprescindível', blankedReading: 'im-preh-sin-DEE-vew', frequencyRank: 23, difficulty: 'advanced' },
  { id: 'pt-c024', target: 'O desmatamento da floresta amazônica é preocupante', english: 'The deforestation of the Amazon forest is concerning', blankedWord: 'desmatamento', blankedReading: 'des-mah-tah-MEN-too', frequencyRank: 24, difficulty: 'advanced' },
  { id: 'pt-c025', target: 'A desigualdade social continua sendo um desafio', english: 'Social inequality remains a challenge', blankedWord: 'desigualdade', blankedReading: 'deh-zee-gwal-DAH-jee', frequencyRank: 25, difficulty: 'advanced' },
  { id: 'pt-c026', target: 'Ele demonstrou uma compreensão extraordinária do assunto', english: 'He demonstrated an extraordinary understanding of the subject', blankedWord: 'compreensão', blankedReading: 'kom-pree-en-SAHW', frequencyRank: 26, difficulty: 'advanced' },
  { id: 'pt-c027', target: 'As consequências das mudanças climáticas são imprevisíveis', english: 'The consequences of climate change are unpredictable', blankedWord: 'consequências', blankedReading: 'kon-seh-KWEN-see-ahs', frequencyRank: 27, difficulty: 'advanced' },
  { id: 'pt-c028', target: 'O empreendedorismo tem crescido significativamente', english: 'Entrepreneurship has grown significantly', blankedWord: 'empreendedorismo', blankedReading: 'em-pree-en-deh-doh-REEZ-moo', frequencyRank: 28, difficulty: 'advanced' },
  { id: 'pt-c029', target: 'A sustentabilidade é fundamental para o futuro', english: 'Sustainability is fundamental for the future', blankedWord: 'sustentabilidade', blankedReading: 'soos-ten-tah-bee-lee-DAH-jee', frequencyRank: 29, difficulty: 'advanced' },
  { id: 'pt-c030', target: 'O desenvolvimento tecnológico transformou a sociedade', english: 'Technological development transformed society', blankedWord: 'desenvolvimento', blankedReading: 'deh-zen-vol-vee-MEN-too', frequencyRank: 30, difficulty: 'advanced' },
];
