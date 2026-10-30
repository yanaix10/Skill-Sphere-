import React, { useEffect, useState } from "react";
import { BACKEND_URL } from "../utils/api";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { TagElement } from "@/components/templates/tag-node";
import { TimerMinimal } from "@/components/templates/timer-minimal";
import { PendingButton } from "@/components/templates/pending-button";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trophy,
  Award,
  Circle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export const Practice: React.FC<PracticeProps> = ({ setMode, quizConfig }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/quiz/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: quizConfig?.category,
          difficulty: quizConfig?.difficulty,
          limit: parseInt(String(quizConfig?.limit || 10)),
        }),
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

  const handleFinish = async (finalAnswers = userAnswers) => {
    if (!sessionId) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/quiz/session/${sessionId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userAnswers: finalAnswers,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setScore(data.score);
        setShowResult(true);
      }
    } catch (err) {
      console.error("Failed to submit answers", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 && questions.length > 0 && !showResult) {
      handleFinish(userAnswers);
      return;
    }
    if (questions.length === 0 || showResult) return;

    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, questions.length, showResult]);

  // Click selects option without advancing
  const handleSelectOption = (answerId: string) => {
    const currentQ = questions[currentIndex];
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: answerId,
    }));
  };

  if (error) {
    return (
      <div className="flex-1 h-full bg-background text-foreground p-8 flex flex-col items-center justify-center gap-6">
        <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <HelpCircle className="size-8" />
        </div>
        <p className="text-destructive font-bold text-xl">{error}</p>
        <Button
          onClick={() => setMode("main")}
          className="px-8 py-3 bg-primary text-primary-foreground font-bold shadow-sm"
        >
          BACK TO SELECTION
        </Button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex-1 h-full bg-background text-foreground p-8 flex flex-col items-center justify-center gap-4 text-sm font-semibold">
        <div className="size-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <span className="text-muted-foreground animate-pulse">PREPARING QUIZ ARENA...</span>
      </div>
    );
  }

  // Quiz Over Screen
  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    const answeredCount = Object.keys(userAnswers).length;

    return (
      <div className="flex-1 h-full bg-background text-foreground p-6 sm:p-10 flex flex-col items-center justify-center font-sans overflow-y-auto">
        <div className="text-center p-8 bg-card border border-border rounded-3xl shadow-xl max-w-lg w-full flex flex-col items-center animate-in zoom-in-95 duration-300">
          <div className="size-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 ring-8 ring-primary/5">
            <Trophy className="size-10" />
          </div>

          <h1 className="text-3xl font-extrabold text-foreground mb-1 tracking-tight">
            Quiz Completed!
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Here is how you performed in this session
          </p>

          {/* Score Circle Card */}
          <div className="w-full bg-secondary/50 rounded-2xl p-6 border border-border/80 mb-6 flex flex-col items-center">
            <div className="text-5xl font-black text-primary tracking-tight">
              {score} <span className="text-2xl font-bold text-muted-foreground">/ {questions.length}</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20">
              <Award className="w-3.5 h-3.5" />
              {percentage >= 80
                ? "Mastery Level"
                : percentage >= 50
                ? "Good Performance"
                : "Keep Practicing"}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 w-full mb-8">
            <div className="p-3 bg-secondary/30 rounded-xl border border-border/60 text-center">
              <span className="text-xs text-muted-foreground block mb-0.5">Total</span>
              <span className="text-lg font-bold text-foreground">{questions.length}</span>
            </div>
            <div className="p-3 bg-secondary/30 rounded-xl border border-border/60 text-center">
              <span className="text-xs text-muted-foreground block mb-0.5">Answered</span>
              <span className="text-lg font-bold text-foreground">{answeredCount}</span>
            </div>
            <div className="p-3 bg-secondary/30 rounded-xl border border-border/60 text-center">
              <span className="text-xs text-muted-foreground block mb-0.5">Accuracy</span>
              <span className="text-lg font-bold text-emerald-500">{percentage}%</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded-xl h-11"
              onClick={() => {
                setShowResult(false);
                setUserAnswers({});
                setCurrentIndex(0);
                fetchQuestions();
              }}
            >
              <RotateCcw className="size-4" />
              <span>Retry Quiz</span>
            </Button>
            <Button
              className="flex-1 rounded-xl h-11 font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setMode("main")}
            >
              Back to Arena
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  // Parse answer options
  let answerOptions: QuestionAnswerOption[] = [];
  if (Array.isArray(currentQ.answers)) {
    answerOptions = currentQ.answers as QuestionAnswerOption[];
  } else if (currentQ.answers && typeof currentQ.answers === "object") {
    answerOptions = Object.entries(currentQ.answers)
      .filter(([_, text]) => text !== null && text !== "")
      .map(([id, text]) => ({ id, text: String(text) }));
  }

  const selectedAnswerId = userAnswers[currentQ.id];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredTotal = Object.keys(userAnswers).length;

  const difficultyVariant =
    (currentQ.difficulty || quizConfig?.difficulty || "").toLowerCase() === "easy"
      ? "easy"
      : (currentQ.difficulty || quizConfig?.difficulty || "").toLowerCase() === "hard"
      ? "hard"
      : "medium";

  return (
    <div className="flex-1 h-full bg-background text-foreground p-4 sm:p-8 box-border flex flex-col font-sans overflow-y-auto transition-colors duration-200">
      {/* Top Header & Segmented Progress Area */}
      <div className="mb-6 flex flex-col gap-3.5 shrink-0">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          {/* Left: Step label and badges */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-medium text-muted-foreground">
                {answeredTotal} answered
              </span>
            </div>

            {/* Badges using TagElement pattern */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <TagElement
                value={currentQ.category || quizConfig?.category || "General"}
                variant="secondary"
              />
              <TagElement
                value={currentQ.difficulty || quizConfig?.difficulty || "Medium"}
                variant={difficultyVariant}
              />
              {currentQ.tags &&
                currentQ.tags.map((tag, idx) => (
                  <TagElement key={idx} value={`#${tag}`} variant="primary" />
                ))}
            </div>
          </div>

          {/* Right: Minimal Countdown Timer */}
          <TimerMinimal
            secondsRemaining={timeLeft}
            className="shrink-0"
          />
        </div>

        {/* Segmented Progress Bar from user template */}
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={currentIndex + 1}
          aria-valuetext={`Question ${currentIndex + 1} of ${questions.length}`}
          className="w-full flex gap-1.5 pt-1"
        >
          {questions.map((q, idx) => {
            const isAnswered = Boolean(userAnswers[q.id]);
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                title={`Jump to question ${idx + 1}${isAnswered ? " (Answered)" : ""}`}
                className={cn(
                  "h-2 flex-1 rounded-full transition-all duration-300 cursor-pointer outline-none",
                  isCurrent
                    ? "bg-primary ring-2 ring-primary/40 ring-offset-1 ring-offset-background"
                    : isAnswered
                    ? "bg-emerald-500/80 hover:bg-emerald-500"
                    : "bg-muted hover:bg-secondary-foreground/20"
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Question Box Card */}
      <div className="bg-card p-6 sm:p-7 rounded-2xl mb-5 border border-border shadow-sm text-card-foreground shrink-0 transition-all">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-snug">
            {currentQ.text || currentQ.question || currentQ.title}
          </h1>
        </div>

        {currentQ.description && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {currentQ.description}
          </p>
        )}

        {currentQ.data?.text && (
          <div className="font-mono text-xs sm:text-sm text-primary bg-secondary/80 p-3.5 rounded-xl border border-border mt-3 overflow-x-auto">
            {currentQ.data.text}
          </div>
        )}
      </div>

      {/* Options List: Click selects them (without advancing) */}
      <div className="flex flex-col gap-3 mb-6 flex-1">
        {answerOptions.map((opt, optIndex) => {
          const isSelected = selectedAnswerId === opt.id;
          const letter = OPTION_LETTERS[optIndex] || String(optIndex + 1);

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectOption(opt.id)}
              className={cn(
                "w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group select-none shadow-xs",
                isSelected
                  ? "bg-primary/10 border-primary ring-1 ring-primary/30 text-foreground shadow-sm"
                  : "bg-card border-border hover:bg-secondary/60 hover:border-border/80 text-card-foreground"
              )}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Option Letter Badge */}
                <div
                  className={cn(
                    "size-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary text-secondary-foreground border border-border/80 group-hover:bg-accent"
                  )}
                >
                  {letter}
                </div>

                {/* Option Text */}
                <span className="text-sm sm:text-base font-medium break-words leading-relaxed">
                  {opt.text}
                </span>
              </div>

              {/* Radio Indicator */}
              <div className="shrink-0 pl-2">
                {isSelected ? (
                  <CheckCircle2 className="size-5 text-primary" />
                ) : (
                  <Circle className="size-5 text-muted-foreground/40 group-hover:text-muted-foreground/70" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Area: Pagination Numbers & Action Buttons */}
      <div className="mt-auto pt-4 border-t border-border flex flex-col gap-4 shrink-0">
        {/* Question Numbers Pagination Bar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto py-1 scrollbar-none">
          <Pagination className="mx-0 w-auto justify-start">
            <PaginationContent className="gap-1.5">
              <PaginationItem>
                <PaginationPrevious
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className={cn(
                    currentIndex === 0 && "opacity-40 pointer-events-none"
                  )}
                />
              </PaginationItem>

              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = Boolean(userAnswers[q.id]);

                return (
                  <PaginationItem key={q.id || idx}>
                    <PaginationLink
                      isActive={isCurrent}
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        "relative size-9 p-0 flex items-center justify-center rounded-lg text-xs font-semibold",
                        isAnswered && !isCurrent && "border border-emerald-500/40 text-emerald-500 bg-emerald-500/5 font-bold"
                      )}
                    >
                      {idx + 1}
                      {isAnswered && !isCurrent && (
                        <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-500" />
                      )}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  disabled={currentIndex === questions.length - 1}
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      Math.min(questions.length - 1, prev + 1)
                    )
                  }
                  className={cn(
                    currentIndex === questions.length - 1 &&
                      "opacity-40 pointer-events-none"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        {/* Action Buttons: Skip, Prev, Next, and Green Submit Button */}
        <div className="flex justify-between items-center gap-3">
          {/* Skip Button */}
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground h-10 px-4 rounded-xl text-xs font-semibold"
            onClick={() => {
              if (currentIndex + 1 < questions.length) {
                setCurrentIndex((prev) => prev + 1);
              }
            }}
            disabled={isLastQuestion}
          >
            Skip Question
          </Button>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={currentIndex === 0}
              className="h-10 px-4 rounded-xl gap-1 text-xs font-semibold"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            >
              <ChevronLeft className="size-4" />
              <span>Previous</span>
            </Button>

            {!isLastQuestion ? (
              <Button
                type="button"
                className="h-10 px-5 rounded-xl gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                onClick={() => setCurrentIndex((prev) => prev + 1)}
              >
                <span>Next</span>
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              /* Green Submit Button with Loader2 Spinner */
              <PendingButton
                type="button"
                isPending={isSubmitting}
                variantColor="green"
                className="h-10 px-6 rounded-xl text-xs font-bold"
                onClick={() => handleFinish(userAnswers)}
              >
                Submit Quiz
              </PendingButton>
            )}

            {/* If not on last question, but user has answered questions and wants to finish */}
            {!isLastQuestion && answeredTotal > 0 && (
              <PendingButton
                type="button"
                isPending={isSubmitting}
                variantColor="green"
                className="h-10 px-4 rounded-xl text-xs font-bold hidden sm:inline-flex"
                onClick={() => handleFinish(userAnswers)}
              >
                Submit Now ({answeredTotal}/{questions.length})
              </PendingButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;
