import React, { useState, useEffect } from "react";
import {
  QuizDashboardView,
  SessionDetails,
  QuestArena,
  Challenge,
  Sessions,
  Coders,
  ChallengeConfig,
} from "../components/duels";
import Practice from "./Practice";

interface QuizConfig {
  difficulty: string;
  limit: string;
  category: string;
}

const STORAGE_MODE_KEY = "skillsphere_quiz_mode";
const STORAGE_ROOM_KEY = "skillsphere_active_room";
const STORAGE_CHALLENGE_KEY = "skillsphere_challenge_config";

export default function Quizzes(): React.ReactElement {
  const [activeTopTab, setActiveTopTab] = useState<string>("+ Code");

  // Restore initial state from sessionStorage to survive page refreshes & tab reopening
  const [mode, setModeInternal] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedRoom = sessionStorage.getItem(STORAGE_ROOM_KEY);
      if (savedRoom) return "challenge";

      const savedPractice = sessionStorage.getItem("skillsphere_practice_state");
      if (savedPractice) return "practice";

      const savedMode = sessionStorage.getItem(STORAGE_MODE_KEY);
      if (savedMode && ["main", "practice", "challenge", "quest", "session"].includes(savedMode)) {
        return savedMode;
      }
    }
    return "main";
  });

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [quizConfig, setQuizConfig] = useState<QuizConfig>({
    difficulty: "Medium",
    limit: "10",
    category: "Web Dev",
  });

  const [challengeConfig, setChallengeConfig] = useState<ChallengeConfig>(() => {
    if (typeof window !== "undefined") {
      const savedChallenge = sessionStorage.getItem(STORAGE_CHALLENGE_KEY);
      const savedRoom = sessionStorage.getItem(STORAGE_ROOM_KEY);
      if (savedChallenge) {
        try {
          const parsed = JSON.parse(savedChallenge);
          return { ...parsed, roomCode: savedRoom || parsed.roomCode };
        } catch (e) {}
      }
      if (savedRoom) {
        return {
          gameMode: "webdev_arena",
          language: "javascript",
          roomCode: savedRoom,
        };
      }
    }
    return {
      gameMode: "webdev_arena",
      language: "javascript",
      questionCount: 5,
    };
  });

  const [activeRoomCode, setActiveRoomCode] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(STORAGE_ROOM_KEY) || "";
    }
    return "";
  });

  const [opponentName, setOpponentName] = useState<string>("");

  const setMode = (newMode: string) => {
    setModeInternal(newMode);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_MODE_KEY, newMode);
      if (newMode === "main") {
        sessionStorage.removeItem(STORAGE_ROOM_KEY);
        sessionStorage.removeItem("skillsphere_active_room");
        sessionStorage.removeItem(STORAGE_CHALLENGE_KEY);
        sessionStorage.removeItem("skillsphere_practice_state");
        setActiveRoomCode("");
        setOpponentName("");
      }
    }
  };

  const handleLaunchChallenge = (config: ChallengeConfig) => {
    setChallengeConfig(config);
    setMode("challenge");
    setActiveTopTab("+ Code");
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_CHALLENGE_KEY, JSON.stringify(config));
      if (config.roomCode) {
        sessionStorage.setItem(STORAGE_ROOM_KEY, config.roomCode);
        setActiveRoomCode(config.roomCode);
      }
    }
  };

  const handleStartPractice = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("skillsphere_practice_state");
    }
    setMode("practice");
    setActiveTopTab("+ Code");
  };

  const handleRoomCreated = (code: string) => {
    setActiveRoomCode(code);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_ROOM_KEY, code);
    }
  };

  return (
    <div className="w-full h-full bg-background text-foreground flex flex-col overflow-hidden p-0 transition-colors duration-200">
      {/* ─── Top Header Bar (matches UI: + Code, Sessions, Coders aligned with right sidebar) ─── */}
      <header className="h-14 border-b border-border/80 bg-card/60 backdrop-blur-sm flex items-center shrink-0 select-none">
        {/* Left header area: spans the entire left column width */}
        <div className="flex-1 px-6 sm:px-10 lg:px-12 flex items-center justify-between h-full">
          <div className="flex items-center gap-2">
            {mode !== "main" && (
              <button
                type="button"
                onClick={() => setMode("main")}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 transition-colors cursor-pointer border-none"
              >
                ← Back to Practice Hub
              </button>
            )}
          </div>
        </div>

        {/* Top-Right Navigation Tabs: EXACT same width & border-l alignment as the right sidebar */}
        <div className="w-[340px] lg:w-[360px] shrink-0 border-l border-border/80 h-full px-6 sm:px-8 flex items-center justify-between text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => {
              setActiveTopTab("+ Code");
              if (mode === "session") setMode("main");
            }}
            className={`font-semibold cursor-pointer border-none bg-transparent transition-colors ${
              activeTopTab === "+ Code"
                ? "text-[#0d9488] font-bold"
                : "text-foreground hover:text-[#0d9488]"
            }`}
          >
            + Code
          </button>

          <button
            type="button"
            onClick={() => setActiveTopTab("Sessions")}
            className={`font-semibold cursor-pointer border-none bg-transparent transition-colors ${
              activeTopTab === "Sessions"
                ? "text-[#0d9488] font-bold"
                : "text-foreground hover:text-[#0d9488]"
            }`}
          >
            Sessions
          </button>

          <button
            type="button"
            onClick={() => setActiveTopTab("Coders")}
            className={`font-semibold cursor-pointer border-none bg-transparent transition-colors ${
              activeTopTab === "Coders"
                ? "text-[#0d9488] font-bold"
                : "text-foreground hover:text-[#0d9488]"
            }`}
          >
            Coders
          </button>
        </div>
      </header>

      {/* ─── Main Content View ─── */}
      <main className="flex-1 min-h-0 overflow-hidden relative">
        {activeTopTab === "Sessions" && (
          <div className="h-full w-full overflow-y-auto max-w-4xl mx-auto p-4 sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Duel & Quiz Sessions</h2>
              <button
                type="button"
                onClick={() => setActiveTopTab("+ Code")}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none"
              >
                Close Sessions
              </button>
            </div>
            <Sessions
              setSelectedSessionId={(id) => {
                setSelectedSessionId(id);
                setMode("session");
                setActiveTopTab("+ Code");
              }}
              setMode={setMode}
            />
          </div>
        )}

        {activeTopTab === "Coders" && (
          <div className="h-full w-full overflow-y-auto max-w-4xl mx-auto p-4 sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Coder Leaderboard & Rivals</h2>
              <button
                type="button"
                onClick={() => setActiveTopTab("+ Code")}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none"
              >
                Back to Practice
              </button>
            </div>
            <Coders />
          </div>
        )}

        {activeTopTab === "+ Code" && (
          <>
            {mode === "practice" && (
              <Practice setMode={setMode} quizConfig={quizConfig} />
            )}

            {mode === "quest" && <QuestArena />}

            {mode === "session" && selectedSessionId && (
              <SessionDetails sessionId={selectedSessionId} setMode={setMode} />
            )}

            {mode === "challenge" && (
              <Challenge
                setMode={setMode}
                isDuelActive={true}
                challengeConfig={challengeConfig}
                onRoomCreated={handleRoomCreated}
                onOpponentChange={(name) => setOpponentName(name)}
              />
            )}

            {mode === "main" && (
              <QuizDashboardView
                quizConfig={quizConfig}
                setQuizConfig={setQuizConfig}
                onStartPractice={handleStartPractice}
                onLaunchChallenge={handleLaunchChallenge}
                activeRoomCode={activeRoomCode}
                setActiveRoomCode={setActiveRoomCode}
                opponentName={opponentName}
                setOpponentName={setOpponentName}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
