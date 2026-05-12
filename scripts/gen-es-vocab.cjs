const fs = require('fs');
const path = require('path');
const DIR = 'public/content/vocab/es';
fs.mkdirSync(DIR, { recursive: true });

const idx = [
  { id:'greetings', title:'Greetings & Introductions', order:1, wordCount:15, level:'beginner' },
  { id:'numbers', title:'Numbers 1-100', order:2, wordCount:18, level:'beginner' },
  { id:'days-months', title:'Days & Months', order:3, wordCount:17, level:'beginner' },
  { id:'colors', title:'Colors & Shapes', order:4, wordCount:16, level:'beginner' },
  { id:'family', title:'Family Members', order:5, wordCount:16, level:'beginner' },
  { id:'food', title:'Food & Drink', order:6, wordCount:17, level:'beginner' },
  { id:'animals', title:'Animals', order:7, wordCount:16, level:'beginner' },
  { id:'body', title:'Body Parts', order:8, wordCount:16, level:'beginner' },
  { id:'verbs', title:'Common Verbs', order:9, wordCount:17, level:'beginner' },
  { id:'adjectives', title:'Common Adjectives', order:10, wordCount:16, level:'beginner' },
  { id:'house', title:'Around the House', order:11, wordCount:16, level:'beginner' },
  { id:'school-work', title:'At School & Work', order:12, wordCount:16, level:'beginner' },
  { id:'transport', title:'Transportation & Directions', order:13, wordCount:16, level:'beginner' },
  { id:'weather', title:'Weather & Seasons', order:14, wordCount:16, level:'beginner' },
  { id:'shopping', title:'Shopping & Money', order:15, wordCount:16, level:'beginner' },
  { id:'time-routine', title:'Time & Daily Routine', order:16, wordCount:16, level:'beginner' },
  { id:'emotions', title:'Emotions & Feelings', order:17, wordCount:16, level:'beginner' },
  { id:'hobbies', title:'Hobbies & Sports', order:18, wordCount:16, level:'beginner' },
  { id:'travel', title:'Travel & Tourism', order:19, wordCount:16, level:'beginner' },
  { id:'phrases', title:'Common Phrases & Idioms', order:20, wordCount:16, level:'beginner' },
  { id:'technology', title:'Technology & Internet', order:21, wordCount:16, level:'intermediate' },
  { id:'nature-seasons', title:'Nature & Environment', order:22, wordCount:16, level:'intermediate' },
  { id:'clothing', title:'Clothing & Accessories', order:23, wordCount:16, level:'beginner' },
  { id:'health', title:'Health & Medicine', order:24, wordCount:16, level:'intermediate' },
  { id:'sports', title:'Sports & Exercise', order:25, wordCount:16, level:'intermediate' },
  { id:'music-art', title:'Music & Art', order:26, wordCount:16, level:'intermediate' },
  { id:'restaurant', title:'At the Restaurant', order:27, wordCount:16, level:'beginner' },
  { id:'directions', title:'Directions & Locations', order:28, wordCount:16, level:'beginner' },
  { id:'feelings', title:'Feelings & Personality', order:29, wordCount:16, level:'intermediate' },
  { id:'workplace', title:'Workplace & Business', order:30, wordCount:16, level:'intermediate' },
  { id:'education', title:'Education & School Life', order:31, wordCount:16, level:'intermediate' },
  { id:'law-politics', title:'Law & Government', order:32, wordCount:16, level:'intermediate' },
  { id:'cooking', title:'Cooking & Kitchen', order:33, wordCount:16, level:'intermediate' },
  { id:'banking', title:'Banking & Finance', order:34, wordCount:16, level:'intermediate' },
  { id:'media', title:'Media & News', order:35, wordCount:16, level:'intermediate' },
  { id:'environment', title:'Environment & Earth', order:36, wordCount:16, level:'intermediate' },
  { id:'celebrations', title:'Festivals & Celebrations', order:37, wordCount:16, level:'intermediate' },
  { id:'daily-routines', title:'Daily Routines & Habits', order:38, wordCount:16, level:'beginner' },
  { id:'opinions', title:'Opinions & Discussion', order:39, wordCount:16, level:'intermediate' },
  { id:'emergency', title:'Emergency & Safety', order:40, wordCount:16, level:'intermediate' },
  { id:'cognates', title:'Cognates & False Friends', order:41, wordCount:16, level:'beginner' }
];

const L = {};

// helper: w(word, reading, meaning, example, exampleMeaning)
const w = (word, reading, meaning, example, exampleMeaning) => ({ word, reading, meaning, example, exampleMeaning });
const fb = (sentence, answer, hint) => ({ sentence, answer, hint });
const mc = (question, options, answer) => ({ question, options, answer });


L.greetings = {
  words: [
    w('hola','OH-lah','hello','¡Hola! ¿Cómo estás?','Hello! How are you?'),
    w('buenos días','BWEH-nohs DEE-ahs','good morning','Buenos días, profesor.','Good morning, teacher.'),
    w('buenas tardes','BWEH-nahs TAR-dehs','good afternoon','Buenas tardes, señora.','Good afternoon, ma\u2019am.'),
    w('buenas noches','BWEH-nahs NOH-chehs','good evening / good night','Buenas noches, que descanses.','Good night, rest well.'),
    w('adiós','ah-DYOHS','goodbye','¡Adiós! Nos vemos mañana.','Goodbye! See you tomorrow.'),
    w('chao','chow','bye','Chao, cuídate mucho.','Bye, take care.'),
    w('hasta luego','AHS-tah LWEH-goh','see you later','Tengo que irme, hasta luego.','I have to go, see you later.'),
    w('hasta mañana','AHS-tah mah-NYAH-nah','see you tomorrow','Hasta mañana en la clase.','See you tomorrow in class.'),
    w('gracias','GRAH-syahs','thank you','Muchas gracias por tu ayuda.','Thank you very much for your help.'),
    w('de nada','deh NAH-dah','you\u2019re welcome','—Gracias. —De nada.','Thanks. You\u2019re welcome.'),
    w('por favor','por fah-VOR','please','Un café, por favor.','A coffee, please.'),
    w('perdón','pehr-DOHN','sorry / excuse me','Perdón, no te escuché.','Sorry, I didn\u2019t hear you.'),
    w('disculpe','dees-KOOL-peh','excuse me (formal)','Disculpe, ¿dónde está el baño?','Excuse me, where is the bathroom?'),
    w('mucho gusto','MOO-choh GOOS-toh','nice to meet you','Mucho gusto, soy Ana.','Nice to meet you, I\u2019m Ana.'),
    w('¿cómo estás?','KOH-moh ehs-TAHS','how are you?','Hola Juan, ¿cómo estás?','Hi Juan, how are you?')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('___, ¿cómo estás?','Hola','informal greeting'),
      fb('Un café, ___.','por favor','please'),
      fb('___, ¿dónde está el baño?','Disculpe','formal excuse me'),
      fb('Muchas ___ por todo.','gracias','thanks')
    ],
    mc: [
      mc('What does \u2018gracias\u2019 mean?', ['sorry','thank you','hello','please'], 1),
      mc('How do you say \u2018good night\u2019 in Spanish?', ['buenos días','buenas tardes','buenas noches','adiós'], 2),
      mc('What does \u2018de nada\u2019 mean?', ['sorry','please','hello','you\u2019re welcome'], 3)
    ]
  }
};

L.numbers = {
  words: [
    w('cero','SEH-roh','zero','El termómetro marca cero grados.','The thermometer reads zero degrees.'),
    w('uno','OO-noh','one','Solo me queda uno.','I only have one left.'),
    w('dos','dohs','two','Tengo dos hermanos.','I have two brothers.'),
    w('tres','trehs','three','Son las tres de la tarde.','It\u2019s three in the afternoon.'),
    w('cuatro','KWAH-troh','four','La mesa tiene cuatro patas.','The table has four legs.'),
    w('cinco','SEEN-koh','five','Llego en cinco minutos.','I\u2019ll arrive in five minutes.'),
    w('seis','sehys','six','Trabajo seis días a la semana.','I work six days a week.'),
    w('siete','SYEH-teh','seven','Mi hijo tiene siete años.','My son is seven years old.'),
    w('ocho','OH-choh','eight','Cenamos a las ocho.','We have dinner at eight.'),
    w('nueve','NWEH-beh','nine','Faltan nueve días para mi cumpleaños.','Nine days until my birthday.'),
    w('diez','dyehs','ten','Te doy diez pesos.','I\u2019ll give you ten pesos.'),
    w('veinte','BEYN-teh','twenty','Tengo veinte dólares.','I have twenty dollars.'),
    w('treinta','TREYN-tah','thirty','Mi mamá tiene treinta y ocho años.','My mom is thirty-eight.'),
    w('cuarenta','kwah-REHN-tah','forty','El boleto cuesta cuarenta pesos.','The ticket costs forty pesos.'),
    w('cincuenta','seen-KWEHN-tah','fifty','Esperé cincuenta minutos.','I waited fifty minutes.'),
    w('setenta','seh-TEHN-tah','seventy','Mi abuelo tiene setenta años.','My grandpa is seventy.'),
    w('cien','syehn','one hundred','Necesito cien dólares.','I need a hundred dollars.'),
    w('mil','meel','one thousand','El carro vale mil dólares.','The car is worth a thousand dollars.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Tengo ___ hermanos. (2)','dos','number 2'),
      fb('Son las ___ de la tarde. (3)','tres','number 3'),
      fb('Necesito ___ dólares. (100)','cien','number 100'),
      fb('Mi abuelo tiene ___ años. (70)','setenta','number 70')
    ],
    mc: [
      mc('What number is \u2018cinco\u2019?', ['3','4','5','6'], 2),
      mc('How do you say \u201930\u2019 in Spanish?', ['veinte','treinta','cuarenta','cincuenta'], 1),
      mc('What does \u2018mil\u2019 mean?', ['10','100','1,000','10,000'], 2)
    ]
  }
};

L['days-months'] = {
  words: [
    w('lunes','LOO-nehs','Monday','El lunes empiezo el trabajo.','Monday I start the job.'),
    w('martes','MAR-tehs','Tuesday','Los martes tengo clase de yoga.','On Tuesdays I have yoga class.'),
    w('miércoles','MYEHR-koh-lehs','Wednesday','Nos vemos el miércoles.','See you on Wednesday.'),
    w('jueves','HWEH-behs','Thursday','El jueves es mi cumpleaños.','Thursday is my birthday.'),
    w('viernes','BYEHR-nehs','Friday','Los viernes salgo con amigos.','On Fridays I go out with friends.'),
    w('sábado','SAH-bah-doh','Saturday','El sábado vamos a la playa.','Saturday we\u2019re going to the beach.'),
    w('domingo','doh-MEEN-goh','Sunday','El domingo descanso en casa.','On Sunday I rest at home.'),
    w('enero','eh-NEH-roh','January','En enero hace mucho frío.','In January it\u2019s very cold.'),
    w('febrero','feh-BREH-roh','February','Mi cumpleaños es en febrero.','My birthday is in February.'),
    w('marzo','MAR-soh','March','En marzo empieza la primavera.','Spring begins in March.'),
    w('mayo','MAH-yoh','May','Las flores florecen en mayo.','Flowers bloom in May.'),
    w('julio','HOO-lyoh','July','En julio viajo a México.','In July I travel to Mexico.'),
    w('septiembre','sehp-TYEHM-breh','September','Las clases empiezan en septiembre.','Classes start in September.'),
    w('octubre','ohk-TOO-breh','October','En octubre celebramos Halloween.','In October we celebrate Halloween.'),
    w('diciembre','dee-SYEHM-breh','December','Diciembre es mi mes favorito.','December is my favorite month.'),
    w('hoy','oy','today','Hoy es un buen día.','Today is a good day.'),
    w('mañana','mah-NYAH-nah','tomorrow','Mañana tengo un examen.','Tomorrow I have a test.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('El ___ vamos a la playa.','sábado','weekend day'),
      fb('Mi cumpleaños es en ___.','febrero','second month'),
      fb('___ tengo un examen.','Mañana','the day after today'),
      fb('Los ___ salgo con amigos.','viernes','end of work week')
    ],
    mc: [
      mc('Which day comes after \u2018martes\u2019?', ['lunes','miércoles','jueves','viernes'], 1),
      mc('What month is \u2018julio\u2019?', ['June','July','August','September'], 1),
      mc('What does \u2018hoy\u2019 mean?', ['yesterday','today','tomorrow','tonight'], 1)
    ]
  }
};

L.colors = {
  words: [
    w('rojo','ROH-hoh','red','El carro es rojo.','The car is red.'),
    w('azul','ah-SOOL','blue','El cielo está azul hoy.','The sky is blue today.'),
    w('verde','BEHR-deh','green','Me gusta el té verde.','I like green tea.'),
    w('amarillo','ah-mah-REE-yoh','yellow','El sol es amarillo.','The sun is yellow.'),
    w('negro','NEH-groh','black','Tengo un gato negro.','I have a black cat.'),
    w('blanco','BLAHN-koh','white','La nieve es blanca.','Snow is white.'),
    w('rosa','ROH-sah','pink','Me regaló una rosa rosa.','He gave me a pink rose.'),
    w('morado','moh-RAH-doh','purple','Mi vestido es morado.','My dress is purple.'),
    w('naranja','nah-RAHN-hah','orange','La naranja es naranja.','The orange is orange.'),
    w('gris','grees','gray','El día está gris.','It\u2019s a gray day.'),
    w('café','kah-FEH','brown','Sus ojos son color café.','Her eyes are brown.'),
    w('círculo','SEER-koo-loh','circle','Dibujé un círculo.','I drew a circle.'),
    w('cuadrado','kwah-DRAH-doh','square','La caja es un cuadrado.','The box is a square.'),
    w('triángulo','tree-AHN-goo-loh','triangle','El triángulo tiene tres lados.','The triangle has three sides.'),
    w('estrella','ehs-TREH-yah','star','La estrella brilla en el cielo.','The star shines in the sky.'),
    w('corazón','koh-rah-SOHN','heart','Le dibujé un corazón.','I drew her a heart.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('El cielo está ___.','azul','color of the sky'),
      fb('La nieve es ___.','blanca','color of snow'),
      fb('El triángulo tiene tres ___.','lados','sides'),
      fb('Tengo un gato ___.','negro','dark color')
    ],
    mc: [
      mc('What color is \u2018verde\u2019?', ['blue','green','red','yellow'], 1),
      mc('What shape is \u2018cuadrado\u2019?', ['circle','triangle','square','star'], 2),
      mc('What does \u2018corazón\u2019 mean?', ['star','heart','square','circle'], 1)
    ]
  }
};

L.family = {
  words: [
    w('familia','fah-MEE-lyah','family','Mi familia es grande.','My family is big.'),
    w('padre','PAH-dreh','father','Mi padre trabaja en un banco.','My father works at a bank.'),
    w('madre','MAH-dreh','mother','Mi madre cocina muy bien.','My mother cooks very well.'),
    w('papá','pah-PAH','dad','¡Hola, papá!','Hi, Dad!'),
    w('mamá','mah-MAH','mom','Mamá, te quiero mucho.','Mom, I love you a lot.'),
    w('hermano','ehr-MAH-noh','brother','Tengo un hermano menor.','I have a younger brother.'),
    w('hermana','ehr-MAH-nah','sister','Mi hermana estudia medicina.','My sister studies medicine.'),
    w('hijo','EE-hoh','son','Mi hijo tiene cinco años.','My son is five years old.'),
    w('hija','EE-hah','daughter','Su hija es muy inteligente.','His daughter is very intelligent.'),
    w('abuelo','ah-BWEH-loh','grandfather','Mi abuelo es de México.','My grandfather is from Mexico.'),
    w('abuela','ah-BWEH-lah','grandmother','Mi abuela hace los mejores tamales.','My grandma makes the best tamales.'),
    w('tío','TEE-oh','uncle','Mi tío vive en Argentina.','My uncle lives in Argentina.'),
    w('tía','TEE-ah','aunt','Voy a visitar a mi tía.','I\u2019m going to visit my aunt.'),
    w('primo','PREE-moh','cousin (m)','Mi primo juega fútbol conmigo.','My cousin plays soccer with me.'),
    w('esposo','ehs-POH-soh','husband','Mi esposo es ingeniero.','My husband is an engineer.'),
    w('esposa','ehs-POH-sah','wife','Su esposa se llama Laura.','His wife\u2019s name is Laura.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Mi ___ cocina muy bien. (mother)','madre','female parent'),
      fb('Mi ___ tiene cinco años. (son)','hijo','male child'),
      fb('Mi ___ es de México.','abuelo','father\u2019s father'),
      fb('Voy a visitar a mi ___.','tía','mother\u2019s sister')
    ],
    mc: [
      mc('What does \u2018hermana\u2019 mean?', ['brother','sister','aunt','cousin'], 1),
      mc('How do you say \u2018grandmother\u2019 in Spanish?', ['abuelo','abuela','tía','madre'], 1),
      mc('What does \u2018primo\u2019 mean?', ['nephew','uncle','cousin','brother'], 2)
    ]
  }
};

L.food = {
  words: [
    w('comida','koh-MEE-dah','food / meal','La comida está deliciosa.','The food is delicious.'),
    w('agua','AH-gwah','water','Quiero un vaso de agua.','I want a glass of water.'),
    w('pan','pahn','bread','Compré pan en la panadería.','I bought bread at the bakery.'),
    w('arroz','ah-RROHS','rice','El arroz con frijoles es típico.','Rice and beans is typical.'),
    w('frijoles','free-HOH-lehs','beans','Me encantan los frijoles negros.','I love black beans.'),
    w('carne','KAR-neh','meat','No como carne los lunes.','I don\u2019t eat meat on Mondays.'),
    w('pollo','POH-yoh','chicken','El pollo asado es mi favorito.','Roast chicken is my favorite.'),
    w('pescado','pehs-KAH-doh','fish','El pescado está fresco hoy.','The fish is fresh today.'),
    w('queso','KEH-soh','cheese','Me gusta el queso fresco.','I like fresh cheese.'),
    w('leche','LEH-cheh','milk','Tomo leche con el café.','I drink milk with coffee.'),
    w('jugo','HOO-goh','juice','Un jugo de naranja, por favor.','An orange juice, please.'),
    w('café','kah-FEH','coffee','Necesito un café por la mañana.','I need a coffee in the morning.'),
    w('huevo','WEH-boh','egg','Desayuno huevos con tocino.','I eat eggs with bacon for breakfast.'),
    w('fruta','FROO-tah','fruit','Como fruta todos los días.','I eat fruit every day.'),
    w('verdura','behr-DOO-rah','vegetable','Las verduras son saludables.','Vegetables are healthy.'),
    w('papas','PAH-pahs','potatoes','Me encantan las papas fritas.','I love french fries.'),
    w('sopa','SOH-pah','soup','La sopa está caliente.','The soup is hot.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Quiero un vaso de ___.','agua','clear liquid drink'),
      fb('Un ___ de naranja, por favor.','jugo','fruit drink'),
      fb('Me encantan las ___ fritas.','papas','LatAm word for potatoes'),
      fb('Compré ___ en la panadería.','pan','bakery item')
    ],
    mc: [
      mc('What does \u2018pollo\u2019 mean?', ['fish','chicken','beef','pork'], 1),
      mc('What is \u2018leche\u2019?', ['milk','juice','water','coffee'], 0),
      mc('What does \u2018verdura\u2019 mean?', ['fruit','meat','vegetable','bread'], 2)
    ]
  }
};

L.animals = {
  words: [
    w('perro','PEH-rroh','dog','Mi perro se llama Max.','My dog\u2019s name is Max.'),
    w('gato','GAH-toh','cat','El gato duerme en el sofá.','The cat sleeps on the couch.'),
    w('pájaro','PAH-hah-roh','bird','Un pájaro canta en el árbol.','A bird sings in the tree.'),
    w('pez','pehs','fish (alive)','Hay un pez en la pecera.','There is a fish in the tank.'),
    w('caballo','kah-BAH-yoh','horse','El caballo corre rápido.','The horse runs fast.'),
    w('vaca','BAH-kah','cow','La vaca da leche.','The cow gives milk.'),
    w('cerdo','SEHR-doh','pig','El cerdo es rosado.','The pig is pink.'),
    w('gallina','gah-YEE-nah','hen','La gallina puso un huevo.','The hen laid an egg.'),
    w('oveja','oh-BEH-hah','sheep','La oveja tiene lana suave.','The sheep has soft wool.'),
    w('ratón','rrah-TOHN','mouse','Hay un ratón en la cocina.','There is a mouse in the kitchen.'),
    w('conejo','koh-NEH-hoh','rabbit','El conejo come zanahorias.','The rabbit eats carrots.'),
    w('león','leh-OHN','lion','El león es el rey de la selva.','The lion is the king of the jungle.'),
    w('elefante','eh-leh-FAHN-teh','elephant','El elefante es enorme.','The elephant is huge.'),
    w('oso','OH-soh','bear','El oso vive en el bosque.','The bear lives in the forest.'),
    w('serpiente','sehr-PYEHN-teh','snake','La serpiente es peligrosa.','The snake is dangerous.'),
    w('mariposa','mah-ree-POH-sah','butterfly','La mariposa es muy colorida.','The butterfly is very colorful.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Mi ___ se llama Max.','perro','man\u2019s best friend'),
      fb('La ___ da leche.','vaca','farm animal'),
      fb('El ___ come zanahorias.','conejo','hops, has long ears'),
      fb('La ___ es muy colorida.','mariposa','flying insect')
    ],
    mc: [
      mc('What does \u2018gato\u2019 mean?', ['dog','cat','horse','mouse'], 1),
      mc('Which animal is \u2018león\u2019?', ['tiger','lion','bear','wolf'], 1),
      mc('What is \u2018pájaro\u2019?', ['fish','bird','snake','butterfly'], 1)
    ]
  }
};

L.body = {
  words: [
    w('cabeza','kah-BEH-sah','head','Me duele la cabeza.','My head hurts.'),
    w('cara','KAH-rah','face','Su cara es bonita.','Her face is pretty.'),
    w('ojo','OH-hoh','eye','Tengo los ojos verdes.','I have green eyes.'),
    w('oreja','oh-REH-hah','ear','Me lastimé la oreja.','I hurt my ear.'),
    w('nariz','nah-REES','nose','Tu nariz está fría.','Your nose is cold.'),
    w('boca','BOH-kah','mouth','Abre la boca, por favor.','Open your mouth, please.'),
    w('diente','DYEHN-teh','tooth','Me duele un diente.','One of my teeth hurts.'),
    w('cuello','KWEH-yoh','neck','La bufanda calienta el cuello.','The scarf warms the neck.'),
    w('hombro','OHM-broh','shoulder','Me duele el hombro derecho.','My right shoulder hurts.'),
    w('brazo','BRAH-soh','arm','Levanta el brazo.','Raise your arm.'),
    w('mano','MAH-noh','hand','Lávate las manos.','Wash your hands.'),
    w('dedo','DEH-doh','finger','Me corté el dedo.','I cut my finger.'),
    w('pierna','PYEHR-nah','leg','Tengo las piernas cansadas.','My legs are tired.'),
    w('rodilla','rroh-DEE-yah','knee','Me lastimé la rodilla jugando.','I hurt my knee playing.'),
    w('pie','pyeh','foot','Tengo los pies fríos.','My feet are cold.'),
    w('espalda','ehs-PAHL-dah','back','Me duele la espalda.','My back hurts.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Me duele la ___.','cabeza','top of body'),
      fb('Lávate las ___.','manos','what you use to hold things'),
      fb('Tengo los ___ verdes.','ojos','organs of sight'),
      fb('Me lastimé la ___ jugando.','rodilla','joint in middle of leg')
    ],
    mc: [
      mc('What does \u2018boca\u2019 mean?', ['nose','mouth','ear','eye'], 1),
      mc('Which body part is \u2018pie\u2019?', ['hand','foot','arm','leg'], 1),
      mc('What is \u2018espalda\u2019?', ['chest','back','stomach','neck'], 1)
    ]
  }
};

L.verbs = {
  words: [
    w('ser','sehr','to be (permanent)','Yo soy estudiante.','I am a student.'),
    w('estar','ehs-TAR','to be (state)','Estoy cansado hoy.','I am tired today.'),
    w('tener','teh-NEHR','to have','Tengo dos hermanos.','I have two siblings.'),
    w('hacer','ah-SEHR','to do / to make','¿Qué haces el sábado?','What are you doing Saturday?'),
    w('ir','eer','to go','Voy al supermercado.','I am going to the supermarket.'),
    w('venir','beh-NEER','to come','¿Vienes a la fiesta?','Are you coming to the party?'),
    w('decir','deh-SEER','to say','¿Qué dices?','What are you saying?'),
    w('ver','behr','to see','No veo nada sin lentes.','I can\u2019t see anything without glasses.'),
    w('comer','koh-MEHR','to eat','Vamos a comer pizza.','We\u2019re going to eat pizza.'),
    w('beber','beh-BEHR','to drink','¿Quieres beber algo?','Do you want to drink something?'),
    w('hablar','ah-BLAR','to speak','Hablo español e inglés.','I speak Spanish and English.'),
    w('escuchar','ehs-koo-CHAR','to listen','Escucho música todos los días.','I listen to music every day.'),
    w('leer','leh-EHR','to read','Me gusta leer novelas.','I like to read novels.'),
    w('escribir','ehs-kree-BEER','to write','Escribo en mi diario cada noche.','I write in my journal every night.'),
    w('vivir','bee-BEER','to live','Vivo en la ciudad.','I live in the city.'),
    w('trabajar','trah-bah-HAR','to work','Trabajo en una oficina.','I work in an office.'),
    w('manejar','mah-neh-HAR','to drive','Manejo a la escuela cada día.','I drive to school every day.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('___ en una oficina.','Trabajo','I work'),
      fb('¿Quieres ___ algo?','beber','to drink'),
      fb('___ español e inglés.','Hablo','I speak'),
      fb('Vamos a ___ pizza.','comer','to eat')
    ],
    mc: [
      mc('What does \u2018leer\u2019 mean?', ['to read','to write','to speak','to listen'], 0),
      mc('Which verb means \u2018to drive\u2019?', ['caminar','manejar','correr','volar'], 1),
      mc('What does \u2018vivir\u2019 mean?', ['to die','to live','to work','to study'], 1)
    ]
  }
};

L.adjectives = {
  words: [
    w('grande','GRAHN-deh','big','La casa es grande.','The house is big.'),
    w('pequeño','peh-KEH-nyoh','small','El gato es pequeño.','The cat is small.'),
    w('bueno','BWEH-noh','good','Es un libro muy bueno.','It\u2019s a very good book.'),
    w('malo','MAH-loh','bad','El clima está malo hoy.','The weather is bad today.'),
    w('bonito','boh-NEE-toh','pretty','¡Qué bonito vestido!','What a pretty dress!'),
    w('feo','FEH-oh','ugly','El cuadro me parece feo.','I think the painting is ugly.'),
    w('alto','AHL-toh','tall','Mi hermano es muy alto.','My brother is very tall.'),
    w('bajo','BAH-hoh','short','Soy un poco bajo.','I\u2019m a bit short.'),
    w('rápido','RRAH-pee-doh','fast','El tren es rápido.','The train is fast.'),
    w('lento','LEHN-toh','slow','El internet está lento hoy.','The internet is slow today.'),
    w('fácil','FAH-seel','easy','Este examen es fácil.','This test is easy.'),
    w('difícil','dee-FEE-seel','difficult','El chino es muy difícil.','Chinese is very difficult.'),
    w('caliente','kah-LYEHN-teh','hot','El café está caliente.','The coffee is hot.'),
    w('frío','FREE-oh','cold','El agua está fría.','The water is cold.'),
    w('nuevo','NWEH-boh','new','Tengo un carro nuevo.','I have a new car.'),
    w('viejo','BYEH-hoh','old','Esa casa es muy vieja.','That house is very old.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('La casa es ___.','grande','opposite of small'),
      fb('El café está ___.','caliente','high temperature'),
      fb('El chino es muy ___.','difícil','not easy'),
      fb('Tengo un carro ___.','nuevo','not used')
    ],
    mc: [
      mc('What does \u2018rápido\u2019 mean?', ['slow','fast','easy','hard'], 1),
      mc('Which word means \u2018ugly\u2019?', ['bonito','feo','bueno','alto'], 1),
      mc('What is the opposite of \u2018viejo\u2019?', ['malo','nuevo','caliente','grande'], 1)
    ]
  }
};


L.house = {
  words: [
    w('casa','KAH-sah','house','Mi casa es pequeña pero cómoda.','My house is small but cozy.'),
    w('cuarto','KWAR-toh','room','Mi cuarto está al fondo.','My room is at the back.'),
    w('sala','SAH-lah','living room','La sala tiene un sofá grande.','The living room has a big sofa.'),
    w('cocina','koh-SEE-nah','kitchen','Mi mamá está en la cocina.','My mom is in the kitchen.'),
    w('baño','BAH-nyoh','bathroom','El baño está a la derecha.','The bathroom is on the right.'),
    w('puerta','PWEHR-tah','door','Cierra la puerta, por favor.','Close the door, please.'),
    w('ventana','behn-TAH-nah','window','Abre la ventana, hace calor.','Open the window, it\u2019s hot.'),
    w('mesa','MEH-sah','table','Pon los platos en la mesa.','Put the plates on the table.'),
    w('silla','SEE-yah','chair','Esta silla es muy cómoda.','This chair is very comfortable.'),
    w('cama','KAH-mah','bed','La cama es muy suave.','The bed is very soft.'),
    w('sofá','soh-FAH','sofa','Me senté en el sofá a ver tele.','I sat on the sofa to watch TV.'),
    w('refrigerador','rreh-free-heh-rah-DOR','refrigerator','El refrigerador está vacío.','The fridge is empty.'),
    w('televisión','teh-leh-bee-SYOHN','television','La televisión está prendida.','The TV is on.'),
    w('llave','YAH-beh','key','Perdí las llaves del carro.','I lost my car keys.'),
    w('pared','pah-REHD','wall','Colgué un cuadro en la pared.','I hung a picture on the wall.'),
    w('jardín','har-DEEN','garden','El jardín tiene muchas flores.','The garden has lots of flowers.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Cierra la ___, por favor.','puerta','entrance to room'),
      fb('Mi mamá está en la ___.','cocina','where food is prepared'),
      fb('Perdí las ___ del carro.','llaves','what opens locks'),
      fb('La ___ es muy suave.','cama','where you sleep')
    ],
    mc: [
      mc('What does \u2018ventana\u2019 mean?', ['door','window','wall','roof'], 1),
      mc('Which room is \u2018baño\u2019?', ['kitchen','bedroom','bathroom','garden'], 2),
      mc('What is \u2018sofá\u2019?', ['table','chair','sofa','bed'], 2)
    ]
  }
};

L['school-work'] = {
  words: [
    w('escuela','ehs-KWEH-lah','school','Los niños van a la escuela.','The kids go to school.'),
    w('clase','KLAH-seh','class','La clase empieza a las nueve.','Class starts at nine.'),
    w('maestro','mah-EHS-troh','teacher (m)','El maestro explica muy bien.','The teacher explains very well.'),
    w('maestra','mah-EHS-trah','teacher (f)','Mi maestra es muy amable.','My teacher is very kind.'),
    w('estudiante','ehs-too-DYAHN-teh','student','Soy estudiante de medicina.','I am a medical student.'),
    w('libro','LEE-broh','book','Necesito el libro de matemáticas.','I need the math book.'),
    w('cuaderno','kwah-DEHR-noh','notebook','Olvidé mi cuaderno en casa.','I left my notebook at home.'),
    w('lápiz','LAH-pees','pencil','¿Me prestas un lápiz?','Can you lend me a pencil?'),
    w('tarea','tah-REH-ah','homework','Tengo mucha tarea esta noche.','I have a lot of homework tonight.'),
    w('examen','ehk-SAH-mehn','exam','El examen es el viernes.','The exam is on Friday.'),
    w('oficina','oh-fee-SEE-nah','office','Mi oficina está en el centro.','My office is downtown.'),
    w('trabajo','trah-BAH-hoh','work / job','Voy al trabajo en metro.','I take the subway to work.'),
    w('jefe','HEH-feh','boss','Mi jefe es muy exigente.','My boss is very demanding.'),
    w('compañero','kohm-pah-NYEH-roh','coworker / classmate','Mi compañero me ayuda con la tarea.','My classmate helps me with homework.'),
    w('computadora','kohm-poo-tah-DOH-rah','computer','Trabajo todo el día en la computadora.','I work all day on the computer.'),
    w('reunión','rreh-oo-NYOHN','meeting','Tengo una reunión a las tres.','I have a meeting at three.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Tengo mucha ___ esta noche.','tarea','what students do at home'),
      fb('Trabajo en la ___.','computadora','LatAm word for computer'),
      fb('Mi ___ es muy exigente.','jefe','person in charge at work'),
      fb('El ___ es el viernes.','examen','test')
    ],
    mc: [
      mc('What does \u2018libro\u2019 mean?', ['notebook','book','pencil','test'], 1),
      mc('Which is a place to study?', ['oficina','escuela','jefe','reunión'], 1),
      mc('What is \u2018reunión\u2019?', ['exam','class','meeting','homework'], 2)
    ]
  }
};

L.transport = {
  words: [
    w('carro','KAH-rroh','car','Mi carro es rojo.','My car is red.'),
    w('camión','kah-MYOHN','truck / bus (Mexico)','El camión llega a las siete.','The bus arrives at seven.'),
    w('autobús','ow-toh-BOOS','bus','Tomo el autobús al trabajo.','I take the bus to work.'),
    w('tren','trehn','train','El tren sale a las ocho.','The train leaves at eight.'),
    w('avión','ah-BYOHN','airplane','El avión despega pronto.','The plane takes off soon.'),
    w('bicicleta','bee-see-KLEH-tah','bicycle','Voy en bicicleta a clase.','I go to class by bicycle.'),
    w('moto','MOH-toh','motorcycle','Mi primo tiene una moto.','My cousin has a motorcycle.'),
    w('taxi','TAHK-see','taxi','Llamemos un taxi.','Let\u2019s call a taxi.'),
    w('metro','MEH-troh','subway','El metro es rápido y barato.','The subway is fast and cheap.'),
    w('barco','BAR-koh','boat','El barco cruza el río.','The boat crosses the river.'),
    w('aeropuerto','ah-eh-roh-PWEHR-toh','airport','Llegamos al aeropuerto temprano.','We arrived at the airport early.'),
    w('estación','ehs-tah-SYOHN','station','La estación está cerca.','The station is nearby.'),
    w('boleto','boh-LEH-toh','ticket','Compré el boleto en línea.','I bought the ticket online.'),
    w('parada','pah-RAH-dah','stop (bus stop)','La parada está en la esquina.','The stop is on the corner.'),
    w('camino','kah-MEE-noh','road / way','El camino es largo.','The road is long.'),
    w('semáforo','seh-MAH-foh-roh','traffic light','El semáforo está en rojo.','The light is red.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Tomo el ___ al trabajo.','autobús','public road vehicle'),
      fb('Compré el ___ en línea.','boleto','what you need to ride'),
      fb('El ___ está en rojo.','semáforo','traffic signal'),
      fb('Mi ___ es rojo.','carro','LatAm word for car')
    ],
    mc: [
      mc('What does \u2018avión\u2019 mean?', ['train','boat','airplane','bus'], 2),
      mc('Where do planes land?', ['estación','aeropuerto','parada','semáforo'], 1),
      mc('What is \u2018metro\u2019?', ['taxi','subway','train','bike'], 1)
    ]
  }
};

L.weather = {
  words: [
    w('clima','KLEE-mah','weather / climate','¿Cómo está el clima hoy?','How\u2019s the weather today?'),
    w('sol','sohl','sun','Hoy hay mucho sol.','Today is very sunny.'),
    w('lluvia','YOO-byah','rain','La lluvia no para.','The rain won\u2019t stop.'),
    w('nieve','NYEH-beh','snow','La nieve cubre las montañas.','Snow covers the mountains.'),
    w('viento','BYEHN-toh','wind','El viento es muy fuerte.','The wind is very strong.'),
    w('nube','NOO-beh','cloud','Hay muchas nubes en el cielo.','There are many clouds in the sky.'),
    w('tormenta','tor-MEHN-tah','storm','Viene una tormenta grande.','A big storm is coming.'),
    w('calor','kah-LOR','heat','Hace mucho calor en verano.','It\u2019s very hot in summer.'),
    w('frío','FREE-oh','cold','En invierno hace frío.','In winter it\u2019s cold.'),
    w('húmedo','OO-meh-doh','humid','El clima está muy húmedo.','It\u2019s very humid.'),
    w('seco','SEH-koh','dry','El desierto es seco.','The desert is dry.'),
    w('primavera','pree-mah-BEH-rah','spring','En primavera florecen las flores.','In spring flowers bloom.'),
    w('verano','beh-RAH-noh','summer','El verano es mi estación favorita.','Summer is my favorite season.'),
    w('otoño','oh-TOH-nyoh','autumn','Las hojas caen en otoño.','Leaves fall in autumn.'),
    w('invierno','een-BYEHR-noh','winter','El invierno es muy frío aquí.','Winter is very cold here.'),
    w('paraguas','pah-RAH-gwahs','umbrella','Lleva un paraguas, va a llover.','Take an umbrella, it\u2019s going to rain.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Hace mucho ___ en verano.','calor','high temperature'),
      fb('Lleva un ___, va a llover.','paraguas','protects from rain'),
      fb('La ___ cubre las montañas.','nieve','frozen white precipitation'),
      fb('Las hojas caen en ___.','otoño','fall season')
    ],
    mc: [
      mc('What does \u2018lluvia\u2019 mean?', ['snow','rain','wind','sun'], 1),
      mc('Which season is \u2018invierno\u2019?', ['spring','summer','autumn','winter'], 3),
      mc('What is \u2018viento\u2019?', ['cloud','wind','storm','heat'], 1)
    ]
  }
};

L.shopping = {
  words: [
    w('tienda','TYEHN-dah','store','La tienda abre a las nueve.','The store opens at nine.'),
    w('mercado','mehr-KAH-doh','market','Compro frutas en el mercado.','I buy fruit at the market.'),
    w('supermercado','soo-pehr-mehr-KAH-doh','supermarket','Voy al supermercado los sábados.','I go to the supermarket on Saturdays.'),
    w('precio','PREH-syoh','price','¿Cuál es el precio?','What\u2019s the price?'),
    w('dinero','dee-NEH-roh','money','No tengo mucho dinero.','I don\u2019t have much money.'),
    w('barato','bah-RAH-toh','cheap','Este vestido es muy barato.','This dress is very cheap.'),
    w('caro','KAH-roh','expensive','El reloj es muy caro.','The watch is very expensive.'),
    w('descuento','dehs-KWEHN-toh','discount','Hay un descuento del 20%.','There\u2019s a 20% discount.'),
    w('oferta','oh-FEHR-tah','sale / offer','Hay oferta en zapatos.','There\u2019s a sale on shoes.'),
    w('comprar','kohm-PRAR','to buy','Quiero comprar un regalo.','I want to buy a gift.'),
    w('vender','behn-DEHR','to sell','Venden tacos en la esquina.','They sell tacos on the corner.'),
    w('pagar','pah-GAR','to pay','¿Cómo quieres pagar?','How do you want to pay?'),
    w('tarjeta','tar-HEH-tah','card','Pago con tarjeta de crédito.','I pay with a credit card.'),
    w('efectivo','eh-fehk-TEE-boh','cash','¿Aceptan efectivo?','Do you take cash?'),
    w('recibo','rreh-SEE-boh','receipt','Guarda el recibo, por favor.','Keep the receipt, please.'),
    w('cliente','KLYEHN-teh','customer','El cliente siempre tiene la razón.','The customer is always right.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('¿Cuál es el ___?','precio','cost'),
      fb('Pago con ___ de crédito.','tarjeta','plastic payment'),
      fb('¿Aceptan ___?','efectivo','paper money'),
      fb('Hay un ___ del 20%.','descuento','price reduction')
    ],
    mc: [
      mc('What does \u2018caro\u2019 mean?', ['cheap','expensive','free','small'], 1),
      mc('Which means \u2018to buy\u2019?', ['vender','pagar','comprar','tener'], 2),
      mc('What is \u2018tienda\u2019?', ['market','store','bank','office'], 1)
    ]
  }
};

L['time-routine'] = {
  words: [
    w('hora','OH-rah','hour / time','¿Qué hora es?','What time is it?'),
    w('minuto','mee-NOO-toh','minute','Espera un minuto.','Wait a minute.'),
    w('segundo','seh-GOON-doh','second','Solo tardo un segundo.','I\u2019ll only take a second.'),
    w('mañana','mah-NYAH-nah','morning','Desayuno por la mañana.','I have breakfast in the morning.'),
    w('tarde','TAR-deh','afternoon','Trabajo por la tarde.','I work in the afternoon.'),
    w('noche','NOH-cheh','night','Por la noche leo un libro.','At night I read a book.'),
    w('hoy','oy','today','Hoy es viernes.','Today is Friday.'),
    w('ayer','ah-YEHR','yesterday','Ayer fui al cine.','Yesterday I went to the movies.'),
    w('mañana','mah-NYAH-nah','tomorrow','Mañana voy al doctor.','Tomorrow I go to the doctor.'),
    w('semana','seh-MAH-nah','week','La semana pasada llovió mucho.','It rained a lot last week.'),
    w('mes','mehs','month','Este mes empecé el gimnasio.','This month I started the gym.'),
    w('año','AH-nyoh','year','El año tiene doce meses.','The year has twelve months.'),
    w('temprano','tehm-PRAH-noh','early','Me levanto temprano.','I get up early.'),
    w('tarde','TAR-deh','late','Llegué tarde al trabajo.','I got to work late.'),
    w('despertarse','dehs-pehr-TAR-seh','to wake up','Me despierto a las seis.','I wake up at six.'),
    w('dormir','dor-MEER','to sleep','Duermo ocho horas.','I sleep eight hours.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('¿Qué ___ es?','hora','time of day'),
      fb('Me ___ a las seis.','despierto','to wake up (1st person)'),
      fb('___ fui al cine.','Ayer','the day before today'),
      fb('Llegué ___ al trabajo.','tarde','not early')
    ],
    mc: [
      mc('What does \u2018noche\u2019 mean?', ['morning','afternoon','night','week'], 2),
      mc('Which means \u2018year\u2019?', ['mes','semana','año','día'], 2),
      mc('What is \u2018dormir\u2019?', ['to wake','to sleep','to rest','to dream'], 1)
    ]
  }
};

L.emotions = {
  words: [
    w('feliz','feh-LEES','happy','Estoy muy feliz hoy.','I am very happy today.'),
    w('triste','TREES-teh','sad','Se ve triste, ¿qué pasa?','You look sad, what\u2019s wrong?'),
    w('enojado','eh-noh-HAH-doh','angry','Mi papá está enojado.','My dad is angry.'),
    w('contento','kohn-TEHN-toh','glad / content','Estoy contenta con mi trabajo.','I\u2019m content with my job.'),
    w('emocionado','eh-moh-syoh-NAH-doh','excited','Estoy emocionado por el viaje.','I\u2019m excited about the trip.'),
    w('nervioso','nehr-BYOH-soh','nervous','Estoy nervioso por el examen.','I\u2019m nervous about the exam.'),
    w('cansado','kahn-SAH-doh','tired','Estoy muy cansado, voy a dormir.','I\u2019m very tired, I\u2019m going to sleep.'),
    w('aburrido','ah-boo-RREE-doh','bored','La película estaba aburrida.','The movie was boring.'),
    w('asustado','ah-soos-TAH-doh','scared','El niño está asustado.','The boy is scared.'),
    w('orgulloso','or-goo-YOH-soh','proud','Estoy orgulloso de ti.','I\u2019m proud of you.'),
    w('amor','ah-MOR','love','El amor es lo más importante.','Love is the most important.'),
    w('miedo','MYEH-doh','fear','Le tengo miedo a las alturas.','I\u2019m afraid of heights.'),
    w('sorpresa','sor-PREH-sah','surprise','¡Qué sorpresa verte aquí!','What a surprise to see you here!'),
    w('llorar','yoh-RAR','to cry','El bebé empezó a llorar.','The baby started crying.'),
    w('reír','rreh-EER','to laugh','No paramos de reír.','We couldn\u2019t stop laughing.'),
    w('extrañar','ehks-trah-NYAR','to miss someone','Extraño mucho a mi familia.','I miss my family a lot.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Estoy muy ___ hoy.','feliz','positive emotion'),
      fb('Le tengo ___ a las alturas.','miedo','fear'),
      fb('___ mucho a mi familia.','Extraño','to miss someone'),
      fb('Estoy ___ por el examen.','nervioso','before a test')
    ],
    mc: [
      mc('What does \u2018triste\u2019 mean?', ['happy','sad','angry','tired'], 1),
      mc('Which is \u2018to laugh\u2019?', ['llorar','reír','gritar','sonreír'], 1),
      mc('What is \u2018amor\u2019?', ['hate','love','fear','joy'], 1)
    ]
  }
};

L.hobbies = {
  words: [
    w('pasatiempo','pah-sah-TYEHM-poh','hobby','Mi pasatiempo favorito es leer.','My favorite hobby is reading.'),
    w('música','MOO-see-kah','music','Escucho música todos los días.','I listen to music every day.'),
    w('película','peh-LEE-koo-lah','movie','Vamos a ver una película.','Let\u2019s watch a movie.'),
    w('libro','LEE-broh','book','Leo un libro a la semana.','I read a book a week.'),
    w('videojuego','bee-deh-oh-HWEH-goh','video game','Mi hermano juega videojuegos.','My brother plays video games.'),
    w('fútbol','FOOT-bohl','soccer','Juego fútbol los domingos.','I play soccer on Sundays.'),
    w('básquetbol','BAHS-keht-bohl','basketball','El básquetbol es mi deporte.','Basketball is my sport.'),
    w('natación','nah-tah-SYOHN','swimming','Practico natación los martes.','I swim on Tuesdays.'),
    w('correr','koh-RREHR','to run','Salgo a correr por la mañana.','I go running in the morning.'),
    w('bailar','bahy-LAR','to dance','Me encanta bailar salsa.','I love dancing salsa.'),
    w('cantar','kahn-TAR','to sing','Canto en la ducha.','I sing in the shower.'),
    w('cocinar','koh-see-NAR','to cook','Me gusta cocinar los fines de semana.','I like to cook on weekends.'),
    w('pintar','peen-TAR','to paint','Pinta acuarelas como hobby.','She paints watercolors as a hobby.'),
    w('viajar','byah-HAR','to travel','Viajar es mi pasión.','Traveling is my passion.'),
    w('fotografía','foh-toh-grah-FEE-ah','photography','Estudio fotografía.','I study photography.'),
    w('jugar','hoo-GAR','to play','Los niños juegan en el parque.','The kids play in the park.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Juego ___ los domingos.','fútbol','popular sport with a ball'),
      fb('Me encanta ___ salsa.','bailar','dance verb'),
      fb('Mi ___ favorito es leer.','pasatiempo','hobby'),
      fb('Salgo a ___ por la mañana.','correr','run')
    ],
    mc: [
      mc('What does \u2018cantar\u2019 mean?', ['to dance','to sing','to play','to paint'], 1),
      mc('Which is a sport?', ['película','natación','libro','música'], 1),
      mc('What is \u2018viajar\u2019?', ['to cook','to travel','to read','to run'], 1)
    ]
  }
};

L.travel = {
  words: [
    w('viaje','BYAH-heh','trip','Tengo un viaje a Perú la próxima semana.','I have a trip to Peru next week.'),
    w('vuelo','BWEH-loh','flight','El vuelo sale a las seis.','The flight leaves at six.'),
    w('maleta','mah-LEH-tah','suitcase','Olvidé empacar la maleta.','I forgot to pack my suitcase.'),
    w('pasaporte','pah-sah-POR-teh','passport','¿Trajiste tu pasaporte?','Did you bring your passport?'),
    w('hotel','oh-TEHL','hotel','Reservé un hotel en la playa.','I booked a hotel by the beach.'),
    w('reserva','rreh-SEHR-bah','reservation','Tengo una reserva a tu nombre.','I have a reservation under your name.'),
    w('turista','too-REES-tah','tourist','Hay muchos turistas en el centro.','There are lots of tourists downtown.'),
    w('mapa','MAH-pah','map','Necesito un mapa de la ciudad.','I need a map of the city.'),
    w('playa','PLAH-yah','beach','La playa es hermosa al atardecer.','The beach is gorgeous at sunset.'),
    w('montaña','mohn-TAH-nyah','mountain','Subimos la montaña ayer.','We climbed the mountain yesterday.'),
    w('ciudad','syoo-DAHD','city','La ciudad es muy grande.','The city is very big.'),
    w('pueblo','PWEH-bloh','town / village','Mi familia vive en un pueblo pequeño.','My family lives in a small town.'),
    w('frontera','frohn-TEH-rah','border','Cruzamos la frontera sin problemas.','We crossed the border with no issues.'),
    w('moneda','moh-NEH-dah','currency / coin','¿Cuál es la moneda de Chile?','What\u2019s the currency of Chile?'),
    w('embajada','ehm-bah-HAH-dah','embassy','La embajada queda cerca del parque.','The embassy is near the park.'),
    w('aduana','ah-DWAH-nah','customs','Esperamos en la aduana una hora.','We waited at customs for an hour.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Reservé un ___ en la playa.','hotel','place to stay'),
      fb('¿Trajiste tu ___?','pasaporte','travel document'),
      fb('El ___ sale a las seis.','vuelo','airplane trip'),
      fb('La ___ es hermosa al atardecer.','playa','sandy shore')
    ],
    mc: [
      mc('What does \u2018maleta\u2019 mean?', ['ticket','suitcase','map','hotel'], 1),
      mc('Which means \u2018mountain\u2019?', ['playa','ciudad','montaña','pueblo'], 2),
      mc('What is \u2018turista\u2019?', ['guide','tourist','driver','pilot'], 1)
    ]
  }
};

L.phrases = {
  words: [
    w('está chévere','ehs-TAH cheh-BEH-reh','it\u2019s cool / great','Esa idea está chévere.','That idea is cool.'),
    w('qué padre','keh PAH-dreh','how cool (Mexico)','¡Qué padre tu carro nuevo!','How cool, your new car!'),
    w('vale la pena','BAH-leh lah PEH-nah','it\u2019s worth it','La película vale la pena.','The movie is worth it.'),
    w('echar de menos','eh-CHAR deh MEH-nohs','to miss','Te echo de menos.','I miss you.'),
    w('darse cuenta','DAR-seh KWEHN-tah','to realize','Me di cuenta tarde.','I realized too late.'),
    w('tener ganas','teh-NEHR GAH-nahs','to feel like','Tengo ganas de un café.','I feel like a coffee.'),
    w('no hay de qué','noh ahy deh keh','don\u2019t mention it','—Gracias. —No hay de qué.','Thanks. Don\u2019t mention it.'),
    w('por supuesto','por soo-PWEHS-toh','of course','Por supuesto que te ayudo.','Of course I\u2019ll help you.'),
    w('ni modo','nee MOH-doh','oh well (Mexico)','Llovió, ni modo.','It rained, oh well.'),
    w('a poco','ah POH-koh','really? (Mexico)','¿A poco no sabías?','You really didn\u2019t know?'),
    w('estar de acuerdo','ehs-TAR deh ah-KWEHR-doh','to agree','Estoy de acuerdo contigo.','I agree with you.'),
    w('dar igual','dar ee-GWAHL','to not matter','Me da igual.','I don\u2019t care.'),
    w('en serio','ehn SEH-ryoh','seriously','¿En serio te dijo eso?','Did he really say that?'),
    w('vale','BAH-leh','okay (Spain) / it\u2019s fine','Vale, nos vemos a las cinco.','Okay, see you at five.'),
    w('al rato','ahl RRAH-toh','in a bit','Te llamo al rato.','I\u2019ll call you in a bit.'),
    w('hacer caso','ah-SEHR KAH-soh','to pay attention','Hazme caso, por favor.','Listen to me, please.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Te ___ de menos.','echo','to miss'),
      fb('___ que te ayudo.','Por supuesto','of course'),
      fb('Estoy de ___ contigo.','acuerdo','to agree'),
      fb('Tengo ___ de un café.','ganas','feel like')
    ],
    mc: [
      mc('What does \u2018está chévere\u2019 mean?', ['it\u2019s bad','it\u2019s cool','it\u2019s late','it\u2019s mine'], 1),
      mc('Which means \u2018of course\u2019?', ['ni modo','por supuesto','al rato','en serio'], 1),
      mc('What does \u2018me da igual\u2019 mean?', ['I love it','I hate it','I don\u2019t care','I don\u2019t know'], 2)
    ]
  }
};

L.technology = {
  words: [
    w('computadora','kohm-poo-tah-DOH-rah','computer','Mi computadora es nueva.','My computer is new.'),
    w('celular','seh-loo-LAR','cell phone','Olvidé el celular en casa.','I forgot my phone at home.'),
    w('teléfono','teh-LEH-foh-noh','telephone','El teléfono está sonando.','The phone is ringing.'),
    w('internet','een-tehr-NEHT','internet','No hay internet en el hotel.','There\u2019s no internet at the hotel.'),
    w('correo','koh-RREH-oh','email','Te mando el archivo por correo.','I\u2019ll send the file by email.'),
    w('mensaje','mehn-SAH-heh','message','Te dejé un mensaje.','I left you a message.'),
    w('pantalla','pahn-TAH-yah','screen','La pantalla está rota.','The screen is broken.'),
    w('teclado','teh-KLAH-doh','keyboard','El teclado es inalámbrico.','The keyboard is wireless.'),
    w('contraseña','kohn-trah-SEH-nyah','password','Olvidé mi contraseña.','I forgot my password.'),
    w('aplicación','ah-plee-kah-SYOHN','app','Descargué una aplicación nueva.','I downloaded a new app.'),
    w('red','rrehd','network','La red wifi está lenta.','The wifi network is slow.'),
    w('archivo','ar-CHEE-boh','file','Guarda el archivo, por favor.','Save the file, please.'),
    w('descargar','dehs-kar-GAR','to download','Voy a descargar la película.','I\u2019m going to download the movie.'),
    w('navegar','nah-beh-GAR','to browse','Navego en internet por horas.','I browse the internet for hours.'),
    w('hacer clic','ah-SEHR kleek','to click','Haz clic en el botón verde.','Click the green button.'),
    w('redes sociales','RREH-dehs soh-SYAH-lehs','social media','Paso mucho tiempo en redes sociales.','I spend a lot of time on social media.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Olvidé mi ___.','contraseña','secret login word'),
      fb('Te mando el archivo por ___.','correo','electronic mail'),
      fb('Olvidé el ___ en casa.','celular','LatAm word for cell phone'),
      fb('Voy a ___ la película.','descargar','to get from internet')
    ],
    mc: [
      mc('What does \u2018pantalla\u2019 mean?', ['keyboard','screen','mouse','speaker'], 1),
      mc('Which means \u2018app\u2019?', ['archivo','red','aplicación','correo'], 2),
      mc('What is \u2018navegar\u2019?', ['to save','to delete','to browse','to type'], 2)
    ]
  }
};

L['nature-seasons'] = {
  words: [
    w('naturaleza','nah-too-rah-LEH-sah','nature','Me encanta la naturaleza.','I love nature.'),
    w('árbol','AR-bohl','tree','El árbol da sombra.','The tree gives shade.'),
    w('flor','flor','flower','Las flores huelen rico.','The flowers smell nice.'),
    w('hoja','OH-hah','leaf','La hoja cayó del árbol.','The leaf fell from the tree.'),
    w('río','RREE-oh','river','El río pasa por el pueblo.','The river runs through the town.'),
    w('lago','LAH-goh','lake','El lago está congelado.','The lake is frozen.'),
    w('mar','mar','sea','El mar está tranquilo hoy.','The sea is calm today.'),
    w('bosque','BOHS-keh','forest','El bosque tiene muchos pinos.','The forest has many pines.'),
    w('selva','SEHL-bah','jungle','La selva amazónica es enorme.','The Amazon jungle is huge.'),
    w('desierto','deh-SYEHR-toh','desert','El desierto es muy seco.','The desert is very dry.'),
    w('roca','RROH-kah','rock','Me senté en una roca grande.','I sat on a big rock.'),
    w('arena','ah-REH-nah','sand','Los niños juegan en la arena.','The kids play in the sand.'),
    w('cielo','SYEH-loh','sky','El cielo está despejado.','The sky is clear.'),
    w('estrella','ehs-TREH-yah','star','Veo una estrella fugaz.','I see a shooting star.'),
    w('luna','LOO-nah','moon','La luna llena es hermosa.','The full moon is beautiful.'),
    w('paisaje','pahy-SAH-heh','landscape','El paisaje es increíble.','The landscape is incredible.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('El ___ pasa por el pueblo.','río','flowing water'),
      fb('La ___ llena es hermosa.','luna','satellite in the sky'),
      fb('Los niños juegan en la ___.','arena','beach material'),
      fb('Me encanta la ___.','naturaleza','outdoors')
    ],
    mc: [
      mc('What does \u2018bosque\u2019 mean?', ['desert','sea','forest','sky'], 2),
      mc('Which is \u2018sky\u2019?', ['lago','cielo','arena','flor'], 1),
      mc('What is \u2018árbol\u2019?', ['leaf','flower','tree','rock'], 2)
    ]
  }
};

L.clothing = {
  words: [
    w('ropa','RROH-pah','clothes','Lavo la ropa los sábados.','I do laundry on Saturdays.'),
    w('camisa','kah-MEE-sah','shirt','Esta camisa es de algodón.','This shirt is cotton.'),
    w('camiseta','kah-mee-SEH-tah','t-shirt','Me puse una camiseta blanca.','I put on a white t-shirt.'),
    w('pantalón','pahn-tah-LOHN','pants','El pantalón me queda apretado.','The pants are tight on me.'),
    w('falda','FAHL-dah','skirt','Lleva una falda larga.','She\u2019s wearing a long skirt.'),
    w('vestido','behs-TEE-doh','dress','Compré un vestido azul.','I bought a blue dress.'),
    w('chaqueta','chah-KEH-tah','jacket','Hace frío, ponte chaqueta.','It\u2019s cold, put on a jacket.'),
    w('abrigo','ah-BREE-goh','coat','El abrigo es de lana.','The coat is wool.'),
    w('suéter','SWEH-tehr','sweater','Tejió un suéter para mí.','She knitted a sweater for me.'),
    w('zapato','sah-PAH-toh','shoe','Los zapatos están sucios.','The shoes are dirty.'),
    w('bota','BOH-tah','boot','Uso botas en invierno.','I wear boots in winter.'),
    w('sandalia','sahn-DAH-lyah','sandal','En verano uso sandalias.','In summer I wear sandals.'),
    w('sombrero','sohm-BREH-roh','hat','El sombrero me protege del sol.','The hat protects me from the sun.'),
    w('gorra','GOH-rrah','cap','Lleva una gorra azul.','He wears a blue cap.'),
    w('bolso','BOHL-soh','bag / purse','El bolso es de cuero.','The bag is leather.'),
    w('cinturón','seen-too-ROHN','belt','Necesito un cinturón nuevo.','I need a new belt.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Hace frío, ponte ___.','chaqueta','outer garment'),
      fb('Compré un ___ azul.','vestido','one-piece outfit'),
      fb('En verano uso ___.','sandalias','open footwear'),
      fb('Lavo la ___ los sábados.','ropa','general word for clothes')
    ],
    mc: [
      mc('What does \u2018zapato\u2019 mean?', ['shirt','shoe','hat','belt'], 1),
      mc('Which is a head item?', ['bota','sombrero','falda','bolso'], 1),
      mc('What is \u2018suéter\u2019?', ['shirt','sweater','skirt','dress'], 1)
    ]
  }
};

L.health = {
  words: [
    w('salud','sah-LOOD','health','La salud es lo primero.','Health comes first.'),
    w('doctor','dohk-TOR','doctor','El doctor llegó tarde.','The doctor arrived late.'),
    w('enfermera','ehn-fehr-MEH-rah','nurse','La enfermera me tomó la presión.','The nurse took my blood pressure.'),
    w('hospital','ohs-pee-TAHL','hospital','Mi hermano trabaja en el hospital.','My brother works at the hospital.'),
    w('farmacia','far-MAH-syah','pharmacy','La farmacia abre las 24 horas.','The pharmacy is open 24 hours.'),
    w('medicina','meh-dee-SEE-nah','medicine','Tomo esta medicina por la noche.','I take this medicine at night.'),
    w('receta','rreh-SEH-tah','prescription','Necesito una receta médica.','I need a prescription.'),
    w('enfermo','ehn-FEHR-moh','sick','Me siento enfermo.','I feel sick.'),
    w('dolor','doh-LOR','pain','Tengo dolor de cabeza.','I have a headache.'),
    w('fiebre','FYEH-breh','fever','Mi hija tiene fiebre.','My daughter has a fever.'),
    w('tos','tohs','cough','La tos no me deja dormir.','The cough won\u2019t let me sleep.'),
    w('gripe','GREE-peh','flu','Tengo gripe desde el lunes.','I\u2019ve had the flu since Monday.'),
    w('cita','SEE-tah','appointment','Tengo cita con el dentista.','I have a dental appointment.'),
    w('cirugía','see-roo-HEE-ah','surgery','La cirugía duró tres horas.','The surgery lasted three hours.'),
    w('herida','eh-REE-dah','wound / injury','Se hizo una herida pequeña.','He got a small wound.'),
    w('vacuna','bah-KOO-nah','vaccine','Ya me puse la vacuna.','I already got the vaccine.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Tengo ___ de cabeza.','dolor','aching feeling'),
      fb('Mi hija tiene ___.','fiebre','high body temperature'),
      fb('Necesito una ___ médica.','receta','doctor\u2019s order for medicine'),
      fb('Tengo ___ con el dentista.','cita','appointment')
    ],
    mc: [
      mc('Where do you buy medicine?', ['hospital','farmacia','cita','salud'], 1),
      mc('What does \u2018enfermo\u2019 mean?', ['well','sick','strong','tired'], 1),
      mc('Which is \u2018cough\u2019?', ['dolor','tos','herida','fiebre'], 1)
    ]
  }
};

L.sports = {
  words: [
    w('deporte','deh-POR-teh','sport','Practicar deporte es importante.','Doing sports is important.'),
    w('equipo','eh-KEE-poh','team','Mi equipo ganó el partido.','My team won the game.'),
    w('partido','par-TEE-doh','match / game','El partido empieza a las ocho.','The game starts at eight.'),
    w('jugador','hoo-gah-DOR','player','El jugador anotó un gol.','The player scored a goal.'),
    w('entrenador','ehn-treh-nah-DOR','coach','El entrenador es muy estricto.','The coach is very strict.'),
    w('pelota','peh-LOH-tah','ball','La pelota está afuera.','The ball is outside.'),
    w('gimnasio','heem-NAH-syoh','gym','Voy al gimnasio tres veces por semana.','I go to the gym three times a week.'),
    w('correr','koh-RREHR','to run','Corro cinco kilómetros al día.','I run five kilometers a day.'),
    w('nadar','nah-DAR','to swim','Nado en la piscina los lunes.','I swim at the pool on Mondays.'),
    w('saltar','sahl-TAR','to jump','Saltó muy alto.','He jumped very high.'),
    w('ganar','gah-NAR','to win','Queremos ganar el campeonato.','We want to win the championship.'),
    w('perder','pehr-DEHR','to lose','Es horrible perder así.','It\u2019s awful to lose like that.'),
    w('entrenar','ehn-treh-NAR','to train','Entreno todos los días.','I train every day.'),
    w('ejercicio','eh-hehr-SEE-syoh','exercise','El ejercicio es bueno para la salud.','Exercise is good for health.'),
    w('cancha','KAHN-chah','court / field','La cancha está llena.','The field is full.'),
    w('campeonato','kahm-peh-oh-NAH-toh','championship','Ganamos el campeonato nacional.','We won the national championship.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Voy al ___ tres veces por semana.','gimnasio','place to work out'),
      fb('Mi ___ ganó el partido.','equipo','group of players'),
      fb('___ cinco kilómetros al día.','Corro','I run'),
      fb('El ___ es muy estricto.','entrenador','team leader/teacher')
    ],
    mc: [
      mc('What does \u2018nadar\u2019 mean?', ['to run','to swim','to jump','to win'], 1),
      mc('Which means \u2018ball\u2019?', ['cancha','pelota','equipo','partido'], 1),
      mc('What is \u2018ganar\u2019?', ['to lose','to win','to train','to play'], 1)
    ]
  }
};

L['music-art'] = {
  words: [
    w('música','MOO-see-kah','music','La música clásica me relaja.','Classical music relaxes me.'),
    w('canción','kahn-SYOHN','song','Esta canción me encanta.','I love this song.'),
    w('cantante','kahn-TAHN-teh','singer','La cantante tiene una voz hermosa.','The singer has a beautiful voice.'),
    w('banda','BAHN-dah','band','Mi banda favorita es de Argentina.','My favorite band is from Argentina.'),
    w('concierto','kohn-SYEHR-toh','concert','Fuimos al concierto de Shakira.','We went to the Shakira concert.'),
    w('instrumento','een-stroo-MEHN-toh','instrument','¿Tocas algún instrumento?','Do you play any instrument?'),
    w('guitarra','gee-TAH-rrah','guitar','Aprendo a tocar la guitarra.','I\u2019m learning to play guitar.'),
    w('piano','PYAH-noh','piano','El piano es muy difícil.','The piano is very hard.'),
    w('tambor','tahm-BOR','drum','El tambor marca el ritmo.','The drum sets the rhythm.'),
    w('arte','AR-teh','art','El arte expresa emociones.','Art expresses emotions.'),
    w('pintura','peen-TOO-rah','painting','Esa pintura es de Frida.','That painting is by Frida.'),
    w('pintor','peen-TOR','painter','El pintor vendió todas sus obras.','The painter sold all his works.'),
    w('museo','moo-SEH-oh','museum','El museo abre los domingos.','The museum is open on Sundays.'),
    w('obra','OH-brah','artwork','Esta obra es famosa.','This artwork is famous.'),
    w('teatro','teh-AH-troh','theater','Fuimos al teatro anoche.','We went to the theater last night.'),
    w('escultura','ehs-kool-TOO-rah','sculpture','La escultura está en el parque.','The sculpture is in the park.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Aprendo a tocar la ___.','guitarra','stringed instrument'),
      fb('Fuimos al ___ de Shakira.','concierto','live music event'),
      fb('Esa ___ es de Frida.','pintura','painting'),
      fb('El ___ abre los domingos.','museo','place with art exhibits')
    ],
    mc: [
      mc('What does \u2018canción\u2019 mean?', ['band','song','singer','dance'], 1),
      mc('Which is an instrument?', ['museo','pintura','piano','obra'], 2),
      mc('What is \u2018pintor\u2019?', ['singer','painter','dancer','writer'], 1)
    ]
  }
};


L.restaurant = {
  words: [
    w('restaurante','rrehs-tow-RAHN-teh','restaurant','Cenamos en un restaurante italiano.','We had dinner at an Italian restaurant.'),
    w('mesero','meh-SEH-roh','waiter','El mesero fue muy amable.','The waiter was very kind.'),
    w('menú','meh-NOO','menu','¿Me trae el menú, por favor?','Can you bring the menu, please?'),
    w('plato','PLAH-toh','dish','El plato del día son enchiladas.','The dish of the day is enchiladas.'),
    w('entrada','ehn-TRAH-dah','appetizer','De entrada pedimos guacamole.','For appetizer we ordered guacamole.'),
    w('postre','POHS-treh','dessert','¿Qué hay de postre?','What\u2019s for dessert?'),
    w('bebida','beh-BEE-dah','drink','¿Qué bebida quiere?','What drink would you like?'),
    w('cuenta','KWEHN-tah','bill / check','La cuenta, por favor.','The check, please.'),
    w('propina','proh-PEE-nah','tip','Dejé buena propina al mesero.','I left a good tip for the waiter.'),
    w('reservación','rreh-sehr-bah-SYOHN','reservation','Hice una reservación para las ocho.','I made a reservation for eight.'),
    w('delicioso','deh-lee-SYOH-soh','delicious','La comida estuvo deliciosa.','The food was delicious.'),
    w('picante','pee-KAHN-teh','spicy','La salsa está muy picante.','The salsa is very spicy.'),
    w('vegetariano','beh-heh-tah-RYAH-noh','vegetarian','Soy vegetariano desde hace años.','I\u2019ve been vegetarian for years.'),
    w('ordenar','or-deh-NAR','to order','¿Ya van a ordenar?','Are you ready to order?'),
    w('probar','proh-BAR','to taste / to try','Quiero probar el ceviche.','I want to try the ceviche.'),
    w('servilleta','sehr-bee-YEH-tah','napkin','¿Me puede traer una servilleta?','Can you bring me a napkin?')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('La ___, por favor.','cuenta','the bill'),
      fb('¿Me trae el ___?','menú','list of dishes'),
      fb('La salsa está muy ___.','picante','hot spicy'),
      fb('Hice una ___ para las ocho.','reservación','to book a table')
    ],
    mc: [
      mc('Who serves the food?', ['mesero','jefe','chef','cliente'], 0),
      mc('What does \u2018postre\u2019 mean?', ['appetizer','main','dessert','drink'], 2),
      mc('Which means \u2018to order\u2019?', ['probar','ordenar','pagar','comer'], 1)
    ]
  }
};

L.directions = {
  words: [
    w('derecha','deh-REH-chah','right','Gira a la derecha en la esquina.','Turn right at the corner.'),
    w('izquierda','ees-KYEHR-dah','left','La farmacia está a la izquierda.','The pharmacy is on the left.'),
    w('recto','RREHK-toh','straight','Sigue recto dos cuadras.','Go straight for two blocks.'),
    w('cerca','SEHR-kah','near','El parque está cerca.','The park is nearby.'),
    w('lejos','LEH-hohs','far','La playa está lejos de aquí.','The beach is far from here.'),
    w('arriba','ah-RREE-bah','up / above','El baño está arriba.','The bathroom is upstairs.'),
    w('abajo','ah-BAH-hoh','down / below','La cocina está abajo.','The kitchen is downstairs.'),
    w('aquí','ah-KEE','here','Vivo aquí desde 2020.','I\u2019ve lived here since 2020.'),
    w('allá','ah-YAH','over there','Allá está mi casa.','My house is over there.'),
    w('esquina','ehs-KEE-nah','corner','Te espero en la esquina.','I\u2019ll wait for you on the corner.'),
    w('cuadra','KWAH-drah','block','Vive a tres cuadras de aquí.','He lives three blocks from here.'),
    w('calle','KAH-yeh','street','La calle es muy estrecha.','The street is very narrow.'),
    w('avenida','ah-beh-NEE-dah','avenue','La avenida principal está cerrada.','The main avenue is closed.'),
    w('cruzar','kroo-SAR','to cross','Cruza el puente con cuidado.','Cross the bridge carefully.'),
    w('seguir','seh-GEER','to follow / continue','Sigue las indicaciones.','Follow the directions.'),
    w('llegar','yeh-GAR','to arrive','Llegamos en cinco minutos.','We\u2019ll arrive in five minutes.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Gira a la ___ en la esquina.','derecha','opposite of left'),
      fb('Sigue ___ dos cuadras.','recto','straight ahead'),
      fb('Vive a tres ___ de aquí.','cuadras','street segments'),
      fb('La playa está ___ de aquí.','lejos','opposite of near')
    ],
    mc: [
      mc('What does \u2018izquierda\u2019 mean?', ['right','left','up','down'], 1),
      mc('Which means \u2018near\u2019?', ['lejos','cerca','arriba','abajo'], 1),
      mc('What is \u2018cruzar\u2019?', ['to follow','to arrive','to cross','to turn'], 2)
    ]
  }
};

L.feelings = {
  words: [
    w('personalidad','pehr-soh-nah-lee-DAHD','personality','Tiene una personalidad fuerte.','He has a strong personality.'),
    w('amable','ah-MAH-bleh','kind','La señora es muy amable.','The lady is very kind.'),
    w('simpático','seem-PAH-tee-koh','nice / friendly','Tu hermano es muy simpático.','Your brother is very friendly.'),
    w('tímido','TEE-mee-doh','shy','Soy un poco tímida con desconocidos.','I\u2019m a bit shy with strangers.'),
    w('valiente','bah-LYEHN-teh','brave','El bombero es muy valiente.','The firefighter is very brave.'),
    w('honesto','oh-NEHS-toh','honest','Prefiero ser honesto siempre.','I prefer to always be honest.'),
    w('paciente','pah-SYEHN-teh','patient','Mi mamá es muy paciente.','My mom is very patient.'),
    w('generoso','heh-neh-ROH-soh','generous','Es generoso con sus amigos.','He is generous with his friends.'),
    w('inteligente','een-teh-lee-HEHN-teh','intelligent','Mi hija es muy inteligente.','My daughter is very intelligent.'),
    w('chistoso','chees-TOH-soh','funny','Mi tío es muy chistoso.','My uncle is very funny.'),
    w('serio','SEH-ryoh','serious','El profesor es muy serio.','The professor is very serious.'),
    w('flojo','FLOH-hoh','lazy','No seas flojo, levántate.','Don\u2019t be lazy, get up.'),
    w('trabajador','trah-bah-hah-DOR','hardworking','Él es muy trabajador.','He is very hardworking.'),
    w('confiado','kohn-FYAH-doh','confident','Está confiado en el examen.','He\u2019s confident about the test.'),
    w('celoso','seh-LOH-soh','jealous','Está celoso de su hermano.','He is jealous of his brother.'),
    w('orgulloso','or-goo-YOH-soh','proud','Estoy orgullosa de mis hijos.','I\u2019m proud of my kids.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('La señora es muy ___.','amable','kind'),
      fb('Soy un poco ___ con desconocidos.','tímida','shy (female)'),
      fb('Mi tío es muy ___.','chistoso','funny'),
      fb('No seas ___, levántate.','flojo','lazy')
    ],
    mc: [
      mc('What does \u2018valiente\u2019 mean?', ['shy','brave','lazy','sad'], 1),
      mc('Which is positive?', ['flojo','celoso','generoso','tímido'], 2),
      mc('What is \u2018honesto\u2019?', ['lazy','funny','honest','serious'], 2)
    ]
  }
};

L.workplace = {
  words: [
    w('empresa','ehm-PREH-sah','company','Mi empresa tiene cien empleados.','My company has 100 employees.'),
    w('empleado','ehm-pleh-AH-doh','employee','Soy empleado del gobierno.','I\u2019m a government employee.'),
    w('jefe','HEH-feh','boss','Mi jefe está de vacaciones.','My boss is on vacation.'),
    w('gerente','heh-REHN-teh','manager','Hablé con el gerente.','I spoke with the manager.'),
    w('colega','koh-LEH-gah','colleague','Mis colegas son agradables.','My colleagues are nice.'),
    w('puesto','PWEHS-toh','position / job','Me ofrecieron un puesto nuevo.','They offered me a new position.'),
    w('contrato','kohn-TRAH-toh','contract','Firmé el contrato ayer.','I signed the contract yesterday.'),
    w('sueldo','SWEHL-doh','salary','El sueldo está bien.','The salary is good.'),
    w('horario','oh-RAH-ryoh','schedule','Mi horario cambia cada semana.','My schedule changes every week.'),
    w('hora extra','OH-rah EHKS-trah','overtime','Hice horas extras anoche.','I worked overtime last night.'),
    w('vacaciones','bah-kah-SYOH-nehs','vacation','Tomo vacaciones en julio.','I take vacation in July.'),
    w('renunciar','rreh-noon-SYAR','to resign','Pienso renunciar el viernes.','I plan to resign Friday.'),
    w('contratar','kohn-trah-TAR','to hire','Van a contratar a tres personas.','They\u2019re going to hire three people.'),
    w('despedir','dehs-peh-DEER','to fire','No quiero despedir a nadie.','I don\u2019t want to fire anyone.'),
    w('proyecto','proh-YEHK-toh','project','El proyecto está atrasado.','The project is behind.'),
    w('cliente','KLYEHN-teh','client','El cliente está enojado.','The client is upset.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Firmé el ___ ayer.','contrato','employment agreement'),
      fb('El ___ está bien.','sueldo','monthly pay'),
      fb('Tomo ___ en julio.','vacaciones','time off'),
      fb('Hablé con el ___.','gerente','department head')
    ],
    mc: [
      mc('What does \u2018empleado\u2019 mean?', ['boss','employee','client','owner'], 1),
      mc('Which means \u2018to hire\u2019?', ['despedir','renunciar','contratar','pagar'], 2),
      mc('What is \u2018sueldo\u2019?', ['hour','salary','project','position'], 1)
    ]
  }
};

L.education = {
  words: [
    w('universidad','oo-nee-behr-see-DAHD','university','Estudio en la universidad pública.','I study at the public university.'),
    w('carrera','kah-RREH-rah','degree / career','Estudia la carrera de derecho.','He\u2019s studying law.'),
    w('título','TEE-too-loh','diploma / degree','Me dieron el título ayer.','They gave me my degree yesterday.'),
    w('beca','BEH-kah','scholarship','Gané una beca completa.','I won a full scholarship.'),
    w('asignatura','ah-seeg-nah-TOO-rah','subject','Mi asignatura favorita es historia.','My favorite subject is history.'),
    w('profesor','proh-feh-SOR','professor','El profesor explica muy bien.','The professor explains well.'),
    w('alumno','ah-LOOM-noh','pupil / student','Los alumnos son aplicados.','The students are diligent.'),
    w('biblioteca','bee-blee-oh-TEH-kah','library','Estudio en la biblioteca.','I study at the library.'),
    w('apuntes','ah-POON-tehs','notes','Préstame tus apuntes.','Lend me your notes.'),
    w('nota','NOH-tah','grade','Saqué buena nota en el examen.','I got a good grade on the test.'),
    w('aprobar','ah-proh-BAR','to pass','Aprobé el examen final.','I passed the final exam.'),
    w('reprobar','rreh-proh-BAR','to fail','No quiero reprobar la materia.','I don\u2019t want to fail the class.'),
    w('estudiar','ehs-too-DYAR','to study','Estudio cuatro horas al día.','I study four hours a day.'),
    w('aprender','ah-prehn-DEHR','to learn','Aprendo español en línea.','I learn Spanish online.'),
    w('graduarse','grah-DWAR-seh','to graduate','Me gradúo el próximo año.','I graduate next year.'),
    w('inscribirse','een-skree-BEER-seh','to enroll','Me inscribí en el curso.','I enrolled in the course.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Estudio en la ___ pública.','universidad','higher education place'),
      fb('Gané una ___ completa.','beca','financial aid'),
      fb('Saqué buena ___ en el examen.','nota','grade'),
      fb('Me ___ el próximo año.','gradúo','to graduate (1st person)')
    ],
    mc: [
      mc('What does \u2018biblioteca\u2019 mean?', ['classroom','library','office','dorm'], 1),
      mc('Which means \u2018to study\u2019?', ['aprender','estudiar','graduarse','aprobar'], 1),
      mc('What is \u2018alumno\u2019?', ['professor','pupil','principal','tutor'], 1)
    ]
  }
};

L['law-politics'] = {
  words: [
    w('gobierno','goh-BYEHR-noh','government','El gobierno anunció un plan.','The government announced a plan.'),
    w('presidente','preh-see-DEHN-teh','president','El presidente dio un discurso.','The president gave a speech.'),
    w('político','poh-LEE-tee-koh','politician','El político visitó el pueblo.','The politician visited the town.'),
    w('partido','par-TEE-doh','party (political)','Apoyo a otro partido.','I support a different party.'),
    w('voto','BOH-toh','vote','Mi voto cuenta.','My vote counts.'),
    w('elecciones','eh-lehk-SYOH-nehs','elections','Las elecciones son en junio.','The elections are in June.'),
    w('ley','lehy','law','La nueva ley entró en vigor.','The new law took effect.'),
    w('derecho','deh-REH-choh','right / law','Es nuestro derecho votar.','It\u2019s our right to vote.'),
    w('juez','hwehs','judge','El juez tomó una decisión.','The judge made a decision.'),
    w('abogado','ah-boh-GAH-doh','lawyer','Mi abogado me defendió.','My lawyer defended me.'),
    w('tribunal','tree-boo-NAHL','court','El tribunal está cerrado hoy.','The court is closed today.'),
    w('justicia','hoos-TEE-syah','justice','Queremos justicia para todos.','We want justice for all.'),
    w('libertad','lee-behr-TAHD','freedom','La libertad es un derecho.','Freedom is a right.'),
    w('protesta','proh-TEHS-tah','protest','Hubo una protesta pacífica.','There was a peaceful protest.'),
    w('discurso','dees-KOOR-soh','speech','El discurso fue muy emotivo.','The speech was very emotional.'),
    w('senador','seh-nah-DOR','senator','El senador apoya la reforma.','The senator supports the reform.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('El ___ anunció un plan.','gobierno','ruling body'),
      fb('Mi ___ cuenta.','voto','what you cast in elections'),
      fb('La nueva ___ entró en vigor.','ley','rule passed by government'),
      fb('Mi ___ me defendió.','abogado','legal representative')
    ],
    mc: [
      mc('What does \u2018juez\u2019 mean?', ['lawyer','judge','senator','citizen'], 1),
      mc('Which means \u2018elections\u2019?', ['partido','elecciones','voto','discurso'], 1),
      mc('What is \u2018libertad\u2019?', ['justice','law','freedom','vote'], 2)
    ]
  }
};

L.cooking = {
  words: [
    w('cocina','koh-SEE-nah','kitchen / cuisine','La cocina mexicana es famosa.','Mexican cuisine is famous.'),
    w('receta','rreh-SEH-tah','recipe','Sigo la receta de mi abuela.','I follow my grandma\u2019s recipe.'),
    w('ingrediente','een-greh-DYEHN-teh','ingredient','Falta un ingrediente clave.','We\u2019re missing a key ingredient.'),
    w('sartén','sar-TEHN','frying pan','La sartén está caliente.','The pan is hot.'),
    w('olla','OH-yah','pot','La olla tiene sopa.','The pot has soup.'),
    w('cuchillo','koo-CHEE-yoh','knife','Cuidado con el cuchillo.','Be careful with the knife.'),
    w('tenedor','teh-neh-DOR','fork','Me hace falta un tenedor.','I need a fork.'),
    w('cuchara','koo-CHAH-rah','spoon','La cuchara es de madera.','The spoon is wooden.'),
    w('horno','OR-noh','oven','El horno está a 200 grados.','The oven is at 200 degrees.'),
    w('estufa','ehs-TOO-fah','stove','La estufa es de gas.','The stove is gas.'),
    w('hervir','ehr-BEER','to boil','Hierve el agua para el té.','Boil the water for tea.'),
    w('freír','freh-EER','to fry','Voy a freír los huevos.','I\u2019m going to fry the eggs.'),
    w('hornear','or-neh-AR','to bake','Mi hija ama hornear galletas.','My daughter loves baking cookies.'),
    w('mezclar','mehs-KLAR','to mix','Mezcla la harina con el azúcar.','Mix the flour with the sugar.'),
    w('sal','sahl','salt','Le falta sal a la sopa.','The soup needs salt.'),
    w('aceite','ah-SEY-teh','oil','Usa aceite de oliva.','Use olive oil.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Sigo la ___ de mi abuela.','receta','recipe'),
      fb('Le falta ___ a la sopa.','sal','seasoning'),
      fb('Hierve el ___ para el té.','agua','liquid you boil'),
      fb('Voy a ___ los huevos.','freír','cook in oil')
    ],
    mc: [
      mc('What does \u2018cuchillo\u2019 mean?', ['fork','spoon','knife','plate'], 2),
      mc('Which is for baking?', ['sartén','horno','olla','estufa'], 1),
      mc('What is \u2018aceite\u2019?', ['salt','sugar','oil','water'], 2)
    ]
  }
};

L.banking = {
  words: [
    w('banco','BAHN-koh','bank','El banco abre a las nueve.','The bank opens at nine.'),
    w('cuenta','KWEHN-tah','account','Abrí una cuenta de ahorros.','I opened a savings account.'),
    w('cajero','kah-HEH-roh','ATM / teller','El cajero está descompuesto.','The ATM is broken.'),
    w('depósito','deh-POH-see-toh','deposit','Hice un depósito en efectivo.','I made a cash deposit.'),
    w('retiro','rreh-TEE-roh','withdrawal','Necesito hacer un retiro.','I need to make a withdrawal.'),
    w('préstamo','PREHS-tah-moh','loan','Pedí un préstamo al banco.','I asked the bank for a loan.'),
    w('interés','een-teh-REHS','interest','La tasa de interés es alta.','The interest rate is high.'),
    w('hipoteca','ee-poh-TEH-kah','mortgage','Pagamos la hipoteca cada mes.','We pay the mortgage every month.'),
    w('factura','fahk-TOO-rah','bill / invoice','Llegó la factura del agua.','The water bill arrived.'),
    w('impuesto','eem-PWEHS-toh','tax','Hay que pagar los impuestos.','We have to pay taxes.'),
    w('moneda','moh-NEH-dah','currency','La moneda local es el peso.','The local currency is the peso.'),
    w('billete','bee-YEH-teh','bill (note)','Necesito cambio para un billete grande.','I need change for a large bill.'),
    w('ahorrar','ah-oh-RRAR','to save','Trato de ahorrar cada mes.','I try to save every month.'),
    w('invertir','een-behr-TEER','to invest','Quiero invertir en bienes raíces.','I want to invest in real estate.'),
    w('deuda','DEH-oo-dah','debt','Pagué toda mi deuda.','I paid off all my debt.'),
    w('presupuesto','preh-soo-PWEHS-toh','budget','Hago un presupuesto mensual.','I make a monthly budget.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Abrí una ___ de ahorros.','cuenta','bank account'),
      fb('Pedí un ___ al banco.','préstamo','borrowed money'),
      fb('Hay que pagar los ___.','impuestos','government fees'),
      fb('Trato de ___ cada mes.','ahorrar','to put money aside')
    ],
    mc: [
      mc('What does \u2018cajero\u2019 mean?', ['bank','ATM','bill','tax'], 1),
      mc('Which means \u2018debt\u2019?', ['ahorro','deuda','interés','moneda'], 1),
      mc('What is \u2018factura\u2019?', ['bill','coin','loan','tip'], 0)
    ]
  }
};

L.media = {
  words: [
    w('noticia','noh-TEE-syah','news item','Vi una noticia importante.','I saw an important news story.'),
    w('noticias','noh-TEE-syahs','news','Veo las noticias por la noche.','I watch the news at night.'),
    w('periódico','peh-RYOH-dee-koh','newspaper','Compro el periódico todos los días.','I buy the newspaper every day.'),
    w('revista','rreh-BEES-tah','magazine','Esta revista trae buenos reportajes.','This magazine has good features.'),
    w('reportero','rreh-por-TEH-roh','reporter','El reportero entrevistó al alcalde.','The reporter interviewed the mayor.'),
    w('canal','kah-NAHL','channel','Cambia al canal cinco.','Switch to channel five.'),
    w('programa','proh-GRAH-mah','program','Mi programa favorito empieza pronto.','My favorite program starts soon.'),
    w('entrevista','ehn-treh-BEES-tah','interview','La entrevista fue corta.','The interview was short.'),
    w('reportaje','rreh-por-TAH-heh','report','El reportaje fue muy completo.','The report was thorough.'),
    w('publicidad','poo-blee-see-DAHD','advertising','La publicidad está por todos lados.','Advertising is everywhere.'),
    w('anuncio','ah-NOON-syoh','ad / announcement','Vi un anuncio raro.','I saw a strange ad.'),
    w('redes sociales','RREH-dehs soh-SYAH-lehs','social media','Las redes sociales influyen mucho.','Social media has a lot of influence.'),
    w('influencer','een-FLOO-ehn-sehr','influencer','Esa influencer es de Colombia.','That influencer is from Colombia.'),
    w('podcast','POHD-kahst','podcast','Escucho un podcast cada mañana.','I listen to a podcast every morning.'),
    w('censura','sehn-SOO-rah','censorship','La censura limita la prensa.','Censorship limits the press.'),
    w('prensa','PREHN-sah','the press','La prensa cubrió el evento.','The press covered the event.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Veo las ___ por la noche.','noticias','TV news'),
      fb('Cambia al ___ cinco.','canal','TV station number'),
      fb('Escucho un ___ cada mañana.','podcast','audio program'),
      fb('Compro el ___ todos los días.','periódico','daily print news')
    ],
    mc: [
      mc('What does \u2018reportero\u2019 mean?', ['actor','reporter','editor','reader'], 1),
      mc('Which is print media?', ['canal','revista','podcast','redes'], 1),
      mc('What is \u2018entrevista\u2019?', ['ad','interview','report','channel'], 1)
    ]
  }
};

L.environment = {
  words: [
    w('medio ambiente','MEH-dyoh ahm-BYEHN-teh','environment','Cuidemos el medio ambiente.','Let\u2019s take care of the environment.'),
    w('contaminación','kohn-tah-mee-nah-SYOHN','pollution','La contaminación del aire es grave.','Air pollution is serious.'),
    w('basura','bah-SOO-rah','garbage','Saca la basura, por favor.','Take out the trash, please.'),
    w('reciclaje','rreh-see-KLAH-heh','recycling','El reciclaje ayuda al planeta.','Recycling helps the planet.'),
    w('reciclar','rreh-see-KLAR','to recycle','Hay que reciclar el plástico.','We have to recycle plastic.'),
    w('planeta','plah-NEH-tah','planet','El planeta se está calentando.','The planet is warming.'),
    w('cambio climático','KAHM-byoh klee-MAH-tee-koh','climate change','El cambio climático es real.','Climate change is real.'),
    w('calentamiento global','kah-lehn-tah-MYEHN-toh gloh-BAHL','global warming','El calentamiento global preocupa.','Global warming is worrying.'),
    w('energía','eh-nehr-HEE-ah','energy','La energía solar es limpia.','Solar energy is clean.'),
    w('renovable','rreh-noh-BAH-bleh','renewable','Apoyo la energía renovable.','I support renewable energy.'),
    w('especie','ehs-PEH-syeh','species','La especie está en peligro.','The species is endangered.'),
    w('extinción','ehks-teen-SYOHN','extinction','Hay animales en extinción.','There are animals facing extinction.'),
    w('deforestación','deh-foh-rehs-tah-SYOHN','deforestation','La deforestación destruye bosques.','Deforestation destroys forests.'),
    w('ecológico','eh-koh-LOH-hee-koh','eco-friendly','Compro productos ecológicos.','I buy eco-friendly products.'),
    w('sostenible','sohs-teh-NEE-bleh','sustainable','Queremos un futuro sostenible.','We want a sustainable future.'),
    w('huella','WEH-yah','footprint','Mi huella de carbono es baja.','My carbon footprint is low.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Cuidemos el ___ ambiente.','medio','environment'),
      fb('Hay que ___ el plástico.','reciclar','to recycle'),
      fb('La ___ del aire es grave.','contaminación','pollution'),
      fb('El ___ climático es real.','cambio','change')
    ],
    mc: [
      mc('What does \u2018basura\u2019 mean?', ['plant','garbage','planet','energy'], 1),
      mc('Which means \u2018renewable\u2019?', ['ecológico','sostenible','renovable','limpio'], 2),
      mc('What is \u2018extinción\u2019?', ['recycling','extinction','pollution','warming'], 1)
    ]
  }
};

L.celebrations = {
  words: [
    w('fiesta','FYEHS-tah','party','La fiesta empieza a las nueve.','The party starts at nine.'),
    w('cumpleaños','koom-pleh-AH-nyohs','birthday','Hoy es mi cumpleaños.','Today is my birthday.'),
    w('regalo','rreh-GAH-loh','gift','Te tengo un regalo.','I have a gift for you.'),
    w('pastel','pahs-TEHL','cake','El pastel está delicioso.','The cake is delicious.'),
    w('vela','BEH-lah','candle','Sopla las velas.','Blow out the candles.'),
    w('globo','GLOH-boh','balloon','Compramos muchos globos.','We bought a lot of balloons.'),
    w('Navidad','nah-bee-DAHD','Christmas','La Navidad es mi fiesta favorita.','Christmas is my favorite holiday.'),
    w('Año Nuevo','AH-nyoh NWEH-boh','New Year','Celebramos el Año Nuevo en familia.','We celebrate New Year as a family.'),
    w('Pascua','PAHS-kwah','Easter','En Pascua comemos chocolate.','At Easter we eat chocolate.'),
    w('Día de Muertos','DEE-ah deh MWEHR-tohs','Day of the Dead','El Día de Muertos es el 2 de noviembre.','Day of the Dead is November 2nd.'),
    w('boda','BOH-dah','wedding','Fui a una boda hermosa.','I went to a beautiful wedding.'),
    w('aniversario','ah-nee-behr-SAH-ryoh','anniversary','Es nuestro aniversario hoy.','Today is our anniversary.'),
    w('celebrar','seh-leh-BRAR','to celebrate','Vamos a celebrar tu logro.','Let\u2019s celebrate your achievement.'),
    w('felicidades','feh-lee-see-DAH-dehs','congratulations','¡Felicidades por tu boda!','Congratulations on your wedding!'),
    w('brindis','BREEN-dees','toast (drink)','Hagamos un brindis.','Let\u2019s make a toast.'),
    w('feria','FEH-ryah','fair','La feria del pueblo es divertida.','The town fair is fun.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Hoy es mi ___.','cumpleaños','annual personal celebration'),
      fb('Sopla las ___.','velas','candles on a cake'),
      fb('Es nuestro ___ hoy.','aniversario','anniversary'),
      fb('¡___ por tu boda!','Felicidades','congratulations')
    ],
    mc: [
      mc('What does \u2018regalo\u2019 mean?', ['gift','cake','party','candle'], 0),
      mc('Which holiday is in December?', ['Pascua','Navidad','Día de Muertos','feria'], 1),
      mc('What is \u2018boda\u2019?', ['birthday','wedding','party','toast'], 1)
    ]
  }
};

L['daily-routines'] = {
  words: [
    w('rutina','rroo-TEE-nah','routine','Mi rutina es muy ordenada.','My routine is very organized.'),
    w('despertarse','dehs-pehr-TAR-seh','to wake up','Me despierto a las seis.','I wake up at six.'),
    w('levantarse','leh-bahn-TAR-seh','to get up','Me levanto enseguida.','I get up right away.'),
    w('bañarse','bah-NYAR-seh','to shower / bathe','Me baño todas las mañanas.','I shower every morning.'),
    w('cepillarse','seh-pee-YAR-seh','to brush (oneself)','Me cepillo los dientes después.','I brush my teeth afterward.'),
    w('vestirse','behs-TEER-seh','to get dressed','Me visto rápido.','I get dressed quickly.'),
    w('desayunar','deh-sah-yoo-NAR','to eat breakfast','Desayuno cereal con leche.','I eat cereal with milk.'),
    w('almorzar','ahl-mor-SAR','to eat lunch','Almuerzo a las dos.','I eat lunch at two.'),
    w('cenar','seh-NAR','to eat dinner','Cenamos en familia.','We have dinner together.'),
    w('trabajar','trah-bah-HAR','to work','Trabajo de nueve a seis.','I work nine to six.'),
    w('estudiar','ehs-too-DYAR','to study','Estudio por la tarde.','I study in the afternoon.'),
    w('regresar','rreh-greh-SAR','to return','Regreso a casa a las siete.','I get home at seven.'),
    w('descansar','dehs-kahn-SAR','to rest','Descanso en el sofá.','I rest on the couch.'),
    w('acostarse','ah-kohs-TAR-seh','to go to bed','Me acuesto a las once.','I go to bed at eleven.'),
    w('dormir','dor-MEER','to sleep','Duermo ocho horas.','I sleep eight hours.'),
    w('soñar','soh-NYAR','to dream','Anoche soñé con el mar.','Last night I dreamt of the sea.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Me ___ a las seis.','despierto','to wake up (yo)'),
      fb('Me ___ los dientes después.','cepillo','to brush (yo)'),
      fb('Me ___ a las once.','acuesto','to go to bed (yo)'),
      fb('___ ocho horas.','Duermo','I sleep')
    ],
    mc: [
      mc('What does \u2018desayunar\u2019 mean?', ['to eat lunch','to eat dinner','to eat breakfast','to drink'], 2),
      mc('Which means \u2018to rest\u2019?', ['descansar','dormir','soñar','regresar'], 0),
      mc('What is \u2018vestirse\u2019?', ['to wash','to dress','to wake','to walk'], 1)
    ]
  }
};

L.opinions = {
  words: [
    w('opinión','oh-pee-NYOHN','opinion','Respeto tu opinión.','I respect your opinion.'),
    w('creer','kreh-EHR','to believe','Creo que tienes razón.','I think you\u2019re right.'),
    w('pensar','pehn-SAR','to think','¿Qué piensas tú?','What do you think?'),
    w('estar de acuerdo','ehs-TAR deh ah-KWEHR-doh','to agree','Estoy de acuerdo contigo.','I agree with you.'),
    w('no estar de acuerdo','noh ehs-TAR deh ah-KWEHR-doh','to disagree','No estoy de acuerdo en eso.','I don\u2019t agree on that.'),
    w('discutir','dees-koo-TEER','to argue','No quiero discutir contigo.','I don\u2019t want to argue with you.'),
    w('debate','deh-BAH-teh','debate','El debate fue interesante.','The debate was interesting.'),
    w('argumento','ar-goo-MEHN-toh','argument','Tu argumento es válido.','Your argument is valid.'),
    w('razón','rrah-SOHN','reason','Tienes razón en eso.','You\u2019re right about that.'),
    w('verdad','behr-DAHD','truth','La verdad siempre sale.','The truth always comes out.'),
    w('mentira','mehn-TEE-rah','lie','Eso es una mentira.','That\u2019s a lie.'),
    w('punto de vista','POON-toh deh BEES-tah','point of view','Es otro punto de vista.','It\u2019s another point of view.'),
    w('quizás','kee-SAHS','maybe','Quizás venga mañana.','Maybe I\u2019ll come tomorrow.'),
    w('claro','KLAH-roh','of course / clear','Claro que sí.','Of course.'),
    w('por ejemplo','por eh-HEHM-ploh','for example','Por ejemplo, este caso.','For example, this case.'),
    w('en cambio','ehn KAHM-byoh','on the other hand','En cambio, yo prefiero esto.','On the other hand, I prefer this.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('___ que tienes razón.','Creo','I believe'),
      fb('Estoy de ___ contigo.','acuerdo','to agree'),
      fb('Tienes ___ en eso.','razón','to be right'),
      fb('___ venga mañana.','Quizás','maybe')
    ],
    mc: [
      mc('What does \u2018mentira\u2019 mean?', ['truth','lie','reason','debate'], 1),
      mc('Which means \u2018to think\u2019?', ['discutir','pensar','creer','hablar'], 1),
      mc('What is \u2018claro\u2019?', ['dark','wrong','of course','maybe'], 2)
    ]
  }
};

L.emergency = {
  words: [
    w('emergencia','eh-mehr-HEHN-syah','emergency','Llama en caso de emergencia.','Call in case of emergency.'),
    w('ayuda','ah-YOO-dah','help','¡Necesito ayuda!','I need help!'),
    w('socorro','soh-KOH-rroh','help (cry)','¡Socorro! ¡Auxilio!','Help!'),
    w('peligro','peh-LEE-groh','danger','Cuidado, hay peligro.','Careful, there\u2019s danger.'),
    w('policía','poh-lee-SEE-ah','police','Llamé a la policía.','I called the police.'),
    w('bombero','bohm-BEH-roh','firefighter','Los bomberos llegaron rápido.','The firefighters arrived fast.'),
    w('ambulancia','ahm-boo-LAHN-syah','ambulance','La ambulancia se llevó al herido.','The ambulance took the injured man.'),
    w('accidente','ahk-see-DEHN-teh','accident','Hubo un accidente en la calle.','There was an accident on the street.'),
    w('incendio','een-SEHN-dyoh','fire (blaze)','El incendio destruyó la casa.','The fire destroyed the house.'),
    w('terremoto','teh-rreh-MOH-toh','earthquake','El terremoto duró un minuto.','The earthquake lasted a minute.'),
    w('robo','RROH-boh','robbery','Reportamos el robo.','We reported the robbery.'),
    w('ladrón','lah-DROHN','thief','El ladrón corrió por la calle.','The thief ran down the street.'),
    w('herido','eh-REE-doh','injured (person)','El herido fue al hospital.','The injured man went to the hospital.'),
    w('rescate','rrehs-KAH-teh','rescue','El rescate fue exitoso.','The rescue was successful.'),
    w('cuidado','kwee-DAH-doh','care / careful','¡Cuidado, está caliente!','Careful, it\u2019s hot!'),
    w('urgente','oor-HEHN-teh','urgent','Es un mensaje urgente.','It\u2019s an urgent message.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('¡Necesito ___!','ayuda','help'),
      fb('Llamé a la ___.','policía','law enforcement'),
      fb('Hubo un ___ en la calle.','accidente','crash'),
      fb('Es un mensaje ___.','urgente','urgent')
    ],
    mc: [
      mc('What does \u2018bombero\u2019 mean?', ['police','firefighter','doctor','soldier'], 1),
      mc('Which is a natural disaster?', ['robo','terremoto','ladrón','rescate'], 1),
      mc('What is \u2018peligro\u2019?', ['help','danger','rescue','care'], 1)
    ]
  }
};

L.cognates = {
  words: [
    w('hotel','oh-TEHL','hotel','Reservé un hotel céntrico.','I booked a central hotel.'),
    w('chocolate','choh-koh-LAH-teh','chocolate','Me encanta el chocolate.','I love chocolate.'),
    w('animal','ah-nee-MAHL','animal','El león es un animal salvaje.','The lion is a wild animal.'),
    w('familia','fah-MEE-lyah','family','Mi familia vive en Texas.','My family lives in Texas.'),
    w('música','MOO-see-kah','music','La música pop es popular.','Pop music is popular.'),
    w('idea','ee-DEH-ah','idea','Tengo una buena idea.','I have a good idea.'),
    w('teléfono','teh-LEH-foh-noh','telephone','Pásame el teléfono.','Pass me the phone.'),
    w('error','eh-RROR','error','Cometí un error.','I made a mistake.'),
    w('actor','ahk-TOR','actor','Ese actor es famoso.','That actor is famous.'),
    w('doctor','dohk-TOR','doctor','El doctor llegó a tiempo.','The doctor arrived on time.'),
    w('embarazada','ehm-bah-rah-SAH-dah','pregnant (false friend!)','Mi prima está embarazada.','My cousin is pregnant.'),
    w('éxito','EHK-see-toh','success (not exit!)','Tuvo mucho éxito.','He had a lot of success.'),
    w('librería','lee-breh-REE-ah','bookstore (not library!)','La librería tiene libros nuevos.','The bookstore has new books.'),
    w('sopa','SOH-pah','soup (not soap!)','La sopa está caliente.','The soup is hot.'),
    w('pariente','pah-RYEHN-teh','relative (not parent!)','Es un pariente lejano.','He\u2019s a distant relative.'),
    w('asistir','ah-sees-TEER','to attend (not assist!)','Voy a asistir a la junta.','I\u2019m going to attend the meeting.')
  ],
  exercises: {
    match: 5,
    fillBlank: [
      fb('Mi prima está ___.','embarazada','common false friend: pregnant'),
      fb('La ___ tiene libros nuevos.','librería','bookstore, not library'),
      fb('Tuvo mucho ___.','éxito','success, not exit'),
      fb('Voy a ___ a la junta.','asistir','attend, not assist')
    ],
    mc: [
      mc('What does \u2018embarazada\u2019 actually mean?', ['embarrassed','pregnant','tired','busy'], 1),
      mc('What does \u2018éxito\u2019 mean?', ['exit','success','exile','exam'], 1),
      mc('What does \u2018sopa\u2019 mean?', ['soap','soup','sofa','sop'], 1)
    ]
  }
};

// write files
fs.writeFileSync(path.join(DIR,'index.json'), JSON.stringify(idx, null, 2) + '\n');
let total = 0;
let totalWords = 0;
for (const e of idx) {
  const lesson = L[e.id];
  if (!lesson) { console.error('MISSING LESSON', e.id); process.exit(1); }
  const obj = { id: e.id, words: lesson.words, exercises: [
    { type:'match', pairs: lesson.exercises.match },
    { type:'fill-blank', items: lesson.exercises.fillBlank },
    { type:'multiple-choice', items: lesson.exercises.mc }
  ]};
  fs.writeFileSync(path.join(DIR, e.id + '.json'), JSON.stringify(obj, null, 2) + '\n');
  total++;
  totalWords += lesson.words.length;
}
console.log('Wrote', total, 'lessons,', totalWords, 'total words');
