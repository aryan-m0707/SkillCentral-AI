'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sector } from '@/types';
import { StorageEngine } from '@/lib/storage';
import { FileText, CheckSquare, Sparkles } from 'lucide-react';
import { Youtube } from '@/components/ui/youtube-icon';
import { cn } from '@/lib/utils';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectors: Sector[];
  onSuccess?: () => void;
}

export function QuickCaptureModal({ isOpen, onClose, sectors, onSuccess }: QuickCaptureModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'note' | 'task' | 'youtube'>('note');

  // Note State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSectorId, setNoteSectorId] = useState(sectors[0]?.id || 'sec-academics');
  const [noteTags, setNoteTags] = useState('');

  // Task State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDetails, setTaskDetails] = useState('');
  const [taskSectorId, setTaskSectorId] = useState(sectors[0]?.id || 'sec-academics');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  // YouTube State
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    setIsSubmitting(true);

    StorageEngine.saveNote({
      title: noteTitle,
      content: noteContent,
      sectorId: noteSectorId,
      tags: noteTags
        ? noteTags.split(',').map((t) => t.trim()).filter(Boolean)
        : ['QuickCapture'],
    });

    setIsSubmitting(false);
    setNoteTitle('');
    setNoteContent('');
    onClose();
    if (onSuccess) onSuccess();
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setIsSubmitting(true);

    StorageEngine.saveTask({
      title: taskTitle,
      details: taskDetails,
      sectorId: taskSectorId,
      priority: taskPriority,
      dueDate: taskDueDate || undefined,
      status: 'todo',
    });

    setIsSubmitting(false);
    setTaskTitle('');
    setTaskDetails('');
    onClose();
    if (onSuccess) onSuccess();
  };

  const handleProcessYouTube = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    onClose();
    router.push(`/youtube?url=${encodeURIComponent(youtubeUrl.trim())}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Capture"
      description="Capture a thought, action item, or educational video into your second brain"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-[#F6F8FC] rounded-2xl border border-[#E6EAF2]">
          <button
            type="button"
            onClick={() => setTab('note')}
            className={cn(
              'flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
              tab === 'note'
                ? 'bg-white text-[#6658F5] shadow-xs'
                : 'text-[#718096] hover:text-[#17243D]'
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Note</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('task')}
            className={cn(
              'flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
              tab === 'task'
                ? 'bg-white text-[#6658F5] shadow-xs'
                : 'text-[#718096] hover:text-[#17243D]'
            )}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('youtube')}
            className={cn(
              'flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
              tab === 'youtube'
                ? 'bg-white text-[#6658F5] shadow-xs'
                : 'text-[#718096] hover:text-[#17243D]'
            )}
          >
            <Youtube className="w-3.5 h-3.5 text-rose-500" />
            <span>YouTube</span>
          </button>
        </div>

        {/* Tab: Quick Note */}
        {tab === 'note' && (
          <form onSubmit={handleSaveNote} className="space-y-4">
            <Input
              label="Note Title"
              placeholder="e.g. Key Takeaway from Graph Neural Networks"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              required
              autoFocus
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#718096] mb-1.5">
                Sector
              </label>
              <select
                value={noteSectorId}
                onChange={(e) => setNoteSectorId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E6EAF2] rounded-xl text-sm text-[#17243D] focus:outline-none focus:border-[#6658F5]"
              >
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#718096] mb-1.5">
                Note Content (Markdown supported)
              </label>
              <textarea
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write down the core idea, quote, formula, or code snippet..."
                className="w-full px-4 py-2.5 bg-white border border-[#E6EAF2] rounded-xl text-sm text-[#17243D] placeholder-[#94A3B8] focus:outline-none focus:border-[#6658F5]"
              />
            </div>

            <Input
              label="Tags (comma separated)"
              placeholder="AI, Architecture, Algorithms"
              value={noteTags}
              onChange={(e) => setNoteTags(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-[#F0F2FA]">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save to Vault
              </Button>
            </div>
          </form>
        )}

        {/* Tab: Quick Task */}
        {tab === 'task' && (
          <form onSubmit={handleSaveTask} className="space-y-4">
            <Input
              label="Task Title"
              placeholder="e.g. Implement Raft heartbeat interval timer"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
              autoFocus
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#718096] mb-1.5">
                  Sector
                </label>
                <select
                  value={taskSectorId}
                  onChange={(e) => setTaskSectorId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E6EAF2] rounded-xl text-sm text-[#17243D] focus:outline-none focus:border-[#6658F5]"
                >
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#718096] mb-1.5">
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-[#E6EAF2] rounded-xl text-sm text-[#17243D] focus:outline-none focus:border-[#6658F5]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <Input
              type="date"
              label="Due Date (Optional)"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
            />

            <Input
              label="Additional Details (Optional)"
              placeholder="Links, acceptance criteria, or context"
              value={taskDetails}
              onChange={(e) => setTaskDetails(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-[#F0F2FA]">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Add to Planner
              </Button>
            </div>
          </form>
        )}

        {/* Tab: YouTube Studio Ingestion */}
        {tab === 'youtube' && (
          <form onSubmit={handleProcessYouTube} className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
              <Youtube className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-900 leading-relaxed">
                Paste any public educational YouTube video link. SkillCentral will synthesize notes, timestamps, and an interactive 5-question quiz.
              </p>
            </div>

            <Input
              label="YouTube Video URL"
              placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              required
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-[#F0F2FA]">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch YouTube Studio</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
