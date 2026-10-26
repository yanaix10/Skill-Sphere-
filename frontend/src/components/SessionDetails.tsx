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
            <div className="flex-1 h-full bg-background text-foreground p-8 flex items-center justify-center">
                <div className="text-sm font-mono animate-pulse text-primary uppercase tracking-widest font-semibold">
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
        <div className="flex-1 h-full bg-background text-foreground p-8 flex flex-col font-sans overflow-y-auto transition-colors duration-200">
            <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
                <div>
                    <h1 className="text-xl font-bold text-primary uppercase tracking-tight">Session Review</h1>
                    <p className="text-muted-foreground text-xs font-mono">ID: {sessionId}</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-foreground">
                        {session.score} <span className="text-muted-foreground">/</span> {totalQuestions}
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Accuracy Score</span>
                </div>
            </div>

            <div className="bg-card p-6 rounded-xl border-l-4 border-primary border border-border mb-6 shadow-sm text-card-foreground">
                <span className="text-xs text-primary font-bold uppercase tracking-wider">Question {currentIndex + 1}</span>
                <h2 className="text-lg mt-2 font-semibold leading-relaxed">
                    {currentAnswerRecord.text || currentAnswerRecord.question || currentAnswerRecord.title}
                </h2>
                {currentAnswerRecord.description && (
                    <p className="text-muted-foreground text-xs mt-2 italic">{currentAnswerRecord.description}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className={`p-5 rounded-xl border transition-all ${isCorrect ? 'border-green-500/40 bg-green-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-2 block">Your Selection</span>
                    <p className={`text-base font-bold ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {selectedAnswerText}
                    </p>
                    <div className="mt-2.5">
                        {isCorrect ? 
                            <span className="text-[10px] bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded font-bold">CORRECT</span> : 
                            <span className="text-[10px] bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-bold">INCORRECT</span>
                        }
                    </div>
                </div>

                {!isCorrect && (
                    <div className="p-5 rounded-xl border border-green-500/30 bg-green-500/5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-green-600/70 dark:text-green-400/70 mb-2 block">Correct Answer</span>
                        <p className="text-base font-bold text-green-600 dark:text-green-400">
                            {correctAnswerText}
                        </p>
                        <div className="mt-2.5">
                            <span className="text-[10px] bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded font-bold">REQUIRED</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-auto flex justify-between items-center pt-6 border-t border-border">
                <div className="flex gap-2.5">
                    <button
                        className="h-[42px] px-6 bg-secondary border border-border text-secondary-foreground font-semibold text-xs hover:bg-secondary/80 disabled:opacity-30 transition-all rounded-lg cursor-pointer"
                        onClick={() => setCurrentIndex(p => p - 1)}
                        disabled={currentIndex === 0}
                    >
                        PREV
                    </button>

                    <button
                        className="h-[42px] px-6 bg-secondary border border-border text-secondary-foreground font-semibold text-xs hover:bg-secondary/80 disabled:opacity-30 transition-all rounded-lg cursor-pointer"
                        onClick={() => setCurrentIndex(p => p + 1)}
                        disabled={currentIndex === totalQuestions - 1}
                    >
                        NEXT
                    </button>
                </div>

                <button
                    onClick={() => setMode("main")}
                    className="h-[42px] px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all shadow-sm rounded-lg cursor-pointer"
                >
                    EXIT REVIEW
                </button>
            </div>
        </div>
    );
};

export default SessionDetails;
