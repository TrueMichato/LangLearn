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
  // --- Easy (v2 additions) ---
  {
    id: 'es-easy-8',
    title: 'At the Pharmacy in Bogotá',
    text: 'Buenos días. Tengo gripa y necesito algo para la tos y el dolor de cabeza. ¿Tiene fiebre? Sí, un poco, treinta y ocho grados. Le recomiendo este jarabe para la tos y estas pastillas para el dolor. Tome una pastilla cada ocho horas con comida. ¿Cuánto cuesta todo? Veinticinco mil pesos. Aquí tiene. Muchas gracias, que se mejore pronto.',
    difficulty: 'easy',
    questions: [
      { question: 'Why does the customer go to the pharmacy?', options: ['To buy vitamins', 'They have a cold and headache', 'To pick up a prescription for a friend', 'To buy bandages'], correctIndex: 1 },
      { question: 'How often should the pills be taken?', options: ['Every four hours', 'Every six hours', 'Every eight hours with food', 'Once a day before sleep'], correctIndex: 2 },
    ],
  },
  {
    id: 'es-easy-9',
    title: 'A Phone Call to a Friend',
    text: '¿Aló, Marta? Hola, soy Diego. ¿Quieres ir al cine esta noche? Hay una película nueva a las ocho. Sí, me encantaría. ¿Dónde nos vemos? En la entrada del centro comercial, a las siete y media. Perfecto, así tomamos un café antes. Después de la película podemos cenar pizza. Buena idea. Nos vemos luego, ¡hasta pronto!',
    difficulty: 'easy',
    questions: [
      { question: 'What does Diego invite Marta to do?', options: ['Go to a concert', 'Go to the cinema tonight', 'Have dinner at his house', 'Go shopping'], correctIndex: 1 },
      { question: 'Where will they meet?', options: ['At the cinema box office', 'At the entrance of the shopping mall', 'At a café downtown', "At Marta's house"], correctIndex: 1 },
    ],
  },
  {
    id: 'es-easy-10',
    title: 'My House in Buenos Aires',
    text: 'Vivo en un departamento en el barrio de Palermo, en Buenos Aires. Es pequeño pero muy cómodo. Tiene dos habitaciones, una cocina, un baño y un balcón con plantas. Desde el balcón veo la calle y los árboles. Mi barrio es tranquilo y tiene muchos cafés y librerías. Me gusta caminar por la plaza los fines de semana.',
    difficulty: 'easy',
    questions: [
      { question: 'In which neighborhood does the speaker live?', options: ['Recoleta', 'Palermo', 'San Telmo', 'Belgrano'], correctIndex: 1 },
      { question: 'What does the speaker like to do on weekends?', options: ['Cook at home', 'Walk in the plaza', 'Visit the cinema', 'Take the bus to the center'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-easy-11',
    title: 'My Favorite Hobby',
    text: 'Mi pasatiempo favorito es la pintura. Cada sábado por la tarde voy a una clase pequeña cerca de mi casa. Pinto paisajes y retratos con acuarela. Cuando pinto, me siento tranquila y feliz. También me gusta visitar museos para ver obras de artistas famosos. Algún día quiero hacer una exposición con mis cuadros.',
    difficulty: 'easy',
    questions: [
      { question: 'What is the speaker’s favorite hobby?', options: ['Dancing', 'Painting', 'Playing soccer', 'Photography'], correctIndex: 1 },
      { question: 'What does the speaker hope to do one day?', options: ['Teach a painting class', 'Have an exhibition of her paintings', 'Travel to Paris', 'Sell her paintings online'], correctIndex: 1 },
    ],
  },
  // --- Medium (v2 additions) ---
  {
    id: 'es-medium-8',
    title: 'A Trip to the Andes',
    text: 'El año pasado viajé con mi hermano a los Andes peruanos. Salimos desde Cusco temprano por la mañana en un autobús que subía por carreteras de montaña muy estrechas. Después de cuatro horas llegamos a un pueblo pequeño donde una familia local nos ofreció una sopa caliente de quinoa. La altura me afectó al principio: tenía dolor de cabeza y respiraba con dificultad, pero me adapté en un par de días. Caminamos por senderos antiguos hasta unas ruinas incas casi vacías de turistas. Nunca olvidaré el silencio del valle ni la amabilidad de la gente que conocimos en el camino.',
    difficulty: 'medium',
    questions: [
      { question: 'How did the speaker feel when they first arrived at altitude?', options: ['Energetic and happy', 'They had a headache and difficulty breathing', 'Cold but otherwise fine', 'Hungry but healthy'], correctIndex: 1 },
      { question: 'What did the local family offer them?', options: ['A guided tour', 'A hot quinoa soup', 'A place to sleep', 'Coca tea'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-medium-9',
    title: 'How to Make Empanadas',
    text: 'Las empanadas son uno de los platos más queridos de Argentina. Para prepararlas en casa, primero hay que hacer el relleno. Yo siempre uso carne picada, cebolla, pimiento y un poco de comino. Cocino todo en una sartén durante quince minutos y dejo que se enfríe. Mientras tanto, estiro la masa con un rodillo y corto círculos. Pongo una cucharada de relleno en cada círculo, doblo la masa y cierro los bordes con el famoso "repulgue". Por último, las pinto con huevo batido y las horneo a doscientos grados durante veinte minutos. Cuando están doradas, las sirvo con una copa de vino tinto. ¡Quedan deliciosas y son ideales para compartir!',
    difficulty: 'medium',
    questions: [
      { question: 'What is the first step in the recipe?', options: ['Rolling out the dough', 'Preparing the filling', 'Beating the egg', 'Cutting the circles'], correctIndex: 1 },
      { question: 'At what temperature are the empanadas baked?', options: ['One hundred fifty degrees', 'One hundred eighty degrees', 'Two hundred degrees', 'Two hundred fifty degrees'], correctIndex: 2 },
    ],
  },
  {
    id: 'es-medium-10',
    title: 'Las Posadas in Mexico',
    text: 'En México, la Navidad empieza antes del veinticinco de diciembre con una tradición llamada las Posadas. Durante nueve noches, del dieciséis al veinticuatro, los vecinos se reúnen para representar el viaje de María y José buscando alojamiento en Belén. Un grupo camina por la calle con velas y cantan pidiendo posada, mientras otro grupo, dentro de la casa, responde cantando que no hay lugar. Al final, las puertas se abren y todos entran a celebrar. Cuando era niña, mi abuela siempre preparaba ponche caliente con frutas y tamales para los invitados. Después rompíamos una piñata con forma de estrella y los niños recogíamos dulces del suelo entre risas. Era una de las épocas más alegres del año.',
    difficulty: 'medium',
    questions: [
      { question: 'How many nights do the Posadas last?', options: ['Seven nights', 'Nine nights', 'Twelve nights', 'Three nights'], correctIndex: 1 },
      { question: 'What does the speaker remember her grandmother preparing?', options: ['Hot chocolate and bread', 'Hot fruit punch and tamales', 'Roast turkey', 'Coffee and cookies'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-medium-11',
    title: 'My Best Friend and Why',
    text: 'Mi mejor amiga se llama Lucía y la conozco desde el colegio. Nos sentamos juntas en clase de matemáticas cuando teníamos doce años y desde entonces somos inseparables. Lo que más me gusta de ella es que siempre escucha sin juzgar. Cuando tuve una época difícil después de mudarme de ciudad, me llamaba todas las noches para preguntarme cómo estaba. También es muy divertida: nadie cuenta historias como ella. Aunque ahora vivimos en países distintos, intentamos vernos por lo menos una vez al año. La amistad verdadera, creo yo, no depende de la distancia sino del tiempo que uno está dispuesto a dedicar al otro.',
    difficulty: 'medium',
    questions: [
      { question: 'How did the speaker meet Lucía?', options: ['At university', 'At a summer camp', 'In school math class when they were twelve', 'Through a mutual friend'], correctIndex: 2 },
      { question: 'What does the speaker value most about Lucía?', options: ['Her sense of style', 'That she listens without judging', 'Her cooking skills', 'Her academic talent'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-medium-12',
    title: 'Small Talk in a Madrid Café',
    text: '¡Hola Carlos! ¿Qué tal el fin de semana? Pues mira, regular. Fui al pueblo de mis padres porque mi madre cumplía años, pero el viaje en coche fue un desastre por el tráfico. ¿Y tú? Yo me quedé en Madrid. El sábado fui al Retiro a correr y luego cené con unos amigos en La Latina. Suena mucho mejor que mi fin de semana. Oye, ¿al final has hablado con el jefe sobre las vacaciones? Sí, ayer mismo. Me dijo que en agosto no hay problema, pero que debería avisar al equipo cuanto antes. Pues yo todavía no he decidido nada, a ver si me organizo esta semana. ¿Pedimos otro café antes de volver a la oficina?',
    difficulty: 'medium',
    questions: [
      { question: "Why did Carlos's weekend go badly?", options: ['He got sick', 'There was heavy traffic on the drive to his parents’ village', 'He had to work overtime', 'His car broke down'], correctIndex: 1 },
      { question: 'What did the boss say about August vacation?', options: ['It is not allowed this year', "It is fine but he should notify the team soon", 'Only one week is permitted', 'He has to take it in July instead'], correctIndex: 1 },
    ],
  },
  // --- Hard (v2 additions) ---
  {
    id: 'es-hard-8',
    title: 'Climate Change in Latin America',
    text: 'Pocas regiones del mundo enfrentan los efectos del cambio climático con tanta crudeza como América Latina. Desde los glaciares andinos que retroceden año tras año hasta las sequías prolongadas que castigan el corredor seco centroamericano, los signos están a la vista de cualquiera que quiera mirar. No se trata únicamente de un problema ambiental: cuando un campesino guatemalteco pierde su cosecha por tercera vez consecutiva, lo que se quiebra no es solo el ciclo agrícola, sino también el tejido social de comunidades enteras que terminan migrando hacia el norte. Si los gobiernos de la región actuaran de manera coordinada, sería posible mitigar lo peor; sin embargo, mientras prevalezcan los intereses de corto plazo, el continente seguirá pagando un precio desproporcionado por una crisis que apenas ha contribuido a generar. Quizá lo más urgente no sea esperar acuerdos internacionales perfectos, sino que cada país asuma que adaptarse al nuevo clima ya no es una opción, sino una condición de supervivencia.',
    difficulty: 'hard',
    questions: [
      { question: "What example does the author give of climate change's impact?", options: ['Hurricanes destroying coastal cities', 'Andean glaciers retreating and droughts in Central America', 'Rising temperatures in the Amazon basin', 'Forest fires in Patagonia'], correctIndex: 1 },
      { question: 'What does the author argue is most urgent?', options: ['Waiting for perfect international agreements', 'That each country accept that adapting is a condition of survival', 'Building more dams across the region', 'Banning all fossil fuel extraction immediately'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-hard-9',
    title: 'Profile of a Mexico City CEO',
    text: 'A sus treinta y cuatro años, Mariana Robles dirige una de las startups de logística más prometedoras de Ciudad de México. Su empresa, fundada hace apenas cinco años en un pequeño despacho en la colonia Roma, hoy opera en seis países de la región y emplea a más de cuatrocientas personas. "Nunca imaginé que creciéramos tan rápido", confiesa Robles durante una entrevista en sus nuevas oficinas, "pero también es cierto que no habríamos llegado aquí si no hubiéramos cometido muchísimos errores al principio". Estudió ingeniería industrial en la UNAM y trabajó durante varios años en una multinacional alemana antes de atreverse a emprender. Según los analistas, lo que distingue a su compañía no es la tecnología en sí, sino la capacidad de adaptar soluciones globales al complejo entramado regulatorio latinoamericano. La próxima ronda de inversión, prevista para el próximo trimestre, podría convertir a la empresa en el primer unicornio mexicano del sector. Robles, sin embargo, prefiere no hablar de cifras: "Lo importante es que cuando un cliente en Lima o en Bogotá pulsa un botón, su paquete llegue puntual. Lo demás es ruido".',
    difficulty: 'hard',
    questions: [
      { question: 'According to analysts, what distinguishes her company?', options: ['Its cutting-edge proprietary technology', 'Its ability to adapt global solutions to Latin American regulations', 'Its very low prices', 'Its strong marketing campaigns'], correctIndex: 1 },
      { question: 'How does Robles explain the company’s rapid growth?', options: ['By a brilliant initial business plan', 'By admitting they made many mistakes at the beginning', 'By generous government support', 'By copying competitors abroad'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-hard-10',
    title: 'A Brief History of Flamenco',
    text: 'El flamenco, declarado Patrimonio Cultural Inmaterial de la Humanidad por la Unesco en 2010, hunde sus raíces en la Andalucía del siglo XVIII, aunque sus orígenes exactos siguen siendo objeto de debate entre historiadores. Lo que sí parece claro es que nació del encuentro entre varias tradiciones: la música gitana traída desde el subcontinente indio, los cantos sefardíes, los ritmos moriscos heredados de Al-Ándalus y la música popular de los pueblos andaluces. Durante mucho tiempo se interpretó en patios, ventas y reuniones familiares, lejos de los escenarios oficiales. No fue hasta finales del siglo XIX, con la aparición de los célebres cafés cantantes, cuando el flamenco empezó a profesionalizarse. Si bien algunos puristas lamentan que el género se haya convertido hoy en un espectáculo turístico, otros sostienen que sin esa apertura difícilmente habría sobrevivido. Figuras como Camarón de la Isla o Paco de Lucía supieron renovarlo sin traicionarlo, fusionándolo con el jazz, el blues e incluso la música árabe. El flamenco, lejos de ser un fósil, sigue siendo un arte vivo que cambia con cada generación.',
    difficulty: 'hard',
    questions: [
      { question: 'What does the article say about the origins of flamenco?', options: ['It was invented in the 19th century by Camarón', 'It emerged in 18th-century Andalusia from a mix of traditions', 'It comes purely from Moorish music', 'It was created in the cafés cantantes of Madrid'], correctIndex: 1 },
      { question: 'What is the author’s view on flamenco today?', options: ['It has become a lifeless fossil', 'It remains a living art that renews itself with each generation', 'It should be protected from any modern influence', 'It is in danger of disappearing within a few decades'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-hard-11',
    title: 'Why I Learned Spanish',
    text: 'Cuando me preguntan por qué decidí aprender español, suelo dar respuestas distintas según el día. A veces digo que fue por motivos prácticos: quería leer a Borges en su lengua original, o entender las letras de las canciones que tanto me gustaban. Otras veces respondo que fue casi por casualidad, porque una amiga me invitó a un curso intensivo en Salamanca y no supe decirle que no. Pero si fuera completamente honesto conmigo mismo, admitiría que aprendí español porque quería convertirme en alguien ligeramente distinto. En mi lengua materna me sentía atrapado en costumbres y formas de pensar que ya no me servían; el español me ofreció, sin pedirlo, un terreno nuevo donde podía ser más curioso, más paciente y menos cínico. No diría que aprender un idioma cambia la personalidad de raíz, pero sí abre puertas internas que uno ignoraba. Hoy, después de varios años, sigo cometiendo errores que me hacen reír. Y cada vez que pienso en dejar de estudiar, recuerdo que sin el español me habría quedado con una versión más pobre y más estrecha de mí mismo.',
    difficulty: 'hard',
    questions: [
      { question: 'What does the speaker present as the deepest reason for learning Spanish?', options: ['Career advancement in international business', 'A wish to become a slightly different version of himself', 'A desire to live permanently in Spain', 'Family heritage on his mother’s side'], correctIndex: 1 },
      { question: 'What does the speaker think about making mistakes today?', options: ['They embarrass him deeply', 'They make him laugh and motivate him to keep going', 'They prove that he should stop studying', 'They no longer happen to him'], correctIndex: 1 },
    ],
  },
  {
    id: 'es-hard-12',
    title: 'A Childhood Memory',
    text: 'Hay un recuerdo que vuelve siempre que cierro los ojos en verano: la casa de mis abuelos en un pueblo del interior, con su patio de baldosas calientes y el limonero que se inclinaba sobre el pozo. Yo debía de tener siete u ocho años. Mi abuelo, que ya casi no hablaba por culpa de una vieja enfermedad, me llevaba de la mano hasta la huerta cuando el sol empezaba a bajar. Allí me enseñaba en silencio a reconocer las hojas del tomate, a oler la albahaca, a entender cuándo un higo estaba listo para caer. Mi abuela, mientras tanto, nos llamaba desde la cocina con esa voz que parecía no haber envejecido nunca. Comíamos en el patio bajo una bombilla amarillenta rodeada de mosquitos y, después, ella me contaba historias de cuando era joven, historias que entonces me parecían exageradas y que ahora, ya adulto, intuyo que se quedaban cortas. Si pudiera volver a cualquier lugar del mundo, no elegiría una ciudad ni un país: elegiría aquella media hora dorada antes de la cena, cuando todavía estaban todos vivos y el verano parecía infinito.',
    difficulty: 'hard',
    questions: [
      { question: 'What did the grandfather teach the speaker in the garden?', options: ['How to play music', 'How to recognize plants and tell when figs were ripe', 'How to read old books', 'How to swim in the well'], correctIndex: 1 },
      { question: 'If the speaker could return anywhere, where would he go?', options: ['To his grandparents’ village in winter', 'To the half hour before dinner when everyone was still alive', 'To a city he visited as a teenager', 'To the school where he grew up'], correctIndex: 1 },
    ],
  },
];
