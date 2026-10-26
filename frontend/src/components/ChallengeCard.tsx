import React, { useState } from "react";
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from "../utils/api";

interface ChallengeCardProps {
  setMode: (mode: string) => void;
}

interface Opponent {
  id: string;
  name?: string;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ setMode }) => {
	const { currentUser } = useAuth();
	console.log("Auth Check: Who is logged in?", currentUser);
	const [gameType, setGameType] = useState<string>("MCQ");
	const [joinCode, setJoinCode] = useState<string | null>(null);
	const [opponent, setOpponent] = useState<Opponent | null>(null);
	const [errorMessage, setErrorMessage] = useState<string>("");

	const handleCreateChallenge = async () => {
		try {
			if (!currentUser) {
				alert("You must be logged in to join a challenge!");
				return;
			}
			const payload = { userId: currentUser.uid };
			const response = await axios.post(`${BACKEND_URL}/api/challenge/create`, payload);
			const codeFromServer = response.data.joinCode;
			console.log(codeFromServer);
			setJoinCode(codeFromServer);
			setErrorMessage("");
		} catch (error: any) {
			const msg = error.response?.data?.message || "Server connection failed";
			setErrorMessage(msg);
		}
	};

	const handleJoinChallenge = async () => {
		try {
			if (!currentUser) {
				alert("You must be logged in to join a challenge!");
				return;
			}
			const payload = { userId: currentUser.uid };
			await axios.post(`${BACKEND_URL}/api/challenge/${joinCode}/join`, payload);
		} catch (error) {
			console.error("Join error:", error);
		}
	}

	return (
		<div className="flex justify-center items-center h-full bg-background font-sans overflow-hidden text-foreground transition-colors duration-200">
			<div className="bg-card text-card-foreground w-full max-w-[520px] h-full flex flex-col justify-between p-6 border border-border rounded-xl shadow-sm">
				<div>
					<h2 className="text-lg font-bold mb-6 text-foreground">Challenge Someone</h2>

					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
								GAME TYPE
							</label>

							<div className="grid grid-cols-2 gap-3">
								<button
									className={`py-3 rounded-lg text-xs font-bold transition-all duration-200 w-full cursor-pointer border ${gameType === "MCQ"
										? "bg-primary text-primary-foreground border-primary shadow-sm"
										: "bg-secondary border-border text-secondary-foreground hover:bg-secondary/80"
										}`}
									onClick={() => setGameType("MCQ")}
								>
									MCQ
								</button>

								<button
									className={`py-3 rounded-lg text-xs font-bold transition-all duration-200 w-full cursor-pointer border ${gameType === "CODE"
										? "bg-primary text-primary-foreground border-primary shadow-sm"
										: "bg-secondary border-border text-secondary-foreground hover:bg-secondary/80"
										}`}
									onClick={() => setGameType("CODE")}
								>
									CODE
								</button>
							</div>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-3 mt-4">
					<button onClick={() => { setMode("challenge"); handleCreateChallenge(); }} className="w-full py-3.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm cursor-pointer">
						CREATE CHALLENGE
					</button>
					{joinCode && (
						<div className="flex justify-center mt-3">
							<div className="bg-secondary text-foreground px-6 py-3 border border-border rounded-lg shadow-sm text-lg font-semibold tracking-[0.4em] font-mono">
								{joinCode}
							</div>
						</div>
					)}
					<button onClick={() => setMode("challenge")} className="w-full py-3.5 rounded-lg text-xs font-bold bg-secondary border border-border text-secondary-foreground hover:bg-secondary/80 transition cursor-pointer">
						JOIN A CHALLENGE
					</button>

					<div className="flex flex-col gap-2 mt-2">
						<label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
							OPPONENT
						</label>
						<input
							type="text"
							placeholder="Enter username or leave empty for anyone"
							className="bg-secondary border border-border text-foreground p-3 rounded-lg text-xs outline-none focus:border-primary w-full"
						/>
					</div>
					{errorMessage && (
						<p className="text-destructive text-xs font-semibold">{errorMessage}</p>
					)}
					
					{!opponent ? (
						<div className="mt-4 text-amber-500 text-xs font-medium">
							Waiting for opponent...
						</div>
					) : (
						<div className="mt-4 text-green-500 text-xs font-medium">
							Opponent Joined: {opponent.name || opponent.id}
						</div>
					)}
					{currentUser ? (
						<p className="text-green-400">✅ Logged in! Your UID is: {currentUser.uid}</p>
					) : (
						<p className="text-red-400">❌ Not logged in right now.</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default ChallengeCard;
