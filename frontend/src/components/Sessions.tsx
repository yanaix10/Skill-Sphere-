import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { BACKEND_URL } from "../utils/api";

interface Player {
  socketId: string;
  userDetails?: {
    name: string;
  };
  score: number;
}

interface SessionData {
  _id: string;
  players?: Player[];
  winner?: {
    socketId: string;
  };
  createdAt: string;
}

interface SessionsProps {
  setSelectedSessionId: (id: string | null) => void;
  setMode: (mode: string) => void;
}

const Sessions: React.FC<SessionsProps> = ({ setSelectedSessionId, setMode }) => {
    const [sessions, setSessions] = useState<SessionData[]>([]); 
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    setLoading(false);
                    return;
                }
                const userName = user.displayName || user.email?.split('@')[0] || "Player";
                
                const res = await fetch(`${BACKEND_URL}/api/sessions?userId=${encodeURIComponent(userName)}`);
                const data = await res.json();
                setSessions(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to load sessions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, []);

    if (loading) return <div className="text-white">LOADING SESSIONS...</div>;

    return (
        <div className="p-4">
            {sessions.length === 0 ? (
                <p className="text-gray-400">No sessions recorded yet.</p>
            ) : (
                sessions.map((s) => {
                    const userName = auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "Player";
                    const myPlayer = s.players?.find(p => p.userDetails?.name === userName);
                    const opponent = s.players?.find(p => p.userDetails?.name !== userName);
                    const isWinner = s.winner?.socketId === myPlayer?.socketId;
                    
                    return (
                        <div
                            key={s._id}
                            onClick={() => { setSelectedSessionId(s._id); setMode("session"); }}
                            className={`border ${isWinner ? 'border-green-700/50 hover:bg-green-900/20' : 'border-gray-700 hover:bg-gray-800'} p-4 mb-3 cursor-pointer text-white rounded transition-colors`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div className="font-bold text-lg text-blue-400">1v1 Challenge</div>
                                <div className={`text-xs font-bold px-2 py-1 rounded ${isWinner ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {isWinner ? 'VICTORY' : 'DEFEAT'}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm mb-2">
                                <div className="font-bold">You: <span className="text-blue-400">{myPlayer?.score || 0}</span></div>
                                <div className="text-gray-500 font-black italic">VS</div>
                                <div className="font-bold">{opponent?.userDetails?.name || "Opponent"}: <span className="text-red-400">{opponent?.score || 0}</span></div>
                            </div>
                            <div className="text-xs text-gray-500">
                                {new Date(s.createdAt).toLocaleString()}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default Sessions;
