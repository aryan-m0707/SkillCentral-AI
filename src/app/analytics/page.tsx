'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectorBadge } from '@/components/ui/sector-badge';
import { SectorGrowthChart } from '@/components/charts/sector-growth-chart';
import { LearningActivityChart } from '@/components/charts/learning-activity-chart';
import { SkillBalanceRadar } from '@/components/charts/skill-balance-radar';
import { StorageEngine } from '@/lib/storage';
import { Sector, QuizAttempt, StudySession, ActivityEvent, Task } from '@/types';
import {
  BarChart3,
  Flame,
  Clock,
  GraduationCap,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Info,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function AnalyticsPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [streak, setStreak] = useState(0);
  const [focusHours, setFocusHours] = useState(0);
  const [masteryData, setMasteryData] = useState<{ score: number | null; totalAttempts: number }>({
    score: null,
    totalAttempts: 0,
  });

  useEffect(() => {
    const s = StorageEngine.getSectors();
    const q = StorageEngine.getQuizAttempts();
    const sess = StorageEngine.getStudySessions();
    const evts = StorageEngine.getActivityEvents(90);
    const t = StorageEngine.getTasks();

    setSectors(s);
    setQuizAttempts(q);
    setStudySessions(sess);
    setActivityEvents(evts);
    setTasks(t);

    setStreak(StorageEngine.calculateStreak());
    setFocusHours(StorageEngine.calculateFocusHoursThisWeek());
    setMasteryData(StorageEngine.calculateMasteryScore());
  }, []);

  return (
    <AppShell>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#17243D] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-[#6658F5]" />
            <span>Learning Analytics &amp; Scoring</span>
          </h2>
          <p className="text-sm text-[#718096] mt-1">
            Empirical metrics derived strictly from actual recorded quizzes, study sessions, and milestone events
          </p>
        </div>
      </div>

      {/* Methodology Explainer Alert */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 leading-relaxed space-y-1">
          <p className="font-bold">Transparent Scoring Philosophy:</p>
          <p>
            • <strong>Mastery:</strong> Real average accuracy across completed quizzes. Never an arbitrary AI hallucination.<br />
            • <strong>Streak:</strong> Consecutive calendar days with a recorded qualifying learning event in your local timezone.<br />
            • <strong>Daily Tasks:</strong> Measured by completion rate, explicitly distinguished from conceptual knowledge mastery.
          </p>
        </div>
      </div>

      {/* 4 Summary Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#718096] uppercase">Active Streak</p>
            <h3 className="font-heading text-3xl font-bold text-[#17243D] mt-1">{streak} Days</h3>
            <p className="text-[11px] text-[#20C997] font-medium mt-1">Evidence-backed</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-200">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#718096] uppercase">Focus Time</p>
            <h3 className="font-heading text-3xl font-bold text-[#17243D] mt-1">{focusHours}h</h3>
            <p className="text-[11px] text-[#718096] mt-1">Logged this week</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#20C997]/15 text-[#138A67] flex items-center justify-center border border-[#20C997]/30">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#718096] uppercase">Quiz Accuracy</p>
            <h3 className="font-heading text-3xl font-bold text-[#17243D] mt-1">
              {masteryData.score !== null ? `${masteryData.score}%` : 'N/A'}
            </h3>
            <p className="text-[11px] text-[#718096] mt-1">
              {masteryData.totalAttempts} total attempts
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#6658F5]/10 text-[#6658F5] flex items-center justify-center border border-[#6658F5]/20">
            <GraduationCap className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#718096] uppercase">Activity Events</p>
            <h3 className="font-heading text-3xl font-bold text-[#17243D] mt-1">
              {activityEvents.length}
            </h3>
            <p className="text-[11px] text-[#718096] mt-1">Recorded in log</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Sector Deep-Dive Breakdown Table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Sector Performance Breakdown</CardTitle>
          <CardDescription>
            Measured statistics per domain: focus hours, task execution, and quiz mastery
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F6F8FC] border-y border-[#E6EAF2] text-[#718096] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Sector</th>
                <th className="py-3 px-6">Focus Time</th>
                <th className="py-3 px-6">Tasks Completed</th>
                <th className="py-3 px-6">Quiz Attempts</th>
                <th className="py-3 px-6">Measured Metric</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2FA]">
              {sectors.map((sec) => {
                const sectorSessions = studySessions.filter((s) => s.sectorId === sec.id);
                const totalMinutes = sectorSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
                const hours = (totalMinutes / 60).toFixed(1);

                const sectorTasks = tasks.filter((t) => t.sectorId === sec.id);
                const completedTasks = sectorTasks.filter((t) => t.status === 'completed').length;
                const taskRate =
                  sectorTasks.length > 0
                    ? Math.round((completedTasks / sectorTasks.length) * 100)
                    : 0;

                const sectorAttempts = quizAttempts.filter((a) => a.sectorId === sec.id);
                const avgScore =
                  sectorAttempts.length > 0
                    ? Math.round(
                        sectorAttempts.reduce((sum, a) => sum + a.score, 0) / sectorAttempts.length
                      )
                    : null;

                const isDaily = sec.id === 'sec-daily-tasks';

                return (
                  <tr key={sec.id} className="hover:bg-[#FAFBFD] transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#17243D]">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: sec.color }}
                        />
                        <span>{sec.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#4A5568]">{hours} hrs</td>
                    <td className="py-4 px-6 text-[#4A5568]">
                      {completedTasks} / {sectorTasks.length} ({taskRate}%)
                    </td>
                    <td className="py-4 px-6 text-[#4A5568]">
                      {sectorAttempts.length} attempts
                    </td>
                    <td className="py-4 px-6">
                      {isDaily ? (
                        <span className="text-[11px] font-semibold text-[#718096]">
                          {taskRate}% execution rate (Daily Habits)
                        </span>
                      ) : avgScore !== null ? (
                        <span className="font-bold text-[#6658F5]">
                          {avgScore}% Quiz Mastery
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">Insufficient quiz data</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectorGrowthChart
          sectors={sectors}
          activityEvents={activityEvents}
          studySessions={studySessions}
        />
        <SkillBalanceRadar
          sectors={sectors}
          activityEvents={activityEvents}
          quizAttempts={quizAttempts}
        />
      </div>
    </AppShell>
  );
}
