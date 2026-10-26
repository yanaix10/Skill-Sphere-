import React from 'react';

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

const QuizType: React.FC<QuizTypeProps> = ({ quizConfig, setQuizConfig, disabled }) => {
  const updateConfig = (key: keyof QuizConfig, value: string) => {
    if (disabled) return;
    setQuizConfig({ ...quizConfig, [key]: value });
  };

  const renderSection = (title: string, options: string[], selected: string, setterKey: keyof QuizConfig) => (
    <div className="mb-4">
      <h3 className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">{title}</h3>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            disabled={disabled}
            className={`py-2.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
              selected === opt
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => updateConfig(setterKey, opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-card text-card-foreground p-4 rounded-xl border border-border w-full font-sans box-border shadow-sm">
      <div className="flex items-center justify-center bg-secondary/60 p-3 rounded-lg mb-4 font-bold border border-border">
        <span className="text-primary mr-2">⚡</span>
        <h2 className="m-0 text-sm font-semibold">Quiz Settings {disabled && "(Locked)"}</h2>
      </div>

      {renderSection('Difficulty', ['Easy', 'Medium', 'Hard'], quizConfig?.difficulty || 'Easy', 'difficulty')}
      {renderSection('No. Questions', ['5', '10', '20'], quizConfig?.limit || '10', 'limit')}
      {renderSection('Category', ['Linux', 'DevOps', 'Code', 'SQL', 'Cloud', 'Docker'], quizConfig?.category || 'Linux', 'category')}
    </div>
  );
};

export default QuizType;
