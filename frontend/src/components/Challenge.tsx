import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
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
      nickname: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "Player"
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
  title: string;
  description: string;
  category?: string;
  difficulty?: string;
  initialCode?: {
    [key: string]: string;
  };
  languages?: {
    [key: string]: {
      starterCode?: string;
      sampleTests?: string;
    };
  };
}

interface ChallengeState {
  players: Player[];
  questions?: Question[];
}

interface ChallengeProps {
  setMode?: (mode: string) => void;
}

export default function Challenge({ setMode }: ChallengeProps = {}) {
	const navigate = useNavigate();
	const [language, setLanguage] = useState<string>("python");
	const [code, setCode] = useState<string>("");
	const [output, setOutput] = useState<string>("");
	const [isRunning, setIsRunning] = useState<boolean>(false);
	const [opponentStatus, setOpponentStatus] = useState<string>("");
	const typingTimeoutRef = useRef<any>(null);
	
	const [challengeState, setChallengeState] = useState<ChallengeState | null>(null);
	const [isReady, setIsReady] = useState<boolean>(false);
	const [isStarted, setIsStarted] = useState<boolean>(false);
	const [winner, setWinner] = useState<Player | null>(null);
	
	const [roomCode, setRoomCode] = useState<string>("");
	const [joinCodeInput, setJoinCodeInput] = useState<string>("");
	const [inRoom, setInRoom] = useState<boolean>(false);
	const [isHost, setIsHost] = useState<boolean>(false);
	const [socketId, setSocketId] = useState<string>(socket.id || "");

	const getUserName = () => auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "Player";

	const stateRef = useRef({ inRoom, isStarted, winner, roomCode });
	const codeRef = useRef(code);
	const langRef = useRef(language);
	
	useEffect(() => {
		const handleSocketConnect = () => {
			setSocketId(socket.id || "");
		};
		socket.on("connect", handleSocketConnect);
		if (socket.id) {
			setSocketId(socket.id);
		}
		return () => {
			socket.off("connect", handleSocketConnect);
		};
	}, []);

	useEffect(() => {
		stateRef.current = { inRoom, isStarted, winner, roomCode };
	}, [inRoom, isStarted, winner, roomCode]);

	useEffect(() => {
		codeRef.current = code;
		langRef.current = language;
	}, [code, language]);

	// Auto-reconnect / rejoin room on socket reconnect
	useEffect(() => {
		const handleConnect = () => {
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
		return () => {
			socket.off("connect", handleConnect);
		};
	}, []);

	const lastTypingEmitRef = useRef<number>(0);

	useEffect(() => {
		socket.on("challenge_state", (state: ChallengeState) => {
			setChallengeState(state);

			if (state?.players && state.players.length >= 2) {
				setIsReady(true);
			} else {
				setIsReady(false);
			}

			if ((state as any)?.status === "started" || (state as any)?.status === "in_progress") {
				setIsStarted(true);
			}
			
			const myPlayer = state?.players?.find(p => 
				(socket.id && p.socketId === socket.id) || 
				(p.userDetails?.name && p.userDetails.name === getUserName())
			);
			if (myPlayer && state.questions) {
			    const currentIndex = myPlayer.currentIndex || myPlayer.score || 0;
			    if (state.questions.length > currentIndex) {
			        const currentQ = state.questions[currentIndex];
			        if (!codeRef.current) {
			            const starter = currentQ?.languages?.[langRef.current]?.starterCode || currentQ?.initialCode?.[langRef.current];
			            if (starter) {
			                setCode(starter);
			            }
			        }
			    }
			}
		});

		socket.on("challenge_ready", () => {
			setIsReady(true);
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
			    setCode(""); // reset code for next question
			}
		});

		socket.on("opponent_typing", () => {
			setOpponentStatus("Typing...");
			clearTimeout(typingTimeoutRef.current);
			typingTimeoutRef.current = setTimeout(() => setOpponentStatus(""), 2000);
		});

		socket.on("opponent_running", () => {
			setOpponentStatus("Running code...");
		});

		socket.on("error", ({ message }: { message: string }) => {
			if (message) {
				alert(message);
			}
		});

		return () => {
			socket.off("challenge_state");
			socket.off("challenge_ready");
			socket.off("challenge_started");
			socket.off("challenge_end");
			socket.off("code_result");
			socket.off("opponent_typing");
			socket.off("opponent_running");
			socket.off("error");
		};
	}, []); 

	const handleCodeChange = (newCode: string) => {
		setCode(newCode);
		const now = Date.now();
		if (roomCode && now - lastTypingEmitRef.current > 1000) {
			lastTypingEmitRef.current = now;
			socket.emit("typing", { challengeId: roomCode });
		}
	};

	const handleLanguageChange = (newLang: string) => {
		setLanguage(newLang);
		const myPlayer = challengeState?.players?.find(p => p.socketId === socket.id);
		if (myPlayer && challengeState?.questions) {
		    const currentIndex = myPlayer.currentIndex || myPlayer.score || 0;
			if (challengeState.questions.length > currentIndex) {
				const currentQ = challengeState.questions[currentIndex];
				const starter = currentQ?.languages?.[newLang]?.starterCode || currentQ?.initialCode?.[newLang];
				if (starter) {
					setCode(starter);
				}
			}
		}
	};

	const createRoom = () => {
		const codeStr = Math.random().toString(36).substring(2, 8).toUpperCase();
		setRoomCode(codeStr);
		socket.emit("join_challenge", { 
			challengeId: codeStr, 
			userDetails: { name: getUserName() }, 
			language,
			playerId: getPersistentPlayerId()
		});
		setIsHost(true);
		setInRoom(true);
	};

	const joinRoom = () => {
		if (joinCodeInput) {
			const cleanCode = joinCodeInput.trim().toUpperCase();
			setRoomCode(cleanCode);
			socket.emit("join_challenge", { 
				challengeId: cleanCode, 
				userDetails: { name: getUserName() }, 
				language,
				playerId: getPersistentPlayerId()
			});
			setIsHost(false);
			setInRoom(true);
		}
	};
	
	const discardRoom = () => {
		socket.emit("leave_challenge", { challengeId: roomCode });
		setInRoom(false);
		setRoomCode("");
		setIsHost(false);
		setIsReady(false);
		setIsStarted(false);
		setChallengeState(null);
	};

	const startChallenge = () => {
		if (isReady && isHost) {
			socket.emit("start_challenge", { challengeId: roomCode });
		}
	};

	const runCode = (isSubmit: boolean) => {
		if (!code.trim() || isRunning) return;
		setIsRunning(true);
		setOutput(isSubmit ? "Evaluating against all test cases..." : "Running sample test case...");
		socket.emit("code_submitted", { 
			challengeId: roomCode, 
			code, 
			language,
			isSubmit
		});
	};

	const skipQuestion = () => {
		socket.emit("skip_question", { challengeId: roomCode });
	};

	const surrender = () => {
		if (window.confirm("Are you sure you want to surrender? Your opponent will win immediately.")) {
			socket.emit("surrender", { challengeId: roomCode });
		}
	};

	const myName = getUserName();
	const myPlayer = challengeState?.players?.find(
		(p) =>
			(socketId && p.socketId === socketId) ||
			(socket.id && p.socketId === socket.id) ||
			(p.userDetails?.name && p.userDetails.name === myName)
	);
	const opponent = challengeState?.players?.find((p) => p !== myPlayer);

	const p1Score = myPlayer?.score || 0;
	const p2Score = opponent?.score || 0;
	
	const p1Index = myPlayer?.currentIndex ?? p1Score;
	
	const currentQuestion = challengeState?.questions?.[p1Index];

	if (!inRoom) {
		return (
			<div className="h-full w-full bg-[#0a0a0a] text-white flex flex-col items-center justify-center font-sans relative overflow-hidden">
				<div className="absolute w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
				
				<div className="relative z-10 bg-white/5 backdrop-blur-xl p-10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 w-[420px] text-center">
					<h2 className="text-3xl font-extrabold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Battle Arena</h2>
					<p className="text-gray-400 text-sm mb-6">Create or join a 1v1 challenge room</p>

					<div className="flex justify-center items-center gap-2 mb-6 p-1 bg-black/40 rounded-xl border border-white/10">
						<button
							type="button"
							onClick={() => setLanguage("python")}
							className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
								language === "python" ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "text-gray-400 hover:text-white"
							}`}
						>
							Python 3
						</button>
						<button
							type="button"
							onClick={() => setLanguage("cpp")}
							className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
								language === "cpp" ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "text-gray-400 hover:text-white"
							}`}
						>
							C++ (GCC)
						</button>
					</div>
					
					<button onClick={createRoom} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 rounded-xl font-bold mb-6 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all transform hover:-translate-y-1 cursor-pointer">
						CREATE A ROOM
					</button>

					<div className="flex items-center gap-3 mb-6">
						<div className="h-px bg-white/10 flex-1"></div>
						<span className="text-gray-500 text-xs font-semibold tracking-wider">OR</span>
						<div className="h-px bg-white/10 flex-1"></div>
					</div>

					<input 
						type="text" 
						placeholder="Enter Room Code" 
						value={joinCodeInput} 
						onChange={(e) => setJoinCodeInput(e.target.value)}
						className="w-full bg-black/40 border border-white/10 text-white px-4 py-3.5 rounded-xl mb-4 text-center text-lg uppercase tracking-widest focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600 placeholder:normal-case placeholder:tracking-normal"
					/>
					<button onClick={joinRoom} className="w-full bg-white/10 text-white py-3.5 rounded-xl font-bold hover:bg-white/20 transition-all border border-white/5 cursor-pointer">
						JOIN ROOM
					</button>
				</div>
			</div>
		)
	}

	if (!isStarted) {
		return (
			<div className="h-full w-full bg-[#0a0a0a] text-white flex flex-col items-center justify-center font-sans relative overflow-hidden">
				<div className="absolute w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
				
				<div className="relative z-10 w-[800px] flex flex-col items-center">
					<h1 className="text-4xl font-extrabold mb-2 tracking-tight">Waiting Room</h1>
					
					<div className="bg-black/40 border border-white/10 rounded-2xl p-6 mb-12 flex items-center gap-6">
						<span className="text-gray-400">Room Code:</span>
						<span className="text-3xl font-mono tracking-widest font-bold text-white">{roomCode}</span>
						<div className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-mono font-bold tracking-wider text-blue-400 uppercase">
							{language === "cpp" ? "C++ (GCC)" : "Python 3"}
						</div>
						<a 
							href={`https://api.whatsapp.com/send?text=Join my SkillSphere 1v1 challenge! Room Code: ${roomCode}`} 
							target="_blank" 
							rel="noreferrer"
							className="bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg font-bold hover:bg-green-500/30 transition-colors no-underline text-sm cursor-pointer"
						>
							Share
						</a>
					</div>
					
					<div className="flex justify-center items-center w-full gap-16 mb-16">
						<div className="flex flex-col items-center gap-4">
							<div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
								<div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center text-4xl font-bold">
									{(myPlayer?.userDetails?.name || myName)?.[0]?.toUpperCase() || "Y"}
								</div>
							</div>
							<span className="text-xl font-semibold">You ({myPlayer?.userDetails?.name || myName})</span>
						</div>
						
						<div className="text-3xl font-black text-gray-600 italic">VS</div>
						
						<div className="flex flex-col items-center gap-4">
							<div className={`w-32 h-32 rounded-full p-1 transition-all duration-500 ${isReady && opponent ? 'bg-gradient-to-br from-red-500 to-orange-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'border-2 border-dashed border-gray-600'}`}>
								<div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center text-4xl font-bold text-gray-600">
									{isReady && opponent ? <span className="text-white">{(opponent?.userDetails?.name || "Opponent")?.[0]?.toUpperCase()}</span> : "?"}
								</div>
							</div>
							<span className={`text-xl font-semibold ${isReady && opponent ? 'text-white' : 'text-gray-500 animate-pulse'}`}>
								{isReady && opponent ? (opponent?.userDetails?.name || "Opponent") : "Waiting..."}
							</span>
						</div>
					</div>
					
					<div className="flex gap-4">
						<button 
							onClick={discardRoom}
							className="px-8 py-4 rounded-xl font-bold tracking-widest text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer border border-red-500/30"
						>
							DISCARD & LEAVE
						</button>
						{isHost ? (
							<button 
								onClick={startChallenge} 
								disabled={!isReady}
								className={`px-12 py-4 rounded-xl font-extrabold tracking-widest text-lg transition-all duration-300 ${isReady ? 'bg-white text-black hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.4)] cursor-pointer' : 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/5'}`}
							>
								{isReady ? 'START CHALLENGE' : 'WAITING...'}
							</button>
						) : (
							<div className="px-12 py-4 rounded-xl font-extrabold tracking-widest text-lg bg-white/10 text-gray-400 border border-white/5 text-center">
								{isReady ? 'WAITING FOR HOST' : 'WAITING...'}
							</div>
						)}
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="h-full w-full bg-[#0a0a0a] text-white flex flex-col font-sans">
			
			<div className="px-8 py-5 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md z-10 relative">
				
				<div className="flex items-center gap-6 w-[40%]">
					<div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(37,99,235,0.5)]">
						{(myPlayer?.userDetails?.name || myName)?.[0]?.toUpperCase() || "Y"}
					</div>
					<div className="flex-1">
						<div className="flex justify-between items-end mb-2">
							<span className="font-bold tracking-wide">You ({myPlayer?.userDetails?.name || myName})</span>
							<span className="text-sm text-blue-400 font-bold">{p1Score}/10</span>
						</div>
						<div className="flex gap-1.5">
							{[...Array(10)].map((_, i) => (
								<div key={i} className={`h-2 flex-1 rounded-sm transition-all duration-300 
									${i < p1Score ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : 
									i === p1Score ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse" : 
									"bg-white/10"}`}></div>
							))}
						</div>
					</div>
				</div>

				<div className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-gray-300 to-gray-600">VS</div>

				<div className="flex items-center gap-6 w-[40%] flex-row-reverse">
					<div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(220,38,38,0.5)] relative">
						{(opponent?.userDetails?.name || "Opponent")[0]?.toUpperCase() || "O"}
					</div>
					<div className="flex-1">
						<div className="flex justify-between items-end mb-2 flex-row-reverse">
							<span className="font-bold tracking-wide">{opponent?.userDetails?.name || "Opponent"}</span>
							<span className="text-sm text-red-400 font-bold">{p2Score}/10</span>
						</div>
						<div className="flex gap-1.5 flex-row-reverse">
							{[...Array(10)].map((_, i) => (
								<div key={i} className={`h-2 flex-1 rounded-sm transition-all duration-300 
									${i < p2Score ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : 
									i === p2Score ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse" : 
									"bg-white/10"}`}></div>
							))}
						</div>
						<div className="text-xs text-yellow-400 text-right h-4 mt-1 italic opacity-80">
							{opponentStatus}
						</div>
					</div>
				</div>

			</div>

			<div className="flex flex-1 overflow-hidden relative">
				{winner && (
					<div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
						<h1 className="text-6xl font-black mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">CHALLENGE OVER</h1>
						<p className="text-2xl text-gray-300 mb-8">Winner: {winner.userDetails?.name || `Player`}</p>
						<button onClick={() => {
							setInRoom(false);
							setIsStarted(false);
							setWinner(null);
							navigate("/");
						}} className="px-8 py-3 bg-white text-black rounded-lg font-bold hover:scale-105 transition-transform cursor-pointer">HOME</button>
					</div>
				)}

				<div className="w-[45%] p-8 overflow-y-auto border-r border-white/5 bg-[#0d0d0d] relative flex flex-col">
					<div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]"></div>
					
					<div className="flex justify-between items-center mb-6">
						<div className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold tracking-widest">QUESTION {p1Index + 1}</div>
					</div>

					<h1 className="text-3xl font-extrabold mb-4 tracking-tight">{currentQuestion?.title || "Loading..."}</h1>
					
					<div className="flex gap-2 mb-6">
						{currentQuestion?.difficulty && (
							<span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
								currentQuestion.difficulty === 'HARD' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
								currentQuestion.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
								'bg-green-500/20 text-green-400 border border-green-500/30'
							}`}>
								{currentQuestion.difficulty}
							</span>
						)}
						{currentQuestion?.category && (
							<span className="px-2.5 py-0.5 rounded text-xs font-medium bg-white/5 text-gray-400 border border-white/10">
								{currentQuestion.category}
							</span>
						)}
					</div>

					<div className="prose prose-invert max-w-none text-gray-300 leading-relaxed space-y-4 flex-1">
						<div className="whitespace-pre-line">{currentQuestion?.description || "Waiting for question data..."}</div>
						{currentQuestion?.languages?.[language]?.sampleTests && (
							<div className="mt-4 p-3 bg-black/50 border border-white/10 rounded-lg">
								<div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-gray-400 mb-1">
									Sample Assertion ({language}):
								</div>
								<pre className="text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap m-0">
									{currentQuestion.languages[language].sampleTests}
								</pre>
							</div>
						)}
					</div>
					
					{output && (
						<div className="mb-8 p-4 rounded bg-[#151515] border border-white/10 text-sm font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
							<span className={output.includes("Running") || output.includes("Evaluating") ? "text-yellow-400" : output.includes("Failed") || output.includes("Error") ? "text-red-400" : "text-green-400"}>
								{output}
							</span>
						</div>
					)}
					
					<div className="mt-auto mb-16 flex gap-4">
						<button
							className={`flex-1 bg-[#1a1a1a] border border-[#333] text-white py-4 rounded-xl text-sm font-bold transition-colors cursor-pointer ${isRunning ? 'opacity-50 pointer-events-none' : 'hover:bg-[#222]'}`}
							onClick={skipQuestion}
							disabled={isRunning}
						>
							SKIP
						</button>
						<button
							className={`flex-1 bg-[#222] text-white py-4 rounded-xl text-sm font-bold transition-colors cursor-pointer ${isRunning ? 'opacity-50 pointer-events-none' : 'hover:bg-[#333]'}`}
							onClick={() => runCode(false)}
							disabled={isRunning}
						>
							RUN CODE
						</button>
						<button
							className={`flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white py-4 rounded-xl text-sm font-bold transition-all transform cursor-pointer ${isRunning ? 'opacity-50 pointer-events-none' : 'hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'}`}
							onClick={() => runCode(true)}
							disabled={isRunning}
						>
							SUBMIT SOLUTION
						</button>
					</div>

					<div className="absolute bottom-6 right-8">
						<button onClick={surrender} className="text-xs text-gray-500 hover:text-red-400 transition-colors cursor-pointer underline">
							Surrender Match
						</button>
					</div>
				</div>

				<div className="w-[55%] flex flex-col h-full bg-[#1e1e1e]">          
					<CodeEditor code={code} language={language} onChange={handleCodeChange} onLanguageChange={handleLanguageChange} />
				</div>

			</div>
		</div>
	);
}
