import { NextRequest, NextResponse } from 'next/server';
import {
  listTaskLists,
  listTasks,
  TokenSet,
} from '@/lib/server/google-tasks';

function applyRefreshedTokens(response: NextResponse, refreshedTokens?: TokenSet) {
  if (refreshedTokens) {
    response.cookies.set('google_tasks_tokens', JSON.stringify(refreshedTokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const tokensCookie = req.cookies.get('google_tasks_tokens')?.value;
    if (!tokensCookie) {
      return NextResponse.json(
        { error: 'Google Tasks is not connected. Please authorize first.', requiresReconnect: true },
        { status: 401 }
      );
    }

    let tokens: TokenSet;
    try {
      tokens = JSON.parse(tokensCookie);
    } catch {
      const resp = NextResponse.json(
        { error: 'Invalid session tokens. Please reconnect.', requiresReconnect: true },
        { status: 401 }
      );
      resp.cookies.delete('google_tasks_tokens');
      return resp;
    }

    const { searchParams } = req.nextUrl;
    const tasklistId = searchParams.get('tasklistId') || '@default';
    const pageToken = searchParams.get('pageToken') || undefined;
    const maxResultsParam = searchParams.get('maxResults');
    const maxResults = maxResultsParam ? parseInt(maxResultsParam, 10) : 50;
    const showCompleted = searchParams.get('showCompleted') !== 'false';

    const result = await listTasks(tokens, tasklistId, {
      pageToken,
      maxResults,
      showCompleted,
    });

    const response = NextResponse.json({
      tasks: result.items,
      nextPageToken: result.nextPageToken,
      readOnly: true,
    });

    applyRefreshedTokens(response, result.refreshedTokens);
    return response;
  } catch (err: any) {
    const isAuthErr =
      err?.code === 'TOKEN_REFRESH_FAILED' ||
      err?.status === 401 ||
      String(err?.message || '').includes('invalid_grant');

    if (isAuthErr) {
      const resp = NextResponse.json(
        { error: 'Google Tasks session expired or revoked. Please reconnect.', requiresReconnect: true },
        { status: 401 }
      );
      resp.cookies.delete('google_tasks_tokens');
      return resp;
    }

    return NextResponse.json(
      { error: 'Failed to fetch tasks from Google Tasks API.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tokensCookie = req.cookies.get('google_tasks_tokens')?.value;
    if (!tokensCookie) {
      return NextResponse.json(
        { error: 'Google Tasks is not connected. Please authorize first.', requiresReconnect: true },
        { status: 401 }
      );
    }

    let tokens: TokenSet;
    try {
      tokens = JSON.parse(tokensCookie);
    } catch {
      const resp = NextResponse.json(
        { error: 'Invalid session tokens. Please reconnect.', requiresReconnect: true },
        { status: 401 }
      );
      resp.cookies.delete('google_tasks_tokens');
      return resp;
    }

    const body = await req.json().catch(() => ({}));
    const { action, tasklistId, pageToken, maxResults, showCompleted } = body;

    // Disconnect
    if (action === 'disconnect') {
      const response = NextResponse.json({ success: true, message: 'Disconnected Google Tasks' });
      response.cookies.delete('google_tasks_tokens');
      return response;
    }

    // Read: Task Lists
    if (action === 'list_tasklists') {
      const result = await listTaskLists(tokens, {
        pageToken: pageToken || undefined,
        maxResults: maxResults ? parseInt(maxResults, 10) : 20,
      });

      const response = NextResponse.json({
        tasklists: result.items,
        nextPageToken: result.nextPageToken,
        readOnly: true,
      });

      applyRefreshedTokens(response, result.refreshedTokens);
      return response;
    }

    // Read: Tasks
    if (action === 'list_tasks') {
      const targetListId = tasklistId || '@default';
      const result = await listTasks(tokens, targetListId, {
        pageToken: pageToken || undefined,
        maxResults: maxResults ? parseInt(maxResults, 10) : 50,
        showCompleted: showCompleted !== false,
      });

      const response = NextResponse.json({
        tasks: result.items,
        nextPageToken: result.nextPageToken,
        readOnly: true,
      });

      applyRefreshedTokens(response, result.refreshedTokens);
      return response;
    }

    // Explicitly reject and disable write operations
    if (action === 'push_task' || action === 'patch_task') {
      return NextResponse.json(
        {
          error:
            'Google Tasks integration is configured as read-only. Task creation and updates in Google Tasks are disabled.',
          readOnly: true,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    const isAuthErr =
      err?.code === 'TOKEN_REFRESH_FAILED' ||
      err?.status === 401 ||
      String(err?.message || '').includes('invalid_grant');

    if (isAuthErr) {
      const resp = NextResponse.json(
        { error: 'Google Tasks session expired or revoked. Please reconnect.', requiresReconnect: true },
        { status: 401 }
      );
      resp.cookies.delete('google_tasks_tokens');
      return resp;
    }

    return NextResponse.json(
      { error: 'Google Tasks API request failed.' },
      { status: 500 }
    );
  }
}
