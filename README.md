# SkillSphere

Real-Time Competitive Programming Arena, Developer Social Hub & Skill Assessment Platform.

---

## Overview

SkillSphere is a competitive programming platform connecting developers through rapid-fire 1v1 coding duels, real-time social messaging, and timed skill assessments.

---

## Features

### 1v1 Coding Duel
* Real-time head-to-head algorithmic battles in Python 3 and C++.
* Progressive difficulty ramp (Easy to Medium to Hard) with adaptive tag balancing.
* Server clock authority with a 10-second anti-race evaluation buffer and 30-second disconnect grace period.
* Secure output sanitizer preventing test harness or assertion exposure.
* Dual execution engines: remote Judge0 CE sandbox and instant offline MockRunner.

### Social Hub & 3-Panel Chat
* Discord-inspired resizable multi-column layout.
* Real-time messaging powered by Firebase Firestore with inline timestamps and sleek custom scrollbars.
* Slide-in contact profile drawer displaying developer statistics, university, skills, and in-place profile editing.

### Dual Theme Support
* Instant Dark and Light mode toggle with persistent state and clean zinc styling.

### Assessments & Practice
* Timed multi-category quizzes (Linux, Python, Algorithms) with real-time analytics.
* Solo practice arena powered by the Monaco Code Editor.

---

## Tech Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Monaco Editor, Lucide Icons
* **Backend:** Node.js, Express, Socket.IO, TypeScript, MongoDB, Firebase Firestore
* **Execution:** Judge0 CE (Docker) / Built-in MockRunner (local development)
* **Testing:** Vitest (automated unit and integration test suite)

---

## Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Start Development Servers
```bash
npm run dev
```
* Frontend: http://localhost:5173
* Backend: http://localhost:5000

### 4. Run Tests & Demos
```bash
# Run unit and integration tests
npm test

# Run terminal 2-bot battle demo
npm run demo:match

# Seed database questions
npm run seed
```

---

## Self-Hosting Judge0 (Optional)

To enable sandboxed code execution via Docker:

```bash
docker compose -f docker-compose.judge0.yml up -d
```

Set `RUNNER=judge0` in `backend/.env`. Refer to [`docs/JUDGE0.md`](docs/JUDGE0.md) for detailed configuration.

---

## Attributions & License

* MBPP Dataset: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
* MultiPL-E Dataset: [MIT License](https://opensource.org/licenses/MIT)
* Full citations and author references are documented in [`ATTRIBUTION.md`](ATTRIBUTION.md).
