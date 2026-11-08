import React from "react";
import SegmentedControl from "@/components/ui/segmented-control";

interface QuizConfig {
  difficulty: string;
  limit: string;
  category: string;
}

interface QuizTypeProps {
  quizConfig: QuizConfig;
  setQuizConfig: (config: QuizConfig) => void;
  disabled: boolean;
}

const DIFFICULTY_OPTIONS = [
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
];

const QUESTION_COUNT_OPTIONS = [
  { value: "5", label: "5" },
  { value: "10", label: "10" },
  { value: "20", label: "20" },
];

const CATEGORY_ROW_1 = [
  { value: "Web Dev", label: "Web Dev" },
  { value: "Linux", label: "Linux" },
  { value: "DevOps", label: "DevOps" },
];

const CATEGORY_ROW_2 = [
  { value: "Code", label: "Code" },
  { value: "SQL", label: "SQL" },
  { value: "Cloud", label: "Cloud" },
];

const QuizType: React.FC<QuizTypeProps> = ({ quizConfig, setQuizConfig, disabled }) => {
  const updateConfig = (key: keyof QuizConfig, value: string) => {
    if (disabled) return;
    setQuizConfig({ ...quizConfig, [key]: value });
  };

  return (
    <div className="bg-card text-card-foreground p-4 rounded-xl border border-border w-full font-sans box-border shadow-xs space-y-4">
      {/* Difficulty Section */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider font-sans block">
          SELECT DIFFICULTY
        </label>
        <SegmentedControl
          label="Difficulty"
          options={DIFFICULTY_OPTIONS}
          value={quizConfig?.difficulty || "Easy"}
          onValueChange={(val) => updateConfig("difficulty", val)}
        />
      </div>

      {/* Number of Questions Section */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider font-sans block">
          NUMBER OF QUESTIONS
        </label>
        <SegmentedControl
          label="Number of Questions"
          options={QUESTION_COUNT_OPTIONS}
          value={String(quizConfig?.limit || "10")}
          onValueChange={(val) => updateConfig("limit", val)}
        />
      </div>

      {/* Category Section */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider font-sans block">
          SELECT CATEGORY
        </label>
        <div className="flex flex-col gap-1.5">
          <SegmentedControl
            label="Category Row 1"
            options={CATEGORY_ROW_1}
            value={quizConfig?.category || "Web Dev"}
            onValueChange={(val) => updateConfig("category", val)}
          />
          <SegmentedControl
            label="Category Row 2"
            options={CATEGORY_ROW_2}
            value={quizConfig?.category || "Web Dev"}
            onValueChange={(val) => updateConfig("category", val)}
          />
        </div>
      </div>
    </div>
  );
};

export default QuizType;
