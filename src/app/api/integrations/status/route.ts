import { NextRequest, NextResponse } from 'next/server';
import { isGeminiConfigured, getGeminiModel } from '@/lib/server/gemini';
import { isGoogleOAuthConfigured } from '@/lib/server/google-tasks';
import { getFirebaseAdminApp } from '@/lib/server/firebase-admin';

export async function GET(req: NextRequest) {
  const tokensCookie = req.cookies.get('google_tasks_tokens')?.value;
  const hasTokens = Boolean(tokensCookie);
  let userEmail: string | null = null;
  if (tokensCookie) {
    try {
      const parsed = JSON.parse(tokensCookie);
      userEmail = parsed.userEmail || null;
    } catch {}
  }

  const geminiConfigured = isGeminiConfigured();
  const oauthConfigured = isGoogleOAuthConfigured();
  const firebaseAdmin = Boolean(getFirebaseAdminApp());
  const youtubeApiConfigured = Boolean(process.env.YOUTUBE_API_KEY);

  return NextResponse.json({
    gemini: {
      configured: geminiConfigured,
      model: getGeminiModel(),
      status: geminiConfigured ? 'connected' : 'missing_api_key',
    },
    googleTasks: {
      oauthConfigured,
      userConnected: hasTokens,
      userEmail,
      status: hasTokens ? 'connected' : oauthConfigured ? 'ready_to_connect' : 'missing_oauth_keys',
    },
    firebase: {
      adminConfigured: firebaseAdmin,
      projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || null,
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
}
