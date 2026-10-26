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
            <div className="flex-1 h-full bg-[#121212] text-white p-8 flex flex-col items-center justify-center gap-6">
                <p className="text-red-500 font-bold text-xl">{error}</p>
                <button 
                    onClick={() => setMode("main")} 
                    className="mt-4 px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 transition-all"
                >
                    BACK TO SELECTION
                </button>
            </div>
        );
    }

    if (questions.length === 0) {
        return <div className="flex-1 h-full bg-[#121212] text-white p-8 flex flex-col items-center justify-center gap-6">LOADING ARENA...</div>;
    }

    if (showResult) {
        return (
            <div className="flex-1 h-full bg-[#121212] text-white p-8 flex flex-col items-center justify-center gap-6 font-sans">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-blue-400 mb-2">QUIZ OVER</h1>
                    <p className="text-xl text-gray-400 mb-6">Final Score: <span className="text-white font-bold">{score} / {questions.length}</span></p>
                </div>
                <button 
                    onClick={() => setMode("main")} 
                    className="h-[50px] px-10 bg-blue-600 rounded hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-600/20"
                >
                    GO BACK TO ARENA
                </button>
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
        <div className="flex-1 h-full bg-[#121212] text-white p-8 box-border flex flex-col font-sans overflow-y-auto relative">
            <div className="flex justify-between items-center h-[90px] mb-6 flex-shrink-0">
                <div className="max-w-[60%]">
                    <h2 className="text-blue-400 font-bold uppercase text-3xl leading-none tracking-tighter mb-1">Question {currentIndex + 1} of {questions.length}</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-gray-800 px-2.5 py-1 rounded text-gray-300 uppercase font-semibold">{currentQ.category || quizConfig?.category || 'General'}</span>
                        <span className={`text-xs px-2.5 py-1 rounded uppercase font-bold ${
                            (currentQ.difficulty || quizConfig?.difficulty || '').toLowerCase() === 'easy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            (currentQ.difficulty || quizConfig?.difficulty || '').toLowerCase() === 'hard' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>{currentQ.difficulty || quizConfig?.difficulty || 'Medium'}</span>
                        {currentQ.tags && currentQ.tags.map((tag, idx) => (
                            <span key={idx} className="text-xs bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded font-mono font-medium">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
                <div className={`w-[110px] h-[55px] flex items-center justify-center rounded border font-mono text-2xl font-bold flex-shrink-0 transition-colors ${timeLeft < 60 ? "bg-red-500/10 border-red-500/50 text-red-500 animate-pulse" : "bg-blue-500/10 border-blue-500/30 text-blue-400"}`}>
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className="bg-[#1f2937] p-6 rounded-xl mb-6 border border-gray-800 overflow-y-auto leading-relaxed text-gray-100 flex-shrink-0 shadow-inner">
                <h1 className="text-xl font-bold mb-4">{currentQ.text || currentQ.question || currentQ.title}</h1>
                {currentQ.description && <p className="text-base text-gray-400 mb-3">{currentQ.description}</p>}
                
                {currentQ.data?.text && (
                    <div className="font-mono text-blue-300 bg-black/30 p-3 rounded border border-blue-500/20 mt-4">
                        {currentQ.data.text}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3 mb-8 flex-1">
                {answerOptions.map((opt) => {
                    const isSelected = userAnswers[currentQ.id] === opt.id;
                    return (
                        <button
                            key={opt.id}
                            onClick={() => handleAnswer(opt.id)}
                            className={`w-full p-4 border text-left transition-all rounded-xl group flex justify-between items-center ${isSelected ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-[#1a1a1a] border-gray-800 hover:border-gray-500 hover:bg-[#252525]'}`}
                        >
                            <span className="text-lg">{opt.text}</span>
                            <span className={`text-xs font-bold tracking-widest transition-opacity ${isSelected ? 'opacity-100 text-blue-400' : 'opacity-0 group-hover:opacity-50 text-gray-500'}`}>
                                {isSelected ? 'SELECTED' : 'SELECT'}
                            </span>
                        </button>
                    )
                })}
            </div>

            <div className="flex justify-between items-center mt-auto pt-6 border-t border-gray-800">
                <button
                    className="h-[45px] px-8 rounded border border-gray-700 text-gray-400 font-bold hover:text-white hover:bg-gray-800 transition-all"
                    onClick={() => currentIndex + 1 < questions.length ? setCurrentIndex(p => p + 1) : handleFinish(userAnswers)}
                >
                    SKIP
                </button>
                <div className="flex gap-3">
                    <button
                        disabled={currentIndex === 0}
                        className="h-[45px] px-8 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-10 font-bold transition-all"
                        onClick={() => setCurrentIndex(prev => prev - 1)}
                    >
                        PREV
                    </button>
                    <button
                        disabled={currentIndex === questions.length - 1}
                        className="h-[45px] px-8 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-10 font-bold transition-all"
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
