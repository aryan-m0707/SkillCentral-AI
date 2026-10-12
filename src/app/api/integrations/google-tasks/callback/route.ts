import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getOAuthClient } from '@/lib/server/google-tasks';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const destinationUrl = new URL('/integrations', req.url);

  if (error) {
    destinationUrl.searchParams.set('error', error);
    return NextResponse.redirect(destinationUrl);
  }

  if (!code) {
    destinationUrl.searchParams.set('error', 'no_code_provided');
    return NextResponse.redirect(destinationUrl);
  }

  // Validate state
  const storedState = req.cookies.get('google_oauth_state')?.value;
  if (!state || state !== storedState) {
    destinationUrl.searchParams.set('error', 'csrf_state_mismatch');
    return NextResponse.redirect(destinationUrl);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    // Fetch user email for display
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
      // Ignore userinfo failure if scope was restricted
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
  } catch (err: any) {
    console.error('[GoogleTasks/callback] Token exchange error:', err);
    destinationUrl.searchParams.set('error', 'token_exchange_failed');
    destinationUrl.searchParams.set('message', err.message || 'Failed to exchange tokens');
    return NextResponse.redirect(destinationUrl);
  }
}
