import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const ENV_PATH = path.join(process.cwd(), '.env.local');

// Helper to read and parse .env.local
function readEnvFile(): Record<string, string> {
  if (!fs.existsSync(ENV_PATH)) return {};
  const content = fs.readFileSync(ENV_PATH, 'utf-8');
  const env: Record<string, string> = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        env[key] = val;
      }
    }
  });
  return env;
}

// Helper to write back to .env.local
function writeEnvFile(updates: Record<string, string>) {
  const current = readEnvFile();
  const merged = { ...current, ...updates };

  const lines = [
    '# SkillCentral Local Environment Configuration',
    `GEMINI_MODEL=${merged.GEMINI_MODEL || 'gemini-3.7-flash'}`,
    `GEMINI_API_KEY=${merged.GEMINI_API_KEY || ''}`,
    `GOOGLE_OAUTH_CLIENT_ID=${merged.GOOGLE_OAUTH_CLIENT_ID || ''}`,
    `GOOGLE_OAUTH_CLIENT_SECRET=${merged.GOOGLE_OAUTH_CLIENT_SECRET || ''}`,
    `GOOGLE_OAUTH_REDIRECT_URI=${merged.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/integrations/google-tasks/callback'}`,
    `DEMO_MODE=${merged.DEMO_MODE || 'false'}`,
  ];

  if (merged.GOOGLE_CLOUD_PROJECT) lines.push(`GOOGLE_CLOUD_PROJECT=${merged.GOOGLE_CLOUD_PROJECT}`);
  if (merged.YOUTUBE_API_KEY) lines.push(`YOUTUBE_API_KEY=${merged.YOUTUBE_API_KEY}`);

  fs.writeFileSync(ENV_PATH, lines.join('\n') + '\n', 'utf-8');

  // Also update running process.env
  Object.entries(updates).forEach(([k, v]) => {
    process.env[k] = v;
  });
}

export async function GET() {
  const env = readEnvFile();
  const currentApiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';
  const maskedKey = currentApiKey
    ? `${currentApiKey.slice(0, 4)}...${currentApiKey.slice(-4)}`
    : '';

  return NextResponse.json({
    geminiApiKeyMasked: maskedKey,
    hasGeminiApiKey: Boolean(currentApiKey),
    geminiModel: process.env.GEMINI_MODEL || env.GEMINI_MODEL || 'gemini-3.7-flash',
    googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID || env.GOOGLE_OAUTH_CLIENT_ID || '',
    hasGoogleOAuthSecret: Boolean(process.env.GOOGLE_OAUTH_CLIENT_SECRET || env.GOOGLE_OAUTH_CLIENT_SECRET),
    googleOAuthRedirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/integrations/google-tasks/callback',
    demoMode: process.env.DEMO_MODE === 'true',
    envFilePath: ENV_PATH,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      geminiApiKey,
      geminiModel,
      googleOAuthClientId,
      googleOAuthClientSecret,
      googleOAuthRedirectUri,
      testConnection,
    } = body;

    const updates: Record<string, string> = {};

    if (geminiModel) updates.GEMINI_MODEL = geminiModel;
    if (typeof geminiApiKey === 'string' && geminiApiKey.trim()) {
      updates.GEMINI_API_KEY = geminiApiKey.trim();
    }
    if (typeof googleOAuthClientId === 'string') {
      updates.GOOGLE_OAUTH_CLIENT_ID = googleOAuthClientId.trim();
    }
    if (typeof googleOAuthClientSecret === 'string' && googleOAuthClientSecret.trim()) {
      updates.GOOGLE_OAUTH_CLIENT_SECRET = googleOAuthClientSecret.trim();
    }
    if (typeof googleOAuthRedirectUri === 'string' && googleOAuthRedirectUri.trim()) {
      updates.GOOGLE_OAUTH_REDIRECT_URI = googleOAuthRedirectUri.trim();
    }

    // If user requested connection test
    if (testConnection) {
      const keyToTest = updates.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      const modelToTest = updates.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.7-flash';

      if (!keyToTest) {
        return NextResponse.json(
          { error: 'Please enter a Gemini API Key before testing.' },
          { status: 400 }
        );
      }

      try {
        const ai = new GoogleGenAI({ apiKey: keyToTest });
        const response = await ai.models.generateContent({
          model: modelToTest,
          contents: ['Hello! Reply with "OK" if connected.'],
        });
        const reply = response.text || '';

        // Save since connection succeeded!
        writeEnvFile(updates);

        return NextResponse.json({
          success: true,
          message: `Successfully connected to ${modelToTest}! AI response: "${reply.trim().slice(0, 50)}"`,
          saved: true,
        });
      } catch (testErr: any) {
        return NextResponse.json(
          {
            error: `Gemini API Key verification failed: ${testErr.message || 'Invalid key or model'}`,
          },
          { status: 400 }
        );
      }
    }

    // Save updates
    writeEnvFile(updates);

    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully to .env.local and active runtime.',
    });
  } catch (err: any) {
    console.error('Error saving API configuration:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to save configuration.' },
      { status: 500 }
    );
  }
}
