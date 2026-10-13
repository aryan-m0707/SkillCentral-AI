'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTimer } from '@/context/timer-context';
import { formatTime, cn } from '@/lib/utils';
import { Sector } from '@/types';
import {
  Play,
  Pause,
  Maximize2,
  X,
  Plus,
  Minus,
  GripHorizontal,
  Coffee,
  RotateCcw,
} from 'lucide-react';

interface FloatingTimerWidgetProps {
  sectors: Sector[];
}

export function FloatingTimerWidget({ sectors }: FloatingTimerWidgetProps) {
  const {
    isRunning,
    mode,
    displaySeconds,
    selectedSectorId,
    isModalOpen,
    openTimerModal,
    toggleTimer,
    addFiveMinutes,
    minusFiveMinutes,
  } = useTimer();

  // Dragging position state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Custom resizing width state (min 160px, max 420px)
  const [widgetWidth, setWidgetWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(240);

  // Visibility toggle
  const [isDismissed, setIsDismissed] = useState(false);

  const currentSector = sectors.find((s) => s.id === selectedSectorId) || sectors[0];

  // Set default initial position in bottom right corner on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && position === null) {
      setPosition({
        x: Math.max(20, window.innerWidth - 280),
        y: Math.max(20, window.innerHeight - 150),
      });
    }
  }, [position]);

  // Handle Dragging
  const handleMouseDownDrag = (e: React.MouseEvent) => {
    // Only drag from header/grip or background, not when clicking buttons
    if ((e.target as HTMLElement).closest('button, input')) return;
    setIsDragging(true);
    if (position) {
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  // Handle Resizing from side handle
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStartX(e.clientX);
    setResizeStartWidth(widgetWidth);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(10, Math.min(window.innerWidth - widgetWidth - 10, e.clientX - dragOffset.x));
        const newY = Math.max(10, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y));
        setPosition({ x: newX, y: newY });
      } else if (isResizing) {
        // Dragging left or right expands width
        const delta = e.clientX - resizeStartX;
        const newWidth = Math.max(160, Math.min(420, resizeStartWidth + delta));
        setWidgetWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, widgetWidth, resizeStartX, resizeStartWidth]);

  // When full modal is open or user explicitly closed the widget, don't show
  if (isModalOpen || isDismissed || !position) return null;

  // Don't show if timer hasn't started and is at default full time, unless user is running it
  const isIdle = !isRunning && displaySeconds === 25 * 60 && mode === 'pomodoro';
  if (isIdle) return null;

  const isCompact = widgetWidth < 210;

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${widgetWidth}px`,
      }}
      onMouseDown={handleMouseDownDrag}
      className={cn(
        'fixed z-40 select-none bg-white/95 backdrop-blur-md rounded-2xl border shadow-xl transition-shadow group',
        isRunning
          ? 'border-[#20C997]/60 shadow-[#20C997]/10'
          : 'border-[#E6EAF2] shadow-slate-900/10',
        isDragging && 'opacity-80 cursor-grabbing shadow-2xl scale-[1.02]'
      )}
    >
      {/* Top Header Strip with Drag Handle & Close */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#F0F2FA] cursor-grab">
        <div className="flex items-center gap-1.5 text-[#94A3B8] hover:text-[#4A5568]">
          <GripHorizontal className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#718096] truncate max-w-[90px]">
            {mode.includes('break') ? 'Break' : currentSector?.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openTimerModal}
            title="Open full timer"
            className="p-1 rounded-md text-[#94A3B8] hover:text-[#17243D] hover:bg-[#F6F8FC] transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            title="Dismiss mini dock"
            className="p-1 rounded-md text-[#94A3B8] hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Clock & Controls Body */}
      <div className="p-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              isRunning && 'animate-ping'
            )}
            style={{
              backgroundColor: mode.includes('break') ? '#10B981' : currentSector?.color || '#6658F5',
            }}
          />
          <span
            className={cn(
              'font-heading font-bold text-[#17243D] tracking-tight leading-none',
              isCompact ? 'text-lg' : 'text-xl'
            )}
          >
            {formatTime(displaySeconds)}
          </span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* -5m and +5m buttons (if width is wide enough) */}
          {!isCompact && mode !== 'stopwatch' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={minusFiveMinutes}
                title="Subtract 5 minutes"
                className="px-1.5 py-0.5 rounded-lg bg-[#F6F8FC] border border-[#E6EAF2] hover:border-[#CBD5E1] text-[10px] font-bold text-[#718096] transition-colors cursor-pointer"
              >
                -5m
              </button>
              <button
                type="button"
                onClick={addFiveMinutes}
                title="Add 5 minutes"
                className="px-1.5 py-0.5 rounded-lg bg-[#F6F8FC] border border-[#E6EAF2] hover:border-[#6658F5] text-[10px] font-bold text-[#6658F5] transition-colors cursor-pointer"
              >
                +5m
              </button>
            </div>
          )}

          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={toggleTimer}
            className={cn(
              'p-1.5 rounded-xl transition-all cursor-pointer shadow-2xs',
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-[#6658F5] hover:bg-[#5345E6] text-white'
            )}
            title={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
          </button>
        </div>
      </div>

      {/* Resize Handle on the Right Border */}
      <div
        onMouseDown={handleMouseDownResize}
        title="Drag right/left to resize custom width"
        className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-[#6658F5]/20 rounded-r-2xl transition-colors"
      />
    </div>
  );
}
