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
  {
    id: 'ja-easy-8',
    title: 'Convenience Store',
    text: 'おにぎりとお茶をください。温めますか？いいえ、大丈夫です。袋はいりません。ありがとうございます。',
    difficulty: 'easy',
    questions: [
      { question: 'What does the customer buy?', options: ['Sandwich and coffee', 'Onigiri and tea', 'Bento and water', 'Bread and juice'], correctIndex: 1 },
      { question: 'Does the customer want the food heated?', options: ['Yes', 'No', 'Only the onigiri', 'Only the tea'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-easy-9',
    title: 'Post Office Directions',
    text: 'すみません、郵便局はどこですか。この道をまっすぐ行ってください。二つ目の信号を左に曲がると、右側にあります。歩いて十分ぐらいです。ありがとうございます。',
    difficulty: 'easy',
    questions: [
      { question: 'What is the person looking for?', options: ['Bank', 'Post office', 'Hospital', 'Library'], correctIndex: 1 },
      { question: 'Which direction should they turn?', options: ['Right at the first corner', 'Left at the second traffic light', 'Straight ahead', 'Right at the third block'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-easy-10',
    title: 'At the Station',
    text: 'すみません、東京行きの切符を一枚ください。片道ですか、往復ですか。片道でお願いします。三番ホームから出ます。ありがとうございます。',
    difficulty: 'easy',
    questions: [
      { question: 'Where is the person going?', options: ['Osaka', 'Kyoto', 'Tokyo', 'Nagoya'], correctIndex: 2 },
      { question: 'What type of ticket does the person buy?', options: ['Round trip', 'One-way', 'Monthly pass', 'Student ticket'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-easy-11',
    title: 'Phone Call',
    text: 'もしもし、田中ですが、鈴木さんはいらっしゃいますか。鈴木は今出かけています。何時ごろ戻りますか。三時ごろ戻ると思います。では、また後で電話します。',
    difficulty: 'easy',
    questions: [
      { question: 'Who is calling?', options: ['Suzuki', 'Tanaka', 'Yamada', 'Sato'], correctIndex: 1 },
      { question: 'Where is Suzuki?', options: ['At home', 'In a meeting', 'Out', 'Sleeping'], correctIndex: 2 },
    ],
  },
  {
    id: 'ja-easy-12',
    title: 'Weather Forecast',
    text: '明日の東京の天気をお伝えします。午前中は晴れですが、午後から雨になるでしょう。気温は最高二十五度です。お出かけの際は傘をお持ちください。',
    difficulty: 'easy',
    questions: [
      { question: 'What will the weather be like in the morning?', options: ['Rainy', 'Cloudy', 'Sunny', 'Snowy'], correctIndex: 2 },
      { question: 'What should people bring when going out?', options: ['A jacket', 'An umbrella', 'Sunglasses', 'A hat'], correctIndex: 1 },
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
  {
    id: 'ja-med-8',
    title: 'Job Interview',
    text: '本日は面接にお越しいただきありがとうございます。まず自己紹介をお願いします。はい、山本太郎と申します。大学では経営学を学びました。卒業後は二年間営業の仕事をしていました。御社の商品開発に興味があり、応募しました。自分の経験を活かして頑張りたいと思います。',
    difficulty: 'medium',
    questions: [
      { question: 'What did Yamamoto study at university?', options: ['Engineering', 'Business administration', 'Literature', 'Medicine'], correctIndex: 1 },
      { question: 'How long did he work in sales?', options: ['One year', 'Two years', 'Three years', 'Five years'], correctIndex: 1 },
      { question: 'Why did he apply to this company?', options: ['Higher salary', 'Interest in product development', 'Location convenience', 'Friend recommendation'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-med-9',
    title: 'Doctor Visit',
    text: 'どうしましたか。昨日から頭が痛くて、熱もあります。三十八度です。喉も少し痛いです。風邪ですね。薬を出しますので、一日三回食後に飲んでください。二、三日休んでください。水分をたくさん取ることも大切です。',
    difficulty: 'medium',
    questions: [
      { question: 'What are the patient\'s symptoms?', options: ['Stomachache and nausea', 'Headache, fever, and sore throat', 'Back pain and dizziness', 'Cough and runny nose'], correctIndex: 1 },
      { question: 'How often should the medicine be taken?', options: ['Twice a day before meals', 'Three times a day after meals', 'Once a day before bed', 'Four times a day'], correctIndex: 1 },
      { question: 'What advice does the doctor give?', options: ['Exercise regularly', 'Rest for 2-3 days and drink lots of fluids', 'Eat more vegetables', 'Go to the hospital'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-med-10',
    title: 'University Orientation',
    text: '新入生の皆さん、ようこそ。これからキャンパスの案内をします。正面の建物が図書館です。月曜日から土曜日まで、朝九時から夜八時まで開いています。左側に食堂があります。学生証を見せると割引が受けられます。体育館はキャンパスの奥にあります。',
    difficulty: 'medium',
    questions: [
      { question: 'What are the library hours?', options: ['8 AM to 6 PM', '9 AM to 8 PM', '10 AM to 9 PM', '7 AM to 7 PM'], correctIndex: 1 },
      { question: 'What do students need for a cafeteria discount?', options: ['Cash only', 'Student ID', 'A coupon', 'Faculty recommendation'], correctIndex: 1 },
      { question: 'Where is the gymnasium?', options: ['Next to the library', 'Near the entrance', 'At the back of campus', 'Across the street'], correctIndex: 2 },
    ],
  },
  {
    id: 'ja-med-11',
    title: 'Travel Planning',
    text: '夏休みにどこか旅行に行かない？いいね！北海道はどう？海もあるし、食べ物もおいしいし。でも飛行機代が高いよ。じゃあ沖縄は？泳げるし、ダイビングもできるよ。沖縄にしよう！三泊四日はどう？いいね、来週ホテルを予約しよう。',
    difficulty: 'medium',
    questions: [
      { question: 'What was the first destination suggested?', options: ['Okinawa', 'Kyoto', 'Hokkaido', 'Tokyo'], correctIndex: 2 },
      { question: 'Why was Hokkaido rejected?', options: ['Too cold', 'Flights are expensive', 'Too far', 'Not interesting'], correctIndex: 1 },
      { question: 'How long will the trip be?', options: ['2 nights 3 days', '3 nights 4 days', '4 nights 5 days', '1 week'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-med-12',
    title: 'News Report',
    text: '本日のニュースです。今週末、京都市で秋の伝統祭りが開催されます。今年で五十回目を迎えるこの祭りには、毎年約十万人が訪れます。地元の食べ物や伝統的な踊りが楽しめます。会場は京都中央公園で、入場は無料です。雨天の場合は翌週に延期されます。',
    difficulty: 'medium',
    questions: [
      { question: 'How many times has this festival been held?', options: ['10', '30', '50', '100'], correctIndex: 2 },
      { question: 'How many people visit each year?', options: ['About 10,000', 'About 50,000', 'About 100,000', 'About 500,000'], correctIndex: 2 },
      { question: 'What happens if it rains?', options: ['Cancelled', 'Moved indoors', 'Postponed to the following week', 'Held regardless'], correctIndex: 2 },
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
  {
    id: 'ja-hard-7',
    title: 'Business Meeting',
    text: 'それでは、今期のプロジェクトの進捗状況について報告します。現在、予定より二週間遅れています。主な原因は部品の納入が遅れたことです。予算については、当初の見積もりより百五十万円超過しています。今後の対策として、外注先を増やし、来月末までに遅れを取り戻す計画です。品質管理チームとも連携して、納期に間に合わせたいと思います。',
    difficulty: 'hard',
    questions: [
      { question: 'How far behind schedule is the project?', options: ['One week', 'Two weeks', 'One month', 'Three days'], correctIndex: 1 },
      { question: 'What caused the delay?', options: ['Staff shortage', 'Late delivery of parts', 'Budget cuts', 'Technical problems'], correctIndex: 1 },
      { question: 'How much over budget is the project?', options: ['500,000 yen', '1 million yen', '1.5 million yen', '2 million yen'], correctIndex: 2 },
    ],
  },
  {
    id: 'ja-hard-8',
    title: 'Train Delay Announcement',
    text: 'お客様にお知らせいたします。中央線は、本日午前八時頃、新宿駅付近での信号機故障のため、現在運転を見合わせております。復旧の見込みは午前十時頃です。振替輸送として、山手線と丸ノ内線をご利用いただけます。ご迷惑をおかけして申し訳ございません。最新の情報は駅の掲示板またはホームページでご確認ください。',
    difficulty: 'hard',
    questions: [
      { question: 'Why is the train delayed?', options: ['Earthquake', 'Signal malfunction', 'Passenger accident', 'Heavy rain'], correctIndex: 1 },
      { question: 'When is service expected to resume?', options: ['Around 9 AM', 'Around 10 AM', 'Around 11 AM', 'Around noon'], correctIndex: 1 },
      { question: 'What alternative lines are available?', options: ['Sobu Line and Tozai Line', 'Yamanote Line and Marunouchi Line', 'Keio Line and Odakyu Line', 'Chuo Line Express'], correctIndex: 1 },
    ],
  },
  {
    id: 'ja-hard-9',
    title: 'Cultural Exchange',
    text: '日本と西洋の文化の違いについて考えてみましょう。日本では靴を脱いで家に入りますが、多くの西洋の国ではそのまま入ります。食事の仕方も違います。日本では箸を使いますが、西洋ではナイフとフォークが一般的です。また、日本では名刺交換がビジネスマナーとして重要ですが、西洋ではより握手が重視されます。こうした違いを理解することが、国際的なコミュニケーションに役立ちます。',
    difficulty: 'hard',
    questions: [
      { question: 'What do Japanese people do when entering a house?', options: ['Bow', 'Remove shoes', 'Wash hands', 'Ring a bell'], correctIndex: 1 },
      { question: 'What is important in Japanese business culture?', options: ['Gift giving', 'Business card exchange', 'Casual conversation', 'Eye contact'], correctIndex: 1 },
      { question: 'What is emphasized more in Western business culture?', options: ['Bowing', 'Business cards', 'Handshakes', 'Formal greetings'], correctIndex: 2 },
    ],
  },
  {
    id: 'ja-hard-10',
    title: 'Documentary Narration: Washi',
    text: '和紙は千年以上の歴史を持つ日本の伝統工芸品です。楮や三椏などの植物の繊維から作られます。和紙作りの技術はユネスコの無形文化遺産に登録されています。現代でも書道や障子、和菓子の包装など、様々な場面で使われています。しかし、職人の高齢化と後継者不足が課題となっており、伝統を守るための取り組みが各地で行われています。',
    difficulty: 'hard',
    questions: [
      { question: 'How long has washi been around?', options: ['About 500 years', 'Over 1,000 years', 'About 2,000 years', 'About 300 years'], correctIndex: 1 },
      { question: 'What international recognition has washi received?', options: ['Nobel Prize', 'UNESCO Intangible Cultural Heritage', 'World Heritage Site', 'Olympic recognition'], correctIndex: 1 },
      { question: 'What current challenge does washi face?', options: ['Lack of materials', 'Aging craftsmen and lack of successors', 'Low demand', 'Foreign competition'], correctIndex: 1 },
    ],
  },
];
