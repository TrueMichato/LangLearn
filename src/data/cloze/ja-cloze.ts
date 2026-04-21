// Cloze-specific sentence type with the blanked word
export interface ClozeSentence {
  id: string;
  /** Full sentence in target language */
  target: string;
  /** English translation */
  english: string;
  /** The word that gets blanked */
  blankedWord: string;
  /** Reading/pronunciation of the blanked word */
  blankedReading: string;
  /** Frequency rank: lower = more common */
  frequencyRank: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// ─── Japanese Cloze Sentences ───
// Inspired by Tatoeba (CC-BY 2.0 FR) and frequency-ranked
// Covers N5 → N3 vocabulary in natural sentence contexts
export const jaClozeSentences: ClozeSentence[] = [
  // ── Beginner (N5 vocab, short sentences) ──
  { id: 'ja-c001', target: '私は水を飲みます', english: 'I drink water', blankedWord: '水', blankedReading: 'みず', frequencyRank: 1, difficulty: 'beginner' },
  { id: 'ja-c002', target: '彼は学生です', english: 'He is a student', blankedWord: '学生', blankedReading: 'がくせい', frequencyRank: 2, difficulty: 'beginner' },
  { id: 'ja-c003', target: '今日は天気がいいです', english: 'The weather is nice today', blankedWord: '天気', blankedReading: 'てんき', frequencyRank: 3, difficulty: 'beginner' },
  { id: 'ja-c004', target: '猫が好きです', english: 'I like cats', blankedWord: '猫', blankedReading: 'ねこ', frequencyRank: 4, difficulty: 'beginner' },
  { id: 'ja-c005', target: 'これは本です', english: 'This is a book', blankedWord: '本', blankedReading: 'ほん', frequencyRank: 5, difficulty: 'beginner' },
  { id: 'ja-c006', target: '毎日学校に行きます', english: 'I go to school every day', blankedWord: '学校', blankedReading: 'がっこう', frequencyRank: 6, difficulty: 'beginner' },
  { id: 'ja-c007', target: '朝ごはんを食べました', english: 'I ate breakfast', blankedWord: '食べました', blankedReading: 'たべました', frequencyRank: 7, difficulty: 'beginner' },
  { id: 'ja-c008', target: '友達と映画を見ました', english: 'I watched a movie with a friend', blankedWord: '映画', blankedReading: 'えいが', frequencyRank: 8, difficulty: 'beginner' },
  { id: 'ja-c009', target: '駅はどこですか', english: 'Where is the station?', blankedWord: '駅', blankedReading: 'えき', frequencyRank: 9, difficulty: 'beginner' },
  { id: 'ja-c010', target: 'この花はきれいです', english: 'This flower is beautiful', blankedWord: '花', blankedReading: 'はな', frequencyRank: 10, difficulty: 'beginner' },
  { id: 'ja-c011', target: '日本語を勉強しています', english: 'I am studying Japanese', blankedWord: '勉強', blankedReading: 'べんきょう', frequencyRank: 11, difficulty: 'beginner' },
  { id: 'ja-c012', target: '母は料理が上手です', english: 'My mother is good at cooking', blankedWord: '料理', blankedReading: 'りょうり', frequencyRank: 12, difficulty: 'beginner' },
  { id: 'ja-c013', target: '時間がありません', english: 'I don\'t have time', blankedWord: '時間', blankedReading: 'じかん', frequencyRank: 13, difficulty: 'beginner' },
  { id: 'ja-c014', target: '電車に乗ります', english: 'I ride the train', blankedWord: '電車', blankedReading: 'でんしゃ', frequencyRank: 14, difficulty: 'beginner' },
  { id: 'ja-c015', target: '新しい靴を買いました', english: 'I bought new shoes', blankedWord: '買いました', blankedReading: 'かいました', frequencyRank: 15, difficulty: 'beginner' },
  { id: 'ja-c016', target: 'お茶を飲みませんか', english: 'Would you like some tea?', blankedWord: 'お茶', blankedReading: 'おちゃ', frequencyRank: 16, difficulty: 'beginner' },
  { id: 'ja-c017', target: '部屋は広いです', english: 'The room is spacious', blankedWord: '広い', blankedReading: 'ひろい', frequencyRank: 17, difficulty: 'beginner' },
  { id: 'ja-c018', target: '家族は四人です', english: 'My family has four people', blankedWord: '家族', blankedReading: 'かぞく', frequencyRank: 18, difficulty: 'beginner' },
  { id: 'ja-c019', target: '明日は日曜日です', english: 'Tomorrow is Sunday', blankedWord: '明日', blankedReading: 'あした', frequencyRank: 19, difficulty: 'beginner' },
  { id: 'ja-c020', target: '先生に質問があります', english: 'I have a question for the teacher', blankedWord: '先生', blankedReading: 'せんせい', frequencyRank: 20, difficulty: 'beginner' },

  // ── Intermediate (N4 vocab, compound sentences) ──
  { id: 'ja-c021', target: '試験に合格するために毎日勉強します', english: 'I study every day to pass the exam', blankedWord: '合格', blankedReading: 'ごうかく', frequencyRank: 21, difficulty: 'intermediate' },
  { id: 'ja-c022', target: '東京の人口は多いです', english: 'Tokyo\'s population is large', blankedWord: '人口', blankedReading: 'じんこう', frequencyRank: 22, difficulty: 'intermediate' },
  { id: 'ja-c023', target: '将来医者になりたいです', english: 'I want to become a doctor in the future', blankedWord: '将来', blankedReading: 'しょうらい', frequencyRank: 23, difficulty: 'intermediate' },
  { id: 'ja-c024', target: '彼女は英語を翻訳しています', english: 'She is translating English', blankedWord: '翻訳', blankedReading: 'ほんやく', frequencyRank: 24, difficulty: 'intermediate' },
  { id: 'ja-c025', target: 'この問題は複雑です', english: 'This problem is complicated', blankedWord: '複雑', blankedReading: 'ふくざつ', frequencyRank: 25, difficulty: 'intermediate' },
  { id: 'ja-c026', target: '環境を守ることは大切です', english: 'Protecting the environment is important', blankedWord: '環境', blankedReading: 'かんきょう', frequencyRank: 26, difficulty: 'intermediate' },
  { id: 'ja-c027', target: '最近運動不足です', english: 'I haven\'t been exercising enough recently', blankedWord: '運動', blankedReading: 'うんどう', frequencyRank: 27, difficulty: 'intermediate' },
  { id: 'ja-c028', target: '彼の説明は分かりやすいです', english: 'His explanation is easy to understand', blankedWord: '説明', blankedReading: 'せつめい', frequencyRank: 28, difficulty: 'intermediate' },
  { id: 'ja-c029', target: '地震の経験がありますか', english: 'Have you experienced an earthquake?', blankedWord: '経験', blankedReading: 'けいけん', frequencyRank: 29, difficulty: 'intermediate' },
  { id: 'ja-c030', target: '交通事故に気をつけてください', english: 'Please be careful of traffic accidents', blankedWord: '交通', blankedReading: 'こうつう', frequencyRank: 30, difficulty: 'intermediate' },
  { id: 'ja-c031', target: '会議の準備をしています', english: 'I am preparing for the meeting', blankedWord: '準備', blankedReading: 'じゅんび', frequencyRank: 31, difficulty: 'intermediate' },
  { id: 'ja-c032', target: '彼は有名な作家です', english: 'He is a famous author', blankedWord: '有名', blankedReading: 'ゆうめい', frequencyRank: 32, difficulty: 'intermediate' },
  { id: 'ja-c033', target: '日本の文化に興味があります', english: 'I am interested in Japanese culture', blankedWord: '文化', blankedReading: 'ぶんか', frequencyRank: 33, difficulty: 'intermediate' },
  { id: 'ja-c034', target: '政府は新しい政策を発表しました', english: 'The government announced a new policy', blankedWord: '政策', blankedReading: 'せいさく', frequencyRank: 34, difficulty: 'intermediate' },
  { id: 'ja-c035', target: '彼女は自分の意見をはっきり言います', english: 'She states her opinion clearly', blankedWord: '意見', blankedReading: 'いけん', frequencyRank: 35, difficulty: 'intermediate' },
  { id: 'ja-c036', target: '最近の技術は進歩しています', english: 'Recent technology has progressed', blankedWord: '技術', blankedReading: 'ぎじゅつ', frequencyRank: 36, difficulty: 'intermediate' },
  { id: 'ja-c037', target: '彼は責任感が強い人です', english: 'He is a person with a strong sense of responsibility', blankedWord: '責任', blankedReading: 'せきにん', frequencyRank: 37, difficulty: 'intermediate' },
  { id: 'ja-c038', target: '来月結婚式があります', english: 'There is a wedding next month', blankedWord: '結婚', blankedReading: 'けっこん', frequencyRank: 38, difficulty: 'intermediate' },
  { id: 'ja-c039', target: '彼の成績は優秀です', english: 'His grades are excellent', blankedWord: '成績', blankedReading: 'せいせき', frequencyRank: 39, difficulty: 'intermediate' },
  { id: 'ja-c040', target: 'この計画を実行しましょう', english: 'Let\'s carry out this plan', blankedWord: '計画', blankedReading: 'けいかく', frequencyRank: 40, difficulty: 'intermediate' },

  // ── Advanced (N3 vocab, nuanced sentences) ──
  { id: 'ja-c041', target: '彼の提案は却下されました', english: 'His proposal was rejected', blankedWord: '却下', blankedReading: 'きゃっか', frequencyRank: 41, difficulty: 'advanced' },
  { id: 'ja-c042', target: '国際関係は緊張しています', english: 'International relations are tense', blankedWord: '緊張', blankedReading: 'きんちょう', frequencyRank: 42, difficulty: 'advanced' },
  { id: 'ja-c043', target: 'この理論は矛盾しています', english: 'This theory is contradictory', blankedWord: '矛盾', blankedReading: 'むじゅん', frequencyRank: 43, difficulty: 'advanced' },
  { id: 'ja-c044', target: '新製品の需要が増加しています', english: 'Demand for the new product is increasing', blankedWord: '需要', blankedReading: 'じゅよう', frequencyRank: 44, difficulty: 'advanced' },
  { id: 'ja-c045', target: '彼は偏見を持たない人です', english: 'He is a person without prejudice', blankedWord: '偏見', blankedReading: 'へんけん', frequencyRank: 45, difficulty: 'advanced' },
  { id: 'ja-c046', target: '経済の回復には時間がかかります', english: 'Economic recovery takes time', blankedWord: '回復', blankedReading: 'かいふく', frequencyRank: 46, difficulty: 'advanced' },
  { id: 'ja-c047', target: 'その決定は慎重に行われました', english: 'That decision was made carefully', blankedWord: '慎重', blankedReading: 'しんちょう', frequencyRank: 47, difficulty: 'advanced' },
  { id: 'ja-c048', target: '彼女は困難を克服しました', english: 'She overcame the difficulties', blankedWord: '克服', blankedReading: 'こくふく', frequencyRank: 48, difficulty: 'advanced' },
  { id: 'ja-c049', target: 'この法律は改正が必要です', english: 'This law needs revision', blankedWord: '改正', blankedReading: 'かいせい', frequencyRank: 49, difficulty: 'advanced' },
  { id: 'ja-c050', target: '彼の功績は称賛に値します', english: 'His achievements deserve praise', blankedWord: '功績', blankedReading: 'こうせき', frequencyRank: 50, difficulty: 'advanced' },
  { id: 'ja-c051', target: '社会の格差が拡大しています', english: 'Social inequality is widening', blankedWord: '格差', blankedReading: 'かくさ', frequencyRank: 51, difficulty: 'advanced' },
  { id: 'ja-c052', target: '両国の協力が不可欠です', english: 'Cooperation between both countries is essential', blankedWord: '協力', blankedReading: 'きょうりょく', frequencyRank: 52, difficulty: 'advanced' },
  { id: 'ja-c053', target: 'その事件は未だ解決していません', english: 'That case still hasn\'t been resolved', blankedWord: '解決', blankedReading: 'かいけつ', frequencyRank: 53, difficulty: 'advanced' },
  { id: 'ja-c054', target: '彼の発言は論争を引き起こしました', english: 'His remarks caused controversy', blankedWord: '論争', blankedReading: 'ろんそう', frequencyRank: 54, difficulty: 'advanced' },
  { id: 'ja-c055', target: '彼女は独創的なアイデアを持っています', english: 'She has original ideas', blankedWord: '独創的', blankedReading: 'どくそうてき', frequencyRank: 55, difficulty: 'advanced' },
  { id: 'ja-c056', target: '新しい制度が施行されました', english: 'A new system was implemented', blankedWord: '施行', blankedReading: 'しこう', frequencyRank: 56, difficulty: 'advanced' },
  { id: 'ja-c057', target: 'この薬の副作用に注意してください', english: 'Please be careful of this medicine\'s side effects', blankedWord: '副作用', blankedReading: 'ふくさよう', frequencyRank: 57, difficulty: 'advanced' },
  { id: 'ja-c058', target: '彼は物事を客観的に見ます', english: 'He sees things objectively', blankedWord: '客観的', blankedReading: 'きゃっかんてき', frequencyRank: 58, difficulty: 'advanced' },
  { id: 'ja-c059', target: 'その行為は法律に違反しています', english: 'That act violates the law', blankedWord: '違反', blankedReading: 'いはん', frequencyRank: 59, difficulty: 'advanced' },
  { id: 'ja-c060', target: '彼女の貢献は計り知れません', english: 'Her contribution is immeasurable', blankedWord: '貢献', blankedReading: 'こうけん', frequencyRank: 60, difficulty: 'advanced' },
];
