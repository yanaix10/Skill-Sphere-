import React, { useEffect, useState } from "react";
import { BACKEND_URL } from "../utils/api";

interface AnswerOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface QuestionRecord {
  id: string;
  text?: string;
  question?: string;
  title?: string;
  description?: string;
  answers?: AnswerOption[];
}

interface SessionInfo {
  questions?: QuestionRecord[];
  userAnswers?: any;
  score: number;
}

interface SessionDetailsProps {
  sessionId: string | null;
  setMode: (mode: string) => void;
}

const SessionDetails: React.FC<SessionDetailsProps> = ({ sessionId, setMode }) => {
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    useEffect(() => {
        if (!sessionId) return;
        fetch(`${BACKEND_URL}/api/quiz/session/${sessionId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.session) {
                    setSession(data.session);
                } else {
                    setSession(data);
                }
            })
            .catch(err => console.error("Error fetching session:", err));
    }, [sessionId]);

    if (!session || !session.questions || !session.questions[currentIndex]) {
        return (
            <div className="flex-1 h-full bg-[#121212] text-white p-8 flex items-center justify-center">
                <div className="text-xl font-mono animate-pulse text-blue-400 uppercase tracking-widest">
                    Initializing Data...
                </div>
            </div>
        );
    }

    const currentAnswerRecord = session.questions[currentIndex];
    const totalQuestions = session.questions.length;

    const userAnswersMap = session.userAnswers || {};
    const selectedAnswerId = typeof userAnswersMap.get === 'function' 
        ? userAnswersMap.get(currentAnswerRecord.id) 
        : userAnswersMap[currentAnswerRecord.id];
    const selectedOpt = currentAnswerRecord.answers?.find(a => a.id === selectedAnswerId);
    const selectedAnswerText = selectedOpt ? selectedOpt.text : "SKIPPED";

    const correctOpt = currentAnswerRecord.answers?.find(a => a.isCorrect);
    const correctAnswerText = correctOpt ? correctOpt.text : "";
    const isCorrect = selectedAnswerId && correctOpt && selectedAnswerId === correctOpt.id;

    return (
        <div className="flex-1 h-full bg-[#121212] text-white p-8 flex flex-col font-sans overflow-y-auto">
            <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-blue-400 uppercase tracking-tight">Session Review</h1>
                    <p className="text-gray-500 text-sm font-mono">ID: {sessionId}</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-mono font-bold text-white">
                        {session.score} <span className="text-gray-600">/</span> {totalQuestions}
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Accuracy Score</span>
                </div>
            </div>

            <div className="bg-[#1f2937] p-6 rounded border-l-4 border-blue-500 mb-8 shadow-xl">
                <span className="text-xs text-blue-400 font-bold uppercase tracking-widest">Question {currentIndex + 1}</span>
                <h2 className="text-xl mt-3 font-medium leading-relaxed">
                    {currentAnswerRecord.text || currentAnswerRecord.question || currentAnswerRecord.title}
                </h2>
                {currentAnswerRecord.description && (
                    <p className="text-gray-400 text-sm mt-2 italic">{currentAnswerRecord.description}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className={`p-6 rounded border transition-all ${isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
                    <span className="text-[10px] uppercase font-black tracking-widest opacity-50 mb-2 block">Your Selection</span>
                    <p className={`text-lg font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedAnswerText}
                    </p>
                    <div className="mt-3">
                        {isCorrect ? 
                            <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded font-bold">CORRECT</span> : 
                            <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded font-bold">INCORRECT</span>
                        }
                    </div>
                </div>

                {!isCorrect && (
                    <div className="p-6 rounded border border-green-500/30 bg-green-500/5">
                        <span className="text-[10px] uppercase font-black tracking-widest text-green-500/60 mb-2 block">Correct Answer</span>
                        <p className="text-lg font-bold text-green-400">
                            {correctAnswerText}
                        </p>
                        <div className="mt-3">
                            <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded font-bold">REQUIRED</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-auto flex justify-between items-center pt-6 border-t border-gray-800">
                <div className="flex gap-3">
                    <button
                        className="h-[45px] px-8 bg-[#252525] border border-gray-700 text-gray-300 font-bold hover:bg-[#333] disabled:opacity-20 transition-all rounded-sm"
                        onClick={() => setCurrentIndex(p => p - 1)}
                        disabled={currentIndex === 0}
                    >
                        PREV
                    </button>

                    <button
                        className="h-[45px] px-8 bg-[#252525] border border-gray-700 text-gray-300 font-bold hover:bg-[#333] disabled:opacity-20 transition-all rounded-sm"
                        onClick={() => setCurrentIndex(p => p + 1)}
                        disabled={currentIndex === totalQuestions - 1}
                    >
                        NEXT
                    </button>
                </div>

                <button
                    onClick={() => setMode("main")}
                    className="h-[45px] px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-600/20 rounded-sm"
                >
                    EXIT REVIEW
                </button>
            </div>
        </div>
    );
};

export default SessionDetails;
