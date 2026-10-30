import React, { useState } from "react";
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

export default function Quizzes(): React.ReactElement {
  const [mode, setMode] = useState<string>("main");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({
    difficulty: "Medium",
    limit: "10",
    category: "DevOps"
  });

  const [challengeConfig, setChallengeConfig] = useState<ChallengeConfig>({
    gameMode: "dsa_sprint",
    language: "python"
  });
  const [activeRoomCode, setActiveRoomCode] = useState<string>("");
  const [opponentName, setOpponentName] = useState<string>("");

  const handleLaunchChallenge = (config: ChallengeConfig) => {
    setChallengeConfig(config);
    setMode("challenge");
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
            onRoomCreated={(code) => setActiveRoomCode(code)}
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
