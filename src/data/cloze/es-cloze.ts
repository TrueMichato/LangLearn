import type { ClozeSentence } from './ja-cloze';

// Spanish Cloze Sentences — Latin American / neutral
// Inspired by Tatoeba (CC-BY 2.0 FR) and frequency-ranked corpus data.
export const esClozeSentences: ClozeSentence[] = [
  // ── Beginner ──
  { id: 'es-c001', target: 'Yo soy de México', english: 'I am from Mexico', blankedWord: 'soy', blankedReading: 'soy', frequencyRank: 1, difficulty: 'beginner' },
  { id: 'es-c002', target: 'La casa es grande', english: 'The house is big', blankedWord: 'casa', blankedReading: 'KAH-sah', frequencyRank: 50, difficulty: 'beginner' },
  { id: 'es-c003', target: 'El perro come pan', english: 'The dog eats bread', blankedWord: 'El', blankedReading: 'el', frequencyRank: 2, difficulty: 'beginner' },
  { id: 'es-c004', target: 'Ella tiene dos hermanos', english: 'She has two brothers', blankedWord: 'tiene', blankedReading: 'tee-EH-neh', frequencyRank: 15, difficulty: 'beginner' },
  { id: 'es-c005', target: 'Nosotros vamos al parque', english: 'We are going to the park', blankedWord: 'vamos', blankedReading: 'VAH-mos', frequencyRank: 25, difficulty: 'beginner' },
  { id: 'es-c006', target: 'Quiero un café con leche', english: 'I want a coffee with milk', blankedWord: 'con', blankedReading: 'kon', frequencyRank: 18, difficulty: 'beginner' },
  { id: 'es-c007', target: 'La niña está cansada', english: 'The girl is tired', blankedWord: 'está', blankedReading: 'es-TAH', frequencyRank: 12, difficulty: 'beginner' },
  { id: 'es-c008', target: 'Hoy hace mucho calor', english: 'Today it is very hot', blankedWord: 'hace', blankedReading: 'AH-seh', frequencyRank: 30, difficulty: 'beginner' },
  { id: 'es-c009', target: 'Mi madre es maestra', english: 'My mother is a teacher', blankedWord: 'es', blankedReading: 'es', frequencyRank: 3, difficulty: 'beginner' },
  { id: 'es-c010', target: 'Vivo en una ciudad pequeña', english: 'I live in a small city', blankedWord: 'en', blankedReading: 'en', frequencyRank: 8, difficulty: 'beginner' },
  { id: 'es-c011', target: 'Los libros están sobre la mesa', english: 'The books are on the table', blankedWord: 'Los', blankedReading: 'los', frequencyRank: 5, difficulty: 'beginner' },
  { id: 'es-c012', target: 'Necesito una pluma para escribir', english: 'I need a pen to write', blankedWord: 'una', blankedReading: 'OO-nah', frequencyRank: 10, difficulty: 'beginner' },

  // ── Intermediate ──
  { id: 'es-c013', target: 'Carlos es médico en el hospital', english: 'Carlos is a doctor at the hospital', blankedWord: 'es', blankedReading: 'es', frequencyRank: 3, difficulty: 'intermediate' },
  { id: 'es-c014', target: 'María está muy enferma hoy', english: 'María is very sick today', blankedWord: 'está', blankedReading: 'es-TAH', frequencyRank: 12, difficulty: 'intermediate' },
  { id: 'es-c015', target: 'Este regalo es para mi hermana', english: 'This gift is for my sister', blankedWord: 'para', blankedReading: 'PAH-rah', frequencyRank: 22, difficulty: 'intermediate' },
  { id: 'es-c016', target: 'Caminamos por el parque cada mañana', english: 'We walk through the park every morning', blankedWord: 'por', blankedReading: 'por', frequencyRank: 20, difficulty: 'intermediate' },
  { id: 'es-c017', target: 'Ayer fui a casa de mis abuelos', english: 'Yesterday I went to my grandparents\u2019 house', blankedWord: 'fui', blankedReading: 'fwee', frequencyRank: 45, difficulty: 'intermediate' },
  { id: 'es-c018', target: 'Cuando era niño jugaba en la calle', english: 'When I was a child I used to play in the street', blankedWord: 'jugaba', blankedReading: 'hoo-GAH-bah', frequencyRank: 80, difficulty: 'intermediate' },
  { id: 'es-c019', target: 'Le di el libro a mi amigo', english: 'I gave the book to my friend', blankedWord: 'Le', blankedReading: 'leh', frequencyRank: 35, difficulty: 'intermediate' },
  { id: 'es-c020', target: 'Mi hermano se levanta temprano', english: 'My brother gets up early', blankedWord: 'se', blankedReading: 'seh', frequencyRank: 14, difficulty: 'intermediate' },
  { id: 'es-c021', target: 'El café es de Colombia', english: 'The coffee is from Colombia', blankedWord: 'de', blankedReading: 'deh', frequencyRank: 4, difficulty: 'intermediate' },
  { id: 'es-c022', target: 'No puedo vivir sin música', english: 'I cannot live without music', blankedWord: 'sin', blankedReading: 'seen', frequencyRank: 60, difficulty: 'intermediate' },
  { id: 'es-c023', target: 'Lo vi en la tienda ayer', english: 'I saw him at the store yesterday', blankedWord: 'Lo', blankedReading: 'loh', frequencyRank: 28, difficulty: 'intermediate' },
  { id: 'es-c024', target: 'Mi padre trabaja en una oficina grande', english: 'My father works in a big office', blankedWord: 'oficina', blankedReading: 'oh-fee-SEE-nah', frequencyRank: 150, difficulty: 'intermediate' },

  // ── Advanced ──
  { id: 'es-c025', target: 'Quiero que estés aquí mañana', english: 'I want you to be here tomorrow', blankedWord: 'estés', blankedReading: 'es-TES', frequencyRank: 200, difficulty: 'advanced' },
  { id: 'es-c026', target: 'Ojalá que llueva pronto', english: 'I hope it rains soon', blankedWord: 'llueva', blankedReading: 'YOO-eh-vah', frequencyRank: 250, difficulty: 'advanced' },
  { id: 'es-c027', target: 'Si tuviera dinero, viajaría por el mundo', english: 'If I had money, I would travel the world', blankedWord: 'tuviera', blankedReading: 'too-vee-EH-rah', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'es-c028', target: 'Es necesario que hagamos un esfuerzo', english: 'It is necessary that we make an effort', blankedWord: 'hagamos', blankedReading: 'ah-GAH-mos', frequencyRank: 280, difficulty: 'advanced' },
  { id: 'es-c029', target: 'El gobierno había anunciado las nuevas medidas', english: 'The government had announced the new measures', blankedWord: 'había', blankedReading: 'ah-BEE-ah', frequencyRank: 180, difficulty: 'advanced' },
  { id: 'es-c030', target: 'Aunque sea difícil, lo intentaré', english: 'Even if it is difficult, I will try', blankedWord: 'sea', blankedReading: 'SEH-ah', frequencyRank: 220, difficulty: 'advanced' },

  // ── Beginner (v2 additions) ──
  { id: 'es-c031', target: 'Me gustan los libros', english: 'I like books', blankedWord: 'gustan', blankedReading: 'GOOS-tahn', frequencyRank: 90, difficulty: 'beginner' },
  { id: 'es-c032', target: 'A mi hermana le gusta el helado', english: 'My sister likes ice cream', blankedWord: 'gusta', blankedReading: 'GOOS-tah', frequencyRank: 70, difficulty: 'beginner' },
  { id: 'es-c033', target: 'Hay tres personas en la sala', english: 'There are three people in the room', blankedWord: 'Hay', blankedReading: 'ai', frequencyRank: 25, difficulty: 'beginner' },
  { id: 'es-c034', target: 'Yo tengo frío', english: 'I am cold', blankedWord: 'tengo', blankedReading: 'TEN-goh', frequencyRank: 35, difficulty: 'beginner' },
  { id: 'es-c035', target: 'Ella tiene veinte años', english: 'She is twenty years old', blankedWord: 'veinte', blankedReading: 'BAYN-teh', frequencyRank: 200, difficulty: 'beginner' },
  { id: 'es-c036', target: 'Yo quiero comer pizza', english: 'I want to eat pizza', blankedWord: 'quiero', blankedReading: 'kee-EH-roh', frequencyRank: 40, difficulty: 'beginner' },
  { id: 'es-c037', target: 'Tú sabes la respuesta', english: 'You know the answer', blankedWord: 'sabes', blankedReading: 'SAH-bes', frequencyRank: 75, difficulty: 'beginner' },
  { id: 'es-c038', target: 'Hoy es lunes', english: 'Today is Monday', blankedWord: 'lunes', blankedReading: 'LOO-nes', frequencyRank: 350, difficulty: 'beginner' },
  { id: 'es-c039', target: 'Estamos en enero', english: 'We are in January', blankedWord: 'enero', blankedReading: 'eh-NEH-roh', frequencyRank: 400, difficulty: 'beginner' },
  { id: 'es-c040', target: 'Camino muy rápidamente', english: 'I walk very quickly', blankedWord: 'muy', blankedReading: 'mwee', frequencyRank: 30, difficulty: 'beginner' },

  // ── Intermediate (v2 additions) ──
  { id: 'es-c041', target: 'Ayer fui a México', english: 'Yesterday I went to Mexico', blankedWord: 'fui', blankedReading: 'fwee', frequencyRank: 45, difficulty: 'intermediate' },
  { id: 'es-c042', target: 'De niño jugaba mucho fútbol', english: 'As a child I used to play a lot of soccer', blankedWord: 'jugaba', blankedReading: 'hoo-GAH-bah', frequencyRank: 220, difficulty: 'intermediate' },
  { id: 'es-c043', target: 'Cuando era joven, viajaba mucho', english: 'When I was young, I traveled a lot', blankedWord: 'era', blankedReading: 'EH-rah', frequencyRank: 18, difficulty: 'intermediate' },
  { id: 'es-c044', target: 'Yo me levanto a las seis', english: 'I get up at six', blankedWord: 'me', blankedReading: 'meh', frequencyRank: 7, difficulty: 'intermediate' },
  { id: 'es-c045', target: '¿El libro? Lo leí ayer', english: 'The book? I read it yesterday', blankedWord: 'Lo', blankedReading: 'loh', frequencyRank: 28, difficulty: 'intermediate' },
  { id: 'es-c046', target: 'Le di un regalo a María', english: 'I gave a gift to María', blankedWord: 'Le', blankedReading: 'leh', frequencyRank: 35, difficulty: 'intermediate' },
  { id: 'es-c047', target: 'Espero que haga buen tiempo mañana', english: 'I hope the weather is good tomorrow', blankedWord: 'haga', blankedReading: 'AH-gah', frequencyRank: 320, difficulty: 'intermediate' },
  { id: 'es-c048', target: 'Dudo que sea verdad', english: 'I doubt that it is true', blankedWord: 'sea', blankedReading: 'SEH-ah', frequencyRank: 220, difficulty: 'intermediate' },
  { id: 'es-c049', target: 'Me daría un café, por favor', english: 'I would like a coffee, please', blankedWord: 'daría', blankedReading: 'dah-REE-ah', frequencyRank: 400, difficulty: 'intermediate' },
  { id: 'es-c050', target: 'Ya serán las nueve', english: 'It must be nine already', blankedWord: 'serán', blankedReading: 'seh-RAHN', frequencyRank: 450, difficulty: 'intermediate' },
  { id: 'es-c051', target: 'Hace dos años que estudio español', english: 'I have been studying Spanish for two years', blankedWord: 'Hace', blankedReading: 'AH-seh', frequencyRank: 30, difficulty: 'intermediate' },
  { id: 'es-c052', target: 'Acabo de llegar', english: 'I have just arrived', blankedWord: 'de', blankedReading: 'deh', frequencyRank: 4, difficulty: 'intermediate' },

  // ── Advanced (v2 additions) ──
  { id: 'es-c053', target: 'Si tuviera más tiempo, viajaría más', english: 'If I had more time, I would travel more', blankedWord: 'tuviera', blankedReading: 'too-VYEH-rah', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'es-c054', target: 'Cuando llegué, todos ya habían comido', english: 'When I arrived, everyone had already eaten', blankedWord: 'habían', blankedReading: 'ah-BEE-ahn', frequencyRank: 240, difficulty: 'advanced' },
  { id: 'es-c055', target: 'Mi madre quería que yo fuera médico', english: 'My mother wanted me to be a doctor', blankedWord: 'fuera', blankedReading: 'FWEH-rah', frequencyRank: 260, difficulty: 'advanced' },
  { id: 'es-c056', target: 'Adonde fueres haz lo que vieres', english: 'When in Rome, do as the Romans do', blankedWord: 'vieres', blankedReading: 'vee-EH-res', frequencyRank: 1500, difficulty: 'advanced' },
  { id: 'es-c057', target: 'Lo hizo sin que nadie se diera cuenta', english: 'He did it without anyone noticing', blankedWord: 'diera', blankedReading: 'dee-EH-rah', frequencyRank: 500, difficulty: 'advanced' },
  { id: 'es-c058', target: 'Me pidió que le dijera la verdad', english: 'He asked me to tell him the truth', blankedWord: 'dijera', blankedReading: 'dee-HEH-rah', frequencyRank: 480, difficulty: 'advanced' },
  { id: 'es-c059', target: 'El libro cuyo autor es Borges es excelente', english: 'The book whose author is Borges is excellent', blankedWord: 'cuyo', blankedReading: 'KOO-yoh', frequencyRank: 600, difficulty: 'advanced' },
  { id: 'es-c060', target: 'La mujer con quien hablé es mi profesora', english: 'The woman with whom I spoke is my teacher', blankedWord: 'quien', blankedReading: 'kyen', frequencyRank: 70, difficulty: 'advanced' },
];
