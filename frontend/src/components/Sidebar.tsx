import React, { useState } from "react";
import {
  ChevronDown,
  Users,
  Trophy,
  Copy,
  Check,
  Code2,
  Clock,
  Target,
  Swords,
  Play,
  Sparkles,
} from "lucide-react";
import QuizType from "./QuizType";
import Sessions from "./Sessions";
import Coders from "./Coders";
import SegmentedControl from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";

interface QuizConfig {
  category: string;
  limit: string;
  difficulty: string;
}

export interface ChallengeConfig {
  gameMode: "dsa_sprint" | "webdev_arena" | "fullstack_blitz";
  language: string;
  roomCode?: string;
  action?: "create" | "join" | "quick";
  questionCount?: number;
}

interface SidebarProps {
  mode: string;
  setMode: (mode: string) => void;
  setSelectedSessionId: (id: string | null) => void;
  quizConfig: QuizConfig;
  setQuizConfig: React.Dispatch<React.SetStateAction<QuizConfig>> | ((config: QuizConfig) => void);
  challengeConfig?: ChallengeConfig;
  setChallengeConfig?: (config: ChallengeConfig) => void;
  onLaunchChallenge?: (config: ChallengeConfig) => void;
  activeRoomCode?: string;
  opponentName?: string;
  arenaTab?: "practice" | "challenge" | "both";
  setArenaTab?: (tab: "practice" | "challenge" | "both") => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  mode,
  setMode,
  setSelectedSessionId,
  quizConfig,
  setQuizConfig,
  onLaunchChallenge,
  activeRoomCode,
  opponentName,
  arenaTab = "practice",
  setArenaTab,
}) => {
  const [activeTab, setActiveTab] = useState<string>("+ Code");
  const [currentView, setCurrentView] = useState<string>("main");
  const [isQuizConfigExpanded, setIsQuizConfigExpanded] = useState<boolean>(false);

  // 1v1 Challenge Config State
  const [selectedGameMode, setSelectedGameMode] = useState<"dsa_sprint" | "webdev_arena" | "fullstack_blitz">("webdev_arena");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("javascript");
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(5);
  const [joinCodeInput, setJoinCodeInput] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const isSessionActive = mode !== "main";

  const handleStartPractice = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("skillsphere_practice_state");
    }
    setMode("practice");
  };

  const handleLaunchChallenge = () => {
    if (selectedGameMode === "fullstack_blitz") {
      alert("FullStack Blitz is currently under development. Please choose an active mode.");
      return;
    }
    const createdCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    if (onLaunchChallenge) {
      onLaunchChallenge({
        gameMode: selectedGameMode,
        language: selectedGameMode === "webdev_arena" ? "javascript" : "python",
        questionCount: selectedQuestionCount,
        roomCode: createdCode,
        action: "create",
      });
    } else {
      setMode("challenge");
    }
  };

  const handleJoinChallenge = () => {
    if (!joinCodeInput.trim()) {
      alert("Please enter a valid 6-character room code.");
      return;
    }
    if (onLaunchChallenge) {
      onLaunchChallenge({
        gameMode: selectedGameMode,
        language: selectedGameMode === "webdev_arena" ? "javascript" : selectedLanguage,
        roomCode: joinCodeInput.trim().toUpperCase(),
        action: "join",
      });
    } else {
      setMode("challenge");
    }
  };

  const handleCopyCode = () => {
    if (activeRoomCode) {
      navigator.clipboard.writeText(activeRoomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="w-[350px] shrink-0 h-full bg-card border-l border-border flex flex-col font-sans text-card-foreground box-border transition-colors duration-200 select-none">
      {/* Top Navigation Tabs: Segmented Control Bar */}
      <div className="p-2.5 border-b border-border bg-card shrink-0">
        <div className="grid grid-cols-3 p-1 rounded-xl bg-secondary border border-border gap-1">
          {[
            { id: "+ Code", label: "Code", icon: Code2 },
            { id: "Sessions", label: "Sessions", icon: Clock },
            { id: "Coders", label: "Coders", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-foreground font-semibold hover:bg-card/50"
                )}
                onClick={() => {
                  if (isSessionActive) {
                    alert("Please complete or quit the active session before switching tabs.");
                    return;
                  }
                  setActiveTab(tab.id);
                  setCurrentView("main");
                }}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "text-foreground")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content flex-1 overflow-y-auto">
        {activeTab === "Sessions" && <Sessions setSelectedSessionId={setSelectedSessionId} setMode={setMode} />}
        {activeTab === "Coders" && <Coders />}

        {activeTab === "+ Code" && (
          <div className="flex flex-col h-full justify-between">
            <div className="main-code-view p-3 flex flex-col gap-3">
              {isSessionActive ? (
                /* Active Session Status & Quit Button */
                <div className="space-y-2.5 pt-1">
                  <div className="p-3.5 rounded-xl bg-secondary border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-foreground">
                        Active Session
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/25 animate-pulse">
                        LIVE
                      </span>
                    </div>

                    <div className="text-xs font-bold text-foreground">
                      {mode === "challenge"
                        ? (selectedGameMode === "webdev_arena" ? "1v1 Duel: Web Dev Arena" : "1v1 Duel: DSA Sprint")
                        : `Practice Quiz: ${quizConfig.category}`}
                    </div>

                    {mode === "challenge" && activeRoomCode && (
                      <div className="flex items-center justify-between pt-1 border-t border-border/60">
                        <span className="text-xs text-foreground font-mono">
                          Room: <strong className="text-primary font-bold">{activeRoomCode}</strong>
                        </span>
                        <button
                          onClick={handleCopyCode}
                          className="p-1 px-2.5 rounded bg-card hover:bg-card/80 text-[11px] font-mono font-bold text-foreground border border-border flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          {copiedCode ? "Copied" : "Copy"}
                        </button>
                      </div>
                    )}

                    {mode === "challenge" && opponentName && (
                      <div className="text-xs text-foreground font-medium pt-1">
                        Rival: <span className="text-rose-600 dark:text-rose-400 font-bold">{opponentName}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to quit the active session? Your progress will not be saved.")) {
                        setMode("main");
                      }
                    }}
                    className="w-full h-10 rounded-lg text-xs font-bold tracking-[1px] cursor-pointer border-none transition-transform duration-100 ease-in active:scale-[0.98] bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 uppercase"
                  >
                    QUIT SESSION
                  </button>
                </div>
              ) : (
                <>
                  {/* Arena Mode Switcher: Practice vs 1v1 Duel */}
                  <div className="grid grid-cols-2 p-1 rounded-xl bg-secondary border border-border gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (setArenaTab) setArenaTab("practice");
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        arenaTab === "practice" || arenaTab === "both"
                          ? "bg-card text-foreground shadow-xs border border-border"
                          : "text-foreground font-semibold hover:bg-card/50"
                      )}
                    >
                      <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Practice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (setArenaTab) setArenaTab("challenge");
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        arenaTab === "challenge"
                          ? "bg-card text-foreground shadow-xs border border-border"
                          : "text-foreground font-semibold hover:bg-card/50"
                      )}
                    >
                      <Swords className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>1v1 Duel</span>
                    </button>
                  </div>

                  {/* Section A: Practice Controls (when Practice or Both is active) */}
                  {(arenaTab === "practice" || arenaTab === "both") && (
                    <div className="space-y-2.5">
                      {/* Quiz Config Header Dropdown */}
                      <div
                        className="flex justify-between items-center h-10 rounded-lg px-3.5 text-xs font-bold tracking-[0.5px] border border-border bg-secondary text-foreground cursor-pointer hover:bg-secondary/80 transition-all duration-200"
                        onClick={() => setIsQuizConfigExpanded(!isQuizConfigExpanded)}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span>{quizConfig.category}</span>
                          <span className="text-foreground/40">•</span>
                          <span>{quizConfig.limit} Qs</span>
                          <span className="text-foreground/40">•</span>
                          <span className="text-primary uppercase font-mono">{quizConfig.difficulty}</span>
                        </div>
                        <div
                          className={`transition-transform duration-200 text-foreground font-bold text-xs ${
                            isQuizConfigExpanded ? "rotate-180" : ""
                          }`}
                        >
                          ▼
                        </div>
                      </div>

                      {/* Expandable Quiz Configuration Options */}
                      <div
                        className={`grid transition-all duration-200 ease-out overflow-hidden ${
                          isQuizConfigExpanded
                            ? "[grid-template-rows:1fr] opacity-100 visible"
                            : "[grid-template-rows:0fr] opacity-0 invisible"
                        }`}
                      >
                        <div className="min-h-0 pb-1">
                          <QuizType quizConfig={quizConfig} setQuizConfig={setQuizConfig} disabled={isSessionActive} />
                        </div>
                      </div>

                      {/* Primary Button: START PRACTICE */}
                      <button
                        onClick={handleStartPractice}
                        className="w-full h-10 rounded-lg text-xs font-bold tracking-[1px] cursor-pointer border-none transition-all duration-100 ease-in active:scale-[0.98] bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 uppercase flex items-center justify-center gap-2"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>START PRACTICE</span>
                      </button>
                    </div>
                  )}

                  {/* Section B: 1v1 Challenge Controls (when Challenge is active) */}
                  {arenaTab === "challenge" && (
                    <div className="space-y-3 p-3 rounded-xl border border-border bg-card">
                      {/* Select Track */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                          SELECT TRACK
                        </label>
                        <SegmentedControl
                          label="Track"
                          options={[
                            { value: "webdev_arena", label: "Web Dev" },
                            { value: "dsa_sprint", label: "DSA" },
                          ]}
                          value={selectedGameMode}
                          onValueChange={(val) => {
                            const mode = val as any;
                            setSelectedGameMode(mode);
                            if (mode === "webdev_arena") setSelectedLanguage("javascript");
                            else if (mode === "dsa_sprint") setSelectedLanguage("python");
                          }}
                        />
                      </div>

                      {/* Number of Questions */}
                      <div className="space-y-1">
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
                          value={String(selectedQuestionCount)}
                          onValueChange={(val) => setSelectedQuestionCount(parseInt(val))}
                        />
                      </div>

                      {/* Action Buttons: Host or Join */}
                      <div className="space-y-2 pt-1">
                        <button
                          onClick={handleLaunchChallenge}
                          className="w-full h-10 rounded-lg text-xs font-bold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer uppercase flex items-center justify-center gap-1.5"
                        >
                          <Swords className="w-3.5 h-3.5" />
                          <span>CREATE 1V1 ROOM</span>
                        </button>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="ROOM CODE"
                            value={joinCodeInput}
                            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                            className="flex-1 h-10 bg-secondary text-foreground font-mono font-bold border border-border rounded-lg px-2.5 text-xs uppercase tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-foreground/40"
                          />
                          <button
                            onClick={handleJoinChallenge}
                            className="h-10 px-3.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-secondary hover:bg-secondary/80 text-foreground border border-border cursor-pointer transition-colors"
                          >
                            JOIN
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Universal Options: CODE A FRIEND & TOURNAMENTS */}
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => {
                        if (setArenaTab) setArenaTab("challenge");
                        setSelectedGameMode("webdev_arena");
                      }}
                      className="w-full h-10 rounded-lg text-xs font-bold tracking-[1px] cursor-pointer transition-all duration-100 ease-in active:scale-[0.98] bg-secondary text-foreground border border-border hover:bg-secondary/80 flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4 text-foreground" />
                      <span>CODE A FRIEND</span>
                    </button>

                    <button
                      onClick={() => alert("Tournaments schedule coming soon in the next release.")}
                      className="w-full h-10 rounded-lg text-xs font-bold tracking-[1px] cursor-pointer transition-all duration-100 ease-in active:scale-[0.98] bg-transparent border border-border text-foreground hover:border-foreground hover:bg-secondary/40 flex items-center justify-center gap-2"
                    >
                      <Trophy className="w-4 h-4 text-foreground" />
                      <span>TOURNAMENTS</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
