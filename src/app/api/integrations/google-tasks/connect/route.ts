import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl, isGoogleOAuthConfigured } from '@/lib/server/google-tasks';

export async function GET(req: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    // Return informative redirect to Integrations page
    const url = new URL('/integrations', req.url);
    url.searchParams.set('error', 'oauth_credentials_missing');
    url.searchParams.set(
      'message',
      'GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET are not set in .env.local.'
    );
    return NextResponse.redirect(url);
  }

  // Generate random CSRF state
  const state = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const authUrl = getAuthorizationUrl(state);

  if (!authUrl) {
    const url = new URL('/integrations', req.url);
    url.searchParams.set('error', 'oauth_init_failed');
    return NextResponse.redirect(url);
  }

  const response = NextResponse.redirect(authUrl);
  // Store CSRF state in secure cookie
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
