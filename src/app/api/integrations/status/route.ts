import { NextRequest, NextResponse } from 'next/server';
import { isGeminiConfigured, getGeminiModel } from '@/lib/server/gemini';
import {
  isGoogleOAuthConfigured,
  verifyTasksConnection,
  TokenSet,
} from '@/lib/server/google-tasks';
import { getFirebaseAdminApp } from '@/lib/server/firebase-admin';

export async function GET(req: NextRequest) {
  const tokensCookie = req.cookies.get('google_tasks_tokens')?.value;
  const geminiConfigured = isGeminiConfigured();
  const oauthConfigured = isGoogleOAuthConfigured();
  const firebaseAdmin = Boolean(getFirebaseAdminApp());
  const youtubeApiConfigured = Boolean(process.env.YOUTUBE_API_KEY);

  let googleTasksStatus: 'connected' | 'expired' | 'revoked' | 'scope_missing' | 'ready_to_connect' | 'missing_oauth_keys' =
    oauthConfigured ? 'ready_to_connect' : 'missing_oauth_keys';
  let isUserConnected = false;
  let userEmail: string | undefined = undefined;
  let refreshedTokens: TokenSet | undefined = undefined;
  let statusError: string | undefined = undefined;

  if (tokensCookie && oauthConfigured) {
    try {
      const tokens: TokenSet = JSON.parse(tokensCookie);
      const verification = await verifyTasksConnection(tokens);

      if (verification.isValid) {
        isUserConnected = true;
        googleTasksStatus = 'connected';
        userEmail = verification.email;
        refreshedTokens = verification.refreshedTokens;
      } else {
        googleTasksStatus = verification.status;
        statusError = verification.errorMessage;
      }
    } catch {
      googleTasksStatus = 'expired';
      statusError = 'Session token corrupted. Please reconnect.';
    }
  }

  const response = NextResponse.json({
    gemini: {
      configured: geminiConfigured,
      model: getGeminiModel(),
      status: geminiConfigured ? 'connected' : 'missing_api_key',
    },
    googleTasks: {
      oauthConfigured,
      userConnected: isUserConnected,
      status: googleTasksStatus,
      email: userEmail || null,
      readOnly: true,
      error: statusError || null,
    },
    firebase: {
      adminConfigured: firebaseAdmin,
      projectId:
        process.env.GOOGLE_CLOUD_PROJECT ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        null,
      status: firebaseAdmin ? 'connected' : 'local_storage_fallback',
    },
    youtube: {
      configured: youtubeApiConfigured,
      status: youtubeApiConfigured ? 'connected' : 'optional_fallback',
    },
    cloudRun: {
      isCloudRun: Boolean(process.env.K_SERVICE),
      serviceName: process.env.K_SERVICE || null,
    },
  });

  if (refreshedTokens) {
    response.cookies.set('google_tasks_tokens', JSON.stringify(refreshedTokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
  } else if (!isUserConnected && tokensCookie && (googleTasksStatus === 'expired' || googleTasksStatus === 'revoked')) {
    // Delete expired/invalid cookie
    response.cookies.delete('google_tasks_tokens');
  }

  return response;
}
