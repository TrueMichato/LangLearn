export interface ListeningQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface ListeningPassage {
  id: string;
  title: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: ListeningQuestion[];
}

export const jaPassages: ListeningPassage[] = [
  // ── Easy ──────────────────────────────────────────────
  {
    id: 'ja-easy-1',
    title: 'Self Introduction',
    text: 'はじめまして。私は田中です。学生です。日本語を勉強しています。よろしくお願いします。',
    difficulty: 'easy',
    questions: [
      { question: "What is the speaker's name?", options: ['Suzuki', 'Tanaka', 'Yamada', 'Sato'], correctIndex: 1 },
      { question: 'What is the speaker doing?', options: ['Working', 'Studying Japanese', 'Cooking', 'Traveling'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-easy-2',
    title: 'At the Café',
    text: 'すみません。コーヒーを一つください。ホットでお願いします。砂糖はいりません。',
    difficulty: 'easy',
    questions: [
      { question: 'What does the speaker order?', options: ['Tea', 'Coffee', 'Juice', 'Water'], correctIndex: 1 },
      { question: 'Does the speaker want sugar?', options: ['Yes', 'No', 'A little', 'Double'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-easy-3',
    title: 'The Weather',
    text: '今日はいい天気ですね。暖かいです。公園に行きましょう。散歩しましょう。',
    difficulty: 'easy',
    questions: [
      { question: "How is today's weather?", options: ['Rainy', 'Cold', 'Nice and warm', 'Snowy'], correctIndex: 2 },
      { question: 'Where does the speaker suggest going?', options: ['School', 'Store', 'Park', 'Restaurant'], correctIndex: 2 },
    ],
  },
  {
    id: 'ja-easy-4',
    title: 'Family',
    text: '私の家族は四人です。父と母と姉と私です。姉は大学生です。私は高校生です。',
    difficulty: 'easy',
    questions: [
      { question: 'How many people are in the family?', options: ['Three', 'Four', 'Five', 'Six'], correctIndex: 1 },
      { question: 'What is the speaker?', options: ['University student', 'High school student', 'Teacher', 'Office worker'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-easy-5',
    title: 'Asking Directions',
    text: 'すみません。駅はどこですか。まっすぐ行ってください。右に曲がってください。五分ぐらいです。',
    difficulty: 'easy',
    questions: [
      { question: 'What is the speaker looking for?', options: ['Hospital', 'Station', 'School', 'Hotel'], correctIndex: 1 },
      { question: 'How long does it take?', options: ['2 minutes', '5 minutes', '10 minutes', '15 minutes'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-easy-6',
    title: 'Shopping',
    text: 'このりんごはいくらですか。一つ百円です。三つください。三百円です。',
    difficulty: 'easy',
    questions: [
      { question: 'What is being bought?', options: ['Oranges', 'Apples', 'Bananas', 'Grapes'], correctIndex: 1 },
      { question: 'How much does the speaker pay?', options: ['100 yen', '200 yen', '300 yen', '400 yen'], correctIndex: 2 },
    ],
  },
  {
    id: 'ja-easy-7',
    title: 'What Time Is It?',
    text: '今何時ですか。三時です。授業は四時からです。まだ一時間あります。',
    difficulty: 'easy',
    questions: [
      { question: 'What time is it now?', options: ['2 o\'clock', '3 o\'clock', '4 o\'clock', '5 o\'clock'], correctIndex: 1 },
      { question: 'When does class start?', options: ['3 o\'clock', '4 o\'clock', '5 o\'clock', '6 o\'clock'], correctIndex: 1 },
    ],
  },

  // ── Medium ────────────────────────────────────────────
  {
    id: 'ja-med-1',
    title: 'Daily Routine',
    text: '毎朝六時に起きます。シャワーを浴びて、朝ご飯を食べます。七時半に家を出て、電車で会社に行きます。仕事は九時から五時までです。帰りにスーパーで買い物をして、夕ご飯を作ります。',
    difficulty: 'medium',
    questions: [
      { question: 'What time does the speaker wake up?', options: ['5:00', '6:00', '7:00', '7:30'], correctIndex: 1 },
      { question: 'How does the speaker go to work?', options: ['By bus', 'By car', 'By train', 'On foot'], correctIndex: 2 },
      { question: 'What does the speaker do on the way home?', options: ['Goes to the gym', 'Shops at the supermarket', 'Meets a friend', 'Goes to a café'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-med-2',
    title: 'My Hobby',
    text: '私の趣味は料理です。毎週末、新しいレシピを試します。先週はカレーを作りました。友達が来て、一緒に食べました。みんな「おいしい」と言いました。来週はケーキを作りたいです。',
    difficulty: 'medium',
    questions: [
      { question: "What is the speaker's hobby?", options: ['Reading', 'Cooking', 'Painting', 'Sports'], correctIndex: 1 },
      { question: 'What did the speaker make last week?', options: ['Sushi', 'Ramen', 'Curry', 'Cake'], correctIndex: 2 },
      { question: 'What does the speaker want to make next week?', options: ['Curry', 'Bread', 'Cake', 'Sushi'], correctIndex: 2 },
    ],
  },
  {
    id: 'ja-med-3',
    title: 'Describing My Town',
    text: '私の町は小さいですが、とても静かです。駅の近くにスーパーとコンビニがあります。公園には大きい桜の木があって、春はとてもきれいです。山も近くにあるので、週末はよくハイキングに行きます。',
    difficulty: 'medium',
    questions: [
      { question: "What is the speaker's town like?", options: ['Big and busy', 'Small and quiet', 'Old and noisy', 'New and modern'], correctIndex: 1 },
      { question: 'What is in the park?', options: ['A fountain', 'A big cherry blossom tree', 'A pond', 'A playground'], correctIndex: 1 },
      { question: 'What does the speaker do on weekends?', options: ['Shopping', 'Hiking', 'Swimming', 'Cycling'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-med-4',
    title: 'Planning a Trip',
    text: '来月、京都に旅行に行きます。二泊三日の予定です。一日目はお寺を見に行きます。二日目は着物を着て、町を歩きたいです。三日目はお土産を買って、帰ります。とても楽しみです。',
    difficulty: 'medium',
    questions: [
      { question: 'Where is the speaker traveling?', options: ['Tokyo', 'Osaka', 'Kyoto', 'Nara'], correctIndex: 2 },
      { question: 'How long is the trip?', options: ['1 night', '2 nights', '3 nights', '4 nights'], correctIndex: 1 },
      { question: 'What does the speaker want to do on day 2?', options: ['Visit temples', 'Wear kimono and walk around', 'Buy souvenirs', 'Eat sushi'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-med-5',
    title: 'At the Restaurant',
    text: 'いらっしゃいませ。二名様ですか。はい、二人です。こちらのお席にどうぞ。メニューです。ラーメンと餃子をください。飲み物はビールを二つお願いします。かしこまりました。',
    difficulty: 'medium',
    questions: [
      { question: 'How many people are there?', options: ['One', 'Two', 'Three', 'Four'], correctIndex: 1 },
      { question: 'What food do they order?', options: ['Sushi and tempura', 'Ramen and gyoza', 'Udon and tonkatsu', 'Rice and miso soup'], correctIndex: 1 },
      { question: 'What do they order to drink?', options: ['Water', 'Tea', 'Beer', 'Sake'], correctIndex: 2 },
    ],
  },
  {
    id: 'ja-med-6',
    title: 'Weekend Plans',
    text: '今週末は忙しいです。土曜日の午前中はテニスの練習があります。午後は図書館で勉強します。日曜日は友達と映画を見に行きます。その後、レストランで晩ご飯を食べる予定です。',
    difficulty: 'medium',
    questions: [
      { question: 'What does the speaker practice Saturday morning?', options: ['Soccer', 'Basketball', 'Tennis', 'Baseball'], correctIndex: 2 },
      { question: 'Where does the speaker study Saturday afternoon?', options: ['At home', 'At a café', 'At the library', 'At school'], correctIndex: 2 },
      { question: 'What will the speaker do Sunday?', options: ['Go shopping', 'Watch a movie with friends', 'Stay home', 'Go hiking'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-med-7',
    title: 'My Pet',
    text: '私は猫を飼っています。名前はミケです。三歳のメス猫です。ミケは魚が大好きです。毎日窓の近くで寝ています。時々、夜中に走り回ります。とてもかわいいけど、少しうるさいです。',
    difficulty: 'medium',
    questions: [
      { question: 'What pet does the speaker have?', options: ['A dog', 'A cat', 'A bird', 'A rabbit'], correctIndex: 1 },
      { question: 'What does the pet love to eat?', options: ['Meat', 'Fish', 'Vegetables', 'Rice'], correctIndex: 1 },
      { question: 'What does the pet do at night sometimes?', options: ['Sleeps', 'Runs around', 'Eats', 'Meows loudly'], correctIndex: 1 },
    ],
  },

  // ── Hard ───────────────────────────────────────────────
  {
    id: 'ja-hard-1',
    title: 'Job Interview',
    text: '本日は面接の機会をいただき、ありがとうございます。私は東京大学で経済学を専攻しておりました。大学在学中にインターンシップでマーケティングの経験を積みました。御社のグローバルな事業展開に大変興味があり、自分の語学力を活かして貢献したいと考えております。',
    difficulty: 'hard',
    questions: [
      { question: 'What did the speaker study at university?', options: ['Literature', 'Engineering', 'Economics', 'Medicine'], correctIndex: 2 },
      { question: 'What experience did the speaker gain during an internship?', options: ['Programming', 'Marketing', 'Accounting', 'Teaching'], correctIndex: 1 },
      { question: 'What skill does the speaker want to use?', options: ['Programming skills', 'Math skills', 'Language skills', 'Design skills'], correctIndex: 2 },
    ],
  },
  {
    id: 'ja-hard-2',
    title: 'Environmental Issues',
    text: '近年、地球温暖化が深刻な問題になっています。海面が上昇し、異常気象が増えています。この問題を解決するために、再生可能エネルギーの利用を増やすべきです。一人一人がリサイクルや節電を心がけることも重要です。私たちの行動が未来を変えることができます。',
    difficulty: 'hard',
    questions: [
      { question: 'What is the main topic?', options: ['Economy', 'Education', 'Global warming', 'Technology'], correctIndex: 2 },
      { question: 'What kind of energy should be increased?', options: ['Nuclear', 'Fossil fuel', 'Renewable', 'Coal'], correctIndex: 2 },
      { question: 'What individual actions are mentioned?', options: ['Driving less', 'Recycling and saving electricity', 'Planting trees', 'Eating less meat'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-hard-3',
    title: 'Japanese Festivals',
    text: '日本には四季折々の祭りがあります。夏祭りでは浴衣を着て、花火を楽しみます。屋台では焼きそばやたこ焼きが人気です。盆踊りでは皆が輪になって踊ります。祭りは地域の人々を結びつける大切な文化的行事です。観光客にとっても日本文化を体験する素晴らしい機会です。',
    difficulty: 'hard',
    questions: [
      { question: 'What do people wear at summer festivals?', options: ['Kimono', 'Yukata', 'Suit', 'Uniform'], correctIndex: 1 },
      { question: 'What popular foods are mentioned?', options: ['Sushi and ramen', 'Yakisoba and takoyaki', 'Tempura and udon', 'Rice balls and miso soup'], correctIndex: 1 },
      { question: 'What is the cultural role of festivals?', options: ['Entertainment only', 'Bringing communities together', 'Religious worship', 'Economic growth'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-hard-4',
    title: 'Technology and Society',
    text: 'AIの発展は社会に大きな変化をもたらしています。自動翻訳や自動運転など、便利な技術が次々と登場しています。しかし、プライバシーの問題や雇用への影響も懸念されています。技術の進歩と倫理的な課題のバランスを取ることが、これからの社会にとって重要な課題となるでしょう。',
    difficulty: 'hard',
    questions: [
      { question: 'What technology examples are mentioned?', options: ['Social media and gaming', 'Auto-translation and self-driving', 'Robotics and space travel', 'VR and AR'], correctIndex: 1 },
      { question: 'What concerns are raised?', options: ['Cost of technology', 'Privacy and employment', 'Internet speed', 'Energy consumption'], correctIndex: 1 },
      { question: 'What is described as an important future challenge?', options: ['Making technology cheaper', 'Balancing progress and ethics', 'Building more factories', 'Increasing internet access'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-hard-5',
    title: 'A Childhood Memory',
    text: '子供の頃、毎年夏になると祖父母の家に遊びに行きました。田舎の家は古くて大きく、裏には広い庭がありました。祖母は毎朝新鮮な野菜を畑から取ってきて、朝ご飯を作ってくれました。祖父と一緒に川で魚を釣ったことは、今でも大切な思い出です。',
    difficulty: 'hard',
    questions: [
      { question: 'When did the speaker visit grandparents?', options: ['Every winter', 'Every summer', 'Every spring', 'Every autumn'], correctIndex: 1 },
      { question: "What did the grandmother do every morning?", options: ['Made breakfast with fresh vegetables', 'Went to the market', 'Fed the animals', 'Cleaned the house'], correctIndex: 0 },
      { question: 'What did the speaker do with the grandfather?', options: ['Went hiking', 'Went fishing', 'Played games', 'Read books'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-hard-6',
    title: 'Health and Lifestyle',
    text: '健康な生活を送るためには、バランスの良い食事と適度な運動が欠かせません。最近の研究によると、睡眠の質も健康に大きく影響するそうです。ストレスを溜めないことも大切です。瞑想やヨガなどのリラクゼーション法を取り入れることで、心身のバランスを保つことができると言われています。',
    difficulty: 'hard',
    questions: [
      { question: 'What is essential for a healthy life according to the passage?', options: ['Medicine', 'Balanced diet and moderate exercise', 'Expensive food', 'Working hard'], correctIndex: 1 },
      { question: 'What also greatly affects health?', options: ['Weather', 'Sleep quality', 'Social media', 'Money'], correctIndex: 1 },
      { question: 'What relaxation methods are mentioned?', options: ['Reading and music', 'Meditation and yoga', 'Travel and cooking', 'Gaming and TV'], correctIndex: 1 },
    ],
  },
];
