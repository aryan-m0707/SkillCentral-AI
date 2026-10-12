import { NextRequest, NextResponse } from 'next/server';
import { generateCoachResponse, isGeminiConfigured } from '@/lib/server/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, mode, sectorName, notesContext } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    if (isGeminiConfigured()) {
      try {
        const result = await generateCoachResponse({
          messages,
          mode: mode || 'explain',
          sectorName,
          notesContext,
        });

        return NextResponse.json({
          status: 'live',
          reply: result.reply,
          citedSources: result.citedSources,
          suggestedTasks: result.suggestedTasks || [],
        });
      } catch (err: any) {
        console.warn('[API/ai/chat] Live Gemini error, falling back:', err.message);
      }
    }

    // High-fidelity pedagogical fallback when Gemini key is not configured
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const relevantNote = notesContext?.find((n: any) =>
      lastUserMessage.toLowerCase().includes(n.title.toLowerCase()) ||
      n.content.toLowerCase().includes(lastUserMessage.toLowerCase().split(' ')[0])
    );

    let reply = '';
    const citedSources: any[] = [];

    if (mode === 'explain') {
      if (relevantNote) {
        reply = `Based on your saved note **"${relevantNote.title}"**, here is the core breakdown:\n\n1. **Fundamental Rule**: ${relevantNote.content.slice(0, 200)}...\n\n2. **Application**: When applying this, focus on maintaining consistent rhythm and active verification. Would you like me to quiz you on this concept?`;
        citedSources.push({
          noteId: relevantNote.id,
          title: relevantNote.title,
          snippet: relevantNote.content.slice(0, 160) + '...',
        });
      } else {
        reply = `I analyzed your question: "${lastUserMessage}".\n\n*Note: This specific topic is not yet in your saved Knowledge Vault notes.* Based on general principles, the most effective approach is to break the concept into bite-sized mental models, practice active recall, and connect it to your current active sector (${sectorName || 'General'}).\n\nWould you like me to generate a 3-step study task for this in your Planner?`;
      }
    } else if (mode === 'quiz_me') {
      reply = `Let's test your active recall! Here is a targeted question based on your learning goals:\n\n**Question**: In your sector **${sectorName || 'Academics'}**, what is the single most critical constraint when architecting scalable systems or mastering complex grammar rules?\n\nTake your time to reply, and I will evaluate your rationale!`;
    } else if (mode === 'study_plan') {
      reply = `Here is a high-velocity study strategy for **${lastUserMessage}**:\n\n- **Phase 1 (Days 1–5)**: Foundations and mental models.\n- **Phase 2 (Days 6–15)**: Guided practice with verified quizzes.\n- **Phase 3 (Days 16–30)**: Real-world synthesis and portfolio milestone.\n\nYou can also click the **"Make Study Plan"** button to auto-generate a structured roadmap with milestones directly into your Planner!`;
    } else {
      reply = `I am your SkillCentral Coach. I am grounded in your saved notes across your active sector: **${sectorName || 'All Sectors'}**.\n\nYou asked: "${lastUserMessage}". Focus on consistent daily practice, log your focus sessions, and ensure you complete practice quizzes to reinforce memory consolidation.`;
    }

    return NextResponse.json({
      status: 'demo_fallback',
      reply,
      citedSources,
      suggestedTasks: [
        { title: `Practice recall: ${lastUserMessage.slice(0, 30)}`, sectorId: 'sec-academics', priority: 'medium' },
      ],
    });
  } catch (err: any) {
    console.error('Unhandled error in /api/ai/chat:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
