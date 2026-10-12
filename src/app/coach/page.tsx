'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StorageEngine } from '@/lib/storage';
import { Sector, Note, ChatMessage, Task } from '@/types';
import {
  Sparkles,
  Send,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  RotateCcw,
  Plus,
  Loader2,
  Bookmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function AICoachContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState<string>('');

  // Mode Selection
  const [activeMode, setActiveMode] = useState<
    'explain' | 'brainstorm' | 'study_plan' | 'quiz_me' | 'summarize' | 'progress'
  >('explain');

  // Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content:
        'Hello! I am your SkillCentral AI Coach. I personalize guidance grounded in your saved Knowledge Vault notes and sector goals. How can I help you accelerate your learning today?',
      createdAt: '2026-10-12T00:00:00.000Z',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState(
    initialTopic ? `Can you explain the core concepts of "${initialTopic}" simply and create a study plan?` : ''
  );
  const [isLoading, setIsLoading] = useState(false);

  // Roadmap plan preview state
  const [proposedPlan, setProposedPlan] = useState<any | null>(null);
  const [isPlanConfirmed, setIsPlanConfirmed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = StorageEngine.getSectors();
    const n = StorageEngine.getNotes();
    setSectors(s);
    setNotes(n);
    if (s.length > 0) setSelectedSectorId(s[0]!.id);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, proposedPlan]);

  const modesList = [
    { id: 'explain', label: 'Explain Simply', icon: BookOpen },
    { id: 'study_plan', label: 'Make Study Plan', icon: CalendarCheck },
    { id: 'brainstorm', label: 'Brainstorm', icon: BrainCircuit },
    { id: 'quiz_me', label: 'Quiz Me', icon: HelpCircle },
    { id: 'summarize', label: 'Summarize Sources', icon: Bookmark },
    { id: 'progress', label: 'Explain My Progress', icon: TrendingUp },
  ];

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customText || inputPrompt;
    if (!promptToSend.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: promptToSend.trim(),
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const activeSector = sectors.find((s) => s.id === selectedSectorId);
      const relevantNotes = notes
        .filter((n) => !selectedSectorId || n.sectorId === selectedSectorId)
        .slice(0, 4)
        .map((n) => ({ id: n.id, title: n.title, content: n.content }));

      // If in study_plan mode, trigger structured plan endpoint
      if (activeMode === 'study_plan') {
        const planRes = await fetch('/api/ai/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal: promptToSend,
            timeframeDays: 30,
            sectorName: activeSector?.name,
          }),
        });
        const planData = await planRes.json();
        if (planData.roadmap) {
          setProposedPlan(planData.roadmap);
          setIsPlanConfirmed(false);
        }
      }

      // Generate conversational response
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          mode: activeMode,
          sectorName: activeSector?.name,
          notesContext: relevantNotes,
        }),
      });

      const data = await res.json();

      const coachMessage: ChatMessage = {
        id: `msg-coach-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Here are my thoughts on your learning topic.',
        createdAt: new Date().toISOString(),
        sourcesCited: data.citedSources,
        suggestedTasks: data.suggestedTasks,
      };

      setMessages([...newMessages, coachMessage]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: `I encountered an issue contacting the Gemini service: ${err.message}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAddPlanToPlanner = () => {
    if (!proposedPlan?.milestones) return;
    const targetSector = selectedSectorId || sectors[0]?.id || 'sec-academics';

    proposedPlan.milestones.forEach((m: any) => {
      m.tasks?.forEach((t: any) => {
        StorageEngine.saveTask({
          title: `[${m.title}] ${t.title}`,
          details: t.details,
          sectorId: targetSector,
          priority: t.priority || 'medium',
          status: 'todo',
        });
      });
    });

    setIsPlanConfirmed(true);
  };

  const promptSuggestions = [
    'How does Raft handle leader split-brain partitioned elections?',
    'Create a 30-day Japanese JLPT N4 grammar roadmap with weekly milestones',
    'Quiz me on best practices for serverless Cloud Run deployments',
    'Summarize my saved notes on Gemini multimodal ingestion patterns',
  ];

  return (
    <AppShell>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#17243D] tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#6658F5]" />
            <span>AI Learning Coach</span>
          </h2>
          <p className="text-sm text-[#718096] mt-1">
            Grounded second-brain guidance, structured study plans, and source-backed recall
          </p>
        </div>

        {/* Sector Context Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#718096] whitespace-nowrap">
            Grounded Sector:
          </label>
          <select
            value={selectedSectorId}
            onChange={(e) => setSelectedSectorId(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-[#E6EAF2] rounded-xl text-[#17243D] focus:outline-none focus:border-[#6658F5]"
          >
            <option value="">All Sectors</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {modesList.map((m) => {
          const Icon = m.icon;
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id as any)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border',
                isActive
                  ? 'bg-[#6658F5] text-white border-[#6658F5] shadow-xs'
                  : 'bg-white text-[#718096] border-[#E6EAF2] hover:border-[#CBD5E1] hover:text-[#17243D]'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[620px]">
        {/* Chat Feed (3 cols) */}
        <Card className="lg:col-span-3 flex flex-col h-[650px] overflow-hidden">
          {/* Scrollable Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.map((msg) => {
              const isCoach = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3 max-w-3xl',
                    isCoach ? 'items-start mr-auto' : 'items-start ml-auto flex-row-reverse'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs',
                      isCoach
                        ? 'bg-[#6658F5] text-white'
                        : 'bg-[#17243D] text-white'
                    )}
                  >
                    {isCoach ? <Sparkles className="w-4 h-4" /> : 'You'}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2.5',
                      isCoach
                        ? 'bg-[#F6F8FC] border border-[#E6EAF2] text-[#17243D]'
                        : 'bg-[#6658F5] text-white shadow-xs'
                    )}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>

                    {/* Grounded Source Citations */}
                    {msg.sourcesCited && msg.sourcesCited.length > 0 && (
                      <div className="pt-2 border-t border-[#E6EAF2] space-y-1">
                        <p className="text-[10px] font-bold text-[#6658F5] uppercase tracking-wider">
                          Grounded in Knowledge Vault:
                        </p>
                        {msg.sourcesCited.map((sc, i) => (
                          <div
                            key={i}
                            className="p-2 bg-white rounded-lg border border-[#E6EAF2] text-xs text-[#4A5568]"
                          >
                            <span className="font-semibold text-[#17243D]">[{sc.title}]</span>{' '}
                            {sc.snippet}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Proposed Roadmap Plan Preview Card */}
            {proposedPlan && (
              <div className="p-5 bg-white border-2 border-[#6658F5]/30 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-[#6658F5]" />
                    <h4 className="font-heading font-bold text-sm text-[#17243D]">
                      {proposedPlan.roadmapTitle}
                    </h4>
                  </div>
                  <Badge variant="accent">Plan Proposal</Badge>
                </div>

                <p className="text-xs text-[#718096]">{proposedPlan.description}</p>

                <div className="space-y-3">
                  {proposedPlan.milestones?.map((m: any, mIdx: number) => (
                    <div
                      key={mIdx}
                      className="p-3 bg-[#F6F8FC] rounded-2xl border border-[#E6EAF2] space-y-2"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[#17243D]">
                          Milestone {mIdx + 1}: {m.title}
                        </span>
                        <span className="text-[10px] text-[#718096] bg-white px-2 py-0.5 rounded-md border border-[#E6EAF2]">
                          Day {m.targetDay}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {m.tasks?.map((t: any, tIdx: number) => (
                          <div
                            key={tIdx}
                            className="text-xs p-2 bg-white rounded-lg border border-[#E6EAF2] flex justify-between items-center"
                          >
                            <span className="text-[#17243D]">{t.title}</span>
                            <span className="text-[10px] font-semibold text-[#6658F5] uppercase">
                              {t.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0F2FA]">
                  {isPlanConfirmed ? (
                    <span className="text-xs font-bold text-[#20C997] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Tasks added to Planner!
                    </span>
                  ) : (
                    <Button variant="primary" size="sm" onClick={handleConfirmAddPlanToPlanner}>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Add Tasks to Planner</span>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#718096] animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-[#6658F5]" />
                <span>Coach is formulating grounded insights...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Suggestions */}
          <div className="px-6 py-2 bg-[#F8FAFC] border-t border-[#F0F2FA] flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider shrink-0">
              Suggestions:
            </span>
            {promptSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(undefined, s)}
                className="text-[11px] px-2.5 py-1 bg-white hover:bg-[#F0F2FA] text-[#4A5568] hover:text-[#17243D] border border-[#E6EAF2] rounded-lg truncate shrink-0 transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 bg-white border-t border-[#E6EAF2] flex gap-3"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask anything or request a personalized study plan..."
              className="flex-1 px-4 py-2.5 bg-[#FAFBFD] border border-[#E6EAF2] rounded-xl text-xs sm:text-sm text-[#17243D] placeholder-[#94A3B8] focus:outline-none focus:border-[#6658F5] focus:bg-white"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!inputPrompt.trim() || isLoading}
              isLoading={isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>

        {/* Sidebar Context Rail (1 col) */}
        <div className="space-y-6">
          <Card className="p-5 space-y-3">
            <CardTitle className="text-sm">Grounded Vault Sources</CardTitle>
            <CardDescription>
              Saved notes the coach references to avoid hallucinations
            </CardDescription>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-xs text-[#718096] py-3">No notes saved in vault yet.</p>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 bg-[#F6F8FC] rounded-xl border border-[#E6EAF2] text-xs space-y-1"
                  >
                    <p className="font-semibold text-[#17243D] truncate">{n.title}</p>
                    <p className="text-[10px] text-[#718096] line-clamp-2">
                      {n.content.replace(/#|\*|`|_/g, '').slice(0, 80)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5 space-y-2 bg-gradient-to-tr from-amber-50 to-orange-50 border-amber-200">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Pedagogical Guardrails
            </h4>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              SkillCentral Coach strictly respects privacy: it never pretends to integrate directly with external private Gemini chats or unsupported services.
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export default function AICoachPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="py-20 text-center text-xs text-[#718096]">
            Loading AI Coach...
          </div>
        </AppShell>
      }
    >
      <AICoachContent />
    </Suspense>
  );
}
