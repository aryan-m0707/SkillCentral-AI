'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PlugZap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Cloud,
  Key,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { StorageEngine } from '@/lib/storage';
import { ApiKeysModal } from '@/components/api-keys-modal';

function IntegrationsContent() {
  const searchParams = useSearchParams();
  const isConnectedParam = searchParams.get('connected');
  const userEmailParam = searchParams.get('email');
  const errorParam = searchParams.get('error');
  const errorMessageParam = searchParams.get('message');

  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);
  const [testResults, setTestResults] = useState<{
    tasklists?: any[];
    tasks?: any[];
    loading?: boolean;
    error?: string;
  } | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/integrations/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.warn('Status check failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleDisconnectGoogleTasks = async () => {
    setDisconnecting(true);
    try {
      await fetch('/api/integrations/google-tasks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      setTestResults(null);
      fetchStatus();
    } catch (e) {
      console.warn('Disconnect error:', e);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleTestTasksRead = async () => {
    setTestResults({ loading: true });
    try {
      const listsRes = await fetch('/api/integrations/google-tasks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_tasklists' }),
      });
      const listsData = await listsRes.json();
      if (!listsRes.ok) throw new Error(listsData.error || 'Failed to list task lists');

      const primaryListId = listsData.tasklists?.[0]?.id || '@default';
      const tasksRes = await fetch('/api/integrations/google-tasks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_tasks', tasklistId: primaryListId }),
      });
      const tasksData = await tasksRes.json();
      if (!tasksRes.ok) throw new Error(tasksData.error || 'Failed to list tasks');

      setTestResults({
        tasklists: listsData.tasklists || [],
        tasks: tasksData.tasks || [],
        loading: false,
      });
    } catch (e: any) {
      setTestResults({ error: e.message || 'Test read failed', loading: false });
    }
  };

  return (
    <AppShell>
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#17243D] tracking-tight flex items-center gap-2">
            <PlugZap className="w-7 h-7 text-[#6658F5]" />
            <span>Integrations &amp; Cloud Services</span>
          </h2>
          <p className="text-sm text-[#718096] mt-1">
            Real-time status of your Google Cloud APIs, Gemini SDK, and Google Tasks OAuth
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsApiKeysModalOpen(true)}
            className="text-xs bg-[#6658F5]"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Enter / Update API Keys</span>
          </Button>
          <Button variant="outline" size="sm" onClick={fetchStatus} isLoading={isLoading}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Diagnostics</span>
          </Button>
        </div>
      </div>

      {/* OAuth Callback Notice */}
      {isConnectedParam && (
        <div className="p-4 bg-[#E6F9F4] border border-[#20C997] rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#20C997] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#138A67]">
              Google Tasks OAuth Connected Successfully (Read-Only)!
            </p>
            <p className="text-xs text-[#138A67] mt-0.5">
              Authorized account: {userEmailParam || 'Google Account'}. Your Google Tasks lists and items can now be read in the Planner and Dashboard.
            </p>
          </div>
        </div>
      )}

      {errorParam && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-rose-900">OAuth Notice: {errorParam}</p>
            <p className="text-xs text-rose-700 mt-0.5">
              {errorMessageParam || 'Could not complete Google OAuth. Verify credentials, consent settings, and redirect URI.'}
            </p>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Google Tasks OAuth 2.0 (Read-Only) */}
        <Card className="p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  GT
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#17243D]">Google Tasks REST API (Read-Only)</h3>
                  <p className="text-xs text-[#718096]">Task-list &amp; task pagination read</p>
                </div>
              </div>
              <Badge
                variant={
                  status?.googleTasks?.userConnected
                    ? 'mint'
                    : status?.googleTasks?.status === 'expired' || status?.googleTasks?.status === 'revoked'
                    ? 'danger'
                    : status?.googleTasks?.status === 'scope_missing'
                    ? 'warning'
                    : status?.googleTasks?.oauthConfigured
                    ? 'warning'
                    : 'outline'
                }
              >
                {status?.googleTasks?.userConnected
                  ? 'Connected (Read-Only)'
                  : status?.googleTasks?.status === 'expired'
                  ? 'Session Expired'
                  : status?.googleTasks?.status === 'scope_missing'
                  ? 'Tasks Scope Missing'
                  : status?.googleTasks?.oauthConfigured
                  ? 'Keys Configured — Not Signed In'
                  : 'Keys Missing'}
              </Badge>
            </div>

            <p className="text-xs text-[#4A5568] leading-relaxed">
              Read-only authorization (<code>tasks.readonly</code>) with secure random CSRF protection and token refresh. Google task write/update operations are strictly disabled.
            </p>

            {status?.googleTasks?.email && (
              <div className="px-3 py-2 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                <span className="text-[11px] text-blue-700 font-medium">Authorized Account:</span>
                <span className="font-semibold text-blue-950 font-mono text-[11px]">{status.googleTasks.email}</span>
              </div>
            )}

            <div className="p-3 bg-[#F6F8FC] rounded-xl text-[11px] text-[#718096] space-y-1">
              <p className="font-semibold text-[#17243D]">OAuth Redirect URI:</p>
              <code className="text-[#6658F5] select-all bg-white px-2 py-1 rounded border border-[#E6EAF2] block truncate">
                http://localhost:3000/api/integrations/google-tasks/callback
              </code>
            </div>

            {testResults && (
              <div className="p-3 bg-white border border-[#E6EAF2] rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-[#17243D]">
                  <span>Live Read Verification:</span>
                  <button
                    onClick={() => setTestResults(null)}
                    className="text-[10px] text-[#718096] hover:text-[#17243D]"
                  >
                    Clear
                  </button>
                </div>
                {testResults.loading ? (
                  <p className="text-[#718096]">Testing task-list and task reads...</p>
                ) : testResults.error ? (
                  <p className="text-rose-600">{testResults.error}</p>
                ) : (
                  <div className="space-y-1 text-[11px] text-[#4A5568]">
                    <p className="text-[#138A67] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      API Read Successful!
                    </p>
                    <p>
                      Task Lists: <strong>{testResults.tasklists?.length || 0}</strong> found
                      {testResults.tasklists?.[0] && ` (Primary: "${testResults.tasklists[0].title}")`}
                    </p>
                    <p>
                      Tasks in Primary: <strong>{testResults.tasks?.length || 0}</strong> items read
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#F0F2FA] flex items-center justify-end gap-2 flex-wrap">
            {status?.googleTasks?.userConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestTasksRead}
                  isLoading={testResults?.loading}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 text-[#6658F5]" />
                  <span>Test Task Read</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectGoogleTasks}
                  isLoading={disconnecting}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs"
                >
                  Disconnect Tasks
                </Button>
              </>
            ) : status?.googleTasks?.status === 'expired' || status?.googleTasks?.status === 'scope_missing' ? (
              <a href="/api/integrations/google-tasks/connect">
                <Button variant="primary" size="sm" className="text-xs bg-amber-600 hover:bg-amber-700">
                  <PlugZap className="w-3.5 h-3.5" />
                  <span>Reconnect Google Tasks</span>
                </Button>
              </a>
            ) : (
              <a href="/api/integrations/google-tasks/connect">
                <Button variant="primary" size="sm" className="text-xs">
                  <PlugZap className="w-3.5 h-3.5" />
                  <span>Connect with Google Tasks</span>
                </Button>
              </a>
            )}
          </div>
        </Card>

        {/* 2. Google Gemini API */}
        <Card className="p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6658F5] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#17243D]">
                    Google Gemini API ({status?.gemini?.model || 'gemini-3.7-flash'})
                  </h3>
                  <p className="text-xs text-[#718096]">Official @google/genai SDK</p>
                </div>
              </div>
              <Badge variant={status?.gemini?.configured ? 'mint' : 'demo'}>
                {status?.gemini?.configured ? 'Live API Connected' : 'Demo Fallback Active'}
              </Badge>
            </div>

            <p className="text-xs text-[#4A5568] leading-relaxed">
              Powers multimodal YouTube learning extraction, grounded notes Q&amp;A citations, and interactive study roadmap generation. Active Model: <code>{status?.gemini?.model || 'gemini-3.7-flash'}</code>.
            </p>

            <div className="p-3 bg-[#F6F8FC] rounded-xl text-[11px] text-[#718096] space-y-1">
              <p className="font-semibold text-[#17243D]">Security Architecture:</p>
              <p>
                API key is kept strictly server-side on Next.js route handlers. Never exposed in browser client JavaScript.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#F0F2FA] flex items-center justify-between text-xs text-[#718096]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsApiKeysModalOpen(true)}
              className="text-xs text-[#6658F5] border-[#6658F5]/30 hover:bg-[#6658F5]/10"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Configure API Key &amp; Model</span>
            </Button>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[#6658F5] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Get Key on AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </Card>

        {/* 3. Cloud Firestore & Firebase Admin */}
        <Card className="p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  FS
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#17243D]">Cloud Firestore</h3>
                  <p className="text-xs text-[#718096]">Durable per-user storage</p>
                </div>
              </div>
              <Badge variant={status?.firebase?.adminConfigured ? 'mint' : 'outline'}>
                {status?.firebase?.adminConfigured ? 'Firestore Connected' : 'Local Storage Fallback'}
              </Badge>
            </div>

            <p className="text-xs text-[#4A5568] leading-relaxed">
              Provides durable per-user storage for sectors, notes, quizzes, and activity logs. In Google Cloud Run, uses Application Default Credentials (ADC) automatically.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#F0F2FA] text-xs text-[#718096]">
            <span>GCP Project: <code>{status?.firebase?.projectId || 'skillcentral-demo'}</code></span>
          </div>
        </Card>

        {/* 4. Google Cloud Run */}
        <Card className="p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#17243D]">Google Cloud Run</h3>
                  <p className="text-xs text-[#718096]">Serverless container runtime</p>
                </div>
              </div>
              <Badge variant={status?.cloudRun?.isCloudRun ? 'mint' : 'outline'}>
                {status?.cloudRun?.isCloudRun ? 'Running in Cloud Run' : 'Local Dev Environment'}
              </Badge>
            </div>

            <p className="text-xs text-[#4A5568] leading-relaxed">
              Containerized multi-stage Docker build ready for instantaneous deployment via <code>gcloud run deploy skillcentral</code>.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#F0F2FA] text-xs text-[#718096]">
            <span>Deployment Target: <code>us-central1</code></span>
          </div>
        </Card>
      </div>

      <ApiKeysModal
        isOpen={isApiKeysModalOpen}
        onClose={() => setIsApiKeysModalOpen(false)}
        onConfigUpdated={fetchStatus}
      />
    </AppShell>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="py-20 text-center text-xs text-[#718096]">
            Loading Integrations...
          </div>
        </AppShell>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
