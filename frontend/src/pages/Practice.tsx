import React, { useEffect, useState } from "react";
import { BACKEND_URL } from "../utils/api";

interface QuizConfig {
  category?: string;
  difficulty?: string;
  limit?: string | number;
}

interface PracticeProps {
  setMode: (mode: string) => void;
  quizConfig?: QuizConfig;
}

interface QuestionAnswerOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  question?: string;
  text?: string;
  title?: string;
  category?: string;
  difficulty?: string;
  tags?: string[];
  description?: string;
  data?: {
    text?: string;
  };
  answers: QuestionAnswerOption[] | Record<string, string | null>;
}

const Practice: React.FC<PracticeProps> = ({ setMode, quizConfig }) => {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [score, setScore] = useState<number>(0);
    const [showResult, setShowResult] = useState<boolean>(false);
    const [timeLeft, setTimeLeft] = useState<number>(600);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchQuestions = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/quiz/session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: quizConfig?.category,
                    difficulty: quizConfig?.difficulty,
                    limit: parseInt(String(quizConfig?.limit || 10))
                })
            });
            const data = await res.json();
            if (data.success && data.questions) {
                setQuestions(data.questions);
                setSessionId(data.sessionId);
                setTimeLeft(parseInt(String(quizConfig?.limit || 10)) * 60); // 1 min per question
            } else {
                setError(data.message || "Failed to load questions");
            }
        } catch (err) {
            console.error("Failed to load questions", err);
            setError("Network error fetching questions");
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleFinish = async (finalAnswers: Record<string, string>) => {
        if (!sessionId) return;
        
        try {
            const res = await fetch(`${BACKEND_URL}/api/quiz/session/${sessionId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userAnswers: finalAnswers
                })
            });
            const data = await res.json();
            if (data.success) {
                setScore(data.score);
                setShowResult(true);
            }
        } catch (err) {
            console.error("Failed to submit answers", err);
        }
    };

    useEffect(() => {
        if (timeLeft <= 0 && questions.length > 0 && !showResult) {
            handleFinish(userAnswers);
            return;
        }
        if (questions.length === 0 || showResult) return;
        
        const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, questions.length, showResult]);

    const handleAnswer = (answerId: string) => {
        const currentQ = questions[currentIndex];
        
        const newAnswers = {
            ...userAnswers,
            [currentQ.id]: answerId
        };
        setUserAnswers(newAnswers);

        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(p => p + 1);
        } else {
            handleFinish(newAnswers);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    if (error) {
        return (
            <div className="flex-1 h-full bg-background text-foreground p-8 flex flex-col items-center justify-center gap-6">
                <p className="text-destructive font-bold text-xl">{error}</p>
                <button 
                    onClick={() => setMode("main")} 
                    className="mt-4 px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-bold shadow-sm transition-all"
                >
                    BACK TO SELECTION
                </button>
            </div>
        );
    }

    if (questions.length === 0) {
        return <div className="flex-1 h-full bg-background text-foreground p-8 flex flex-col items-center justify-center gap-6 text-sm font-semibold">LOADING ARENA...</div>;
    }

    if (showResult) {
        return (
            <div className="flex-1 h-full bg-background text-foreground p-8 flex flex-col items-center justify-center gap-6 font-sans">
                <div className="text-center p-8 bg-card border border-border rounded-2xl shadow-sm max-w-md w-full">
                    <h1 className="text-3xl font-extrabold text-primary mb-2">QUIZ OVER</h1>
                    <p className="text-base text-muted-foreground mb-6">Final Score: <span className="text-foreground font-bold">{score} / {questions.length}</span></p>
                    <button 
                        onClick={() => setMode("main")} 
                        className="h-[45px] px-8 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-bold transition-all shadow-sm w-full"
                    >
                        GO BACK TO ARENA
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentIndex];
    
    // Parse answers object or array
    let answerOptions: QuestionAnswerOption[] = [];
    if (Array.isArray(currentQ.answers)) {
        answerOptions = currentQ.answers as QuestionAnswerOption[];
    } else if (currentQ.answers && typeof currentQ.answers === 'object') {
        // QuizAPI format: answers: { answer_a: "...", answer_b: "..." }
        answerOptions = Object.entries(currentQ.answers)
            .filter(([_, text]) => text !== null)
            .map(([id, text]) => ({ id, text: String(text) }));
    }

    return (
        <div className="flex-1 h-full bg-background text-foreground p-8 box-border flex flex-col font-sans overflow-y-auto relative transition-colors duration-200">
            <div className="flex justify-between items-center h-[90px] mb-6 flex-shrink-0">
                <div className="max-w-[60%]">
                    <h2 className="text-primary font-bold uppercase text-2xl leading-none tracking-tight mb-2">Question {currentIndex + 1} of {questions.length}</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-secondary px-2.5 py-1 rounded text-secondary-foreground border border-border uppercase font-semibold">{currentQ.category || quizConfig?.category || 'General'}</span>
                        <span className={`text-xs px-2.5 py-1 rounded uppercase font-bold ${
                            (currentQ.difficulty || quizConfig?.difficulty || '').toLowerCase() === 'easy' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30' :
                            (currentQ.difficulty || quizConfig?.difficulty || '').toLowerCase() === 'hard' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30' :
                            'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30'
                        }`}>{currentQ.difficulty || quizConfig?.difficulty || 'Medium'}</span>
                        {currentQ.tags && currentQ.tags.map((tag, idx) => (
                            <span key={idx} className="text-xs bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded font-mono font-medium">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
                <div className={`w-[110px] h-[55px] flex items-center justify-center rounded-lg border font-mono text-2xl font-bold flex-shrink-0 transition-colors ${timeLeft < 60 ? "bg-destructive/10 border-destructive/50 text-destructive animate-pulse" : "bg-primary/10 border-primary/30 text-primary"}`}>
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className="bg-card p-6 rounded-xl mb-6 border border-border overflow-y-auto leading-relaxed text-card-foreground flex-shrink-0 shadow-sm">
                <h1 className="text-lg font-bold mb-3">{currentQ.text || currentQ.question || currentQ.title}</h1>
                {currentQ.description && <p className="text-sm text-muted-foreground mb-3">{currentQ.description}</p>}
                
                {currentQ.data?.text && (
                    <div className="font-mono text-sm text-primary bg-secondary p-3 rounded-lg border border-border mt-3">
                        {currentQ.data.text}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2.5 mb-8 flex-1">
                {answerOptions.map((opt) => {
                    const isSelected = userAnswers[currentQ.id] === opt.id;
                    return (
                        <button
                            key={opt.id}
                            onClick={() => handleAnswer(opt.id)}
                            className={`w-full p-4 border text-left transition-all rounded-xl group flex justify-between items-center cursor-pointer ${isSelected ? 'bg-primary/10 border-primary shadow-sm text-foreground' : 'bg-card border-border hover:bg-secondary/60 text-card-foreground'}`}
                        >
                            <span className="text-base font-medium">{opt.text}</span>
                            <span className={`text-xs font-bold tracking-wider transition-opacity ${isSelected ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-60 text-muted-foreground'}`}>
                                {isSelected ? 'SELECTED' : 'SELECT'}
                            </span>
                        </button>
                    )
                })}
            </div>

            <div className="flex justify-between items-center mt-auto pt-6 border-t border-border">
                <button
                    className="h-[42px] px-6 rounded-lg border border-border text-muted-foreground font-semibold text-sm hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
                    onClick={() => currentIndex + 1 < questions.length ? setCurrentIndex(p => p + 1) : handleFinish(userAnswers)}
                >
                    SKIP
                </button>
                <div className="flex gap-2.5">
                    <button
                        disabled={currentIndex === 0}
                        className="h-[42px] px-6 rounded-lg bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 disabled:opacity-30 font-semibold text-sm transition-all cursor-pointer"
                        onClick={() => setCurrentIndex(prev => prev - 1)}
                    >
                        PREV
                    </button>
                    <button
                        disabled={currentIndex === questions.length - 1}
                        className="h-[42px] px-6 rounded-lg bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 disabled:opacity-30 font-semibold text-sm transition-all cursor-pointer"
                        onClick={() => setCurrentIndex(prev => prev + 1)}
                    >
                        NEXT
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Practice;
