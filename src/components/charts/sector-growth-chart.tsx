'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Sector } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SectorGrowthChartProps {
  sectors: Sector[];
  activityEvents: any[];
  studySessions: any[];
}

export function SectorGrowthChart({
  sectors,
  activityEvents,
  studySessions,
}: SectorGrowthChartProps) {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('7');
  const [activeSectorIds, setActiveSectorIds] = useState<string[]>(
    sectors.map((s) => s.id)
  );
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const daysCount = parseInt(timeRange);

  // Generate date series for the last N days
  const data = React.useMemo(() => {
    if (!isMounted) return [];
    const points: any[] = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]!;
      const label = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const point: any = { date: dateStr, label };

      sectors.forEach((sec) => {
        // Calculate minutes or events on this date
        const dayMinutes = studySessions
          .filter(
            (s) =>
              s.sectorId === sec.id &&
              s.completedAt &&
              s.completedAt.startsWith(dateStr)
          )
          .reduce((sum, s) => sum + s.durationMinutes, 0);

        const dayEvents = activityEvents.filter(
          (e) =>
            e.sectorId === sec.id &&
            e.timestamp &&
            e.timestamp.startsWith(dateStr)
        ).length;

        // Metric: cumulative engagement or minutes invested
        point[sec.id] = dayMinutes + dayEvents * 10;
      });

      points.push(point);
    }
    return points;
  }, [isMounted, daysCount, sectors, activityEvents, studySessions]);

  const toggleSector = (id: string) => {
    if (activeSectorIds.includes(id)) {
      if (activeSectorIds.length > 1) {
        setActiveSectorIds(activeSectorIds.filter((sid) => sid !== id));
      }
    } else {
      setActiveSectorIds([...activeSectorIds, id]);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <CardTitle>Sector Growth &amp; Engagement</CardTitle>
          <CardDescription>
            Measured progress and activity weight per sector over time (Firestore-backed)
          </CardDescription>
        </div>

        {/* 7/30/90 Day Filters */}
        <div className="flex items-center gap-1 bg-[#F6F8FC] p-1 rounded-xl border border-[#E6EAF2]">
          {(['7', '30', '90'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                timeRange === r
                  ? 'bg-white text-[#6658F5] shadow-xs'
                  : 'text-[#718096] hover:text-[#17243D]'
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {/* Sector Legend Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {sectors.map((sec) => {
            const isSelected = activeSectorIds.includes(sec.id);
            return (
              <button
                key={sec.id}
                onClick={() => toggleSector(sec.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer',
                  isSelected
                    ? 'border-transparent shadow-2xs'
                    : 'opacity-40 grayscale border-[#E6EAF2] bg-white'
                )}
                style={
                  isSelected
                    ? {
                        backgroundColor: `${sec.color}15`,
                        borderColor: `${sec.color}35`,
                        color: sec.color,
                      }
                    : undefined
                }
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: sec.color }}
                />
                <span>{sec.name}</span>
              </button>
            );
          })}
        </div>

        {/* Area Chart Container */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {sectors.map((sec) => (
                  <linearGradient
                    key={sec.id}
                    id={`grad-${sec.id}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={sec.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={sec.color} stopOpacity={0.0} />
                  </linearGradient>
                ))}
              </defs>
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
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 rounded-xl border border-[#E6EAF2] shadow-lg text-xs space-y-1.5">
                        <p className="font-bold text-[#17243D] border-b border-[#F0F2FA] pb-1">
                          {label}
                        </p>
                        {payload.map((item: any) => {
                          const sec = sectors.find((s) => s.id === item.dataKey);
                          if (!sec) return null;
                          return (
                            <div
                              key={item.dataKey}
                              className="flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: sec.color }}
                                />
                                <span className="text-[#718096]">{sec.name}:</span>
                              </div>
                              <span className="font-semibold text-[#17243D]">
                                {item.value} pts
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {sectors
                .filter((sec) => activeSectorIds.includes(sec.id))
                .map((sec) => (
                  <Area
                    key={sec.id}
                    type="monotone"
                    dataKey={sec.id}
                    stroke={sec.color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#grad-${sec.id})`}
                  />
                ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
