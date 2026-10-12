'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Sector } from '@/types';
import { StorageEngine } from '@/lib/storage';
import { formatTime } from '@/lib/utils';
import { Play, Pause, RotateCcw, CheckCircle2, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudyTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectors: Sector[];
  onSessionLogged?: () => void;
}

export function StudyTimerModal({
  isOpen,
  onClose,
  sectors,
  onSessionLogged,
}: StudyTimerModalProps) {
  const [selectedSectorId, setSelectedSectorId] = useState(sectors[0]?.id || 'sec-academics');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<'stopwatch' | 'pomodoro'>('pomodoro');
  const [targetSeconds, setTargetSeconds] = useState(25 * 60); // 25 min default

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setSecondsElapsed(0);
  };

  const handleLogSession = () => {
    const minutes = Math.max(1, Math.round(secondsElapsed / 60));
    StorageEngine.recordStudySession({
      sectorId: selectedSectorId,
      durationMinutes: minutes,
      startedAt: new Date(Date.now() - secondsElapsed * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
    });

    setIsRunning(false);
    setSecondsElapsed(0);
    setNotes('');
    onClose();
    if (onSessionLogged) onSessionLogged();
  };

  // If in pomodoro, remaining = target - elapsed
  const displaySeconds =
    mode === 'pomodoro'
      ? Math.max(0, targetSeconds - secondsElapsed)
      : secondsElapsed;

  const currentSector = sectors.find((s) => s.id === selectedSectorId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Focus Learning Timer"
      description="Record real deep work minutes to build your measured learning streak"
      maxWidth="max-w-md"
    >
      <div className="space-y-6 text-center">
        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#F6F8FC] rounded-2xl border border-[#E6EAF2]">
          <button
            type="button"
            onClick={() => {
              setMode('pomodoro');
              setSecondsElapsed(0);
              setIsRunning(false);
            }}
            className={cn(
              'py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer',
              mode === 'pomodoro'
                ? 'bg-white text-[#6658F5] shadow-xs'
                : 'text-[#718096] hover:text-[#17243D]'
            )}
          >
            25m Pomodoro
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('stopwatch');
              setSecondsElapsed(0);
              setIsRunning(false);
            }}
            className={cn(
              'py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer',
              mode === 'stopwatch'
                ? 'bg-white text-[#6658F5] shadow-xs'
                : 'text-[#718096] hover:text-[#17243D]'
            )}
          >
            Stopwatch
          </button>
        </div>

        {/* Sector Picker */}
        <div className="text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#718096] mb-1.5">
            Active Study Sector
          </label>
          <select
            value={selectedSectorId}
            onChange={(e) => setSelectedSectorId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#E6EAF2] rounded-xl text-sm text-[#17243D] focus:outline-none focus:border-[#6658F5]"
          >
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Big Digit Display */}
        <div className="py-6 px-4 bg-[#F6F8FC] rounded-3xl border border-[#E6EAF2] flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: currentSector?.color || '#6658F5' }}
            />
            <span className="text-xs font-semibold text-[#17243D]">
              {currentSector?.name}
            </span>
          </div>

          <div className="font-heading text-5xl sm:text-6xl font-bold tracking-tight text-[#17243D]">
            {formatTime(displaySeconds)}
          </div>

          <p className="text-xs text-[#718096] mt-2">
            {isRunning ? 'Timer active — stay in the flow' : 'Paused / Ready'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleResetTimer}
            className="text-[#718096]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </Button>

          <Button
            type="button"
            variant={isRunning ? 'secondary' : 'primary'}
            size="lg"
            onClick={handleToggleTimer}
            className="px-8"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Start</span>
              </>
            )}
          </Button>
        </div>

        {/* Optional Notes & Log Action */}
        <div className="space-y-3 pt-3 border-t border-[#F0F2FA] text-left">
          <input
            type="text"
            placeholder="Quick note on what you studied (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#E6EAF2] rounded-xl text-xs text-[#17243D] placeholder-[#94A3B8] focus:outline-none focus:border-[#6658F5]"
          />

          <Button
            type="button"
            variant="mint"
            size="md"
            disabled={secondsElapsed < 10}
            onClick={handleLogSession}
            className="w-full"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Log & Finish Session ({Math.max(1, Math.round(secondsElapsed / 60))}m)</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
