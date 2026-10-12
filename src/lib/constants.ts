import { Sector, Skill, Topic, Note, Task, Quiz, QuizAttempt, StudySession, ActivityEvent } from '@/types';

export const DEFAULT_SECTORS: Omit<Sector, 'userId'>[] = [
  {
    id: 'sec-academics',
    name: 'Academics',
    color: '#7566F1',
    icon: 'GraduationCap',
    rank: 1,
    archived: false,
    description: 'Subjects, academic course notes, lecture quizzes, and assignments.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sec-languages',
    name: 'Language Learning',
    color: '#19B7A3',
    icon: 'Languages',
    rank: 2,
    archived: false,
    description: 'Target vocabulary, grammar drills, listening practice, and spoken exercises.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sec-specialization',
    name: 'Specialization',
    color: '#3B82F6',
    icon: 'Cpu',
    rank: 3,
    archived: false,
    description: 'Career roadmaps, systems design, cloud architectures, and certifications.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sec-hobbies',
    name: 'Hobbies',
    color: '#F6A54A',
    icon: 'Palette',
    rank: 4,
    archived: false,
    description: 'Creative interests, music, chess, photography, and personal craft milestones.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sec-daily-tasks',
    name: 'Daily Tasks',
    color: '#EF6D91',
    icon: 'CheckSquare',
    rank: 5,
    archived: false,
    description: 'Daily execution routines, productivity habits, reminders, and daily consistency.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const SECTOR_ICONS = [
  'GraduationCap',
  'Languages',
  'Cpu',
  'Palette',
  'CheckSquare',
  'BookOpen',
  'Code',
  'Globe',
  'Compass',
  'Sparkles',
  'Music',
  'Activity',
  'Flame',
  'Target',
  'Layers',
];

export const SECTOR_COLORS = [
  '#7566F1', // Academics
  '#19B7A3', // Languages
  '#3B82F6', // Specialization
  '#F6A54A', // Hobbies
  '#EF6D91', // Daily Tasks
  '#8B5CF6', // Purple
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#EC4899', // Pink
];

// Helper to generate past dates
const daysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

const daysAgoIso = (days: number, hour = 14): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 30, 0, 0);
  return d.toISOString();
};

export const DEMO_USER_ID = 'demo-user-skillcentral';

export const DEMO_SECTORS: Sector[] = DEFAULT_SECTORS.map((s) => ({
  ...s,
  userId: DEMO_USER_ID,
}));

export const DEMO_SKILLS: Skill[] = [
  {
    id: 'skill-cs50',
    sectorId: 'sec-academics',
    title: 'Distributed Systems & Cloud Computing',
    description: 'Consensus protocols, CAP theorem, and event-driven microservices.',
    userId: DEMO_USER_ID,
  },
  {
    id: 'skill-japanese',
    sectorId: 'sec-languages',
    title: 'Japanese JLPT N4',
    description: 'Kanji retention, conversational grammar particles, and shadow listening.',
    userId: DEMO_USER_ID,
  },
  {
    id: 'skill-ml',
    sectorId: 'sec-specialization',
    title: 'LLM Fine-Tuning & Multi-Agent Architecture',
    description: 'Gemini 2.5 Flash, RAG pipeline construction, and evaluation metrics.',
    userId: DEMO_USER_ID,
  },
  {
    id: 'skill-piano',
    sectorId: 'sec-hobbies',
    title: 'Jazz Improvisation & Piano',
    description: 'ii-V-I progressions, modal chord substitutions, and ear transcription.',
    userId: DEMO_USER_ID,
  },
];

export const DEMO_TOPICS: Topic[] = [
  {
    id: 'topic-raft',
    skillId: 'skill-cs50',
    sectorId: 'sec-academics',
    title: 'Raft Consensus Algorithm',
    userId: DEMO_USER_ID,
  },
  {
    id: 'topic-te-form',
    skillId: 'skill-japanese',
    sectorId: 'sec-languages',
    title: 'Te-Form Verbs & Connecting Sentences',
    userId: DEMO_USER_ID,
  },
  {
    id: 'topic-gemini-sdk',
    skillId: 'skill-ml',
    sectorId: 'sec-specialization',
    title: 'Official @google/genai SDK Integration',
    userId: DEMO_USER_ID,
  },
];

export const DEMO_NOTES: Note[] = [
  {
    id: 'note-1',
    sectorId: 'sec-specialization',
    skillId: 'skill-ml',
    topicId: 'topic-gemini-sdk',
    title: 'Gemini 2.5 Flash Multimodal Ingestion Patterns',
    content: `# Gemini 2.5 Flash Multimodal Ingestion Patterns
    
## Core Architecture
The official \`@google/genai\` SDK supports sending direct public video references and structured JSON schema generation.

### Key Guidelines
- Always validate outputs server-side using strict schema parsing.
- Provide honest fallback routes if quota or regional video tokens are restricted.
- Use explicit chunk references when citing note bodies for grounded Q&A.
- Keep prompt tokens focused by extracting relevant summaries before synthesis.`,
    tags: ['Gemini', 'GoogleCloud', 'AI', 'Architecture'],
    userId: DEMO_USER_ID,
    createdAt: daysAgoIso(2),
    updatedAt: daysAgoIso(1),
  },
  {
    id: 'note-2',
    sectorId: 'sec-academics',
    skillId: 'skill-cs50',
    topicId: 'topic-raft',
    title: 'Raft Consensus Protocol: Leader Election & Log Replication',
    content: `# Raft Consensus Protocol

## Leader Election
1. Nodes start as **Followers**.
2. If heartbeat timeout triggers (150ms-300ms randomized), node becomes a **Candidate**.
3. Candidate requests votes from peers. A majority (N/2 + 1) elects the Leader.

## Split Brain Prevention
- Randomized election timers prevent simultaneous candidates.
- Term numbers ensure stale leaders immediately yield.`,
    tags: ['DistributedSystems', 'Raft', 'ComputerScience'],
    userId: DEMO_USER_ID,
    createdAt: daysAgoIso(5),
    updatedAt: daysAgoIso(3),
  },
  {
    id: 'note-3',
    sectorId: 'sec-languages',
    skillId: 'skill-japanese',
    topicId: 'topic-te-form',
    title: 'Japanese Verb Conjugation: The Te-Form (て形)',
    content: `# The Te-Form (て形)

The Te-form acts like the "and" conjunction between clauses and allows creating continuous aspect (〜ている) and polite requests (〜てください).

## Group 1 (Godan Verbs)
- う、つ、る → って (e.g. 買う → 買って)
- む、ぶ、ぬ → んで (e.g. 読む → 読んで)
- く → いて (e.g. 書く → 書いて; Exception: 行く → 行って)
- ぐ → いで (e.g. 泳ぐ → 泳いで)
- す → して (e.g. 話す → 話して)`,
    tags: ['Japanese', 'Grammar', 'N4'],
    userId: DEMO_USER_ID,
    createdAt: daysAgoIso(8),
    updatedAt: daysAgoIso(8),
  },
];

export const DEMO_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Complete Google Cloud Run container verification',
    details: 'Verify Docker multi-stage build and health check probes on port 8080.',
    sectorId: 'sec-specialization',
    skillId: 'skill-ml',
    status: 'todo',
    priority: 'high',
    dueDate: daysAgo(-1), // tomorrow
    timeBlockStart: '10:00',
    timeBlockEnd: '11:30',
    userId: DEMO_USER_ID,
    createdAt: daysAgoIso(1),
    updatedAt: daysAgoIso(1),
  },
  {
    id: 'task-2',
    title: 'Daily Japanese Anki Review (50 cards)',
    details: 'Spaced repetition flashcards for N4 kanji and vocabulary.',
    sectorId: 'sec-languages',
    skillId: 'skill-japanese',
    status: 'completed',
    priority: 'medium',
    dueDate: daysAgo(0), // today
    timeBlockStart: '08:00',
    timeBlockEnd: '08:30',
    completedAt: daysAgoIso(0, 9),
    userId: DEMO_USER_ID,
    createdAt: daysAgoIso(2),
    updatedAt: daysAgoIso(0),
  },
  {
    id: 'task-3',
    title: 'Implement Raft heartbeat timeout simulator',
    details: 'Create a lightweight Node.js event emitter script modeling split election timers.',
    sectorId: 'sec-academics',
    skillId: 'skill-cs50',
    status: 'in_progress',
    priority: 'medium',
    dueDate: daysAgo(0),
    timeBlockStart: '15:00',
    timeBlockEnd: '16:30',
    userId: DEMO_USER_ID,
    createdAt: daysAgoIso(3),
    updatedAt: daysAgoIso(1),
  },
  {
    id: 'task-4',
    title: 'Jazz Piano: Transcribe Bill Evans Autumn Leaves solo',
    details: 'First 8 bars melody voicings and rhythmic accents.',
    sectorId: 'sec-hobbies',
    skillId: 'skill-piano',
    status: 'todo',
    priority: 'low',
    dueDate: daysAgo(-2),
    timeBlockStart: '19:00',
    timeBlockEnd: '20:00',
    userId: DEMO_USER_ID,
    createdAt: daysAgoIso(4),
    updatedAt: daysAgoIso(4),
  },
  {
    id: 'task-5',
    title: 'Review inbox & organize study schedule for next week',
    details: 'Clean up daily tasks, clear backlog, and align calendar blocks.',
    sectorId: 'sec-daily-tasks',
    status: 'completed',
    priority: 'medium',
    dueDate: daysAgo(1),
    completedAt: daysAgoIso(1, 18),
    userId: DEMO_USER_ID,
    createdAt: daysAgoIso(5),
    updatedAt: daysAgoIso(1),
  },
];

export const DEMO_QUIZZES: Quiz[] = [
  {
    id: 'quiz-1',
    sectorId: 'sec-specialization',
    title: 'Gemini Multimodal & Cloud Architecture Check',
    createdAt: daysAgoIso(4),
    userId: DEMO_USER_ID,
    questions: [
      {
        id: 'q1',
        question: 'Where should Gemini API calls be executed in a production Next.js architecture?',
        options: [
          'Directly in browser client components using public API keys',
          'Only from secure server route handlers or server actions',
          'In local storage scripts',
          'Inside service workers on the user machine',
        ],
        correctAnswerIndex: 1,
        explanation: 'Sensitive API keys and server logic must remain protected on server endpoints to prevent token exposure and permit server-side validation.',
      },
      {
        id: 'q2',
        question: 'What is a critical limitation of the Google Tasks REST API regarding due dates?',
        options: [
          'It only supports due dates in the year 2030',
          'It stores RFC 3339 date strings only and discards specific time-of-day',
          'It cannot store task titles',
          'It requires enterprise Google Workspace licenses for all operations',
        ],
        correctAnswerIndex: 1,
        explanation: 'The Google Tasks API `due` property strictly stores date (RFC 3339 formatted date-only), discarding time-of-day. SkillCentral maintains detailed local time-block scheduling.',
      },
      {
        id: 'q3',
        question: 'How does SkillCentral measure learning streak?',
        options: [
          'Randomly generated mock counter',
          'Consecutive local calendar days with a qualifying learning activity recorded in Firestore',
          'Number of tabs kept open',
          'Only by counting YouTube videos opened',
        ],
        correctAnswerIndex: 1,
        explanation: 'Streaks are strictly derived from true evidence: qualifying study sessions, quiz attempts, completed milestones, or task completions in the user local timezone.',
      },
      {
        id: 'q4',
        question: 'Which model SDK is the official Google recommended library for Gemini?',
        options: [
          '@google/genai',
          'unsupported-gemini-v1',
          'openai-gemini-adapter',
          'langchain-unverified',
        ],
        correctAnswerIndex: 0,
        explanation: '@google/genai is the official current Google Gen AI SDK for Node.js and TypeScript.',
      },
      {
        id: 'q5',
        question: 'What constitutes Knowledge Mastery in SkillCentral?',
        options: [
          'An arbitrary AI hallucination percentage',
          'Verified quiz accuracy and completed practice milestones based on real attempt records',
          'The number of characters typed in a note',
          'Amount of money spent on books',
        ],
        correctAnswerIndex: 1,
        explanation: 'Mastery is an empirical score calculated from recorded quiz attempts and verified milestones, never an arbitrary number.',
      },
    ],
  },
];

export const DEMO_QUIZ_ATTEMPTS: QuizAttempt[] = [
  {
    id: 'attempt-1',
    quizId: 'quiz-1',
    sectorId: 'sec-specialization',
    score: 80,
    totalQuestions: 5,
    correctCount: 4,
    selectedAnswers: [1, 1, 1, 0, 1],
    date: daysAgo(3),
    userId: DEMO_USER_ID,
  },
  {
    id: 'attempt-2',
    quizId: 'quiz-1',
    sectorId: 'sec-specialization',
    score: 100,
    totalQuestions: 5,
    correctCount: 5,
    selectedAnswers: [1, 1, 1, 0, 1],
    date: daysAgo(1),
    userId: DEMO_USER_ID,
  },
];

export const DEMO_STUDY_SESSIONS: StudySession[] = [
  {
    id: 'session-1',
    sectorId: 'sec-specialization',
    skillId: 'skill-ml',
    durationMinutes: 45,
    startedAt: daysAgoIso(0, 10),
    completedAt: daysAgoIso(0, 10),
    notes: 'Investigated Gemini API multimodal parameter schemas',
    userId: DEMO_USER_ID,
  },
  {
    id: 'session-2',
    sectorId: 'sec-languages',
    skillId: 'skill-japanese',
    durationMinutes: 30,
    startedAt: daysAgoIso(1, 14),
    completedAt: daysAgoIso(1, 14),
    notes: 'Anki review & te-form conjugation practice',
    userId: DEMO_USER_ID,
  },
  {
    id: 'session-3',
    sectorId: 'sec-academics',
    skillId: 'skill-cs50',
    durationMinutes: 60,
    startedAt: daysAgoIso(2, 16),
    completedAt: daysAgoIso(2, 17),
    notes: 'Raft consensus log matching property proofs',
    userId: DEMO_USER_ID,
  },
  {
    id: 'session-4',
    sectorId: 'sec-hobbies',
    skillId: 'skill-piano',
    durationMinutes: 40,
    startedAt: daysAgoIso(3, 19),
    completedAt: daysAgoIso(3, 19),
    notes: 'Autumn Leaves chord voicings',
    userId: DEMO_USER_ID,
  },
  {
    id: 'session-5',
    sectorId: 'sec-specialization',
    skillId: 'skill-ml',
    durationMinutes: 50,
    startedAt: daysAgoIso(4, 11),
    completedAt: daysAgoIso(4, 12),
    notes: 'Cloud Run service configuration testing',
    userId: DEMO_USER_ID,
  },
  {
    id: 'session-6',
    sectorId: 'sec-academics',
    skillId: 'skill-cs50',
    durationMinutes: 35,
    startedAt: daysAgoIso(5, 15),
    completedAt: daysAgoIso(5, 15),
    notes: 'Distributed snapshot algorithms',
    userId: DEMO_USER_ID,
  },
  {
    id: 'session-7',
    sectorId: 'sec-languages',
    skillId: 'skill-japanese',
    durationMinutes: 25,
    startedAt: daysAgoIso(6, 9),
    completedAt: daysAgoIso(6, 9),
    notes: 'Listening comprehension podcast',
    userId: DEMO_USER_ID,
  },
];

export const DEMO_ACTIVITY_EVENTS: ActivityEvent[] = [
  {
    id: 'evt-0',
    type: 'study_session',
    sectorId: 'sec-specialization',
    timestamp: daysAgoIso(0, 10),
    metadata: { minutes: 45 },
    userId: DEMO_USER_ID,
  },
  {
    id: 'evt-1',
    type: 'quiz_completed',
    sectorId: 'sec-specialization',
    timestamp: daysAgoIso(1, 16),
    metadata: { score: 100 },
    userId: DEMO_USER_ID,
  },
  {
    id: 'evt-2',
    type: 'task_completed',
    sectorId: 'sec-languages',
    timestamp: daysAgoIso(2, 9),
    metadata: { title: 'Daily Japanese Anki Review' },
    userId: DEMO_USER_ID,
  },
  {
    id: 'evt-3',
    type: 'study_session',
    sectorId: 'sec-academics',
    timestamp: daysAgoIso(3, 16),
    metadata: { minutes: 60 },
    userId: DEMO_USER_ID,
  },
  {
    id: 'evt-4',
    type: 'study_session',
    sectorId: 'sec-hobbies',
    timestamp: daysAgoIso(4, 19),
    metadata: { minutes: 40 },
    userId: DEMO_USER_ID,
  },
  {
    id: 'evt-5',
    type: 'study_session',
    sectorId: 'sec-specialization',
    timestamp: daysAgoIso(5, 11),
    metadata: { minutes: 50 },
    userId: DEMO_USER_ID,
  },
  {
    id: 'evt-6',
    type: 'study_session',
    sectorId: 'sec-academics',
    timestamp: daysAgoIso(6, 15),
    metadata: { minutes: 35 },
    userId: DEMO_USER_ID,
  },
  {
    id: 'evt-7',
    type: 'study_session',
    sectorId: 'sec-languages',
    timestamp: daysAgoIso(7, 9),
    metadata: { minutes: 25 },
    userId: DEMO_USER_ID,
  },
];
