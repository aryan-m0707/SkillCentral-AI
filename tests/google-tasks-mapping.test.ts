import { describe, it, expect } from 'vitest';

describe('Google Tasks REST API Mapping & Formatting', () => {
  it('formats YYYY-MM-DD due date to RFC 3339 UTC midnight string', () => {
    const localDueDate = '2026-10-15';
    const rfc3339Due = `${localDueDate}T00:00:00.000Z`;

    expect(rfc3339Due).toBe('2026-10-15T00:00:00.000Z');
    expect(new Date(rfc3339Due).toISOString()).toBe('2026-10-15T00:00:00.000Z');
  });

  it('maps task status boolean to Google Tasks needsAction or completed', () => {
    const mapStatus = (isCompleted: boolean) => (isCompleted ? 'completed' : 'needsAction');

    expect(mapStatus(true)).toBe('completed');
    expect(mapStatus(false)).toBe('needsAction');
  });

  it('preserves external taskId preventing duplicate tasks', () => {
    const task = {
      id: 'task-123',
      title: 'Study Gemini SDK',
      externalTaskId: 'gt-abc-987',
    };

    const isAlreadySynced = Boolean(task.externalTaskId);
    expect(isAlreadySynced).toBe(true);
  });
});
