'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Key,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  FolderOpen,
  Send,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const GEMINI_MODELS = [
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', tag: 'Recommended (Latest Flash)' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', tag: 'High-Volume Reasoning' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite', tag: 'Ultra Fast' },
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', tag: 'Complex Reasoning' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Legacy' },
];

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: () => void;
}

export function ApiKeysModal({ isOpen, onClose, onConfigUpdated }: ApiKeysModalProps) {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.7-flash');
  const [customModel, setCustomModel] = useState('');
  const [oauthClientId, setOauthClientId] = useState('');
  const [oauthClientSecret, setOauthClientSecret] = useState('');
  const [hasGoogleOAuthSecret, setHasGoogleOAuthSecret] = useState(false);
  const [oauthRedirectUri, setOauthRedirectUri] = useState('http://localhost:3000/api/integrations/google-tasks/callback');

  const [hasExistingGeminiKey, setHasExistingGeminiKey] = useState(false);
  const [maskedGeminiKey, setMaskedGeminiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [envFilePath, setEnvFilePath] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/integrations/config');
      const data = await res.json();
      setHasExistingGeminiKey(data.hasGeminiApiKey);
      setMaskedGeminiKey(data.geminiApiKeyMasked || '');
      setSelectedModel(data.geminiModel || 'gemini-3.7-flash');
      setOauthClientId(data.googleOAuthClientId || '');
      setHasGoogleOAuthSecret(Boolean(data.hasGoogleOAuthSecret));
      if (data.googleOAuthRedirectUri) setOauthRedirectUri(data.googleOAuthRedirectUri);
      setEnvFilePath(data.envFilePath || '');
    } catch (e) {
      console.warn('Failed to fetch config:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      setStatusMessage(null);
    }
  }, [isOpen]);

  const activeModelId = selectedModel === 'custom' ? customModel : selectedModel;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/integrations/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiApiKey: geminiApiKey.trim() || undefined,
          geminiModel: activeModelId,
          googleOAuthClientId: oauthClientId.trim(),
          googleOAuthClientSecret: oauthClientSecret.trim() || undefined,
          testConnection: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify key.');
      }

      setStatusMessage({ type: 'success', text: data.message });
      setHasExistingGeminiKey(true);
      if (geminiApiKey) {
        setMaskedGeminiKey(`${geminiApiKey.slice(0, 4)}...${geminiApiKey.slice(-4)}`);
        setGeminiApiKey('');
      }
      if (onConfigUpdated) onConfigUpdated();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveWithoutTest = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/integrations/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiApiKey: geminiApiKey.trim() || undefined,
          geminiModel: activeModelId,
          googleOAuthClientId: oauthClientId.trim(),
          googleOAuthClientSecret: oauthClientSecret.trim() || undefined,
          testConnection: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatusMessage({ type: 'success', text: 'Saved to .env.local and runtime!' });
      if (geminiApiKey) {
        setHasExistingGeminiKey(true);
        setMaskedGeminiKey(`${geminiApiKey.slice(0, 4)}...${geminiApiKey.slice(-4)}`);
        setGeminiApiKey('');
      }
      if (onConfigUpdated) onConfigUpdated();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Google API Keys & Model"
      description="Enter your Google AI Studio Gemini API Key and Google OAuth credentials"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleTestAndSave} className="space-y-5">
        {/* Helper Banner */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-[#6658F5] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#17243D]">
                Get a Free Gemini API Key from Google AI Studio
              </p>
              <p className="text-[11px] text-[#718096] mt-0.5">
                Takes 30 seconds. Supports Gemini 3.7 Flash for video analysis, quizzes, and grounded chat.
              </p>
            </div>
          </div>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-[#6658F5] hover:underline flex items-center gap-1 shrink-0 bg-white px-2.5 py-1 rounded-lg border border-purple-200"
          >
            <span>Get Key</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Gemini API Key Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#718096]">
              Gemini API Key
            </label>
            {hasExistingGeminiKey && (
              <span className="text-[11px] text-[#138A67] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Key Active: {maskedGeminiKey}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder={hasExistingGeminiKey ? 'Enter new key to replace existing...' : 'Paste AIzaSy... from AI Studio'}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-[#E6EAF2] rounded-xl text-sm font-mono text-[#17243D] placeholder-[#94A3B8] focus:outline-none focus:border-[#6658F5]"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-3 text-[#94A3B8] hover:text-[#17243D] cursor-pointer"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Gemini AI Model Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#718096] mb-1.5">
            Gemini AI Model
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {GEMINI_MODELS.map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                    isSelected
                      ? 'bg-[#6658F5]/10 border-[#6658F5] shadow-2xs'
                      : 'bg-white border-[#E6EAF2] hover:border-[#CBD5E1]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#17243D]">{m.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#6658F5]" />}
                  </div>
                  <span className="text-[10px] text-[#718096] mt-1">{m.tag}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedModel('custom')}
              className={cn(
                'text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer',
                selectedModel === 'custom'
                  ? 'bg-[#6658F5] text-white border-[#6658F5]'
                  : 'bg-white text-[#718096] border-[#E6EAF2]'
              )}
            >
              Custom Model ID
            </button>
            {selectedModel === 'custom' && (
              <input
                type="text"
                placeholder="e.g. gemini-3.7-flash"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                className="flex-1 px-3 py-1 bg-white border border-[#E6EAF2] rounded-lg text-xs font-mono text-[#17243D] focus:outline-none focus:border-[#6658F5]"
              />
            )}
          </div>
        </div>

        {/* Google OAuth Section */}
        <div className="pt-2 border-t border-[#F0F2FA] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#17243D] uppercase tracking-wider flex items-center gap-1.5">
                <span>Google Tasks OAuth 2.0</span>
                {hasGoogleOAuthSecret && (
                  <Badge variant="mint" className="text-[10px] py-0">Secret Saved</Badge>
                )}
              </h4>
              <p className="text-[11px] text-[#718096] mt-0.5">
                Required to synchronize Planner tasks with your personal Google Tasks account.
              </p>
            </div>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#6658F5] hover:underline flex items-center gap-1"
            >
              <span>GCP Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="OAuth Client ID"
              placeholder="...apps.googleusercontent.com"
              value={oauthClientId}
              onChange={(e) => setOauthClientId(e.target.value)}
            />
            <Input
              label={hasGoogleOAuthSecret ? "OAuth Client Secret (Already Saved - leave empty to keep)" : "OAuth Client Secret"}
              type="password"
              placeholder={hasGoogleOAuthSecret ? "••••••••••••••••" : "Client secret..."}
              value={oauthClientSecret}
              onChange={(e) => setOauthClientSecret(e.target.value)}
            />
          </div>

          <div className="p-2.5 bg-[#F6F8FC] border border-[#E6EAF2] rounded-xl text-[11px] text-[#718096] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#17243D]">Required Authorized Redirect URI:</span>
            </div>
            <code className="text-[#6658F5] font-mono select-all block bg-white px-2 py-0.5 rounded border border-[#E6EAF2]">
              {oauthRedirectUri}
            </code>
          </div>
        </div>

        {/* Status Feedback Alert */}
        {statusMessage && (
          <div
            className={cn(
              'p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 leading-relaxed',
              statusMessage.type === 'success'
                ? 'bg-[#E6F9F4] border-[#20C997] text-[#138A67]'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            )}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#20C997] mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Storage location hint */}
        <div className="p-3 bg-[#F6F8FC] rounded-xl text-[11px] text-[#718096] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span>Persisted locally to <code>.env.local</code> in workspace</span>
          </span>
          <code className="text-[10px] text-[#6658F5] select-all">.env.local</code>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-[#F0F2FA]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSaveWithoutTest}
            isLoading={isLoading}
          >
            Save Configuration
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isTesting}>
            <Zap className="w-3.5 h-3.5" />
            <span>Test &amp; Save ({activeModelId})</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
