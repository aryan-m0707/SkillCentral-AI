'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Sector, StudySession } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LearningActivityChartProps {
  sectors: Sector[];
  studySessions: StudySession[];
}

export function LearningActivityChart({
  sectors,
  studySessions,
}: LearningActivityChartProps) {
  const [isStacked, setIsStacked] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Group study sessions by day over the past 7 days
  const data = React.useMemo(() => {
    if (!isMounted) return [];
    const days: any[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]!;
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });

      const point: any = { date: dateStr, label };

      sectors.forEach((sec) => {
        const minutes = studySessions
          .filter(
            (s) =>
              s.sectorId === sec.id &&
              s.completedAt &&
              s.completedAt.startsWith(dateStr)
          )
          .reduce((sum, s) => sum + s.durationMinutes, 0);

        point[sec.id] = minutes;
      });

      days.push(point);
    }
    return days;
  }, [isMounted, sectors, studySessions]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Learning Activity</CardTitle>
          <CardDescription>Real minutes invested per sector (last 7 days)</CardDescription>
        </div>

        <button
          onClick={() => setIsStacked(!isStacked)}
          className="text-xs text-[#6658F5] bg-[#6658F5]/10 px-2.5 py-1 rounded-lg font-medium hover:bg-[#6658F5]/20 transition-colors cursor-pointer"
        >
          {isStacked ? 'Stacked' : 'Grouped'}
        </button>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6EAF2" />
              <XAxis
                dataKey="label"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                unit="m"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const totalMins = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
                    return (
                      <div className="bg-white p-3 rounded-xl border border-[#E6EAF2] shadow-lg text-xs space-y-1.5">
                        <div className="flex justify-between items-center border-b border-[#F0F2FA] pb-1">
                          <span className="font-bold text-[#17243D]">{label}</span>
                          <span className="font-bold text-[#6658F5]">{totalMins} mins total</span>
                        </div>
                        {payload.map((item: any) => {
                          const sec = sectors.find((s) => s.id === item.dataKey);
                          if (!sec || item.value === 0) return null;
                          return (
                            <div key={item.dataKey} className="flex justify-between items-center gap-4">
                              <span className="text-[#718096] flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sec.color }} />
                                {sec.name}
                              </span>
                              <span className="font-semibold text-[#17243D]">{item.value}m</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {sectors.map((sec) => (
                <Bar
                  key={sec.id}
                  dataKey={sec.id}
                  stackId={isStacked ? 'a' : undefined}
                  fill={sec.color}
                  radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
