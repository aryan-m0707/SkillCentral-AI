import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthorizationUrl,
  isGoogleOAuthConfigured,
  generateOAuthState,
} from '@/lib/server/google-tasks';

export async function GET(req: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    const url = new URL('/integrations', req.url);
    url.searchParams.set('error', 'oauth_credentials_missing');
    url.searchParams.set(
      'message',
      'GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET are not configured.'
    );
    return NextResponse.redirect(url);
  }

  // Generate cryptographically secure CSRF state
  const state = generateOAuthState();
  const authUrl = getAuthorizationUrl(state);

  if (!authUrl) {
    const url = new URL('/integrations', req.url);
    url.searchParams.set('error', 'oauth_init_failed');
    return NextResponse.redirect(url);
  }

  const response = NextResponse.redirect(authUrl);
  // Store CSRF state in secure HTTP-only cookie
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
