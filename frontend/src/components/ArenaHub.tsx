import React, { useState } from "react";
import { Target, Swords, Play, Sparkles, ArrowRight, ShieldCheck, Flame } from "lucide-react";
import SegmentedControl from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import { ChallengeConfig } from "./Sidebar";
import { cn } from "@/lib/utils";

interface QuizConfig {
  category: string;
  limit: string;
  difficulty: string;
}

interface ArenaHubProps {
  arenaTab: "practice" | "challenge" | "both";
  setArenaTab: (tab: "practice" | "challenge" | "both") => void;
  quizConfig: QuizConfig;
  setQuizConfig: (config: QuizConfig) => void;
  onStartPractice: () => void;
  onLaunchChallenge: (config: ChallengeConfig) => void;
}

const DIFFICULTY_OPTIONS = [
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
];

const QUESTION_COUNT_OPTIONS = [
  { value: "5", label: "5" },
  { value: "10", label: "10" },
  { value: "20", label: "20" },
];

const CATEGORY_ROW_1 = [
  { value: "Web Dev", label: "Web Dev" },
  { value: "Linux", label: "Linux" },
  { value: "DevOps", label: "DevOps" },
];

const CATEGORY_ROW_2 = [
  { value: "Code", label: "Code" },
  { value: "SQL", label: "SQL" },
  { value: "Cloud", label: "Cloud" },
];

const ArenaHub: React.FC<ArenaHubProps> = ({
  arenaTab,
  setArenaTab,
  quizConfig,
  setQuizConfig,
  onStartPractice,
  onLaunchChallenge,
}) => {
  // 1v1 Challenge internal config state for Hub card
  const [duelGameMode, setDuelGameMode] = useState<"webdev_arena" | "dsa_sprint">("webdev_arena");
  const [duelQuestionCount, setDuelQuestionCount] = useState<number>(5);
  const [roomCodeInput, setRoomCodeInput] = useState<string>("");

  const updateQuizConfig = (key: keyof QuizConfig, value: string) => {
    setQuizConfig({ ...quizConfig, [key]: value });
  };

  const handleCreateRoom = () => {
    const createdCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    onLaunchChallenge({
      gameMode: duelGameMode,
      language: duelGameMode === "webdev_arena" ? "javascript" : "python",
      questionCount: duelQuestionCount,
      roomCode: createdCode,
      action: "create",
    });
  };

  const handleJoinRoom = () => {
    if (!roomCodeInput.trim()) {
      alert("Please enter a valid 6-character room code.");
      return;
    }
    onLaunchChallenge({
      gameMode: duelGameMode,
      language: duelGameMode === "webdev_arena" ? "javascript" : "python",
      roomCode: roomCodeInput.trim().toUpperCase(),
      action: "join",
    });
  };

  const showPractice = arenaTab === "practice" || arenaTab === "both";
  const showChallenge = arenaTab === "challenge" || arenaTab === "both";

  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-center bg-background text-foreground select-none font-sans">
      <div className="w-full max-w-4xl space-y-6 my-auto">
        {/* Arena Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold font-mono tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SKILLSPHERE ARENA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
            Choose Your Arena Format
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-foreground/80 max-w-md mx-auto leading-relaxed">
            Sharpen knowledge with timed solo practice drills or challenge a rival coder to a real-time 1v1 duel.
          </p>

          {/* Arena Mode Switcher */}
          <div className="pt-2 max-w-md mx-auto">
            <div className="grid grid-cols-3 p-1 rounded-xl bg-secondary border border-border gap-1">
              <button
                type="button"
                onClick={() => setArenaTab("practice")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  arenaTab === "practice"
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-foreground font-semibold hover:bg-card/50"
                )}
              >
                <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Solo Practice</span>
              </button>
              <button
                type="button"
                onClick={() => setArenaTab("challenge")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  arenaTab === "challenge"
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-foreground font-semibold hover:bg-card/50"
                )}
              >
                <Swords className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>1v1 Duel</span>
              </button>
              <button
                type="button"
                onClick={() => setArenaTab("both")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  arenaTab === "both"
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-foreground font-semibold hover:bg-card/50"
                )}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>View Both</span>
              </button>
            </div>
          </div>
        </div>

        {/* Arenas Cards Grid */}
        <div
          className={cn(
            "w-full gap-6 items-start",
            arenaTab === "both"
              ? "grid grid-cols-1 lg:grid-cols-2"
              : "flex justify-center max-w-lg mx-auto"
          )}
        >
          {/* Card 1: Solo Practice */}
          {showPractice && (
            <div className="w-full bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden transition-all">
              <BorderBeam size={160} duration={8} />

              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-foreground tracking-tight">Solo Practice</h2>
                    <p className="text-xs text-foreground/75 font-semibold">Self-paced technical quiz drill</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                  SOLO
                </span>
              </div>

              {/* Practice Configuration */}
              <div className="space-y-3">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                    CATEGORY
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <SegmentedControl
                      label="Category Row 1"
                      options={CATEGORY_ROW_1}
                      value={quizConfig.category}
                      onValueChange={(val) => updateQuizConfig("category", val)}
                    />
                    <SegmentedControl
                      label="Category Row 2"
                      options={CATEGORY_ROW_2}
                      value={quizConfig.category}
                      onValueChange={(val) => updateQuizConfig("category", val)}
                    />
                  </div>
                </div>

                {/* Difficulty Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                    DIFFICULTY
                  </label>
                  <SegmentedControl
                    label="Difficulty"
                    options={DIFFICULTY_OPTIONS}
                    value={quizConfig.difficulty}
                    onValueChange={(val) => updateQuizConfig("difficulty", val)}
                  />
                </div>

                {/* Question Count Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                    QUESTION COUNT
                  </label>
                  <SegmentedControl
                    label="Question Count"
                    options={QUESTION_COUNT_OPTIONS}
                    value={String(quizConfig.limit)}
                    onValueChange={(val) => updateQuizConfig("limit", val)}
                  />
                </div>
              </div>

              {/* Action Button: Start Practice */}
              <Button
                onClick={onStartPractice}
                className="w-full h-11 font-sans font-bold text-xs tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-all uppercase cursor-pointer flex items-center justify-center gap-2 shadow-xs mt-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>START PRACTICE QUIZ</span>
              </Button>
            </div>
          )}

          {/* Card 2: 1v1 Battle Duel */}
          {showChallenge && (
            <div className="w-full bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden transition-all">
              <BorderBeam size={160} duration={8} />

              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-foreground tracking-tight">1v1 Coding Duel</h2>
                    <p className="text-xs text-foreground/75 font-semibold">Real-time live coding faceoff</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25">
                  VERSUS
                </span>
              </div>

              {/* 1v1 Duel Configuration */}
              <div className="space-y-3">
                {/* Track Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                    SELECT TRACK
                  </label>
                  <SegmentedControl
                    label="Track"
                    options={[
                      { value: "webdev_arena", label: "Web Dev" },
                      { value: "dsa_sprint", label: "DSA" },
                    ]}
                    value={duelGameMode}
                    onValueChange={(val) => setDuelGameMode(val as any)}
                  />
                </div>

                {/* Number of Questions */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                    NUMBER OF QUESTIONS
                  </label>
                  <SegmentedControl
                    label="Number of Questions"
                    options={[
                      { value: "3", label: "3" },
                      { value: "5", label: "5" },
                      { value: "8", label: "8" },
                    ]}
                    value={String(duelQuestionCount)}
                    onValueChange={(val) => setDuelQuestionCount(parseInt(val))}
                  />
                </div>
              </div>

              {/* Action Buttons: Create Room & Join */}
              <div className="space-y-2.5 pt-1">
                <Button
                  onClick={handleCreateRoom}
                  className="w-full h-11 font-sans font-bold text-xs tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-all uppercase cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>CREATE 1V1 ROOM</span>
                </Button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink mx-2 text-[10px] font-bold text-foreground/70 uppercase tracking-widest font-mono">
                    OR ENTER CODE
                  </span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="ROOM CODE"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 h-10 bg-secondary text-foreground font-mono font-bold border border-border rounded-lg px-3 text-xs uppercase tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-foreground/40"
                  />
                  <Button
                    onClick={handleJoinRoom}
                    variant="outline"
                    className="h-10 px-4 font-bold text-xs uppercase tracking-wider text-foreground border-border hover:bg-secondary cursor-pointer"
                  >
                    JOIN
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArenaHub;
