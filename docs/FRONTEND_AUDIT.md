# Frontend Audit: Coding Duel / 1v1 Battle Arena

## 1. Overview & Framework
- **Framework:** React 19.2.0 + TypeScript 5.7.3.
- **Build Tool:** Vite 7.2.4.
- **Styling:** Tailwind CSS v4.0.0.
- **Routing:** `react-router-dom` v7.14.1 with `createBrowserRouter` defined in [`frontend/src/App.tsx`](file:///home/naitik/Projects/Skill-Sphere-/frontend/src/App.tsx).
- **Icons / Assets:** Inline SVGs and styled HTML elements.
- **Authentication:** Firebase Auth ([`frontend/src/firebase.ts`](file:///home/naitik/Projects/Skill-Sphere-/frontend/src/firebase.ts)) with fallback guest/dev bypass (`?dev=true`).

---

## 2. Navigation & Routing Structure
* `/` -> `HomePage.tsx`
* `/quizzes` -> `Quizzes.tsx`:
  * Default mode `main` renders the battleground introduction.
  * Mode `challenge` renders the 1v1 arena [`frontend/src/components/Challenge.tsx`](file:///home/naitik/Projects/Skill-Sphere-/frontend/src/components/Challenge.tsx).
  * Mode `practice` renders solo quiz practice ([`frontend/src/pages/Practice.tsx`](file:///home/naitik/Projects/Skill-Sphere-/frontend/src/pages/Practice.tsx)).
* `/friends` -> `Friends.tsx`
* `/profile` -> `Profile.tsx`
* `/games` -> Placeholder container.

---

## 3. Challenge Component Audit ([`Challenge.tsx`](file:///home/naitik/Projects/Skill-Sphere-/frontend/src/components/Challenge.tsx))

### A. State Management
All match state is stored locally using React hooks (`useState`, `useRef`, `useEffect`):
- `inRoom`: boolean (indicates whether player has joined or created a room).
- `isHost`: boolean (identifies room creator who has permission to click "START CHALLENGE").
- `isReady`: boolean (triggered when opponent joins).
- `isStarted`: boolean (triggered when match starts).
- `roomCode`: string (6-character uppercase room code).
- `challengeState`: object containing:
  - `players`: array of `Player` (`{ socketId, userDetails: { name }, score, currentIndex }`).
  - `questions`: array of `Question` (`{ title, description, category, difficulty, languages: { [lang]: { starterCode, sampleTests } } }`).
- `language`: string (default `"javascript"`, supports `"python"`, `"cpp"`).
- `code`: string (editor buffer).
- `output`: string (test execution result console output).
- `isRunning`: boolean (disables buttons while code is executing).
- `opponentStatus`: string (shows `"Typing..."` or `"Running code..."`).
- `winner`: `Player | null` (triggers final results modal).

### B. View States
1. **Lobby / Room Setup View (`!inRoom`)**:
   - "CREATE A ROOM" button: generates 6-char random alphanumeric room code and emits `join_challenge`.
   - "Enter Room Code" input + "JOIN ROOM" button.
2. **Waiting Room View (`inRoom && !isStarted`)**:
   - Displays `Room Code` with a WhatsApp share link.
   - 2-player avatar display ("You" vs "Opponent") with dynamic ready status.
   - Action buttons: "DISCARD & LEAVE" and "START CHALLENGE" (active only for host when `isReady`).
3. **In-Match Dual Workspace (`isStarted && !winner`)**:
   - **Header:**
     - Left: Player avatar, name, score tracker `p1Score/10`, and 10-step progress bar.
     - Center: "VS" badge.
     - Right: Opponent avatar, name, score tracker `p2Score/10`, 10-step progress bar, and live typing/running status indicator.
   - **Left Panel (Problem Description & Actions):**
     - Question index indicator (`QUESTION X`).
     - Title, difficulty badge (`EASY`, `MEDIUM`, `HARD`), category badge.
     - Description text (with whitespace preserved).
     - Sample assertion panel (`Sample Assertion ({language})`).
     - Terminal console box showing colored runner messages.
     - Action buttons: `SKIP`, `RUN CODE` (sample test), `SUBMIT SOLUTION` (all tests).
     - Link: `Surrender Match`.
   - **Right Panel (Code Editor):**
     - [`CodeEditor.tsx`](file:///home/naitik/Projects/Skill-Sphere-/frontend/src/components/CodeEditor.tsx) wrapping Monaco Editor with syntax highlighting, language selector, and auto-population of starter code when switching questions or languages.
4. **Result Overlay (`winner !== null`)**:
   - Fullscreen glassmorphic overlay announcing "CHALLENGE OVER", winner's name, and a "HOME" navigation button.

---

## 4. Socket.IO Contract Currently Used by Frontend

The frontend connects via `io(BACKEND_URL, { withCredentials: true })`:

### Client to Server Emits:
| Event Name | Payload | Purpose |
| :--- | :--- | :--- |
| `join_challenge` | `{ challengeId: string, userDetails: { name: string } }` | Join or create a room by code |
| `start_challenge` | `{ challengeId: string }` | Host starts the match |
| `leave_challenge` | `{ challengeId: string }` | Player quits or discards room |
| `code_submitted` | `{ challengeId: string, code: string, language: string, isSubmit: boolean }` | Run sample or submit solution |
| `skip_question` | `{ challengeId: string }` | Skip current question |
| `surrender` | `{ challengeId: string }` | Forfeit the entire match |
| `typing` | `{ challengeId: string }` | Broadcast opponent typing activity |

### Server to Client Listens:
| Event Name | Expected Payload | UI Response |
| :--- | :--- | :--- |
| `challenge_state` | `ChallengeState` | Synchronizes players, scores, indices, and questions |
| `challenge_ready` | `void` | Enables the host's "START CHALLENGE" button |
| `challenge_started` | `ChallengeState` | Transitions view from Waiting Room to In-Match Duel |
| `code_result` | `{ success: boolean, message: string, isSubmit: boolean }` | Displays runner verdict in console; resets code on pass |
| `opponent_typing` | `void` | Shows "Typing..." above opponent score for 2 seconds |
| `opponent_running`| `void` | Shows "Running code..." above opponent score |
| `challenge_end` | `{ winner: Player }` | Triggers the winning modal overlay |

---

## 5. Mock Data / Fake Implementations Identified
1. **Question Selection:** Currently uses MongoDB `$sample: { size: 10 }` on `DsaQuestion`. Will be powered by the curated question ramp from `data/questions.json` with Judge0 harnesses.
2. **Evaluation:** `codeExecutionService.ts` contains partial local exec calls that can leak assertion texts. Needs proper replacement with `Judge0Runner` + sanitized output error formatting.
3. **Queue / Matchmaking:** Quick-match queue was not yet wired in UI (only private room code existed). We will add `POST /api/guest` and support queue matchmaking.
