import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  RotateCcw,
  Copy,
  Terminal,
  Code,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  Play,
  Share2
} from "lucide-react";
import CodeEditor from "./CodeEditor";
import { auth } from "../firebase";
import { BACKEND_URL } from "../utils/api";
import { defaultQuestions, SandBoxQuestion } from "../data/dsaQuestions";

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
}

export interface ChallengeConfig {
  gameMode: "dsa_sprint" | "webdev_arena" | "fullstack_blitz";
  language: string;
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
  // Sandbox questions state
  const [sandboxQuestions, setSandboxQuestions] = useState<SandBoxQuestion[]>(defaultQuestions);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);

  // Editor state
  const [language, setLanguage] = useState<string>(challengeConfig?.language || "python");
  const [code, setCode] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // 1v1 Match State
  const [roomCode, setRoomCode] = useState<string>(challengeConfig?.roomCode || "");
  const [inRoom, setInRoom] = useState<boolean>(isDuelActive);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [challengeState, setChallengeState] = useState<ChallengeState | null>(null);
  const [opponentStatus, setOpponentStatus] = useState<string>("");

  const prevIndexRef = useRef<number>(-1);
  const typingTimeoutRef = useRef<any>(null);
  const socketIdRef = useRef<string>(socket.id || "");
  const stateRef = useRef({ inRoom, isStarted, winner, roomCode });
  const codeRef = useRef(code);
  const langRef = useRef(language);

  const getUserName = () => auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Player";

  // Fetch all public questions on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/duel/questions`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          setSandboxQuestions(data.questions);
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    stateRef.current = { inRoom, isStarted, winner, roomCode };
  }, [inRoom, isStarted, winner, roomCode]);

  useEffect(() => {
    codeRef.current = code;
    langRef.current = language;
  }, [code, language]);

  // Sync language with parent config if updated
  useEffect(() => {
    if (challengeConfig?.language && challengeConfig.language !== language) {
      setLanguage(challengeConfig.language);
    }
  }, [challengeConfig?.language]);

  // Handle incoming challenge actions (create / join room)
  useEffect(() => {
    if (isDuelActive && challengeConfig?.action) {
      const mode = challengeConfig.gameMode || "dsa_sprint";
      if (mode !== "dsa_sprint") {
        alert(`${mode === "webdev_arena" ? "WebDev Arena" : "Full-Stack Blitz"} is locked and coming soon! Defaulting to DSA Sprint.`);
      }

      if (challengeConfig.action === "create") {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomCode(newCode);
        setIsHost(true);
        setInRoom(true);
        if (onRoomCreated) onRoomCreated(newCode);

        socket.emit("join_challenge", {
          challengeId: newCode,
          userDetails: { name: getUserName() },
          language: challengeConfig.language || language,
          playerId: getPersistentPlayerId()
        });
      } else if (challengeConfig.action === "join" && challengeConfig.roomCode) {
        const cleanCode = challengeConfig.roomCode.trim().toUpperCase();
        setRoomCode(cleanCode);
        setIsHost(false);
        setInRoom(true);

        socket.emit("join_challenge", {
          challengeId: cleanCode,
          userDetails: { name: getUserName() },
          language: challengeConfig.language || language,
          playerId: getPersistentPlayerId()
        });
      }
    }
  }, [isDuelActive, challengeConfig?.action, challengeConfig?.roomCode]);

  // Load starter code when question or language changes
  useEffect(() => {
    if (!isStarted) {
      const q = sandboxQuestions[selectedQuestionIndex] || defaultQuestions[0];
      const variant = q?.variants?.[language as keyof typeof q.variants];
      if (variant?.starterCode) {
        setCode(variant.starterCode);
      }
    }
  }, [selectedQuestionIndex, language, sandboxQuestions, isStarted]);

  // Socket Connection and Event Listeners
  useEffect(() => {
    const handleConnect = () => {
      socketIdRef.current = socket.id || "";
      const { roomCode, inRoom } = stateRef.current;
      if (inRoom && roomCode) {
        socket.emit("join_challenge", {
          challengeId: roomCode,
          userDetails: { name: getUserName() },
          language: langRef.current,
          playerId: getPersistentPlayerId()
        });
      }
    };

    socket.on("connect", handleConnect);

    socket.on("challenge_state", (state: ChallengeState) => {
      setChallengeState(state);

      if (state?.players && state.players.length >= 2) {
        setIsReady(true);
      } else {
        setIsReady(false);
      }

      if (state?.status === "started" || state?.status === "in_progress") {
        setIsStarted(true);
      }

      const myPlayer = state?.players?.find(
        (p) => (socket.id && p.socketId === socket.id) || (p.userDetails?.name && p.userDetails.name === getUserName())
      );
      const opponentPlayer = state?.players?.find((p) => p !== myPlayer);
      if (onOpponentChange) {
        onOpponentChange(opponentPlayer?.userDetails?.name || "", (state?.players?.length || 0) >= 2);
      }

      if (myPlayer && state.questions) {
        const currentIndex = myPlayer.currentIndex ?? myPlayer.score ?? 0;
        if (state.questions.length > currentIndex) {
          const currentQ = state.questions[currentIndex];
          if (!codeRef.current || prevIndexRef.current !== currentIndex) {
            prevIndexRef.current = currentIndex;
            const starter =
              currentQ?.languages?.[langRef.current]?.starterCode ||
              currentQ?.variants?.[langRef.current]?.starterCode ||
              currentQ?.initialCode?.[langRef.current];
            if (starter) {
              setCode(starter);
            }
          }
        }
      }
    });

    socket.on("challenge_ready", () => {
      setIsReady(true);
      if (onOpponentChange) onOpponentChange("Opponent Ready", true);
    });

    socket.on("challenge_started", () => {
      setIsStarted(true);
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

    socket.on("sandbox:result", ({ success, message }: { success: boolean; message: string }) => {
      setIsRunning(false);
      setOutput(message);
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
      socket.off("challenge_started");
      socket.off("challenge_end");
      socket.off("code_result");
      socket.off("sandbox:result");
      socket.off("opponent_typing");
      socket.off("opponent_running");
      socket.off("error");
    };
  }, []);

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
    } else {
      const q = sandboxQuestions[selectedQuestionIndex] || defaultQuestions[0];
      const starter = q?.variants?.[newLang as keyof typeof q.variants]?.starterCode;
      if (starter) {
        setCode(starter);
      }
    }
  };

  const runCode = (isSubmit: boolean) => {
    if (!code.trim() || isRunning) return;
    setIsRunning(true);
    setOutput(isSubmit ? "Evaluating against full test suite..." : "Executing sample test assertion...");

    if (inRoom && isStarted) {
      socket.emit("code_submitted", {
        challengeId: roomCode,
        code,
        language,
        isSubmit
      });
    } else {
      const currentQ = sandboxQuestions[selectedQuestionIndex] || defaultQuestions[0];
      socket.emit("sandbox:run", {
        code,
        language,
        questionId: currentQ.id
      });
    }
  };

  const startChallenge = () => {
    if (isReady && isHost && roomCode) {
      socket.emit("start_challenge", { challengeId: roomCode });
    }
  };

  const skipQuestion = () => {
    if (inRoom && roomCode) {
      socket.emit("skip_question", { challengeId: roomCode });
    }
  };

  const surrender = () => {
    if (window.confirm("Are you sure you want to surrender this duel?")) {
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
      const starter =
        currentQ?.languages?.[language]?.starterCode ||
        currentQ?.variants?.[language]?.starterCode ||
        currentQ?.initialCode?.[language];
      if (starter) setCode(starter);
    } else {
      const q = sandboxQuestions[selectedQuestionIndex] || defaultQuestions[0];
      const starter = q?.variants?.[language as keyof typeof q.variants]?.starterCode;
      if (starter) setCode(starter);
    }
    setOutput("");
  };

  // Score & active question computations
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
  const currentSandboxQuestion = sandboxQuestions[selectedQuestionIndex] || defaultQuestions[0];

  const activeQuestionTitle = isStarted ? currentMatchQuestion?.title : currentSandboxQuestion?.title;
  const activeQuestionStatement = isStarted
    ? currentMatchQuestion?.description || currentMatchQuestion?.statement
    : currentSandboxQuestion?.statement;
  const activeQuestionDifficulty = isStarted
    ? currentMatchQuestion?.difficulty || "MEDIUM"
    : currentSandboxQuestion?.difficulty || "EASY";
  const activeQuestionTags = isStarted
    ? currentMatchQuestion?.tags || ["algorithms", "dsa"]
    : currentSandboxQuestion?.tags || ["algorithms"];
  const activeSampleAssertion = isStarted
    ? currentMatchQuestion?.languages?.[language]?.sampleTests ||
    currentMatchQuestion?.languages?.[language]?.example ||
    currentMatchQuestion?.variants?.[language]?.example
    : currentSandboxQuestion?.variants?.[language as keyof typeof currentSandboxQuestion.variants]?.example;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-background font-sans text-foreground select-none">
      {/* Top Bar: Clean Blue-Themed Header */}
      <div className="h-14 px-6 border-b border-border bg-card flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="text-xs font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
            {isStarted ? "1v1 Battle Arena" : "Code Sandboxing"}
          </span>
          <div className="truncate font-semibold text-sm text-foreground">
            {activeQuestionTitle || "Algorithm Workbench"}
          </div>
        </div>

        {/* Center: Synchronized Scoreboard if Match is In-Progress */}
        {isStarted ? (
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">You</span>
              <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs font-mono font-bold">
                {p1Score}/{totalQuestions}
              </span>
            </div>

            <div className="text-xs font-mono text-muted-foreground font-bold">VS</div>

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
        ) : inRoom && !isStarted ? (
          /* Waiting in room lobby */
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono">
              Room: <span className="font-bold text-foreground">{roomCode}</span>
            </span>
            {isHost && (
              <button
                onClick={startChallenge}
                disabled={!isReady}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${isReady
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
              >
                {isReady ? "Launch Duel" : "Waiting for Rival..."}
              </button>
            )}
          </div>
        ) : (
          /* Sandbox mode: problem selector dropdown */
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-muted-foreground font-medium">Problem:</span>
            <select
              value={selectedQuestionIndex}
              onChange={(e) => setSelectedQuestionIndex(Number(e.target.value))}
              className="bg-secondary text-foreground border border-border text-xs rounded-md px-2.5 py-1 focus:ring-1 focus:ring-primary outline-none cursor-pointer"
            >
              {sandboxQuestions.map((q, idx) => (
                <option key={q.id || idx} value={idx}>
                  {idx + 1}. {q.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Right: Language Selector & Code Reset */}
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-secondary text-foreground border border-border text-xs rounded-md px-2.5 py-1 focus:ring-1 focus:ring-primary outline-none cursor-pointer font-medium"
          >
            <option value="python">Python 3</option>
            <option value="cpp">C++ (GCC)</option>
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="java">Java (OpenJDK)</option>
          </select>
          <button
            onClick={resetCurrentCode}
            title="Reset code template"
            className="p-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Split: Problem Spec & Monaco Editor */}
      <div className="flex-1 flex flex-row min-h-0 overflow-hidden relative">
        {/* Match Winner Modal */}
        {winner && (
          <div className="absolute inset-0 z-40 bg-background/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-3xl font-extrabold text-foreground mb-2">Match Finished</h2>
            <p className="text-base text-foreground mb-2">
              Winner: <span className="text-primary font-bold">{winner.userDetails?.name || "Player"}</span>
            </p>
            <p className="text-sm font-mono text-muted-foreground mb-6">
              Final Score: {p1Score} - {p2Score}
            </p>
            <button
              onClick={() => {
                setInRoom(false);
                setIsStarted(false);
                setWinner(null);
                if (setMode) setMode("main");
              }}
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg cursor-pointer transition-colors text-sm shadow-sm"
            >
              Return to Sandbox
            </button>
          </div>
        )}

        {/* Left Split Pane: Problem Details & Execution Console */}
        <div className="w-[44%] max-w-[550px] min-w-[340px] h-full flex flex-col border-r border-border bg-card overflow-hidden">
          {/* Scrollable Problem Details */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase font-mono ${activeQuestionDifficulty === "HARD"
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

            {/* Title */}
            <h1 className="text-xl font-bold text-foreground tracking-tight">{activeQuestionTitle}</h1>

            {/* Problem Statement */}
            <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line font-sans">
              {activeQuestionStatement || "Loading question specifications..."}
            </div>

            {/* Sample Assertion Preview */}
            {activeSampleAssertion && (
              <div className="mt-4 pt-2">
                <div className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-primary" /> Sample Test Case ({language})
                </div>
                <pre className="p-3 bg-secondary/60 border border-border rounded-lg text-xs font-mono text-primary overflow-x-auto whitespace-pre-wrap">
                  {activeSampleAssertion}
                </pre>
              </div>
            )}

            {/* Execution Console */}
            <div className="mt-4 pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-primary" /> Output Console
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
                      output.includes("Executing") || output.includes("Evaluating")
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
                    Run sample tests or submit solution to inspect execution output.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="p-4 border-t border-border bg-card flex items-center gap-3 shrink-0">
            <button
              onClick={() => runCode(false)}
              disabled={isRunning}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors cursor-pointer text-center ${isRunning ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              Run Sample Tests
            </button>

            <button
              onClick={() => runCode(true)}
              disabled={isRunning}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer text-center shadow-sm ${isRunning ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              Submit Solution
            </button>

            {isStarted && (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Right Split Pane: Monaco Code Editor */}
        <div className="flex-1 h-full min-w-0 bg-[#1e1e1e] flex flex-col">
          <div className="h-9 px-4 bg-[#252526] border-b border-[#333333] flex items-center justify-between shrink-0">
            <span className="text-[11px] font-mono font-semibold text-gray-400 uppercase tracking-wider">
              Solution Editor &bull; {language.toUpperCase()}
            </span>
            <div className="flex items-center gap-3">
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
