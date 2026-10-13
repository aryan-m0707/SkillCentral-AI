'use client';

import {
  Sector,
  Skill,
  Topic,
  Resource,
  Note,
  Task,
  Quiz,
  QuizAttempt,
  StudySession,
  ActivityEvent,
  UserProfile,
  ChatMessage,
  ChatSession,
} from '@/types';
import {
  DEFAULT_SECTORS,
  DEMO_USER_ID,
  DEMO_SECTORS,
  DEMO_SKILLS,
  DEMO_TOPICS,
  DEMO_NOTES,
  DEMO_TASKS,
  DEMO_QUIZZES,
  DEMO_QUIZ_ATTEMPTS,
  DEMO_STUDY_SESSIONS,
  DEMO_ACTIVITY_EVENTS,
} from './constants';

const STORAGE_KEYS = {
  USER: 'skillcentral_user',
  SECTORS: 'skillcentral_sectors',
  SKILLS: 'skillcentral_skills',
  TOPICS: 'skillcentral_topics',
  RESOURCES: 'skillcentral_resources',
  NOTES: 'skillcentral_notes',
  TASKS: 'skillcentral_tasks',
  QUIZZES: 'skillcentral_quizzes',
  QUIZ_ATTEMPTS: 'skillcentral_quiz_attempts',
  STUDY_SESSIONS: 'skillcentral_study_sessions',
  ACTIVITY_EVENTS: 'skillcentral_activity_events',
  CHAT_SESSIONS: 'skillcentral_chat_sessions',
  IS_DEMO: 'skillcentral_is_demo',
};

// Safe localStorage accessor
function getLocalItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Failed to parse ${key} from localStorage:`, e);
    return fallback;
  }
}

function setLocalItem<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
  }
}

export const StorageEngine = {
  // Initialization & Workspace Data
  initUser(user?: Partial<UserProfile>): UserProfile {
    const existing = getLocalItem<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (existing) {
      if (existing.settings?.demoMode) {
        existing.settings = { ...existing.settings, demoMode: false };
        setLocalItem(STORAGE_KEYS.USER, existing);
      }
      this.seedInitialData(existing.uid);
      return existing;
    }

    const defaultProfile: UserProfile = {
      uid: user?.uid || DEMO_USER_ID,
      email: user?.email || 'alex.learner@skillcentral.dev',
      displayName: user?.displayName || 'Alex Learner',
      photoURL: user?.photoURL,
      isDemoUser: false,
      createdAt: new Date().toISOString(),
      settings: {
        theme: 'light',
        demoMode: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      },
      integrations: {
        googleTasks: {
          connected: false,
        },
      },
    };

    setLocalItem(STORAGE_KEYS.USER, defaultProfile);
    this.seedInitialData(defaultProfile.uid);
    return defaultProfile;
  },

  getCurrentUser(): UserProfile {
    return this.initUser();
  },

  updateUserProfile(updates: Partial<UserProfile>): UserProfile {
    const current = this.getCurrentUser();
    const updated = { ...current, ...updates };
    setLocalItem(STORAGE_KEYS.USER, updated);
    return updated;
  },

  seedInitialData(userId: string): void {
    const sectors = getLocalItem<Sector[]>(STORAGE_KEYS.SECTORS, []);
    const skills = getLocalItem<Skill[]>(STORAGE_KEYS.SKILLS, []);

    // Automatically seed rich sample dataset if empty or uninitialized
    if (sectors.length === 0 || skills.length === 0) {
      setLocalItem(STORAGE_KEYS.SECTORS, DEMO_SECTORS);
      setLocalItem(STORAGE_KEYS.SKILLS, DEMO_SKILLS);
      setLocalItem(STORAGE_KEYS.TOPICS, DEMO_TOPICS);
      setLocalItem(STORAGE_KEYS.NOTES, DEMO_NOTES);
      setLocalItem(STORAGE_KEYS.TASKS, DEMO_TASKS);
      setLocalItem(STORAGE_KEYS.QUIZZES, DEMO_QUIZZES);
      setLocalItem(STORAGE_KEYS.QUIZ_ATTEMPTS, DEMO_QUIZ_ATTEMPTS);
      setLocalItem(STORAGE_KEYS.STUDY_SESSIONS, DEMO_STUDY_SESSIONS);
      setLocalItem(STORAGE_KEYS.ACTIVITY_EVENTS, DEMO_ACTIVITY_EVENTS);
    }
  },

  resetToDemoData(): void {
    setLocalItem(STORAGE_KEYS.SECTORS, DEMO_SECTORS);
    setLocalItem(STORAGE_KEYS.SKILLS, DEMO_SKILLS);
    setLocalItem(STORAGE_KEYS.TOPICS, DEMO_TOPICS);
    setLocalItem(STORAGE_KEYS.NOTES, DEMO_NOTES);
    setLocalItem(STORAGE_KEYS.TASKS, DEMO_TASKS);
    setLocalItem(STORAGE_KEYS.QUIZZES, DEMO_QUIZZES);
    setLocalItem(STORAGE_KEYS.QUIZ_ATTEMPTS, DEMO_QUIZ_ATTEMPTS);
    setLocalItem(STORAGE_KEYS.STUDY_SESSIONS, DEMO_STUDY_SESSIONS);
    setLocalItem(STORAGE_KEYS.ACTIVITY_EVENTS, DEMO_ACTIVITY_EVENTS);
    const user = this.getCurrentUser();
    this.updateUserProfile({ settings: { ...user.settings, demoMode: false } });
  },

  clearAllData(): void {
    const user = this.getCurrentUser();
    const cleanSectors = DEFAULT_SECTORS.map((s) => ({ ...s, userId: user.uid }));
    setLocalItem(STORAGE_KEYS.SECTORS, cleanSectors);
    setLocalItem(STORAGE_KEYS.SKILLS, []);
    setLocalItem(STORAGE_KEYS.TOPICS, []);
    setLocalItem(STORAGE_KEYS.RESOURCES, []);
    setLocalItem(STORAGE_KEYS.NOTES, []);
    setLocalItem(STORAGE_KEYS.TASKS, []);
    setLocalItem(STORAGE_KEYS.QUIZZES, []);
    setLocalItem(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
    setLocalItem(STORAGE_KEYS.STUDY_SESSIONS, []);
    setLocalItem(STORAGE_KEYS.ACTIVITY_EVENTS, []);
    setLocalItem(STORAGE_KEYS.CHAT_SESSIONS, []);
    this.updateUserProfile({ isDemoUser: false, settings: { ...user.settings, demoMode: false } });
  },

  // Sectors CRUD
  getSectors(includeArchived = false): Sector[] {
    const sectors = getLocalItem<Sector[]>(STORAGE_KEYS.SECTORS, []);
    const filtered = includeArchived ? sectors : sectors.filter((s) => !s.archived);
    return filtered.sort((a, b) => a.rank - b.rank);
  },

  getSectorById(id: string): Sector | undefined {
    const sectors = getLocalItem<Sector[]>(STORAGE_KEYS.SECTORS, []);
    return sectors.find((s) => s.id === id);
  },

  saveSector(sector: Partial<Sector> & { name: string; color: string; icon: string }): Sector {
    const sectors = getLocalItem<Sector[]>(STORAGE_KEYS.SECTORS, []);
    const user = this.getCurrentUser();

    if (sector.id) {
      // Update
      const index = sectors.findIndex((s) => s.id === sector.id);
      if (index >= 0) {
        const updated: Sector = {
          ...sectors[index]!,
          ...sector,
          updatedAt: new Date().toISOString(),
        };
        sectors[index] = updated;
        setLocalItem(STORAGE_KEYS.SECTORS, sectors);
        return updated;
      }
    }

    // Create
    const maxRank = sectors.reduce((max, s) => Math.max(max, s.rank || 0), 0);
    const newSector: Sector = {
      id: sector.id || `sec-${Date.now()}`,
      name: sector.name,
      color: sector.color,
      icon: sector.icon,
      rank: maxRank + 1,
      archived: false,
      description: sector.description || '',
      userId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sectors.push(newSector);
    setLocalItem(STORAGE_KEYS.SECTORS, sectors);
    return newSector;
  },

  deleteSector(sectorId: string): boolean {
    const sectors = getLocalItem<Sector[]>(STORAGE_KEYS.SECTORS, []);
    const remaining = sectors.filter((s) => s.id !== sectorId);
    setLocalItem(STORAGE_KEYS.SECTORS, remaining);
    return true;
  },

  reorderSectors(sectorIds: string[]): Sector[] {
    const sectors = getLocalItem<Sector[]>(STORAGE_KEYS.SECTORS, []);
    const map = new Map(sectors.map((s) => [s.id, s]));
    const updated: Sector[] = [];

    sectorIds.forEach((id, index) => {
      const sec = map.get(id);
      if (sec) {
        sec.rank = index + 1;
        updated.push(sec);
        map.delete(id);
      }
    });

    // append any missing
    map.forEach((sec) => updated.push(sec));
    setLocalItem(STORAGE_KEYS.SECTORS, updated);
    return updated.sort((a, b) => a.rank - b.rank);
  },

  // Skills & Topics CRUD
  getSkills(sectorId?: string): Skill[] {
    const skills = getLocalItem<Skill[]>(STORAGE_KEYS.SKILLS, []);
    return sectorId ? skills.filter((s) => s.sectorId === sectorId) : skills;
  },

  saveSkill(skill: Partial<Skill> & { sectorId: string; title: string }): Skill {
    const skills = getLocalItem<Skill[]>(STORAGE_KEYS.SKILLS, []);
    const user = this.getCurrentUser();

    if (skill.id) {
      const idx = skills.findIndex((s) => s.id === skill.id);
      if (idx >= 0) {
        const updated = { ...skills[idx]!, ...skill };
        skills[idx] = updated;
        setLocalItem(STORAGE_KEYS.SKILLS, skills);
        return updated;
      }
    }

    const newSkill: Skill = {
      id: skill.id || `skill-${Date.now()}`,
      sectorId: skill.sectorId,
      title: skill.title,
      description: skill.description || '',
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };
    skills.push(newSkill);
    setLocalItem(STORAGE_KEYS.SKILLS, skills);
    return newSkill;
  },

  getTopics(skillId?: string): Topic[] {
    const topics = getLocalItem<Topic[]>(STORAGE_KEYS.TOPICS, []);
    return skillId ? topics.filter((t) => t.skillId === skillId) : topics;
  },

  saveTopic(topic: Partial<Topic> & { skillId: string; sectorId: string; title: string }): Topic {
    const topics = getLocalItem<Topic[]>(STORAGE_KEYS.TOPICS, []);
    const user = this.getCurrentUser();

    if (topic.id) {
      const idx = topics.findIndex((t) => t.id === topic.id);
      if (idx >= 0) {
        const updated = { ...topics[idx]!, ...topic };
        topics[idx] = updated;
        setLocalItem(STORAGE_KEYS.TOPICS, topics);
        return updated;
      }
    }

    const newTopic: Topic = {
      id: topic.id || `topic-${Date.now()}`,
      skillId: topic.skillId,
      sectorId: topic.sectorId,
      title: topic.title,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };
    topics.push(newTopic);
    setLocalItem(STORAGE_KEYS.TOPICS, topics);
    return newTopic;
  },

  // Resources CRUD
  getResources(sectorId?: string): Resource[] {
    const resources = getLocalItem<Resource[]>(STORAGE_KEYS.RESOURCES, []);
    return sectorId ? resources.filter((r) => r.sectorId === sectorId) : resources;
  },

  saveResource(resource: Omit<Resource, 'id' | 'createdAt' | 'userId'> & { id?: string }): Resource {
    const resources = getLocalItem<Resource[]>(STORAGE_KEYS.RESOURCES, []);
    const user = this.getCurrentUser();

    if (resource.id) {
      const idx = resources.findIndex((r) => r.id === resource.id);
      if (idx >= 0) {
        const updated = { ...resources[idx]!, ...resource };
        resources[idx] = updated;
        setLocalItem(STORAGE_KEYS.RESOURCES, resources);
        return updated;
      }
    }

    const newResource: Resource = {
      ...resource,
      id: resource.id || `res-${Date.now()}`,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };
    resources.push(newResource);
    setLocalItem(STORAGE_KEYS.RESOURCES, resources);
    return newResource;
  },

  // Notes CRUD
  getNotes(filter?: { sectorId?: string; tag?: string; search?: string }): Note[] {
    let notes = getLocalItem<Note[]>(STORAGE_KEYS.NOTES, []);
    if (filter?.sectorId) {
      notes = notes.filter((n) => n.sectorId === filter.sectorId);
    }
    if (filter?.tag) {
      notes = notes.filter((n) => n.tags.includes(filter.tag!));
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      notes = notes.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    return notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getNoteById(id: string): Note | undefined {
    const notes = getLocalItem<Note[]>(STORAGE_KEYS.NOTES, []);
    return notes.find((n) => n.id === id);
  },

  saveNote(note: Partial<Note> & { sectorId: string; title: string; content: string }): Note {
    const notes = getLocalItem<Note[]>(STORAGE_KEYS.NOTES, []);
    const user = this.getCurrentUser();
    const now = new Date().toISOString();

    if (note.id) {
      const idx = notes.findIndex((n) => n.id === note.id);
      if (idx >= 0) {
        const updated: Note = {
          ...notes[idx]!,
          ...note,
          updatedAt: now,
        };
        notes[idx] = updated;
        setLocalItem(STORAGE_KEYS.NOTES, notes);
        return updated;
      }
    }

    const newNote: Note = {
      id: note.id || `note-${Date.now()}`,
      sectorId: note.sectorId,
      skillId: note.skillId,
      topicId: note.topicId,
      resourceId: note.resourceId,
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      sourceUrl: note.sourceUrl,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    };

    notes.push(newNote);
    setLocalItem(STORAGE_KEYS.NOTES, notes);

    // Track activity event
    this.recordActivityEvent({
      type: 'note_created',
      sectorId: newNote.sectorId,
      metadata: { noteId: newNote.id, title: newNote.title },
    });

    return newNote;
  },

  deleteNote(id: string): boolean {
    const notes = getLocalItem<Note[]>(STORAGE_KEYS.NOTES, []);
    const remaining = notes.filter((n) => n.id !== id);
    setLocalItem(STORAGE_KEYS.NOTES, remaining);
    return true;
  },

  // Tasks CRUD
  getTasks(filter?: { sectorId?: string; status?: Task['status'] }): Task[] {
    let tasks = getLocalItem<Task[]>(STORAGE_KEYS.TASKS, []);
    if (filter?.sectorId) {
      tasks = tasks.filter((t) => t.sectorId === filter.sectorId);
    }
    if (filter?.status) {
      tasks = tasks.filter((t) => t.status === filter.status);
    }
    return tasks.sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  },

  saveTask(task: Partial<Task> & { title: string; sectorId: string }): Task {
    const tasks = getLocalItem<Task[]>(STORAGE_KEYS.TASKS, []);
    const user = this.getCurrentUser();
    const now = new Date().toISOString();

    if (task.id) {
      const idx = tasks.findIndex((t) => t.id === task.id);
      if (idx >= 0) {
        const old = tasks[idx]!;
        const isCompletingNow = task.status === 'completed' && old.status !== 'completed';
        const updated: Task = {
          ...old,
          ...task,
          completedAt: isCompletingNow ? now : (task.status !== 'completed' ? undefined : old.completedAt),
          updatedAt: now,
        };
        tasks[idx] = updated;
        setLocalItem(STORAGE_KEYS.TASKS, tasks);

        if (isCompletingNow) {
          this.recordActivityEvent({
            type: 'task_completed',
            sectorId: updated.sectorId,
            metadata: { taskId: updated.id, title: updated.title },
          });
        }
        return updated;
      }
    }

    const newTask: Task = {
      id: task.id || `task-${Date.now()}`,
      title: task.title,
      details: task.details || '',
      sectorId: task.sectorId,
      skillId: task.skillId,
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      dueDate: task.dueDate,
      timeBlockStart: task.timeBlockStart,
      timeBlockEnd: task.timeBlockEnd,
      linkedResourceId: task.linkedResourceId,
      externalTaskId: task.externalTaskId,
      externalListId: task.externalListId,
      completedAt: task.status === 'completed' ? now : undefined,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    };

    tasks.push(newTask);
    setLocalItem(STORAGE_KEYS.TASKS, tasks);
    return newTask;
  },

  deleteTask(id: string): boolean {
    const tasks = getLocalItem<Task[]>(STORAGE_KEYS.TASKS, []);
    const remaining = tasks.filter((t) => t.id !== id);
    setLocalItem(STORAGE_KEYS.TASKS, remaining);
    return true;
  },

  // Quizzes & Attempts
  getQuizzes(sectorId?: string): Quiz[] {
    const quizzes = getLocalItem<Quiz[]>(STORAGE_KEYS.QUIZZES, []);
    return sectorId ? quizzes.filter((q) => q.sectorId === sectorId) : quizzes;
  },

  getQuizById(id: string): Quiz | undefined {
    const quizzes = getLocalItem<Quiz[]>(STORAGE_KEYS.QUIZZES, []);
    return quizzes.find((q) => q.id === id);
  },

  saveQuiz(quiz: Omit<Quiz, 'id' | 'createdAt' | 'userId'> & { id?: string }): Quiz {
    const quizzes = getLocalItem<Quiz[]>(STORAGE_KEYS.QUIZZES, []);
    const user = this.getCurrentUser();
    const newQuiz: Quiz = {
      ...quiz,
      id: quiz.id || `quiz-${Date.now()}`,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };
    quizzes.push(newQuiz);
    setLocalItem(STORAGE_KEYS.QUIZZES, quizzes);
    return newQuiz;
  },

  getQuizAttempts(sectorId?: string): QuizAttempt[] {
    const attempts = getLocalItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
    return sectorId ? attempts.filter((a) => a.sectorId === sectorId) : attempts;
  },

  recordQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'userId'>): QuizAttempt {
    const attempts = getLocalItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
    const user = this.getCurrentUser();
    const newAttempt: QuizAttempt = {
      ...attempt,
      id: `attempt-${Date.now()}`,
      userId: user.uid,
    };
    attempts.push(newAttempt);
    setLocalItem(STORAGE_KEYS.QUIZ_ATTEMPTS, attempts);

    this.recordActivityEvent({
      type: 'quiz_completed',
      sectorId: newAttempt.sectorId,
      metadata: { score: newAttempt.score, correctCount: newAttempt.correctCount },
    });

    return newAttempt;
  },

  // Study Sessions
  getStudySessions(sectorId?: string): StudySession[] {
    const sessions = getLocalItem<StudySession[]>(STORAGE_KEYS.STUDY_SESSIONS, []);
    return sectorId ? sessions.filter((s) => s.sectorId === sectorId) : sessions;
  },

  recordStudySession(session: Omit<StudySession, 'id' | 'userId'>): StudySession {
    const sessions = getLocalItem<StudySession[]>(STORAGE_KEYS.STUDY_SESSIONS, []);
    const user = this.getCurrentUser();
    const newSession: StudySession = {
      ...session,
      id: `sess-${Date.now()}`,
      userId: user.uid,
    };
    sessions.push(newSession);
    setLocalItem(STORAGE_KEYS.STUDY_SESSIONS, sessions);

    this.recordActivityEvent({
      type: 'study_session',
      sectorId: newSession.sectorId,
      metadata: { minutes: newSession.durationMinutes },
    });

    return newSession;
  },

  // Activity Events
  getActivityEvents(days = 30): ActivityEvent[] {
    const events = getLocalItem<ActivityEvent[]>(STORAGE_KEYS.ACTIVITY_EVENTS, []);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return events.filter((e) => new Date(e.timestamp) >= cutoff);
  },

  recordActivityEvent(event: Omit<ActivityEvent, 'id' | 'timestamp' | 'userId'>): ActivityEvent {
    const events = getLocalItem<ActivityEvent[]>(STORAGE_KEYS.ACTIVITY_EVENTS, []);
    const user = this.getCurrentUser();
    const newEvent: ActivityEvent = {
      ...event,
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.uid,
    };
    events.push(newEvent);
    setLocalItem(STORAGE_KEYS.ACTIVITY_EVENTS, events);
    return newEvent;
  },

  // Chat History
  getChatSessions(): ChatSession[] {
    return getLocalItem<ChatSession[]>(STORAGE_KEYS.CHAT_SESSIONS, []);
  },

  saveChatSession(session: ChatSession): void {
    const sessions = getLocalItem<ChatSession[]>(STORAGE_KEYS.CHAT_SESSIONS, []);
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.push(session);
    }
    setLocalItem(STORAGE_KEYS.CHAT_SESSIONS, sessions);
  },

  // Analytics & Metric Calculations
  calculateStreak(): number {
    const events = getLocalItem<ActivityEvent[]>(STORAGE_KEYS.ACTIVITY_EVENTS, []);
    if (events.length === 0) return 0;

    // Extract unique active calendar dates (YYYY-MM-DD in local time)
    const activeDates = new Set(
      events.map((e) => {
        const d = new Date(e.timestamp);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    );

    let streak = 0;
    const today = new Date();
    let checkDate = new Date(today);

    const toStr = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // If today is active, streak includes today
    if (activeDates.has(toStr(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Check if yesterday was active (allowing current day in progress)
      checkDate.setDate(checkDate.getDate() - 1);
      if (!activeDates.has(toStr(checkDate))) {
        return 0;
      }
    }

    // Count backwards
    while (activeDates.has(toStr(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  },

  calculateFocusHoursThisWeek(): number {
    const sessions = getLocalItem<StudySession[]>(STORAGE_KEYS.STUDY_SESSIONS, []);
    const now = new Date();
    // Monday of current week
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const weekMinutes = sessions
      .filter((s) => new Date(s.completedAt) >= startOfWeek)
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    return Number((weekMinutes / 60).toFixed(1));
  },

  calculateMasteryScore(sectorId?: string): { score: number | null; totalAttempts: number } {
    const attempts = this.getQuizAttempts(sectorId);
    if (attempts.length === 0) {
      return { score: null, totalAttempts: 0 };
    }
    const sum = attempts.reduce((acc, a) => acc + a.score, 0);
    return {
      score: Math.round(sum / attempts.length),
      totalAttempts: attempts.length,
    };
  },

  calculateTaskCompletionRate(sectorId?: string): { completed: number; total: number; rate: number } {
    const tasks = this.getTasks(sectorId ? { sectorId } : undefined);
    if (tasks.length === 0) return { completed: 0, total: 0, rate: 0 };
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return {
      completed,
      total: tasks.length,
      rate: Math.round((completed / tasks.length) * 100),
    };
  },
};
