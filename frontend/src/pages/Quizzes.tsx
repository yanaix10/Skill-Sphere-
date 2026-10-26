import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import SessionDetails from "../components/SessionDetails";
import Practice from "./Practice";
import QuestArena from "../components/QuestArena";
import Challenge from "../components/Challenge";

interface QuizConfig {
  difficulty: string;
  limit: string;
  category: string;
}

export default function Quizzes(): React.ReactElement {
	const [mode, setMode] = useState<string>('main');
	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
	const [quizConfig, setQuizConfig] = useState<QuizConfig>({
		difficulty: 'Medium',
		limit: '10',
		category: 'DevOps'
	});

	return (
		<div className="w-full h-full bg-background text-foreground flex justify-center items-center p-0 transition-colors duration-200">
			{mode === "main" && (
				<div className="flex-1 h-full bg-background text-foreground p-8 box-border flex flex-col items-center justify-center gap-6 font-sans overflow-y-auto">
					<div className="max-w-md w-full text-center p-8 rounded-2xl bg-card border border-border shadow-sm">
						<div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-2xl font-black">
							⚔️
						</div>
						<h2 className="text-2xl font-bold tracking-tight mb-2">Battleground & Quizzes</h2>
						<p className="text-sm text-muted-foreground mb-6">
							Select a quiz configuration or launch a 1v1 rapid-fire challenge from the sidebar to test your skills.
						</p>
						<div className="flex flex-col gap-2.5">
							<button
								onClick={() => setMode("practice")}
								className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
							>
								Start Practice Quiz
							</button>
							<button
								onClick={() => setMode("challenge")}
								className="w-full py-3 px-4 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm hover:bg-secondary/80 border border-border transition-all cursor-pointer"
							>
								1v1 Arena Duel
							</button>
						</div>
					</div>
				</div>
			)}

			{mode === "practice" && <Practice setMode={setMode} quizConfig={quizConfig} />}
			{mode === "quest" && <QuestArena />}
			{mode === "challenge" && <Challenge setMode={setMode} />}

			{mode === "session" && selectedSessionId && (<SessionDetails sessionId={selectedSessionId} setMode={setMode} />)}
			<Sidebar mode={mode} setMode={setMode} setSelectedSessionId={setSelectedSessionId} quizConfig={quizConfig} setQuizConfig={setQuizConfig} />
		</div>
	);
}
