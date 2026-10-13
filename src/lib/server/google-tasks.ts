import { google } from 'googleapis';
import crypto from 'crypto';

export const TASKS_READONLY_SCOPE = 'https://www.googleapis.com/auth/tasks.readonly';
export const USERINFO_EMAIL_SCOPE = 'https://www.googleapis.com/auth/userinfo.email';

export interface TokenSet {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string | null;
  token_type?: string | null;
  expiry_date?: number | null;
  id_token?: string | null;
}

import fs from 'fs';
import path from 'path';

function getEnvVar(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(new RegExp('^' + key + '\\s*=\\s*(.+)$', 'm'));
      if (match && match[1]) {
        const val = match[1].trim();
        process.env[key] = val;
        return val;
      }
    }
  } catch {}
  return undefined;
}

export function getOAuthClient() {
  const clientId = getEnvVar('GOOGLE_OAUTH_CLIENT_ID');
  const clientSecret = getEnvVar('GOOGLE_OAUTH_CLIENT_SECRET');
  const redirectUri =
    getEnvVar('GOOGLE_OAUTH_REDIRECT_URI') ||
    'http://localhost:3000/api/integrations/google-tasks/callback';

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(getEnvVar('GOOGLE_OAUTH_CLIENT_ID') && getEnvVar('GOOGLE_OAUTH_CLIENT_SECRET'));
}

/**
 * Generates cryptographically secure random CSRF state
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verifies if granted scopes satisfy Tasks read-only access
 */
export function verifyTasksScope(scopeString?: string | null): boolean {
  if (!scopeString) return false;
  const scopes = scopeString.split(/\s+/);
  return (
    scopes.includes(TASKS_READONLY_SCOPE) ||
    scopes.includes('https://www.googleapis.com/auth/tasks')
  );
}

/**
 * Generates OAuth Authorization URL with CSRF state and tasks.readonly scope
 */
export function getAuthorizationUrl(state: string): string | null {
  const oauth2Client = getOAuthClient();
  if (!oauth2Client) return null;

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // ensures refresh_token is returned
    prompt: 'consent', // ensures refresh token on re-authorization
    scope: [
      TASKS_READONLY_SCOPE,
      USERINFO_EMAIL_SCOPE,
    ],
    state,
  });
}

/**
 * Exchanges authorization code for credentials tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<TokenSet> {
  const oauth2Client = getOAuthClient();
  if (!oauth2Client) {
    throw new Error('Google OAuth is not configured on this server.');
  }

  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Creates authenticated OAuth client with token refresh handling
 */
export async function getAuthenticatedClient(
  tokens: TokenSet
): Promise<{ client: InstanceType<typeof google.auth.OAuth2>; refreshedTokens?: TokenSet }> {
  const oauth2Client = getOAuthClient();
  if (!oauth2Client) {
    throw new Error('Google OAuth is not configured on this server.');
  }

  oauth2Client.setCredentials(tokens);

  let refreshedTokens: TokenSet | undefined = undefined;
  oauth2Client.on('tokens', (newTokens) => {
    refreshedTokens = {
      ...tokens,
      ...newTokens,
      refresh_token: newTokens.refresh_token || tokens.refresh_token,
    };
  });

  // If token is expired or expires in < 60s, refresh if refresh_token is present
  const now = Date.now();
  if (tokens.expiry_date && tokens.expiry_date < now + 60000 && tokens.refresh_token) {
    try {
      const response = await oauth2Client.refreshAccessToken();
      const newCreds = response.credentials;
      refreshedTokens = {
        ...tokens,
        ...newCreds,
        refresh_token: newCreds.refresh_token || tokens.refresh_token,
      };
      oauth2Client.setCredentials(refreshedTokens);
    } catch {
      const authErr = new Error('OAuth token refresh failed. Session expired or revoked.');
      (authErr as any).code = 'TOKEN_REFRESH_FAILED';
      throw authErr;
    }
  }

  return { client: oauth2Client, refreshedTokens };
}

/**
 * Creates authenticated Google Tasks API client
 */
export async function getGoogleTasksService(tokens: TokenSet) {
  const { client, refreshedTokens } = await getAuthenticatedClient(tokens);
  return {
    tasksService: google.tasks({ version: 'v1', auth: client }),
    refreshedTokens,
  };
}

/**
 * Lists user task lists with pagination support
 */
export async function listTaskLists(
  tokens: TokenSet,
  options?: { pageToken?: string; maxResults?: number }
) {
  const { tasksService, refreshedTokens } = await getGoogleTasksService(tokens);
  const res = await tasksService.tasklists.list({
    maxResults: options?.maxResults || 20,
    pageToken: options?.pageToken || undefined,
  });

  return {
    items: res.data.items || [],
    nextPageToken: res.data.nextPageToken || null,
    refreshedTokens,
  };
}

/**
 * Lists tasks in a specific task list with pagination support
 */
export async function listTasks(
  tokens: TokenSet,
  tasklistId: string = '@default',
  options?: {
    pageToken?: string;
    maxResults?: number;
    showCompleted?: boolean;
    showHidden?: boolean;
  }
) {
  const { tasksService, refreshedTokens } = await getGoogleTasksService(tokens);
  const res = await tasksService.tasks.list({
    tasklist: tasklistId,
    maxResults: options?.maxResults || 50,
    pageToken: options?.pageToken || undefined,
    showCompleted: options?.showCompleted ?? true,
    showHidden: options?.showHidden ?? false,
  });

  return {
    items: res.data.items || [],
    nextPageToken: res.data.nextPageToken || null,
    refreshedTokens,
  };
}

/**
 * Verifies live connection usability and granted scopes
 * Does not treat cookie presence alone as proof of active connection.
 */
export async function verifyTasksConnection(tokens: TokenSet): Promise<{
  isValid: boolean;
  status: 'connected' | 'expired' | 'revoked' | 'scope_missing' | 'error';
  email?: string;
  errorMessage?: string;
  refreshedTokens?: TokenSet;
}> {
  if (!tokens || (!tokens.access_token && !tokens.refresh_token)) {
    return { isValid: false, status: 'error', errorMessage: 'No valid tokens found' };
  }

  // Check granted scopes
  if (tokens.scope && !verifyTasksScope(tokens.scope)) {
    return {
      isValid: false,
      status: 'scope_missing',
      errorMessage: 'Google Tasks read-only scope was not granted during authorization.',
    };
  }

  try {
    const { client, refreshedTokens } = await getAuthenticatedClient(tokens);
    const tasksService = google.tasks({ version: 'v1', auth: client });

    // Live API check: read task lists with maxResults 1
    await tasksService.tasklists.list({ maxResults: 1 });

    // Attempt to read user email if userinfo scope was granted
    let userEmail: string | undefined = undefined;
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const userInfo = await oauth2.userinfo.get();
      userEmail = userInfo.data.email || undefined;
    } catch {
      // userinfo is optional
    }

    return {
      isValid: true,
      status: 'connected',
      email: userEmail,
      refreshedTokens,
    };
  } catch (err: any) {
    const errMsg = String(err?.message || '');
    if (
      errMsg.includes('invalid_grant') ||
      errMsg.includes('Token has been expired or revoked') ||
      err?.code === 'TOKEN_REFRESH_FAILED' ||
      err?.status === 401
    ) {
      return {
        isValid: false,
        status: 'expired',
        errorMessage: 'Authorization has expired or was revoked. Please reconnect.',
      };
    }

    if (err?.status === 403) {
      return {
        isValid: false,
        status: 'scope_missing',
        errorMessage: 'Access forbidden. Please verify Tasks API is enabled and scopes are granted.',
      };
    }

    return {
      isValid: false,
      status: 'error',
      errorMessage: 'Failed to verify connection with Google Tasks API.',
    };
  }
}

/**
 * Read-only enforcement: task insertion is explicitly disabled
 */
export async function pushTaskToGoogleTasks(): Promise<never> {
  throw new Error(
    'Google Tasks integration is configured as read-only. Task creation is disabled.'
  );
}

/**
 * Read-only enforcement: task status patching is explicitly disabled
 */
export async function updateGoogleTaskStatus(): Promise<never> {
  throw new Error(
    'Google Tasks integration is configured as read-only. Task updates are disabled.'
  );
}
