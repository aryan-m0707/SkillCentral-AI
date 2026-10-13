import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForTokens,
  getOAuthClient,
  verifyTasksScope,
} from '@/lib/server/google-tasks';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const destinationUrl = new URL('/integrations', req.url);

  if (error) {
    destinationUrl.searchParams.set('error', error === 'access_denied' ? 'access_denied' : 'oauth_error');
    destinationUrl.searchParams.set(
      'message',
      error === 'access_denied'
        ? 'Consent was denied or cancelled.'
        : 'Google authorization failed.'
    );
    return NextResponse.redirect(destinationUrl);
  }

  if (!code) {
    destinationUrl.searchParams.set('error', 'no_code_provided');
    destinationUrl.searchParams.set('message', 'No authorization code received.');
    return NextResponse.redirect(destinationUrl);
  }

  // Validate CSRF state
  const storedState = req.cookies.get('google_oauth_state')?.value;
  if (!state || state !== storedState) {
    destinationUrl.searchParams.set('error', 'csrf_state_mismatch');
    destinationUrl.searchParams.set('message', 'CSRF validation failed. Please try connecting again.');
    return NextResponse.redirect(destinationUrl);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    // Verify that granted scopes include Google Tasks read access
    if (tokens.scope && !verifyTasksScope(tokens.scope)) {
      destinationUrl.searchParams.set('error', 'missing_tasks_scope');
      destinationUrl.searchParams.set(
        'message',
        'Google Tasks read-only scope was not granted. Please re-authorize and check the Tasks box.'
      );
      const response = NextResponse.redirect(destinationUrl);
      response.cookies.delete('google_oauth_state');
      return response;
    }

    // Safely retrieve user email for display
    let userEmail = 'Google Account';
    try {
      const oauth2Client = getOAuthClient();
      if (oauth2Client) {
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        if (userInfo.data.email) {
          userEmail = userInfo.data.email;
        }
      }
    } catch {
      // Ignore userinfo failure
    }

    destinationUrl.searchParams.set('connected', 'true');
    destinationUrl.searchParams.set('email', userEmail);

    const response = NextResponse.redirect(destinationUrl);

    // Save tokens in secure HTTP-only cookie
    response.cookies.set('google_tasks_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    response.cookies.delete('google_oauth_state');
    return response;
  } catch {
    destinationUrl.searchParams.set('error', 'token_exchange_failed');
    destinationUrl.searchParams.set(
      'message',
      'Failed to exchange authorization code for credentials. Please verify client settings and try again.'
    );
    const response = NextResponse.redirect(destinationUrl);
    response.cookies.delete('google_oauth_state');
    return response;
  }
}
