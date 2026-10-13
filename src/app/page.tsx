'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectorBadge, getSectorIcon } from '@/components/ui/sector-badge';
import { SectorGrowthChart } from '@/components/charts/sector-growth-chart';
import { LearningActivityChart } from '@/components/charts/learning-activity-chart';
import { SkillBalanceRadar } from '@/components/charts/skill-balance-radar';
import { WeeklyConsistencyStrip } from '@/components/charts/weekly-consistency-strip';
import { StorageEngine } from '@/lib/storage';
import {
  Sector,
  Task,
  Note,
  QuizAttempt,
  StudySession,
  ActivityEvent,
} from '@/types';
import {
  Flame,
  Clock,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Plus,
  Play,
  BookOpen,
  Calendar,
  AlertCircle,
  Lightbulb,
  ListTodo,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { GoogleTasksView } from '@/components/google-tasks-view';

export default function DashboardPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskTab, setActiveTaskTab] = useState<'local' | 'google'>('local');
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);

  // Calculated KPI states
  const [streak, setStreak] = useState(0);
  const [focusHours, setFocusHours] = useState(0);
  const [masteryData, setMasteryData] = useState<{ score: number | null; totalAttempts: number }>({
    score: null,
    totalAttempts: 0,
  });
  const [taskStats, setTaskStats] = useState({ completed: 0, total: 0, rate: 0 });

  // Coach Insight State
  const [coachInsight, setCoachInsight] = useState<string>(
    'Reviewing your recent study data: You completed high-accuracy quizzes in Specialization! Consider dedicating 20 minutes to Language Learning grammar drills to balance your weekly rhythm.'
  );
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  const refreshData = () => {
    const s = StorageEngine.getSectors();
    const t = StorageEngine.getTasks();
    const n = StorageEngine.getNotes();
    const q = StorageEngine.getQuizAttempts();
    const sess = StorageEngine.getStudySessions();
    const evts = StorageEngine.getActivityEvents(30);

    setSectors(s);
    setTasks(t);
    setRecentNotes(n.slice(0, 4));
    setQuizAttempts(q);
    setStudySessions(sess);
    setActivityEvents(evts);

    setStreak(StorageEngine.calculateStreak());
    setFocusHours(StorageEngine.calculateFocusHoursThisWeek());
    setMasteryData(StorageEngine.calculateMasteryScore());
    setTaskStats(StorageEngine.calculateTaskCompletionRate());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleToggleTask = (taskId: string, currentStatus: Task['status']) => {
    const nextStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    StorageEngine.saveTask({
      id: taskId,
      title: tasks.find((t) => t.id === taskId)?.title || '',
      sectorId: tasks.find((t) => t.id === taskId)?.sectorId || '',
      status: nextStatus,
    });
    refreshData();
  };

  const handleGenerateInsight = async () => {
    setIsGeneratingInsight(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content:
                'Generate a short 2-sentence actionable coaching recommendation based on my current study progress.',
            },
          ],
          mode: 'explain',
          notesContext: recentNotes.map((n) => ({ id: n.id, title: n.title, content: n.content })),
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setCoachInsight(data.reply);
      }
    } catch (e) {
      console.warn('Insight fallback:', e);
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const handleCreateActionFromInsight = () => {
    StorageEngine.saveTask({
      title: 'Action from Coach: 20m Language Learning Focus',
      sectorId: 'sec-languages',
      priority: 'medium',
      status: 'todo',
    });
    refreshData();
  };

  return (
    <AppShell>
      {/* Welcome Greeting & Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#17243D] tracking-tight">
            Welcome back, Alex 👋
          </h2>
          <p className="text-sm text-[#718096] mt-1">
            Capture, organize, and measure your learning across your knowledge sectors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/youtube">
            <Button variant="outline" size="sm" className="bg-white">
              <Play className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Study YouTube Video</span>
            </Button>
          </Link>
          <Link href="/coach">
            <Button variant="primary" size="sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Coach</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Four Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Streak */}
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#718096] uppercase tracking-wider">
              Learning Streak
            </p>
            <h3 className="font-heading text-3xl font-bold text-[#17243D] mt-1.5 flex items-baseline gap-1.5">
              <span>{streak}</span>
              <span className="text-sm font-medium text-[#718096]">days</span>
            </h3>
            <p className="text-[11px] text-[#20C997] font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Qualifying calendar days
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-200">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
        </Card>

        {/* KPI 2: Focus Hours */}
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#718096] uppercase tracking-wider">
              Focus Hours This Week
            </p>
            <h3 className="font-heading text-3xl font-bold text-[#17243D] mt-1.5 flex items-baseline gap-1.5">
              <span>{focusHours}</span>
              <span className="text-sm font-medium text-[#718096]">hrs</span>
            </h3>
            <p className="text-[11px] text-[#718096] mt-1">Logged from study timer</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#20C997]/15 text-[#138A67] flex items-center justify-center border border-[#20C997]/30">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        {/* KPI 3: Tasks Completed */}
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#718096] uppercase tracking-wider">
              Tasks Completed
            </p>
            <h3 className="font-heading text-3xl font-bold text-[#17243D] mt-1.5 flex items-baseline gap-1.5">
              <span>{taskStats.completed}</span>
              <span className="text-sm font-medium text-[#718096]">/ {taskStats.total}</span>
            </h3>
            <p className="text-[11px] text-[#6658F5] font-medium mt-1">
              {taskStats.rate}% completion rate
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#6658F5]/10 text-[#6658F5] flex items-center justify-center border border-[#6658F5]/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Card>

        {/* KPI 4: Measured Mastery */}
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#718096] uppercase tracking-wider">
              Learning Mastery
            </p>
            <h3 className="font-heading text-3xl font-bold text-[#17243D] mt-1.5 flex items-baseline gap-1.5">
              {masteryData.score !== null ? (
                <>
                  <span>{masteryData.score}%</span>
                  <span className="text-sm font-medium text-[#718096]">accuracy</span>
                </>
              ) : (
                <span className="text-sm font-normal text-[#94A3B8]">Not enough quiz data</span>
              )}
            </h3>
            <p className="text-[11px] text-[#718096] mt-1">
              {masteryData.totalAttempts > 0
                ? `Derived from ${masteryData.totalAttempts} quiz attempts`
                : 'Take a quiz to start measuring'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
            <GraduationCap className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Weekly Consistency Strip */}
      <WeeklyConsistencyStrip activityEvents={activityEvents} streak={streak} />

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Multi-Series Sector Growth Chart (2 cols) */}
        <div className="lg:col-span-2">
          <SectorGrowthChart
            sectors={sectors}
            activityEvents={activityEvents}
            studySessions={studySessions}
          />
        </div>

        {/* Radar Skill Balance or Coach Panel (1 col) */}
        <div className="lg:col-span-1 space-y-6">
          <SkillBalanceRadar
            sectors={sectors}
            activityEvents={activityEvents}
            quizAttempts={quizAttempts}
          />
        </div>
      </div>

      {/* Learning Activity & Coach Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Learning Activity Stacked Minutes Chart */}
        <div className="lg:col-span-2">
          <LearningActivityChart sectors={sectors} studySessions={studySessions} />
        </div>

        {/* Gemini Coach Insight Rail */}
        <Card className="lg:col-span-1 bg-gradient-to-b from-white to-[#F8FAFC]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-[#6658F5]">
              <Sparkles className="w-4 h-4" />
              <CardTitle className="text-base">Gemini Coach Insight</CardTitle>
            </div>
            <CardDescription>Real-time synthesis of your study evidence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="p-4 bg-[#6658F5]/5 border border-[#6658F5]/15 rounded-2xl">
              <p className="text-xs text-[#17243D] leading-relaxed italic">
                &ldquo;{coachInsight}&rdquo;
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateInsight}
                isLoading={isGeneratingInsight}
                className="flex-1 text-xs"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>New Insight</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateActionFromInsight}
                className="flex-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Action</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Learning Spaces (All User Sectors) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold text-[#17243D]">
              My Learning Spaces
            </h3>
            <p className="text-xs text-[#718096]">
              Your personalized knowledge sectors with real progress &amp; milestone tracking
            </p>
          </div>
          <Link href="/vault">
            <Button variant="ghost" size="sm" className="text-xs text-[#6658F5]">
              <span>View All in Vault</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {sectors.map((sec) => {
            const SecIcon = getSectorIcon(sec.icon);
            const sectorNotes = recentNotes.filter((n) => n.sectorId === sec.id);
            const sectorTasks = tasks.filter((t) => t.sectorId === sec.id);
            const completedTasks = sectorTasks.filter((t) => t.status === 'completed').length;
            const rate = sectorTasks.length > 0 ? Math.round((completedTasks / sectorTasks.length) * 100) : 0;

            return (
              <Card
                key={sec.id}
                hoverEffect
                className="p-4 flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                      style={{
                        backgroundColor: `${sec.color}18`,
                        color: sec.color,
                      }}
                    >
                      <SecIcon className="w-5 h-5" />
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: `${sec.color}15`,
                        color: sec.color,
                      }}
                    >
                      {rate}%
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-[#17243D] group-hover:text-[#6658F5] transition-colors truncate">
                      {sec.name}
                    </h4>
                    <p className="text-[11px] text-[#718096] line-clamp-2 mt-0.5">
                      {sec.description || 'Active knowledge domain'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0F2FA] flex items-center justify-between text-[11px] text-[#718096]">
                  <span>{sectorTasks.length} tasks</span>
                  <Link
                    href={`/vault?sectorId=${sec.id}`}
                    className="text-[#6658F5] font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Two-Column Lower Section: Today's Plan & Recent Knowledge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Plan Checklist */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Today&apos;s Plan &amp; Tasks</CardTitle>
              <CardDescription>Scheduled practice items and live task feeds</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-[#F0F2FA] p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setActiveTaskTab('local')}
                  className={cn(
                    'px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                    activeTaskTab === 'local'
                      ? 'bg-white text-[#6658F5] shadow-xs'
                      : 'text-[#718096] hover:text-[#17243D]'
                  )}
                >
                  SkillCentral
                </button>
                <button
                  onClick={() => setActiveTaskTab('google')}
                  className={cn(
                    'px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1',
                    activeTaskTab === 'google'
                      ? 'bg-white text-[#6658F5] shadow-xs'
                      : 'text-[#718096] hover:text-[#17243D]'
                  )}
                >
                  <ListTodo className="w-3 h-3" />
                  <span>Google Tasks</span>
                </button>
              </div>
              <Link href="/planner">
                <Button variant="ghost" size="sm" className="text-xs text-[#6658F5] h-7 px-2">
                  <span>Planner</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-2.5">
            {activeTaskTab === 'google' ? (
              <GoogleTasksView compact maxItems={4} className="p-0 border-0 shadow-none space-y-2" />
            ) : tasks.length === 0 ? (
              <p className="text-xs text-[#718096] py-6 text-center">
                No active tasks. Use Quick Capture to add your first study task!
              </p>
            ) : (
              tasks.slice(0, 5).map((t) => {
                const sec = sectors.find((s) => s.id === t.sectorId);
                const isCompleted = t.status === 'completed';
                return (
                  <div
                    key={t.id}
                    className={cn(
                      'p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors',
                      isCompleted
                        ? 'bg-[#F8FAFC] border-[#E6EAF2] opacity-70'
                        : 'bg-white border-[#E6EAF2] hover:border-[#CBD5E1]'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTask(t.id, t.status)}
                        className={cn(
                          'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer',
                          isCompleted
                            ? 'bg-[#20C997] border-[#20C997] text-white'
                            : 'border-[#CBD5E1] hover:border-[#6658F5]'
                        )}
                      >
                        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'text-xs font-semibold text-[#17243D] truncate',
                            isCompleted && 'line-through text-[#94A3B8]'
                          )}
                        >
                          {t.title}
                        </p>
                        {t.timeBlockStart && (
                          <p className="text-[10px] text-[#718096]">
                            {t.timeBlockStart} {t.timeBlockEnd ? `- ${t.timeBlockEnd}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    {sec && (
                      <SectorBadge sector={sec} size="sm" showIcon={false} />
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Knowledge Vault Notes */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recent Knowledge Vault Notes</CardTitle>
              <CardDescription>Grounded notes ready for AI Coach Q&amp;A</CardDescription>
            </div>
            <Link href="/vault">
              <Button variant="ghost" size="sm" className="text-xs text-[#6658F5]">
                <span>Vault</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex-1 space-y-2.5">
            {recentNotes.length === 0 ? (
              <p className="text-xs text-[#718096] py-6 text-center">
                Your vault is empty. Capture notes or import YouTube summaries.
              </p>
            ) : (
              recentNotes.map((n) => {
                const sec = sectors.find((s) => s.id === n.sectorId);
                return (
                  <Link
                    key={n.id}
                    href={`/vault?noteId=${n.id}`}
                    className="block p-3 rounded-xl border border-[#E6EAF2] hover:border-[#6658F5]/40 hover:shadow-2xs transition-all bg-white"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-semibold text-[#17243D] truncate">
                        {n.title}
                      </h4>
                      {sec && <SectorBadge sector={sec} size="sm" />}
                    </div>
                    <p className="text-[11px] text-[#718096] line-clamp-1">
                      {n.content.replace(/#|\*|`|_/g, '').slice(0, 100)}
                    </p>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
