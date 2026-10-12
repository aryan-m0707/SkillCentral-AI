export interface Sector {
  id: string;
  name: string;
  color: string;
  icon: string;
  rank: number;
  archived: boolean;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  sectorId: string;
  title: string;
  description?: string;
  userId: string;
  createdAt?: string;
}

export interface Topic {
  id: string;
  skillId: string;
  sectorId: string;
  title: string;
  userId: string;
  createdAt?: string;
}

export interface Resource {
  id: string;
  sectorId: string;
  topicId?: string;
  skillId?: string;
  type: 'youtube' | 'note' | 'article' | 'pdf';
  title: string;
  url?: string;
  thumbnailUrl?: string;
  sourceMetadata?: {
    channelTitle?: string;
    duration?: string;
    viewCount?: string;
    publishedAt?: string;
  };
  generatedSummary?: string;
  userId: string;
  createdAt: string;
}

export interface Note {
  id: string;
  resourceId?: string;
  sectorId: string;
  skillId?: string;
  topicId?: string;
  title: string;
  content: string; // Markdown text
  tags: string[];
  sourceUrl?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  sectorId: string;
  title: string;
  description?: string;
  targetDate?: string;
  progress: number; // 0 to 100
  milestones?: Milestone[];
  userId: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  details?: string;
  sectorId: string;
  skillId?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // YYYY-MM-DD
  timeBlockStart?: string; // HH:mm
  timeBlockEnd?: string; // HH:mm
  linkedResourceId?: string;
  externalTaskId?: string; // Google Tasks ID
  externalListId?: string; // Google Tasks List ID
  completedAt?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  sectorId: string;
  resourceId?: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: string;
  userId: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  sectorId: string;
  score: number; // 0 - 100
  totalQuestions: number;
  correctCount: number;
  selectedAnswers: number[];
  date: string;
  userId: string;
}

export interface StudySession {
  id: string;
  sectorId: string;
  skillId?: string;
  durationMinutes: number;
  startedAt: string;
  completedAt: string;
  notes?: string;
  userId: string;
}

export interface ActivityEvent {
  id: string;
  type: 'quiz_completed' | 'study_session' | 'task_completed' | 'note_created' | 'milestone_reached';
  sectorId: string;
  timestamp: string;
  metadata?: Record<string, any>;
  userId: string;
}

export interface SectorSnapshot {
  id: string;
  sectorId: string;
  date: string; // YYYY-MM-DD
  progressPercent: number;
  masteryScore: number;
  minutesInvested: number;
  tasksCompleted: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  sourcesCited?: Array<{
    noteId?: string;
    resourceId?: string;
    title: string;
    snippet: string;
  }>;
  suggestedTasks?: Array<{
    title: string;
    sectorId: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
  }>;
}

export interface ChatSession {
  id: string;
  userId: string;
  mode: 'explain' | 'brainstorm' | 'study_plan' | 'quiz_me' | 'summarize' | 'progress';
  sectorId?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  demoMode: boolean;
  timezone: string;
}

export interface GoogleTasksIntegration {
  connected: boolean;
  email?: string;
  lastSyncedAt?: string;
  defaultListId?: string;
  tasklistTitle?: string;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  isDemoUser?: boolean;
  createdAt: string;
  settings: UserSettings;
  integrations: {
    googleTasks: GoogleTasksIntegration;
  };
}

export interface YouTubeAnalysisResult {
  videoId: string;
  title: string;
  channelTitle?: string;
  thumbnailUrl: string;
  overview: string;
  coreConcepts: string[];
  detailedStudyNotes: string;
  keyTimestamps: Array<{ timestamp: string; label: string }>;
  beginnerExamples: string[];
  quiz: QuizQuestion[];
  suggestedTasks: Array<{ title: string; priority: 'low' | 'medium' | 'high' }>;
  topicTags: string[];
}
