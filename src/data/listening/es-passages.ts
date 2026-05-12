import type { ListeningPassage } from './ja-passages';

// Spanish listening passages (Latin American / neutral)
export const esPassages: ListeningPassage[] = [
  // --- Easy (7) ---
  {
    id: 'es-easy-1',
    title: 'Self Introduction',
    text: '¡Hola! Me llamo Sofía. Soy de Buenos Aires, Argentina. Tengo veintidós años. Estudio medicina en la universidad. Me gusta mucho leer y tomar mate con mis amigos.',
    difficulty: 'easy',
    questions: [
      { question: "What is the speaker's name?", options: ['Lucía', 'Sofía', 'Camila', 'Valentina'], correctIndex: 1 },
      { question: 'What does she study?', options: ['Law', 'Engineering', 'Medicine', 'Literature'], correctIndex: 2 },
    ],
  },
  {
    id: 'es-easy-2',
    title: 'At the Café',
    text: 'Buenos días. Quisiera un café con leche, por favor. Y también un pan dulce. ¿Cuánto cuesta todo? ¿Acepta tarjeta o solo efectivo?',
    difficulty: 'easy',
    questions: [
      { question: 'What does the speaker order to drink?', options: ['Black coffee', 'Coffee with milk', 'Tea', 'Hot chocolate'], correctIndex: 1 },
      { question: 'What does the speaker ask at the end?', options: ['Where the bathroom is', 'If they accept card or only cash', 'For the WiFi password', 'For more sugar'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-easy-3',
    title: 'Weekend Plans',
    text: 'Este fin de semana voy al cine con mi hermana. Vamos a ver una película de aventuras el sábado por la tarde. Después queremos cenar pizza en el centro.',
    difficulty: 'easy',
    questions: [
      { question: 'Who is going to the cinema with the speaker?', options: ['Her brother', 'Her sister', 'Her friend', 'Her mother'], correctIndex: 1 },
      { question: 'What will they eat afterwards?', options: ['Tacos', 'Pasta', 'Pizza', 'Empanadas'], correctIndex: 2 },
    ],
  },
  {
    id: 'es-easy-4',
    title: 'Weather and Plans',
    text: 'Hoy hace mucho frío en Santiago. Está lloviendo y hay viento. No voy a salir a correr. Prefiero quedarme en casa, leer un libro y tomar un chocolate caliente.',
    difficulty: 'easy',
    questions: [
      { question: 'How is the weather?', options: ['Sunny and hot', 'Cold and rainy', 'Snowy', 'Warm and humid'], correctIndex: 1 },
      { question: 'What will the speaker do?', options: ['Go running', 'Go to the park', 'Stay home and read', 'Visit a friend'], correctIndex: 2 },
    ],
  },
  {
    id: 'es-easy-5',
    title: 'Asking Directions',
    text: 'Disculpe, ¿dónde está la estación de metro? Camine dos cuadras por esta calle y doble a la izquierda. La estación está al lado de un parque grande.',
    difficulty: 'easy',
    questions: [
      { question: 'What is the speaker looking for?', options: ['A pharmacy', 'A metro station', 'A hotel', 'A restaurant'], correctIndex: 1 },
      { question: 'What is next to it?', options: ['A bank', 'A church', 'A large park', 'A school'], correctIndex: 2 },
    ],
  },
  {
    id: 'es-easy-6',
    title: 'My Family',
    text: 'Mi familia no es muy grande. Tengo un hermano y una hermana menor. Mi papá es ingeniero y mi mamá es maestra. Todos vivimos en una casa en Bogotá.',
    difficulty: 'easy',
    questions: [
      { question: 'How many siblings does the speaker have?', options: ['One', 'Two', 'Three', 'Four'], correctIndex: 1 },
      { question: "What is the father's profession?", options: ['Teacher', 'Doctor', 'Engineer', 'Lawyer'], correctIndex: 2 },
    ],
  },
  {
    id: 'es-easy-7',
    title: 'My Pet',
    text: 'Tengo un gato que se llama Pancho. Es blanco con manchas negras. Tiene tres años y le encanta dormir en el sofá. Por las tardes juego con él en el jardín.',
    difficulty: 'easy',
    questions: [
      { question: "What is the pet's name?", options: ['Pancho', 'Pepe', 'Lucas', 'Toby'], correctIndex: 0 },
      { question: 'What color is the cat?', options: ['Black', 'Gray', 'White with black spots', 'Orange'], correctIndex: 2 },
    ],
  },

  // --- Medium (7) ---
  {
    id: 'es-medium-1',
    title: 'Birthday Celebration',
    text: 'El sábado pasado celebramos el cumpleaños de mi abuela. Cumplió ochenta años. Toda la familia se reunió en su casa de Lima. Mi tía preparó un pastel de chocolate enorme y mi primo trajo flores. Cantamos las mañanitas y bailamos hasta la medianoche. Mi abuela estaba muy feliz porque vinieron también sus amigos del barrio. Fue una noche inolvidable y prometimos volver a reunirnos pronto.',
    difficulty: 'medium',
    questions: [
      { question: "Whose birthday was being celebrated?", options: ['The aunt', 'The cousin', 'The grandmother', 'The mother'], correctIndex: 2 },
      { question: 'What did the aunt prepare?', options: ['Flowers', 'A chocolate cake', 'Empanadas', 'A piñata'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-medium-2',
    title: 'At the Mercado',
    text: 'Los domingos voy al mercado con mi mamá en Oaxaca. Allí compramos frutas, verduras y queso fresco. A mi mamá le gusta hablar con los vendedores y siempre pide descuento. Yo prefiero el puesto de jugos naturales: pido uno de mango con naranja. A veces también comemos tamales calientes antes de regresar a casa. El mercado es ruidoso y colorido, pero me encanta el ambiente.',
    difficulty: 'medium',
    questions: [
      { question: 'When does the speaker go to the market?', options: ['Saturdays', 'Sundays', 'Every day', 'Fridays'], correctIndex: 1 },
      { question: 'What juice does the speaker order?', options: ['Orange only', 'Pineapple', 'Mango with orange', 'Watermelon'], correctIndex: 2 },
    ],
  },
  {
    id: 'es-medium-3',
    title: 'A Typical Weekday',
    text: 'De lunes a viernes me levanto a las seis y media. Desayuno café con tostadas y leo las noticias en mi teléfono. Después tomo el autobús al trabajo, que queda a treinta minutos del centro. Trabajo en una oficina de diseño hasta las cinco. Por la tarde, si no estoy muy cansada, voy al gimnasio o camino por el parque. Ceno temprano, veo una serie y me acuesto antes de las once.',
    difficulty: 'medium',
    questions: [
      { question: 'What does the speaker do for work?', options: ['Teaches at a school', 'Works at a design office', 'Drives a bus', 'Sells at the market'], correctIndex: 1 },
      { question: 'What does she do in the evening if not tired?', options: ['Goes shopping', 'Cooks dinner with friends', 'Goes to the gym or walks in the park', 'Studies for an exam'], correctIndex: 2 },
    ],
  },
  {
    id: 'es-medium-4',
    title: 'Día de los Muertos',
    text: 'En México, el Día de los Muertos se celebra el primero y dos de noviembre. Es una tradición muy antigua. Las familias preparan altares con fotos de sus seres queridos, flores de cempasúchil y comida favorita del difunto. También se ponen velas y calaveras de azúcar. En el cementerio, la gente lleva guitarras y canta canciones. No es una fiesta triste: es una manera alegre de recordar a quienes ya no están.',
    difficulty: 'medium',
    questions: [
      { question: 'When is the Day of the Dead celebrated?', options: ['October 31', 'November 1 and 2', 'December 1', 'November 20'], correctIndex: 1 },
      { question: 'What flower is mentioned?', options: ['Roses', 'Sunflowers', 'Marigold (cempasúchil)', 'Lilies'], correctIndex: 2 },
    ],
  },
  {
    id: 'es-medium-5',
    title: 'School Subjects',
    text: 'Este semestre tengo seis materias: matemáticas, historia, biología, inglés, literatura y educación física. Mi materia favorita es historia porque me gusta aprender sobre las civilizaciones antiguas. La que menos me gusta es matemáticas; siempre me cuesta hacer la tarea. Mi profesora de literatura es muy amable y nos hace leer cuentos cortos. Los viernes tenemos educación física en el patio: jugamos fútbol o vóleibol.',
    difficulty: 'medium',
    questions: [
      { question: "What is the speaker's favorite subject?", options: ['Math', 'Biology', 'History', 'English'], correctIndex: 2 },
      { question: 'What do they play in PE?', options: ['Basketball or tennis', 'Soccer or volleyball', 'Swimming', 'Running races'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-medium-6',
    title: 'Trip to Machu Picchu',
    text: 'El año pasado viajé a Machu Picchu con dos amigos. Salimos de Cusco muy temprano en tren. El paisaje era espectacular: montañas verdes, ríos y nubes bajas. Cuando llegamos al sitio arqueológico, un guía local nos explicó la historia de los incas. Caminamos durante varias horas y tomamos muchas fotos. Yo casi me caigo en una escalera resbalosa, pero un amigo me ayudó. Fue el viaje más impresionante de mi vida.',
    difficulty: 'medium',
    questions: [
      { question: 'How did they travel from Cusco?', options: ['By bus', 'By car', 'By train', 'On foot'], correctIndex: 2 },
      { question: 'What almost happened to the speaker?', options: ['She lost her camera', 'She nearly fell on a slippery staircase', 'She got lost', 'She missed the train'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-medium-7',
    title: 'Cooking Arroz con Pollo',
    text: 'Hoy voy a preparar arroz con pollo, una receta tradicional. Primero corto la cebolla, el ajo y el pimiento. Sofrío todo en aceite caliente. Después agrego trozos de pollo y los doro por unos minutos. Añado el arroz, un poco de azafrán, caldo y arvejas. Tapo la olla y cocino a fuego bajo durante veinte minutos. Al final adorno con perejil fresco. Es un plato sabroso y perfecto para compartir en familia.',
    difficulty: 'medium',
    questions: [
      { question: 'What is chopped first?', options: ['Tomatoes and potatoes', 'Onion, garlic, and bell pepper', 'Carrots and celery', 'Lettuce and cucumber'], correctIndex: 1 },
      { question: 'How long does it cook on low heat?', options: ['10 minutes', '15 minutes', '20 minutes', '30 minutes'], correctIndex: 2 },
    ],
  },

  // --- Hard (7) ---
  {
    id: 'es-hard-1',
    title: 'Opinion: The Environment',
    text: 'Cada vez es más evidente que el cambio climático no es una preocupación lejana, sino un problema urgente que afecta a todos. En las últimas décadas hemos visto sequías prolongadas, incendios forestales y huracanes más intensos. Aunque los gobiernos prometen reducir las emisiones, sus esfuerzos suelen ser insuficientes. Si queremos un futuro habitable, sería necesario que cada ciudadano modifique sus hábitos: usar menos plástico, consumir menos carne y preferir el transporte público. No basta con esperar que otros actúen; la responsabilidad es colectiva, pero también profundamente personal. Tal vez no podamos revertir todo el daño, pero aún estamos a tiempo de frenarlo si actuamos juntos y con sentido común.',
    difficulty: 'hard',
    questions: [
      { question: 'What is the main argument of the piece?', options: ['Climate change is exaggerated', 'Climate change is urgent and requires both collective and personal action', 'Only governments can fix the problem', 'Technology alone will solve it'], correctIndex: 1 },
      { question: 'Which habit is NOT mentioned as recommended?', options: ['Using less plastic', 'Eating less meat', 'Recycling electronics', 'Preferring public transport'], correctIndex: 2 },
    ],
  },
  {
    id: 'es-hard-2',
    title: 'Tech in Latin America',
    text: 'En los últimos años, América Latina se ha convertido en un terreno fértil para el desarrollo tecnológico. Países como México, Brasil, Colombia y Argentina concentran la mayor parte de las llamadas "empresas unicornio" de la región, valuadas en más de mil millones de dólares. Las fintech, en particular, han crecido de manera notable, ofreciendo servicios bancarios a millones de personas que antes no tenían acceso al sistema financiero. Sin embargo, persisten desafíos importantes: brecha digital en zonas rurales, regulaciones poco claras y fuga de talento hacia Estados Unidos y Europa. Los expertos sostienen que, si la región logra invertir en educación y conectividad, podría liderar una nueva ola de innovación global durante la próxima década.',
    difficulty: 'hard',
    questions: [
      { question: 'What sector has grown notably according to the passage?', options: ['Mining', 'Fintech', 'Agriculture', 'Tourism'], correctIndex: 1 },
      { question: 'Which is mentioned as a challenge?', options: ['Lack of internet servers', 'Digital gap in rural areas and talent leaving abroad', 'Too many banks', 'Currency instability'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-hard-3',
    title: 'The Spirit of Tango',
    text: 'El tango nació a finales del siglo diecinueve en los barrios humildes de Buenos Aires y Montevideo. Era la música de los inmigrantes europeos, de los marineros y de los trabajadores que buscaban consuelo en cantinas y patios. Al principio fue mal visto por la sociedad, considerado vulgar y peligroso. Solo cuando triunfó en los salones de París, a comienzos del siglo veinte, los argentinos lo aceptaron como símbolo nacional. Hoy el tango se baila en milongas de todo el mundo, pero conserva su esencia melancólica: hablar del amor perdido, de la nostalgia y del paso del tiempo. Bailarlo bien requiere años de práctica y, sobre todo, sentir cada compás como si fuera una conversación silenciosa entre dos personas.',
    difficulty: 'hard',
    questions: [
      { question: 'Where did tango originate?', options: ['Madrid and Lisbon', 'Havana and San Juan', 'Buenos Aires and Montevideo', 'Mexico City and Lima'], correctIndex: 2 },
      { question: 'When did Argentine society accept tango as a national symbol?', options: ['After it succeeded in Paris', 'After a government decree', 'Immediately at its birth', 'After it was banned'], correctIndex: 0 },
    ],
  },
  {
    id: 'es-hard-4',
    title: 'La Llorona (Legend)',
    text: 'Dicen los abuelos que hace muchos años, cerca de un río, vivía una mujer hermosa llamada María. Se enamoró de un hombre rico que no quería casarse con ella porque ya tenía hijos. Cegada por la rabia y el dolor, María hizo algo terrible: ahogó a sus propios niños en el río. Cuando comprendió lo que había hecho, lloró tanto que murió a la orilla del agua. Desde entonces, su alma vaga en las noches buscando a sus hijos perdidos. Si alguien camina solo cerca de un río oscuro, podría escuchar un lamento lejano: "¡Ay, mis hijos!". Los padres usan esta leyenda para advertir a los niños que no se acerquen al agua después del anochecer. Aunque sea solo una historia, todavía hace temblar a quien la escucha por primera vez.',
    difficulty: 'hard',
    questions: [
      { question: 'Why did the rich man refuse to marry María?', options: ['He was poor', 'He already had children', 'He lived far away', 'He was already married'], correctIndex: 1 },
      { question: 'Why do parents tell this legend to children?', options: ['To teach them to swim', 'To warn them not to go near the water after dark', 'To celebrate a holiday', 'To explain the weather'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-hard-5',
    title: 'Job Interview',
    text: 'Buenos días, gracias por venir. Su currículum nos pareció muy interesante, sobre todo su experiencia previa en marketing digital. Cuéntenos un poco más sobre el proyecto que lideró el año pasado. ¿Cuál fue el mayor desafío y cómo lo resolvió? Aquí buscamos a alguien que sea proactivo, que sepa trabajar bajo presión y que esté dispuesto a aprender constantemente. El puesto ofrece horario flexible y la posibilidad de trabajar desde casa dos días a la semana. Si todo va bien en esta entrevista, le pediríamos una prueba técnica antes de tomar la decisión final. ¿Tiene usted alguna pregunta sobre la empresa, el equipo o las condiciones del contrato? Estaremos encantados de aclarar cualquier duda.',
    difficulty: 'hard',
    questions: [
      { question: 'What experience interested the interviewer most?', options: ['Sales', 'Digital marketing', 'Customer service', 'Accounting'], correctIndex: 1 },
      { question: 'What benefit is mentioned about the position?', options: ['Free lunch and parking', 'Flexible hours and two days remote per week', 'Annual bonus', 'Company car'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-hard-6',
    title: 'Editorial: Reading in Schools',
    text: 'En una época dominada por las pantallas, defender la lectura en la escuela puede parecer una causa perdida. Sin embargo, ningún video corto, por entretenido que sea, ofrece lo que un buen libro: la oportunidad de habitar otra mente, otra época, otra ciudad. Quien lee con frecuencia desarrolla no solo vocabulario y comprensión, sino también empatía y paciencia, virtudes cada vez más escasas. Sería un error pensar que los jóvenes ya no leen; leen distinto, fragmentado, distraído. La tarea del docente no consiste en prohibir las redes, sino en proponer textos que dialoguen con sus inquietudes. Tal vez un cuento de Cortázar o una novela gráfica latinoamericana sirvan mejor que un clásico impuesto. Si la escuela renuncia a formar lectores, renuncia también a formar ciudadanos capaces de pensar por sí mismos.',
    difficulty: 'hard',
    questions: [
      { question: 'What is the main thesis of the editorial?', options: ['Screens should be banned in schools', 'Reading remains essential and schools must adapt how they teach it', 'Classical literature is the only valid reading', 'Young people no longer read at all'], correctIndex: 1 },
      { question: 'According to the author, what should teachers do?', options: ['Forbid social media', 'Propose texts that connect with students’ interests', 'Replace books with videos', 'Only teach classics'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-hard-7',
    title: 'On Learning a Language',
    text: 'Aprender un idioma extranjero es mucho más que memorizar palabras o conjugar verbos. Es atreverse a sonar ridículo, equivocarse en público y aceptar que, durante meses, uno será una versión más torpe de sí mismo. Recuerdo cuando empecé con el español: confundía "embarazada" con "avergonzada" y provocaba carcajadas sin querer. Pero precisamente esos errores fueron los que más me enseñaron. Si yo no hubiera perdido el miedo a hablar, probablemente seguiría estancado en el nivel principiante. Hoy puedo leer novelas, ver películas sin subtítulos y discutir de política con amigos en Madrid. Lo curioso es que, cuanto más avanzo, más consciente soy de lo que aún me falta. Quizá esa sea la lección verdadera: aprender un idioma no termina nunca, y precisamente por eso vale tanto la pena.',
    difficulty: 'hard',
    questions: [
      { question: "What does the speaker say was crucial to their progress?", options: ['Memorizing grammar rules', 'Losing the fear of speaking and making mistakes', 'Living abroad for a year', 'Hiring a private tutor'], correctIndex: 1 },
      { question: "What is the speaker's conclusion?", options: ['Learning a language is quick if you have talent', 'Learning a language never truly ends, which is why it is worthwhile', 'Only children can learn languages well', 'Reading novels is the only effective method'], correctIndex: 1 },
    ],
  },
];
