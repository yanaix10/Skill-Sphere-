import React, { useState } from 'react';
import SegmentedControl from './ui/segmented-control';

interface ChallengeCardProps {
  setMode?: (mode: string) => void;
  onCreateRoom?: (track: string, questions: string) => void;
}

export default function ChallengeCard({ setMode, onCreateRoom }: ChallengeCardProps) {
  const [track, setTrack] = useState('Web Dev');
  const [questions, setQuestions] = useState('5');

  const handleCreate = () => {
    if (onCreateRoom) {
      onCreateRoom(track, questions);
    }
    if (setMode) {
      setMode('challenge');
    }
  };

  return (
    <div className="w-full max-w-sm p-6 bg-card text-card-foreground rounded-2xl border border-border shadow-xl select-none font-sans">
      <h2 className="text-xl font-bold tracking-tight text-center mb-1 text-foreground">
        Create a 1v1 Challenge
      </h2>
      <p className="text-xs text-muted-foreground text-center mb-6">
        Select your preferred track and number of questions to start a real-time coding duel.
      </p>

      {/* Select Track Section */}
      <div className="space-y-2 mb-5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
          Select Track
        </label>
        <SegmentedControl
          label="Track"
          options={['Web Dev', 'DSA']}
          selectedValue={track}
          onChange={setTrack}
        />
      </div>

      {/* Number of Questions Section */}
      <div className="space-y-2 mb-6">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
          Number of Questions
        </label>
        <SegmentedControl
          label="Number of Questions"
          options={['3', '5', '8']}
          selectedValue={questions}
          onChange={setQuestions}
        />
      </div>

      {/* Action Button */}
      <button
        onClick={handleCreate}
        className="w-full py-3.5 bg-[#00D2B4] text-black font-semibold rounded-xl hover:bg-[#00bda2] transition-colors duration-200 shadow-[0_4px_20px_rgba(0,210,180,0.2)] cursor-pointer text-xs sm:text-sm tracking-wide uppercase font-sans"
      >
        CREATE 1V1 ROOM
      </button>
    </div>
  );
}
