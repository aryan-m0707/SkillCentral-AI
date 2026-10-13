# Google Tasks OAuth setup handoff

## Status — 2026-10-13

Rechecked after the user signed in again. APIs & Services now loads and confirms Gemini API and Google Tasks API are enabled. OAuth overview reports no configured clients, and the Clients table independently confirms `No OAuth clients to display`.

The selected project is named `Search movie`, with project ID `gen-lang-client-0292714922`. Its relationship to SkillCentral still requires user confirmation. The project picker continues to report `Error while loading resources`. Branding and Audience fail to load (tracking numbers `c7936307232122604` and `c7557801495300362` respectively); Data access navigation timed out and remained blank. Therefore audience, test users, branding, and configured scopes are still unverified. The evidence establishes incomplete client setup in this project, but does not establish the cause of the remaining Console loading errors. No Cloud configuration, credentials, billing, Gemini settings, or application code were changed. The integration has not been tested.

## Configuration derived from this repository

| Setting | Required local value |
| --- | --- |
| OAuth application type | Web application |
| Branding name | SkillCentral |
| Audience | External / Testing for a personal Google account; verify existing audience before changing |
| Test user | The owner's signed-in Google account; verify account in Console |
| Google Tasks scope | `https://www.googleapis.com/auth/tasks.readonly` |
| Local origin | `http://localhost:3000` |
| Exact redirect URI | `http://localhost:3000/api/integrations/google-tasks/callback` |
| Server client ID variable | `GOOGLE_OAUTH_CLIENT_ID` |
| Server client secret variable | `GOOGLE_OAUTH_CLIENT_SECRET` |
| Server redirect variable | `GOOGLE_OAUTH_REDIRECT_URI` |

The callback is present in `.env.local` and matches the fallback in `src/lib/server/google-tasks.ts`. The client ID and client secret keys were absent from the inspected `.env.local`; values could still be supplied by the launch environment. No running app listener was found on ports 3000, 3001, or 8080 during inspection. No deployed application URL was verified.

The current flow uses server-side authorization code exchange. The exact authorized redirect URI is essential. An authorized JavaScript origin is not required by this server flow; if configured for local browser use, use the origin above with no path. Only add a deployed origin and its full callback after verifying the actual deployment hostname. Do not enter placeholder production URLs.

Keep credentials in the existing ignored `.env.local` or deployment secret configuration, never in this document, source control, chat, or NEXT_PUBLIC variables. Merge only the OAuth settings; do not replace the environment file or alter Gemini settings.

## Remaining browser configuration

1. Resolve Console loading, identify the existing SkillCentral project, and verify Tasks API is enabled.
2. Inspect existing Google Auth Platform branding, audience, data access, test users, and clients before editing.
3. Use SkillCentral branding and the verified owner's support/developer contact. Do not invent domain, homepage, or privacy URLs.
4. For External / Testing, add the verified owner as a test user if absent. Keep the app in testing.
5. Configure Tasks read-only data access. The current code also requests email and profile scopes; either retain these for account display or remove the unnecessary profile request in code and align Console accordingly.
6. Repair an existing suitable Web application client, or create one if none exists. Register the exact callback above. Preserve unrelated clients and Gemini API keys. User participation may be required for credential creation or permission consent.
7. Store the resulting client ID and secret privately, restart the app, and perform the validation below.

## Exact implementation work remaining for Antigravity or Codex

Read the installed Next.js guides under `node_modules/next/dist/docs/` before editing code, as required by AGENTS.md.

1. **Align requested access.** In `src/lib/server/google-tasks.ts`, replace the full `.../auth/tasks` scope with `.../auth/tasks.readonly`. Console scope selection alone does not change the scope sent by the application. Existing previously granted write access must not be mistaken for a successful read-only test.
2. **Implement task reads.** The existing service lists task lists but has no task-list content read operation. Add `tasks.list`, with pagination for both lists and tasks, and map tasks into the dashboard with loading, empty, expired-session, and API-error states.
3. **Remove Google write behavior from the read-only integration.** `src/app/api/integrations/google-tasks/sync/route.ts` accepts `push_task` and `patch_task`; the planner invokes both. Disable/reject those Google actions and remove or relabel their UI controls. Preserve standalone local planner edits. Read-only authorization cannot support task insertion or completion updates in Google.
4. **Harden the OAuth flow.** The connect route currently generates state using `Math.random()` plus time; replace it with a cryptographically secure random value. Preserve exact state validation and short-lived HttpOnly cookies. Avoid logging raw OAuth error objects or returning unsanitized provider error details that may contain credentials or tokens.
5. **Handle tokens and connection status.** The callback stores raw token JSON in an HttpOnly cookie; review authenticated token storage before deployment and persist refreshed credentials safely. The status route currently treats cookie presence as connected; verify token usability and granted scopes before claiming a working connection. Handle revocation, missing read permission, and expired refresh tokens with reconnect UI.
6. **Update documentation.** README currently instructs full Tasks access and advertises Google task writes. Update it and integration UI to accurately describe read-only access.

## Acceptance checks still required

- Start the app at the exact configured local origin after privately installing OAuth credentials.
- Verify the outgoing authorization request uses the intended client, exact callback, nonempty state, and Tasks read-only scope.
- Have the owner complete Google consent. Never bypass browser security warnings or provide credentials in chat.
- Verify callback state validation and successful code exchange without exposing tokens.
- Make a real task-list read and a real task read, verify displayed results against the owner's account, and test empty lists and pagination.
- Verify rejected/denied consent, missing scope, expiry/reconnect, disconnect, and rejection of Google write actions.
- Confirm Gemini still works without changing its configuration.
- Record actual results. Existing unit tests and a `connected` cookie indicator are not proof of live integration success.

## Official references

- [Google Tasks scopes](https://developers.google.com/workspace/tasks/auth)
- [Google OAuth server-side flow and redirect configuration](https://developers.google.com/identity/protocols/oauth2/web-server)
