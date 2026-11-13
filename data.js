// Biblioteca de treinos pré-definidos
const WORKOUT_LIBRARY = [
  {
    id: 'lib-1',
    name: 'Peito & Tríceps A',
    muscle: 'peito',
    exercises: [
      { name: 'Supino Reto com Barra', sets: 4, reps: '8-12' },
      { name: 'Supino Inclinado com Halteres', sets: 3, reps: '10-12' },
      { name: 'Crucifixo no Cabo', sets: 3, reps: '12-15' },
      { name: 'Tríceps Testa', sets: 3, reps: '10-12' },
      { name: 'Tríceps Corda', sets: 3, reps: '12-15' }
    ]
  },
  {
    id: 'lib-2',
    name: 'Costas & Bíceps A',
    muscle: 'costas',
    exercises: [
      { name: 'Puxada Frontal', sets: 4, reps: '8-12' },
      { name: 'Remada Curvada', sets: 3, reps: '8-10' },
      { name: 'Remada Unilateral', sets: 3, reps: '10-12' },
      { name: 'Rosca Direta', sets: 3, reps: '10-12' },
      { name: 'Rosca Martelo', sets: 3, reps: '12-15' }
    ]
  },
  {
    id: 'lib-3',
    name: 'Pernas Completo',
    muscle: 'pernas',
    exercises: [
      { name: 'Agachamento Livre', sets: 4, reps: '8-12' },
      { name: 'Leg Press 45°', sets: 3, reps: '10-12' },
      { name: 'Cadeira Extensora', sets: 3, reps: '12-15' },
      { name: 'Mesa Flexora', sets: 3, reps: '10-12' },
      { name: 'Panturrilha em Pé', sets: 4, reps: '15-20' }
    ]
  },
  {
    id: 'lib-4',
    name: 'Ombros Completo',
    muscle: 'ombros',
    exercises: [
      { name: 'Desenvolvimento com Halteres', sets: 4, reps: '8-12' },
      { name: 'Elevação Lateral', sets: 3, reps: '12-15' },
      { name: 'Elevação Frontal', sets: 3, reps: '12-15' },
      { name: 'Remada Alta', sets: 3, reps: '10-12' },
      { name: 'Face Pull', sets: 3, reps: '12-15' }
    ]
  },
  {
    id: 'lib-5',
    name: 'Full Body Iniciante',
    muscle: 'full',
    exercises: [
      { name: 'Agachamento', sets: 3, reps: '12' },
      { name: 'Supino com Halteres', sets: 3, reps: '12' },
      { name: 'Remada Curvada', sets: 3, reps: '12' },
      { name: 'Desenvolvimento', sets: 3, reps: '12' },
      { name: 'Prancha', sets: 3, reps: '30s' }
    ]
  },
  {
    id: 'lib-6',
    name: 'Cardio HIIT 20min',
    muscle: 'cardio',
    exercises: [
      { name: 'Burpees', sets: 4, reps: '30s' },
      { name: 'Mountain Climbers', sets: 4, reps: '30s' },
      { name: 'Jumping Jacks', sets: 4, reps: '30s' },
      { name: 'High Knees', sets: 4, reps: '30s' },
      { name: 'Descanso entre rounds', sets: 4, reps: '30s' }
    ]
  },
  {
    id: 'lib-7',
    name: 'Abdômen Intenso',
    muscle: 'abdomen',
    exercises: [
      { name: 'Abdominal Crunch', sets: 3, reps: '20' },
      { name: 'Elevação de Pernas', sets: 3, reps: '15' },
      { name: 'Prancha Lateral', sets: 3, reps: '30s cada' },
      { name: 'Russian Twist', sets: 3, reps: '20' },
      { name: 'Prancha Frontal', sets: 3, reps: '45s' }
    ]
  },
  {
    id: 'lib-8',
    name: 'Bíceps Foco',
    muscle: 'biceps',
    exercises: [
      { name: 'Rosca Direta Barra', sets: 4, reps: '8-12' },
      { name: 'Rosca Alternada', sets: 3, reps: '10-12' },
      { name: 'Rosca Scott', sets: 3, reps: '10-12' },
      { name: 'Rosca Concentrada', sets: 3, reps: '12-15' }
    ]
  },
  {
    id: 'lib-9',
    name: 'Tríceps Foco',
    muscle: 'triceps',
    exercises: [
      { name: 'Tríceps Testa', sets: 4, reps: '8-12' },
      { name: 'Tríceps Francês', sets: 3, reps: '10-12' },
      { name: 'Tríceps Corda', sets: 3, reps: '12-15' },
      { name: 'Mergulho no Banco', sets: 3, reps: '12-15' }
    ]
  },
  {
    id: 'lib-10',
    name: 'Pernas Posterior',
    muscle: 'pernas',
    exercises: [
      { name: 'Stiff', sets: 4, reps: '8-12' },
      { name: 'Mesa Flexora', sets: 3, reps: '10-12' },
      { name: 'Good Morning', sets: 3, reps: '12' },
      { name: 'Elevação Pélvica', sets: 3, reps: '12-15' },
      { name: 'Panturrilha Sentado', sets: 4, reps: '15-20' }
    ]
  }
];

const DAILY_TIPS = [
  "Hidrate-se bem! Beba água antes, durante e depois do treino.",
  "O descanso é tão importante quanto o treino. Músculos crescem na recuperação.",
  "Priorize a técnica correta. Qualidade > quantidade de peso.",
  "Coma proteína em todas as refeições para maximizar a recuperação muscular.",
  "Durma 7-9 horas por noite. Sono ruim sabota seus resultados.",
  "Consistência vence intensidade. Treine regularmente, mesmo que leve.",
  "Faça um aquecimento de 5-10 minutos antes de cada treino.",
  "Registre seus treinos. O que é medido, é melhorado.",
  "Varie os exercícios a cada 6-8 semanas para evitar platôs.",
  "Coma carboidratos complexos antes do treino para ter energia.",
  "Alongue após o treino para melhorar a flexibilidade e reduzir dores.",
  "Não pule o dia de pernas! Elas são a base da força.",
  "Escute o seu corpo. Dor articular ≠ dor muscular.",
  "Treine com um parceiro. Motivação e segurança aumentam juntos.",
  "A progressão de carga é a chave do crescimento muscular."
];

const WEEK_DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const WEEK_DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
