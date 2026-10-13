'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Sector } from '@/types';
import { formatTime } from '@/lib/utils';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Flame,
  Coffee,
  Sparkles,
  Volume2,
  VolumeX,
  CloudRain,
  Waves,
  Plus,
  Minus,
} from 'lucide-react';
import { AmbientSoundType } from '@/lib/ambient-audio';
import { cn } from '@/lib/utils';
import { useTimer, TimerMode } from '@/context/timer-context';

const POMODORO_PRESETS = [
  { label: '15m', minutes: 15 },
  { label: '25m', minutes: 25 },
  { label: '45m', minutes: 45 },
  { label: '60m', minutes: 60 },
];

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
  const {
    isRunning,
    mode,
    secondsElapsed,
    targetSeconds,
    displaySeconds,
    selectedSectorId,
    notes,
    hasFinishedPomodoro,
    currentCycle,
    autoStartBreaks,
    ambientSound,
    ambientVolume,
    isAmbientMuted,
    setSelectedSectorId,
    setNotes,
    setMode,
    setCustomTarget,
    toggleTimer,
    resetTimer,
    logSession,
    dismissFinishedPrompt,
    startNextBreak,
    startNextWorkCycle,
    resetCycles,
    toggleAutoStartBreaks,
    addFiveMinutes,
    minusFiveMinutes,
    setAmbientSound,
    setAmbientVolume,
    toggleAmbientMute,
  } = useTimer();

  const [isCustomDuration, setIsCustomDuration] = React.useState(false);
  const [customMinutesInput, setCustomMinutesInput] = React.useState('');

  const currentSector = sectors.find((s) => s.id === selectedSectorId) || sectors[0];

  const handleFinish = () => {
    logSession(onSessionLogged);
  };

  const currentPresetMinutes = Math.round(targetSeconds / 60);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Focus Learning Timer"
      description="Record real deep work minutes to build your measured learning streak"
      maxWidth="max-w-md"
    >
      <div className="space-y-5 text-center">
        {/* Completion Banner with 1-Click Break / Work Transitions */}
        {hasFinishedPomodoro && (
          <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl text-left animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500 text-white shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-emerald-900">
                  {mode === 'pomodoro'
                    ? currentCycle === 4
                      ? 'Set Complete! 🏆 You earned a Long Break'
                      : `Focus Cycle ${currentCycle} Complete! 🎉`
                    : 'Break Time Ended! ⚡'}
                </h4>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  {mode === 'pomodoro'
                    ? currentCycle === 4
                      ? '4 focus blocks finished. Take a relaxing 15-minute rest.'
                      : 'Great work! Take a 5-minute break or log your minutes.'
                    : 'Recharged and ready for your next study block?'}
                </p>
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  {mode === 'pomodoro' ? (
                    <>
                      <button
                        type="button"
                        onClick={startNextBreak}
                        className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                      >
                        {currentCycle === 4 ? 'Start 15m Long Break ☕' : 'Start 5m Break ☕'}
                      </button>
                      <button
                        type="button"
                        onClick={handleFinish}
                        className="text-xs font-medium px-2.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
                      >
                        Log Minutes &amp; Close
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={startNextWorkCycle}
                      className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                    >
                      Start Focus (25m) 🎯
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={dismissFinishedPrompt}
                    className="text-xs text-emerald-800 hover:underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4-Cycle Pomodoro Tracker Strip */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#F6F8FC] border border-[#E6EAF2] rounded-2xl text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#17243D]">Set Progress:</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((cycleNum) => {
                const isComplete = currentCycle > cycleNum;
                const isCurrent = currentCycle === cycleNum && mode === 'pomodoro';
                return (
                  <span
                    key={cycleNum}
                    title={`Cycle ${cycleNum} of 4`}
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-all',
                      isComplete
                        ? 'bg-[#6658F5] shadow-xs'
                        : isCurrent
                        ? 'bg-[#6658F5] ring-2 ring-[#6658F5]/30 animate-pulse'
                        : 'bg-[#CBD5E1]'
                    )}
                  />
                );
              })}
            </div>
            <span className="text-[11px] text-[#718096]">
              ({currentCycle}/4)
            </span>
          </div>

          <button
            type="button"
            onClick={toggleAutoStartBreaks}
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-lg border font-medium transition-colors cursor-pointer',
              autoStartBreaks
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold'
                : 'bg-white border-[#E6EAF2] text-[#718096] hover:text-[#17243D]'
            )}
            title="Automatically start 5m break when Pomodoro hits 00:00"
          >
            Auto-Break: {autoStartBreaks ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#F6F8FC] rounded-2xl border border-[#E6EAF2]">
          <button
            type="button"
            onClick={() => setMode('pomodoro', 25)}
            className={cn(
              'py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer truncate',
              mode === 'pomodoro'
                ? 'bg-white text-[#6658F5] shadow-xs'
                : 'text-[#718096] hover:text-[#17243D]'
            )}
          >
            Pomodoro
          </button>
          <button
            type="button"
            onClick={() => setMode('short_break', 5)}
            className={cn(
              'py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer truncate',
              mode === 'short_break'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-[#718096] hover:text-[#17243D]'
            )}
          >
            5m Break
          </button>
          <button
            type="button"
            onClick={() => setMode('long_break', 15)}
            className={cn(
              'py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer truncate',
              mode === 'long_break'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-[#718096] hover:text-[#17243D]'
            )}
          >
            15m Break
          </button>
          <button
            type="button"
            onClick={() => setMode('stopwatch')}
            className={cn(
              'py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer truncate',
              mode === 'stopwatch'
                ? 'bg-white text-[#6658F5] shadow-xs'
                : 'text-[#718096] hover:text-[#17243D]'
            )}
          >
            Stopwatch
          </button>
        </div>

        {/* Pomodoro Presets & Custom Duration */}
        {mode === 'pomodoro' && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-[#718096] mr-1">Duration:</span>
              {POMODORO_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => {
                    setIsCustomDuration(false);
                    setCustomTarget(preset.minutes);
                  }}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer',
                    !isCustomDuration && currentPresetMinutes === preset.minutes && !isRunning
                      ? 'bg-[#6658F5] text-white shadow-xs'
                      : 'bg-[#F0F2FA] text-[#4A5568] hover:bg-[#E6EAF2]'
                  )}
                >
                  {preset.label}
                </button>
              ))}

              {/* Custom Duration Button */}
              <button
                type="button"
                onClick={() => setIsCustomDuration(!isCustomDuration)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer',
                  isCustomDuration
                    ? 'bg-[#6658F5] text-white shadow-xs'
                    : 'bg-[#F0F2FA] text-[#4A5568] hover:bg-[#E6EAF2]'
                )}
              >
                Custom
              </button>
            </div>

            {/* Custom Input Field */}
            {isCustomDuration && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const mins = parseInt(customMinutesInput, 10);
                  if (mins && mins > 0 && mins <= 180) {
                    setCustomTarget(mins);
                  }
                }}
                className="flex items-center gap-2 p-1.5 bg-[#F6F8FC] border border-[#E6EAF2] rounded-xl text-xs animate-in fade-in duration-150"
              >
                <span className="text-[11px] text-[#718096] pl-1 font-medium">Minutes (1–180):</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  placeholder="e.g. 30"
                  value={customMinutesInput}
                  onChange={(e) => setCustomMinutesInput(e.target.value)}
                  className="w-16 px-2 py-0.5 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#17243D] text-center font-bold focus:outline-none focus:border-[#6658F5]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2.5 py-0.5 bg-[#6658F5] text-white rounded-lg text-xs font-semibold hover:bg-[#5345E6] cursor-pointer"
                >
                  Set
                </button>
              </form>
            )}
          </div>
        )}

        {/* Sector Picker (for focus sessions) */}
        {mode !== 'short_break' && mode !== 'long_break' && (
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
        )}

        {/* Big Digit Display */}
        <div className="py-6 px-4 bg-[#F6F8FC] rounded-3xl border border-[#E6EAF2] flex flex-col items-center justify-center relative overflow-hidden">
          {mode.includes('break') ? (
            <div className="flex items-center gap-1.5 mb-2 text-emerald-600 font-semibold text-xs">
              <Coffee className="w-3.5 h-3.5" />
              <span>Rest & Recharge</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: currentSector?.color || '#6658F5' }}
              />
              <span className="text-xs font-semibold text-[#17243D]">
                {currentSector?.name}
              </span>
            </div>
          )}

          <div className="relative flex items-center justify-center w-full">
            {/* Quick -5m Button (left side) */}
            {mode !== 'stopwatch' && (
              <button
                type="button"
                onClick={minusFiveMinutes}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 px-2 py-1 rounded-xl bg-white/80 hover:bg-white border border-[#E6EAF2] hover:border-[#CBD5E1] text-[11px] font-bold text-[#718096] hover:text-[#17243D] hover:shadow-xs transition-all flex items-center gap-0.5 cursor-pointer"
                title="Subtract 5 minutes from this session"
              >
                <Minus className="w-3 h-3" />
                <span>5m</span>
              </button>
            )}

            <div
              className={cn(
                'font-heading text-5xl sm:text-6xl font-bold tracking-tight transition-colors',
                displaySeconds === 0 && mode !== 'stopwatch'
                  ? 'text-emerald-600 animate-pulse'
                  : 'text-[#17243D]'
              )}
            >
              {formatTime(displaySeconds)}
            </div>

            {/* Quick +5m Extension Button (right side) */}
            {mode !== 'stopwatch' && (
              <button
                type="button"
                onClick={addFiveMinutes}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 px-2 py-1 rounded-xl bg-white/80 hover:bg-white border border-[#E6EAF2] hover:border-[#6658F5] text-[11px] font-bold text-[#6658F5] hover:shadow-xs transition-all flex items-center gap-0.5 cursor-pointer"
                title="Add 5 minutes to this session"
              >
                <Plus className="w-3 h-3" />
                <span>5m</span>
              </button>
            )}
          </div>

          <p className="text-xs text-[#718096] mt-2 flex items-center gap-1.5">
            {isRunning ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Timer running in background — keep exploring</span>
              </>
            ) : (
              <span>Ready / Paused</span>
            )}
          </p>
        </div>

        {/* Ambient Focus Audio (only for study modes, auto-muted on breaks) */}
        {!mode.includes('break') && (
          <div className="p-3 bg-[#F6F8FC] border border-[#E6EAF2] rounded-2xl text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#17243D] flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#6658F5]" />
                <span>Ambient Focus Audio</span>
              </span>
              {ambientSound !== 'off' && (
                <button
                  type="button"
                  onClick={toggleAmbientMute}
                  className="text-[11px] text-[#718096] hover:text-[#17243D] flex items-center gap-1 cursor-pointer"
                >
                  {isAmbientMuted ? (
                    <>
                      <VolumeX className="w-3 h-3 text-rose-500" />
                      <span className="text-rose-500 font-semibold">Muted</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3" />
                      <span>{Math.round(ambientVolume * 100)}%</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Sound Preset Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'off' as AmbientSoundType, label: 'Off', icon: null },
                { id: 'rain' as AmbientSoundType, label: 'Rain', icon: CloudRain },
                { id: 'ocean' as AmbientSoundType, label: 'Ocean', icon: Waves },
                { id: 'campfire' as AmbientSoundType, label: 'Campfire', icon: Flame },
              ].map((s) => {
                const Icon = s.icon;
                const isSelected = ambientSound === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setAmbientSound(s.id)}
                    className={cn(
                      'py-1 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer',
                      isSelected
                        ? 'bg-[#6658F5] text-white shadow-xs font-semibold'
                        : 'bg-white text-[#718096] border border-[#E6EAF2] hover:text-[#17243D]'
                    )}
                  >
                    {Icon && <Icon className="w-3 h-3" />}
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Volume slider when audio is active */}
            {ambientSound !== 'off' && (
              <div className="pt-1 flex items-center gap-2">
                <Volume2 className="w-3 h-3 text-[#94A3B8]" />
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#E6EAF2] rounded-lg appearance-none cursor-pointer accent-[#6658F5]"
                />
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={resetTimer}
            className="text-[#718096]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </Button>

          <Button
            type="button"
            variant={isRunning ? 'secondary' : 'primary'}
            size="lg"
            onClick={toggleTimer}
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

        {/* Optional Notes & Log Action (only for productive study modes) */}
        {mode !== 'short_break' && mode !== 'long_break' && (
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
              onClick={handleFinish}
              className="w-full"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Log &amp; Finish Session ({Math.max(1, Math.round(secondsElapsed / 60))}m)</span>
            </Button>
          </div>
        )}

        {/* Keyboard Shortcuts Hint Footer */}
        <div className="pt-2 text-[10px] text-[#94A3B8] flex items-center justify-center gap-2.5 flex-wrap">
          <span>Shortcuts:</span>
          <span><kbd className="px-1 py-0.5 bg-[#F6F8FC] border border-[#E6EAF2] rounded font-mono text-[9px] text-[#718096]">Space</kbd> Play/Pause</span>
          <span><kbd className="px-1 py-0.5 bg-[#F6F8FC] border border-[#E6EAF2] rounded font-mono text-[9px] text-[#718096]">R</kbd> Reset</span>
          <span><kbd className="px-1 py-0.5 bg-[#F6F8FC] border border-[#E6EAF2] rounded font-mono text-[9px] text-[#718096]">M</kbd> Mute Audio</span>
          <span><kbd className="px-1 py-0.5 bg-[#F6F8FC] border border-[#E6EAF2] rounded font-mono text-[9px] text-[#718096]">+/-</kbd> 5m</span>
          <span><kbd className="px-1 py-0.5 bg-[#F6F8FC] border border-[#E6EAF2] rounded font-mono text-[9px] text-[#718096]">Alt+T</kbd> Toggle</span>
        </div>
      </div>
    </Modal>
  );
}
