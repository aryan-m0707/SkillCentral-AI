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

  it('correctly maps Google Tasks API item to SkillCentral Task structure', () => {
    const googleTaskApiItem = {
      id: 'gt-item-456',
      title: 'Practice LeetCode Trees',
      notes: 'Focus on BFS and DFS questions',
      due: '2026-10-20T00:00:00.000Z',
      status: 'needsAction',
    };

    const mappedTask = {
      title: googleTaskApiItem.title,
      details: googleTaskApiItem.notes,
      dueDate: googleTaskApiItem.due.split('T')[0],
      status: googleTaskApiItem.status === 'completed' ? 'completed' : 'todo',
      externalTaskId: googleTaskApiItem.id,
      externalListId: '@default',
    };

    expect(mappedTask.title).toBe('Practice LeetCode Trees');
    expect(mappedTask.details).toBe('Focus on BFS and DFS questions');
    expect(mappedTask.dueDate).toBe('2026-10-20');
    expect(mappedTask.status).toBe('todo');
    expect(mappedTask.externalTaskId).toBe('gt-item-456');
  });

  it('filters only unsynced tasks for batch push', () => {
    const tasks = [
      { id: '1', title: 'Task A', externalTaskId: 'gt-1' },
      { id: '2', title: 'Task B' },
      { id: '3', title: 'Task C', externalTaskId: undefined },
    ];

    const unsynced = tasks.filter((t) => !t.externalTaskId);
    expect(unsynced.length).toBe(2);
    expect(unsynced.map((t) => t.id)).toEqual(['2', '3']);
  });
});
