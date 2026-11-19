import React, { useState, useEffect } from "react";
import {
  Users,
  Trophy,
  Copy,
  Check,
  Swords,
  Sparkles,
  ArrowRight,
  Loader2,
  Code2,
  Terminal,
} from "lucide-react";
import { useRealtimeQuizStats } from "../../utils/quizStats";
import { socket, getPersistentPlayerId, getUserNickname } from "../../utils/duelSocket";
import { ChallengeConfig } from "./Sidebar";
import { auth } from "../../firebase";

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
}) => {
  const stats = useRealtimeQuizStats();
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
    stats.categories["Web Dev"],
    stats.categories["SQL"],
    stats.categories["Linux"],
    stats.categories["DevOps"],
  ];

  return (
    <div className="w-full h-full flex overflow-hidden bg-background text-foreground">
      {/* ─── LEFT COLUMN: Big Screen Statistics & Categories ─── */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-14">
        {/* Header Heading */}
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Ready to practice?
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Pick up where you left off, or start a fresh set from the panel on the right.
          </p>
        </div>

        {/* 3 Real-time Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl">
          {/* Card 1: Day Streak */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {stats.streak > 0 ? stats.streak : "—"}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1.5">
              day streak
            </div>
          </div>

          {/* Card 2: 7d Accuracy */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {stats.accuracy7d > 0 ? `${stats.accuracy7d}%` : "—"}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1.5">
              accuracy (7d)
            </div>
          </div>

          {/* Card 3: Solved this week */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {stats.solvedThisWeek > 0 ? stats.solvedThisWeek : "—"}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1.5">
              solved this week
            </div>
          </div>
        </div>

        {/* Accuracy by Category Card */}
        <div className="mt-5 rounded-2xl border border-border/70 bg-card p-6 sm:p-8 shadow-xs max-w-2xl">
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            Accuracy by category
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-6">
            {categories.some((c) => c.attempted > 0)
              ? `Where today's ${quizConfig.category} · ${quizConfig.difficulty} set should help most.`
              : "Complete a practice quiz to see your accuracy breakdown here."}
          </p>

          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3 sm:gap-4">
                <span className="text-xs sm:text-sm font-medium text-foreground w-16 sm:w-20 shrink-0">
                  {cat.name}
                </span>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#0d9488] h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, cat.accuracy))}%` }}
                  />
                </div>
                <span className="text-xs sm:text-sm font-medium text-muted-foreground w-10 text-right shrink-0">
                  {cat.attempted > 0 ? `${cat.accuracy}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: Control Panel ─── */}
      <div className="w-[300px] lg:w-[340px] shrink-0 h-full border-l border-border bg-card flex flex-col overflow-y-auto">
        <div className="p-5 space-y-5 flex-1">
          {/* Top Segmented Pill Control */}
          <div className="p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex gap-1 select-none">
            <button
              type="button"
              onClick={() => setPanelTab("practice")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none ${
                panelTab === "practice"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              Practice Quiz
            </button>
            <button
              type="button"
              onClick={() => setPanelTab("challenge")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none ${
                panelTab === "challenge"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              1v1 Challenge
            </button>
          </div>

          {/* ─── TAB 1: PRACTICE QUIZ ─── */}
          {panelTab === "practice" && (
            <div className="space-y-4">
              {/* Select difficulty */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-2 uppercase tracking-wide">
                  Select difficulty
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Easy", "Medium", "Hard"].map((diff) => {
                    const isSelected = quizConfig.difficulty.toLowerCase() === diff.toLowerCase();
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setQuizConfig((prev) => ({ ...prev, difficulty: diff }))}
                        className={`h-9 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? "border-2 border-[#0d9488] text-[#0d9488] bg-[#0d9488]/5 font-semibold"
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
                <label className="text-[11px] font-semibold text-muted-foreground block mb-2 uppercase tracking-wide">
                  Number of questions
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["5", "10", "20"].map((count) => {
                    const isSelected = quizConfig.limit === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuizConfig((prev) => ({ ...prev, limit: count }))}
                        className={`h-9 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? "border-2 border-[#0d9488] text-[#0d9488] bg-[#0d9488]/5 font-semibold"
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
                <label className="text-[11px] font-semibold text-muted-foreground block mb-2 uppercase tracking-wide">
                  Select category
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Web Dev", "Linux", "DevOps", "Code", "SQL", "Cloud"].map((cat) => {
                    const isSelected = quizConfig.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setQuizConfig((prev) => ({ ...prev, category: cat }))}
                        className={`h-9 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center truncate px-1 ${
                          isSelected
                            ? "border-2 border-[#0d9488] text-[#0d9488] bg-[#0d9488]/5 font-semibold"
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
                className="w-full py-3 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-sm transition-all shadow-sm active:scale-[0.99] cursor-pointer border-none mt-2"
              >
                Start Practice
              </button>
            </div>
          )}

          {/* ─── TAB 2: 1V1 CHALLENGE ─── */}
          {panelTab === "challenge" && (
            <div className="space-y-4">
              {/* Two Track Tabs: Web Dev Sprint vs DSA */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-2 uppercase tracking-wide">
                  Select Track
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setChallengeTrack("webdev_arena")}
                    className={`py-2.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      challengeTrack === "webdev_arena"
                        ? "border-2 border-[#0d9488] text-[#0d9488] bg-[#0d9488]/5 font-semibold"
                        : "border border-border/80 text-foreground hover:bg-muted/40 bg-background"
                    }`}
                  >
                    <Code2 className="w-3 h-3 shrink-0" />
                    <span>Web Dev Sprint</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChallengeTrack("dsa_sprint")}
                    className={`py-2.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      challengeTrack === "dsa_sprint"
                        ? "border-2 border-[#0d9488] text-[#0d9488] bg-[#0d9488]/5 font-semibold"
                        : "border border-border/80 text-foreground hover:bg-muted/40 bg-background"
                    }`}
                  >
                    <Terminal className="w-3 h-3 shrink-0" />
                    <span>DSA</span>
                  </button>
                </div>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-2 uppercase tracking-wide">
                  Number of questions
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[3, 5, 8].map((count) => {
                    const isSelected = questionCount === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuestionCount(count)}
                        className={`h-9 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? "border-2 border-[#0d9488] text-[#0d9488] bg-[#0d9488]/5 font-semibold"
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
                <div className="space-y-3 pt-1">
                  {/* Room Code Badge */}
                  <div className="p-3.5 rounded-xl border-2 border-dashed border-[#0d9488]/50 bg-[#0d9488]/5 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Room Code
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl font-mono font-extrabold text-foreground tracking-widest">
                        {activeRoomCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="p-1.5 px-2 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer text-foreground"
                      >
                        {copiedCode ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span>{copiedCode ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Share this code with your friend!
                    </p>
                  </div>

                  {/* Matchup VS Card */}
                  <div className="p-3 rounded-xl border border-border bg-background flex items-center justify-between gap-2">
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
                    className="w-full py-3 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-sm transition-all shadow-sm cursor-pointer border-none"
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
                <div className="space-y-3 pt-1">
                  <button
                    type="button"
                    onClick={handleCreateRoom}
                    disabled={isCreatingRoom}
                    className="w-full py-3 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-sm transition-all shadow-sm active:scale-[0.99] cursor-pointer border-none flex items-center justify-center gap-2"
                  >
                    {isCreatingRoom ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Swords className="w-4 h-4" />
                    )}
                    <span>Create 1v1 Room</span>
                  </button>

                  <div className="relative flex items-center gap-2 my-1">
                    <div className="flex-1 border-t border-border/70" />
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider shrink-0">
                      Or Join
                    </span>
                    <div className="flex-1 border-t border-border/70" />
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="ROOM CODE"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 h-10 bg-muted/40 text-foreground border border-border/80 rounded-lg px-2.5 text-xs font-mono uppercase tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-[#0d9488]"
                    />
                    <button
                      type="button"
                      onClick={handleJoinRoom}
                      disabled={isJoiningRoom || !joinCodeInput.trim()}
                      className="h-10 px-3 rounded-lg text-xs font-bold uppercase bg-card hover:bg-muted text-foreground border border-border/80 cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                    >
                      {isJoiningRoom ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Join"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Quick Links: Code a Friend & Tournaments */}
        <div className="p-5 pt-0 space-y-1.5 border-t border-border/60 mt-auto">
          <div className="pt-4 space-y-1.5">
            <button
              type="button"
              onClick={() => setPanelTab("challenge")}
              className="w-full py-2.5 px-4 rounded-xl border border-border/70 bg-background hover:bg-muted/40 transition-colors flex items-center gap-3 text-xs font-medium text-foreground cursor-pointer"
            >
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>Code a Friend</span>
            </button>

            <button
              type="button"
              onClick={() => alert("Tournaments schedule coming soon in the next release.")}
              className="w-full py-2.5 px-4 rounded-xl border border-border/70 bg-background hover:bg-muted/40 transition-colors flex items-center gap-3 text-xs font-medium text-foreground cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>Tournaments</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

