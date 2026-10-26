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
		<div className="w-screen h-full bg-[#121212] flex justify-center items-center p-0">
			{mode === "main" && <div className="flex-1 h-full bg-[#121212] text-white p-8 box-border flex flex-col gap-6 font-sans overflow-y-auto">Hello this is Battleground u must fight enough </div>}

			{mode === "practice" && <Practice setMode={setMode} quizConfig={quizConfig} />}
			{mode === "quest" && <QuestArena />}
			{mode === "challenge" && <Challenge setMode={setMode} />}

			{mode === "session" && selectedSessionId && (<SessionDetails sessionId={selectedSessionId} setMode={setMode} />)}
			<Sidebar mode={mode} setMode={setMode} setSelectedSessionId={setSelectedSessionId} quizConfig={quizConfig} setQuizConfig={setQuizConfig} />
		</div>
	);
}
