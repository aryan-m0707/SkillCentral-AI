'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SectorBadge } from '@/components/ui/sector-badge';
import { StorageEngine } from '@/lib/storage';
import { Sector, YouTubeAnalysisResult, QuizQuestion } from '@/types';
import {
  Sparkles,
  Play,
  Save,
  CheckCircle2,
  CalendarPlus,
  HelpCircle,
  ExternalLink,
  Clock,
  BookOpen,
  ArrowRight,
  ListPlus,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Youtube } from '@/components/ui/youtube-icon';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

function YouTubeStudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialUrl = searchParams.get('url') || '';

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [videoUrl, setVideoUrl] = useState(initialUrl);
  const [transcriptFallback, setTranscriptFallback] = useState('');
  const [showTranscriptInput, setShowTranscriptInput] = useState(false);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<YouTubeAnalysisResult | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable fields after analysis
  const [editableNotes, setEditableNotes] = useState('');
  const [savedToVault, setSavedToVault] = useState(false);
  const [addedTasks, setAddedTasks] = useState(false);

  // Interactive Quiz state
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  useEffect(() => {
    const s = StorageEngine.getSectors();
    setSectors(s);
    if (s.length > 0) setSelectedSectorId(s[0]!.id);

    if (initialUrl) {
      handleAnalyzeUrl(initialUrl);
    }
  }, [initialUrl]);

  const handleAnalyzeUrl = async (urlToAnalyze: string) => {
    if (!urlToAnalyze.trim()) return;
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);
    setSavedToVault(false);
    setAddedTasks(false);
    setIsTakingQuiz(false);

    try {
      const res = await fetch('/api/videos/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: urlToAnalyze.trim(),
          transcriptFallback: transcriptFallback.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze YouTube video.');
      }

      setAnalysisResult(data.analysis);
      setAnalysisStatus(data.status);
      setEditableNotes(data.analysis.detailedStudyNotes);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during video analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToVault = () => {
    if (!analysisResult) return;
    const targetSector = selectedSectorId || sectors[0]?.id || 'sec-academics';

    // Save as Resource
    const res = StorageEngine.saveResource({
      sectorId: targetSector,
      type: 'youtube',
      title: analysisResult.title,
      url: videoUrl,
      thumbnailUrl: analysisResult.thumbnailUrl,
      generatedSummary: analysisResult.overview,
    });

    // Save as Note
    StorageEngine.saveNote({
      resourceId: res.id,
      sectorId: targetSector,
      title: `Study Notes: ${analysisResult.title}`,
      content: editableNotes,
      tags: analysisResult.topicTags || ['YouTubeStudy'],
      sourceUrl: videoUrl,
    });

    // Save Quiz to quizzes collection
    if (analysisResult.quiz && analysisResult.quiz.length > 0) {
      StorageEngine.saveQuiz({
        resourceId: res.id,
        sectorId: targetSector,
        title: `Quiz: ${analysisResult.title}`,
        questions: analysisResult.quiz,
      });
    }

    setSavedToVault(true);
  };

  const handleAddTasksToPlanner = () => {
    if (!analysisResult?.suggestedTasks) return;
    const targetSector = selectedSectorId || sectors[0]?.id || 'sec-academics';

    analysisResult.suggestedTasks.forEach((t) => {
      StorageEngine.saveTask({
        title: t.title,
        sectorId: targetSector,
        priority: t.priority,
        status: 'todo',
      });
    });

    setAddedTasks(true);
  };

  // Quiz Handling
  const handleStartQuiz = () => {
    if (!analysisResult?.quiz) return;
    setIsTakingQuiz(true);
    setCurrentQuizIndex(0);
    setSelectedAnswers(new Array(analysisResult.quiz.length).fill(-1));
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const handleSelectOption = (optionIndex: number) => {
    if (quizSubmitted) return;
    const updated = [...selectedAnswers];
    updated[currentQuizIndex] = optionIndex;
    setSelectedAnswers(updated);
  };

  const handleSubmitQuiz = () => {
    if (!analysisResult?.quiz) return;
    const questions = analysisResult.quiz;
    let correct = 0;

    questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctAnswerIndex) {
        correct++;
      }
    });

    const scorePercentage = Math.round((correct / questions.length) * 100);
    setQuizScore(scorePercentage);
    setQuizSubmitted(true);

    // Save quiz attempt in StorageEngine
    const targetSector = selectedSectorId || sectors[0]?.id || 'sec-academics';
    StorageEngine.recordQuizAttempt({
      quizId: `quiz-${analysisResult.videoId}`,
      sectorId: targetSector,
      score: scorePercentage,
      totalQuestions: questions.length,
      correctCount: correct,
      selectedAnswers,
      date: new Date().toISOString().split('T')[0]!,
    });

    // Trigger victory confetti if score >= 80%
    if (scorePercentage >= 80) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti polish
      }
    }
  };

  return (
    <AppShell>
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#17243D] tracking-tight flex items-center gap-2">
            <Youtube className="w-7 h-7 text-rose-500" />
            <span>YouTube Learning Studio</span>
          </h2>
          <p className="text-sm text-[#718096] mt-1">
            Transform public YouTube educational videos into structured notes, verified quizzes, and action tasks
          </p>
        </div>

        {analysisStatus && (
          <Badge variant={analysisStatus === 'live' ? 'mint' : 'outline'}>
            {analysisStatus === 'live' ? 'Gemini 3.7 Flash Live Analysis' : 'Offline Simulation Preview'}
          </Badge>
        )}
      </div>

      {/* Input Ingestion Card */}
      <Card className="p-6 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyzeUrl(videoUrl);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#718096] mb-1.5">
                Public YouTube Video URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="Paste YouTube watch URL (e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or youtu.be/...)"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-[#FAFBFD] border border-[#E6EAF2] rounded-xl text-sm text-[#17243D] placeholder-[#94A3B8] focus:outline-none focus:border-[#6658F5] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#718096] mb-1.5">
                Target Sector
              </label>
              <select
                value={selectedSectorId}
                onChange={(e) => setSelectedSectorId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#E6EAF2] rounded-xl text-sm text-[#17243D] focus:outline-none focus:border-[#6658F5]"
              >
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fallback Transcript Option */}
          <div>
            <button
              type="button"
              onClick={() => setShowTranscriptInput(!showTranscriptInput)}
              className="text-xs text-[#6658F5] hover:underline font-medium cursor-pointer"
            >
              {showTranscriptInput
                ? '- Hide transcript / notes fallback'
                : '+ Add custom transcript or study notes for grounding'}
            </button>
            {showTranscriptInput && (
              <div className="mt-2">
                <textarea
                  rows={3}
                  value={transcriptFallback}
                  onChange={(e) => setTranscriptFallback(e.target.value)}
                  placeholder="Paste study notes or permitted transcript text to supplement AI synthesis..."
                  className="w-full p-3 bg-[#FAFBFD] border border-[#E6EAF2] rounded-xl text-xs text-[#17243D] placeholder-[#94A3B8] focus:outline-none focus:border-[#6658F5]"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#F0F2FA]">
            <p className="text-xs text-[#718096]">
              Gemini will extract key concepts, study notes, and a 5-question comprehension quiz.
            </p>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isAnalyzing}
              disabled={!videoUrl.trim()}
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze with Gemini</span>
            </Button>
          </div>
        </form>

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-rose-900">Analysis Error</p>
              <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Analysis Output Section */}
      {analysisResult && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Video Preview & Action Ribbon */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Embed / Thumbnail Card */}
            <Card className="p-4 space-y-3">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black relative">
                <iframe
                  src={`https://www.youtube.com/embed/${analysisResult.videoId}`}
                  title={analysisResult.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#17243D] line-clamp-2">
                  {analysisResult.title}
                </h3>
                <a
                  href={`https://www.youtube.com/watch?v=${analysisResult.videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#6658F5] hover:underline flex items-center gap-1 mt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open on YouTube</span>
                </a>
              </div>
            </Card>

            {/* Overview & Quick Actions */}
            <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-heading text-lg font-bold text-[#17243D]">
                    Executive Overview
                  </h3>
                  <div className="flex gap-1.5">
                    {analysisResult.topicTags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed">
                  {analysisResult.overview}
                </p>

                {/* Core Concepts */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#718096] mb-2">
                    Core Concepts
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {analysisResult.coreConcepts.map((c, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-[#F6F8FC] border border-[#E6EAF2] rounded-xl text-xs font-medium text-[#17243D] flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6658F5]" />
                        <span className="truncate">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-6 pt-4 border-t border-[#F0F2FA] flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveToVault}
                  disabled={savedToVault}
                >
                  {savedToVault ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Saved to Vault</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save to Vault</span>
                    </>
                  )}
                </Button>

                <Button variant="mint" size="sm" onClick={handleStartQuiz}>
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Take 5-Question Quiz</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddTasksToPlanner}
                  disabled={addedTasks}
                >
                  {addedTasks ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#20C997]" />
                      <span>Tasks Added</span>
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Add Tasks to Planner</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/coach?topic=${encodeURIComponent(analysisResult.title)}`)}
                  className="text-[#6658F5]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask Gemini Coach</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* Interactive Quiz Runner */}
          {isTakingQuiz && analysisResult.quiz && (
            <Card className="p-6 border-[#6658F5]/30 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-[#F0F2FA]">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#6658F5]" />
                  <CardTitle className="text-base">
                    Active Recall Quiz ({currentQuizIndex + 1} of {analysisResult.quiz.length})
                  </CardTitle>
                </div>
                {quizSubmitted && quizScore !== null && (
                  <Badge variant={quizScore >= 80 ? 'mint' : 'warning'} className="text-xs font-bold">
                    Score: {quizScore}% ({selectedAnswers.filter((a, i) => a === analysisResult.quiz[i]?.correctAnswerIndex).length}/{analysisResult.quiz.length})
                  </Badge>
                )}
              </div>

              {/* Active Question */}
              <div className="py-6 space-y-4">
                <p className="text-sm font-semibold text-[#17243D]">
                  {analysisResult.quiz[currentQuizIndex]?.question}
                </p>

                <div className="space-y-2">
                  {analysisResult.quiz[currentQuizIndex]?.options.map((option, optIdx) => {
                    const isSelected = selectedAnswers[currentQuizIndex] === optIdx;
                    const isCorrect = analysisResult.quiz[currentQuizIndex]?.correctAnswerIndex === optIdx;

                    let optionStyle = 'bg-white border-[#E6EAF2] hover:border-[#6658F5]';
                    if (isSelected && !quizSubmitted) {
                      optionStyle = 'bg-[#6658F5]/10 border-[#6658F5] text-[#6658F5] font-semibold';
                    }
                    if (quizSubmitted) {
                      if (isCorrect) {
                        optionStyle = 'bg-[#E6F9F4] border-[#20C997] text-[#138A67] font-semibold';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'bg-rose-50 border-rose-300 text-rose-700';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(optIdx)}
                        className={cn(
                          'w-full p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between',
                          optionStyle
                        )}
                      >
                        <span>{option}</span>
                        {quizSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#20C997]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation on submission */}
                {quizSubmitted && (
                  <div className="p-4 bg-[#F6F8FC] rounded-2xl border border-[#E6EAF2] text-xs space-y-1">
                    <p className="font-bold text-[#17243D]">Explanation:</p>
                    <p className="text-[#4A5568] leading-relaxed">
                      {analysisResult.quiz[currentQuizIndex]?.explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Quiz Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-[#F0F2FA]">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentQuizIndex === 0}
                  onClick={() => setCurrentQuizIndex((prev) => prev - 1)}
                >
                  Previous
                </Button>

                <div className="flex gap-1.5">
                  {analysisResult.quiz.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuizIndex(idx)}
                      className={cn(
                        'w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer',
                        currentQuizIndex === idx
                          ? 'bg-[#6658F5] text-white shadow-xs'
                          : selectedAnswers[idx] !== -1
                          ? 'bg-[#20C997]/20 text-[#138A67]'
                          : 'bg-[#F0F2FA] text-[#718096]'
                      )}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                {currentQuizIndex < analysisResult.quiz.length - 1 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentQuizIndex((prev) => prev + 1)}
                  >
                    Next
                  </Button>
                ) : !quizSubmitted ? (
                  <Button
                    variant="mint"
                    size="sm"
                    onClick={handleSubmitQuiz}
                    disabled={selectedAnswers.includes(-1)}
                  >
                    Submit &amp; Measure Score
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsTakingQuiz(false)}>
                    Close Quiz
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Detailed Study Notes & Timestamps */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notes Editor (2 cols) */}
            <Card className="lg:col-span-2 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Detailed Study Notes</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleSaveToVault} className="text-xs">
                  <Save className="w-3.5 h-3.5" />
                  <span>Update in Vault</span>
                </Button>
              </div>

              <textarea
                rows={14}
                value={editableNotes}
                onChange={(e) => setEditableNotes(e.target.value)}
                className="w-full p-4 bg-[#FAFBFD] border border-[#E6EAF2] rounded-2xl text-xs sm:text-sm font-mono text-[#17243D] leading-relaxed focus:outline-none focus:border-[#6658F5] focus:bg-white"
              />
            </Card>

            {/* Key Timestamps & Tasks (1 col) */}
            <div className="space-y-6">
              {/* Timestamps */}
              <Card className="p-5 space-y-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#6658F5]" />
                  <span>Key Grounded Timestamps</span>
                </CardTitle>
                <div className="space-y-2">
                  {analysisResult.keyTimestamps.map((item, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-[#F6F8FC] rounded-xl border border-[#E6EAF2] flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-[#17243D] truncate pr-2">
                        {item.label}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white text-[#6658F5] font-mono text-[11px] font-bold border border-[#E6EAF2]">
                        {item.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Beginner-friendly Examples */}
              <Card className="p-5 space-y-3">
                <CardTitle className="text-sm">Mental Models &amp; Analogies</CardTitle>
                <div className="space-y-2">
                  {analysisResult.beginnerExamples.map((ex, i) => (
                    <div
                      key={i}
                      className="p-3 bg-[#20C997]/10 border border-[#20C997]/25 rounded-xl text-xs text-[#17243D] leading-relaxed"
                    >
                      {ex}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function YouTubeStudioPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="py-20 text-center text-xs text-[#718096]">
            Loading YouTube Studio...
          </div>
        </AppShell>
      }
    >
      <YouTubeStudioContent />
    </Suspense>
  );
}
