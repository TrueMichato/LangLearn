import type { ListeningPassage } from './ja-passages';

export const ruPassages: ListeningPassage[] = [
  // ── Easy ──────────────────────────────────────────────
  {
    id: 'ru-easy-1',
    title: 'Self Introduction',
    text: 'Здравствуйте. Меня зовут Анна. Я студентка. Я учу русский язык. Приятно познакомиться.',
    difficulty: 'easy',
    questions: [
      { question: "What is the speaker's name?", options: ['Maria', 'Anna', 'Elena', 'Olga'], correctIndex: 1 },
      { question: 'What is the speaker studying?', options: ['English', 'Russian', 'Math', 'Science'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-easy-2',
    title: 'At the Store',
    text: 'Здравствуйте. Дайте, пожалуйста, хлеб и молоко. Сколько стоит? Двести рублей. Спасибо.',
    difficulty: 'easy',
    questions: [
      { question: 'What does the speaker buy?', options: ['Meat and cheese', 'Bread and milk', 'Fruit and juice', 'Fish and rice'], correctIndex: 1 },
      { question: 'How much does it cost?', options: ['100 rubles', '200 rubles', '300 rubles', '500 rubles'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-easy-3',
    title: 'The Weather',
    text: 'Сегодня хорошая погода. Тепло и солнечно. Мы идём в парк. Давай гулять!',
    difficulty: 'easy',
    questions: [
      { question: "How is today's weather?", options: ['Cold and rainy', 'Warm and sunny', 'Snowy', 'Windy'], correctIndex: 1 },
      { question: 'Where are they going?', options: ['To school', 'To a store', 'To the park', 'Home'], correctIndex: 2 },
    ],
  },
  {
    id: 'ru-easy-4',
    title: 'My Family',
    text: 'У меня большая семья. Мама, папа, брат и сестра. Брат учится в университете. Сестра ещё маленькая.',
    difficulty: 'easy',
    questions: [
      { question: "How is the speaker's family described?", options: ['Small', 'Big', 'Average', 'Tiny'], correctIndex: 1 },
      { question: 'Where does the brother study?', options: ['School', 'University', 'College', 'Abroad'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-easy-5',
    title: 'What Time Is It?',
    text: 'Который час? Сейчас два часа. Урок начинается в три часа. У нас ещё есть время.',
    difficulty: 'easy',
    questions: [
      { question: 'What time is it now?', options: ['1 o\'clock', '2 o\'clock', '3 o\'clock', '4 o\'clock'], correctIndex: 1 },
      { question: 'When does the lesson start?', options: ['2 o\'clock', '3 o\'clock', '4 o\'clock', '5 o\'clock'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-easy-6',
    title: 'In the Café',
    text: 'Можно чай, пожалуйста? С лимоном. И пирожок. Сколько? Сто пятьдесят рублей. Вот, пожалуйста.',
    difficulty: 'easy',
    questions: [
      { question: 'What drink does the speaker order?', options: ['Coffee', 'Tea', 'Juice', 'Water'], correctIndex: 1 },
      { question: 'What food does the speaker order?', options: ['Cake', 'A pie/pastry', 'Sandwich', 'Salad'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-easy-7',
    title: 'Asking for Directions',
    text: 'Извините, где метро? Идите прямо, потом направо. Это далеко? Нет, пять минут пешком.',
    difficulty: 'easy',
    questions: [
      { question: 'What is the speaker looking for?', options: ['A bus stop', 'The metro', 'A hospital', 'A store'], correctIndex: 1 },
      { question: 'How far is it?', options: ['2 minutes', '5 minutes', '10 minutes', '15 minutes'], correctIndex: 1 },
    ],
  },

  // ── Medium ────────────────────────────────────────────
  {
    id: 'ru-med-1',
    title: 'Daily Routine',
    text: 'Каждый день я встаю в семь утра. Сначала я принимаю душ, потом завтракаю. В восемь часов я еду на работу на автобусе. Работа начинается в девять. После работы я хожу в спортзал. Вечером я готовлю ужин и читаю книгу.',
    difficulty: 'medium',
    questions: [
      { question: 'What time does the speaker wake up?', options: ['6 AM', '7 AM', '8 AM', '9 AM'], correctIndex: 1 },
      { question: 'How does the speaker get to work?', options: ['By car', 'By metro', 'By bus', 'On foot'], correctIndex: 2 },
      { question: 'What does the speaker do after work?', options: ['Goes shopping', 'Goes to the gym', 'Watches TV', 'Meets friends'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-med-2',
    title: 'My Hobby',
    text: 'Моё хобби — фотография. Каждые выходные я хожу на прогулку с камерой. Мне нравится фотографировать природу и архитектуру. В прошлом месяце я ездил в Санкт-Петербург и сделал много красивых фотографий. Мои друзья говорят, что у меня талант.',
    difficulty: 'medium',
    questions: [
      { question: "What is the speaker's hobby?", options: ['Painting', 'Photography', 'Writing', 'Music'], correctIndex: 1 },
      { question: 'Where did the speaker travel last month?', options: ['Moscow', 'Saint Petersburg', 'Sochi', 'Kazan'], correctIndex: 1 },
      { question: 'What does the speaker like to photograph?', options: ['People and animals', 'Nature and architecture', 'Food and drinks', 'Cars and streets'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-med-3',
    title: 'At the Doctor',
    text: 'Доктор, у меня болит голова уже два дня. Ещё у меня насморк и кашель. Температура тридцать восемь. Вам нужно отдыхать и пить много воды. Вот рецепт на лекарство. Принимайте три раза в день после еды.',
    difficulty: 'medium',
    questions: [
      { question: 'How long has the speaker had a headache?', options: ['One day', 'Two days', 'Three days', 'A week'], correctIndex: 1 },
      { question: "What is the speaker's temperature?", options: ['36°', '37°', '38°', '39°'], correctIndex: 2 },
      { question: 'How often should the medicine be taken?', options: ['Once a day', 'Twice a day', 'Three times a day', 'Four times a day'], correctIndex: 2 },
    ],
  },
  {
    id: 'ru-med-4',
    title: 'Planning a Trip',
    text: 'Летом мы поедем на море. Мы забронировали отель на десять дней. Хотим ездить на экскурсии и пробовать местную еду. Мой муж хочет заниматься дайвингом. А я хочу просто лежать на пляже и читать книгу. Мы очень ждём этот отпуск.',
    difficulty: 'medium',
    questions: [
      { question: 'Where are they going?', options: ['Mountains', 'Forest', 'Sea', 'Lake'], correctIndex: 2 },
      { question: 'How long is the hotel booked for?', options: ['Five days', 'Seven days', 'Ten days', 'Two weeks'], correctIndex: 2 },
      { question: 'What does the husband want to do?', options: ['Surfing', 'Diving', 'Fishing', 'Swimming'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-med-5',
    title: 'My City',
    text: 'Я живу в Москве. Это очень большой и красивый город. В центре много старых зданий и музеев. Мне больше всего нравится Красная площадь. Транспорт здесь хороший — метро работает быстро. Но иногда бывают пробки на дорогах.',
    difficulty: 'medium',
    questions: [
      { question: 'Where does the speaker live?', options: ['Saint Petersburg', 'Moscow', 'Kazan', 'Novosibirsk'], correctIndex: 1 },
      { question: "What is the speaker's favorite place?", options: ['The Kremlin', 'Red Square', 'Gorky Park', 'Bolshoi Theatre'], correctIndex: 1 },
      { question: 'What problem is mentioned?', options: ['Expensive metro', 'Traffic jams', 'Cold weather', 'Crowded parks'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-med-6',
    title: 'Cooking Dinner',
    text: 'Сегодня я готовлю борщ. Мне нужны свёкла, капуста, картошка и морковь. Сначала я варю мясо, потом добавляю овощи. Борщ готовится два часа. Его едят со сметаной и чёрным хлебом. Это мой любимый суп.',
    difficulty: 'medium',
    questions: [
      { question: 'What is the speaker cooking?', options: ['Solyanka', 'Borscht', 'Shchi', 'Okroshka'], correctIndex: 1 },
      { question: 'How long does it take to cook?', options: ['30 minutes', '1 hour', '2 hours', '3 hours'], correctIndex: 2 },
      { question: 'What is it served with?', options: ['Butter and white bread', 'Sour cream and black bread', 'Cheese and crackers', 'Mayonnaise and toast'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-med-7',
    title: 'Weekend Plans',
    text: 'В субботу утром я пойду на рынок за продуктами. Днём мы с друзьями идём в кино. Вечером я хочу посидеть дома и посмотреть сериал. В воскресенье я планирую убрать квартиру и постирать одежду. Надеюсь, успею всё сделать.',
    difficulty: 'medium',
    questions: [
      { question: 'Where is the speaker going Saturday morning?', options: ['To the supermarket', 'To the market', 'To a café', 'To the gym'], correctIndex: 1 },
      { question: 'What will the speaker do with friends?', options: ['Go to a restaurant', 'Go to the cinema', 'Play sports', 'Have a barbecue'], correctIndex: 1 },
      { question: 'What is planned for Sunday?', options: ['Visiting family', 'Cleaning and laundry', 'Going to church', 'Studying'], correctIndex: 1 },
    ],
  },

  // ── Hard ───────────────────────────────────────────────
  {
    id: 'ru-hard-1',
    title: 'Education System',
    text: 'В России дети идут в школу в шесть или семь лет. Обучение длится одиннадцать лет. После школы многие поступают в университеты. Высшее образование занимает четыре-шесть лет. В последние годы онлайн-образование стало очень популярным. Многие университеты предлагают дистанционные программы.',
    difficulty: 'hard',
    questions: [
      { question: 'How long is school education in Russia?', options: ['9 years', '10 years', '11 years', '12 years'], correctIndex: 2 },
      { question: 'How long is higher education?', options: ['2-3 years', '3-4 years', '4-6 years', '5-7 years'], correctIndex: 2 },
      { question: 'What has become popular recently?', options: ['Private schools', 'Online education', 'Foreign universities', 'Vocational training'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-hard-2',
    title: 'Russian Literature',
    text: 'Русская литература известна во всём мире. Толстой и Достоевский — одни из самых великих писателей. Роман «Война и мир» рассказывает о событиях наполеоновских войн. Достоевский исследовал глубины человеческой психологии. Их произведения переведены на десятки языков и продолжают вдохновлять читателей по всему миру.',
    difficulty: 'hard',
    questions: [
      { question: 'Which authors are mentioned?', options: ['Pushkin and Chekhov', 'Tolstoy and Dostoevsky', 'Gogol and Turgenev', 'Bulgakov and Pasternak'], correctIndex: 1 },
      { question: 'What does "War and Peace" describe?', options: ['Russian Revolution', 'Napoleonic Wars', 'World War I', 'Crimean War'], correctIndex: 1 },
      { question: 'What did Dostoevsky explore?', options: ['Nature', 'Human psychology', 'Politics', 'History'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-hard-3',
    title: 'Environmental Problems',
    text: 'Экологические проблемы становятся всё более серьёзными. Загрязнение воздуха и воды влияет на здоровье людей. Вырубка лесов уничтожает экосистемы. Переработка отходов — один из способов помочь природе. Каждый человек может сделать свой вклад: экономить воду, сортировать мусор и использовать общественный транспорт.',
    difficulty: 'hard',
    questions: [
      { question: 'What environmental problems are mentioned?', options: ['Noise pollution', 'Air and water pollution', 'Light pollution', 'Soil erosion only'], correctIndex: 1 },
      { question: 'What is destroying ecosystems?', options: ['Mining', 'Deforestation', 'Urbanization', 'Fishing'], correctIndex: 1 },
      { question: 'What individual actions are suggested?', options: ['Buying less', 'Saving water, sorting waste, using public transport', 'Planting trees', 'Moving to the countryside'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-hard-4',
    title: 'Technology in Daily Life',
    text: 'Современные технологии изменили нашу жизнь. Мы пользуемся смартфонами каждый день. Социальные сети помогают общаться с друзьями. Онлайн-магазины позволяют покупать всё не выходя из дома. Однако есть и минусы: зависимость от гаджетов, проблемы со зрением и меньше живого общения. Важно находить баланс между цифровым и реальным миром.',
    difficulty: 'hard',
    questions: [
      { question: 'What helps people communicate with friends?', options: ['Phone calls', 'Social networks', 'Letters', 'Email'], correctIndex: 1 },
      { question: 'What downsides of technology are mentioned?', options: ['High cost and complexity', 'Gadget addiction, vision problems, less live communication', 'Unemployment', 'Privacy concerns'], correctIndex: 1 },
      { question: 'What is important according to the passage?', options: ['Using more technology', 'Finding balance between digital and real world', 'Avoiding technology completely', 'Buying newer gadgets'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-hard-5',
    title: 'A Childhood Memory',
    text: 'Когда я был маленьким, мы каждое лето ездили к бабушке в деревню. У неё был большой дом с садом. Бабушка пекла самые вкусные пирожки. Мы с братом бегали по полям и купались в реке. По вечерам бабушка рассказывала нам сказки. Эти воспоминания до сих пор согревают мне душу.',
    difficulty: 'hard',
    questions: [
      { question: 'Where did the speaker go every summer?', options: ["Grandfather's city apartment", "Grandmother's village", 'Summer camp', 'The seaside'], correctIndex: 1 },
      { question: 'What did the grandmother bake?', options: ['Cakes', 'Pies/pastries', 'Cookies', 'Bread'], correctIndex: 1 },
      { question: 'What did grandmother do in the evenings?', options: ['Watched TV', 'Knitted', 'Told fairy tales', 'Cooked dinner'], correctIndex: 2 },
    ],
  },
  {
    id: 'ru-hard-6',
    title: 'Space Exploration',
    text: 'Россия имеет богатую историю освоения космоса. В тысяча девятьсот шестьдесят первом году Юрий Гагарин стал первым человеком в космосе. Сегодня Россия продолжает отправлять космонавтов на Международную космическую станцию. Учёные работают над новыми проектами, включая планы по исследованию Луны и Марса. Космические технологии также используются в повседневной жизни.',
    difficulty: 'hard',
    questions: [
      { question: 'Who was the first person in space?', options: ['Leonov', 'Gagarin', 'Tereshkova', 'Korolev'], correctIndex: 1 },
      { question: 'Where does Russia send cosmonauts today?', options: ['The Moon', 'Mars', 'International Space Station', 'Venus'], correctIndex: 2 },
      { question: 'What future exploration plans are mentioned?', options: ['Jupiter and Saturn', 'Moon and Mars', 'Venus and Mercury', 'Asteroids and comets'], correctIndex: 1 },
    ],
  },
];
