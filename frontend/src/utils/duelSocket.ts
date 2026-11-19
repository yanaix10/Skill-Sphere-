import { io, Socket } from "socket.io-client";
import { auth } from "../firebase";
import { BACKEND_URL } from "./api";

export function getPersistentPlayerId(): string {
  if (typeof window === "undefined") return "guest";
  let id = localStorage.getItem("skillsphere_player_id");
  if (!id) {
    id = "p_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("skillsphere_player_id", id);
  }
  const uid = auth.currentUser?.uid;
  return uid ? `${uid}_${id}` : id;
}

export function getUserNickname(): string {
  return auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Player";
}

export const socket: Socket = io(BACKEND_URL, {
  withCredentials: true,
  transports: ["polling", "websocket"],
  reconnectionAttempts: 10,
  reconnectionDelay: 1500,
  auth: (cb) => {
    cb({
      playerId: getPersistentPlayerId(),
      nickname: getUserNickname()
    });
  }
});

