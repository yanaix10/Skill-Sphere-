import React from "react";

const QuestArena: React.FC = () => {
  return (
    <div className="flex-1 h-full bg-[#121212] text-white p-8 box-border flex flex-col gap-6 font-sans overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="m-0 text-2xl">Challenge Mode ON </h2>
        <span className="text-gray-400 text-[0.9rem]">Question 1 / 10</span>
      </div>

      <div className="w-full bg-[#1f2937] rounded-none border border-[#2a2a2a] p-5 text-[1.1rem]">
        <p className="m-0">What is the time complexity of binary search?</p>
      </div>

      <div className="w-full flex flex-col gap-3">
        <button className="w-full bg-[#1f2937] rounded-none border border-[#2a2a2a] p-4 text-left text-gray-200 text-base cursor-pointer transition-colors duration-200 outline-none hover:bg-[#374151]">O(n)</button>
        <button className="w-full bg-[#1f2937] rounded-none border border-[#2a2a2a] p-4 text-left text-gray-200 text-base cursor-pointer transition-colors duration-200 outline-none hover:bg-[#374151]">O(log n)</button>
        <button className="w-full bg-[#1f2937] rounded-none border border-[#2a2a2a] p-4 text-left text-gray-200 text-base cursor-pointer transition-colors duration-200 outline-none hover:bg-[#374151]">O(n log n)</button>
        <button className="w-full bg-[#1f2937] rounded-none border border-[#2a2a2a] p-4 text-left text-gray-200 text-base cursor-pointer transition-colors duration-200 outline-none hover:bg-[#374151]">O(1)</button>
      </div>

      <div className="w-full bg-[#1f2937] rounded-none border border-[#2a2a2a] flex flex-col p-4 grow min-h-[150px]">
        <label className="text-[0.85rem] text-gray-400 mb-3">Code Editor</label>
        <textarea
          className="grow bg-[#0f172a] text-gray-200 border-none p-4 font-mono text-[0.9rem] resize-none outline-none box-border"
          spellCheck="false"
          placeholder="// Write your code here..."
        ></textarea>
      </div>

      <div className="flex justify-between mt-auto">
        <button className="py-[0.6rem] px-6 border-none rounded text-base cursor-pointer text-white bg-[#374151] hover:bg-[#4b5563]">Skip</button>
        <button className="py-[0.6rem] px-6 border-none rounded text-base cursor-pointer text-white bg-blue-600 hover:bg-blue-700">Submit</button>
      </div>
    </div>
  );
};

export default QuestArena;
