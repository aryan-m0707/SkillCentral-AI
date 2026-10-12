# SkillCentral — Antigravity Master Build Prompt

You are a principal full-stack engineer, product designer, and Google Cloud architect building a hackathon-ready web application called **SkillCentral**. Work IN THE CURRENT WORKSPACE. This is a real coding task: inspect the repository, form a short actionable plan, implement the application, run it, test it, fix defects, and write setup and deployment instructions. Do not stop after wireframes, plans, or mockups. Only ask me questions for genuinely missing secrets/authorizations; make sensible defaults for everything else.

## Product vision
SkillCentral is an AI-powered personal learning command center (a "second brain" for students and lifelong learners). Its workflow is **Capture → Organize → Understand → Act → Improve**. It combines NotebookLM-inspired chat grounded in the user's saved notes, a Gemini learning coach, public YouTube video learning, configurable knowledge sectors, a smart planner connected to Google Tasks, and measured learning analytics. Do NOT claim to integrate directly with NotebookLM or to read an existing user's Gemini chat history.

## Hackathon priorities
Judging emphasizes FUNCTIONALITY 40%, UX 20%, technical complexity 20%, innovation 10%, and presentation 10%; Google Cloud usage earns bonus consideration. Prioritize a complete end-to-end workflow, not dozens of empty pages. Minimum live demo: sign in → select/create sector → paste PUBLIC YouTube learning video URL or create note → AI summarizes / generates notes and quiz → save structured result to Firestore → complete quiz or mark practice milestone → generate follow-up task → optionally synchronize task with Google Tasks after OAuth consent → dashboard and sector analytics update from real stored events. If one integration is blocked by credentials, clearly show "Not connected" or "Demo mode" and keep the rest working. NEVER claim mock functionality is real.

## Stack (use these choices unless existing repo requires a justified adaptation)
- Next.js (App Router), TypeScript, React
- Tailwind CSS, shadcn/ui, Lucide icons, Recharts, Framer Motion for subtle animation
- Sora for headings + Inter for body (Google Fonts)
- Firebase Authentication with Google sign-in
- Cloud Firestore for durable per-user data; Firebase Admin SDK on server
- Gemini API with official `@google/genai` SDK, called ONLY from server routes
- Google Tasks REST API and Google OAuth 2.0 authorization-code flow
- Optional YouTube Data API for public video metadata
- Google Cloud Run deployment for the Next.js app and server route handlers
- Optional Google Cloud Storage for PDF attachments; make this a stretch goal
- Google Cloud Secret Manager for deployment secrets

## Design system — implement EXACTLY
Design language: premium calm intelligence; modern EdTech + high-quality productivity SaaS, not childish gaming. Default light theme, optional dark theme. Use ample whitespace, accessible contrast, responsive grids, thin borders, friendly micro-interactions, and NO excessive blobs/gradients or glass overload.
- Background/canvas: #F6F8FC; card: #FFFFFF
- Text: #17243D; muted: #718096; border: #E6EAF2
- Primary CTA / AI accent: #6658F5; fresh mint accent: #20C997
- Sector colors: Academics #7566F1; Language Learning #19B7A3; Specialization #3B82F6; Hobbies #F6A54A; Daily Tasks #EF6D91
- Fonts: Sora headings/display and Inter paragraph/labels
- Cards 18–24px radius, restrained shadows, consistent 8px spacing rhythm
- Buttons and charts must be accessible and keyboard-friendly. Show hover, loading, disabled and error states.
- Desktop: fixed/compact left sidebar, top command/search bar, roomy main canvas, right insight rail where appropriate; mobile: collapsing navigation and stacked responsive cards.
- Use charts built with Recharts: smooth multi-series AreaChart for sector progress, activity minutes stacked chart, small RadarChart for current skill balance, weekly consistency chart; customizable 7/30/90-day filters. Charts reflect actual Firestore data. Seeded demo values must be clearly labeled as DEMO.
- Soft illustrations/icons allowed sparingly. No giant cartoon mascot. Strong typographic hierarchy.

## Navigation
Dashboard / Knowledge Vault / YouTube Studio / AI Coach / Planner / Analytics / Integrations / Settings. Within Dashboard, also show sector cards and a Manage Sectors action. Add a global "Quick Capture" button accessible from every page.

## Default sectors and editability
On first sign-in automatically create exactly five configurable sectors:
1. Academics (subjects, class notes, quizzes, assignments)
2. Language Learning (vocabulary, grammar, exercises, listening)
3. Specialization (career/technical skill roadmaps, projects, certifications)
4. Hobbies (creative/personal interests, practice time, milestones)
5. Daily Tasks (execution, habits, reminders, consistency)
Allow add, rename, reorder, recolor, icon select, archive/unarchive, and delete with explicit confirmation. Under each sector users can create Skills / Subjects, then Topics, then Notes / Resources / Goals / Tasks. Preserve sector IDs when renamed; do not hard-code UI or chart logic to only five sectors. Distinguish Daily Tasks completion stats from knowledge-mastery scores.

## Dashboard detailed UI
- Header: personal greeting, command search, notifications, user avatar, Quick Capture.
- Four KPI cards: Learning Streak, Focus Hours This Week, Tasks Completed, Learning Mastery (only if measured; else show "Not enough quiz data").
- Main large interactive "Sector Growth" multi-series area/line chart with selectable sectors and 7/30/90 days. Represent tracked percent progress or completed milestones where comparable, with transparent legends and tooltip explanations; do not sum unrelated percent values.
- Nearby smaller "Learning Activity" chart showing real minutes invested per sector, with cumulative or stacked mode.
- Radar chart titled "Skill Balance" for sectors with comparable evidence; if insufficient data, show empty state.
- Today's Plan checklist with actual tasks and Add Task action.
- Gemini Coach Insight panel: actual insight calculated from quiz/milestone/activity context; add "Generate insight" and "Create action" buttons.
- My Learning Spaces cards for all user sectors with icon, color, progress, time, next milestone and open action.
- Recent Knowledge items, Continue Learning, Weekly Consistency strip.

## Knowledge Vault
- Hierarchy: Sector > Skill/Subject > Topic > Resources/Notes.
- CRUD for subjects, topics, plain text/Markdown notes, tags, resource links, and bookmarks. Search and filters by sector, tag, and type.
- Notes editor with title, rich or Markdown content, autosave or explicit reliable Save, source URL, timestamps and tags.
- Source details page linking source, generated summary, practice quiz, related tasks and coach chat.
- Source-grounded AI Q&A: on selected resources, send only relevant authorized text excerpts to Gemini and ask it to answer WITH note/source references; avoid unsupported facts, cite the saved note title/section, and say when the answer isn't in the selected sources. For hackathon use straightforward chunking and keyword retrieval before adding embeddings.
- PDF importing is optional stretch; if enabled store in Cloud Storage and extract text safely. Don't pretend to support a file that can't be parsed.

## YouTube Learning Studio
- Paste a public YouTube watch or youtu.be URL, validate/normalize it securely, display title/thumbnail/embed and sector/topic selector.
- Fetch optional metadata via YouTube Data API `videos.list` if YOUTUBE_API_KEY configured; avoid using the API for other creators' transcript downloads (permission limitation).
- Use Gemini's supported direct PUBLIC YouTube URL video-understanding input through the official SDK on a server endpoint when the selected model supports it; feature is preview and may have quotas. Put model name in GEMINI_MODEL env variable, do not hard-code experimental SDK endpoints without checking compatibility. If video input is unavailable, provide a clear fallback allowing user to paste permitted transcript or study notes.
- AI output in structured validated JSON: 1) title 2) concise overview 3) core concepts 4) detailed study notes 5) key timestamps ONLY when supported and grounded 6) beginner-friendly examples 7) five multiple-choice quiz items with answers and explanations 8) suggested next tasks 9) topic tags. Validate data server-side; retry or show a useful error on malformed output.
- User can edit generated notes, Save to Vault, Take Quiz, "Ask Gemini about this", or "Add tasks to Planner". Persist source link and attribution. Never imply user watched a video simply because they pasted it.

## AI Coach
- A usable chat UI with streamed response if feasible, conversation history stored per user, and a sidebar with selected sector/skill/source context.
- Modes: Explain Simply, Brainstorm, Make Study Plan, Quiz Me, Summarize Sources, Explain My Progress.
- Planning: turn a goal such as "Learn React in 30 days" into a structured roadmap with milestones and suggested tasks. Show task proposal preview and only save/create/sync after user confirmation.
- Use user-authorized notes, active goals, quiz errors and tasks to personalize grounded answers; no invented access to Google/Gemini histories.
- Chat response displays relevant local source references when grounded in Vault. Provide prompt suggestions but work with arbitrary user queries.

## Planner and Google Tasks
- Built-in Planner task CRUD works WITHOUT Google OAuth. Fields: title, details, sectorId, subjectId optional, status, priority, dueDate, local timeBlockStart/timeBlockEnd optional, linkedResourceId optional, completedAt.
- Today, Week and Upcoming views, basic calendar, completion checkbox, filters and progress.
- Google Tasks is a separate opt-in Connect action after Google sign-in. Implement true server-side Google OAuth authorization-code flow with CSRF state, secure tokens, necessary `https://www.googleapis.com/auth/tasks` scope for read/write; add testing instructions for consent-screen test users.
- Backend integrations: list tasklists; list tasks with pagination; create a task using `tasks.insert`; update status with `tasks.patch`; optional on-demand two-way sync. Store external tasklistId/taskId mapping and sync timestamp; avoid duplicates. Handle revoked permissions and expired access with refresh token where available; never expose tokens in UI/client.
- Critical limitation: Google Tasks API `due` stores date only and discards time. SkillCentral owns accurate time-block scheduling; don't claim to sync time-of-day to Google Tasks. Never silently overwrite user Google Tasks data; offer explicit opt-in and safe conflict handling.

## Analytics and scoring
- Track evidence: actual study sessions (user starts/stops timer or manually logs), quiz attempts (score, date, topic), goals/milestones completed, tasks completed, source notes created, events per day.
- Learning streak = consecutive local-calendar days with a recorded qualifying learning activity (clearly define events, use user's timezone).
- Mastery = quiz-derived accuracy when quiz attempts exist; not a fabricated AI-assigned number. Optional milestone completion is displayed separately. For hobbies without quizzes use milestone completion and practice hours; for Daily Tasks use task completion rate, never call it knowledge mastery.
- Sector growth snapshots should preserve data and dates for historic trend, explain metric in chart tooltips. Filter by week/month/quarter; gracefully handle no data.
- Calculate KPI values server-side or from validated Firestore data, not random constants. Seed 14 days of clearly labeled demo data for a demo account/DEMO_MODE only, with a reset button.

## Data model (adjust thoughtfully, document actual schema)
Top-level `users/{uid}` profile and settings. Under each user:
- `sectors/{sectorId}` (name, color, icon, rank, archived)
- `skills/{skillId}` (sectorId, title, description)
- `topics/{topicId}` (skillId, title)
- `resources/{resourceId}` (sectorId, topicId, type, title, url, source metadata, generated summary)
- `notes/{noteId}` (resourceId?, sectorId, skillId?, topicId?, content, tags)
- `goals/{goalId}` and `milestones/{milestoneId}`
- `tasks/{taskId}` (status, due, time blocks, externalTaskId/externalListId)
- `quizzes/{quizId}` and `quizAttempts/{attemptId}`
- `studySessions/{sessionId}` and `activityEvents/{eventId}`
- `sectorSnapshots/{snapshotId}`
- `chats/{chatId}` with messages subcollection or bounded messages
- `integrations/googleTasks` metadata; store sensitive tokens encrypted server-side, never openly in Firestore or shipped to client.
Use auth guards per route, authorization checks per user, Firestore security rules if browser access is used, plus rules / indexes in repository. Avoid showing or returning another user's content.

## Server endpoints and file layout (adapt if needed)
- `src/lib/server/gemini.ts` for secure Gemini client
- `src/lib/server/firestore.ts` for server-side DB access
- `src/lib/server/google-tasks.ts` for OAuth refresh and Tasks REST helpers
- `src/app/api/ai/chat/route.ts`
- `src/app/api/ai/generate-plan/route.ts`
- `src/app/api/videos/analyze/route.ts`
- `src/app/api/integrations/google-tasks/connect/route.ts`
- `src/app/api/integrations/google-tasks/callback/route.ts`
- `src/app/api/integrations/google-tasks/sync/route.ts`
- Implement route handlers for all actual CRUD actions used by the interface. Do not make sensitive API calls from client components.

## Configuration and privacy
Create `.env.example` with placeholders and corresponding setup instructions:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GOOGLE_CLOUD_PROJECT=
GEMINI_API_KEY=
GEMINI_MODEL=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/google-tasks/callback
YOUTUBE_API_KEY=
GCS_BUCKET=
DEMO_MODE=false
```
Keep `.env.local` out of Git; no real secrets in code. In production use Secret Manager and Cloud Run environment variable/secret references. With Cloud Run use its service account/Application Default Credentials instead of shipping service account private-key JSON. Browser Firebase config is public application configuration; Gemini keys, OAuth client secret, and refresh tokens are NOT public. Add input validation, rate limits/basic request safeguards, error boundaries, loading states, explicit consent for external connections, and a way to disconnect Google Tasks.

## Phases — ACTUALLY IMPLEMENT in this order
1. Inspect repo, scaffold project if blank, install dependencies, create clean design tokens / reusable UI components, create README and short BUILD_PLAN.md.
2. Auth, Firestore data model, sector onboarding and CRUD, beautiful real-data dashboard skeleton, internal tasks/notes CRUD.
3. Gemini server integration, AI notes and quiz generation, public YouTube link analyzer with fallback, save-to-vault workflow.
4. Quiz persistence and working analytics charts / streak / growth, task proposals into internal Planner.
5. Google Tasks OAuth connect, task list display, one-way task push and completed-status update; then optional two-way sync.
6. Polish AI coach contextual chat, empty states, mobile responsiveness, demo fixtures; run checks, test key paths, repair failures and deploy to Cloud Run if cloud credentials are provided.
If short on time, finish phases 1–4 thoroughly before stretching. Avoid stub pages with misleading buttons.

## Acceptance criteria
- `npm install`, `npm run dev`, and `npm run build` succeed; no obvious TypeScript/runtime errors.
- Works on 1440px desktop and a 390px mobile viewport.
- On first sign-in, exactly five editable sectors appear and persist across refresh.
- User can create a topic/note and find it later via Knowledge Vault.
- A supported PUBLIC YouTube URL generates actual AI notes/quiz when Gemini is configured; unsupported access gives visible honest fallback.
- AI-created quiz can be completed and stored; dashboard changes from stored attempts/events, not random data.
- AI can propose and create an internal task; user can complete it.
- When Google Tasks is connected and properly authorized, a real task is created, and saved external IDs prevent duplicates.
- Source-grounded AI answers cite their actual selected notes or transparently acknowledge missing source support.
- All destructive actions confirm first; no button is inert; empty/loading/error/connected/disconnected states are implemented.
- Include automated tests for scoring, video URL parsing, and Tasks mapping where feasible; test manually in browser.
- Publish a README including architecture diagram, API setup, OAuth redirect URIs, Firestore setup, Secret Manager, Cloud Run deploy commands, costs/quota caveats, limitations, and 90-second judge demo script.

## Working style / final response
First give me a concise implementation plan and note essential missing credentials. Then IMPLEMENT with file edits and terminal commands. Run a development server and use the browser to inspect and fix UI if tools are available. Never fabricate successful calls, tests, deployments, or integrations. At end give me: application URL (if actually running), files changed, tests/build status, what Google services are really wired up, exactly what credentials I must add and where, and any remaining stretch features. Never ask me to paste secret values into chat or commit them.
