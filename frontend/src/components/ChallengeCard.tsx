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
		<div className="flex justify-center items-center h-screen bg-[#0f172a] font-sans overflow-hidden">
			<div className="bg-[#1e293b] text-[#f8fafc] w-full max-w-[520px] h-full flex flex-col justify-between p-6">
				<div>
					<h2 className="text-[20px] font-bold mb-6">Challenge Someone</h2>

					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<label className="text-[12px] text-[#94a3b8] uppercase tracking-[0.5px] font-bold">
								GAME TYPE
							</label>

							<div className="grid grid-cols-2 gap-3">
								<button
									className={`py-3 rounded text-[14px] font-bold transition-all duration-200 w-full ${gameType === "MCQ"
										? "bg-[#0f172a] border-2 border-blue-500 text-white"
										: "bg-[#0f172a] border-2 border-transparent text-[#cbd5e1]"
										}`}
									onClick={() => setGameType("MCQ")}
								>
									MCQ
								</button>

								<button
									className={`py-3 rounded text-[14px] font-bold transition-all duration-200 w-full ${gameType === "CODE"
										? "bg-[#0f172a] border-2 border-blue-500 text-white"
										: "bg-[#0f172a] border-2 border-transparent text-[#cbd5e1]"
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
					<button onClick={() => { setMode("challenge"); handleCreateChallenge(); }} className="w-full py-4 rounded-md text-[15px] font-bold bg-[#334155] text-[#cbd5e1] hover:bg-[#475569] transition">
						CREATE CHALLENGE
					</button>
					{joinCode && (
						<div className="flex justify-center mt-3">
							<div className="bg-white text-black px-6 py-3  border-gray-300 shadow-md text-xl font-semibold tracking-[0.4em] font-mono">
								{joinCode}
							</div>
						</div>
					)}
					<button onClick={() => setMode("challenge")} className="w-full py-4 rounded-md text-[15px] font-bold bg-blue-600 text-white hover:bg-blue-500 transition">
						JOIN A CHALLENGE
					</button>

					<button className="w-full py-4 rounded-md text-[15px] font-bold bg-blue-600 text-white hover:bg-blue-500 transition">
						START GAME
					</button>
					<div className="flex flex-col gap-2">
						<label className="text-[12px] text-[#94a3b8] uppercase tracking-[0.5px] font-bold">
							OPPONENT
						</label>
						<input
							type="text"
							placeholder="Enter username or leave empty for anyone"
							className="bg-[#0f172a] border-2 border-transparent text-white p-3 rounded text-[14px] outline-none focus:border-blue-500 w-full"
						/>
					</div>
					{errorMessage && (
						<p style={{ color: 'red' }}>{errorMessage}</p>
					)}
					
					{!opponent ? (
						<div className="mt-4 text-yellow-400 text-sm">
							Waiting for opponent...
						</div>
					) : (
						<div className="mt-4 text-green-400 text-sm">
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
