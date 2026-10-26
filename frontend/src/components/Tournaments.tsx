import React, { useState } from "react";

interface TournamentItem {
  time: string;
  lang: string;
  type: string;
  duration: string;
  status: string;
  coders: number;
}

const Tournaments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("Schedule");

  const tournamentData: TournamentItem[] = [
    { time: "08:00 PM", lang: "JAVA", type: "DSA", duration: "25 min", status: "2 hours left", coders: 45 },
    { time: "09:30 PM", lang: "PYTHON", type: "MCQ", duration: "15 min", status: "Starting soon", coders: 128 },
    { time: "10:00 PM", lang: "C++", type: "CP", duration: "2 hrs", status: "Registration Open", coders: 89 },
    { time: "11:15 PM", lang: "JS", type: "FRONTEND", duration: "45 min", status: "Registration Open", coders: 56 },
    { time: "Tomorrow", lang: "GO", type: "BACKEND", duration: "1 hr", status: "Coming Soon", coders: 12 },
    { time: "Tomorrow", lang: "SQL", type: "DB", duration: "30 min", status: "Coming Soon", coders: 34 },
    { time: "Apr 16", lang: "REACT", type: "QUIZ", duration: "20 min", status: "Coming Soon", coders: 210 },
  ];

  return (
    <div className="flex-1 h-full bg-[#0f172a] text-[#f8fafc] p-6 font-sans box-border overflow-y-auto">
      <div className="mb-6">
        <div>
          <h1 className="m-0 text-[24px] tracking-[1px]">TOURNAMENTS</h1>
          <span className="text-[12px] text-[#94a3b8]">APR 14 • 7:25 PM GMT +5:30 (GMT+5.5)</span>
        </div>
      </div>

      <div className="mb-5 border-b border-[#1e293b]">
        <div className="flex gap-2 items-center">
          {["Current", "Schedule", "Watch"].map((tab) => (
            <button
              key={tab}
              className={`bg-transparent text-[#94a3b8] py-3 px-5 cursor-pointer font-bold text-[14px] border-none border-b-2 ${activeTab === tab ? "text-blue-500 border-blue-500" : "border-transparent"}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
          <button className="ml-auto bg-[#1e293b] text-white border border-[#334155] py-2 px-4 rounded cursor-pointer font-bold">+ Create</button>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex gap-2.5">
          <input type="text" placeholder="Search tournaments..." className="flex-1 bg-[#1e293b] border border-[#334155] text-white py-2.5 px-[15px] rounded outline-none" />
          <button className="bg-[#1e293b] text-[#cbd5e1] border border-[#334155] px-[15px] rounded cursor-pointer">Filter</button>
        </div>
      </div>

      <div className="bg-[#1e293b] rounded-lg overflow-hidden">
        <table className="w-full border-collapse text-left text-[14px]">
          <thead>
            <tr>
              <th className="bg-[#0f172a] text-[#64748b] p-[15px] uppercase text-[12px] tracking-[0.5px]">TIME</th>
              <th className="bg-[#0f172a] text-[#64748b] p-[15px] uppercase text-[12px] tracking-[0.5px]">LANG</th>
              <th className="bg-[#0f172a] text-[#64748b] p-[15px] uppercase text-[12px] tracking-[0.5px]">TYPE</th>
              <th className="bg-[#0f172a] text-[#64748b] p-[15px] uppercase text-[12px] tracking-[0.5px]">DURATION</th>
              <th className="bg-[#0f172a] text-[#64748b] p-[15px] uppercase text-[12px] tracking-[0.5px]">STATUS</th>
              <th className="bg-[#0f172a] text-[#64748b] p-[15px] uppercase text-[12px] tracking-[0.5px]">CODERS</th>
              <th className="bg-[#0f172a] text-[#64748b] p-[15px] uppercase text-[12px] tracking-[0.5px]">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {tournamentData.map((t, i) => (
              <tr key={i}>
                <td className="p-[15px] border-b border-[#334155]">{t.time}</td>
                <td className="p-[15px] border-b border-[#334155]"><span className="bg-[#334155] py-1 px-2 rounded text-[11px] font-bold">{t.lang}</span></td>
                <td className="p-[15px] border-b border-[#334155]">{t.type}</td>
                <td className="p-[15px] border-b border-[#334155]">{t.duration}</td>
                <td className="p-[15px] border-b border-[#334155] text-blue-400">{t.status}</td>
                <td className="p-[15px] border-b border-[#334155]">{t.coders}</td>
                <td className="p-[15px] border-b border-[#334155]">
                  <button className="bg-blue-600 text-white border-none py-1.5 px-4 rounded font-bold cursor-pointer hover:bg-blue-500">JOIN</button>
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
