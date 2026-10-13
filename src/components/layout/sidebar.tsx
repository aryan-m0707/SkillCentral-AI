'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookMarked,
  Sparkles,
  CalendarCheck,
  BarChart3,
  PlugZap,
  Settings,
  Timer,
  Plus,
} from 'lucide-react';
import { Youtube } from '@/components/ui/youtube-icon';
import { cn } from '@/lib/utils';
import { getSectorIcon } from '@/components/ui/sector-badge';
import { useTimer } from '@/context/timer-context';
import { formatTime } from '@/lib/utils';
import { Sector } from '@/types';

interface SidebarProps {
  sectors?: Sector[];
  onOpenTimer?: () => void;
  onOpenManageSectors?: () => void;
  onCloseMobile?: () => void;
}

export function Sidebar({ sectors = [], onOpenTimer, onOpenManageSectors, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { isRunning, displaySeconds } = useTimer();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/vault', label: 'Knowledge Vault', icon: BookMarked },
    { href: '/youtube', label: 'YouTube Studio', icon: Youtube },
    { href: '/coach', label: 'AI Coach', icon: Sparkles, badge: 'Grounded' },
    { href: '/planner', label: 'Planner & Tasks', icon: CalendarCheck },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/integrations', label: 'Integrations', icon: PlugZap },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E6EAF2] flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 pb-5 border-b border-[#F0F2FA] flex items-center justify-between">
        <Link
          href="/"
          onClick={onCloseMobile}
          className="flex items-center gap-3 group focus-visible:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6658F5] to-[#8678FA] flex items-center justify-center text-white shadow-md shadow-[#6658F5]/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold text-[#17243D] tracking-tight flex items-center gap-1.5">
              SkillCentral
            </h1>
            <p className="text-[10px] text-[#718096] font-medium tracking-wider uppercase">
              Learning Command Center
            </p>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">
            Navigation
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-[#6658F5]/10 text-[#6658F5] font-semibold'
                    : 'text-[#4A5568] hover:text-[#17243D] hover:bg-[#F6F8FC]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-[#6658F5]' : 'text-[#718096] group-hover:text-[#17243D]'
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-[#20C997]/15 text-[#138A67] border border-[#20C997]/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sectors Quick Access */}
        <div className="space-y-1 pt-2">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Your Sectors
            </p>
            {onOpenManageSectors && (
              <button
                onClick={onOpenManageSectors}
                className="text-[11px] text-[#6658F5] hover:underline font-medium cursor-pointer"
              >
                Edit
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {sectors.map((sec) => {
              const SecIcon = getSectorIcon(sec.icon);
              return (
                <Link
                  key={sec.id}
                  href={`/vault?sectorId=${sec.id}`}
                  onClick={onCloseMobile}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#4A5568] hover:text-[#17243D] hover:bg-[#F6F8FC] transition-colors group"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                    style={{ backgroundColor: sec.color }}
                  />
                  <SecIcon className="w-3.5 h-3.5 text-[#718096] shrink-0" />
                  <span className="truncate">{sec.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Focus Timer Trigger Card */}
      <div className="p-4 border-t border-[#F0F2FA] bg-[#F8FAFC]">
        <button
          onClick={onOpenTimer}
          className={cn(
            'w-full flex items-center justify-between p-3 rounded-xl border transition-all group cursor-pointer',
            isRunning
              ? 'bg-[#E6F9F4] border-[#20C997] shadow-xs'
              : 'bg-white border-[#E6EAF2] hover:border-[#6658F5]/40 hover:shadow-sm'
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                isRunning
                  ? 'bg-[#20C997] text-white animate-pulse'
                  : 'bg-[#20C997]/15 text-[#138A67]'
              )}
            >
              <Timer className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-[#17243D]">Focus Timer</p>
              <p className="text-[10px] text-[#718096]">
                {isRunning ? 'Session running' : 'Log real minutes'}
              </p>
            </div>
          </div>
          <span
            className={cn(
              'text-[10px] font-bold px-2 py-1 rounded-md transition-colors',
              isRunning
                ? 'bg-white text-[#138A67] shadow-2xs'
                : 'text-[#6658F5] bg-[#6658F5]/10'
            )}
          >
            {isRunning || displaySeconds !== 25 * 60
              ? formatTime(displaySeconds)
              : 'Start'}
          </span>
        </button>
      </div>
    </aside>
  );
}
