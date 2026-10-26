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

    if (loading) return <div className="text-muted-foreground p-4 text-xs font-semibold">LOADING SESSIONS...</div>;

    return (
        <div className="p-4">
            {sessions.length === 0 ? (
                <p className="text-muted-foreground text-xs p-2">No sessions recorded yet.</p>
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
                            className={`border ${
                                isWinner 
                                    ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10' 
                                    : 'border-border bg-card hover:bg-secondary/60'
                            } p-4 mb-3 cursor-pointer text-card-foreground rounded-xl transition-all shadow-sm`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div className="font-bold text-sm text-primary">1v1 Challenge</div>
                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isWinner 
                                        ? 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30' 
                                        : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                                }`}>
                                    {isWinner ? 'VICTORY' : 'DEFEAT'}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs mb-2">
                                <div className="font-semibold text-foreground">You: <span className="text-primary font-bold">{myPlayer?.score || 0}</span></div>
                                <div className="text-muted-foreground font-black italic">VS</div>
                                <div className="font-semibold text-foreground">{opponent?.userDetails?.name || "Opponent"}: <span className="text-destructive font-bold">{opponent?.score || 0}</span></div>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
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
