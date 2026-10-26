import React, { useState } from "react";
import QuizType from "./QuizType";
import ChallengeCard from "./ChallengeCard";
import Tournaments from "./Tournaments";
import Sessions from "./Sessions";
import Coders from "./Coders";

interface QuizConfig {
  category: string;
  limit: string;
  difficulty: string;
}

interface SidebarProps {
  mode: string;
  setMode: (mode: string) => void;
  setSelectedSessionId: (id: string | null) => void;
  quizConfig: QuizConfig;
  setQuizConfig: React.Dispatch<React.SetStateAction<QuizConfig>> | ((config: QuizConfig) => void);
}

const Sidebar: React.FC<SidebarProps> = ({ mode, setMode, setSelectedSessionId, quizConfig, setQuizConfig }) => {
	const [activeTab, setActiveTab] = useState<string>("+ Code");
	const [currentView, setCurrentView] = useState<string>("main");
	const [isExpanded, setIsExpanded] = useState<boolean>(false);

	const isSessionActive = mode !== "main";

	return (
		<div className="w-[30vw] h-full bg-[#121212] border-l border-[#2a2a2a] flex flex-col font-sans text-white box-border">
			<div className="flex border-b border-[#2a2a2a] bg-[#181818]">
				{["+ Code", "Sessions", "Coders"].map((tab) => (
					<button
						key={tab}
						className={`flex-1 py-4 bg-transparent border-none border-b-2 text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-[#222222] ${activeTab === tab
							? "text-white border-[#3b82f6]"
							: "text-[#888888] border-transparent hover:text-[#e0e0e0]"
							}`}
						onClick={() => {
							if (isSessionActive) {
								alert("Please complete or quit the active session before switching tabs.");
								return;
							}
							setActiveTab(tab);
							setCurrentView("main");
						}}
					>
						{tab}
					</button>
				))}
			</div>

			<div className="tab-content flex-1 overflow-y-auto  ">
				{activeTab === "Sessions" && <Sessions setSelectedSessionId={setSelectedSessionId} setMode={setMode} />}
				{activeTab === "Coders" && <Coders />}

				{activeTab === "+ Code" && (
					<>
						{currentView === "main" ? (
							<div className="main-code-view">

								<div
									className={`flex justify-between items-center h-[50px] mx-5 my-[15px] rounded px-4 text-base font-bold tracking-[0.5px] transition-all duration-300 ${isSessionActive ? "bg-[#1f2937]/50 opacity-65 cursor-not-allowed" : "bg-[#1f2937] cursor-pointer hover:bg-[#374151]"}`}
									onClick={() => {
										if (isSessionActive) return;
										setIsExpanded(!isExpanded);
									}}
								>
									<div className="flex items-center gap-2">
										<span>{quizConfig.category}</span> <span className="text-[#6b7280]">•</span> <span>{quizConfig.limit} Qs</span> <span className="text-[#6b7280]">•</span> <span className="text-red-500 uppercase">{quizConfig.difficulty}</span>
										{isSessionActive && <span className="text-xs text-gray-500 italic ml-2">(Locked)</span>}
									</div>
									{!isSessionActive && <div className={`transition-transform duration-300 ease-in text-[#989795] ${isExpanded ? "rotate-180" : ""}`}>▼</div>}
								</div>

								<div className={`grid transition-all duration-300 ease-out overflow-hidden ${isExpanded && !isSessionActive ? "[grid-template-rows:1fr] opacity-100 visible" : "[grid-template-rows:0fr] opacity-0 invisible"}`}>
									<div className="min-h-0 pb-[15px] px-5"><QuizType quizConfig={quizConfig} setQuizConfig={setQuizConfig} disabled={isSessionActive} /></div>
								</div>

								<div className="flex flex-col gap-3 p-5 mt-[10px]">
									{isSessionActive ? (
										<button
											onClick={() => {
												if (confirm("Are you sure you want to quit the active session? Your progress will not be saved.")) {
													setMode("main");
												}
											}}
											className="w-full p-[14px] rounded-md text-sm font-bold tracking-[1px] cursor-pointer border-none transition-transform duration-100 ease-in active:scale-[0.98] bg-red-600 text-white shadow-[0_4px_14px_rgba(220,38,38,0.3)] hover:bg-red-700"
										>
											QUIT SESSION
										</button>
									) : (
										<>
											<button onClick={() => setMode("practice")} className="w-full p-[14px] rounded-md text-sm font-bold tracking-[1px] cursor-pointer border-none transition-transform duration-100 ease-in active:scale-[0.98] bg-blue-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:bg-blue-700">START QUIZ</button>
											<button
												className="w-full p-[14px] rounded-md text-sm font-bold tracking-[1px] cursor-pointer transition-transform duration-100 ease-in active:scale-[0.98] bg-[#2a2a2a] text-white hover:bg-[#333333] border-none"
												onClick={() => {
													setMode("challenge");
												}}
											>
												1V1 CHALLENGE
											</button>
											<button onClick={() => alert('Future scope')} className="w-full p-[14px] rounded-md text-sm font-bold tracking-[1px] cursor-pointer transition-transform duration-100 ease-in active:scale-[0.98] bg-[#2a2a2a] text-white hover:bg-[#333333] border-none">CODE A FRIEND</button>
											<button
												className="w-full p-[14px] rounded-md text-sm font-bold tracking-[1px] cursor-pointer transition-all duration-100 ease-in active:scale-[0.98] bg-transparent border border-[#444444] text-[#a3a3a3] hover:border-white hover:text-white"
												onClick={() => alert('Future scope')}
											>
												TOURNAMENTS
											</button>
										</>
									)}
								</div>
							</div>
						) : (
							<div className="flex flex-col h-full p-5">
								<button className="bg-transparent border-none text-slate-400 text-base font-bold cursor-pointer pb-5 flex items-center transition-colors duration-200 hover:text-white" onClick={() => setCurrentView("main")}>
									← Go Back
								</button>
								{currentView === "custom" && <ChallengeCard setMode={setMode} />}
								{currentView === "tournament" && <Tournaments />}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default Sidebar;
