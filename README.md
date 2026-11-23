# SkillSphere

SkillSphere is a real-time developer workspace and skill-building platform featuring 1v1 coding duels and interactive technical assessments.
It unifies academic and developer workflows through Google Calendar, Google Classroom, and developer activity tracking.

Live Application: [https://xskillsphere.vercel.app](https://xskillsphere.vercel.app)

---

## Preview

![SkillSphere Dashboard](docs/screenshots/dashboard.png)

---

## Features

- Real-time 1v1 coding duels with synchronized timers and multi-language execution.
- Interactive practice quizzes across Web Development, Algorithms, and DevOps.
- Centralized developer dashboard with task tracking and GitHub activity metrics.
- Seamless Google Classroom and Google Calendar sync for coursework and meetings.
- Social networking with real-time peer messaging and profile customization.
- Dark, light, and system theme support with dynamic canvas backgrounds.

---

## System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (Frontend)"]
        UI["React 19 + TypeScript + Tailwind SPA"]
        Dashboard["Developer Dashboard & Activity"]
        DuelArena["1v1 Arena & Code Editor (Monaco)"]
        SocialFeed["Community Feed & Media Reviews"]
        Chat["Direct Messaging & Notifications"]
        AuthUI["Firebase Auth (Client SDK)"]
    end

    subgraph Backend ["Server & Gateway (Node.js + Express)"]
        APIServer["Express REST API (/api)"]
        SocketServer["Socket.IO Real-Time Gateway"]
        AuthMiddleware["Token Verification & Auth Middleware"]
        GoogleRouter["Google OAuth & Sync Services"]
        FeedService["Feed & Media Controller"]
        MatchManager["Match & Duel State Manager"]
    end

    subgraph Execution ["Code Execution Layer"]
        RunnerRouter{"Execution Engine"}
        MockRunner["Mock Runner (Local Dev)"]
        Judge0["Judge0 Sandbox (Docker / RapidAPI)"]
    end

    subgraph Storage ["Databases & Cloud Storage"]
        MongoDB[("MongoDB Atlas (Primary Data)")]
        Firestore[("Firebase Firestore (Chats & Presence)")]
        FirebaseStorage["Firebase Storage (Media & Assets)"]
    end

    subgraph External ["External Services & APIs"]
        GoogleAPI["Google Workspace (Classroom & Calendar)"]
        QuizAPI["QuizAPI.io (Technical MCQ Question Bank)"]
        TMDB["TMDB API (Movies & Posters)"]
        BooksAPI["OpenLibrary & Google Books"]
    end

    %% Client to Backend Connections
    UI -->|HTTPS REST| APIServer
    DuelArena -->|WebSocket WSS| SocketServer
    Chat -->|Firestore SDK| Firestore
    AuthUI -->|Auth & IdToken| AuthMiddleware

    %% Backend internal and execution flow
    APIServer --> AuthMiddleware
    SocketServer --> MatchManager
    MatchManager --> RunnerRouter
    RunnerRouter -->|Dev Mode| MockRunner
    RunnerRouter -->|Production| Judge0

    %% Backend to Data Layer
    APIServer --> MongoDB
    MatchManager --> MongoDB
    GoogleRouter --> MongoDB

    %% Backend to External APIs
    GoogleRouter -->|OAuth 2.0| GoogleAPI
    APIServer -->|API Key| QuizAPI
    FeedService -->|API Key| TMDB
    FeedService -->|REST| BooksAPI
```

---

## Feature Requests

The project is ready to accept any features. Feel free to open an issue to suggest improvements or new functionality.

---

## Thank You

Thank you for checking out SkillSphere.
