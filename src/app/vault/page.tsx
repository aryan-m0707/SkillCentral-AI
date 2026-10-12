'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
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
  Folder,
  Folders,
  BookOpen,
  FileText,
  Plus,
  Search,
  Sparkles,
  ExternalLink,
  Save,
  Trash2,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Send,
  Layers,
  LayoutGrid,
  Columns2,
  Tag,
  Hash,
  Clock,
  Edit3,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

type VaultViewMode = 'cards' | 'studio' | 'all-notes';

function KnowledgeVaultContent() {
  const searchParams = useSearchParams();
  const initialSectorId = searchParams.get('sectorId') || '';
  const initialNoteId = searchParams.get('noteId') || '';

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Navigation hierarchy:
  // Level 1: selectedSectorId === '' && selectedSkillId === '' && activeNote === null -> All Sectors Cards
  // Level 2: selectedSectorId !== '' && selectedSkillId === '' && activeNote === null -> Sector's Sections/Skills Cards
  // Level 3: selectedSkillId !== '' && activeNote === null -> Section's Notes Cards
  // Level 4: activeNote !== null -> Note Editor & Grounded AI
  const [selectedSectorId, setSelectedSectorId] = useState<string>(initialSectorId);
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  // View mode switcher: 'cards' (card drill-down), 'studio' (split view), 'all-notes' (flat grid)
  const [viewMode, setViewMode] = useState<VaultViewMode>('cards');

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Note editor form
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSectorId, setEditSectorId] = useState('');
  const [editSkillId, setEditSkillId] = useState('');
  const [editTopicId, setEditTopicId] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editSourceUrl, setEditSourceUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Quick section/skill modal or inline creator
  const [newSkillTitle, setNewSkillTitle] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // Grounded AI Q&A panel
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

    // Initial note selection if param given
    if (initialNoteId) {
      const match = n.find((item) => item.id === initialNoteId);
      if (match) {
        selectNote(match);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectNote = (note: Note) => {
    setActiveNote(note);
    setSelectedSectorId(note.sectorId);
    setSelectedSkillId(note.skillId || '');
    setSelectedTopicId(note.topicId || '');

    setEditTitle(note.title);
    setEditContent(note.content);
    setEditSectorId(note.sectorId);
    setEditSkillId(note.skillId || '');
    setEditTopicId(note.topicId || '');
    setEditTags(note.tags.join(', '));
    setEditSourceUrl(note.sourceUrl || '');
    setQaAnswer(null);
    setQaCitedSources([]);
  };

  const handleCreateNewNote = (sectorIdOverride?: string, skillIdOverride?: string) => {
    const targetSector = sectorIdOverride || selectedSectorId || sectors[0]?.id || 'sec-academics';
    const targetSkill = skillIdOverride || selectedSkillId || '';

    const newNote = StorageEngine.saveNote({
      title: 'Untitled Study Note',
      content: '# Untitled Study Note\n\nCapture your core concepts, proofs, code snippets, or lecture insights here.\n\n### Key Takeaways\n- ',
      sectorId: targetSector,
      skillId: targetSkill || undefined,
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
      skillId: editSkillId || undefined,
      topicId: editTopicId || undefined,
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
      setActiveNote(null);
    }
  };

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillTitle.trim() || !selectedSectorId) return;

    StorageEngine.saveSkill({
      sectorId: selectedSectorId,
      title: newSkillTitle.trim(),
      description: `Curated learning section in ${currentSector?.name || 'sector'}.`,
    });

    setNewSkillTitle('');
    setIsAddingSkill(false);
    loadData();
  };

  // Grounded AI Q&A against active note or sector notes
  const handleAskNoteGroundedAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuery.trim()) return;

    setIsQaLoading(true);
    setQaAnswer(null);
    setQaCitedSources([]);

    try {
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

  // Current entity lookups
  const currentSector = useMemo(
    () => sectors.find((s) => s.id === selectedSectorId),
    [sectors, selectedSectorId]
  );

  const currentSkill = useMemo(
    () => skills.find((sk) => sk.id === selectedSkillId),
    [skills, selectedSkillId]
  );

  // Filtered skills and topics for current sector
  const sectorSkills = useMemo(
    () => (selectedSectorId ? skills.filter((sk) => sk.sectorId === selectedSectorId) : []),
    [skills, selectedSectorId]
  );

  // Notes in current scope
  const sectorNotes = useMemo(
    () => (selectedSectorId ? notes.filter((n) => n.sectorId === selectedSectorId) : notes),
    [notes, selectedSectorId]
  );

  const skillNotes = useMemo(() => {
    if (!selectedSkillId) return [];
    return notes.filter((n) => n.skillId === selectedSkillId);
  }, [notes, selectedSkillId]);

  // Notes filtered by search & tag across entire vault or active scope
  const filteredNotes = useMemo(() => {
    let result = notes;
    if (selectedSectorId) {
      result = result.filter((n) => n.sectorId === selectedSectorId);
    }
    if (selectedSkillId) {
      result = result.filter((n) => n.skillId === selectedSkillId);
    }
    if (selectedTag) {
      result = result.filter((n) => n.tags.includes(selectedTag));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [notes, selectedSectorId, selectedSkillId, selectedTag, searchQuery]);

  // Unique tags
  const allTags = useMemo(
    () => Array.from(new Set(notes.flatMap((n) => n.tags))),
    [notes]
  );

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#17243D] tracking-tight">
            Knowledge Vault
          </h2>
          <p className="text-sm text-[#718096] mt-1">
            Visual card hierarchy: Sector Cards &rarr; Sections &rarr; Notes &rarr; Grounded AI Workspace
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#F0F2FA] p-1 rounded-xl border border-[#E6EAF2]">
            <button
              onClick={() => {
                setViewMode('cards');
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'cards'
                  ? 'bg-white text-[#17243D] shadow-xs'
                  : 'text-[#718096] hover:text-[#17243D]'
              )}
              title="Card Hierarchy Mode"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => {
                setViewMode('studio');
                if (!activeNote && notes.length > 0) selectNote(notes[0]!);
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'studio'
                  ? 'bg-white text-[#17243D] shadow-xs'
                  : 'text-[#718096] hover:text-[#17243D]'
              )}
              title="Split Studio Editor"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>
            <button
              onClick={() => setViewMode('all-notes')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'all-notes'
                  ? 'bg-white text-[#17243D] shadow-xs'
                  : 'text-[#718096] hover:text-[#17243D]'
              )}
              title="All Notes Index"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>All Notes ({notes.length})</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleCreateNewNote(selectedSectorId, selectedSkillId)}
            className="text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </Button>
        </div>
      </div>

      {/* Breadcrumb Navigation Bar (Always visible to keep user oriented) */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-[#E6EAF2] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {/* Level 1: All Sectors */}
          <button
            onClick={() => {
              setSelectedSectorId('');
              setSelectedSkillId('');
              setSelectedTopicId('');
              setActiveNote(null);
            }}
            className={cn(
              'font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer',
              !selectedSectorId && !activeNote
                ? 'bg-[#17243D] text-white'
                : 'text-[#718096] hover:text-[#17243D] hover:bg-[#F0F2FA]'
            )}
          >
            <Folders className="w-3.5 h-3.5" />
            <span>All Sectors</span>
          </button>

          {/* Level 2: Sector */}
          {currentSector && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              <button
                onClick={() => {
                  setSelectedSkillId('');
                  setSelectedTopicId('');
                  setActiveNote(null);
                }}
                className={cn(
                  'font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer',
                  selectedSectorId && !selectedSkillId && !activeNote
                    ? 'text-white shadow-2xs'
                    : 'text-[#718096] hover:text-[#17243D] hover:bg-[#F0F2FA]'
                )}
                style={
                  selectedSectorId && !selectedSkillId && !activeNote
                    ? { backgroundColor: currentSector.color }
                    : undefined
                }
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentSector.color }}
                />
                <span>{currentSector.name}</span>
              </button>
            </>
          )}

          {/* Level 3: Section / Skill */}
          {currentSkill && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              <button
                onClick={() => {
                  setActiveNote(null);
                }}
                className={cn(
                  'font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer',
                  selectedSkillId && !activeNote
                    ? 'bg-[#6658F5] text-white shadow-2xs'
                    : 'text-[#718096] hover:text-[#17243D] hover:bg-[#F0F2FA]'
                )}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{currentSkill.title}</span>
              </button>
            </>
          )}

          {/* Level 4: Active Note */}
          {activeNote && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span className="font-semibold text-[#17243D] bg-[#F0F2FA] px-2.5 py-1 rounded-lg flex items-center gap-1.5 max-w-xs truncate">
                <FileText className="w-3.5 h-3.5 text-[#6658F5]" />
                <span className="truncate">{activeNote.title}</span>
              </span>
            </>
          )}
        </div>

        {/* Back Button if drilled down */}
        {(selectedSectorId || activeNote) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeNote) {
                setActiveNote(null);
              } else if (selectedSkillId) {
                setSelectedSkillId('');
              } else if (selectedSectorId) {
                setSelectedSectorId('');
              }
            }}
            className="text-xs h-7 text-[#718096] hover:text-[#17243D]"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            <span>
              {activeNote
                ? 'Back to Notes'
                : selectedSkillId
                ? 'Back to Sections'
                : 'Back to Sectors'}
            </span>
          </Button>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODE 1: CARDS HIERARCHY DRILL-DOWN (User's primary request) */}
      {/* ======================================================== */}
      {viewMode === 'cards' && (
        <div>
          {/* ---------------------------------------------------- */}
          {/* LEVEL 4: NOTE EDITOR & GROUNDED AI WORKSPACE         */}
          {/* ---------------------------------------------------- */}
          {activeNote ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Note Content Editor (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                <Card className="flex flex-col h-full overflow-hidden">
                  {/* Editor Header */}
                  <div className="p-5 border-b border-[#F0F2FA] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Note Title"
                        className="w-full text-xl sm:text-2xl font-bold font-heading text-[#17243D] bg-transparent border-none focus:outline-none"
                      />

                      <div className="flex items-center gap-2 shrink-0">
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
                          title="Delete Note"
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

                    {/* Metadata Selector Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {/* Sector selector */}
                      <select
                        value={editSectorId}
                        onChange={(e) => setEditSectorId(e.target.value)}
                        className="px-2.5 py-1.5 bg-[#F6F8FC] border border-[#E6EAF2] rounded-xl text-[#17243D] font-medium focus:outline-none"
                      >
                        {sectors.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>

                      {/* Section/Skill selector */}
                      <select
                        value={editSkillId}
                        onChange={(e) => setEditSkillId(e.target.value)}
                        className="px-2.5 py-1.5 bg-[#F6F8FC] border border-[#E6EAF2] rounded-xl text-[#17243D] font-medium focus:outline-none"
                      >
                        <option value="">No Section (General)</option>
                        {skills
                          .filter((sk) => !editSectorId || sk.sectorId === editSectorId)
                          .map((sk) => (
                            <option key={sk.id} value={sk.id}>
                              {sk.title}
                            </option>
                          ))}
                      </select>

                      {/* Tags input */}
                      <input
                        type="text"
                        placeholder="Tags (e.g. Raft, Consensus, Systems)"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        className="flex-1 min-w-[160px] px-2.5 py-1.5 bg-[#F6F8FC] border border-[#E6EAF2] rounded-xl text-[#718096] focus:outline-none focus:bg-white"
                      />

                      {editSourceUrl && (
                        <a
                          href={editSourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#6658F5] hover:underline flex items-center gap-1 font-semibold px-2 py-1 bg-purple-50 rounded-lg"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Source</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Markdown Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Start writing markdown headings (#), formulas, bullet lists, or code snippets..."
                      rows={18}
                      className="w-full flex-1 p-4 bg-[#FAFBFD] border border-[#E6EAF2] rounded-2xl text-xs sm:text-sm text-[#17243D] font-mono leading-relaxed placeholder-[#94A3B8] focus:outline-none focus:border-[#6658F5] focus:bg-white resize-y"
                    />
                  </div>
                </Card>
              </div>

              {/* Grounded AI Q&A Sidebar (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <Card className="p-5 flex flex-col space-y-4 h-full bg-gradient-to-b from-white to-[#F9FAFD]">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0F2FA]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#6658F5]" />
                      <h4 className="text-xs font-bold text-[#17243D] uppercase tracking-wider">
                        Source Grounding
                      </h4>
                    </div>
                    <Badge variant="mint" className="text-[10px]">
                      Grounded
                    </Badge>
                  </div>

                  <p className="text-xs text-[#718096] leading-relaxed">
                    Ask Gemini 3.7 Flash questions strictly grounded in this note. Responses will cite note paragraphs.
                  </p>

                  <form onSubmit={handleAskNoteGroundedAI} className="space-y-2">
                    <textarea
                      value={qaQuery}
                      onChange={(e) => setQaQuery(e.target.value)}
                      placeholder="e.g. What are the 3 states of a Raft node according to this note?"
                      rows={3}
                      className="w-full p-3 bg-white border border-[#E6EAF2] rounded-xl text-xs text-[#17243D] placeholder-[#94A3B8] focus:outline-none focus:border-[#6658F5]"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={!qaQuery.trim()}
                      isLoading={isQaLoading}
                      className="w-full text-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Query Grounded Note</span>
                    </Button>
                  </form>

                  {/* AI Response Display */}
                  {qaAnswer && (
                    <div className="p-4 bg-white border border-[#E6EAF2] rounded-2xl space-y-2.5 animate-in fade-in">
                      <p className="text-xs text-[#17243D] leading-relaxed whitespace-pre-line">
                        {qaAnswer}
                      </p>

                      {qaCitedSources.length > 0 && (
                        <div className="pt-2 border-t border-[#F0F2FA] space-y-1">
                          <p className="text-[10px] font-bold text-[#718096] uppercase tracking-wider">
                            Source Citations:
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

                  {/* Note Information / Stats */}
                  <div className="mt-auto pt-4 border-t border-[#F0F2FA] space-y-2 text-[11px] text-[#718096]">
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span className="font-medium text-[#17243D]">
                        {formatDate(activeNote.updatedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Word Count:</span>
                      <span className="font-medium text-[#17243D]">
                        {activeNote.content.split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sector:</span>
                      <span className="font-semibold" style={{ color: currentSector?.color }}>
                        {currentSector?.name}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : selectedSkillId ? (
            /* ---------------------------------------------------- */
            /* LEVEL 3: NOTES CARDS INSIDE A SECTION / SKILL        */
            /* ---------------------------------------------------- */
            <div className="space-y-6">
              {/* Section Header Card */}
              <div className="p-6 bg-white border border-[#E6EAF2] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentSector?.color }}
                    />
                    <span className="text-xs font-bold text-[#718096] uppercase tracking-wider">
                      {currentSector?.name} &bull; Section
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-heading text-[#17243D] mt-1">
                    {currentSkill?.title}
                  </h3>
                  <p className="text-xs text-[#718096] mt-1">
                    {currentSkill?.description || 'Curated notes and topics inside this learning section.'}
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCreateNewNote(selectedSectorId, selectedSkillId)}
                  className="text-xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Note in this Section</span>
                </Button>
              </div>

              {/* Notes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Dashed Create Note Card */}
                <button
                  onClick={() => handleCreateNewNote(selectedSectorId, selectedSkillId)}
                  className="h-56 p-6 rounded-2xl border-2 border-dashed border-[#CBD5E1] hover:border-[#6658F5] bg-white/50 hover:bg-white flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 group-hover:bg-[#6658F5] text-[#6658F5] group-hover:text-white flex items-center justify-center transition-colors mb-3">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#17243D] group-hover:text-[#6658F5] transition-colors">
                    Add New Note
                  </h4>
                  <p className="text-xs text-[#718096] mt-1 max-w-[200px]">
                    Create a markdown note for {currentSkill?.title}
                  </p>
                </button>

                {/* Actual Notes Cards in this Section */}
                {skillNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className="h-56 p-5 rounded-2xl border border-[#E6EAF2] hover:border-[#6658F5] hover:shadow-md bg-white flex flex-col justify-between transition-all cursor-pointer group text-left"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-[#17243D] group-hover:text-[#6658F5] transition-colors line-clamp-2">
                          {note.title}
                        </h4>
                        <Edit3 className="w-3.5 h-3.5 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>

                      <p className="text-xs text-[#718096] mt-2 line-clamp-3 leading-relaxed">
                        {note.content.replace(/#|\*|`|_/g, '').slice(0, 140)}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#F0F2FA] flex items-center justify-between text-[11px] text-[#94A3B8]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(note.updatedAt)}
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {note.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="bg-[#F0F2FA] text-[#718096] px-1.5 py-0.5 rounded text-[10px]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {skillNotes.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#E6EAF2] text-xs text-[#718096]">
                  No notes in this section yet. Click &ldquo;Add New Note&rdquo; above to begin!
                </div>
              )}
            </div>
          ) : selectedSectorId ? (
            /* ---------------------------------------------------- */
            /* LEVEL 2: SECTIONS & SKILLS CARDS FOR THE SECTOR     */
            /* ---------------------------------------------------- */
            <div className="space-y-6">
              {/* Sector Overview Banner */}
              <div
                className="p-6 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${currentSector?.color} 0%, #17243D 100%)`,
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-white/30 text-white text-[11px]">
                      Sector Overview
                    </Badge>
                    <span className="text-xs text-white/80">
                      {sectorSkills.length} Sections &bull; {sectorNotes.length} Notes
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold font-heading mt-2">
                    {currentSector?.name}
                  </h3>
                  <p className="text-xs text-white/80 mt-1 max-w-xl">
                    {currentSector?.description || 'Explore learning sections, core topics, and study notes.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingSkill(true)}
                    className="text-xs bg-white/10 hover:bg-white/20 text-white border-white/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Section</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCreateNewNote(selectedSectorId)}
                    className="text-xs bg-white text-[#17243D] hover:bg-slate-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Note</span>
                  </Button>
                </div>
              </div>

              {/* Inline Section Adder Form */}
              {isAddingSkill && (
                <form
                  onSubmit={handleCreateSkill}
                  className="p-4 bg-white border border-[#6658F5] rounded-2xl flex flex-col sm:flex-row items-center gap-3 shadow-sm animate-in fade-in"
                >
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      placeholder="New section name (e.g. Algorithms, Conversational Japanese, Cloud Architecture)..."
                      value={newSkillTitle}
                      onChange={(e) => setNewSkillTitle(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F6F8FC] border border-[#E6EAF2] rounded-xl text-xs text-[#17243D] placeholder-[#94A3B8] focus:outline-none focus:border-[#6658F5]"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingSkill(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" className="text-xs">
                      Save Section
                    </Button>
                  </div>
                </form>
              )}

              {/* Grid of Section / Skill Cards */}
              <div>
                <h4 className="text-xs font-bold text-[#718096] uppercase tracking-wider mb-3">
                  Learning Sections &amp; Subjects ({sectorSkills.length})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sectorSkills.map((sk) => {
                    const skNotes = notes.filter((n) => n.skillId === sk.id);
                    const skTopics = topics.filter((t) => t.skillId === sk.id);

                    return (
                      <div
                        key={sk.id}
                        onClick={() => setSelectedSkillId(sk.id)}
                        className="p-5 bg-white border border-[#E6EAF2] hover:border-[#6658F5] hover:shadow-md rounded-2xl transition-all cursor-pointer flex flex-col justify-between group text-left"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                                style={{
                                  backgroundColor: `${currentSector?.color}15`,
                                  color: currentSector?.color,
                                }}
                              >
                                <Folder className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-[#17243D] group-hover:text-[#6658F5] transition-colors">
                                {sk.title}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              {skNotes.length} Notes
                            </Badge>
                          </div>

                          <p className="text-xs text-[#718096] line-clamp-2 mt-1">
                            {sk.description || 'Curated topics and study notes.'}
                          </p>

                          {/* Topic Chips */}
                          {skTopics.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {skTopics.slice(0, 3).map((t) => (
                                <span
                                  key={t.id}
                                  className="text-[10px] px-2 py-0.5 bg-[#F6F8FC] border border-[#E6EAF2] rounded-md text-[#4A5568]"
                                >
                                  {t.title}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#F0F2FA] flex items-center justify-between text-xs font-semibold text-[#6658F5]">
                          <span>Open Section Notes &rarr;</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}

                  {/* Add New Section Card */}
                  <button
                    onClick={() => setIsAddingSkill(true)}
                    className="p-5 border-2 border-dashed border-[#CBD5E1] hover:border-[#6658F5] bg-white/40 hover:bg-white rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer group min-h-[160px]"
                  >
                    <Plus className="w-5 h-5 text-[#6658F5] mb-1.5" />
                    <span className="text-xs font-bold text-[#17243D] group-hover:text-[#6658F5]">
                      Create New Section
                    </span>
                    <span className="text-[10px] text-[#718096] mt-0.5">
                      Organize topics &amp; notes
                    </span>
                  </button>
                </div>
              </div>

              {/* Direct Sector Notes (Notes that belong directly to this sector) */}
              <div className="pt-4 border-t border-[#E6EAF2]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-[#718096] uppercase tracking-wider">
                    All Notes in {currentSector?.name} ({sectorNotes.length})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateNewNote(selectedSectorId)}
                    className="text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add Note</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sectorNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => selectNote(note)}
                      className="p-4 bg-white border border-[#E6EAF2] hover:border-[#6658F5] rounded-2xl transition-all cursor-pointer group text-left"
                    >
                      <h5 className="text-xs font-bold text-[#17243D] group-hover:text-[#6658F5] truncate">
                        {note.title}
                      </h5>
                      <p className="text-[11px] text-[#718096] line-clamp-2 mt-1">
                        {note.content.replace(/#|\*|`|_/g, '').slice(0, 100)}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#94A3B8]">
                        <span>{formatDate(note.updatedAt)}</span>
                        <span>{note.tags.map((t) => `#${t}`).join(' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ---------------------------------------------------- */
            /* LEVEL 1: ALL SECTOR CARDS (VAULT ENTRY HUB)          */
            /* ---------------------------------------------------- */
            <div className="space-y-6">
              {/* Quick Search & Tag Filter Bar */}
              <div className="p-4 bg-white border border-[#E6EAF2] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search across all vault notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-[#F6F8FC] border border-[#E6EAF2] rounded-xl text-xs text-[#17243D] placeholder-[#94A3B8] focus:outline-none focus:border-[#6658F5]"
                  />
                </div>

                {/* Tag Pills */}
                {allTags.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    <span className="text-[10px] text-[#718096] uppercase font-bold shrink-0">
                      Tags:
                    </span>
                    {allTags.slice(0, 6).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setSelectedTag(selectedTag === t ? '' : t);
                          setViewMode('all-notes');
                        }}
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-lg border font-medium transition-colors shrink-0 cursor-pointer',
                          selectedTag === t
                            ? 'bg-[#6658F5] text-white border-[#6658F5]'
                            : 'bg-white text-[#718096] border-[#E6EAF2] hover:border-[#CBD5E1]'
                        )}
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sectors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sectors.map((sec) => {
                  const secNotes = notes.filter((n) => n.sectorId === sec.id);
                  const secSkills = skills.filter((sk) => sk.sectorId === sec.id);

                  return (
                    <div
                      key={sec.id}
                      onClick={() => setSelectedSectorId(sec.id)}
                      className="p-6 bg-white border border-[#E6EAF2] hover:border-[#6658F5] hover:shadow-lg rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between group text-left relative overflow-hidden"
                    >
                      {/* Color accent top strip */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1.5"
                        style={{ backgroundColor: sec.color }}
                      />

                      <div>
                        {/* Header: Icon + Badge + Counts */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-2xs group-hover:scale-105 transition-transform"
                              style={{
                                backgroundColor: `${sec.color}15`,
                                color: sec.color,
                              }}
                            >
                              <Folders className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold font-heading text-base text-[#17243D] group-hover:text-[#6658F5] transition-colors">
                                {sec.name}
                              </h3>
                              <p className="text-[11px] text-[#718096]">
                                {secSkills.length} Sections &bull; {secNotes.length} Notes
                              </p>
                            </div>
                          </div>
                          <SectorBadge sector={sec} size="sm" showIcon={false} />
                        </div>

                        <p className="text-xs text-[#718096] line-clamp-2 leading-relaxed mt-2">
                          {sec.description || 'Configurable knowledge sector with curated sections and study notes.'}
                        </p>

                        {/* Recent notes preview in this sector */}
                        {secNotes.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-[#F0F2FA] space-y-1.5">
                            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                              Recent Notes:
                            </span>
                            {secNotes.slice(0, 2).map((n) => (
                              <div
                                key={n.id}
                                className="text-xs text-[#4A5568] flex items-center gap-1.5 truncate group-hover:text-[#17243D]"
                              >
                                <FileText className="w-3 h-3 text-[#94A3B8] shrink-0" />
                                <span className="truncate">{n.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer Action */}
                      <div className="mt-5 pt-3 border-t border-[#F0F2FA] flex items-center justify-between text-xs font-semibold text-[#6658F5]">
                        <span>Explore Sector &amp; Sections</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}

                {/* Add New Note Card shortcut */}
                <div
                  onClick={() => handleCreateNewNote()}
                  className="p-6 border-2 border-dashed border-[#CBD5E1] hover:border-[#6658F5] bg-white/50 hover:bg-white rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer group min-h-[220px]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 group-hover:bg-[#6658F5] text-[#6658F5] group-hover:text-white flex items-center justify-center transition-colors mb-3">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#17243D] group-hover:text-[#6658F5]">
                    Quick Capture Note
                  </h4>
                  <p className="text-xs text-[#718096] mt-1 max-w-[200px]">
                    Create a new study note in any sector with source grounding
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: SPLIT STUDIO VIEW (Power users side-by-side)     */}
      {/* ======================================================== */}
      {viewMode === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
          {/* Left Column: Explorer & Notes List */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-4 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F6F8FC] border border-[#E6EAF2] rounded-xl text-xs text-[#17243D] focus:outline-none focus:border-[#6658F5]"
                />
              </div>

              {/* Sector selector chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedSectorId('')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer',
                    selectedSectorId === ''
                      ? 'bg-[#17243D] text-white'
                      : 'bg-[#F0F2FA] text-[#718096]'
                  )}
                >
                  All
                </button>
                {sectors.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSectorId(sec.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer',
                      selectedSectorId === sec.id
                        ? 'text-white'
                        : 'bg-[#F0F2FA] text-[#718096]'
                    )}
                    style={
                      selectedSectorId === sec.id ? { backgroundColor: sec.color } : undefined
                    }
                  >
                    {sec.name}
                  </button>
                ))}
              </div>
            </Card>

            {/* Notes List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredNotes.map((note) => {
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
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-bold text-[#17243D] truncate">{note.title}</h4>
                      {sec && <SectorBadge sector={sec} size="sm" showIcon={false} />}
                    </div>
                    <p className="text-[11px] text-[#718096] line-clamp-2">
                      {note.content.replace(/#|\*|`|_/g, '').slice(0, 100)}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#94A3B8]">
                      <span>{formatDate(note.updatedAt)}</span>
                      <span>{note.tags.slice(0, 2).map((t) => `#${t}`).join(' ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Studio Editor */}
          <div className="lg:col-span-8 space-y-4">
            {activeNote ? (
              <Card className="flex flex-col h-full overflow-hidden">
                <div className="p-5 border-b border-[#F0F2FA] flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-xl font-bold font-heading text-[#17243D] bg-transparent border-none focus:outline-none flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveNote}
                      isLoading={isSaving}
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </Button>
                  </div>
                </div>

                <div className="p-5 flex-1">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={18}
                    className="w-full h-full p-4 bg-[#FAFBFD] border border-[#E6EAF2] rounded-2xl text-xs sm:text-sm font-mono text-[#17243D] focus:outline-none focus:border-[#6658F5] focus:bg-white resize-y"
                  />
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center text-xs text-[#718096]">
                Select a note from the left explorer.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 3: ALL NOTES FLAT GRID VIEW                         */}
      {/* ======================================================== */}
      {viewMode === 'all-notes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E6EAF2]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search across all notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#F6F8FC] border border-[#E6EAF2] rounded-xl text-xs text-[#17243D] focus:outline-none focus:border-[#6658F5]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs text-[#718096]">Sector:</span>
              <select
                value={selectedSectorId}
                onChange={(e) => setSelectedSectorId(e.target.value)}
                className="text-xs px-2.5 py-1 bg-[#F6F8FC] border border-[#E6EAF2] rounded-lg text-[#17243D]"
              >
                <option value="">All Sectors</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNotes.map((note) => {
              const sec = sectors.find((s) => s.id === note.sectorId);

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    selectNote(note);
                    setViewMode('cards');
                  }}
                  className="p-5 bg-white border border-[#E6EAF2] hover:border-[#6658F5] hover:shadow-md rounded-2xl transition-all cursor-pointer group text-left flex flex-col justify-between h-48"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-[#17243D] group-hover:text-[#6658F5] transition-colors line-clamp-1">
                        {note.title}
                      </h4>
                      {sec && <SectorBadge sector={sec} size="sm" showIcon={false} />}
                    </div>

                    <p className="text-xs text-[#718096] mt-2 line-clamp-3 leading-relaxed">
                      {note.content.replace(/#|\*|`|_/g, '').slice(0, 140)}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F0F2FA] flex items-center justify-between text-[11px] text-[#94A3B8]">
                    <span>{formatDate(note.updatedAt)}</span>
                    <span className="text-[#6658F5] font-semibold group-hover:underline">
                      Open Note &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
