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
  {
    id: 'ru-easy-8',
    title: 'Ordering at a Café',
    text: 'Здравствуйте! Мне, пожалуйста, чай с лимоном и кусочек торта. Сколько стоит? Триста рублей. Вот, пожалуйста.',
    difficulty: 'easy',
    questions: [
      { question: 'What did they order?', options: ['Coffee and a cookie', 'Tea and a piece of cake', 'Juice and a sandwich', 'Water and a pastry'], correctIndex: 1 },
      { question: 'How much did it cost?', options: ['200 rubles', '250 rubles', '300 rubles', '350 rubles'], correctIndex: 2 },
    ],
  },
  {
    id: 'ru-easy-9',
    title: 'Asking for Directions',
    text: 'Извините, вы не знаете, где станция метро? Идите прямо, потом поверните налево. Там будет станция метро. Спасибо большое!',
    difficulty: 'easy',
    questions: [
      { question: 'What are they looking for?', options: ['A bus stop', 'A metro station', 'A train station', 'A taxi stand'], correctIndex: 1 },
      { question: 'Where should they turn?', options: ['Right', 'Left', 'Go straight only', 'Turn around'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-easy-10',
    title: 'Buying a Metro Ticket',
    text: 'Мне два билета на метро, пожалуйста. Один билет стоит шестьдесят рублей. Два билета — сто двадцать рублей. Вот ваши билеты.',
    difficulty: 'easy',
    questions: [
      { question: 'How many tickets did they buy?', options: ['1', '2', '3', '4'], correctIndex: 1 },
      { question: 'How much do the tickets cost in total?', options: ['60 rubles', '100 rubles', '120 rubles', '150 rubles'], correctIndex: 2 },
    ],
  },
  {
    id: 'ru-easy-11',
    title: 'Making a Phone Call',
    text: 'Алло, привет! Давай встретимся сегодня. Во сколько? В пять часов. Где? У кинотеатра. Хорошо, договорились!',
    difficulty: 'easy',
    questions: [
      { question: 'When will they meet?', options: ['At 3 o\'clock', 'At 4 o\'clock', 'At 5 o\'clock', 'At 6 o\'clock'], correctIndex: 2 },
      { question: 'Where will they meet?', options: ['At the park', 'At the café', 'At the cinema', 'At the station'], correctIndex: 2 },
    ],
  },
  {
    id: 'ru-easy-12',
    title: 'Introducing a Friend',
    text: 'Познакомьтесь, это мой друг Дмитрий. Он работает программистом. Мы учились вместе в университете. Приятно познакомиться!',
    difficulty: 'easy',
    questions: [
      { question: 'What is the friend\'s name?', options: ['Andrei', 'Dmitry', 'Sergei', 'Ivan'], correctIndex: 1 },
      { question: 'What does the friend do?', options: ['Teacher', 'Doctor', 'Programmer', 'Engineer'], correctIndex: 2 },
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
  {
    id: 'ru-med-8',
    title: 'At the Doctor\'s Office',
    text: 'Доктор, я плохо себя чувствую. У меня сильная боль в животе с самого утра. Вчера вечером я съел что-то несвежее. Температура нормальная, но меня тошнит. Я рекомендую вам пить больше воды и принять это лекарство.',
    difficulty: 'medium',
    questions: [
      { question: 'What is wrong with the patient?', options: ['Headache', 'Stomach pain', 'Sore throat', 'Back pain'], correctIndex: 1 },
      { question: 'What does the doctor recommend?', options: ['Rest at home for a week', 'Drink more water and take medicine', 'Go to the hospital immediately', 'Stop eating for a day'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-med-9',
    title: 'Booking a Hotel Room',
    text: 'Здравствуйте, я хотел бы забронировать номер в вашей гостинице. На сколько ночей? На три ночи, с пятницы по понедельник. Вам нужен одноместный или двухместный? Одноместный, пожалуйста. Стоимость — две с половиной тысячи рублей за ночь.',
    difficulty: 'medium',
    questions: [
      { question: 'For how many nights is the reservation?', options: ['2 nights', '3 nights', '5 nights', '7 nights'], correctIndex: 1 },
      { question: 'What type of room do they want?', options: ['Double', 'Single', 'Suite', 'Family room'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-med-10',
    title: 'Job Interview',
    text: 'Расскажите о себе. Я закончил университет три года назад и работал бухгалтером в небольшой фирме. Сейчас я ищу работу в крупной компании. Почему вы хотите работать у нас? Мне нравится ваша команда, и я хочу развиваться в области финансов.',
    difficulty: 'medium',
    questions: [
      { question: 'What position did the candidate previously hold?', options: ['Manager', 'Programmer', 'Accountant', 'Designer'], correctIndex: 2 },
      { question: 'How much work experience does the candidate have?', options: ['1 year', '2 years', '3 years', '5 years'], correctIndex: 2 },
    ],
  },
  {
    id: 'ru-med-11',
    title: 'Planning the Weekend',
    text: 'Что будем делать в субботу? Давай пойдём в музей, там открылась новая выставка. Отличная идея! А во сколько встретимся? Давай в двенадцать часов у входа. После музея можем пообедать в кафе рядом.',
    difficulty: 'medium',
    questions: [
      { question: 'What do they plan to do?', options: ['Go to the cinema', 'Go to a museum', 'Visit friends', 'Go shopping'], correctIndex: 1 },
      { question: 'When will they meet?', options: ['At 10 AM', 'At 11 AM', 'At noon', 'At 1 PM'], correctIndex: 2 },
    ],
  },
  {
    id: 'ru-med-12',
    title: 'At the Supermarket',
    text: 'Нам нужно купить продукты на неделю. Возьмём молоко, хлеб, курицу и овощи. Ещё нужен рис и масло. Сколько всё стоит? Итого тысяча восемьсот рублей. Можно оплатить картой?',
    difficulty: 'medium',
    questions: [
      { question: 'What are they buying?', options: ['Snacks for a party', 'Groceries for the week', 'Ingredients for one dinner', 'Food for a picnic'], correctIndex: 1 },
      { question: 'How much does it cost in total?', options: ['1,500 rubles', '1,800 rubles', '2,000 rubles', '2,500 rubles'], correctIndex: 1 },
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
  {
    id: 'ru-hard-7',
    title: 'A News Report',
    text: 'В Москве в эту субботу состоится ежегодный фестиваль «Городские огни». Мероприятие пройдёт на Тверской улице с шести часов вечера до полуночи. Организаторы обещают живую музыку, театральные представления и гастрономическую ярмарку. Ожидается, что фестиваль посетят более пятидесяти тысяч человек. Вход на все площадки бесплатный.',
    difficulty: 'hard',
    questions: [
      { question: 'What is the event?', options: ['A sports tournament', 'A city lights festival', 'A political rally', 'A trade fair'], correctIndex: 1 },
      { question: 'When does it take place?', options: ['Friday morning', 'Saturday evening to midnight', 'Sunday afternoon', 'All weekend'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-hard-8',
    title: 'A Book Discussion',
    text: 'Ты уже прочитал «Мастера и Маргариту» Булгакова? Да, закончил на прошлой неделе. По-моему, это гениальный роман. Особенно мне понравились главы про Воланда и его свиту. А мне показалось, что сюжет слишком сложный — слишком много переплетающихся линий и скрытых смыслов.',
    difficulty: 'hard',
    questions: [
      { question: 'What book are they discussing?', options: ['War and Peace', 'The Master and Margarita', 'Crime and Punishment', 'Anna Karenina'], correctIndex: 1 },
      { question: 'What does one person think about the book?', options: ['It is boring', 'The plot is too complex', 'It is too short', 'The characters are weak'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-hard-9',
    title: 'Environmental Concerns',
    text: 'Одной из главных экологических проблем в России является загрязнение озера Байкал. Промышленные предприятия, расположенные поблизости, десятилетиями сбрасывали отходы в озеро. Экологи предлагают ужесточить законодательство и обязать заводы устанавливать современные очистные фильтры. Кроме того, необходимо развивать экологический туризм, приносящий доход местным жителям без вреда для природы.',
    difficulty: 'hard',
    questions: [
      { question: 'What environmental issue is discussed?', options: ['Air pollution in Moscow', 'Pollution of Lake Baikal', 'Deforestation in Siberia', 'Oil spills in the Arctic'], correctIndex: 1 },
      { question: 'What solution is proposed?', options: ['Close all factories', 'Stricter legislation and modern filters', 'Relocate local residents', 'Ban all tourism'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-hard-10',
    title: 'Tech Support Call',
    text: 'Добрый день, техническая поддержка. Чем могу помочь? У меня не работает интернет с самого утра. Роутер включён, но индикатор мигает красным. Попробуйте, пожалуйста, отключить роутер от сети на тридцать секунд, а затем включить снова. Если это не поможет, мы отправим к вам специалиста завтра в первой половине дня.',
    difficulty: 'hard',
    questions: [
      { question: 'What is the problem?', options: ['TV is not working', 'Internet is not working', 'Phone has no signal', 'Computer crashed'], correctIndex: 1 },
      { question: 'What should the user try first?', options: ['Call back later', 'Restart the router', 'Buy a new router', 'Check the cables'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-hard-11',
    title: 'Business Meeting',
    text: 'Коллеги, давайте обсудим статус проекта по разработке нового мобильного приложения. На данный момент мы завершили дизайн интерфейса и начали программирование. Срок сдачи проекта — первое марта. Однако, учитывая задержки с тестированием, нам, возможно, придётся перенести дедлайн на две недели. Предлагаю назначить дополнительных тестировщиков.',
    difficulty: 'hard',
    questions: [
      { question: 'What is the project about?', options: ['A website redesign', 'A mobile app development', 'A marketing campaign', 'A database migration'], correctIndex: 1 },
      { question: 'When is the original deadline?', options: ['February 1', 'March 1', 'April 1', 'May 1'], correctIndex: 1 },
    ],
  },

  // ── Dialogues — Easy ───────────────────────────────────
  {
    id: 'ru-dlg-easy-1',
    title: 'At the Bakery',
    text: '— Здравствуйте! Дайте, пожалуйста, два батона и булочку.\n— Пожалуйста. Ещё что-нибудь?\n— Нет, спасибо. Сколько стоит?\n— Сто двадцать рублей.\n— Вот, пожалуйста.\n— Спасибо, до свидания!',
    difficulty: 'easy',
    questions: [
      { question: 'What does the customer buy?', options: ['A loaf and a cake', 'Two loaves and a bun', 'Bread and butter', 'Three buns'], correctIndex: 1 },
      { question: 'How much does it cost?', options: ['100 rubles', '120 rubles', '150 rubles', '200 rubles'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-dlg-easy-2',
    title: 'Meeting a Friend',
    text: '— Привет, Маша! Как дела?\n— Привет! Хорошо, спасибо. А у тебя?\n— Тоже хорошо. Куда идёшь?\n— В библиотеку. Мне нужно вернуть книгу.\n— Понятно. Увидимся позже!\n— Пока!',
    difficulty: 'easy',
    questions: [
      { question: 'Where is Masha going?', options: ['To the store', 'To the library', 'To a café', 'Home'], correctIndex: 1 },
      { question: 'Why is she going there?', options: ['To study', 'To return a book', 'To meet a friend', 'To borrow a book'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-dlg-easy-3',
    title: 'Ordering Tea',
    text: '— Можно чай, пожалуйста?\n— Чёрный или зелёный?\n— Зелёный. С лимоном.\n— Конечно. Сахар нужен?\n— Нет, без сахара, спасибо.\n— Пожалуйста, ваш чай.',
    difficulty: 'easy',
    questions: [
      { question: 'What kind of tea does the person order?', options: ['Black with sugar', 'Green with lemon', 'Black with lemon', 'Green with honey'], correctIndex: 1 },
      { question: 'Does the person want sugar?', options: ['Yes, one spoon', 'Yes, two spoons', 'No', 'They did not say'], correctIndex: 2 },
    ],
  },
  {
    id: 'ru-dlg-easy-4',
    title: 'What Time Is It?',
    text: '— Извините, вы не подскажете, который час?\n— Сейчас три часа.\n— Спасибо! А когда закрывается магазин?\n— В шесть вечера.\n— Хорошо, значит, я успею. Спасибо!',
    difficulty: 'easy',
    questions: [
      { question: 'What time is it now?', options: ['1 o\'clock', '2 o\'clock', '3 o\'clock', '5 o\'clock'], correctIndex: 2 },
      { question: 'When does the store close?', options: ['At 5 pm', 'At 6 pm', 'At 7 pm', 'At 8 pm'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-dlg-easy-5',
    title: 'Bus Stop',
    text: '— Скажите, этот автобус идёт до центра?\n— Нет, вам нужен автобус номер пять.\n— А где остановка?\n— Через дорогу, напротив аптеки.\n— Спасибо большое!\n— Не за что!',
    difficulty: 'easy',
    questions: [
      { question: 'Does this bus go to the center?', options: ['Yes, it does', 'No, you need bus number 5', 'No, you need bus number 3', 'Yes, but only on weekdays'], correctIndex: 1 },
      { question: 'Where is the correct bus stop?', options: ['Next to the bank', 'Across the road, opposite the pharmacy', 'Around the corner', 'At the train station'], correctIndex: 1 },
    ],
  },

  // ── Dialogues — Medium ─────────────────────────────────
  {
    id: 'ru-dlg-med-1',
    title: 'At a Hotel',
    text: '— Добрый день! Я бы хотел забронировать номер.\n— Здравствуйте! На какие даты?\n— С двадцатого по двадцать пятое июля. На пять ночей.\n— Вам одноместный или двухместный номер?\n— Двухместный, пожалуйста. С видом на море, если можно.\n— Есть номер на третьем этаже. Стоимость — четыре тысячи рублей за ночь. Завтрак включён.\n— Отлично, я возьму.',
    difficulty: 'medium',
    questions: [
      { question: 'How many nights is the reservation for?', options: ['3 nights', '4 nights', '5 nights', '7 nights'], correctIndex: 2 },
      { question: 'What kind of room does the guest want?', options: ['Single with city view', 'Double with sea view', 'Single with sea view', 'Double with city view'], correctIndex: 1 },
      { question: 'Is breakfast included?', options: ['No, it costs extra', 'Yes, it is included', 'Only on weekends', 'It is not mentioned'], correctIndex: 1 },
    ],
  },
  {
    id: 'ru-dlg-med-2',
    title: 'At the Doctor',
    text: '— Здравствуйте, доктор.\n— Здравствуйте. Что вас беспокоит?\n— У меня болит горло и температура. Кашель тоже есть.\n— Когда это началось?\n— Три дня назад. Сначала просто горло болело, а вчера поднялась температура.\n— Давайте посмотрим. Откройте рот, скажите «а». Да, горло красное. Я выпишу вам лекарство. Принимайте три раза в день после еды.\n— Спасибо, доктор. А на работу можно ходить?\n— Лучше отдохните дома два-три дня.',
    difficulty: 'medium',
    questions: [
      { question: 'What are the patient\'s symptoms?', options: ['Headache and nausea', 'Sore throat, fever, and cough', 'Back pain and dizziness', 'Stomachache and weakness'], correctIndex: 1 },
      { question: 'When did the symptoms start?', options: ['Yesterday', '3 days ago', 'A week ago', '5 days ago'], correctIndex: 1 },
      { question: 'How often should the patient take the medicine?', options: ['Once a day before bed', 'Twice a day before meals', 'Three times a day after meals', 'Four times a day with water'], correctIndex: 2 },
    ],
  },
  {
    id: 'ru-dlg-med-3',
    title: 'Buying Train Tickets',
    text: '— Мне, пожалуйста, два билета до Санкт-Петербурга.\n— На какой поезд? Есть утренний в девять тридцать и вечерний в двадцать два ноль-ноль.\n— На утренний, пожалуйста. Купе или плацкарт — что дешевле?\n— Плацкарт дешевле. Два билета в плацкарт — три тысячи двести рублей.\n— Хорошо, давайте плацкарт. Можно оплатить картой?\n— Да, конечно. Вот ваши билеты. Поезд отправляется с третьей платформы.',
    difficulty: 'medium',
    questions: [
      { question: 'Where are the travelers going?', options: ['Moscow', 'St. Petersburg', 'Kazan', 'Novosibirsk'], correctIndex: 1 },
      { question: 'Which train do they choose?', options: ['Evening at 22:00', 'Morning at 9:30', 'Afternoon at 14:00', 'Night at 1:00'], correctIndex: 1 },
      { question: 'Which platform does the train depart from?', options: ['First', 'Second', 'Third', 'Fifth'], correctIndex: 2 },
    ],
  },
  {
    id: 'ru-dlg-med-4',
    title: 'Phone Call About a Job',
    text: '— Алло, здравствуйте! Я звоню по объявлению о вакансии менеджера.\n— Здравствуйте! Да, вакансия ещё актуальна. У вас есть опыт работы?\n— Да, я работал менеджером три года в компании «Вектор».\n— Хорошо. Вы можете прийти на собеседование в среду в десять утра?\n— Да, конечно. А какой адрес?\n— Улица Ленина, дом пятнадцать, офис триста два. Третий этаж.\n— Спасибо, я буду. До свидания!',
    difficulty: 'medium',
    questions: [
      { question: 'What position is the caller applying for?', options: ['Accountant', 'Manager', 'Developer', 'Designer'], correctIndex: 1 },
      { question: 'How many years of experience does the caller have?', options: ['1 year', '2 years', '3 years', '5 years'], correctIndex: 2 },
      { question: 'When is the interview?', options: ['Monday at 9 am', 'Tuesday at 11 am', 'Wednesday at 10 am', 'Thursday at 2 pm'], correctIndex: 2 },
    ],
  },
  {
    id: 'ru-dlg-med-5',
    title: 'At the Restaurant',
    text: '— Добрый вечер! Столик на двоих, пожалуйста.\n— Конечно, прошу вас. Вот меню.\n— Спасибо. Что вы порекомендуете?\n— Сегодня очень вкусный борщ. И котлеты по-киевски — наше фирменное блюдо.\n— Тогда мне борщ и котлету. А тебе?\n— А мне салат «Цезарь» и рыбу на гриле, пожалуйста.\n— Что будете пить?\n— Два стакана сока, пожалуйста. Апельсиновый.\n— Хорошо, заказ принят. Минут двадцать подождите.',
    difficulty: 'medium',
    questions: [
      { question: 'How many people are dining?', options: ['1', '2', '3', '4'], correctIndex: 1 },
      { question: 'What does the first person order for food?', options: ['Salad and fish', 'Borscht and chicken Kiev', 'Steak and potatoes', 'Soup and pasta'], correctIndex: 1 },
      { question: 'What do they order to drink?', options: ['Two cups of coffee', 'Two glasses of orange juice', 'A bottle of water', 'Tea and lemonade'], correctIndex: 1 },
    ],
  },
];
