import React, { useState } from "react";
import { ChevronDown, Swords, Users, Trophy, Copy, Check } from "lucide-react";
import QuizType from "./QuizType";
import Sessions from "./Sessions";
import Coders from "./Coders";

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
  const [selectedGameMode, setSelectedGameMode] = useState<"dsa_sprint" | "webdev_arena" | "fullstack_blitz">("dsa_sprint");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("python");
  const [joinCodeInput, setJoinCodeInput] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const isSessionActive = mode !== "main";

  const handleStartPractice = () => {
    setMode("practice");
  };

  const handleLaunchChallenge = () => {
    if (selectedGameMode === "fullstack_blitz") {
      alert("FullStack Blitz is currently under development. Please choose an active mode.");
      return;
    }
    if (onLaunchChallenge) {
      onLaunchChallenge({
        gameMode: selectedGameMode,
        language: selectedGameMode === "webdev_arena" ? "javascript" : "python",
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
    <div className="w-[30vw] min-w-[320px] max-w-[420px] h-full bg-card border-l border-border flex flex-col font-sans text-card-foreground box-border transition-colors duration-200 select-none">
      {/* Top Navigation Tabs */}
      <div className="flex border-b border-border bg-card shrink-0">
        {["+ Code", "Sessions", "Coders"].map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-4 bg-transparent border-none border-b-2 text-sm font-semibold cursor-pointer transition-all duration-200 ${activeTab === tab
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
            <div className="main-code-view">
              {/* Quiz Config Header Dropdown */}
              <div
                className={`flex justify-between items-center h-[50px] mx-5 my-[15px] rounded-lg px-4 text-sm font-bold tracking-[0.5px] border border-border transition-all duration-300 ${isSessionActive
                    ? "bg-secondary/50 opacity-65 cursor-not-allowed text-muted-foreground"
                    : "bg-secondary text-foreground cursor-pointer hover:bg-secondary/80"
                  }`}
                onClick={() => {
                  if (isSessionActive) return;
                  setIsQuizConfigExpanded(!isQuizConfigExpanded);
                }}
              >
                <div className="flex items-center gap-2">
                  <span>{quizConfig.category}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{quizConfig.limit} Qs</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-primary uppercase font-mono">{quizConfig.difficulty}</span>
                  {isSessionActive && <span className="text-xs text-muted-foreground italic ml-2">(Locked)</span>}
                </div>
                {!isSessionActive && (
                  <div
                    className={`transition-transform duration-300 ease-in text-muted-foreground ${isQuizConfigExpanded ? "rotate-180" : ""
                      }`}
                  >
                    ▼
                  </div>
                )}
              </div>

              {/* Expandable Quiz Configuration Options */}
              <div
                className={`grid transition-all duration-300 ease-out overflow-hidden ${isQuizConfigExpanded && !isSessionActive
                    ? "[grid-template-rows:1fr] opacity-100 visible"
                    : "[grid-template-rows:0fr] opacity-0 invisible"
                  }`}
              >
                <div className="min-h-0 pb-[15px] px-5">
                  <QuizType quizConfig={quizConfig} setQuizConfig={setQuizConfig} disabled={isSessionActive} />
                </div>
              </div>

              {/* Action Buttons Container */}
              <div className="flex flex-col gap-3 p-5 mt-[5px]">
                {isSessionActive ? (
                  /* Active Session Status & Quit Button */
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-secondary border border-border space-y-2">
                      <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        Active Session
                      </div>
                      <div className="text-sm font-bold text-foreground">
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
                            className="p-1 px-2 rounded bg-card hover:bg-card/80 text-xs font-mono text-primary border border-border flex items-center gap-1 cursor-pointer"
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
                      className="w-full p-[14px] rounded-lg text-sm font-bold tracking-[1px] cursor-pointer border-none transition-transform duration-100 ease-in active:scale-[0.98] bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                    >
                      QUIT SESSION
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Primary Button: START PRACTICE (equivalent to Start Game in Chess.com) */}
                    <button
                      onClick={handleStartPractice}
                      className="w-full p-[14px] rounded-lg text-sm font-bold tracking-[1px] cursor-pointer border-none transition-all duration-100 ease-in active:scale-[0.98] bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    >
                      START PRACTICE
                    </button>

                    {/* 1V1 CHALLENGE: Dropdown / Expandable Options choosing between DSA Sprint, WebDev, FullStack */}
                    <div className="rounded-lg border border-border bg-card overflow-hidden transition-all duration-200">
                      <button
                        onClick={() => setIsChallengeDropdownOpen(!isChallengeDropdownOpen)}
                        className="w-full p-[14px] flex items-center justify-between text-sm font-bold tracking-[1px] cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Swords className="w-4 h-4 text-primary" />
                          <span>1V1 CHALLENGE</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isChallengeDropdownOpen ? "rotate-180" : ""
                            }`}
                        />
                      </button>

                      {isChallengeDropdownOpen && (
                        <div className="p-4 border-t border-border bg-card space-y-3.5">
                          {/* Dropdown for 1v1 challenge mode */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-muted-foreground uppercase font-mono">
                              Game Mode
                            </label>
                            <select
                              value={selectedGameMode}
                              onChange={(e) => setSelectedGameMode(e.target.value as any)}
                              className="w-full py-2 px-3 bg-secondary text-foreground border border-border rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                            >
                              <option value="dsa_sprint">DSA Sprint (Active)</option>
                              <option value="webdev_arena">Web Dev Arena (Active)</option>
                              <option value="fullstack_blitz">FullStack Blitz (Coming Soon)</option>
                            </select>
                          </div>

                          {/* Action Buttons: Host or Join */}
                          <div className="space-y-2 pt-1">
                            <button
                              onClick={handleLaunchChallenge}
                              className="w-full py-2.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-sm tracking-wider"
                            >
                              CREATE 1V1 ROOM
                            </button>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="ENTER ROOM CODE"
                                value={joinCodeInput}
                                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                                className="flex-1 bg-secondary text-foreground border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                              />
                              <button
                                onClick={handleJoinChallenge}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border cursor-pointer transition-colors"
                              >
                                Join
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Rest of the sidebar: CODE A FRIEND & TOURNAMENTS */}
                    <button
                      onClick={() => setIsChallengeDropdownOpen(true)}
                      className="w-full p-[14px] rounded-lg text-sm font-bold tracking-[1px] cursor-pointer transition-all duration-100 ease-in active:scale-[0.98] bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>CODE A FRIEND</span>
                    </button>

                    <button
                      onClick={() => alert("Tournaments schedule coming soon in the next release.")}
                      className="w-full p-[14px] rounded-lg text-sm font-bold tracking-[1px] cursor-pointer transition-all duration-100 ease-in active:scale-[0.98] bg-transparent border border-border text-muted-foreground hover:border-foreground hover:text-foreground hover:bg-secondary/30 flex items-center justify-center gap-2"
                    >
                      <Trophy className="w-4 h-4 text-muted-foreground" />
                      <span>TOURNAMENTS</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
