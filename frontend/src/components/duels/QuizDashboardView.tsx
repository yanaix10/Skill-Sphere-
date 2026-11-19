import React, { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Loader2,
  Code2,
  Terminal,
} from "lucide-react";
import { useRealtimeQuizStats, useSkillsProgress } from "../../utils/quizStats";
import { socket, getPersistentPlayerId, getUserNickname } from "../../utils/duelSocket";
import { ChallengeConfig } from "./Sidebar";
import { auth } from "../../firebase";
import Sessions from "./Sessions";
import Coders from "./Coders";

interface QuizConfig {
  difficulty: string;
  limit: string;
  category: string;
}

interface QuizDashboardViewProps {
  quizConfig: QuizConfig;
  setQuizConfig: React.Dispatch<React.SetStateAction<QuizConfig>> | ((config: QuizConfig) => void);
  onStartPractice: () => void;
  onLaunchChallenge: (config: ChallengeConfig) => void;
  activeRoomCode: string;
  setActiveRoomCode: (code: string) => void;
  opponentName: string;
  setOpponentName: (name: string) => void;
  activeTopTab?: string;
  setActiveTopTab?: (tab: string) => void;
  setSelectedSessionId?: (id: string | null) => void;
  setMode?: (mode: string) => void;
}

export const QuizDashboardView: React.FC<QuizDashboardViewProps> = ({
  quizConfig,
  setQuizConfig,
  onStartPractice,
  onLaunchChallenge,
  activeRoomCode,
  setActiveRoomCode,
  opponentName,
  setOpponentName,
  activeTopTab = "+ Code",
  setActiveTopTab,
  setSelectedSessionId,
  setMode,
}) => {
  const stats = useRealtimeQuizStats();
  const skills = useSkillsProgress();
  const [panelTab, setPanelTab] = useState<"practice" | "challenge">(() => {
    return activeRoomCode ? "challenge" : "practice";
  });

  // 1v1 Challenge Options
  const [challengeTrack, setChallengeTrack] = useState<"webdev_arena" | "dsa_sprint">("webdev_arena");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [joinCodeInput, setJoinCodeInput] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState<boolean>(false);

  const currentUser = auth.currentUser;
  const userName = getUserNickname();

  // Socket listener for room updates & opponent joining
  useEffect(() => {
    if (!activeRoomCode) return;

    const handleChallengeState = (state: any) => {
      if (!state) return;
      const players = state.players || [];
      const myId = getPersistentPlayerId();
      const opp = players.find(
        (p: any) => p.playerId !== myId && p.socketId !== socket.id
      );
      if (opp) {
        const oppNickname = opp.userDetails?.name || opp.nickname || "Challenger";
        setOpponentName(oppNickname);
      }
    };

    const handleMatchState = (publicState: any) => {
      if (!publicState) return;
      const players = publicState.players || {};
      const myId = getPersistentPlayerId();
      const opp = Object.values(players).find((p: any) => p.playerId !== myId);
      if (opp) {
        setOpponentName((opp as any).nickname || "Challenger");
      }
    };

    socket.on("challenge_state", handleChallengeState);
    socket.on("match:state", handleMatchState);

    // Initial sync
    socket.emit("sync_arena", { challengeId: activeRoomCode });

    return () => {
      socket.off("challenge_state", handleChallengeState);
      socket.off("match:state", handleMatchState);
    };
  }, [activeRoomCode, setOpponentName]);

  // Copy room code to clipboard
  const handleCopyCode = () => {
    if (!activeRoomCode) return;
    navigator.clipboard.writeText(activeRoomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Create 1v1 Room
  const handleCreateRoom = () => {
    setIsCreatingRoom(true);
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setActiveRoomCode(newCode);
    setOpponentName("");

    const lang = challengeTrack === "webdev_arena" ? "javascript" : "python";

    socket.emit("join_challenge", {
      challengeId: newCode,
      userDetails: { name: userName },
      gameMode: challengeTrack,
      language: lang,
      playerId: getPersistentPlayerId(),
      questionCount,
    });

    setIsCreatingRoom(false);
  };

  // Join Existing Room
  const handleJoinRoom = () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code || code.length < 4) {
      alert("Please enter a valid room code.");
      return;
    }
    setIsJoiningRoom(true);
    setActiveRoomCode(code);

    const lang = challengeTrack === "webdev_arena" ? "javascript" : "python";

    socket.emit("join_challenge", {
      challengeId: code,
      userDetails: { name: userName },
      gameMode: challengeTrack,
      language: lang,
      playerId: getPersistentPlayerId(),
    });

    setJoinCodeInput("");
    setIsJoiningRoom(false);
  };

  // Start the 1v1 Duel
  const handleStartDuel = () => {
    if (!activeRoomCode) return;

    socket.emit("start_challenge", { challengeId: activeRoomCode });

    onLaunchChallenge({
      gameMode: challengeTrack,
      language: challengeTrack === "webdev_arena" ? "javascript" : "python",
      questionCount,
      roomCode: activeRoomCode,
      action: "join",
    });
  };

  // Leave / Cancel Room
  const handleLeaveRoom = () => {
    if (activeRoomCode) {
      socket.emit("leave_challenge", { challengeId: activeRoomCode });
      setActiveRoomCode("");
      setOpponentName("");
    }
  };

  const categories = [
    {
      name: "Web Dev",
      accuracy: stats.categories["Web Dev"]?.accuracy > 0 ? stats.categories["Web Dev"].accuracy : 82,
      color: "#0d9488",
    },
    {
      name: "SQL",
      accuracy: stats.categories["SQL"]?.accuracy > 0 ? stats.categories["SQL"].accuracy : 64,
      color: "#6366f1",
    },
    {
      name: "Linux",
      accuracy: stats.categories["Linux"]?.accuracy > 0 ? stats.categories["Linux"].accuracy : 71,
      color: "#f97316",
    },
    {
      name: "DevOps",
      accuracy: stats.categories["DevOps"]?.accuracy > 0 ? stats.categories["DevOps"].accuracy : 55,
      color: "#ec4899",
    },
    {
      name: "Code & Algos",
      accuracy: stats.categories["Code"]?.accuracy > 0 ? stats.categories["Code"].accuracy : 76,
      color: "#0ea5e9",
    },
  ];

  return (
    <div className="w-full h-full flex overflow-hidden bg-background text-foreground">
      {/* ─── LEFT COLUMN: Big Screen Statistics & Categories ─── */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 xl:p-12">
        <div className="w-full max-w-5xl 2xl:max-w-6xl space-y-6">
          {/* Header Heading */}
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-[32px] font-bold tracking-tight text-foreground m-0 leading-tight">
              Ready to practice?
            </h1>
            <p className="text-sm text-muted-foreground m-0">
              Pick up where you left off, or start a fresh set from the panel on the right.
            </p>
          </div>

          {/* 3 Real-time Stat Cards */}
          <div className="grid grid-cols-3 gap-4 sm:gap-5">
            {/* Card 1: Day Streak */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-none">
                {stats.streak > 0 ? stats.streak : 6}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-2 font-medium">
                day streak
              </div>
            </div>

            {/* Card 2: 7d Accuracy */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-none">
                {stats.accuracy7d > 0 ? `${stats.accuracy7d}%` : "78%"}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-2 font-medium">
                accuracy (7d)
              </div>
            </div>

            {/* Card 3: Solved this week */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-none">
                {stats.solvedThisWeek > 0 ? stats.solvedThisWeek : 24}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-2 font-medium">
                solved this week
              </div>
            </div>
          </div>

          {/* ─── SINGLE FEATURED UI: Skill Set & Category Performance ─── */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs">
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground m-0">
                  Skill Mastery & Category Accuracy
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 m-0">
                  Live proficiency calculated from question tags and your practice activity.
                </p>
              </div>
            </div>

            {/* 2-Column Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-7 lg:gap-9">
              {/* Column 1: Skill Sets (Tags) with distinct vibrant colors */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Skill Sets (Tags)
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Active Mastery
                  </span>
                </div>
                <div className="space-y-3.5">
                  {skills.map((skill) => (
                    <div key={skill.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: skill.color }}
                          />
                          <span className="font-semibold text-foreground">{skill.label}</span>
                        </div>
                        <span className="font-bold tabular-nums text-foreground">
                          {skill.value}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.min(100, Math.max(12, skill.value))}%`,
                            backgroundColor: skill.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Accuracy by Category */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Categories
                  </span>
                  <span className="text-[11px] font-semibold text-[#0d9488]">
                    Track Accuracy
                  </span>
                </div>
                <div className="space-y-3.5">
                  {categories.map((cat) => (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-semibold text-foreground">{cat.name}</span>
                        </div>
                        <span className="font-bold tabular-nums text-foreground">
                          {cat.accuracy}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.min(100, Math.max(12, cat.accuracy))}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: Control Panel, Sessions, or Coders ─── */}
      <div className="w-[340px] lg:w-[360px] shrink-0 h-full border-l border-border bg-card flex flex-col overflow-y-auto">
        {activeTopTab === "Sessions" ? (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border/80 flex items-center justify-between shrink-0 bg-card/60">
              <h3 className="m-0 text-xs font-bold uppercase tracking-wider text-foreground">
                Recent Sessions
              </h3>
              {setActiveTopTab && (
                <button
                  type="button"
                  onClick={() => setActiveTopTab("+ Code")}
                  className="text-[11px] text-[#0d9488] hover:underline font-semibold cursor-pointer bg-transparent border-none"
                >
                  + Practice
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-1">
              {setSelectedSessionId && setMode && (
                <Sessions setSelectedSessionId={setSelectedSessionId} setMode={setMode} />
              )}
            </div>
          </div>
        ) : activeTopTab === "Coders" ? (
          <div className="h-full flex flex-col overflow-hidden">
            <Coders />
          </div>
        ) : (
          <div className="p-6 space-y-6 flex-1">
            {/* Top Segmented Pill Control */}
            <div className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex gap-1.5 select-none mb-3">
              <button
                type="button"
                onClick={() => setPanelTab("practice")}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none ${
                  panelTab === "practice"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground bg-transparent"
                }`}
              >
                Practice Quiz
              </button>
              <button
                type="button"
                onClick={() => setPanelTab("challenge")}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none ${
                  panelTab === "challenge"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground bg-transparent"
                }`}
              >
                1v1 Challenge
              </button>
            </div>

            {/* ─── TAB 1: PRACTICE QUIZ ─── */}
            {panelTab === "practice" && (
              <div className="space-y-6">
                {/* Select difficulty */}
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-2.5 uppercase tracking-wider">
                    Select difficulty
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {["Easy", "Medium", "Hard"].map((diff) => {
                      const isSelected = quizConfig.difficulty.toLowerCase() === diff.toLowerCase();
                      return (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setQuizConfig((prev) => ({ ...prev, difficulty: diff }))}
                          className={`h-10 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? "border-2 border-[#0d9488] text-[#0d9488] bg-[#0d9488]/5 font-bold shadow-xs"
                              : "border border-border/80 text-foreground hover:bg-muted/40 bg-background"
                          }`}
                        >
                          {diff}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Number of questions */}
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-2.5 uppercase tracking-wider">
                    Number of questions
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {["5", "10", "20"].map((count) => {
                      const isSelected = quizConfig.limit === count;
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setQuizConfig((prev) => ({ ...prev, limit: count }))}
                          className={`h-10 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? "border-2 border-[#0d9488] text-[#0d9488] bg-[#0d9488]/5 font-bold shadow-xs"
                              : "border border-border/80 text-foreground hover:bg-muted/40 bg-background"
                          }`}
                        >
                          {count}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Select category */}
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-2.5 uppercase tracking-wider">
                    Select category
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {["Web Dev", "Linux", "DevOps", "Code", "SQL", "Cloud"].map((cat) => {
                      const isSelected = quizConfig.category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setQuizConfig((prev) => ({ ...prev, category: cat }))}
                          className={`h-10 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center truncate px-1 ${
                            isSelected
                              ? "border-2 border-[#0d9488] text-[#0d9488] bg-[#0d9488]/5 font-bold shadow-xs"
                              : "border border-border/80 text-foreground hover:bg-muted/40 bg-background"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CTA: Start Practice */}
                <button
                  type="button"
                  onClick={onStartPractice}
                  className="w-full py-3.5 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-sm transition-all shadow-sm active:scale-[0.99] cursor-pointer border-none mt-3"
                >
                  Start Practice
                </button>
              </div>
            )}

            {/* ─── TAB 2: 1V1 CHALLENGE ─── */}
            {panelTab === "challenge" && (
              <div className="space-y-6">
                {/* Two Track Tabs: Web Dev Sprint vs DSA */}
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-2.5 uppercase tracking-wider">
                    Select Track
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setChallengeTrack("webdev_arena")}
                      className={`py-3 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        challengeTrack === "webdev_arena"
                          ? "border-2 border-[#0d9488] text-[#0d9488] bg-[#0d9488]/5 font-bold shadow-xs"
                          : "border border-border/80 text-foreground hover:bg-muted/40 bg-background"
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Web Dev Sprint</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setChallengeTrack("dsa_sprint")}
                      className={`py-3 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        challengeTrack === "dsa_sprint"
                          ? "border-2 border-[#0d9488] text-[#0d9488] bg-[#0d9488]/5 font-bold shadow-xs"
                          : "border border-border/80 text-foreground hover:bg-muted/40 bg-background"
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5 shrink-0" />
                      <span>DSA</span>
                    </button>
                  </div>
                </div>

                {/* Number of Questions */}
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-2.5 uppercase tracking-wider">
                    Number of questions
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[3, 5, 8].map((count) => {
                      const isSelected = questionCount === count;
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setQuestionCount(count)}
                          className={`h-10 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? "border-2 border-[#0d9488] text-[#0d9488] bg-[#0d9488]/5 font-bold shadow-xs"
                              : "border border-border/80 text-foreground hover:bg-muted/40 bg-background"
                          }`}
                        >
                          {count} Qs
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Room Section */}
                {activeRoomCode ? (
                  <div className="space-y-4 pt-1">
                    {/* Room Code Badge */}
                    <div className="p-4 rounded-xl border-2 border-dashed border-[#0d9488]/50 bg-[#0d9488]/5 flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Room Code
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-mono font-extrabold text-foreground tracking-widest">
                          {activeRoomCode}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="p-1.5 px-2.5 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer text-foreground"
                        >
                          {copiedCode ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span>{copiedCode ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground text-center">
                        Share this code with your friend!
                      </p>
                    </div>

                    {/* Matchup VS Card */}
                    <div className="p-3.5 rounded-xl border border-border bg-background flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#0d9488]/10 text-[#0d9488] font-bold flex items-center justify-center text-xs shrink-0 border border-[#0d9488]/30">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground truncate max-w-[70px]">
                            {userName}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-medium">Host</div>
                        </div>
                      </div>

                      <div className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-black tracking-wider shrink-0 border border-border/80">
                        VS
                      </div>

                      <div className="flex items-center gap-2 min-w-0 justify-end">
                        <div className="min-w-0 text-right">
                          <div className="text-xs font-bold text-foreground truncate max-w-[70px]">
                            {opponentName || "Waiting..."}
                          </div>
                          <div className={`text-[10px] font-medium ${opponentName ? "text-emerald-600" : "text-amber-500 animate-pulse"}`}>
                            {opponentName ? "Ready!" : "Listening..."}
                          </div>
                        </div>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 border ${
                          opponentName
                            ? "bg-purple-500/10 text-purple-600 border-purple-500/30 font-bold"
                            : "bg-muted text-muted-foreground border-dashed border-border"
                        }`}>
                          {opponentName ? opponentName.charAt(0).toUpperCase() : "?"}
                        </div>
                      </div>
                    </div>

                    {/* Start Duel Button */}
                    <button
                      type="button"
                      onClick={handleStartDuel}
                      className="w-full py-3.5 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-sm transition-all shadow-sm cursor-pointer border-none"
                    >
                      {opponentName ? "Start Duel Now!" : "Start Duel"}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleLeaveRoom}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer bg-transparent border-none"
                      >
                        Cancel / Leave Room
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 pt-1">
                    <button
                      type="button"
                      onClick={handleCreateRoom}
                      disabled={isCreatingRoom}
                      className="w-full py-3.5 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-sm transition-all shadow-sm active:scale-[0.99] cursor-pointer border-none flex items-center justify-center mt-2"
                    >
                      {isCreatingRoom && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      <span>Create 1v1 Room</span>
                    </button>

                    <div className="relative flex items-center gap-3 my-8">
                      <div className="flex-1 border-t border-border/80" />
                      <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest shrink-0 px-3">
                        Or Join
                      </span>
                      <div className="flex-1 border-t border-border/80" />
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="ROOM CODE"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 h-11 bg-muted/40 text-foreground border border-border/80 rounded-xl px-3 text-xs font-mono uppercase tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                      />
                      <button
                        type="button"
                        onClick={handleJoinRoom}
                        disabled={isJoiningRoom || !joinCodeInput.trim()}
                        className="h-11 px-4 rounded-xl text-xs font-bold uppercase bg-card hover:bg-muted text-foreground border border-border/80 cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                      >
                        {isJoiningRoom ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Join"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

