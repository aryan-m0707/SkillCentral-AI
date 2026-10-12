import { NextRequest, NextResponse } from 'next/server';
import {
  listTaskLists,
  pushTaskToGoogleTasks,
  updateGoogleTaskStatus,
} from '@/lib/server/google-tasks';

export async function POST(req: NextRequest) {
  try {
    const tokensCookie = req.cookies.get('google_tasks_tokens')?.value;
    if (!tokensCookie) {
      return NextResponse.json(
        { error: 'Google Tasks is not connected. Please authorize via Google OAuth first.' },
        { status: 401 }
      );
    }

    const tokens = JSON.parse(tokensCookie);
    const body = await req.json();
    const { action, tasklistId, task, taskId, completed } = body;

    if (action === 'list_tasklists') {
      const tasklists = await listTaskLists(tokens);
      return NextResponse.json({ tasklists });
    }

    if (action === 'push_task') {
      if (!task || !task.title) {
        return NextResponse.json({ error: 'task object with title is required' }, { status: 400 });
      }

      // Default to '@default' tasklist if not provided
      const targetListId = tasklistId || '@default';
      const created = await pushTaskToGoogleTasks(tokens, targetListId, {
        title: task.title,
        details: task.details,
        dueDate: task.dueDate,
      });

      return NextResponse.json({
        success: true,
        externalTaskId: created.id,
        externalListId: targetListId,
        updated: created.updated,
      });
    }

    if (action === 'patch_task') {
      if (!taskId) {
        return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
      }
      const targetListId = tasklistId || '@default';
      const updated = await updateGoogleTaskStatus(tokens, targetListId, taskId, Boolean(completed));
      return NextResponse.json({ success: true, updated });
    }

    if (action === 'disconnect') {
      const response = NextResponse.json({ success: true, message: 'Disconnected Google Tasks' });
      response.cookies.delete('google_tasks_tokens');
      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API/integrations/google-tasks/sync] Error:', err);
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 });
  }
}
