# 🌐 SkillSphere

<div align="center">

![SkillSphere Logo](frontend/public/logo.svg)

### Real-Time Competitive Programming Arena, Social Chat & Skill Assessment Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4.8-010101.svg?logo=socket.io&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28.svg?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vitest](https://img.shields.io/badge/Vitest-v5.0-FCC72B.svg?logo=vitest&logoColor=black)](https://vitest.dev/)
[![Judge0 CE](https://img.shields.io/badge/Judge0-v1.13.1-blueviolet.svg?logo=docker&logoColor=white)](https://judge0.com/)

**[Explore Live Demo](https://xskillsphere.vercel.app)** • **[Documentation](docs/)** • **[API Spec](docs/API.md)** • **[Self-Hosting Judge0](docs/JUDGE0.md)**

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [System Architecture & Folder Structure](#-system-architecture--folder-structure)
- [Core Features & Modules](#-core-features--modules)
  - [1. Coding Duel (1v1 Live Arena)](#1-coding-duel-1v1-live-arena)
  - [2. Social Hub & 3-Panel Chat](#2-social-hub--3-panel-chat)
  - [3. Dual Theme Engine (Light & Dark)](#3-dual-theme-engine-light--dark)
  - [4. Skill Assessments & Quizzes](#4-skill-assessments--quizzes)
  - [5. Practice Arena & Monaco Editor](#5-practice-arena--monaco-editor)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Environment](#installation--environment)
  - [Running Locally](#running-locally)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Self-Hosting Judge0 Code Execution](#-self-hosting-judge0-code-execution)
- [Environment Variables](#-environment-variables)
- [Attribution & Licenses](#-attribution--licenses)

---

## 🌟 Overview

**SkillSphere** is an end-to-end fullstack platform designed for software engineers, students, and competitive programmers. It unites real-time 1v1 algorithmic duels, a Discord/WhatsApp-inspired developer social and chat hub, domain-specific timed assessments, and live sandboxed code execution into a single, cohesive experience.

Whether challenging peers to rapid-fire algorithmic sprint matches in **Python 3** or **C++**, syncing messages across friends via Firebase Firestore, or practicing data structures in an embedded Monaco editor, SkillSphere provides a responsive, type-safe, and resilient developer environment.

---

## 🏛 System Architecture & Folder Structure

SkillSphere is organized as a clean **npm workspace monorepo** separating the React client, Express API/Socket gateway, shared documentation, and containerized sandbox configurations:

```text
Skill-Sphere-/
├── 📁 frontend/                     # React 19 + TypeScript + Vite + Tailwind v4 Web App
│   ├── public/                      # Static assets & brand iconography (logo.svg)
│   ├── src/
│   │   ├── components/              # Modular UI components
│   │   │   ├── ui/                  # Primitives (resizable, button, dialog, avatar, tooltip)
│   │   │   ├── blocks/              # Composed UI blocks
│   │   │   ├── Challenge.tsx        # 1v1 Battle Arena with live code editor & runner sync
│   │   │   ├── ChatBox.tsx          # Real-time chat feed with inline timestamps & sleek scrollbar
│   │   │   ├── ProfileView.tsx      # Discord-style slide-in Contact Profile panel
│   │   │   ├── Navbar.tsx           # Responsive header with theme switch & navigation
│   │   │   ├── CodeEditor.tsx       # Monaco Editor wrapper with language & theme bindings
│   │   │   └── ...                  # Sidebar, AddFriend, Pending, Online, Sessions
│   │   ├── context/                 # Application contexts (AuthContext, ThemeContext)
│   │   ├── pages/                   # Top-level view routes
│   │   │   ├── Friends.tsx          # 3-Panel social hub with resizable chat & profile drawer
│   │   │   ├── HomePage.tsx         # Landing page and platform feature discovery
│   │   │   ├── Practice.tsx         # Solo algorithm practice arena
│   │   │   ├── Quizzes.tsx          # Timed skill assessments & quiz category selector
│   │   │   └── Games.tsx            # Game mode lobby & 1v1 challenge orchestrator
│   │   ├── services/                # API integration & question client services
│   │   ├── utils/                   # Shared frontend helper utilities
│   │   ├── index.css                # Tailwind v4 directives, color tokens & custom scrollbars
│   │   └── main.tsx                 # Client application entry point
│   ├── eslint.config.js             # ESLint configuration
│   ├── package.json                 # Frontend dependencies & workspace scripts
│   ├── tsconfig.json                # TypeScript compiler configuration for client
│   └── vite.config.js               # Vite build and dev server configuration
│
├── 📁 backend/                      # Node.js + Express + Socket.IO + TypeScript Server
│   ├── data/
│   │   └── questions.json           # Curated MBPP / MultiPL-E coding problem dataset (390+ questions)
│   ├── src/
│   │   ├── config/                  # Database config (MongoDB Mongoose + in-memory fallback)
│   │   ├── controllers/             # REST route controllers (challenge, question, duel)
│   │   ├── data/                    # Seed datasets & curated MBPP questions
│   │   ├── gateway/                 # Socket.IO DuelSocketGateway (connection, auth, real-time events)
│   │   ├── match/                   # DuelMatchEngine (state machine, scoring, question ramps)
│   │   ├── middleware/              # Authentication & request validation middleware
│   │   ├── models/                  # Mongoose data schemas (Challenge, Session, Question, DsaQuestion)
│   │   ├── routes/                  # REST endpoints (/api/duel, /api/questions, /api/challenges)
│   │   ├── runner/                  # Code execution subsystem
│   │   │   ├── CodeRunner.ts        # Pluggable execution runner interface
│   │   │   ├── Judge0Runner.ts      # HTTP client for Judge0 CE v1.13.1 with auto-retry
│   │   │   ├── MockRunner.ts        # Zero-dependency local runner for instant development
│   │   │   ├── OutputSanitizer.ts   # Error & diagnostic sanitizer (prevents test harness leaks)
│   │   │   └── adapters/            # Language program builders (Python3Adapter, CppAdapter)
│   │   ├── scripts/                 # CLI tools (demo bot duels, dataset QA, seeders)
│   │   ├── services/                # Core domain business logic (codeExecutionService)
│   │   ├── seedDsa.ts               # DSA question database seeder
│   │   └── server.ts                # HTTP & Socket.IO server bootstrap
│   ├── test/                        # Vitest automated test suite
│   │   ├── adapters.test.ts         # Program builder & test harness validation
│   │   ├── sanitizer.test.ts        # Security & error sanitization test cases
│   │   ├── judge0.test.ts           # Judge0 HTTP client mock & retry tests
│   │   ├── match.test.ts            # Match state machine, scoring, & timer unit tests
│   │   └── integration.test.ts      # End-to-end 2-bot duel socket simulation test
│   ├── package.json                 # Backend dependencies & scripts
│   └── tsconfig.json                # TypeScript compiler configuration for server
│
├── 📁 docs/                         # Technical Specifications & Guides
│   ├── API.md                       # Complete REST & Socket.IO protocol specification
│   ├── FRONTEND_AUDIT.md            # Audit of UI components, state contracts, & sockets
│   ├── JUDGE0.md                    # Judge0 Linux, Docker, & cgroup v1 configuration guide
│   └── NOTES.md                     # Architectural decisions, edge case handling, & trade-offs
│
├── .env.example                     # Root environment variable template
├── .firebaserc                      # Firebase project configuration
├── firebase.json                    # Firebase hosting & Firestore deployment rules
├── firestore.indexes.json           # Firestore compound query indexes
├── firestore.rules                  # Firestore security & authorization rules
├── docker-compose.judge0.yml        # Self-hosted Judge0 CE v1.13.1 Docker Compose stack
├── ATTRIBUTION.md                   # Open-source dataset attributions (MBPP, MultiPL-E)
├── package.json                     # Root orchestrator with workspace scripts
├── package-lock.json                # Locked dependency tree
├── .gitignore                       # Git exclusion rules (scratch notes & local secrets ignored)
└── README.md                        # Master repository documentation
```

---

## ⚡ Core Features & Modules

### 1. Coding Duel (1v1 Live Arena)
A competitive head-to-head battle arena where two programmers race against time to solve identical algorithmic challenges.

* **Progressive Difficulty Ramp:** Problems are served in an adaptive sequence (e.g., Easy $\rightarrow$ Medium $\rightarrow$ Hard) while preventing consecutive identical topic tags.
* **Pluggable Execution Engine:**
  * **Judge0 CE Runner:** Compiles and runs Python 3 and C++ (GCC 17) code in isolated sandboxes.
  * **MockRunner:** Built-in zero-dependency runner allowing full gameplay and test execution offline without Docker or external APIs.
* **Server Clock Authority & Anti-Race Buffer:** The server is the definitive source of truth. If Player A submits a winning solution while Player B has an earlier submission still evaluating in Judge0, the engine holds the match up to 10 seconds to ensure strict fairness.
* **Disconnect Grace Period:** Players who encounter network drops have a 30-second reconnection window before a forfeit is declared.
* **Output Sanitizer & Anti-Leak Protection:** Hidden test harnesses and raw assertions are never exposed to clients. Assertion failures emit a clean `"Some tests failed"`, and compile diagnostics are strictly scrubbed to line numbers within the user's authored code.

### 2. Social Hub & 3-Panel Chat
A developer communication suite combining the best patterns of Discord and WhatsApp Web.

* **3-Panel Resizable Layout:** Powered by `react-resizable-panels`:
  * **Left Column:** Navigation sidebar, friend lists, active online indicators, friend search, and incoming/pending request manager.
  * **Center Column:** Real-time messaging feed synced with Firebase Firestore, day separators, auto-scrolling to latest message, and inline single-line timestamps.
  * **Right Column:** Slide-in Contact Profile panel showing detailed user bios, university/college, programming languages, duel statistics, and an in-place profile editor dialog.
* **Sleek Custom Scrollbar:** Ultra-thin 5px ergonomic scrollbars styled consistently across light and dark themes.

### 3. Dual Theme Engine (Light & Dark)
* **Zero-Flicker Persistence:** Integrated `ThemeContext` tracking state in `localStorage` with automated system theme fallback.
* **Curated Color Tokens:** 
  * **Dark Mode:** Deep zinc tones (`#09090b`, `#18181b`, `#27272a`) with crisp border contrast.
  * **Light Mode:** Modern clean surfaces (`#ffffff`, `#f4f4f5`, `#e4e4e7`) with readable text hierarchy.
* **Accessible Toggle:** Instant toggle in the primary navigation bar with smooth micro-transitions.

### 4. Skill Assessments & Quizzes
* Curated multiple-choice assessments spanning **Linux Systems**, **Python**, **Data Structures**, and **Core CS Fundamentals**.
* Real-time countdown timer, progress indicators, question review, and instant performance analysis.

### 5. Practice Arena & Monaco Editor
* Integrated VS Code-grade **Monaco Editor** with full syntax highlighting, auto-indentation, and bracket matching.
* Support for multiple languages: Python, C++, JavaScript, Java, and C.

---

## 🛠 Technology Stack

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript | Component-based, strictly typed UI layer |
| **Bundler & Build Tool** | Vite 7.3 | Ultra-fast HMR and optimized production bundle |
| **Styling & Design System** | Tailwind CSS v4 + Radix UI Primitives | Modern design tokens, responsive layout, glassmorphism |
| **Code Editor** | `@monaco-editor/react` | In-browser code editing with language tooling |
| **Panels & Layout** | `react-resizable-panels` | Fluid, draggable multi-column layout |
| **Backend Runtime** | Node.js (v20+) + Express | RESTful API server and request routing |
| **Real-Time Sockets** | Socket.IO (v4.8) | Bidirectional low-latency duel gateway & matchmaking |
| **Databases** | MongoDB (Mongoose) + Firebase Firestore | Persistent match state, profiles, and live chat sync |
| **Execution Sandbox** | Judge0 CE (v1.13.1) | Isolated sandbox for compiling and evaluating code |
| **Testing Framework** | Vitest (v5.0) | High-speed unit and integration testing suite |
| **Icons & Media** | Lucide React | Consistent, lightweight iconography |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v20.0.0` or higher recommended
* **npm**: `v10.0.0` or higher
* **Docker & Docker Compose** *(Optional, only if self-hosting Judge0 CE)*

### Installation & Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/Skill-Sphere-.git
   cd Skill-Sphere-
   ```

2. **Install all workspace dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the provided `.env.example` templates for both the root, backend, and frontend:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
   *(By default, `RUNNER=mock` is configured in `backend/.env`, enabling immediate gameplay and local development without requiring Docker or Judge0).*

### Running Locally

Start both the backend server and frontend development client concurrently with a single command:

```bash
npm run dev
```

* 🌐 **Frontend Application:** [http://localhost:5173](http://localhost:5173)
* ⚙️ **Backend API & Sockets:** [http://localhost:5000](http://localhost:5000)

#### Quick 1v1 Duel Test (Local Multiplayer):
1. Open [http://localhost:5173/quizzes](http://localhost:5173/quizzes) in two separate browser tabs (or use private browsing windows).
2. Click **1V1 CHALLENGE** in the sidebar.
3. Player 1 selects **CREATE A ROOM** and copies the generated 6-character room code.
4. Player 2 enters the room code and clicks **JOIN ROOM**.
5. Player 1 starts the challenge to launch the real-time duel arena!

---

## 🧪 Testing & Quality Assurance

SkillSphere includes a comprehensive Vitest automated test suite covering code runner adapters, output sanitization, HTTP retries, match state machines, and full socket-driven bot battles:

```bash
# Run all unit and integration test suites
npm test

# Run tests in watch mode during development
npm run test --workspace=skill-sphere-backend -- --watch
```

### Live Bot Duel Terminal Simulation
To see the match engine, progressive question ramp, and scoring calculations in action directly inside your terminal:
```bash
npm run demo:match
```
*Spawns `BotAlice` and `BotBob`, executing simulated code evaluations and displaying real-time terminal leaderboards.*

### Database Seeding Commands
```bash
# Seed curated coding duel questions (from backend/data/questions.json)
npm run seed

# Seed DSA practice questions into MongoDB
npm run seed:dsa
```

---

## 🐳 Self-Hosting Judge0 Code Execution

For production-grade isolated code execution, SkillSphere provides a pre-configured Docker Compose file for **Judge0 CE v1.13.1**:

1. **Launch the Judge0 stack (PostgreSQL, Redis, and Judge0 Server):**
   ```bash
   docker compose -f docker-compose.judge0.yml up -d
   ```

2. **Verify Judge0 health:**
   ```bash
   curl http://localhost:2358/system_info
   ```

3. **Switch backend runner in `backend/.env`:**
   ```env
   RUNNER=judge0
   JUDGE0_URL=http://localhost:2358
   JUDGE0_AUTH_TOKEN=
   ```

*For advanced configuration, cgroup v1 compatibility notes, and memory limit tuning, see [`docs/JUDGE0.md`](docs/JUDGE0.md).*

---

## 🔐 Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for Express & Socket.IO server |
| `MONGO_URI` | `mongodb://localhost:27017/skillsphere` | MongoDB connection URI (falls back to in-memory store if unreachable) |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin for frontend |
| `RUNNER` | `mock` | Execution engine: `mock` (local development) or `judge0` (sandbox) |
| `JUDGE0_URL` | `http://localhost:2358` | URL of self-hosted or remote Judge0 CE instance |
| `JUDGE0_AUTH_TOKEN` | *(empty)* | Optional authorization token / RapidAPI key for Judge0 |

### Frontend Configuration (`frontend/.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:5000` | Target URL for backend REST and Socket.IO connections |
| `VITE_FIREBASE_API_KEY` | *(your-key)* | Firebase project API key for Firestore chat & auth |
| `VITE_FIREBASE_PROJECT_ID`| *(your-id)* | Firebase Project ID |

---

## 📜 Attribution & Licenses

* **MBPP Dataset:** Mostly Basic Python Problems dataset used under the [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) license.
* **MultiPL-E Dataset:** C++ benchmark translations from MultiPL-E used under the [MIT License](https://opensource.org/licenses/MIT).
* Full dataset citations, original authors, and benchmark links are documented in [`ATTRIBUTION.md`](ATTRIBUTION.md).

---

<div align="center">
  <sub>Engineered with care for developers worldwide. Built on modern open-source web standards.</sub>
</div>
