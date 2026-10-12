import React from 'react';
import {
  GraduationCap,
  Languages,
  Cpu,
  Palette,
  CheckSquare,
  BookOpen,
  Code,
  Globe,
  Compass,
  Sparkles,
  Music,
  Activity,
  Flame,
  Target,
  Layers,
  LucideIcon,
} from 'lucide-react';
import { Sector } from '@/types';
import { cn } from '@/lib/utils';

export const ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap,
  Languages,
  Cpu,
  Palette,
  CheckSquare,
  BookOpen,
  Code,
  Globe,
  Compass,
  Sparkles,
  Music,
  Activity,
  Flame,
  Target,
  Layers,
};

export function getSectorIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Layers;
}

export function SectorBadge({
  sector,
  className,
  size = 'md',
  showIcon = true,
}: {
  sector?: Sector | { name: string; color: string; icon?: string };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}) {
  if (!sector) return null;

  const Icon = showIcon && sector.icon ? getSectorIcon(sector.icon) : null;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg font-medium border transition-colors',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${sector.color}15`,
        borderColor: `${sector.color}35`,
        color: sector.color,
      }}
    >
      {Icon && <Icon className={iconSizes[size]} />}
      <span>{sector.name}</span>
    </span>
  );
}
