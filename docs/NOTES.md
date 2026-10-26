# Architectural Notes & Decisions

## 1. Directory Structure: `/backend` vs `/server`
- **Context:** The task brief refers to `/server`, but the repository is already structured as an npm workspace with `backend` (`skill-sphere-backend`) and `frontend` (`skill-sphere-frontend`).
- **Decision:** Keep the primary TypeScript codebase inside `/backend`, and create a symlink `/server` -> `/backend` so that tools or scripts referencing `server/` work identically.

## 2. Database & Question Data Storage
- **User Instruction:** *"do not delete files related with questions in mongoDB and seedData"*.
- **Decision:** All existing MongoDB files (`DsaQuestion.ts`, `ChallengeSession.ts`, `Question.ts`, `seedDsa.ts`, `mbppQuestions.ts`, `localQuestions.ts`) are strictly preserved.
- The Coding Duel pipeline will generate `data/questions.json`.
- The server will load `questions.json` into memory at startup, and sync finished match records to the database.

## 3. Dataset Verification
- **Sanitized MBPP:** Verified at `https://raw.githubusercontent.com/google-research/google-research/master/mbpp/sanitized-mbpp.json`. Total items: 427. Contains `task_id`, `prompt`, `code`, `test_imports`, `test_list`.
- **MultiPL-E (mbpp-cpp):** Verified at Hugging Face dataset `nuprl/MultiPL-E` with config `mbpp-cpp`. Total items: 397. Contains `name` (`mbpp_<task_id>_<fn>`), `prompt`, `tests`.
- **Statement Translation Glitches:** In MultiPL-E, comments contain automated text replacements (e.g. "cppthon"). As instructed, we discard the MultiPL-E comment and use the sanitized MBPP `prompt` as the single canonical statement.

## 4. Frontend Protocol Alignment
- **Decision:** Rather than forcing the frontend to rewrite all its existing socket event names, the backend gateway directly supports both:
  - Frontend native events: `join_challenge`, `start_challenge`, `code_submitted`, `skip_question`, `surrender`, `typing`.
  - Normalized duel events: `queue:join`, `room:create`, `submission:send`.
- This ensures zero breaking changes to the existing visual design and user flow.

## 5. Security & Output Sanitization
- Player code is compiled and executed alongside the test harness.
- The raw assert texts and expected values are never transmitted to the client.
- When an assertion fails, the output sanitizer replaces the failure details with `"Some tests failed"`.
- Compilation errors and syntax exceptions are only displayed if they map to line numbers within the player's own code (`line <= playerCodeLines`), capped at 2,000 characters.
