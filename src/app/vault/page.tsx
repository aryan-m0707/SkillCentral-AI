'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SectorBadge } from '@/components/ui/sector-badge';
import { StorageEngine } from '@/lib/storage';
import { Sector, Skill, Topic, Note } from '@/types';
import {
  FolderGit2,
  Plus,
  Search,
  Tag,
  Save,
  Trash2,
  Sparkles,
  ExternalLink,
  BookOpen,
  Send,
  Loader2,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

function KnowledgeVaultContent() {
  const searchParams = useSearchParams();
  const initialSectorId = searchParams.get('sectorId') || '';
  const initialNoteId = searchParams.get('noteId') || '';

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Filter state
  const [selectedSectorId, setSelectedSectorId] = useState<string>(initialSectorId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Selected note for editing/viewing
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSectorId, setEditSectorId] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editSourceUrl, setEditSourceUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Source-grounded AI Q&A panel
  const [qaQuery, setQaQuery] = useState('');
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const [qaCitedSources, setQaCitedSources] = useState<any[]>([]);
  const [isQaLoading, setIsQaLoading] = useState(false);

  const loadData = () => {
    const s = StorageEngine.getSectors();
    const sk = StorageEngine.getSkills();
    const tp = StorageEngine.getTopics();
    const n = StorageEngine.getNotes();

    setSectors(s);
    setSkills(sk);
    setTopics(tp);
    setNotes(n);

    // Initial note selection
    if (initialNoteId) {
      const match = n.find((item) => item.id === initialNoteId);
      if (match) selectNote(match);
      else if (n.length > 0) selectNote(n[0]!);
    } else if (n.length > 0 && !activeNote) {
      selectNote(n[0]!);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectNote = (note: Note) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditSectorId(note.sectorId);
    setEditTags(note.tags.join(', '));
    setEditSourceUrl(note.sourceUrl || '');
    setQaAnswer(null);
    setQaCitedSources([]);
  };

  const handleCreateNewNote = () => {
    const fallbackSector = selectedSectorId || sectors[0]?.id || 'sec-academics';
    const newNote = StorageEngine.saveNote({
      title: 'Untitled Study Note',
      content: '# Untitled Note\n\nWrite your insights or lecture notes here...',
      sectorId: fallbackSector,
      tags: ['Study'],
    });
    loadData();
    selectNote(newNote);
  };

  const handleSaveNote = () => {
    if (!activeNote || !editTitle.trim()) return;
    setIsSaving(true);

    const updated = StorageEngine.saveNote({
      id: activeNote.id,
      title: editTitle.trim(),
      content: editContent,
      sectorId: editSectorId || activeNote.sectorId,
      tags: editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      sourceUrl: editSourceUrl.trim() || undefined,
    });

    loadData();
    setActiveNote(updated);
    setIsSaving(false);
    setSaveStatus('Saved successfully');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm('Are you sure you want to delete this note from your Knowledge Vault?')) {
      StorageEngine.deleteNote(id);
      loadData();
      const remaining = notes.filter((n) => n.id !== id);
      if (remaining.length > 0) selectNote(remaining[0]!);
      else setActiveNote(null);
    }
  };

  // Grounded AI Q&A against selected note and sector notes
  const handleAskNoteGroundedAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuery.trim()) return;

    setIsQaLoading(true);
    setQaAnswer(null);
    setQaCitedSources([]);

    try {
      // Gather context notes
      const contextNotes = activeNote
        ? [{ id: activeNote.id, title: activeNote.title, content: activeNote.content }]
        : notes.slice(0, 3).map((n) => ({ id: n.id, title: n.title, content: n.content }));

      const activeSector = sectors.find((s) => s.id === (activeNote?.sectorId || selectedSectorId));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: qaQuery }],
          mode: 'explain',
          sectorName: activeSector?.name,
          notesContext: contextNotes,
        }),
      });

      const data = await res.json();
      setQaAnswer(data.reply || 'No answer returned.');
      setQaCitedSources(data.citedSources || []);
    } catch (err: any) {
      setQaAnswer(`Failed to query AI Coach: ${err.message}`);
    } finally {
      setIsQaLoading(false);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (selectedSectorId && n.sectorId !== selectedSectorId) return false;
    if (selectedTag && !n.tags.includes(selectedTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    }
    return true;
  });

  // Extract all unique tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#17243D] tracking-tight">
            Knowledge Vault
          </h2>
          <p className="text-sm text-[#718096] mt-1">
            Sector &gt; Skill &gt; Topic hierarchy with Markdown editor and source-grounded AI search
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleCreateNewNote}>
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </Button>
      </div>

      {/* Main Vault Workspace (3-Column / 2-Column Responsive Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
        {/* Left Explorer: Search, Sector Filter, Notes List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search vault notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F6F8FC] border border-[#E6EAF2] rounded-xl text-xs text-[#17243D] placeholder-[#94A3B8] focus:outline-none focus:border-[#6658F5]"
              />
            </div>

            {/* Sector Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedSectorId('')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                  selectedSectorId === ''
                    ? 'bg-[#17243D] text-white'
                    : 'bg-[#F0F2FA] text-[#718096] hover:text-[#17243D]'
                )}
              >
                All
              </button>
              {sectors.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectorId(sec.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5',
                    selectedSectorId === sec.id
                      ? 'text-white shadow-2xs'
                      : 'bg-[#F0F2FA] text-[#718096] hover:text-[#17243D]'
                  )}
                  style={
                    selectedSectorId === sec.id
                      ? { backgroundColor: sec.color }
                      : undefined
                  }
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: sec.color }}
                  />
                  <span>{sec.name}</span>
                </button>
              ))}
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1 border-t border-[#F0F2FA]">
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(selectedTag === t ? '' : t)}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-md font-medium border transition-colors cursor-pointer',
                      selectedTag === t
                        ? 'bg-[#6658F5]/10 text-[#6658F5] border-[#6658F5]/30'
                        : 'bg-white text-[#718096] border-[#E6EAF2] hover:border-[#CBD5E1]'
                    )}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Notes List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#718096] bg-white rounded-2xl border border-[#E6EAF2]">
                No notes match your filters.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const sec = sectors.find((s) => s.id === note.sectorId);
                const isSelected = activeNote?.id === note.id;

                return (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={cn(
                      'p-3.5 rounded-2xl border transition-all cursor-pointer text-left',
                      isSelected
                        ? 'bg-white border-[#6658F5] shadow-sm ring-1 ring-[#6658F5]/20'
                        : 'bg-white border-[#E6EAF2] hover:border-[#CBD5E1]'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h4 className="text-xs font-bold text-[#17243D] truncate">
                        {note.title}
                      </h4>
                      {sec && <SectorBadge sector={sec} size="sm" showIcon={false} />}
                    </div>
                    <p className="text-[11px] text-[#718096] line-clamp-2">
                      {note.content.replace(/#|\*|`|_/g, '').slice(0, 120)}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#94A3B8]">
                      <span>{formatDate(note.updatedAt)}</span>
                      <div className="flex gap-1">
                        {note.tags.slice(0, 2).map((t) => (
                          <span key={t} className="bg-[#F0F2FA] text-[#718096] px-1.5 py-0.2 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Markdown Note Editor & Grounded AI Q&A (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeNote ? (
            <Card className="flex flex-col h-full overflow-hidden">
              {/* Note Header & Actions */}
              <div className="p-5 border-b border-[#F0F2FA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Note Title"
                    className="w-full text-lg sm:text-xl font-bold font-heading text-[#17243D] bg-transparent border-none focus:outline-none"
                  />
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <select
                      value={editSectorId}
                      onChange={(e) => setEditSectorId(e.target.value)}
                      className="text-xs px-2.5 py-1 bg-[#F6F8FC] border border-[#E6EAF2] rounded-lg text-[#17243D] focus:outline-none font-medium"
                    >
                      {sectors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Tags (comma-separated)"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="text-xs px-2.5 py-1 bg-[#F6F8FC] border border-[#E6EAF2] rounded-lg text-[#718096] focus:outline-none w-48"
                    />

                    {editSourceUrl && (
                      <a
                        href={editSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#6658F5] hover:underline flex items-center gap-1 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Source Link</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {saveStatus && (
                    <span className="text-xs font-semibold text-[#20C997] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {saveStatus}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteNote(activeNote.id)}
                    className="text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveNote}
                    isLoading={isSaving}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Note</span>
                  </Button>
                </div>
              </div>

              {/* Note Content (Markdown Editor Area) */}
              <div className="p-5 flex-1 flex flex-col">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Start typing your structured notes, markdown headers (#), bullet points, and code..."
                  rows={16}
                  className="w-full flex-1 p-3 bg-[#FAFBFD] border border-[#E6EAF2] rounded-xl text-xs sm:text-sm text-[#17243D] font-mono leading-relaxed placeholder-[#94A3B8] focus:outline-none focus:border-[#6658F5] focus:bg-white resize-y"
                />
              </div>

              {/* Grounded Source AI Q&A Panel */}
              <div className="p-5 bg-[#F6F8FC] border-t border-[#E6EAF2] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#6658F5]" />
                    <h4 className="text-xs font-bold text-[#17243D] uppercase tracking-wider">
                      Source-Grounded AI Q&amp;A
                    </h4>
                  </div>
                  <Badge variant="accent" className="text-[10px]">
                    Grounded in &ldquo;{editTitle}&rdquo;
                  </Badge>
                </div>

                <form onSubmit={handleAskNoteGroundedAI} className="flex gap-2">
                  <input
                    type="text"
                    value={qaQuery}
                    onChange={(e) => setQaQuery(e.target.value)}
                    placeholder="Ask a question strictly grounded in this note..."
                    className="flex-1 px-3.5 py-2 bg-white border border-[#E6EAF2] rounded-xl text-xs text-[#17243D] placeholder-[#94A3B8] focus:outline-none focus:border-[#6658F5]"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!qaQuery.trim()}
                    isLoading={isQaLoading}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask</span>
                  </Button>
                </form>

                {/* Grounded AI Answer */}
                {qaAnswer && (
                  <div className="p-4 bg-white border border-[#E6EAF2] rounded-2xl space-y-2 animate-in fade-in">
                    <p className="text-xs text-[#17243D] leading-relaxed whitespace-pre-line">
                      {qaAnswer}
                    </p>

                    {qaCitedSources.length > 0 && (
                      <div className="pt-2 border-t border-[#F0F2FA] space-y-1">
                        <p className="text-[10px] font-bold text-[#718096] uppercase tracking-wider">
                          Cited Sources:
                        </p>
                        {qaCitedSources.map((cs, i) => (
                          <div
                            key={i}
                            className="text-[11px] p-2 bg-[#F6F8FC] rounded-lg text-[#4A5568] border border-[#E6EAF2]"
                          >
                            <span className="font-semibold text-[#6658F5]">
                              [{cs.title}]
                            </span>{' '}
                            {cs.snippet}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <BookOpen className="w-10 h-10 text-[#94A3B8]" />
              <p className="text-sm font-semibold text-[#17243D]">No note selected</p>
              <p className="text-xs text-[#718096]">
                Select a note from the left explorer or click New Note to begin.
              </p>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function KnowledgeVaultPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="py-20 text-center text-xs text-[#718096]">
            Loading Knowledge Vault...
          </div>
        </AppShell>
      }
    >
      <KnowledgeVaultContent />
    </Suspense>
  );
}
