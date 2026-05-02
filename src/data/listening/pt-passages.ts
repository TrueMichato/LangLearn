import type { ListeningPassage } from './ja-passages';

export const ptPassages: ListeningPassage[] = [
  // --- Easy (7) ---
  {
    id: 'pt-easy-1',
    title: 'Self Introduction',
    text: 'Olá! Meu nome é Maria. Sou brasileira. Moro em São Paulo. Estudo inglês na universidade. Prazer em conhecer vocês!',
    difficulty: 'easy',
    questions: [
      { question: "What is the speaker's name?", options: ['Ana', 'Maria', 'Lucia', 'Julia'], correctIndex: 1 },
      { question: 'Where does she live?', options: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], correctIndex: 1 },
    ],
  },
  {
    id: 'pt-easy-2',
    title: 'At the Café',
    text: 'Por favor, eu quero um café com leite. Grande, por gentileza. E também um pão de queijo. Quanto custa tudo?',
    difficulty: 'easy',
    questions: [
      { question: 'What does the speaker order to drink?', options: ['Tea', 'Coffee with milk', 'Juice', 'Water'], correctIndex: 1 },
      { question: 'What food does she want?', options: ['Cake', 'Bread', 'Cheese bread', 'Cookies'], correctIndex: 2 },
    ],
  },
  {
    id: 'pt-easy-3',
    title: 'Weather',
    text: 'Hoje está muito quente em Recife. A temperatura está em trinta e cinco graus. Não tem nenhuma nuvem no céu. Vou à praia com meus amigos.',
    difficulty: 'easy',
    questions: [
      { question: "How is the weather?", options: ['Cold', 'Rainy', 'Very hot', 'Windy'], correctIndex: 2 },
      { question: 'What will the speaker do?', options: ['Stay home', 'Go to the beach', 'Go shopping', 'Study'], correctIndex: 1 },
    ],
  },
  {
    id: 'pt-easy-4',
    title: 'Family',
    text: 'Minha família é grande. Tenho dois irmãos e uma irmã. Meu pai é professor e minha mãe é médica. Moramos juntos em Belo Horizonte.',
    difficulty: 'easy',
    questions: [
      { question: 'How many siblings does the speaker have?', options: ['One', 'Two', 'Three', 'Four'], correctIndex: 2 },
      { question: "What is the mother's profession?", options: ['Teacher', 'Lawyer', 'Doctor', 'Engineer'], correctIndex: 2 },
    ],
  },
  {
    id: 'pt-easy-5',
    title: 'At the Market',
    text: 'Bom dia! Quero um quilo de banana, por favor. Quanto custa o abacaxi? Três reais? Está bom, levo dois. Obrigada!',
    difficulty: 'easy',
    questions: [
      { question: 'What fruit is bought by the kilo?', options: ['Pineapple', 'Banana', 'Mango', 'Orange'], correctIndex: 1 },
      { question: 'How many pineapples does she buy?', options: ['One', 'Two', 'Three', 'None'], correctIndex: 1 },
    ],
  },
  {
    id: 'pt-easy-6',
    title: 'Directions',
    text: 'Com licença, onde fica a farmácia? Vire à direita na próxima rua. Depois ande dois quarteirões. A farmácia fica na esquina, do lado do banco.',
    difficulty: 'easy',
    questions: [
      { question: 'What is the person looking for?', options: ['A bank', 'A pharmacy', 'A hospital', 'A supermarket'], correctIndex: 1 },
      { question: 'Which direction should they turn?', options: ['Left', 'Right', 'Straight', 'Back'], correctIndex: 1 },
    ],
  },
  {
    id: 'pt-easy-7',
    title: 'Daily Routine',
    text: 'Eu acordo às sete horas. Tomo café da manhã e vou para o trabalho de ônibus. Trabalho das nove às seis. À noite, janto com minha família e assisto televisão.',
    difficulty: 'easy',
    questions: [
      { question: 'What time does the speaker wake up?', options: ['6 AM', '7 AM', '8 AM', '9 AM'], correctIndex: 1 },
      { question: 'How does the speaker get to work?', options: ['By car', 'By bus', 'By subway', 'On foot'], correctIndex: 1 },
    ],
  },

  // --- Medium (7) ---
  {
    id: 'pt-med-1',
    title: 'Job Interview',
    text: 'Bom dia, obrigado por vir. Fale um pouco sobre sua experiência. Trabalhei cinco anos como desenvolvedor de software em uma empresa de tecnologia. Tenho experiência com Python e JavaScript. Estou buscando novos desafios na área de inteligência artificial.',
    difficulty: 'medium',
    questions: [
      { question: "What is the candidate's background?", options: ['Marketing', 'Software development', 'Finance', 'Education'], correctIndex: 1 },
      { question: 'What area does the candidate want to work in?', options: ['Web design', 'Data science', 'Artificial intelligence', 'Cybersecurity'], correctIndex: 2 },
    ],
  },
  {
    id: 'pt-med-2',
    title: 'Travel Plans',
    text: 'Nas férias de julho, vou viajar para o Nordeste. Quero conhecer as praias de Natal e Fortaleza. Já reservei o hotel e as passagens de avião. Vou ficar duas semanas. Estou muito animada!',
    difficulty: 'medium',
    questions: [
      { question: 'Where is the speaker traveling?', options: ['South of Brazil', 'Northeast of Brazil', 'Europe', 'Argentina'], correctIndex: 1 },
      { question: 'How long will the trip last?', options: ['One week', 'Two weeks', 'Three weeks', 'One month'], correctIndex: 1 },
    ],
  },
  {
    id: 'pt-med-3',
    title: 'Brazilian Food',
    text: 'A comida brasileira é muito diversa. No Nordeste, temos acarajé e tapioca. No Sul, o churrasco é tradição. A feijoada é o prato nacional, feita com feijão preto e carnes. Cada região tem sabores únicos que refletem sua cultura e história.',
    difficulty: 'medium',
    questions: [
      { question: 'What is considered the national dish?', options: ['Acarajé', 'Churrasco', 'Feijoada', 'Tapioca'], correctIndex: 2 },
      { question: 'What is traditional in the South?', options: ['Tapioca', 'Acarajé', 'Churrasco', 'Feijoada'], correctIndex: 2 },
    ],
  },
  {
    id: 'pt-med-4',
    title: 'City Tour',
    text: 'Bem-vindos ao Rio de Janeiro! Vamos começar nosso passeio pelo Cristo Redentor, no alto do Corcovado. Depois, desceremos para o bairro de Copacabana. À tarde, visitaremos o Jardim Botânico e o Maracanã. Não esqueçam protetor solar e água!',
    difficulty: 'medium',
    questions: [
      { question: 'What is the first stop on the tour?', options: ['Copacabana', 'Christ the Redeemer', 'Botanical Garden', 'Maracanã'], correctIndex: 1 },
      { question: 'What should tourists bring?', options: ['Umbrella and coat', 'Sunscreen and water', 'Camera only', 'Food and drinks'], correctIndex: 1 },
    ],
  },
  {
    id: 'pt-med-5',
    title: 'Phone Call',
    text: 'Alô? Oi, Pedro, tudo bem? Estou ligando para confirmar nosso jantar de sábado. O restaurante é aquele japonês no centro. A reserva é para as oito da noite, mesa para seis pessoas. Pode confirmar até sexta-feira? Abraço!',
    difficulty: 'medium',
    questions: [
      { question: 'What kind of restaurant did they choose?', options: ['Italian', 'Brazilian', 'Japanese', 'French'], correctIndex: 2 },
      { question: 'How many people is the reservation for?', options: ['Four', 'Five', 'Six', 'Eight'], correctIndex: 2 },
    ],
  },
  {
    id: 'pt-med-6',
    title: 'At the Doctor',
    text: 'Doutor, estou me sentindo mal há três dias. Tenho dor de cabeça forte e um pouco de febre. Também estou com tosse. Não tomei nenhum remédio ainda. Vou receitar um anti-inflamatório e pedir alguns exames de sangue. Descanse bastante e beba muita água.',
    difficulty: 'medium',
    questions: [
      { question: 'How long has the patient been sick?', options: ['One day', 'Two days', 'Three days', 'A week'], correctIndex: 2 },
      { question: 'What does the doctor recommend?', options: ['Surgery', 'Rest and water', 'Hospital stay', 'Exercises'], correctIndex: 1 },
    ],
  },
  {
    id: 'pt-med-7',
    title: 'Weekend Plans',
    text: 'Neste fim de semana, vou ao parque Ibirapuera de manhã para correr. Depois do almoço, tenho aula de violão. No domingo, minha avó faz aniversário. Vamos fazer um churrasco na casa dela com toda a família. Vai ser muito divertido!',
    difficulty: 'medium',
    questions: [
      { question: 'What will the speaker do Saturday morning?', options: ['Play guitar', 'Go running', 'Visit grandma', 'Cook'], correctIndex: 1 },
      { question: "What is happening on Sunday?", options: ['Guitar class', 'Park visit', "Grandmother's birthday", 'Soccer game'], correctIndex: 2 },
    ],
  },

  // --- Hard (6) ---
  {
    id: 'pt-hard-1',
    title: 'News Report',
    text: 'De acordo com o IBGE, a taxa de desemprego no Brasil caiu para oito vírgula cinco por cento no último trimestre. Os setores de serviços e comércio foram os que mais contrataram. Economistas afirmam que a tendência de queda deve continuar nos próximos meses, impulsionada pelo crescimento do PIB e pela expansão do crédito ao consumidor.',
    difficulty: 'hard',
    questions: [
      { question: 'What happened to the unemployment rate?', options: ['It increased', 'It decreased', 'It stayed the same', 'It doubled'], correctIndex: 1 },
      { question: 'Which sectors hired the most?', options: ['Agriculture and industry', 'Services and commerce', 'Technology and education', 'Construction and mining'], correctIndex: 1 },
    ],
  },
  {
    id: 'pt-hard-2',
    title: 'University Lecture',
    text: 'A literatura brasileira do século dezenove foi profundamente influenciada pelo Romantismo europeu, mas desenvolveu características próprias. Autores como José de Alencar buscaram criar uma identidade nacional através de obras indigenistas. Machado de Assis, por sua vez, rompeu com o Romantismo e inaugurou o Realismo brasileiro, trazendo uma visão crítica e irônica da sociedade carioca.',
    difficulty: 'hard',
    questions: [
      { question: 'What literary movement influenced 19th-century Brazilian literature?', options: ['Realism', 'Romanticism', 'Modernism', 'Naturalism'], correctIndex: 1 },
      { question: 'What did Machado de Assis inaugurate?', options: ['Brazilian Romanticism', 'Brazilian Realism', 'Brazilian Modernism', 'Indigenismo'], correctIndex: 1 },
    ],
  },
  {
    id: 'pt-hard-3',
    title: 'Business Meeting',
    text: 'Senhores, a receita do último trimestre superou as expectativas em quinze por cento. No entanto, os custos operacionais também aumentaram devido à inflação. A proposta é investir em automação para reduzir despesas a longo prazo. Precisamos aprovar o orçamento até o final do mês para iniciar a implementação no próximo semestre.',
    difficulty: 'hard',
    questions: [
      { question: 'How did revenue compare to expectations?', options: ['Below by 10%', 'Met expectations', 'Exceeded by 15%', 'Exceeded by 20%'], correctIndex: 2 },
      { question: 'What is the proposed solution for rising costs?', options: ['Hire more staff', 'Invest in automation', 'Reduce salaries', 'Close branches'], correctIndex: 1 },
    ],
  },
  {
    id: 'pt-hard-4',
    title: 'Environmental Discussion',
    text: 'O desmatamento da Amazônia é um dos maiores desafios ambientais do Brasil. Nos últimos anos, a destruição da floresta acelerou devido à expansão agropecuária e à mineração ilegal. Especialistas alertam que a perda contínua da cobertura vegetal pode alterar os padrões de chuva em todo o continente. São necessárias políticas públicas mais rigorosas e fiscalização efetiva para conter esse avanço.',
    difficulty: 'hard',
    questions: [
      { question: 'What are the main causes of deforestation mentioned?', options: ['Urbanization and tourism', 'Agriculture and illegal mining', 'Industry and energy', 'Logging and fires'], correctIndex: 1 },
      { question: 'What could continuous deforestation affect?', options: ['Ocean currents', 'Rainfall patterns', 'Temperature globally', 'Animal migration'], correctIndex: 1 },
    ],
  },
  {
    id: 'pt-hard-5',
    title: 'Cultural Essay',
    text: 'O Carnaval brasileiro transcende o mero entretenimento. É uma manifestação cultural complexa que mistura tradições africanas, indígenas e europeias. As escolas de samba do Rio de Janeiro funcionam como verdadeiras instituições comunitárias, promovendo a inclusão social e preservando a memória cultural das comunidades. Cada desfile conta uma história que reflete as aspirações e os desafios da sociedade brasileira contemporânea.',
    difficulty: 'hard',
    questions: [
      { question: 'What cultural traditions does Carnival combine?', options: ['Only African', 'African, Indigenous, and European', 'Only European and African', 'Asian and European'], correctIndex: 1 },
      { question: 'How are samba schools described?', options: ['Dance academies', 'Music conservatories', 'Community institutions', 'Government programs'], correctIndex: 2 },
    ],
  },
  {
    id: 'pt-hard-6',
    title: 'Political Debate',
    text: 'A reforma tributária em discussão no Congresso Nacional propõe simplificar o sistema de impostos brasileiro, substituindo cinco tributos por um único imposto sobre valor agregado. Os defensores argumentam que isso reduziria a burocracia e aumentaria a competitividade das empresas. Os críticos, porém, temem que a transição possa gerar aumento de carga tributária para o setor de serviços e impactar negativamente os municípios menores.',
    difficulty: 'hard',
    questions: [
      { question: 'What does the tax reform propose?', options: ['Create new taxes', 'Simplify taxes into one VAT', 'Eliminate all taxes', 'Increase tax rates'], correctIndex: 1 },
      { question: 'What do critics fear?', options: ['Job losses', 'Higher taxes on services', 'Reduced education funding', 'Currency devaluation'], correctIndex: 1 },
    ],
  },
];
