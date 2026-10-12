'use client';

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Sector } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Compass } from 'lucide-react';

interface SkillBalanceRadarProps {
  sectors: Sector[];
  activityEvents: any[];
  quizAttempts: any[];
}

export function SkillBalanceRadar({
  sectors,
  activityEvents,
  quizAttempts,
}: SkillBalanceRadarProps) {
  const radarData = React.useMemo(() => {
    return sectors.map((sec) => {
      // Calculate balanced score: count of activity + quiz accuracy
      const sectorAttempts = quizAttempts.filter((a) => a.sectorId === sec.id);
      const avgScore =
        sectorAttempts.length > 0
          ? sectorAttempts.reduce((sum, a) => sum + a.score, 0) / sectorAttempts.length
          : 0;

      const eventsCount = activityEvents.filter((e) => e.sectorId === sec.id).length;

      // Combined weight normalized to 100
      const score = Math.min(100, Math.round(avgScore * 0.6 + eventsCount * 8));

      return {
        sector: sec.name.length > 12 ? sec.name.slice(0, 10) + '..' : sec.name,
        fullName: sec.name,
        score,
        color: sec.color,
      };
    });
  }, [sectors, activityEvents, quizAttempts]);

  const hasData = radarData.some((d) => d.score > 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-1">
        <CardTitle>Skill Balance</CardTitle>
        <CardDescription>Multi-domain equilibrium across active sectors</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex items-center justify-center pt-2">
        {!hasData ? (
          <div className="py-12 px-4 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F0F2FA] text-[#718096] flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#17243D]">Not enough evidence yet</p>
            <p className="text-xs text-[#718096] max-w-xs">
              Complete practice quizzes or log focus sessions in each sector to map your skill balance.
            </p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#E6EAF2" />
                <PolarAngleAxis
                  dataKey="sector"
                  stroke="#718096"
                  fontSize={11}
                  tickLine={false}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  stroke="#CBD5E1"
                  fontSize={10}
                />
                <Radar
                  name="Mastery Weight"
                  dataKey="score"
                  stroke="#6658F5"
                  fill="#6658F5"
                  fillOpacity={0.4}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0]?.payload;
                      return (
                        <div className="bg-white p-2.5 rounded-xl border border-[#E6EAF2] shadow-md text-xs">
                          <p className="font-semibold text-[#17243D]">{item.fullName}</p>
                          <p className="text-[#6658F5] font-bold mt-0.5">{item.score} / 100 pts</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
