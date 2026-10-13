'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  Calendar,
  RefreshCw,
  ExternalLink,
  PlugZap,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  updated?: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  updated?: string;
}

interface GoogleTasksViewProps {
  compact?: boolean;
  maxItems?: number;
  className?: string;
}

export function GoogleTasksView({
  compact = false,
  maxItems = 10,
  className,
}: GoogleTasksViewProps) {
  const [tasklists, setTasklists] = useState<GoogleTaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('@default');
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [pageTokens, setPageTokens] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);

  const [connectionStatus, setConnectionStatus] = useState<
    'checking' | 'connected' | 'not_connected' | 'expired' | 'scope_missing'
  >('checking');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Check status
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/status');
      const data = await res.json();
      if (data.googleTasks?.userConnected) {
        setConnectionStatus('connected');
        setUserEmail(data.googleTasks.email || null);
        return true;
      } else if (
        data.googleTasks?.status === 'expired' ||
        data.googleTasks?.status === 'revoked'
      ) {
        setConnectionStatus('expired');
        return false;
      } else if (data.googleTasks?.status === 'scope_missing') {
        setConnectionStatus('scope_missing');
        return false;
      } else {
        setConnectionStatus('not_connected');
        return false;
      }
    } catch {
      setConnectionStatus('not_connected');
      return false;
    }
  }, []);

  // 2. Fetch Task Lists
  const fetchTaskLists = useCallback(async () => {
    setIsLoadingLists(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/integrations/google-tasks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_tasklists' }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresReconnect) {
          setConnectionStatus('expired');
        }
        throw new Error(data.error || 'Failed to load task lists');
      }

      const lists = data.tasklists || [];
      setTasklists(lists);
      if (lists.length > 0 && selectedListId === '@default') {
        setSelectedListId(lists[0].id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not fetch task lists.');
    } finally {
      setIsLoadingLists(false);
    }
  }, [selectedListId]);

  // 3. Fetch Tasks with Pagination
  const fetchTasks = useCallback(
    async (listId: string, token?: string | null) => {
      setIsLoadingTasks(true);
      setErrorMessage(null);
      try {
        const res = await fetch('/api/integrations/google-tasks/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'list_tasks',
            tasklistId: listId || '@default',
            pageToken: token || undefined,
            maxResults: maxItems,
            showCompleted: true,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.requiresReconnect) {
            setConnectionStatus('expired');
          }
          throw new Error(data.error || 'Failed to load tasks');
        }

        setTasks(data.tasks || []);
        setNextPageToken(data.nextPageToken || null);
      } catch (err: any) {
        setErrorMessage(err.message || 'Could not fetch tasks.');
        setTasks([]);
      } finally {
        setIsLoadingTasks(false);
      }
    },
    [maxItems]
  );

  // Initial load
  useEffect(() => {
    checkStatus().then((connected) => {
      if (connected) {
        fetchTaskLists();
      }
    });
  }, [checkStatus, fetchTaskLists]);

  // When selected list changes, reset pagination and fetch tasks
  useEffect(() => {
    if (connectionStatus === 'connected' && selectedListId) {
      setPageTokens([]);
      setPageIndex(0);
      setNextPageToken(null);
      fetchTasks(selectedListId, null);
    }
  }, [connectionStatus, selectedListId, fetchTasks]);

  const handleNextPage = () => {
    if (!nextPageToken) return;
    setPageTokens((prev) => [...prev, nextPageToken]);
    setPageIndex((prev) => prev + 1);
    fetchTasks(selectedListId, nextPageToken);
  };

  const handlePrevPage = () => {
    if (pageIndex === 0) return;
    const newTokens = [...pageTokens];
    newTokens.pop(); // remove current token
    const prevToken = newTokens.length > 0 ? newTokens[newTokens.length - 1] : null;
    setPageTokens(newTokens);
    setPageIndex((prev) => prev - 1);
    fetchTasks(selectedListId, prevToken);
  };

  const handleRefresh = () => {
    fetchTasks(selectedListId, pageTokens[pageIndex - 1] || null);
  };

  return (
    <Card className={cn('p-6 space-y-4', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F2FA]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
            GT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-[#17243D]">
                Google Tasks
              </CardTitle>
              <Badge variant="mint" className="text-[10px] uppercase tracking-wider font-semibold">
                Read-Only
              </Badge>
            </div>
            <CardDescription className="text-xs text-[#718096]">
              {userEmail ? `Synced with ${userEmail}` : 'Live Google Tasks REST API feed'}
            </CardDescription>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {connectionStatus === 'connected' && tasklists.length > 0 && (
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-[#E6EAF2] rounded-lg text-[#17243D] focus:outline-none focus:border-[#6658F5] cursor-pointer max-w-[180px] truncate"
              disabled={isLoadingTasks || isLoadingLists}
            >
              {tasklists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.title}
                </option>
              ))}
            </select>
          )}

          {connectionStatus === 'connected' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isLoadingTasks || isLoadingLists}
              className="text-xs h-8"
              title="Refresh Google Tasks"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#6658F5]" />
            </Button>
          )}

          <Link href="/integrations">
            <Button variant="ghost" size="sm" className="text-xs text-[#718096] h-8">
              <PlugZap className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Connection States */}
      {connectionStatus === 'checking' && (
        <div className="py-8 text-center text-xs text-[#718096]">
          <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#6658F5]" />
          Checking Google Tasks connection...
        </div>
      )}

      {connectionStatus === 'not_connected' && (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#17243D]">
              Google Tasks is Not Connected
            </p>
            <p className="text-xs text-[#718096] max-w-sm mx-auto mt-1">
              Connect your Google account to view and review your Google Tasks directly in SkillCentral in read-only mode.
            </p>
          </div>
          <Link href="/integrations">
            <Button variant="primary" size="sm" className="text-xs">
              <PlugZap className="w-3.5 h-3.5" />
              <span>Connect Google Tasks</span>
            </Button>
          </Link>
        </div>
      )}

      {(connectionStatus === 'expired' || connectionStatus === 'scope_missing') && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {connectionStatus === 'expired'
                  ? 'Session Expired or Revoked'
                  : 'Tasks Read-Only Permission Required'}
              </p>
              <p className="text-amber-700 mt-0.5">
                {connectionStatus === 'expired'
                  ? 'Your Google authorization expired. Reconnect to refresh read access.'
                  : 'Tasks read permission was not granted. Please reconnect and check the box.'}
              </p>
            </div>
          </div>
          <a href="/api/integrations/google-tasks/connect" className="shrink-0 self-end sm:self-center">
            <Button variant="primary" size="sm" className="text-xs bg-amber-600 hover:bg-amber-700">
              <PlugZap className="w-3.5 h-3.5" />
              <span>Reconnect Now</span>
            </Button>
          </a>
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{errorMessage}</span>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="text-xs h-7">
            Retry
          </Button>
        </div>
      )}

      {/* Tasks Listing */}
      {connectionStatus === 'connected' && (
        <div className="space-y-2.5">
          {isLoadingTasks ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-[#F8FAFC] border border-[#E6EAF2] rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-10 text-center space-y-1">
              <p className="text-xs font-semibold text-[#17243D]">
                No tasks found in this list
              </p>
              <p className="text-[11px] text-[#718096]">
                Tasks added to this list in Google Tasks or Google Calendar will appear here.
              </p>
            </div>
          ) : (
            tasks.map((task) => {
              const isCompleted = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  className={cn(
                    'p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5',
                    isCompleted
                      ? 'bg-[#F8FAFC] border-[#E6EAF2] opacity-75'
                      : 'bg-white border-[#E6EAF2] hover:border-[#CBD5E1]'
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5',
                        isCompleted
                          ? 'bg-[#20C997] border-[#20C997] text-white'
                          : 'border-[#CBD5E1] text-transparent'
                      )}
                      title="Read-only status from Google Tasks"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-[#CBD5E1]" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'text-xs font-semibold text-[#17243D]',
                            isCompleted && 'line-through text-[#94A3B8]'
                          )}
                        >
                          {task.title || '(Untitled Task)'}
                        </span>

                        <Badge
                          variant={isCompleted ? 'mint' : 'outline'}
                          className="text-[9px] px-1.5 py-0"
                        >
                          {isCompleted ? 'Completed' : 'Needs Action'}
                        </Badge>
                      </div>

                      {task.notes && (
                        <p className="text-[11px] text-[#718096] line-clamp-1">
                          {task.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-[#94A3B8]">
                        {task.due && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(task.due)}
                          </span>
                        )}
                        <span className="text-[10px] text-[#718096]">
                          Google Tasks item
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-[#94A3B8] self-end sm:self-center font-mono">
                    Read-Only
                  </span>
                </div>
              );
            })
          )}

          {/* Pagination Controls */}
          {connectionStatus === 'connected' && (pageIndex > 0 || nextPageToken) && (
            <div className="flex items-center justify-between pt-2 border-t border-[#F0F2FA] text-xs">
              <span className="text-[11px] text-[#718096]">
                Page {pageIndex + 1}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={pageIndex === 0 || isLoadingTasks}
                  className="h-7 text-xs px-2"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!nextPageToken || isLoadingTasks}
                  className="h-7 text-xs px-2"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Read-only notice */}
      <div className="p-3 bg-[#F6F8FC] rounded-xl text-[11px] text-[#718096] flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#20C997] shrink-0" />
          <span>Read-only sync active. Modifications to Google Tasks must be made in Google Calendar or Google Tasks.</span>
        </span>
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noreferrer"
          className="text-[#6658F5] hover:underline shrink-0 flex items-center gap-0.5 text-[10px] font-semibold"
        >
          <span>Open Google</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </Card>
  );
}
