declare global {
  interface Window {
    google?: any;
  }
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "10:30 AM"
  endTime: string; // e.g. "11:15 AM"
  meetLink?: string;
  category: "Meeting" | "Duel" | "Class" | "Interview" | "Task";
  organizer: string;
  description?: string;
}

export interface ClassroomCourse {
  id: string;
  name: string;
  section: string;
  teacher: string;
  roomCode: string;
  link: string;
}

export interface ClassroomAssignment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  submitted: boolean;
  points: number;
  link?: string;
}

const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "558068409791-sjacgg7p3pr1hi4ngbeim38k06kcbvtn.apps.googleusercontent.com";

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
].join(" ");

const TOKEN_KEY = "skillsphere_google_access_token";
const EMAIL_KEY = "skillsphere_google_email";
const EXPIRES_KEY = "skillsphere_google_token_expiry";

export const getGoogleToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRES_KEY);
  if (token && expiry) {
    if (Date.now() > parseInt(expiry, 10)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRES_KEY);
      return null;
    }
  }
  return token;
};

export const getGoogleEmail = (): string => {
  return localStorage.getItem(EMAIL_KEY) || "";
};

export const isGoogleConnected = (): boolean => {
  return Boolean(getGoogleToken());
};

export const disconnectGoogle = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem("skillsphere_calendar_meetings");
  localStorage.removeItem("skillsphere_classroom_courses");
  localStorage.removeItem("skillsphere_classroom_assignments");
};

/**
 * Ensures Google Identity Services (GSI) script is loaded
 */
const loadGsiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existingScript = document.getElementById("google-gsi-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error("Failed to load Google Identity Services script"));
    document.head.appendChild(script);
  });
};

/**
 * Triggers Google OAuth popup using Google Identity Services (GIS)
 * and retrieves user email and access token
 */
export const requestGoogleAccess = async (): Promise<{ accessToken: string; email: string }> => {
  await loadGsiScript();

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          const accessToken = tokenResponse.access_token;
          const expiresIn = parseInt(tokenResponse.expires_in || "3600", 10) * 1000;
          localStorage.setItem(TOKEN_KEY, accessToken);
          localStorage.setItem(EXPIRES_KEY, String(Date.now() + expiresIn));

          // Fetch user profile email
          let email = "";
          try {
            const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const userData = await userRes.json();
            email = userData.email || "";
            if (email) {
              localStorage.setItem(EMAIL_KEY, email);
            }
          } catch (e) {
            console.warn("Could not fetch Google userinfo:", e);
          }

          resolve({ accessToken, email });
        },
      });

      // Prompt account selection
      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Fetches upcoming Google Calendar events directly using Access Token
 */
export const fetchGoogleCalendarEvents = async (token?: string): Promise<CalendarEvent[]> => {
  const accessToken = token || getGoogleToken();
  if (!accessToken) {
    throw new Error("No active Google session found. Please sign in.");
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    startOfToday
  )}&maxResults=60&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      disconnectGoogle();
      throw new Error("Google session expired. Please sign in again.");
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Failed to fetch Google Calendar events");
  }

  const data = await res.json();
  const items = data.items || [];

  return items.map((item: any) => {
    const rawStart = item.start?.dateTime || item.start?.date || "";
    const rawEnd = item.end?.dateTime || item.end?.date || "";
    const startDate = rawStart ? new Date(rawStart) : new Date();
    const endDate = rawEnd ? new Date(rawEnd) : new Date();

    const dateStr = startDate.toISOString().split("T")[0];
    const startTime = startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const endTime = endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    let category: "Meeting" | "Duel" | "Class" | "Interview" | "Task" = "Meeting";
    const summaryLower = (item.summary || "").toLowerCase();
    if (summaryLower.includes("class") || summaryLower.includes("lecture") || summaryLower.includes("lab")) {
      category = "Class";
    } else if (summaryLower.includes("interview")) {
      category = "Interview";
    } else if (summaryLower.includes("duel") || summaryLower.includes("contest") || summaryLower.includes("quiz")) {
      category = "Duel";
    } else if (summaryLower.includes("task") || summaryLower.includes("todo") || summaryLower.includes("assignment")) {
      category = "Task";
    }

    return {
      id: item.id || Math.random().toString(),
      title: item.summary || "Untitled Event",
      date: dateStr,
      startTime,
      endTime,
      meetLink: item.hangoutLink || item.location || undefined,
      category,
      organizer: item.organizer?.displayName || item.organizer?.email || "Google Calendar",
      description: item.description || "",
    };
  });
};

/**
 * Fetches Google Classroom courses and assignments directly using Access Token
 */
export const fetchGoogleClassroomData = async (
  token?: string
): Promise<{ courses: ClassroomCourse[]; assignments: ClassroomAssignment[] }> => {
  const accessToken = token || getGoogleToken();
  if (!accessToken) {
    throw new Error("No active Google session found. Please sign in.");
  }

  // Step 1: Fetch active courses
  const coursesRes = await fetch("https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=40", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!coursesRes.ok) {
    if (coursesRes.status === 401) {
      disconnectGoogle();
      throw new Error("Google session expired. Please sign in again.");
    }
    const errData = await coursesRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Failed to fetch Google Classroom courses");
  }

  const coursesData = await coursesRes.json();
  const rawCourses = coursesData.courses || [];

  const courses: ClassroomCourse[] = rawCourses.map((c: any) => ({
    id: c.id || "",
    name: c.name || "Untitled Course",
    section: c.section || "",
    teacher: "",
    roomCode: c.enrollmentCode || "",
    link: c.alternateLink || "",
  }));

  // Step 2: Fetch coursework for each course
  const assignments: ClassroomAssignment[] = [];

  await Promise.all(
    rawCourses.map(async (course: any) => {
      if (!course.id) return;
      try {
        const cwUrl = `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork?courseWorkStates=PUBLISHED&pageSize=30`;
        const cwRes = await fetch(cwUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!cwRes.ok) return;

        const cwData = await cwRes.json();
        for (const cw of cwData.courseWork || []) {
          let dueDateStr = "No due date";
          if (cw.dueDate && cw.dueDate.year && cw.dueDate.month && cw.dueDate.day) {
            const y = cw.dueDate.year;
            const m = String(cw.dueDate.month).padStart(2, "0");
            const d = String(cw.dueDate.day).padStart(2, "0");
            dueDateStr = `${y}-${m}-${d}`;
          }

          let dueTimeStr = undefined;
          if (cw.dueTime && typeof cw.dueTime.hours === "number") {
            const hours = String(cw.dueTime.hours).padStart(2, "0");
            const minutes = String(cw.dueTime.minutes || 0).padStart(2, "0");
            dueTimeStr = `${hours}:${minutes}`;
          }

          assignments.push({
            id: cw.id || Math.random().toString(),
            courseId: course.id,
            courseName: course.name || "Course",
            title: cw.title || "Untitled Assignment",
            description: cw.description || "",
            dueDate: dueDateStr,
            dueTime: dueTimeStr,
            submitted: false,
            points: cw.maxPoints || 100,
            link: cw.alternateLink || "",
          });
        }
      } catch (cwErr) {
        console.warn(`Could not fetch coursework for course ${course.id}:`, cwErr);
      }
    })
  );

  return { courses, assignments };
};
