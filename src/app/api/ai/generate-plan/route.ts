import { NextRequest, NextResponse } from 'next/server';
import { generateRoadmapPlan, isGeminiConfigured } from '@/lib/server/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { goal, timeframeDays, sectorName } = body;

    if (!goal) {
      return NextResponse.json({ error: 'goal string is required' }, { status: 400 });
    }

    if (isGeminiConfigured()) {
      try {
        const roadmap = await generateRoadmapPlan({
          goal,
          timeframeDays: timeframeDays || 30,
          sectorName,
        });

        return NextResponse.json({
          status: 'live',
          roadmap,
        });
      } catch (err: any) {
        console.warn('[API/ai/generate-plan] Live Gemini error, falling back:', err.message);
      }
    }

    // High-fidelity fallback plan
    const days = timeframeDays || 30;
    const fallbackRoadmap = {
      roadmapTitle: `Mastery Roadmap: ${goal}`,
      description: `Structured ${days}-day milestone roadmap designed for high-retention mastery in ${sectorName || 'Specialization'}.`,
      milestones: [
        {
          title: 'Foundations & Mental Models',
          targetDay: Math.round(days * 0.25),
          tasks: [
            { title: `Read core documentation on ${goal}`, details: 'Highlight key terminology and save notes in Knowledge Vault', priority: 'high' },
            { title: 'Create initial summary card & flashcards', details: 'Active recall setup', priority: 'medium' },
          ],
        },
        {
          title: 'Hands-on Execution & Problem Solving',
          targetDay: Math.round(days * 0.6),
          tasks: [
            { title: `Build hands-on prototype for ${goal}`, details: 'Practical exercise applying concepts end-to-end', priority: 'high' },
            { title: 'Take comprehensive self-test quiz', details: 'Target 80%+ accuracy threshold', priority: 'medium' },
          ],
        },
        {
          title: 'Synthesis, Review & Milestone Portfolio',
          targetDay: days,
          tasks: [
            { title: `Document best practices & retrospectives on ${goal}`, details: 'Refine knowledge vault tags and links', priority: 'medium' },
            { title: 'Publish finished project or milestone demo', details: 'Final mastery verification', priority: 'high' },
          ],
        },
      ],
    };

    return NextResponse.json({
      status: 'demo_fallback',
      roadmap: fallbackRoadmap,
    });
  } catch (err: any) {
    console.error('Unhandled error in /api/ai/generate-plan:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
