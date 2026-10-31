import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  RotateCcw,
  Copy,
  Terminal,
  Code,
  Check,
  Swords,
  Users,
  Timer,
  Clock,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import CodeEditor from "./CodeEditor";
import { auth } from "../firebase";
import { BACKEND_URL } from "../utils/api";

function getPersistentPlayerId(): string {
  if (typeof window === "undefined") return "guest";
  let id = sessionStorage.getItem("skillsphere_player_id");
  if (!id) {
    id = "p_" + Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem("skillsphere_player_id", id);
  }
  const uid = auth.currentUser?.uid;
  return uid ? `${uid}_${id}` : id;
}

const socket: Socket = io(BACKEND_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  reconnectionAttempts: 10,
  reconnectionDelay: 1500,
  auth: (cb) => {
    cb({
      playerId: getPersistentPlayerId(),
      nickname: auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Player"
    });
  }
});

interface Player {
  socketId: string;
  userDetails?: {
    name: string;
  };
  score: number;
  currentIndex?: number;
}

interface Question {
  id?: string;
  title: string;
  description?: string;
  statement?: string;
  category?: string;
  difficulty?: string;
  tags?: string[];
  initialCode?: { [key: string]: string };
  languages?: {
    [key: string]: {
      starterCode?: string;
      sampleTests?: string;
      example?: string;
    };
  };
  variants?: {
    [key: string]: {
      starterCode?: string;
      example?: string;
    };
  };
}

interface ChallengeState {
  players: Player[];
  questions?: Question[];
  status?: string;
  gameMode?: "dsa_sprint" | "webdev_arena" | "fullstack_blitz";
  countdownStartsAt?: number;
  countdownSec?: number;
}

export interface ChallengeConfig {
  gameMode: "dsa_sprint" | "webdev_arena" | "fullstack_blitz";
  language?: string;
  roomCode?: string;
  action?: "create" | "join" | "quick";
}

interface ChallengeProps {
  setMode?: (mode: string) => void;
  isDuelActive?: boolean;
  challengeConfig?: ChallengeConfig;
  onRoomCreated?: (roomCode: string) => void;
  onOpponentChange?: (opponentName: string, isReady: boolean) => void;
}

export default function Challenge({
  setMode,
  isDuelActive = false,
  challengeConfig,
  onRoomCreated,
  onOpponentChange
}: ChallengeProps) {
  // Mode selection & configuration (managed exclusively via Sidebar)
  const [gameMode, setGameMode] = useState<"dsa_sprint" | "webdev_arena" | "fullstack_blitz">(
    challengeConfig?.gameMode || "dsa_sprint"
  );

  // Language selection is inside the sandbox for DSA questions
  const [language, setLanguage] = useState<string>(
    challengeConfig?.gameMode === "webdev_arena" ? "javascript" : "python"
  );

  // Code editor execution state for DSA
  const [code, setCode] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // 1v1 Room & Matchmaking state
  const [roomCode, setRoomCode] = useState<string>(challengeConfig?.roomCode || "");
  const [inRoom, setInRoom] = useState<boolean>(isDuelActive);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [challengeState, setChallengeState] = useState<ChallengeState | null>(null);
  const [opponentStatus, setOpponentStatus] = useState<string>("");

  // Copy code UI
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // 1-Minute Timer (60s countdown when second player enters room)
  const [countdown, setCountdown] = useState<number | null>(null);

  const prevIndexRef = useRef<number>(-1);
  const typingTimeoutRef = useRef<any>(null);
  const socketIdRef = useRef<string>(socket.id || "");
  const stateRef = useRef({ inRoom, isStarted, winner, roomCode });
  const codeRef = useRef(code);
  const langRef = useRef(language);

  const getUserName = () => auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Player";

  useEffect(() => {
    stateRef.current = { inRoom, isStarted, winner, roomCode };
  }, [inRoom, isStarted, winner, roomCode]);

  useEffect(() => {
    codeRef.current = code;
    langRef.current = language;
  }, [code, language]);

  // Sync mode with parent config from Sidebar
  useEffect(() => {
    if (challengeConfig?.gameMode) {
      setGameMode(challengeConfig.gameMode);
    }
  }, [challengeConfig?.gameMode]);

  // Handle incoming challenge actions from Sidebar
  useEffect(() => {
    if (isDuelActive && challengeConfig?.action) {
      const modeToUse = challengeConfig.gameMode || gameMode;
      if (modeToUse === "fullstack_blitz") {
        alert("FullStack Blitz is locked & in progress. Please select an active mode.");
        return;
      }

      const langToUse = modeToUse === "webdev_arena" ? "javascript" : (challengeConfig.language || language);
      if (modeToUse === "webdev_arena") {
        setLanguage("javascript");
      }

      if (challengeConfig.action === "create") {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomCode(newCode);
        setIsHost(true);
        setInRoom(true);
        setIsStarted(false);
        setCountdown(null);
        if (onRoomCreated) onRoomCreated(newCode);

        socket.emit("join_challenge", {
          challengeId: newCode,
          userDetails: { name: getUserName() },
          gameMode: modeToUse,
          language: langToUse,
          playerId: getPersistentPlayerId()
        });
      } else if (challengeConfig.action === "join" && challengeConfig.roomCode) {
        const cleanCode = challengeConfig.roomCode.trim().toUpperCase();
        setRoomCode(cleanCode);
        setIsHost(false);
        setInRoom(true);
        setIsStarted(false);
        setCountdown(null);

        socket.emit("join_challenge", {
          challengeId: cleanCode,
          userDetails: { name: getUserName() },
          gameMode: modeToUse,
          language: langToUse,
          playerId: getPersistentPlayerId()
        });
      }
    }
  }, [isDuelActive, challengeConfig?.action, challengeConfig?.roomCode, challengeConfig?.gameMode]);

  // 1-minute countdown interval
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setIsStarted(true);
      setCountdown(null);
    }
  }, [countdown]);

  // Socket Connection and Event Listeners
  useEffect(() => {
    const handleConnect = () => {
      socketIdRef.current = socket.id || "";
      const { roomCode, inRoom } = stateRef.current;
      if (inRoom && roomCode) {
        socket.emit("join_challenge", {
          challengeId: roomCode,
          userDetails: { name: getUserName() },
          gameMode,
          language: gameMode === "webdev_arena" ? "javascript" : langRef.current,
          playerId: getPersistentPlayerId()
        });
      }
    };

    socket.on("connect", handleConnect);

    socket.on("challenge_state", (state: ChallengeState) => {
      setChallengeState(state);

      if (state.gameMode) {
        setGameMode(state.gameMode);
        if (state.gameMode === "webdev_arena") {
          setLanguage("javascript");
        }
      }

      const hasTwoPlayers = (state?.players && state.players.length >= 2) || false;
      setIsReady(hasTwoPlayers);

      // Start 1-minute countdown when 2 players are present
      if (hasTwoPlayers && !stateRef.current.isStarted) {
        if (state.countdownStartsAt) {
          const duration = state.countdownSec || 60;
          const elapsed = Math.floor((Date.now() - state.countdownStartsAt) / 1000);
          const remaining = Math.max(0, duration - elapsed);
          setCountdown((prev) => (prev === null ? remaining : prev));
        } else {
          setCountdown((prev) => (prev === null ? 60 : prev));
        }
      }

      if (state?.status === "started" || state?.status === "in_progress") {
        setIsStarted(true);
        setCountdown(null);
      }

      const myPlayer = state?.players?.find(
        (p) => (socket.id && p.socketId === socket.id) || (p.userDetails?.name && p.userDetails.name === getUserName())
      );
      const opponentPlayer = state?.players?.find((p) => p !== myPlayer);
      if (onOpponentChange) {
        onOpponentChange(opponentPlayer?.userDetails?.name || "", hasTwoPlayers);
      }

      // Populate starter code from server session questions once match is active
      if (myPlayer && state.questions && state.questions.length > 0) {
        const currentIndex = myPlayer.currentIndex ?? myPlayer.score ?? 0;
        if (state.questions.length > currentIndex) {
          const currentQ = state.questions[currentIndex];
          const qLangs = Object.keys(currentQ?.languages || currentQ?.variants || {});
          let activeLang = langRef.current;
          if (state.gameMode === "webdev_arena" || gameMode === "webdev_arena") {
            if (qLangs.includes("typescript") || currentQ?.tags?.includes("typescript")) {
              activeLang = "typescript";
            } else if (qLangs.includes("javascript")) {
              activeLang = "javascript";
            } else if (qLangs.length > 0) {
              activeLang = qLangs[0];
            }
            setLanguage(activeLang);
          }
          if (!codeRef.current || prevIndexRef.current !== currentIndex) {
            prevIndexRef.current = currentIndex;
            const starter =
              currentQ?.languages?.[activeLang]?.starterCode ||
              currentQ?.variants?.[activeLang]?.starterCode ||
              currentQ?.initialCode?.[activeLang] ||
              (currentQ as any)?.starterCode;
            if (starter) {
              setCode(starter);
            }
          }
        }
      }
    });

    socket.on("challenge_ready", () => {
      setIsReady(true);
      setCountdown((prev) => (prev === null ? 60 : prev));
      if (onOpponentChange) onOpponentChange("Opponent Ready", true);
    });

    socket.on("challenge_countdown", ({ startsAt, duration }: { startsAt: number; duration: number }) => {
      const elapsed = Math.floor((Date.now() - startsAt) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setCountdown(remaining > 0 ? remaining : duration);
    });

    socket.on("challenge_started", () => {
      setIsStarted(true);
      setCountdown(null);
    });

    socket.on("challenge_end", ({ winner }: { winner: Player }) => {
      setWinner(winner);
      setIsRunning(false);
    });

    socket.on("code_result", ({ success, message, isSubmit }: { success: boolean; message: string; isSubmit: boolean }) => {
      setIsRunning(false);
      setOutput(message);
      if (success && isSubmit) {
        setCode("");
      }
    });

    socket.on("opponent_typing", () => {
      setOpponentStatus("Typing...");
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setOpponentStatus(""), 2000);
    });

    socket.on("opponent_running", () => {
      setOpponentStatus("Running code...");
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setOpponentStatus(""), 3000);
    });

    socket.on("error", ({ message }: { message: string }) => {
      if (message) {
        alert(message);
        setIsRunning(false);
      }
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("challenge_state");
      socket.off("challenge_ready");
      socket.off("challenge_countdown");
      socket.off("challenge_started");
      socket.off("challenge_end");
      socket.off("code_result");
      socket.off("opponent_typing");
      socket.off("opponent_running");
      socket.off("error");
    };
  }, [gameMode]);

  const handleLeaveRoom = () => {
    setInRoom(false);
    setIsStarted(false);
    setRoomCode("");
    setCountdown(null);
    setWinner(null);
    setChallengeState(null);
    if (setMode) setMode("main");
  };

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (inRoom && roomCode) {
      socket.emit("typing", { challengeId: roomCode });
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (isStarted && challengeState?.questions) {
      const myPlayer = challengeState.players?.find(
        (p) => (socket.id && p.socketId === socket.id) || (p.userDetails?.name && p.userDetails.name === getUserName())
      );
      const currentIndex = myPlayer?.currentIndex ?? myPlayer?.score ?? 0;
      const currentQ = challengeState.questions[currentIndex];
      const starter =
        currentQ?.languages?.[newLang]?.starterCode ||
        currentQ?.variants?.[newLang]?.starterCode ||
        currentQ?.initialCode?.[newLang];
      if (starter) {
        setCode(starter);
      }
    }
  };

  const runCode = (isSubmit: boolean) => {
    if (!code.trim() || isRunning) return;
    setIsRunning(true);
    setOutput(isSubmit ? "Evaluating against test suite..." : "Executing sample test assertion...");

    if (inRoom && isStarted) {
      socket.emit("code_submitted", {
        challengeId: roomCode,
        code,
        language,
        isSubmit
      });
    }
  };

  const skipQuestion = () => {
    if (inRoom && roomCode) {
      socket.emit("skip_question", { challengeId: roomCode });
    }
  };

  const surrender = () => {
    if (window.confirm("Surrender this duel? Your opponent will receive the victory.")) {
      socket.emit("surrender", { challengeId: roomCode });
    }
  };

  const resetCurrentCode = () => {
    if (isStarted && challengeState?.questions) {
      const myPlayer = challengeState.players?.find(
        (p) => (socket.id && p.socketId === socket.id) || (p.userDetails?.name && p.userDetails.name === getUserName())
      );
      const currentIndex = myPlayer?.currentIndex ?? myPlayer?.score ?? 0;
      const currentQ = challengeState.questions[currentIndex];
      const qLangs = Object.keys(currentQ?.languages || currentQ?.variants || {});
      const qLang =
        gameMode === "webdev_arena"
          ? (qLangs.includes(language) ? language : (qLangs.includes("typescript") || currentQ?.tags?.includes("typescript") ? "typescript" : "javascript"))
          : language;
      const starter =
        currentQ?.languages?.[qLang]?.starterCode ||
        currentQ?.variants?.[qLang]?.starterCode ||
        currentQ?.initialCode?.[qLang] ||
        (currentQ as any)?.starterCode;
      if (starter) setCode(starter);
    }
    setOutput("");
  };

  // Score & active question computations for DSA / WebDev
  const myName = getUserName();
  const myPlayer = challengeState?.players?.find(
    (p) =>
      (socketIdRef.current && p.socketId === socketIdRef.current) ||
      (socket.id && p.socketId === socket.id) ||
      (p.userDetails?.name && p.userDetails.name === myName)
  );
  const opponent = challengeState?.players?.find((p) => p !== myPlayer);
  const p1Score = myPlayer?.score || 0;
  const p2Score = opponent?.score || 0;
  const p1Index = myPlayer?.currentIndex ?? p1Score;
  const totalQuestions = challengeState?.questions?.length || 3;

  const currentMatchQuestion = challengeState?.questions?.[p1Index];
  const activeQuestionTitle = currentMatchQuestion?.title || "Problem Statement";
  const activeQuestionStatement = currentMatchQuestion?.description || currentMatchQuestion?.statement || "";
  const activeQuestionDifficulty = currentMatchQuestion?.difficulty || "MEDIUM";
  const activeQuestionTags = currentMatchQuestion?.tags || ["algorithms", "dsa"];
  const availableLangs = Object.keys(currentMatchQuestion?.languages || currentMatchQuestion?.variants || {});
  const activeLang =
    gameMode === "webdev_arena"
      ? (availableLangs.includes(language)
          ? language
          : (availableLangs.includes("typescript") || currentMatchQuestion?.tags?.includes("typescript") ? "typescript" : "javascript"))
      : language;

  // Sync active language when question changes in WebDev arena
  useEffect(() => {
    if (isStarted && currentMatchQuestion && gameMode === "webdev_arena") {
      const qLangs = Object.keys(currentMatchQuestion.languages || currentMatchQuestion.variants || {});
      const detected = (qLangs.includes("typescript") || currentMatchQuestion.tags?.includes("typescript"))
        ? "typescript"
        : "javascript";
      if (detected !== language) {
        setLanguage(detected);
      }
    }
  }, [p1Index, isStarted, currentMatchQuestion, gameMode, language]);

  const activeSampleAssertion =
    currentMatchQuestion?.languages?.[activeLang]?.sampleTests ||
    currentMatchQuestion?.languages?.[activeLang]?.example ||
    currentMatchQuestion?.variants?.[activeLang]?.example ||
    (currentMatchQuestion as any)?.sampleTests ||
    "";

  // Format 1-minute countdown timer (e.g. 01:00, 00:45)
  const formatTimer = (sec: number | null) => {
    if (sec === null) return "01:00";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // =========================================================================
  // VIEW 1: ACTIVE CHALLENGE MATCH (Revealed ONLY after 1-minute countdown)
  // =========================================================================
  if (isStarted) {
    return (
      <div className="h-full w-full flex flex-col overflow-hidden bg-background font-sans text-foreground select-none">
        {/* Top Header: Professional Arena Status & Scoreboard */}
        <div className="h-14 px-6 border-b border-border bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20">
              {gameMode === "webdev_arena" ? "Web Dev Arena" : "DSA Sprint Duel"}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              Room: <span className="font-bold text-foreground">{roomCode}</span>
            </span>
          </div>

          {/* Synchronized Live Scoreboard */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">You</span>
              <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs font-mono font-bold">
                {p1Score}/{totalQuestions}
              </span>
            </div>

            <span className="text-xs font-mono text-muted-foreground font-bold">VS</span>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                {opponent?.userDetails?.name || "Opponent"}
              </span>
              <span className="px-2 py-0.5 rounded bg-destructive/15 text-destructive text-xs font-mono font-bold">
                {p2Score}/{totalQuestions}
              </span>
              {opponentStatus && (
                <span className="text-[11px] text-amber-500 font-mono italic animate-pulse">
                  ({opponentStatus})
                </span>
              )}
            </div>
          </div>

          {/* Right: Language selection INSIDE the sandbox header + reset button */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted-foreground uppercase font-semibold">
              Lang:
            </span>
            {gameMode === "webdev_arena" ? (
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-secondary text-primary border border-border rounded capitalize">
                {activeLang === "typescript" ? "TypeScript" : "JavaScript (Node.js)"}
              </span>
            ) : (
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-secondary text-foreground border border-border text-xs rounded px-2.5 py-1 focus:ring-1 focus:ring-primary outline-none cursor-pointer font-medium"
              >
                <option value="python">Python 3</option>
                <option value="cpp">C++ (GCC)</option>
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="java">Java (OpenJDK)</option>
              </select>
            )}
            <button
              onClick={resetCurrentCode}
              title="Reset code template"
              className="p-1.5 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Duel Area: Split Spec & Monaco Editor */}
        <div className="flex-1 flex flex-row min-h-0 overflow-hidden relative">
          {/* Winner Result Modal */}
          {winner && (
            <div className="absolute inset-0 z-40 bg-background/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-extrabold text-foreground mb-2">Match Finished</h2>
                <p className="text-sm text-foreground mb-2">
                  Winner: <span className="text-primary font-bold">{winner.userDetails?.name || "Player"}</span>
                </p>
                <p className="text-xs font-mono text-muted-foreground mb-6">
                  Final Score: {p1Score} - {p2Score}
                </p>
                <button
                  onClick={handleLeaveRoom}
                  className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg cursor-pointer transition-colors text-xs tracking-wider uppercase"
                >
                  Return to Lobby
                </button>
              </div>
            </div>
          )}

          {/* Left Pane: Question Specs & Execution Console */}
          <div className="w-[44%] max-w-[550px] min-w-[340px] h-full flex flex-col border-r border-border bg-card overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                    activeQuestionDifficulty === "HARD"
                      ? "bg-destructive/15 text-destructive border border-destructive/25"
                      : activeQuestionDifficulty === "MEDIUM"
                        ? "bg-amber-500/15 text-amber-500 border border-amber-500/25"
                        : "bg-primary/15 text-primary border border-primary/25"
                  }`}
                >
                  {activeQuestionDifficulty}
                </span>

                {activeQuestionTags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono text-muted-foreground px-2 py-0.5 rounded bg-secondary border border-border"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <h1 className="text-lg font-bold text-foreground tracking-tight">{activeQuestionTitle}</h1>

              <div className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line font-sans">
                {activeQuestionStatement || "Question specifications loaded."}
              </div>

              {activeSampleAssertion && (
                <div className="mt-3 pt-2">
                  <div className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-primary" /> Sample Assertion ({language})
                  </div>
                  <pre className="p-3 bg-secondary/60 border border-border rounded-lg text-xs font-mono text-primary overflow-x-auto whitespace-pre-wrap">
                    {activeSampleAssertion}
                  </pre>
                </div>
              )}

              {/* Console Output */}
              <div className="mt-3 pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-primary" /> Execution Console
                  </div>
                  {output && (
                    <button
                      onClick={() => setOutput("")}
                      className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="p-3 bg-secondary/70 border border-border rounded-lg text-xs font-mono min-h-[80px] max-h-[140px] overflow-y-auto whitespace-pre-wrap">
                  {output ? (
                    <span
                      className={
                        output.includes("Evaluating") || output.includes("Executing")
                          ? "text-amber-500"
                          : output.includes("failed") || output.includes("Error") || output.includes("error")
                            ? "text-destructive font-semibold"
                            : "text-emerald-500 font-semibold"
                      }
                    >
                      {output}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Run tests or submit solution to inspect execution result.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-border bg-card flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => runCode(false)}
                disabled={isRunning}
                className="flex-1 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors cursor-pointer text-center"
              >
                Run Tests
              </button>

              <button
                onClick={() => runCode(true)}
                disabled={isRunning}
                className="flex-1 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer text-center shadow-sm"
              >
                Submit Solution
              </button>

              <button
                onClick={skipQuestion}
                disabled={isRunning}
                className="py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer"
              >
                Skip
              </button>
              <button
                onClick={surrender}
                disabled={isRunning}
                className="py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-colors cursor-pointer"
              >
                Surrender
              </button>
            </div>
          </div>

          {/* Right Pane: Monaco Editor */}
          <div className="flex-1 h-full min-w-0 bg-[#1e1e1e] flex flex-col">
            <div className="h-9 px-4 bg-[#252526] border-b border-[#333333] flex items-center justify-between shrink-0">
              <span className="text-[11px] font-mono font-semibold text-gray-400 uppercase tracking-wider">
                Solution Editor &bull; {language.toUpperCase()}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  setOutput("Code copied to clipboard.");
                }}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer font-mono"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>

            <div className="flex-1 min-h-0 relative">
              <CodeEditor
                code={code}
                language={language}
                onChange={handleCodeChange}
                onLanguageChange={handleLanguageChange}
                hideHeader={true}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LOBBY & VERSUS CARD (When Room is Active or Waiting)
  // =========================================================================
  if (inRoom) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-background text-foreground select-none font-sans">
        <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
          {/* Header & Room Code */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
                Challenge Arena
              </div>
              <div className="text-sm font-extrabold text-foreground mt-0.5">
                {gameMode === "webdev_arena" ? "Web Dev Arena" : "DSA Sprint"}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg border border-border">
              <span className="text-xs text-muted-foreground font-mono">Room:</span>
              <span className="font-mono font-bold tracking-widest text-sm text-foreground">
                {roomCode}
              </span>
              <button
                onClick={handleCopyCode}
                title="Copy room code"
                className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Opponent VS Me Card */}
          <div className="grid grid-cols-5 items-center py-4">
            {/* Player 1: Me */}
            <div className="col-span-2 flex flex-col items-center text-center p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-base mb-2">
                {getUserName().substring(0, 2).toUpperCase()}
              </div>
              <div className="text-xs font-bold text-foreground truncate max-w-[120px]">
                {getUserName()}
              </div>
              <div className="text-[10px] text-emerald-500 font-mono font-semibold uppercase mt-0.5">
                Ready
              </div>
            </div>

            {/* Center VS Indicator */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-card border border-border text-foreground font-mono font-extrabold text-xs flex items-center justify-center shadow-xs">
                VS
              </div>
            </div>

            {/* Player 2: Other Player */}
            <div className="col-span-2 flex flex-col items-center text-center p-4 rounded-xl bg-secondary/50 border border-border">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base mb-2 border ${
                isReady
                  ? "bg-destructive/10 border-destructive/20 text-destructive"
                  : "bg-muted border-border text-muted-foreground"
              }`}>
                {isReady && opponent?.userDetails?.name
                  ? opponent.userDetails.name.substring(0, 2).toUpperCase()
                  : "?"}
              </div>
              <div className="text-xs font-bold text-foreground truncate max-w-[120px]">
                {isReady && opponent?.userDetails?.name ? opponent.userDetails.name : "Waiting..."}
              </div>
              <div className={`text-[10px] font-mono font-semibold uppercase mt-0.5 ${
                isReady ? "text-emerald-500" : "text-amber-500 italic animate-pulse"
              }`}>
                {isReady ? "Connected" : "Waiting"}
              </div>
            </div>
          </div>

          {/* 1-Minute Timer (Starts when other player joins) */}
          {isReady ? (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col items-center text-center space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase font-bold text-primary">
                <Clock className="w-3.5 h-3.5" />
                <span>Match Starting In</span>
              </div>
              <div className="text-4xl font-mono font-extrabold tracking-wider text-foreground">
                {formatTimer(countdown)}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                Duel launches automatically when timer concludes
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border text-center text-xs text-muted-foreground font-mono">
              Share room code <strong className="text-foreground">{roomCode}</strong> with your competitor to begin.
            </div>
          )}

          {/* Cancel Button */}
          <button
            onClick={handleLeaveRoom}
            className="w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-colors cursor-pointer"
          >
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: IDLE ARENA PLACEHOLDER (No Sandbox, No Open Questions, Clean)
  // =========================================================================
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-background text-foreground select-none font-sans">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
          <Swords className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">1v1 Challenge Arena</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Select a game mode from the sidebar and click <strong className="text-foreground font-semibold">Create 1v1 Room</strong> or enter a room code to duel a rival in real time.
          </p>
        </div>

        <div className="pt-2 text-[11px] text-muted-foreground font-mono">
          Questions and coding sandbox remain private until both players are locked in.
        </div>
      </div>
    </div>
  );
}
