'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageEngine } from '@/lib/storage';
import { ambientAudio, AmbientSoundType } from '@/lib/ambient-audio';

export type TimerMode = 'pomodoro' | 'short_break' | 'long_break' | 'stopwatch';

interface TimerContextType {
  isRunning: boolean;
  mode: TimerMode;
  secondsElapsed: number;
  targetSeconds: number;
  displaySeconds: number;
  selectedSectorId: string;
  notes: string;
  isModalOpen: boolean;
  hasFinishedPomodoro: boolean;
  // Pomodoro 4-Cycle Tracker & Auto-Break State
  currentCycle: number; // 1 to 4
  autoStartBreaks: boolean;
  // Ambient Sound State
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  isAmbientMuted: boolean;
  // Controls
  setSelectedSectorId: (sectorId: string) => void;
  setNotes: (notes: string) => void;
  setMode: (mode: TimerMode, customMinutes?: number) => void;
  setCustomTarget: (minutes: number) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  openTimerModal: () => void;
  closeTimerModal: () => void;
  logSession: (onLogged?: () => void) => boolean;
  dismissFinishedPrompt: () => void;
  startNextBreak: () => void;
  startNextWorkCycle: () => void;
  resetCycles: () => void;
  toggleAutoStartBreaks: () => void;
  addFiveMinutes: () => void;
  minusFiveMinutes: () => void;
  setAmbientSound: (sound: AmbientSoundType) => void;
  setAmbientVolume: (volume: number) => void;
  toggleAmbientMute: () => void;
}

const TimerContext = createContext<TimerContextType | null>(null);

function showSystemNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.ico' });
    } catch {
      // Ignore notification exceptions
    }
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setModeState] = useState<TimerMode>('pomodoro');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [targetSeconds, setTargetSeconds] = useState(25 * 60);
  const [selectedSectorId, setSelectedSectorId] = useState('sec-academics');
  const [notes, setNotes] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasFinishedPomodoro, setHasFinishedPomodoro] = useState(false);

  // Cycle & Auto Break state
  const [currentCycle, setCurrentCycle] = useState(1); // 1, 2, 3, 4
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);

  // Ambient sound state
  const [ambientSound, setAmbientSoundState] = useState<AmbientSoundType>('off');
  const [ambientVolume, setAmbientVolumeState] = useState(0.5);
  const [isAmbientMuted, setIsAmbientMuted] = useState(false);

  // Notification permission request
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Manage ambient audio playback based on running state and mode
  useEffect(() => {
    const isBreak = mode === 'short_break' || mode === 'long_break';
    if (isRunning && !isBreak && ambientSound !== 'off') {
      ambientAudio.setSound(ambientSound);
    } else {
      ambientAudio.stop();
    }
  }, [isRunning, mode, ambientSound]);

  // Interval loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => {
          const next = prev + 1;
          // Check Pomodoro or break completion
          if (mode !== 'stopwatch' && next >= targetSeconds) {
            setIsRunning(false);
            setHasFinishedPomodoro(true);
            ambientAudio.stop();
            ambientAudio.playChime();

            if (mode === 'pomodoro') {
              showSystemNotification(
                `Cycle ${currentCycle} of 4 Complete! 🎯`,
                currentCycle === 4
                  ? 'Outstanding! You completed a full 4-cycle set. Enjoy a 15m long break.'
                  : `Focus cycle ${currentCycle} finished! Take a 5m break.`
              );

              // Auto-start break if enabled
              if (autoStartBreaks) {
                setTimeout(() => {
                  if (currentCycle >= 4) {
                    setModeState('long_break');
                    setTargetSeconds(15 * 60);
                  } else {
                    setModeState('short_break');
                    setTargetSeconds(5 * 60);
                  }
                  setSecondsElapsed(0);
                  setHasFinishedPomodoro(false);
                  setIsRunning(true);
                }, 1000);
              }
            } else {
              showSystemNotification(
                'Break Finished! ☕',
                'Ready to dive into the next focus session?'
              );
            }
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode, targetSeconds, currentCycle, autoStartBreaks]);

  // Global & In-Modal Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Global shortcut: Alt+T to toggle Timer Modal open/closed from anywhere
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsModalOpen((prev) => !prev);
        return;
      }

      // Safeguard: Never trigger single-key actions if user is typing in an input/textarea/select
      const activeEl = document.activeElement;
      const isTyping =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable);

      if (isTyping) return;

      // 2. Spacebar: Toggle play/pause (when modal is open)
      if (isModalOpen && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      }
      // 3. 'R' or 'r': Reset timer (when modal is open)
      else if (isModalOpen && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setIsRunning(false);
        setSecondsElapsed(0);
        setHasFinishedPomodoro(false);
        ambientAudio.stop();
      }
      // 4. 'M' or 'm': Toggle Ambient Sound Mute
      else if (isModalOpen && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        const muted = ambientAudio.toggleMute();
        setIsAmbientMuted(muted);
      }
      // 5. '+' or '=': Add 5 minutes
      else if (isModalOpen && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        if (mode !== 'stopwatch') {
          setTargetSeconds((prev) => prev + 5 * 60);
        }
      }
      // 6. '-' or '_': Subtract 5 minutes
      else if (isModalOpen && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        if (mode !== 'stopwatch') {
          setTargetSeconds((prev) => Math.max(60, prev - 5 * 60));
        }
      }
      // 7. 'B' or 'b': Trigger Break when finished
      else if (isModalOpen && hasFinishedPomodoro && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        startNextBreak();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, mode, hasFinishedPomodoro]);

  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsElapsed(0);
    setHasFinishedPomodoro(false);
    ambientAudio.stop();
  };

  const setMode = (newMode: TimerMode, customMinutes?: number) => {
    setIsRunning(false);
    setSecondsElapsed(0);
    setHasFinishedPomodoro(false);
    setModeState(newMode);
    ambientAudio.stop();

    if (customMinutes) {
      setTargetSeconds(customMinutes * 60);
    } else if (newMode === 'pomodoro') {
      setTargetSeconds(25 * 60);
    } else if (newMode === 'short_break') {
      setTargetSeconds(5 * 60);
    } else if (newMode === 'long_break') {
      setTargetSeconds(15 * 60);
    }
  };

  const setCustomTarget = (minutes: number) => {
    setIsRunning(false);
    setSecondsElapsed(0);
    setHasFinishedPomodoro(false);
    setTargetSeconds(minutes * 60);
  };

  const setAmbientSound = (sound: AmbientSoundType) => {
    setAmbientSoundState(sound);
    if (!isRunning || mode === 'short_break' || mode === 'long_break') {
      if (sound === 'off') ambientAudio.stop();
      return;
    }
    ambientAudio.setSound(sound);
  };

  const setAmbientVolume = (vol: number) => {
    setAmbientVolumeState(vol);
    ambientAudio.setVolume(vol);
  };

  const toggleAmbientMute = () => {
    const muted = ambientAudio.toggleMute();
    setIsAmbientMuted(muted);
  };

  const toggleAutoStartBreaks = () => {
    setAutoStartBreaks((prev) => !prev);
  };

  const resetCycles = () => {
    setCurrentCycle(1);
  };

  // 1-Click Transition to Break
  const startNextBreak = () => {
    setHasFinishedPomodoro(false);
    setSecondsElapsed(0);
    ambientAudio.stop();

    if (currentCycle >= 4) {
      // 4th cycle grants long break, then resets cycle count
      setModeState('long_break');
      setTargetSeconds(15 * 60);
      setCurrentCycle(1);
    } else {
      // 1st, 2nd, 3rd cycle advances to short break
      setModeState('short_break');
      setTargetSeconds(5 * 60);
      setCurrentCycle((c) => c + 1);
    }
    setIsRunning(true);
  };

  // 1-Click Transition back to Work
  const startNextWorkCycle = () => {
    setHasFinishedPomodoro(false);
    setSecondsElapsed(0);
    setModeState('pomodoro');
    setTargetSeconds(25 * 60);
    setIsRunning(true);
  };

  // Quick +5 Minutes Extension
  const addFiveMinutes = () => {
    if (mode === 'stopwatch') {
      return;
    }
    setTargetSeconds((prev) => prev + 5 * 60);
    if (hasFinishedPomodoro) {
      setHasFinishedPomodoro(false);
      setIsRunning(true);
    }
  };

  // Quick -5 Minutes Reduction (min target 60s)
  const minusFiveMinutes = () => {
    if (mode === 'stopwatch') {
      return;
    }
    setTargetSeconds((prev) => Math.max(60, prev - 5 * 60));
  };

  const logSession = (onLogged?: () => void): boolean => {
    const minutes = Math.max(1, Math.round(secondsElapsed / 60));
    if (secondsElapsed >= 10 && (mode === 'pomodoro' || mode === 'stopwatch')) {
      StorageEngine.recordStudySession({
        sectorId: selectedSectorId,
        durationMinutes: minutes,
        startedAt: new Date(Date.now() - secondsElapsed * 1000).toISOString(),
        completedAt: new Date().toISOString(),
        notes: notes.trim() || undefined,
      });
    }

    setIsRunning(false);
    setSecondsElapsed(0);
    setNotes('');
    setHasFinishedPomodoro(false);
    setIsModalOpen(false);
    ambientAudio.stop();
    if (onLogged) onLogged();
    return true;
  };

  const openTimerModal = () => setIsModalOpen(true);
  const closeTimerModal = () => setIsModalOpen(false);
  const dismissFinishedPrompt = () => setHasFinishedPomodoro(false);

  const displaySeconds =
    mode === 'stopwatch'
      ? secondsElapsed
      : Math.max(0, targetSeconds - secondsElapsed);

  return (
    <TimerContext.Provider
      value={{
        isRunning,
        mode,
        secondsElapsed,
        targetSeconds,
        displaySeconds,
        selectedSectorId,
        notes,
        isModalOpen,
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
        openTimerModal,
        closeTimerModal,
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
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
