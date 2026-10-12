import { GoogleGenAI } from '@google/genai';
import { YouTubeAnalysisResult, QuizQuestion } from '@/types';

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

/**
 * Normalizes YouTube URLs and extracts videoId
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  try {
    const trimmed = url.trim();
    // Match watch?v=ID or youtu.be/ID or youtube.com/embed/ID or shorts/ID
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
    const match = trimmed.match(regExp);
    return match ? match[1]! : null;
  } catch {
    return null;
  }
}

/**
 * Generate structured learning pack from a public YouTube video or transcript fallback
 */
export async function analyzeVideoWithGemini(params: {
  videoUrl: string;
  videoId: string;
  transcriptFallback?: string;
  notesFallback?: string;
}): Promise<YouTubeAnalysisResult> {
  const ai = getGeminiClient();
  const modelName = getGeminiModel();

  if (!ai) {
    // Transparently throw or inform that key is missing
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const prompt = `
You are SkillCentral's advanced pedagogical AI engine.
Analyze this educational YouTube content (URL: ${params.videoUrl}, Video ID: ${params.videoId}).
${params.transcriptFallback ? `Provided transcript text: """${params.transcriptFallback}"""` : ''}
${params.notesFallback ? `Provided study notes: """${params.notesFallback}"""` : ''}

Generate a comprehensive, high-quality, structured study pack in STRICT JSON format with NO markdown wrapping around the JSON (valid raw JSON only).

The JSON must follow this exact schema:
{
  "title": "Clear educational title",
  "overview": "Concise 2-3 paragraph overview synthesizing the key takeaways",
  "coreConcepts": ["Key concept 1", "Key concept 2", "Key concept 3", "Key concept 4"],
  "detailedStudyNotes": "Extensive markdown-formatted study notes with headers, bullet points, and code/formulas if applicable",
  "keyTimestamps": [
    {"timestamp": "01:20", "label": "Introduction & Setup"},
    {"timestamp": "04:45", "label": "Core Mechanism Deep Dive"},
    {"timestamp": "12:10", "label": "Real-world Practical Implementation"},
    {"timestamp": "18:30", "label": "Summary & Next Steps"}
  ],
  "beginnerExamples": ["Practical relatable example 1", "Practical relatable example 2"],
  "quiz": [
    {
      "id": "q1",
      "question": "Clear conceptual multiple-choice question testing understanding?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Clear explanation why Option A is correct and why others are wrong."
    },
    {
      "id": "q2",
      "question": "Question 2?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 1,
      "explanation": "Explanation for question 2."
    },
    {
      "id": "q3",
      "question": "Question 3?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 2,
      "explanation": "Explanation for question 3."
    },
    {
      "id": "q4",
      "question": "Question 4?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 3,
      "explanation": "Explanation for question 4."
    },
    {
      "id": "q5",
      "question": "Question 5?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Explanation for question 5."
    }
  ],
  "suggestedTasks": [
    {"title": "Implement core concept in practice", "priority": "high"},
    {"title": "Review study notes and test recall", "priority": "medium"},
    {"title": "Create summary cheat-sheet in Knowledge Vault", "priority": "low"}
  ],
  "topicTags": ["Tag1", "Tag2", "Tag3"]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [prompt],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '';
    // Clean any accidental markdown fence
    const cleanedText = rawText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleanedText);

    return {
      videoId: params.videoId,
      title: parsed.title || `Learning Session: ${params.videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${params.videoId}/hqdefault.jpg`,
      overview: parsed.overview || '',
      coreConcepts: parsed.coreConcepts || [],
      detailedStudyNotes: parsed.detailedStudyNotes || '',
      keyTimestamps: parsed.keyTimestamps || [],
      beginnerExamples: parsed.beginnerExamples || [],
      quiz: parsed.quiz || [],
      suggestedTasks: parsed.suggestedTasks || [],
      topicTags: parsed.topicTags || [],
    };
  } catch (error) {
    console.error('[Gemini] Video analysis failed:', error);
    throw error;
  }
}

/**
 * Grounded AI Coach conversation
 */
export async function generateCoachResponse(params: {
  messages: Array<{ role: string; content: string }>;
  mode: string;
  sectorName?: string;
  notesContext?: Array<{ id: string; title: string; content: string }>;
}): Promise<{
  reply: string;
  citedSources: Array<{ noteId: string; title: string; snippet: string }>;
  suggestedTasks?: Array<{ title: string; sectorId: string; priority: 'low' | 'medium' | 'high' }>;
}> {
  const ai = getGeminiClient();
  const modelName = getGeminiModel();

  if (!ai) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  // Build context
  let contextSnippet = '';
  if (params.notesContext && params.notesContext.length > 0) {
    contextSnippet = `\nUSER'S SAVED NOTES IN KNOWLEDGE VAULT (Ground your answer strictly in these if answering factual questions):\n` +
      params.notesContext.map((n, i) => `[Source ${i + 1}] Note ID: "${n.id}", Title: "${n.title}"\nContent: """${n.content.slice(0, 1500)}"""\n`).join('\n');
  }

  const systemInstruction = `
You are the SkillCentral AI Learning Coach, an intelligent, empathetic, and rigorous mentor.
Current coaching mode: "${params.mode}".
Active Sector: "${params.sectorName || 'General Knowledge'}".

CRITICAL GROUNDING RULES:
1. When answering factual questions about the user's study topics, cite the saved note titles using [Source: Note Title].
2. If the user asks about specific facts and they are NOT covered in their saved notes, clearly acknowledge that: "This is not in your current Knowledge Vault notes, but based on general principles..."
3. Never invent access to external private user chat history or claim to be NotebookLM.
4. Keep explanations clear, structured, and action-oriented.
${contextSnippet}
`;

  const formattedContents = params.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        { text: systemInstruction },
        ...params.messages.map((m) => ({
          text: `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`,
        })),
      ],
    });

    const reply = response.text || 'I could not generate an answer at this time.';

    // Check which sources were cited
    const citedSources: Array<{ noteId: string; title: string; snippet: string }> = [];
    if (params.notesContext) {
      params.notesContext.forEach((n) => {
        if (reply.toLowerCase().includes(n.title.toLowerCase())) {
          citedSources.push({
            noteId: n.id,
            title: n.title,
            snippet: n.content.slice(0, 160) + '...',
          });
        }
      });
    }

    return {
      reply,
      citedSources,
    };
  } catch (error) {
    console.error('[Gemini] Coach chat error:', error);
    throw error;
  }
}

/**
 * Generate Structured Study Roadmap with Proposed Tasks
 */
export async function generateRoadmapPlan(params: {
  goal: string;
  timeframeDays?: number;
  sectorName?: string;
}): Promise<{
  roadmapTitle: string;
  description: string;
  milestones: Array<{
    title: string;
    targetDay: number;
    tasks: Array<{ title: string; details: string; priority: 'low' | 'medium' | 'high' }>;
  }>;
}> {
  const ai = getGeminiClient();
  const modelName = getGeminiModel();

  if (!ai) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const prompt = `
Create a realistic, actionable study roadmap for:
Goal: "${params.goal}"
Timeframe: ${params.timeframeDays || 30} days
Target Sector: "${params.sectorName || 'Specialization'}"

Output STRICT RAW JSON (no markdown fences) in this schema:
{
  "roadmapTitle": "Title",
  "description": "2 sentence summary",
  "milestones": [
    {
      "title": "Milestone 1 title",
      "targetDay": 7,
      "tasks": [
        {"title": "Task 1", "details": "Details", "priority": "high"},
        {"title": "Task 2", "details": "Details", "priority": "medium"}
      ]
    },
    {
      "title": "Milestone 2 title",
      "targetDay": 14,
      "tasks": [
        {"title": "Task 3", "details": "Details", "priority": "high"},
        {"title": "Task 4", "details": "Details", "priority": "medium"}
      ]
    },
    {
      "title": "Milestone 3 title",
      "targetDay": 30,
      "tasks": [
        {"title": "Task 5", "details": "Details", "priority": "high"}
      ]
    }
  ]
}
`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [prompt],
    config: { responseMimeType: 'application/json' },
  });

  const raw = (response.text || '{}').replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
  return JSON.parse(raw);
}
