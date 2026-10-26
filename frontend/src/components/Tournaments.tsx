import React, { useState } from "react";

interface Tournament {
  time: string;
  lang: string;
  type: string;
  duration: string;
  status: string;
  coders: number;
}

const Tournaments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("Schedule");

  const tournamentData: Tournament[] = [
    { time: "In 15 min", lang: "PYTHON", type: "RAPID", duration: "45 min", status: "Starting Soon", coders: 48 },
    { time: "Today 9PM", lang: "C++", type: "DUEL", duration: "35 min", status: "Open", coders: 120 },
    { time: "Tomorrow", lang: "GO", type: "BACKEND", duration: "1 hr", status: "Coming Soon", coders: 12 },
    { time: "Tomorrow", lang: "SQL", type: "DB", duration: "30 min", status: "Coming Soon", coders: 34 },
    { time: "Apr 16", lang: "REACT", type: "QUIZ", duration: "20 min", status: "Coming Soon", coders: 210 },
  ];

  return (
    <div className="flex-1 h-full bg-background text-foreground p-6 font-sans box-border overflow-y-auto transition-colors duration-200">
      <div className="mb-6">
        <div>
          <h1 className="m-0 text-xl font-bold tracking-tight">Tournaments</h1>
          <span className="text-xs text-muted-foreground">Competitive coding brackets and scheduled tournaments</span>
        </div>
      </div>

      <div className="mb-5 border-b border-border">
        <div className="flex gap-2 items-center">
          {["Current", "Schedule", "Watch"].map((tab) => (
            <button
              key={tab}
              className={`bg-transparent py-2.5 px-4 cursor-pointer font-semibold text-xs border-none border-b-2 transition-colors ${
                activeTab === tab
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
          <button className="ml-auto bg-primary text-primary-foreground py-1.5 px-3 rounded-lg cursor-pointer font-semibold text-xs shadow-sm hover:bg-primary/90 transition-all">
            + Create
          </button>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search tournaments..."
            className="flex-1 bg-secondary border border-border text-foreground py-2 px-3 rounded-lg outline-none text-xs focus:border-primary"
          />
          <button className="bg-secondary text-secondary-foreground border border-border px-3.5 py-2 rounded-lg cursor-pointer text-xs font-medium hover:bg-secondary/80">
            Filter
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-muted-foreground p-3 uppercase font-semibold tracking-wider">TIME</th>
              <th className="text-muted-foreground p-3 uppercase font-semibold tracking-wider">LANG</th>
              <th className="text-muted-foreground p-3 uppercase font-semibold tracking-wider">TYPE</th>
              <th className="text-muted-foreground p-3 uppercase font-semibold tracking-wider">DURATION</th>
              <th className="text-muted-foreground p-3 uppercase font-semibold tracking-wider">STATUS</th>
              <th className="text-muted-foreground p-3 uppercase font-semibold tracking-wider">CODERS</th>
              <th className="text-muted-foreground p-3 uppercase font-semibold tracking-wider">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {tournamentData.map((t, i) => (
              <tr key={i} className="border-b border-border/60 hover:bg-secondary/30 transition-colors">
                <td className="p-3 font-medium">{t.time}</td>
                <td className="p-3">
                  <span className="bg-secondary text-secondary-foreground border border-border py-0.5 px-2 rounded text-[10px] font-bold">
                    {t.lang}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{t.type}</td>
                <td className="p-3 text-muted-foreground">{t.duration}</td>
                <td className="p-3 text-primary font-semibold">{t.status}</td>
                <td className="p-3 text-muted-foreground">{t.coders}</td>
                <td className="p-3">
                  <button className="bg-primary text-primary-foreground border-none py-1 px-3 rounded-md font-semibold text-xs cursor-pointer hover:bg-primary/90 shadow-sm transition-all">
                    JOIN
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tournaments;
