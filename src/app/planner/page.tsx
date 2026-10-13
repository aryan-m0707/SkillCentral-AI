'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SectorBadge } from '@/components/ui/sector-badge';
import { StorageEngine } from '@/lib/storage';
import { Sector, Task } from '@/types';
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  PlugZap,
  RefreshCw,
  ExternalLink,
  Calendar,
  AlertCircle,
  Filter,
  Download,
  Upload,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function PlannerPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeView, setActiveView] = useState<'today' | 'week' | 'upcoming'>('today');
  const [filterSectorId, setFilterSectorId] = useState<string>('');
  const [todayStr, setTodayStr] = useState('');

  // Task creation form modal/drawer
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newSectorId, setNewSectorId] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newTimeStart, setNewTimeStart] = useState('09:00');
  const [newTimeEnd, setNewTimeEnd] = useState('10:00');
  const [syncOnCreate, setSyncOnCreate] = useState(true);

  // Google Tasks Integration State
  const [googleTasksConnected, setGoogleTasksConnected] = useState(false);
  const [googleAccountEmail, setGoogleAccountEmail] = useState<string | null>(null);
  const [tasklists, setTasklists] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedTasklistId, setSelectedTasklistId] = useState<string>('@default');
  const [syncingTaskId, setSyncingTaskId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const loadData = () => {
    const s = StorageEngine.getSectors();
    const t = StorageEngine.getTasks();
    const today = new Date().toISOString().split('T')[0]!;
    setTodayStr(today);
    setNewDueDate((prev) => prev || today);
    setSectors(s);
    setTasks(t);
    if (s.length > 0 && !newSectorId) setNewSectorId(s[0]!.id);

    // Check integration status
    fetch('/api/integrations/status')
      .then((r) => r.json())
      .then((d) => {
        const isConnected = Boolean(d.googleTasks?.userConnected);
        setGoogleTasksConnected(isConnected);
        setGoogleAccountEmail(d.googleTasks?.userEmail || null);

        if (isConnected) {
          // Fetch Google Tasks task lists
          fetch('/api/integrations/google-tasks/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list_tasklists' }),
          })
            .then((res) => res.json())
            .then((listData) => {
              if (Array.isArray(listData.tasklists) && listData.tasklists.length > 0) {
                setTasklists(listData.tasklists);
                if (selectedTasklistId === '@default') {
                  setSelectedTasklistId(listData.tasklists[0].id || '@default');
                }
              }
            })
            .catch((err) => console.warn('Failed to load tasklists:', err));
        }
      })
      .catch(() => setGoogleTasksConnected(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleTaskStatus = async (task: Task) => {
    const isCompleted = task.status === 'completed';
    const nextStatus = isCompleted ? 'todo' : 'completed';

    StorageEngine.saveTask({
      id: task.id,
      title: task.title,
      sectorId: task.sectorId,
      status: nextStatus,
    });

    loadData();

    // If linked to Google Tasks and user is connected, sync the status patch!
    if (task.externalTaskId && googleTasksConnected) {
      try {
        await fetch('/api/integrations/google-tasks/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'patch_task',
            taskId: task.externalTaskId,
            tasklistId: task.externalListId || selectedTasklistId || '@default',
            completed: !isCompleted,
          }),
        });
      } catch (e) {
        console.warn('Status patch to Google Tasks failed:', e);
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const createdLocal = StorageEngine.saveTask({
      title: newTitle.trim(),
      details: newDetails.trim() || undefined,
      sectorId: newSectorId || sectors[0]?.id || 'sec-academics',
      priority: newPriority,
      dueDate: newDueDate || undefined,
      timeBlockStart: newTimeStart || undefined,
      timeBlockEnd: newTimeEnd || undefined,
      status: 'todo',
    });

    // Auto-sync to Google Tasks if connected and toggle checked
    if (googleTasksConnected && syncOnCreate) {
      try {
        const res = await fetch('/api/integrations/google-tasks/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'push_task',
            tasklistId: selectedTasklistId,
            task: {
              title: createdLocal.title,
              details: createdLocal.details,
              dueDate: createdLocal.dueDate,
            },
          }),
        });
        const data = await res.json();
        if (res.ok && data.externalTaskId) {
          StorageEngine.saveTask({
            ...createdLocal,
            externalTaskId: data.externalTaskId,
            externalListId: data.externalListId,
          });
          setSyncFeedback(`Saved & synced "${createdLocal.title}" to Google Tasks!`);
          setTimeout(() => setSyncFeedback(null), 3000);
        }
      } catch (syncErr) {
        console.warn('Auto-push to Google Tasks failed:', syncErr);
      }
    }

    setNewTitle('');
    setNewDetails('');
    setIsAddingTask(false);
    loadData();
  };

  const handleDeleteTask = async (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    StorageEngine.deleteTask(id);
    loadData();

    if (taskToDelete?.externalTaskId && googleTasksConnected) {
      try {
        await fetch('/api/integrations/google-tasks/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete_task',
            taskId: taskToDelete.externalTaskId,
            tasklistId: taskToDelete.externalListId || selectedTasklistId || '@default',
          }),
        });
      } catch (e) {
        console.warn('Google Tasks deletion failed:', e);
      }
    }
  };

  // Push individual task to Google Tasks
  const handlePushToGoogleTasks = async (task: Task) => {
    setSyncingTaskId(task.id);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/integrations/google-tasks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'push_task',
          tasklistId: selectedTasklistId,
          task: {
            title: task.title,
            details: task.details,
            dueDate: task.dueDate,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Push failed');
      }

      // Update local task with external task ID to prevent duplicates!
      StorageEngine.saveTask({
        id: task.id,
        title: task.title,
        sectorId: task.sectorId,
        externalTaskId: data.externalTaskId,
        externalListId: data.externalListId || selectedTasklistId,
      });

      setSyncFeedback(`Pushed "${task.title}" to Google Tasks!`);
      loadData();
    } catch (err: any) {
      setSyncFeedback(`Error: ${err.message}`);
    } finally {
      setSyncingTaskId(null);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // Import tasks from Google Tasks
  const handleImportFromGoogleTasks = async () => {
    setIsImporting(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/integrations/google-tasks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list_tasks',
          tasklistId: selectedTasklistId,
          showCompleted: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to retrieve tasks from Google');

      const currentTasks = StorageEngine.getTasks();
      const existingExternalIds = new Set(currentTasks.map((t) => t.externalTaskId).filter(Boolean));
      let importedCount = 0;

      if (Array.isArray(data.tasks)) {
        for (const gt of data.tasks) {
          if (!gt.title || existingExternalIds.has(gt.id)) continue;

          let dueDateStr: string | undefined = undefined;
          if (gt.due) {
            dueDateStr = gt.due.split('T')[0];
          }

          StorageEngine.saveTask({
            title: gt.title,
            details: gt.notes || undefined,
            dueDate: dueDateStr,
            status: gt.status === 'completed' ? 'completed' : 'todo',
            sectorId: sectors[0]?.id || 'sec-academics',
            priority: 'medium',
            externalTaskId: gt.id,
            externalListId: selectedTasklistId,
          });
          importedCount++;
        }
      }

      setSyncFeedback(
        importedCount > 0
          ? `Imported ${importedCount} task(s) from Google Tasks into your Planner!`
          : 'Google Tasks are all already up-to-date in your Planner.'
      );
      loadData();
    } catch (err: any) {
      setSyncFeedback(`Import error: ${err.message}`);
    } finally {
      setIsImporting(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // Push all unsynced tasks to Google Tasks
  const handlePushAllUnsynced = async () => {
    const unsynced = tasks.filter((t) => !t.externalTaskId);
    if (unsynced.length === 0) {
      setSyncFeedback('All tasks in your Planner are already synced with Google Tasks!');
      setTimeout(() => setSyncFeedback(null), 3000);
      return;
    }

    setIsBatchSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/integrations/google-tasks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_push',
          tasklistId: selectedTasklistId,
          tasks: unsynced.map((t) => ({
            id: t.id,
            title: t.title,
            details: t.details,
            dueDate: t.dueDate,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch sync failed');

      if (Array.isArray(data.results)) {
        for (const item of data.results) {
          const existing = tasks.find((t) => t.id === item.id);
          if (existing) {
            StorageEngine.saveTask({
              ...existing,
              externalTaskId: item.externalTaskId,
              externalListId: item.externalListId,
            });
          }
        }
      }

      setSyncFeedback(`Successfully synced ${data.count || 0} task(s) to Google Tasks!`);
      loadData();
    } catch (err: any) {
      setSyncFeedback(`Batch sync error: ${err.message}`);
    } finally {
      setIsBatchSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // Filter tasks by view and sector
  const filteredTasks = tasks.filter((t) => {
    if (filterSectorId && t.sectorId !== filterSectorId) return false;

    if (activeView === 'today') {
      return !t.dueDate || t.dueDate === todayStr;
    }
    if (activeView === 'week') {
      // within next 7 days
      return true;
    }
    return true; // upcoming
  });

  const completedCount = filteredTasks.filter((t) => t.status === 'completed').length;
  const progressPercent =
    filteredTasks.length > 0 ? Math.round((completedCount / filteredTasks.length) * 100) : 0;

  return (
    <AppShell>
      {/* Title & Google Tasks Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#17243D] tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-[#6658F5]" />
            <span>Planner &amp; Tasks</span>
          </h2>
          <p className="text-sm text-[#718096] mt-1">
            Granular time-block scheduling with optional Google Tasks two-way synchronization
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {googleTasksConnected ? (
            <>
              {tasklists.length > 1 && (
                <select
                  value={selectedTasklistId}
                  onChange={(e) => setSelectedTasklistId(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-[#E6EAF2] rounded-xl text-xs text-[#17243D] focus:outline-none focus:border-[#6658F5]"
                  title="Target Google Tasks list"
                >
                  {tasklists.map((tl) => (
                    <option key={tl.id} value={tl.id}>
                      {tl.title}
                    </option>
                  ))}
                </select>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleImportFromGoogleTasks}
                isLoading={isImporting}
                className="text-xs text-[#17243D]"
                title="Download tasks from your Google Tasks account into Planner"
              >
                <Download className="w-3.5 h-3.5 text-[#6658F5]" />
                <span>Import from Google</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePushAllUnsynced}
                isLoading={isBatchSyncing}
                className="text-xs text-[#17243D]"
                title="Push all local unsynced tasks to Google Tasks"
              >
                <Upload className="w-3.5 h-3.5 text-[#20C997]" />
                <span>Push Unsynced</span>
              </Button>

              <Link href="/integrations">
                <Badge variant="mint" className="py-1 px-2.5 text-xs font-medium cursor-pointer">
                  <PlugZap className="w-3 h-3" />
                  <span>{googleAccountEmail ? googleAccountEmail.split('@')[0] : 'Connected'}</span>
                </Badge>
              </Link>
            </>
          ) : (
            <Link href="/integrations">
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-[#6658F5] border-[#6658F5]/30 hover:bg-[#6658F5]/10"
              >
                <PlugZap className="w-3.5 h-3.5 text-[#6658F5]" />
                <span>Connect Google Tasks</span>
              </Button>
            </Link>
          )}

          <Button variant="primary" size="sm" onClick={() => setIsAddingTask(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#6658F5]" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Critical Limitation Banner */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">Google Tasks API Architectural Note:</span> Google Tasks stores calendar date only and discards hours/minutes. SkillCentral strictly owns and preserves accurate local time-block scheduling (e.g. 10:00–11:30) without data loss.
        </div>
      </div>

      {/* View Tabs & Sector Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Today / Week / Upcoming */}
        <div className="grid grid-cols-3 gap-1 bg-[#F0F2FA] p-1 rounded-xl max-w-xs">
          {(['today', 'week', 'upcoming'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={cn(
                'py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer',
                activeView === view
                  ? 'bg-white text-[#6658F5] shadow-xs'
                  : 'text-[#718096] hover:text-[#17243D]'
              )}
            >
              {view}
            </button>
          ))}
        </div>

        {/* Sector Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
          <select
            value={filterSectorId}
            onChange={(e) => setFilterSectorId(e.target.value)}
            className="text-xs px-3 py-1.5 bg-white border border-[#E6EAF2] rounded-xl text-[#17243D] focus:outline-none"
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

      {/* Add Task Form (Inline Toggle) */}
      {isAddingTask && (
        <Card className="p-6 border-[#6658F5]/30 animate-in fade-in">
          <form onSubmit={handleCreateTask} className="space-y-4">
            <h4 className="font-heading font-bold text-sm text-[#17243D]">
              Schedule New Study Task
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Task Title"
                placeholder="e.g. Read Chapter 4 on Consensus Protocols"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                autoFocus
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#718096] mb-1.5">
                  Sector
                </label>
                <select
                  value={newSectorId}
                  onChange={(e) => setNewSectorId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E6EAF2] rounded-xl text-sm text-[#17243D] focus:outline-none focus:border-[#6658F5]"
                >
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                type="date"
                label="Due Date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />

              <Input
                type="time"
                label="Time Block Start"
                value={newTimeStart}
                onChange={(e) => setNewTimeStart(e.target.value)}
              />

              <Input
                type="time"
                label="Time Block End"
                value={newTimeEnd}
                onChange={(e) => setNewTimeEnd(e.target.value)}
              />
            </div>

            <Input
              label="Details / Notes (Optional)"
              placeholder="Resources, links, or specific acceptance criteria"
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-[#F0F2FA]">
              {googleTasksConnected ? (
                <label className="flex items-center gap-2 text-xs text-[#17243D] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={syncOnCreate}
                    onChange={(e) => setSyncOnCreate(e.target.checked)}
                    className="w-4 h-4 rounded border-[#E6EAF2] text-[#6658F5] focus:ring-[#6658F5] cursor-pointer"
                  />
                  <span className="font-medium flex items-center gap-1.5">
                    <PlugZap className="w-3.5 h-3.5 text-[#6658F5]" />
                    <span>Sync to Google Tasks immediately</span>
                  </span>
                </label>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2 self-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingTask(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Task
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Tasks List */}
      <Card className="p-6 space-y-4">
        {/* Progress Summary Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0F2FA]">
          <div>
            <CardTitle className="text-base">
              {activeView === 'today' ? "Today's Agenda" : `${activeView} Tasks`}
            </CardTitle>
            <CardDescription>
              {completedCount} of {filteredTasks.length} tasks completed ({progressPercent}%)
            </CardDescription>
          </div>

          {/* Progress bar */}
          <div className="w-32 bg-[#F0F2FA] rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#20C997] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Task Rows */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#718096]">
              No tasks scheduled for this view. Click &quot;Add Task&quot; above to schedule one.
            </div>
          ) : (
            filteredTasks.map((t) => {
              const sec = sectors.find((s) => s.id === t.sectorId);
              const isCompleted = t.status === 'completed';

              return (
                <div
                  key={t.id}
                  className={cn(
                    'p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                    isCompleted
                      ? 'bg-[#F8FAFC] border-[#E6EAF2] opacity-75'
                      : 'bg-white border-[#E6EAF2] hover:border-[#CBD5E1]'
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleTaskStatus(t)}
                      className={cn(
                        'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer',
                        isCompleted
                          ? 'bg-[#20C997] border-[#20C997] text-white'
                          : 'border-[#CBD5E1] hover:border-[#6658F5]'
                      )}
                    >
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'text-sm font-semibold text-[#17243D]',
                            isCompleted && 'line-through text-[#94A3B8]'
                          )}
                        >
                          {t.title}
                        </span>

                        {sec && <SectorBadge sector={sec} size="sm" />}

                        {t.priority === 'high' && (
                          <Badge variant="danger" className="text-[10px]">
                            High Priority
                          </Badge>
                        )}
                      </div>

                      {t.details && (
                        <p className="text-xs text-[#718096] line-clamp-1">{t.details}</p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-[#94A3B8]">
                        {t.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(t.dueDate)}
                          </span>
                        )}
                        {t.timeBlockStart && (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {t.timeBlockStart} {t.timeBlockEnd ? `- ${t.timeBlockEnd}` : ''}
                          </span>
                        )}
                        {t.externalTaskId && (
                          <span className="text-[10px] text-[#20C997] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Synced with Google Tasks
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {googleTasksConnected && !t.externalTaskId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePushToGoogleTasks(t)}
                        isLoading={syncingTaskId === t.id}
                        className="text-xs"
                      >
                        <PlugZap className="w-3 h-3 text-[#6658F5]" />
                        <span>Push to Google Tasks</span>
                      </Button>
                    )}

                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="p-1.5 text-[#94A3B8] hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </AppShell>
  );
}
