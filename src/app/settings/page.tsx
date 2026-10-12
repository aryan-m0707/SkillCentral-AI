'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StorageEngine } from '@/lib/storage';
import { UserProfile } from '@/types';
import { Settings, User, RotateCcw, Trash2, CheckCircle2, ShieldAlert, Key, Sparkles } from 'lucide-react';
import { ApiKeysModal } from '@/components/api-keys-modal';

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('');
  const [demoMode, setDemoMode] = useState(true);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);

  useEffect(() => {
    const u = StorageEngine.getCurrentUser();
    setUser(u);
    setDisplayName(u.displayName || '');
    setEmail(u.email || '');
    setTimezone(u.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    setDemoMode(u.settings?.demoMode ?? true);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    StorageEngine.updateUserProfile({
      displayName: displayName.trim(),
      email: email.trim(),
      settings: {
        ...user.settings,
        demoMode,
        timezone,
      },
    });
    setSavedStatus('Settings updated successfully');
    setTimeout(() => setSavedStatus(null), 3000);
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset all sectors, notes, and tasks back to the 14-day sample demo dataset?')) {
      StorageEngine.resetToDemoData();
      window.location.reload();
    }
  };

  const handleClearAllData = () => {
    if (
      window.confirm(
        'Are you sure you want to completely erase all data? This will reset all sectors and clear your vault.'
      )
    ) {
      StorageEngine.clearAllData();
      window.location.reload();
    }
  };

  if (!user) return null;

  return (
    <AppShell>
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#17243D] tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-[#6658F5]" />
            <span>Settings &amp; Preferences</span>
          </h2>
          <p className="text-sm text-[#718096] mt-1">
            Manage your personal profile, local storage state, and demo configuration
          </p>
        </div>
      </div>

      {savedStatus && (
        <div className="p-3 bg-[#E6F9F4] border border-[#20C997] rounded-xl text-xs font-semibold text-[#138A67] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#20C997]" />
          <span>{savedStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form (2 cols) */}
        <Card className="lg:col-span-2 p-6 space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-[#6658F5]" />
              <span>Learner Profile</span>
            </CardTitle>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
              <Input
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </div>

            <Input
              label="Local Timezone (used for streak calculation)"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" size="sm">
                Save Preferences
              </Button>
            </div>
          </form>
        </Card>

        {/* Demo & Storage Data Controls (1 col) */}
        <div className="space-y-6">
          {/* API Keys Configuration Card */}
          <Card className="p-6 space-y-4 border-[#6658F5]/30 bg-gradient-to-br from-white to-[#F8F7FF]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#6658F5]/10 text-[#6658F5] flex items-center justify-center">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm">API Keys &amp; AI Model</CardTitle>
                <CardDescription>Configure Gemini API Key &amp; model</CardDescription>
              </div>
            </div>

            <p className="text-xs text-[#4A5568] leading-relaxed">
              Set your Google AI Studio Gemini API Key and switch models (e.g. <strong>Gemini 3.7 Flash</strong>) without manually editing files.
            </p>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsApiKeysModalOpen(true)}
              className="w-full text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Configure Gemini Key &amp; Model</span>
            </Button>
          </Card>

          <Card className="p-6 space-y-4">
            <CardTitle className="text-base">Demo Data Controls</CardTitle>
            <CardDescription>
              Toggle or reset the 14-day sample dataset designed for live hackathon judging walkthroughs
            </CardDescription>

            <div className="space-y-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDemoData}
                className="w-full text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Reset 14-Day Sample Demo Data</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllData}
                className="w-full text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Data &amp; Start Blank</span>
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-indigo-50/50 border-indigo-100 space-y-2">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
              Privacy &amp; Data Safety
            </h4>
            <p className="text-xs text-indigo-900 leading-relaxed">
              SkillCentral does not share user notes with any third-party advertising networks. Grounded Q&amp;A calls send text strictly over authenticated server-side routes to the Google Gemini API (Gemini 3.7 Flash).
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
