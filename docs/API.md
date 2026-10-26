# Coding Duel: API Specification

This document defines the REST endpoints and Socket.IO real-time protocol for the Coding Duel backend.

---

## 1. REST Endpoints

### `POST /api/guest`
Registers a guest player and issues an authentication token.
- **Request Body:**
  ```json
  {
    "nickname": "SpeedCoder"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "playerId": "guest_9a8f1b2c",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "nickname": "SpeedCoder"
  }
  ```

---

### `GET /api/languages`
Returns the list of supported programming languages and their metadata.
- **Response `200 OK`:**
  ```json
  {
    "languages": [
      {
        "id": "python",
        "displayName": "Python 3",
        "editorMode": "python",
        "version": "3.10"
      },
      {
        "id": "cpp",
        "displayName": "C++ (GCC)",
        "editorMode": "cpp",
        "version": "C++17"
      }
    ]
  }
  ```

---

### `GET /api/health`
Health check endpoint reporting server health, database connectivity, and Judge0 availability.
- **Response `200 OK`:**
  ```json
  {
    "status": "healthy",
    "runner": {
      "type": "judge0",
      "reachable": true
    },
    "timestamp": 1773789000000
  }
  ```

---

## 2. Socket.IO Protocol

The backend supports both the **Frontend-Native Events** (used directly by `Challenge.tsx`) and **Normalized Duel Events** (supporting matchmaking queue, guest tokens, and timer sync).

### A. Connection & Handshake
- **Handshake Options:**
  - Token auth: `auth: { token: "..." }` (optional for guests).
  - Credentials: `withCredentials: true`.

---

### B. Client-to-Server Events

#### 1. `join_challenge` (Native Room Creation / Join)
```json
{
  "challengeId": "X7K9P2",
  "userDetails": {
    "name": "Naitik"
  }
}
```

#### 2. `start_challenge` (Native Match Start)
```json
{
  "challengeId": "X7K9P2"
}
```

#### 3. `code_submitted` (Native Run & Submit)
```json
{
  "challengeId": "X7K9P2",
  "code": "int solve(int n) { return n * 2; }",
  "language": "cpp",
  "isSubmit": true
}
```

#### 4. `skip_question`
```json
{
  "challengeId": "X7K9P2"
}
```

#### 5. `surrender` / `leave_challenge`
```json
{
  "challengeId": "X7K9P2"
}
```

#### 6. `typing`
```json
{
  "challengeId": "X7K9P2"
}
```

#### 7. `queue:join` & `queue:leave` (Quick Match Queue)
```json
{
  "language": "python"
}
```

---

### C. Server-to-Client Events

#### 1. `challenge_state`
Synchronizes the full match state across players.
```json
{
  "challengeId": "X7K9P2",
  "status": "started",
  "serverTime": 1773789020000,
  "players": [
    {
      "socketId": "sock_123",
      "userDetails": { "name": "Player 1" },
      "score": 2,
      "currentIndex": 2
    },
    {
      "socketId": "sock_456",
      "userDetails": { "name": "Player 2" },
      "score": 1,
      "currentIndex": 1
    }
  ],
  "questions": [
    {
      "id": "q_1",
      "title": "Reverse Words In String",
      "description": "Write a function that reverses words in a given string.",
      "difficulty": "EASY",
      "category": "Strings",
      "languages": {
        "python": {
          "starterCode": "def reverse_words(s: str) -> str:\n    pass\n",
          "sampleTests": "assert reverse_words('hello world') == 'world hello'"
        },
        "cpp": {
          "starterCode": "#include <string>\n\nstd::string reverse_words(std::string s) {\n    // your code here\n}\n",
          "sampleTests": "assert(reverse_words(\"hello world\") == \"world hello\");"
        }
      }
    }
  ]
}
```
> **Security Note:** Neither the test harness, private test cases, nor the reference solutions are ever included in `challenge_state` during the match.

#### 2. `challenge_ready`
Notifies the host that an opponent has joined and the match can be started.

#### 3. `challenge_started`
Emitted when countdown finishes and problems are active. Contains `serverTime` for synchronization.

#### 4. `code_result`
Evaluation result sent exclusively to the submitting player.
```json
{
  "success": true,
  "message": "Correct! All test cases passed.",
  "isSubmit": true,
  "executionTimeMs": 240
}
```
Or for failures:
```json
{
  "success": false,
  "message": "Some tests failed",
  "isSubmit": true
}
```

#### 5. `opponent_typing` & `opponent_running`
Activity broadcasts with no sensitive payload.

#### 6. `challenge_end`
Emitted when a winner is determined, the time cap expires, or a player forfeits.
```json
{
  "winner": {
    "socketId": "sock_123",
    "userDetails": { "name": "Player 1" },
    "score": 8
  },
  "reason": "completed",
  "scores": {
    "sock_123": 8,
    "sock_456": 5
  },
  "totalSolveTimes": {
    "sock_123": 412000,
    "sock_456": 680000
  }
}
```
