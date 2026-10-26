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
    <div className="bg-card text-card-foreground h-full flex flex-col p-4 font-sans">
      <div className="pb-3 border-b border-border mb-3">
        <h3 className="m-0 text-sm font-semibold">Rankings</h3>
        <input
          type="text"
          placeholder="Search coders..."
          className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground mt-2 box-border outline-none text-xs focus:border-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-y-auto grow flex flex-col gap-2">
        {filteredCoders.map((coder) => (
          <div
            key={coder.id}
            className="bg-secondary/50 border border-border p-3 rounded-lg flex justify-between items-center transition-colors duration-150 hover:bg-secondary"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-foreground">{coder.name}</span>
              <span 
                className="text-[10px] uppercase tracking-wider font-semibold" 
                style={{ color: coder.color }}
              >
                {coder.rank}
              </span>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <span className="block text-[10px]">Rating</span>
              <span className="text-primary font-bold text-sm">{coder.rating}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Coders;
