import React, { useState, useEffect } from "react";
import Sidebar, { ChallengeConfig } from "../components/Sidebar";
import SessionDetails from "../components/SessionDetails";
import Practice from "./Practice";
import QuestArena from "../components/QuestArena";
import Challenge from "../components/Challenge";

interface QuizConfig {
  difficulty: string;
  limit: string;
  category: string;
}

const STORAGE_MODE_KEY = "skillsphere_quiz_mode";
const STORAGE_ROOM_KEY = "skillsphere_active_room";
const STORAGE_CHALLENGE_KEY = "skillsphere_challenge_config";

export default function Quizzes(): React.ReactElement {
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
    category: "Web Dev"
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
          roomCode: savedRoom
        };
      }
    }
    return {
      gameMode: "webdev_arena",
      language: "javascript",
      questionCount: 5
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
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_CHALLENGE_KEY, JSON.stringify(config));
      if (config.roomCode) {
        sessionStorage.setItem(STORAGE_ROOM_KEY, config.roomCode);
        setActiveRoomCode(config.roomCode);
      }
    }
  };

  const handleRoomCreated = (code: string) => {
    setActiveRoomCode(code);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_ROOM_KEY, code);
    }
  };

  return (
    <div className="w-full h-full bg-background text-foreground flex flex-row overflow-hidden p-0 transition-colors duration-200">
      {/* Main Center Area: Sandboxing & Arena or Practice Quiz */}
      <div className="flex-1 h-full min-w-0 overflow-hidden relative">
        {mode === "practice" && <Practice setMode={setMode} quizConfig={quizConfig} />}
        {mode === "quest" && <QuestArena />}
        {mode === "session" && selectedSessionId && (
          <SessionDetails sessionId={selectedSessionId} setMode={setMode} />
        )}

        {/* Sandboxing & 1v1 Battle Arena (Active in both main and challenge modes) */}
        {(mode === "main" || mode === "challenge") && (
          <Challenge
            setMode={setMode}
            isDuelActive={mode === "challenge"}
            challengeConfig={challengeConfig}
            onRoomCreated={handleRoomCreated}
            onOpponentChange={(name) => setOpponentName(name)}
          />
        )}
      </div>

      {/* Right Sidebar: Unified Quiz & 1v1 Challenge Controls */}
      <Sidebar
        mode={mode}
        setMode={setMode}
        setSelectedSessionId={setSelectedSessionId}
        quizConfig={quizConfig}
        setQuizConfig={setQuizConfig}
        onLaunchChallenge={handleLaunchChallenge}
        activeRoomCode={activeRoomCode}
        opponentName={opponentName}
      />
    </div>
  );
}
