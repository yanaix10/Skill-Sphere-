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
		<div className="w-[30vw] min-w-[320px] max-w-[420px] h-full bg-card border-l border-border flex flex-col font-sans text-card-foreground box-border transition-colors duration-200">
			<div className="flex border-b border-border bg-card">
				{["+ Code", "Sessions", "Coders"].map((tab) => (
					<button
						key={tab}
						className={`flex-1 py-4 bg-transparent border-none border-b-2 text-sm font-semibold cursor-pointer transition-all duration-200 ${activeTab === tab
							? "text-primary border-primary"
							: "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/50"
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

			<div className="tab-content flex-1 overflow-y-auto">
				{activeTab === "Sessions" && <Sessions setSelectedSessionId={setSelectedSessionId} setMode={setMode} />}
				{activeTab === "Coders" && <Coders />}

				{activeTab === "+ Code" && (
					<>
						{currentView === "main" ? (
							<div className="main-code-view">
								<div
									className={`flex justify-between items-center h-[50px] mx-5 my-[15px] rounded-lg px-4 text-sm font-bold tracking-[0.5px] border border-border transition-all duration-300 ${isSessionActive ? "bg-secondary/50 opacity-65 cursor-not-allowed text-muted-foreground" : "bg-secondary text-foreground cursor-pointer hover:bg-secondary/80"}`}
									onClick={() => {
										if (isSessionActive) return;
										setIsExpanded(!isExpanded);
									}}
								>
									<div className="flex items-center gap-2">
										<span>{quizConfig.category}</span> <span className="text-muted-foreground">•</span> <span>{quizConfig.limit} Qs</span> <span className="text-muted-foreground">•</span> <span className="text-red-500 uppercase">{quizConfig.difficulty}</span>
										{isSessionActive && <span className="text-xs text-muted-foreground italic ml-2">(Locked)</span>}
									</div>
									{!isSessionActive && <div className={`transition-transform duration-300 ease-in text-muted-foreground ${isExpanded ? "rotate-180" : ""}`}>▼</div>}
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
											className="w-full p-[14px] rounded-lg text-sm font-bold tracking-[1px] cursor-pointer border-none transition-transform duration-100 ease-in active:scale-[0.98] bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
										>
											QUIT SESSION
										</button>
									) : (
										<>
											<button onClick={() => setMode("practice")} className="w-full p-[14px] rounded-lg text-sm font-bold tracking-[1px] cursor-pointer border-none transition-all duration-100 ease-in active:scale-[0.98] bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">START QUIZ</button>
											<button
												className="w-full p-[14px] rounded-lg text-sm font-bold tracking-[1px] cursor-pointer transition-all duration-100 ease-in active:scale-[0.98] bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80"
												onClick={() => {
													setMode("challenge");
												}}
											>
												1V1 CHALLENGE
											</button>
											<button onClick={() => alert('Future scope')} className="w-full p-[14px] rounded-lg text-sm font-bold tracking-[1px] cursor-pointer transition-all duration-100 ease-in active:scale-[0.98] bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80">CODE A FRIEND</button>
											<button
												className="w-full p-[14px] rounded-lg text-sm font-bold tracking-[1px] cursor-pointer transition-all duration-100 ease-in active:scale-[0.98] bg-transparent border border-border text-muted-foreground hover:border-foreground hover:text-foreground hover:bg-secondary/30"
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
								<button className="bg-transparent border-none text-muted-foreground text-sm font-bold cursor-pointer pb-5 flex items-center transition-colors duration-200 hover:text-foreground" onClick={() => setCurrentView("main")}>
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
