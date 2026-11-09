import React, { useState, useEffect, useRef, useCallback } from "react";
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
  ShieldAlert,
  RefreshCw,
  Play,
  Zap,
  Sparkles,
  Trophy,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Flag,
  Share2
} from "lucide-react";
import CodeEditor from "./CodeEditor";
import { auth } from "../firebase";
import { BACKEND_URL } from "../utils/api";
import defaultWebdevQuestions from "../data/defaultWebdevQuestions.json";
import defaultDsaQuestions from "../data/defaultDsaQuestions.json";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BorderBeam } from "@/components/ui/border-beam";
import { Confetti } from "@/components/ui/confetti";
import { TugOfWarBar } from "@/components/ui/tug-of-war-bar";
import { RoomCodeBadge } from "@/components/ui/room-code-badge";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { OtpInput } from "@/components/ui/otp-input";
import { cn } from "@/lib/utils";
import { updateUserStatsAndBadges, getRankTier, BadgeDefinition } from "@/utils/ranks";

function getPersistentPlayerId(): string {
  if (typeof window === "undefined") return "guest";
  let id = localStorage.getItem("skillsphere_player_id");
  if (!id) {
    id = "p_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("skillsphere_player_id", id);
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
  challengeId?: string;
}

export interface ChallengeConfig {
  gameMode: "dsa_sprint" | "webdev_arena" | "fullstack_blitz";
  language?: string;
  roomCode?: string;
  action?: "create" | "join" | "quick";
  questionCount?: number;
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
    challengeConfig?.gameMode || "webdev_arena"
  );

  // Language selection is inside the sandbox for DSA questions
  const [language, setLanguage] = useState<string>(
    challengeConfig?.gameMode === "webdev_arena" ? "javascript" : "python"
  );

  // Code editor execution state for DSA
  const [code, setCode] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [specTab, setSpecTab] = useState<string>("spec");

  // 1v1 Room & Matchmaking state (restores from sessionStorage if page refreshed)
  const [roomCode, setRoomCode] = useState<string>(() => {
    return challengeConfig?.roomCode || (typeof window !== "undefined" ? sessionStorage.getItem("skillsphere_active_room") || "" : "");
  });
  const [inRoom, setInRoom] = useState<boolean>(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("skillsphere_active_room") : null;
    return isDuelActive || Boolean(saved);
  });
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [challengeState, setChallengeState] = useState<ChallengeState | null>(null);
  const [cachedQuestions, setCachedQuestions] = useState<Question[]>(() => {
    if (typeof window === "undefined") return [];
    const curRoom = challengeConfig?.roomCode || sessionStorage.getItem("skillsphere_active_room");
    if (curRoom) {
      try {
        const saved = sessionStorage.getItem(`skillsphere_match_questions_${curRoom}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [opponentStatus, setOpponentStatus] = useState<string>("");

  // Copy code UI
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // 1-Minute Timer (60s countdown when second player enters room)
  const [countdown, setCountdown] = useState<number | null>(null);

  // Match points & rating rewards
  const [matchReward, setMatchReward] = useState<{
    points: number;
    ratingDelta: number;
    outcome: "win" | "loss" | "draw";
    newBadges: BadgeDefinition[];
  } | null>(null);
  const matchRewardedRef = useRef<boolean>(false);

  const prevIndexRef = useRef<number>(-1);
  const typingTimeoutRef = useRef<any>(null);
  const socketIdRef = useRef<string>(socket.id || "");
  const stateRef = useRef({ inRoom, isStarted, winner, roomCode });
  const codeRef = useRef(code);
  const langRef = useRef(language);
  const gameModeRef = useRef(gameMode);

  const getUserName = () => auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Player";

  useEffect(() => {
    stateRef.current = { inRoom, isStarted, winner, roomCode };
  }, [inRoom, isStarted, winner, roomCode]);

  useEffect(() => {
    codeRef.current = code;
    langRef.current = language;
    gameModeRef.current = gameMode;
  }, [code, language, gameMode]);

  // Sync mode and roomCode with parent config from Sidebar
  useEffect(() => {
    if (challengeConfig?.gameMode) {
      setGameMode(challengeConfig.gameMode);
    }
    if (challengeConfig?.roomCode && challengeConfig.roomCode !== roomCode) {
      setRoomCode(challengeConfig.roomCode);
    }
  }, [challengeConfig?.gameMode, challengeConfig?.roomCode]);

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
        const newCode = challengeConfig.roomCode || Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomCode(newCode);
        setIsHost(true);
        setInRoom(true);
        setIsStarted(false);
        setCountdown(null);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("skillsphere_active_room", newCode);
        }
        if (onRoomCreated) onRoomCreated(newCode);

        socket.emit("join_challenge", {
          challengeId: newCode,
          userDetails: { name: getUserName() },
          gameMode: modeToUse,
          language: langToUse,
          playerId: getPersistentPlayerId(),
          questionCount: challengeConfig.questionCount || 5
        });
      } else if (challengeConfig.action === "join" && challengeConfig.roomCode) {
        const cleanCode = challengeConfig.roomCode.trim().toUpperCase();
        setRoomCode(cleanCode);
        setIsHost(false);
        setInRoom(true);
        setIsStarted(false);
        setCountdown(null);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("skillsphere_active_room", cleanCode);
        }

        socket.emit("join_challenge", {
          challengeId: cleanCode,
          userDetails: { name: getUserName() },
          gameMode: modeToUse,
          language: langToUse,
          playerId: getPersistentPlayerId()
        });
      }
    }
  }, [isDuelActive, challengeConfig?.action, challengeConfig?.roomCode, challengeConfig?.gameMode, challengeConfig?.questionCount]);

  // Auto-reconnect to existing active match session on page reload or component mount
  useEffect(() => {
    // Only auto-reconnect if no explicit new action was triggered
    if (challengeConfig?.action) return;
    const savedRoom = roomCode || (typeof window !== "undefined" ? sessionStorage.getItem("skillsphere_active_room") : null);
    if (savedRoom && isDuelActive) {
      setInRoom(true);
      setRoomCode(savedRoom);
      socket.emit("join_challenge", {
        challengeId: savedRoom,
        userDetails: { name: getUserName() },
        gameMode: gameModeRef.current,
        language: gameModeRef.current === "webdev_arena" ? "javascript" : langRef.current,
        playerId: getPersistentPlayerId()
      });
      socket.emit("sync_arena", { challengeId: savedRoom });
    }
  }, [isDuelActive, challengeConfig?.action]);

  // Countdown interval — purely visual ticker
  // isStarted is set authoritatively by challenge_state (status: started) from the server
  // When the timer hits 0 we optimistically mark started and request immediate server arena sync.
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      setIsStarted(true);

      const curCode = roomCode || stateRef.current.roomCode;
      if (curCode) {
        socket.emit("sync_arena", { challengeId: curCode });
        socket.emit("join_challenge", {
          challengeId: curCode,
          userDetails: { name: getUserName() },
          gameMode: gameModeRef.current,
          language: gameModeRef.current === "webdev_arena" ? "javascript" : langRef.current,
          playerId: getPersistentPlayerId()
        });
      }
    }
  }, [countdown]);

  // Socket Connection and Event Listeners (mounted once for stable socket lifecycle)
  useEffect(() => {
    const handleConnect = () => {
      socketIdRef.current = socket.id || "";
      const { roomCode: curRoom, inRoom: isIn } = stateRef.current;
      if (isIn && curRoom) {
        socket.emit("join_challenge", {
          challengeId: curRoom,
          userDetails: { name: getUserName() },
          gameMode: gameModeRef.current,
          language: gameModeRef.current === "webdev_arena" ? "javascript" : langRef.current,
          playerId: getPersistentPlayerId()
        });
        socket.emit("sync_arena", { challengeId: curRoom });
      }
    };

    socket.on("connect", handleConnect);
    if (socket.connected) {
      handleConnect();
    }

    socket.on("challenge_state", (state: ChallengeState) => {
      setChallengeState(state);

      if (state.questions && state.questions.length > 0) {
        setCachedQuestions(state.questions);
        const curCode = state.challengeId || roomCode || stateRef.current.roomCode;
        if (curCode && typeof window !== "undefined") {
          sessionStorage.setItem(`skillsphere_match_questions_${curCode}`, JSON.stringify(state.questions));
        }
      }

      if (state.challengeId && state.challengeId !== stateRef.current.roomCode) {
        setRoomCode(state.challengeId);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("skillsphere_active_room", state.challengeId);
        }
        if (onRoomCreated) onRoomCreated(state.challengeId);
      }

      if (state.gameMode) {
        setGameMode(state.gameMode);
        if (state.gameMode === "webdev_arena") {
          setLanguage("javascript");
        }
      }

      const hasTwoPlayers = (state?.players && state.players.length >= 2) || false;
      setIsReady(hasTwoPlayers);

      // Start countdown when 2 players are present
      if (hasTwoPlayers && !stateRef.current.isStarted) {
        if (state.countdownStartsAt) {
          const duration = state.countdownSec || 10;
          const elapsed = Math.floor((Date.now() - state.countdownStartsAt) / 1000);
          const remaining = Math.max(0, duration - elapsed);
          setCountdown((prev) => (prev === null ? remaining : prev));
        } else {
          setCountdown((prev) => (prev === null ? (state.countdownSec || 10) : prev));
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
      if (onOpponentChange && opponentPlayer?.userDetails?.name) {
        onOpponentChange(opponentPlayer.userDetails.name, hasTwoPlayers);
      }

      // Populate starter code from server session questions once match is active
      const availableQuestions = state.questions && state.questions.length > 0 ? state.questions : cachedQuestions;
      if (myPlayer && availableQuestions && availableQuestions.length > 0) {
        const currentIndex = myPlayer.currentIndex ?? myPlayer.score ?? 0;
        if (availableQuestions.length > currentIndex) {
          const currentQ = availableQuestions[currentIndex];
          const qLangs = Object.keys(currentQ?.languages || currentQ?.variants || {});
          let activeLang = langRef.current;
          if (state.gameMode === "webdev_arena" || gameModeRef.current === "webdev_arena") {
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
            const savedDraft = currentQ?.id
              ? sessionStorage.getItem(`skillsphere_code_${roomCode || state.challengeId}_${currentQ.id}`)
              : null;
            if (savedDraft) {
              setCode(savedDraft);
            } else {
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
      }
    });

    socket.on("challenge_ready", () => {
      setIsReady(true);
      setCountdown((prev) => (prev === null ? 10 : prev));
      if (onOpponentChange) onOpponentChange("Opponent Ready", true);
    });

    socket.on("challenge_countdown", ({ startsAt, duration }: { startsAt: number; duration: number }) => {
      if (stateRef.current.isStarted) return;
      const elapsed = Math.floor((Date.now() - startsAt) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      if (remaining > 0) {
        setCountdown(remaining);
      }
    });

    socket.on("challenge_started", (startedState?: ChallengeState) => {
      setIsStarted(true);
      setCountdown(null);
      if (startedState) {
        if (startedState.challengeId && startedState.challengeId !== stateRef.current.roomCode) {
          setRoomCode(startedState.challengeId);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("skillsphere_active_room", startedState.challengeId);
          }
          if (onRoomCreated) onRoomCreated(startedState.challengeId);
        }
        if (startedState.questions && startedState.questions.length > 0) {
          setChallengeState(startedState);
          setCachedQuestions(startedState.questions);
          const curCode = startedState.challengeId || stateRef.current.roomCode;
          if (curCode && typeof window !== "undefined") {
            sessionStorage.setItem(`skillsphere_match_questions_${curCode}`, JSON.stringify(startedState.questions));
          }
        }
      }
    });

    socket.on("match:state", (publicState: any) => {
      if (publicState?.questions && publicState.questions.length > 0) {
        setCachedQuestions(publicState.questions);
        setChallengeState((prev) => ({
          ...(prev || {}),
          questions: publicState.questions,
          status: publicState.status,
          challengeId: publicState.roomCode || publicState.matchId,
          players: publicState.players?.map((p: any) => ({
            socketId: p.socketId,
            userDetails: { name: p.nickname },
            score: p.score,
            currentIndex: p.currentIndex
          })) || prev?.players || []
        } as ChallengeState));
      }
    });

    socket.on("challenge_end", ({ winner }: { winner: Player }) => {
      setWinner(winner);
      setIsRunning(false);
    });

    socket.on("code_result", ({ success, message, isSubmit }: { success: boolean; message: string; isSubmit: boolean }) => {
      setIsRunning(false);
      setOutput(message);
      setSpecTab("console");
      if (success && isSubmit) {
        setCode("");
        const curCode = roomCode || stateRef.current.roomCode;
        const curQ = challengeState?.questions?.[prevIndexRef.current] || cachedQuestions?.[prevIndexRef.current];
        if (curCode && curQ?.id && typeof window !== "undefined") {
          sessionStorage.removeItem(`skillsphere_code_${curCode}_${curQ.id}`);
        }
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
      socket.off("match:state");
      socket.off("challenge_end");
      socket.off("code_result");
      socket.off("opponent_typing");
      socket.off("opponent_running");
      socket.off("error");
    };
  }, []);

  const handleLeaveRoom = () => {
    matchRewardedRef.current = false;
    setMatchReward(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("skillsphere_active_room");
      sessionStorage.removeItem("skillsphere_quiz_mode");
      sessionStorage.removeItem("skillsphere_challenge_config");
    }
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
      const currentQ = challengeState?.questions?.[prevIndexRef.current];
      if (currentQ?.id && typeof window !== "undefined") {
        sessionStorage.setItem(`skillsphere_code_${roomCode}_${currentQ.id}`, newCode);
      }
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
    setSpecTab("console");

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

  // Award match points & update user rating when a duel concludes
  useEffect(() => {
    if (!winner || matchRewardedRef.current) return;
    matchRewardedRef.current = true;

    const meWon = Boolean(
      (winner.socketId && (winner.socketId === socket.id || winner.socketId === socketIdRef.current)) ||
      (winner.userDetails?.name && winner.userDetails.name === getUserName()) ||
      p1Score > p2Score
    );

    const isDraw =
      winner.socketId === "draw" ||
      winner.userDetails?.name?.toLowerCase().includes("draw") ||
      p1Score === p2Score;

    const outcome: "win" | "loss" | "draw" = isDraw ? "draw" : meWon ? "win" : "loss";
    const points = outcome === "win" ? 100 + p1Score * 15 : outcome === "draw" ? 40 + p1Score * 10 : 20 + p1Score * 10;
    const ratingDelta = outcome === "win" ? 30 : outcome === "draw" ? 5 : -10;

    const currentTrack = challengeConfig?.gameMode === "webdev_arena" ? "webdev_arena" : "dsa_sprint";

    updateUserStatsAndBadges({
      pointsDelta: points,
      ratingDelta,
      duelWon: outcome === "win",
      duelLost: outcome === "loss",
      duelDraw: outcome === "draw",
      track: currentTrack,
    })
      .then((res) => {
        setMatchReward({
          points,
          ratingDelta,
          outcome,
          newBadges: res.newBadgesUnlocked || [],
        });
      })
      .catch((err) => {
        console.error("Failed to update user stats for match outcome:", err);
        setMatchReward({ points, ratingDelta, outcome, newBadges: [] });
      });
  }, [winner, p1Score, p2Score, challengeConfig?.gameMode]);

  const fallbackQuestions = (gameMode === "webdev_arena" || gameModeRef.current === "webdev_arena")
    ? (defaultWebdevQuestions as unknown as Question[])
    : (defaultDsaQuestions as unknown as Question[]);

  const activeQuestions: Question[] =
    (challengeState?.questions && challengeState.questions.length > 0)
      ? challengeState.questions
      : (cachedQuestions.length > 0
          ? cachedQuestions
          : (() => {
              if (typeof window !== "undefined") {
                const cur = roomCode || stateRef.current.roomCode;
                try {
                  const s = sessionStorage.getItem(`skillsphere_match_questions_${cur}`);
                  if (s) {
                    const parsed = JSON.parse(s);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                  }
                } catch {}
              }
              // Immediate fallback so players are never stuck on a loading screen
              return fallbackQuestions;
            })());

  const totalQuestions = activeQuestions.length > 0 ? activeQuestions.length : (challengeState?.questions?.length || 3);
  const maxIdx = Math.max(0, (activeQuestions.length || 1) - 1);
  const p1Index = Math.min(myPlayer?.currentIndex ?? p1Score ?? 0, maxIdx);

  const currentMatchQuestion = activeQuestions[p1Index] || activeQuestions[0];
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

  const resetCurrentCode = () => {
    if (isStarted && activeQuestions.length > 0) {
      const currentIndex = myPlayer?.currentIndex ?? myPlayer?.score ?? 0;
      const currentQ = activeQuestions[currentIndex] || activeQuestions[0];
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

  // Sync active language and starter code when question changes in WebDev arena or DSA sprint
  useEffect(() => {
    if (currentMatchQuestion) {
      const qLangs = Object.keys(currentMatchQuestion.languages || currentMatchQuestion.variants || {});
      let detected = language;
      if (gameMode === "webdev_arena") {
        detected = (qLangs.includes("typescript") || currentMatchQuestion.tags?.includes("typescript"))
          ? "typescript"
          : "javascript";
        if (detected !== language) {
          setLanguage(detected);
        }
      }

      // Initialize code if empty or moving to next question
      if (!code || prevIndexRef.current !== p1Index) {
        prevIndexRef.current = p1Index;
        const curRoom = roomCode || stateRef.current.roomCode;
        const savedDraft = curRoom && currentMatchQuestion.id
          ? sessionStorage.getItem(`skillsphere_code_${curRoom}_${currentMatchQuestion.id}`)
          : null;
        if (savedDraft) {
          setCode(savedDraft);
        } else {
          const starter =
            currentMatchQuestion.languages?.[detected]?.starterCode ||
            currentMatchQuestion.variants?.[detected]?.starterCode ||
            currentMatchQuestion.initialCode?.[detected] ||
            (currentMatchQuestion as any)?.starterCode ||
            "";
          if (starter) {
            setCode(starter);
          }
        }
      }
    }
  }, [p1Index, isStarted, currentMatchQuestion, gameMode, language, code, roomCode]);

  const activeSampleAssertion =
    currentMatchQuestion?.languages?.[activeLang]?.sampleTests ||
    currentMatchQuestion?.languages?.[activeLang]?.example ||
    currentMatchQuestion?.variants?.[activeLang]?.example ||
    (currentMatchQuestion as any)?.sampleTests ||
    "";

  // HTTP polling fallback: when arena is started but questions haven't arrived via socket
  const httpPollAttemptsRef = useRef(0);
  const httpPollTimerRef = useRef<any>(null);

  const fetchMatchStateHTTP = useCallback(async (code: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/match/${code.toUpperCase()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.questions && data.questions.length > 0) {
        // Hydrate all question state from HTTP response
        setCachedQuestions(data.questions);
        setChallengeState((prev) => ({
          ...(prev || {}),
          players: data.players || prev?.players || [],
          questions: data.questions,
          status: data.status,
          gameMode: data.gameMode,
          countdownStartsAt: data.countdownStartsAt,
          countdownSec: data.countdownSec,
          challengeId: data.challengeId
        } as ChallengeState));
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`skillsphere_match_questions_${code}`, JSON.stringify(data.questions));
        }
        // Clear poll timer on success
        clearTimeout(httpPollTimerRef.current);
        httpPollAttemptsRef.current = 0;
      }
    } catch {
      // Network error — will retry on next tick
    }
  }, []);

  useEffect(() => {
    if (!inRoom || !roomCode) return;
    if (activeQuestions.length > 0) {
      // Questions already loaded — clear any pending poll
      clearTimeout(httpPollTimerRef.current);
      httpPollAttemptsRef.current = 0;
      return;
    }

    // If match is active or ready, fetch immediately if not done yet
    if (isStarted && httpPollAttemptsRef.current === 0) {
      fetchMatchStateHTTP(roomCode);
      socket.emit("sync_arena", { challengeId: roomCode });
    }

    // Prefetch during countdown as soon as 2 players are present
    if (isReady && !isStarted && httpPollAttemptsRef.current === 0) {
      fetchMatchStateHTTP(roomCode);
    }

    // HTTP polling loop (every 2s, up to 10 attempts = 20s)
    if (isStarted && httpPollAttemptsRef.current < 10) {
      httpPollTimerRef.current = setTimeout(async () => {
        httpPollAttemptsRef.current += 1;
        await fetchMatchStateHTTP(roomCode);
        socket.emit("sync_arena", { challengeId: roomCode });
      }, 2000);
    }

    return () => clearTimeout(httpPollTimerRef.current);
  }, [inRoom, roomCode, isStarted, isReady, activeQuestions.length, fetchMatchStateHTTP]);

  // Format countdown timer (e.g. 00:05, 00:45)
  const formatTimer = (sec: number | null) => {
    if (sec === null) return "00:05";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // VIEW 1: ACTIVE CHALLENGE MATCH
  if (isStarted) {
    if (!currentMatchQuestion) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-background font-sans text-foreground select-none">
          <div className="relative max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-lg overflow-hidden">
            <BorderBeam size={180} duration={8} />
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto animate-spin">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-foreground">Preparing Duel Arena...</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fetching and synchronizing challenge problems for room <span className="font-mono font-bold text-foreground">{roomCode}</span>.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Badge variant="outline" className="font-mono text-[11px]">
                Attempt {Math.min(httpPollAttemptsRef.current + 1, 10)}/10
              </Badge>
            </div>
            <Button
              onClick={() => {
                httpPollAttemptsRef.current = 0;
                fetchMatchStateHTTP(roomCode);
                socket.emit("sync_arena", { challengeId: roomCode });
                socket.emit("join_challenge", {
                  challengeId: roomCode,
                  userDetails: { name: getUserName() },
                  gameMode,
                  language: gameMode === "webdev_arena" ? "javascript" : langRef.current,
                  playerId: getPersistentPlayerId()
                });
              }}
              size="sm"
              className="mt-2 font-bold uppercase tracking-wider text-xs"
            >
              Retry Connection
            </Button>
          </div>
        </div>
      );
    }

    const isMeWinner = Boolean(
      winner &&
        ((winner.socketId && (winner.socketId === socket.id || winner.socketId === socketIdRef.current)) ||
          (winner.userDetails?.name && winner.userDetails.name === getUserName()) ||
          p1Score > p2Score)
    );

    return (
      <div className="h-full w-full flex flex-col overflow-hidden bg-background font-sans text-foreground select-none">
        {/* Top Arena Header: Scores & Controls */}
        <div className="h-14 px-4 sm:px-6 border-b border-border bg-card/95 backdrop-blur-xs flex items-center justify-between gap-4 shrink-0">
          {/* Left: Mode Badge & Room Code */}
          <div className="flex items-center gap-2.5">
            <Badge
              variant="secondary"
              className="font-sans font-semibold text-xs tracking-wider uppercase py-1 px-3 border border-border"
            >
              {gameMode === "webdev_arena" ? "Web Dev" : "DSA"}
            </Badge>

            <RoomCodeBadge code={roomCode} className="hidden sm:inline-flex" />
          </div>

          {/* Center: Live Tug-of-War Scoreboard */}
          <div className="flex-1 max-w-md mx-auto hidden md:block">
            <TugOfWarBar
              p1Name={getUserName()}
              p1Score={p1Score}
              p2Name={opponent?.userDetails?.name || "Opponent"}
              p2Score={p2Score}
              totalQuestions={totalQuestions}
              p2Status={opponentStatus}
            />
          </div>

          {/* Right: Language Dropdown & Code Reset */}
          <div className="flex items-center gap-2">
            {gameMode === "webdev_arena" ? (
              <Badge variant="secondary" className="font-sans font-semibold text-xs uppercase py-1 px-3 border border-border">
                {activeLang === "typescript" ? "TypeScript" : "JavaScript"}
              </Badge>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-sans font-semibold text-foreground cursor-pointer transition-colors shadow-2xs">
                    <span>
                      {language === "python"
                        ? "Python 3"
                        : language === "cpp"
                        ? "C++ (GCC)"
                        : language === "javascript"
                        ? "JavaScript"
                        : language === "java"
                        ? "Java"
                        : language}
                    </span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-card border-border">
                  {[
                    { id: "python", label: "Python 3" },
                    { id: "cpp", label: "C++ (GCC)" },
                    { id: "javascript", label: "JavaScript (Node.js)" },
                    { id: "java", label: "Java (OpenJDK)" }
                  ].map((lang) => (
                    <DropdownMenuItem
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id)}
                      className={cn(
                        "flex items-center justify-between text-xs font-sans font-medium py-1.5 cursor-pointer",
                        language === lang.id ? "text-primary font-bold bg-primary/10" : ""
                      )}
                    >
                      <span>{lang.label}</span>
                      {language === lang.id && <Check className="w-3.5 h-3.5 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={resetCurrentCode}
              title="Reset code template"
              className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground border-border"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Duel Area: Resizable Split Spec & Monaco Editor */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          {/* Winner Result Modal with Confetti & BorderBeam */}
          {winner && (
            <div className="absolute inset-0 z-40 bg-background/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
              {isMeWinner && <Confetti />}
              <div className="relative max-w-md w-full bg-card border border-border rounded-2xl p-7 shadow-2xl space-y-5 overflow-hidden">
                <BorderBeam
                  size={220}
                  duration={7}
                  colorFrom={isMeWinner ? "#fbbf24" : "#f43f5e"}
                  colorTo={isMeWinner ? "#10b981" : "#a855f7"}
                />

                <div
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md",
                    isMeWinner
                      ? "bg-amber-500/15 border-2 border-amber-500/30 text-amber-500"
                      : "bg-destructive/15 border-2 border-destructive/30 text-destructive"
                  )}
                >
                  <Trophy className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h2 className="font-display font-bold text-3xl tracking-tight text-foreground">
                    {isMeWinner ? "VICTORY ACHIEVED!" : "MATCH CONCLUDED"}
                  </h2>
                  <p className="font-sans text-sm text-muted-foreground">
                    Winner: <span className="font-semibold text-foreground">{winner.userDetails?.name || "Player"}</span>
                  </p>
                </div>

                {/* Score Comparison Display */}
                <div className="grid grid-cols-3 items-center gap-2 p-4 bg-secondary/60 rounded-xl border border-border/80">
                  <div className="text-center">
                    <span className="text-xs font-sans text-muted-foreground block uppercase font-medium">You</span>
                    <span className="font-display font-bold text-3xl text-emerald-500 tabular-nums">{p1Score}</span>
                  </div>
                  <div className="text-center font-display font-bold text-lg text-muted-foreground">
                    VS
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-sans text-muted-foreground block uppercase font-medium truncate">
                      {opponent?.userDetails?.name || "Rival"}
                    </span>
                    <span className="font-display font-bold text-3xl text-rose-500 tabular-nums">{p2Score}</span>
                  </div>
                </div>

                {/* Match Rewards & Rating Delta */}
                {matchReward && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold text-xs">
                        <Zap className="size-4 shrink-0" />
                        <span>+{matchReward.points} XP Earned</span>
                      </div>
                      <div
                        className={cn(
                          "flex items-center justify-center gap-1.5 p-2.5 rounded-xl border font-bold text-xs",
                          matchReward.ratingDelta >= 0
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                        )}
                      >
                        <Sparkles className="size-4 shrink-0" />
                        <span>
                          {matchReward.ratingDelta >= 0
                            ? `+${matchReward.ratingDelta} Rating`
                            : `${matchReward.ratingDelta} Rating`}
                        </span>
                      </div>
                    </div>

                    {matchReward.newBadges && matchReward.newBadges.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-amber-500/40 text-foreground text-xs text-center space-y-1">
                        <span className="font-extrabold uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1.5 text-[10px]">
                          <Sparkles className="w-3.5 h-3.5" />
                          New Duel Badge Unlocked!
                        </span>
                        {matchReward.newBadges.map((badge) => (
                          <div key={badge.id} className="font-semibold text-xs flex items-center justify-center gap-1.5">
                            <span>{badge.icon}</span>
                            <span>{badge.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleLeaveRoom}
                  className="w-full h-11 font-sans font-semibold text-sm uppercase tracking-wide bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Return to Lobby
                </Button>
              </div>
            </div>
          )}

          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            {/* Left Pane: Spec, Tests, Console with Shadcn Tabs */}
            <ResizablePanel defaultSize={45} minSize={32} maxSize={65} className="h-full bg-card flex flex-col overflow-hidden">
              <Tabs value={specTab} onValueChange={setSpecTab} className="h-full flex flex-col">
                {/* Spec Pane Header */}
                <div className="px-5 py-3 border-b border-border bg-card flex items-center justify-between shrink-0 gap-3">
                  {/* Question Count & Status Dots */}
                  <div className="flex items-center gap-2.5">
                    <span className="font-sans font-semibold text-xs uppercase tracking-wider text-primary">
                      Question {Math.min(p1Index + 1, totalQuestions)} of {totalQuestions}
                    </span>

                    <div className="flex gap-1.5 items-center">
                      {challengeState?.questions?.map((_, qIdx) => (
                        <div
                          key={qIdx}
                          title={`Question ${qIdx + 1}`}
                          className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all duration-300",
                            qIdx < p1Score
                              ? "bg-emerald-500 shadow-xs shadow-emerald-500/50"
                              : qIdx === p1Index
                              ? "bg-primary ring-2 ring-primary/40 scale-110"
                              : "bg-secondary border border-border"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Tabs Trigger List */}
                  <TabsList className="h-8 bg-secondary/80 p-0.5">
                    <TabsTrigger value="spec" className="font-sans text-xs px-3 py-1 font-semibold">
                      Problem
                    </TabsTrigger>
                    <TabsTrigger value="tests" className="font-sans text-xs px-3 py-1 font-semibold">
                      Sample Tests
                    </TabsTrigger>
                    <TabsTrigger value="console" className="font-sans text-xs px-3 py-1 font-semibold flex items-center gap-1.5">
                      <span>Console</span>
                      {output && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Spec Tabs Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
                  <TabsContent value="spec" className="m-0 space-y-4">
                    {/* Difficulty and Tag Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={
                          activeQuestionDifficulty === "HARD"
                            ? "destructive"
                            : activeQuestionDifficulty === "MEDIUM"
                            ? "warning"
                            : "success"
                        }
                        className="font-sans font-bold text-xs uppercase tracking-wide px-2.5 py-0.5"
                      >
                        {activeQuestionDifficulty}
                      </Badge>

                      {activeQuestionTags.map((t, idx) => (
                        <Badge key={idx} variant="secondary" className="font-sans text-xs font-medium">
                          #{t}
                        </Badge>
                      ))}
                    </div>

                    {/* Question Title */}
                    <h1 className="font-display font-bold text-xl leading-snug text-foreground tracking-tight">
                      {activeQuestionTitle}
                    </h1>

                    {/* Body Text / Description */}
                    <div className="font-sans font-normal text-sm sm:text-base leading-relaxed text-foreground/90 whitespace-pre-line">
                      {activeQuestionStatement || "Question specifications loaded."}
                    </div>

                    {activeSampleAssertion && (
                      <div className="pt-2 space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans block">
                          Assertion Preview
                        </label>
                        <pre className="p-3.5 bg-secondary/70 border border-border rounded-xl font-mono text-sm leading-normal text-primary overflow-x-auto whitespace-pre-wrap">
                          {activeSampleAssertion}
                        </pre>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="tests" className="m-0 space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans block">
                        Sample Assertions ({language})
                      </label>
                      {activeSampleAssertion && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(activeSampleAssertion);
                            setOutput("Sample assertion copied.");
                          }}
                          className="text-xs font-sans font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </button>
                      )}
                    </div>

                    <pre className="p-4 bg-zinc-950 text-cyan-300 border border-zinc-800 rounded-xl font-mono text-sm leading-normal overflow-x-auto whitespace-pre-wrap">
                      {activeSampleAssertion || "// No explicit sample assertion provided for this challenge."}
                    </pre>
                  </TabsContent>

                  <TabsContent value="console" className="m-0 space-y-3">
                    <div className="rounded-xl border border-border bg-zinc-950 overflow-hidden shadow-xs">
                      {/* Terminal Header */}
                      <div className="h-8 px-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between font-sans text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                          <span className="text-xs font-mono text-zinc-400 ml-2 font-medium">terminal.out</span>
                        </div>

                        {output && (
                          <button
                            onClick={() => setOutput("")}
                            className="text-xs font-sans text-zinc-400 hover:text-zinc-200 cursor-pointer font-medium"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Terminal Body */}
                      <div className="p-4 min-h-[140px] max-h-[260px] overflow-y-auto font-mono text-sm leading-normal">
                        {output ? (
                          output.includes("Evaluating") || output.includes("Executing") ? (
                            <div className="flex items-center gap-2 text-amber-400 font-mono text-sm leading-normal">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                              <span>{output}</span>
                            </div>
                          ) : output.includes("failed") || output.includes("Error") || output.includes("error") ? (
                            <div className="flex items-start gap-2 text-rose-400 font-mono text-sm leading-normal">
                              <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                              <span className="whitespace-pre-wrap font-mono text-sm leading-normal">{output}</span>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2 text-emerald-400 font-mono text-sm leading-normal">
                              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                              <span className="whitespace-pre-wrap font-mono text-sm leading-normal">{output}</span>
                            </div>
                          )
                        ) : (
                          <span className="text-zinc-500 italic font-mono text-sm leading-normal">
                            Run tests or submit solution to inspect real-time execution results.
                          </span>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </div>

                {/* Bottom Spec Actions Bar */}
                <div className="p-3.5 border-t border-border bg-card/95 backdrop-blur-xs flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    onClick={() => runCode(false)}
                    disabled={isRunning}
                    className="flex-1 font-sans text-xs font-semibold uppercase tracking-wider gap-1.5 h-9 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-primary" />
                    <span>Run Tests</span>
                  </Button>

                  <Button
                    onClick={() => runCode(true)}
                    disabled={isRunning}
                    className="flex-1 font-sans text-xs font-semibold uppercase tracking-wider gap-1.5 h-9 cursor-pointer bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Submit</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={skipQuestion}
                    disabled={isRunning}
                    className="font-sans text-xs font-semibold uppercase tracking-wider px-3 h-9 cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    Skip
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm("Surrender this duel? Your opponent will receive the victory.")) {
                        surrender();
                      }
                    }}
                    disabled={isRunning}
                    className="font-sans text-xs font-semibold uppercase tracking-wider px-3 h-9 cursor-pointer gap-1"
                  >
                    <Flag className="w-3 h-3" />
                    <span className="hidden sm:inline">Surrender</span>
                  </Button>
                </div>
              </Tabs>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors" />

            {/* Right Pane: Monaco Editor */}
            <ResizablePanel defaultSize={55} minSize={35} className="h-full bg-[#1e1e1e] flex flex-col overflow-hidden">
              <div className="h-9 px-4 bg-[#252526] border-b border-[#333333] flex items-center justify-between shrink-0">
                <span className="font-mono text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-primary" />
                  <span>Solution Editor &bull; {language.toUpperCase()}</span>
                </span>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    setOutput("Code copied to clipboard.");
                  }}
                  className="font-mono text-xs text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
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
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    );
  }

  // VIEW 2: LOBBY & VERSUS CARD (When Room is Active or Waiting)
  if (inRoom) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-background text-foreground select-none font-sans">
        <div className="relative w-full max-w-[360px] bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4 overflow-hidden">
          <BorderBeam size={180} duration={9} />

          {/* Lobby Main Title & Track */}
          <div className="text-center space-y-1 border-b border-border pb-3">
            <h1 className="font-display font-bold text-2xl tracking-tight text-foreground">
              {isReady ? "Match Launching" : "Matchmaking Lobby"}
            </h1>
            <p className="font-sans text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              {gameMode === "webdev_arena" ? "Web Dev Track" : "DSA Track"}
            </p>
          </div>

          {/* Room Code with OTP Display */}
          <div className="flex flex-col items-center gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-sans block text-center">
              ROOM CODE
            </label>
            <div className="flex justify-center">
              <OtpInput
                length={6}
                mode="alphanumeric"
                defaultValue={roomCode}
                disabled={true}
                label="Room Code"
              />
            </div>
          </div>

          {/* Opponent VS Me Card */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-sans block text-center">
              VERSUS MATCHUP
            </label>
            <div className="grid grid-cols-5 items-center p-3 rounded-xl bg-secondary/50 border border-border">
              {/* Player 1: Me */}
              <div className="col-span-2 flex flex-col items-center text-center">
                <Avatar className="w-12 h-12 border-2 border-primary/40 ring-4 ring-primary/10 mb-1.5">
                  <AvatarFallback className="bg-primary/15 text-primary font-display font-bold text-base">
                    {getUserName().substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="font-sans font-bold text-xs text-foreground truncate max-w-[100px]">
                  {getUserName()}
                </div>

                <span className="font-sans font-bold text-[10px] uppercase tracking-wide text-emerald-500 mt-0.5">
                  READY
                </span>
              </div>

              {/* Center VS Indicator */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-card border-2 border-border text-foreground font-display font-bold text-xs flex items-center justify-center shadow-xs">
                  VS
                </div>
              </div>

              {/* Player 2: Other Player */}
              <div className="col-span-2 flex flex-col items-center text-center">
                {isReady && opponent?.userDetails?.name ? (
                  <>
                    <Avatar className="w-12 h-12 border-2 border-rose-500/40 ring-4 ring-rose-500/10 mb-1.5">
                      <AvatarFallback className="bg-rose-500/15 text-rose-500 font-display font-bold text-base">
                        {opponent.userDetails.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="font-sans font-bold text-xs text-foreground truncate max-w-[100px]">
                      {opponent.userDetails.name}
                    </div>

                    <span className="font-sans font-bold text-[10px] uppercase tracking-wide text-rose-500 mt-0.5">
                      LOCKED IN
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground mb-1.5 bg-secondary/40 animate-pulse">
                      <Users className="w-5 h-5 opacity-60" />
                    </div>

                    <div className="font-sans font-bold text-xs text-muted-foreground truncate max-w-[100px]">
                      Waiting...
                    </div>

                    <span className="font-sans font-bold text-[10px] uppercase tracking-wide text-amber-500 mt-0.5">
                      SEARCHING
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 10-Second Countdown (Starts when 2 players connect) */}
          {isReady ? (
            <div className="relative p-4 rounded-xl bg-primary/10 border border-primary/25 flex flex-col items-center text-center space-y-1.5 shadow-xs overflow-hidden">
              <BorderBeam size={140} duration={6} />
              <div className="font-sans text-[11px] uppercase font-semibold text-primary tracking-wider">
                MATCH LAUNCHING IN
              </div>
              <div className="font-display font-bold text-4xl tracking-tight text-foreground tabular-nums">
                {countdown !== null ? `${countdown}s` : "10s"}
              </div>
              <div className="font-sans text-xs text-muted-foreground">
                Both coders ready. Synchronizing problem suite...
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-secondary/60 border border-border text-center font-sans text-xs text-muted-foreground">
              Share room code <strong className="font-mono text-foreground">{roomCode}</strong> with your competitor to begin.
            </div>
          )}

          {/* Cancel Button */}
          <Button
            variant="outline"
            onClick={handleLeaveRoom}
            className="w-full font-sans text-xs font-semibold uppercase tracking-wider text-destructive hover:bg-destructive/10 border-destructive/20 h-10 cursor-pointer"
          >
            Leave Room
          </Button>
        </div>
      </div>
    );
  }

  // VIEW 3: IDLE ARENA PLACEHOLDER (Configuration Selectors before entering queue)
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-background text-foreground select-none font-sans">
      <div className="relative max-w-sm w-full bg-card border border-border rounded-2xl p-6 space-y-5 shadow-xl overflow-hidden">
        <BorderBeam size={180} duration={10} />

        <div className="text-center space-y-1">
          <h2 className="font-bold text-xl tracking-tight text-foreground text-center mb-1">
            Create a 1v1 Challenge
          </h2>
          <p className="font-sans font-normal text-xs leading-relaxed text-muted-foreground text-center">
            Select your preferred track and number of questions to start a real-time coding duel.
          </p>
        </div>

        {/* Section: Select Track */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            SELECT TRACK
          </label>
          <SegmentedControl
            label="Track"
            options={[
              { value: "webdev_arena", label: "Web Dev" },
              { value: "dsa_sprint", label: "DSA" },
            ]}
            value={gameMode}
            onValueChange={(val) => {
              const mode = val as any;
              setGameMode(mode);
              if (mode === "webdev_arena") setLanguage("javascript");
              else if (mode === "dsa_sprint") setLanguage("python");
            }}
          />
        </div>

        {/* Section: Number of Questions */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            NUMBER OF QUESTIONS
          </label>
          <SegmentedControl
            label="Number of Questions"
            options={[
              { value: "3", label: "3" },
              { value: "5", label: "5" },
              { value: "8", label: "8" },
            ]}
            value={String(challengeConfig?.questionCount || 5)}
            onValueChange={(val) => {
              if (challengeConfig) challengeConfig.questionCount = parseInt(val);
            }}
          />
        </div>

        {/* Action Button: Create Room */}
        <button
          onClick={() => {
            const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            setRoomCode(newCode);
            setIsHost(true);
            setInRoom(true);
            setIsStarted(false);
            setCountdown(null);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("skillsphere_active_room", newCode);
            }
            if (onRoomCreated) onRoomCreated(newCode);

            socket.emit("join_challenge", {
              challengeId: newCode,
              userDetails: { name: getUserName() },
              gameMode,
              language: gameMode === "webdev_arena" ? "javascript" : language,
              playerId: getPersistentPlayerId(),
              questionCount: challengeConfig?.questionCount || 5,
            });
          }}
          className="w-full py-3.5 bg-[#00D2B4] text-black font-semibold rounded-xl hover:bg-[#00bda2] transition-colors duration-200 shadow-[0_4px_20px_rgba(0,210,180,0.2)] cursor-pointer text-xs sm:text-sm tracking-wide uppercase font-sans"
        >
          CREATE 1V1 ROOM
        </button>
      </div>
    </div>
  );
}
