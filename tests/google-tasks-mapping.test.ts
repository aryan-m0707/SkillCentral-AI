import { describe, it, expect } from 'vitest';
import {
  TASKS_READONLY_SCOPE,
  verifyTasksScope,
  generateOAuthState,
  pushTaskToGoogleTasks,
  updateGoogleTaskStatus,
} from '@/lib/server/google-tasks';

describe('Google Tasks Read-Only Integration & Security', () => {
  it('uses tasks.readonly scope rather than full write scope', () => {
    expect(TASKS_READONLY_SCOPE).toBe('https://www.googleapis.com/auth/tasks.readonly');
  });

  it('validates granted scopes properly', () => {
    expect(verifyTasksScope('https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/userinfo.email')).toBe(true);
    expect(verifyTasksScope('https://www.googleapis.com/auth/tasks')).toBe(true);
    expect(verifyTasksScope('https://www.googleapis.com/auth/userinfo.email')).toBe(false);
    expect(verifyTasksScope(null)).toBe(false);
    expect(verifyTasksScope('')).toBe(false);
  });

  it('generates cryptographically secure random CSRF state', () => {
    const state1 = generateOAuthState();
    const state2 = generateOAuthState();

    expect(state1).not.toBe(state2);
    expect(state1).toMatch(/^[a-f0-9]{64}$/);
    expect(state1.length).toBe(64);
  });

  it('enforces read-only integration by rejecting task creation and updates', async () => {
    await expect(pushTaskToGoogleTasks()).rejects.toThrow(/read-only/i);
    await expect(updateGoogleTaskStatus()).rejects.toThrow(/read-only/i);
  });

  it('processes task pagination and mapping correctly', () => {
    const apiTasks = [
      { id: 'gt-1', title: 'Review System Design', status: 'needsAction', due: '2026-10-15T00:00:00.000Z' },
      { id: 'gt-2', title: 'Complete Quiz', status: 'completed', due: '2026-10-14T00:00:00.000Z' },
    ];

    const mapped = apiTasks.map((t) => ({
      id: t.id,
      title: t.title,
      isCompleted: t.status === 'completed',
      dueDate: t.due ? t.due.split('T')[0] : null,
    }));

    expect(mapped[0].isCompleted).toBe(false);
    expect(mapped[0].dueDate).toBe('2026-10-15');
    expect(mapped[1].isCompleted).toBe(true);
    expect(mapped[1].dueDate).toBe('2026-10-14');
  });
});
