import React, { useState } from "react";

interface Coder {
  id: number;
  name: string;
  rank: string;
  rating: number;
  color: string;
}

const Coders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  const dummyCoders: Coder[] = [
    { id: 1, name: "Naitik", rank: "Silver", rating: 710, color: "#C0C0C0" },
    { id: 2, name: "Aarav", rank: "Gold", rating: 1250, color: "#FFD700" },
    { id: 3, name: "Ishani", rank: "Bronze", rating: 420, color: "#CD7F32" },
    { id: 4, name: "Karan", rank: "Platinum", rating: 1800, color: "#E5E4E2" },
    { id: 5, name: "Mehak", rank: "Diamond", rating: 2400, color: "#B9F2FF" },
    { id: 6, name: "Rohan", rank: "Silver", rating: 680, color: "#C0C0C0" },
    { id: 7, name: "Sanya", rank: "Gold", rating: 1100, color: "#FFD700" },
    { id: 8, name: "Vikram", rank: "Bronze", rating: 350, color: "#CD7F32" },
  ];

  const filteredCoders = dummyCoders.filter((coder) =>
    coder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#0f172a] text-white rounded-lg h-full flex flex-col">
      <div className="pb-[15px] border-b border-[#1e293b] mb-[15px]">
        <h3 className="m-0">Rankings</h3>
        <input
          type="text"
          placeholder="Search coders..."
          className="w-full p-2.5 bg-[#1e293b] border border-[#334155] rounded text-white mt-2.5 box-border outline-none focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-y-auto grow flex flex-col gap-2.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#334155] [&::-webkit-scrollbar-thumb]:rounded-full">
        {filteredCoders.map((coder) => (
          <div key={coder.id} className="bg-[#1e293b] p-4 rounded-md flex justify-between items-center transition-colors duration-200 ease-in hover:bg-[#334155]">
            <div className="flex flex-col gap-1">
              <span className="text-base font-bold">{coder.name}</span>
              <span 
                className="text-xs uppercase tracking-[0.5px]" 
                style={{ color: coder.color, fontWeight: "bold" }}
              >
                {coder.rank}
              </span>
            </div>
            <div className="text-right text-sm text-[#94a3b8]">
              <span>Rating:</span>
              <span className="block text-blue-400 font-bold text-lg">{coder.rating}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Coders;
