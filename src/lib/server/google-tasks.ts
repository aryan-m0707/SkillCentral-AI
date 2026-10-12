import { google } from 'googleapis';

const TASKS_SCOPE = 'https://www.googleapis.com/auth/tasks';

export function getOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/integrations/google-tasks/callback';

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

/**
 * Generates OAuth Authorization URL with CSRF state
 */
export function getAuthorizationUrl(state: string): string | null {
  const oauth2Client = getOAuthClient();
  if (!oauth2Client) return null;

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // ensures refresh_token is returned
    prompt: 'consent', // ensures refresh token on re-authorization
    scope: [
      TASKS_SCOPE,
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    state,
  });
}

/**
 * Exchanges authorization code for credentials tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuthClient();
  if (!oauth2Client) {
    throw new Error('Google OAuth is not configured on this server.');
  }

  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Creates authenticated Google Tasks API client
 */
export function getGoogleTasksService(tokens: any) {
  const oauth2Client = getOAuthClient();
  if (!oauth2Client) {
    throw new Error('Google OAuth is not configured.');
  }
  oauth2Client.setCredentials(tokens);
  return google.tasks({ version: 'v1', auth: oauth2Client });
}

/**
 * Lists user task lists
 */
export async function listTaskLists(tokens: any) {
  const tasksService = getGoogleTasksService(tokens);
  const res = await tasksService.tasklists.list({ maxResults: 20 });
  return res.data.items || [];
}

/**
 * Inserts task into Google Tasks
 * Note: Google Tasks API due format requires RFC 3339 timestamp formatted to midnight UTC,
 * and only stores the calendar date, discarding time-of-day.
 */
export async function pushTaskToGoogleTasks(
  tokens: any,
  tasklistId: string,
  task: {
    title: string;
    details?: string;
    dueDate?: string; // YYYY-MM-DD
  }
) {
  const tasksService = getGoogleTasksService(tokens);

  let formattedDue: string | undefined = undefined;
  if (task.dueDate) {
    // E.g. "2026-10-15" -> "2026-10-15T00:00:00.000Z"
    formattedDue = `${task.dueDate}T00:00:00.000Z`;
  }

  const res = await tasksService.tasks.insert({
    tasklist: tasklistId,
    requestBody: {
      title: task.title,
      notes: task.details || '',
      due: formattedDue,
    },
  });

  return res.data;
}

/**
 * Patches task status in Google Tasks
 */
export async function updateGoogleTaskStatus(
  tokens: any,
  tasklistId: string,
  taskId: string,
  completed: boolean
) {
  const tasksService = getGoogleTasksService(tokens);
  const res = await tasksService.tasks.patch({
    tasklist: tasklistId,
    task: taskId,
    requestBody: {
      status: completed ? 'completed' : 'needsAction',
      completed: completed ? new Date().toISOString() : undefined,
    },
  });
  return res.data;
}
