'use client';

import React from 'react';
import { ActivityEvent } from '@/types';
import { cn } from '@/lib/utils';
import { Flame, CheckCircle2 } from 'lucide-react';

interface WeeklyConsistencyStripProps {
  activityEvents: ActivityEvent[];
  streak: number;
}

export function WeeklyConsistencyStrip({ activityEvents, streak }: WeeklyConsistencyStripProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Last 14 days
  const days = React.useMemo(() => {
    if (!isMounted) return [];
    const list: any[] = [];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]!;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      const dayNum = d.getDate();

      const eventsOnDay = activityEvents.filter(
        (e) => e.timestamp && e.timestamp.startsWith(dateStr)
      );

      list.push({
        date: dateStr,
        dayName,
        dayNum,
        isToday: i === 0,
        active: eventsOnDay.length > 0,
        count: eventsOnDay.length,
      });
    }
    return list;
  }, [isMounted, activityEvents]);

  return (
    <div className="bg-white rounded-2xl border border-[#E6EAF2] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
          <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#17243D] flex items-center gap-1.5">
            <span>{streak} Day Learning Streak</span>
          </h4>
          <p className="text-xs text-[#718096]">
            {streak > 0 ? 'Qualifying activity recorded today' : 'Log a session or quiz to start streak'}
          </p>
        </div>
      </div>

      {/* 14-day strip */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
        {days.map((item) => (
          <div
            key={item.date}
            className="flex flex-col items-center gap-1 shrink-0"
            title={`${item.date}: ${item.count} activities`}
          >
            <span className="text-[10px] font-semibold text-[#94A3B8]">
              {item.dayName}
            </span>
            <div
              className={cn(
                'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold transition-transform',
                item.active
                  ? 'bg-[#20C997] text-white shadow-2xs scale-105'
                  : 'bg-[#F0F2FA] text-[#718096]',
                item.isToday && 'ring-2 ring-[#6658F5] ring-offset-1'
              )}
            >
              {item.dayNum}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
