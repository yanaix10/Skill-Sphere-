import { useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";

/**
 * Hook to keep the current user's online presence synchronized in Firestore.
 * Sets isOnline: true and heartbeats every 40 seconds with lastSeen timestamp.
 * Marks isOnline: false on page unload or visibility hidden.
 */
export function useUserPresence() {
  useEffect(() => {
    let intervalId: any = null;

    const setPresence = async (online: boolean) => {
      const user = auth.currentUser;
      if (!user || user.uid === "test-user-123") return;

      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            isOnline: online,
            lastSeen: Date.now(),
          },
          { merge: true }
        );
      } catch (e) {
        // Silently catch network or permission errors
      }
    };

    // Mark online on mount
    setPresence(true);

    // Heartbeat every 40 seconds
    intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        setPresence(true);
      }
    }, 40000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setPresence(true);
      } else {
        setPresence(false);
      }
    };

    const handleBeforeUnload = () => {
      setPresence(false);
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setPresence(false);
    };
  }, []);
}

/**
 * Evaluates whether a user is currently online based on isOnline flag and lastSeen time.
 * Accounts for 2-minute latency threshold.
 */
export function isUserOnline(userDoc?: { isOnline?: boolean; lastSeen?: any }): boolean {
  if (!userDoc) return false;
  if (!userDoc.isOnline) return false;

  let lastSeenMs = 0;
  if (typeof userDoc.lastSeen === "number") {
    lastSeenMs = userDoc.lastSeen;
  } else if (userDoc.lastSeen && typeof userDoc.lastSeen.toMillis === "function") {
    lastSeenMs = userDoc.lastSeen.toMillis();
  } else if (userDoc.lastSeen && userDoc.lastSeen.seconds) {
    lastSeenMs = userDoc.lastSeen.seconds * 1000;
  }

  if (!lastSeenMs) return Boolean(userDoc.isOnline);

  const diffMs = Date.now() - lastSeenMs;
  // If active within last 2 minutes (120,000 ms), consider online
  return diffMs < 120000;
}

/**
 * Formats last seen text cleanly
 */
export function formatLastSeen(lastSeen?: any): string {
  if (!lastSeen) return "Offline";

  let lastSeenMs = 0;
  if (typeof lastSeen === "number") {
    lastSeenMs = lastSeen;
  } else if (lastSeen && typeof lastSeen.toMillis === "function") {
    lastSeenMs = lastSeen.toMillis();
  } else if (lastSeen && lastSeen.seconds) {
    lastSeenMs = lastSeen.seconds * 1000;
  }

  if (!lastSeenMs) return "Offline";

  const diffMs = Date.now() - lastSeenMs;
  if (diffMs < 120000) return "Online";

  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 60) return `Last seen ${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `Last seen ${diffDays}d ago`;
}
