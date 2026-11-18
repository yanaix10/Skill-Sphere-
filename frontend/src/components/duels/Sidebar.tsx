import React, { useState } from "react";
import { ChevronDown, Users, Trophy, Copy, Check } from "lucide-react";
import QuizType from "./QuizType";
import Sessions from "./Sessions";
import Coders from "./Coders";
import SegmentedControl from "@/components/ui/segmented-control";

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
}

const Sidebar: React.FC<SidebarProps> = ({
  mode,
  setMode,
  setSelectedSessionId,
  quizConfig,
  setQuizConfig,
  onLaunchChallenge,
  activeRoomCode,
  opponentName
}) => {
  const [activeTab, setActiveTab] = useState<string>("+ Code");
  const [currentView, setCurrentView] = useState<string>("main");
  const [isQuizConfigExpanded, setIsQuizConfigExpanded] = useState<boolean>(false);
  const [isChallengeDropdownOpen, setIsChallengeDropdownOpen] = useState<boolean>(false);

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
        action: "create"
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
        action: "join"
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
      {/* Top Navigation Tabs */}
      <div className="flex border-b border-border bg-card shrink-0">
        {["+ Code", "Sessions", "Coders"].map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2.5 bg-transparent border-none border-b-2 text-xs sm:text-sm font-semibold cursor-pointer transition-all duration-200 ${activeTab === tab
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/50"
              }`}
            onClick={() => {
              if (isSessionActive) {
                alert("Please complete or quit the active session before switching tabs.");
                return;
              }
              setActiveTab(tab);
              setCurrentView("main");
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content flex-1 overflow-y-auto">
        {activeTab === "Sessions" && <Sessions setSelectedSessionId={setSelectedSessionId} setMode={setMode} />}
        {activeTab === "Coders" && <Coders />}

        {activeTab === "+ Code" && (
          <div className="flex flex-col h-full justify-between">
            <div className="main-code-view p-3 flex flex-col gap-2">
              {/* Quiz Config Header Dropdown */}
              <div
                className={`flex justify-between items-center h-10 rounded-lg px-3.5 text-xs font-bold tracking-[0.5px] border border-border transition-all duration-200 ${isSessionActive
                    ? "bg-secondary/50 opacity-65 cursor-not-allowed text-muted-foreground"
                    : "bg-secondary text-foreground cursor-pointer hover:bg-secondary/80"
                  }`}
                onClick={() => {
                  if (isSessionActive) return;
                  setIsQuizConfigExpanded(!isQuizConfigExpanded);
                }}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <span>{quizConfig.category}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{quizConfig.limit} Qs</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-primary uppercase font-mono">{quizConfig.difficulty}</span>
                  {isSessionActive && <span className="text-[10px] text-muted-foreground italic ml-1">(Locked)</span>}
                </div>
                {!isSessionActive && (
                  <div
                    className={`transition-transform duration-200 text-muted-foreground text-xs ${isQuizConfigExpanded ? "rotate-180" : ""
                      }`}
                  >
                    ▼
                  </div>
                )}
              </div>

              {/* Expandable Quiz Configuration Options */}
              <div
                className={`grid transition-all duration-200 ease-out overflow-hidden ${isQuizConfigExpanded && !isSessionActive
                    ? "[grid-template-rows:1fr] opacity-100 visible"
                    : "[grid-template-rows:0fr] opacity-0 invisible"
                  }`}
              >
                <div className="min-h-0 pb-1">
                  <QuizType quizConfig={quizConfig} setQuizConfig={setQuizConfig} disabled={isSessionActive} />
                </div>
              </div>

              {/* Action Buttons: Positioned directly below the dropdown with gap-2 */}
              {isSessionActive ? (
                /* Active Session Status & Quit Button */
                <div className="space-y-2 pt-1">
                  <div className="p-3 rounded-lg bg-secondary border border-border space-y-1.5">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                      Active Session
                    </div>
                    <div className="text-xs font-bold text-foreground">
                      {mode === "challenge"
                        ? (selectedGameMode === "webdev_arena" ? "1v1 Duel: Web Dev Arena" : "1v1 Duel: DSA Sprint")
                        : `Practice Quiz: ${quizConfig.category}`}
                    </div>

                    {mode === "challenge" && activeRoomCode && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-muted-foreground font-mono">
                          Room: <span className="text-foreground font-bold">{activeRoomCode}</span>
                        </span>
                        <button
                          onClick={handleCopyCode}
                          className="p-1 px-2 rounded bg-card hover:bg-card/80 text-[11px] font-mono text-primary border border-border flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          {copiedCode ? "Copied" : "Copy"}
                        </button>
                      </div>
                    )}

                    {mode === "challenge" && opponentName && (
                      <div className="text-xs text-muted-foreground">
                        Rival: <span className="text-primary font-semibold">{opponentName}</span>
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
                  {/* Primary Button: START PRACTICE */}
                  <button
                    onClick={handleStartPractice}
                    className="w-full h-10 rounded-lg text-xs font-bold tracking-[1px] cursor-pointer border-none transition-all duration-100 ease-in active:scale-[0.98] bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 uppercase"
                  >
                    START PRACTICE
                  </button>

                  {/* 1V1 CHALLENGE */}
                  <div className="rounded-lg border border-border bg-card overflow-hidden transition-all duration-200">
                    <button
                      onClick={() => setIsChallengeDropdownOpen(!isChallengeDropdownOpen)}
                      className="w-full h-10 px-3.5 flex items-center justify-between text-xs font-bold tracking-[1px] cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      <span>1V1 CHALLENGE</span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                          isChallengeDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isChallengeDropdownOpen && (
                      <div className="p-3 border-t border-border bg-card space-y-3">
                        {/* Arena Game Mode */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans block">
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
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans block">
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
                        <div className="space-y-2 pt-0.5">
                          <button
                            onClick={handleLaunchChallenge}
                            className="w-full h-10 rounded-lg text-xs font-bold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer uppercase font-sans"
                          >
                            CREATE 1V1 ROOM
                          </button>

                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="ROOM CODE"
                              value={joinCodeInput}
                              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                              className="flex-1 h-10 bg-secondary text-foreground border border-border rounded-lg px-2.5 text-xs font-mono uppercase tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                            />
                            <button
                              onClick={handleJoinChallenge}
                              className="h-10 px-3.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-secondary hover:bg-secondary/80 text-foreground border border-border cursor-pointer transition-colors font-sans"
                            >
                              JOIN
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rest of the sidebar: CODE A FRIEND & TOURNAMENTS */}
                  <button
                    onClick={() => setIsChallengeDropdownOpen(true)}
                    className="w-full h-10 rounded-lg text-xs font-bold tracking-[1px] cursor-pointer transition-all duration-100 ease-in active:scale-[0.98] bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>CODE A FRIEND</span>
                  </button>

                  <button
                    onClick={() => alert("Tournaments schedule coming soon in the next release.")}
                    className="w-full h-10 rounded-lg text-xs font-bold tracking-[1px] cursor-pointer transition-all duration-100 ease-in active:scale-[0.98] bg-transparent border border-border text-muted-foreground hover:border-foreground hover:text-foreground hover:bg-secondary/30 flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                    <span>TOURNAMENTS</span>
                  </button>
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
