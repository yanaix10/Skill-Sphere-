declare global {
  interface Window {
    google?: any;
  }
}

export type GoogleService = 'calendar' | 'classroom';

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

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/calendar.events.readonly",
].join(" ");

const CLASSROOM_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
].join(" ");

const getServiceKeys = (service: GoogleService = 'calendar') => ({
  token: `skillsphere_${service}_google_token`,
  email: `skillsphere_${service}_google_email`,
  expiry: `skillsphere_${service}_google_expiry`,
  connected: `skillsphere_${service}_connected`,
});

export const getGoogleToken = (service: GoogleService = 'calendar'): string | null => {
  const keys = getServiceKeys(service);
  const token = localStorage.getItem(keys.token) || localStorage.getItem("skillsphere_google_access_token");
  const expiry = localStorage.getItem(keys.expiry) || localStorage.getItem("skillsphere_google_token_expiry");
  if (token && expiry) {
    if (Date.now() > parseInt(expiry, 10)) {
      localStorage.removeItem(keys.token);
      localStorage.removeItem(keys.expiry);
      return null;
    }
  }
  return token;
};

export const getGoogleEmail = (service: GoogleService = 'calendar'): string => {
  const keys = getServiceKeys(service);
  return localStorage.getItem(keys.email) || localStorage.getItem(`skillsphere_${service}_email`) || localStorage.getItem("skillsphere_google_email") || "";
};

export const isGoogleConnected = (service: GoogleService = 'calendar'): boolean => {
  return Boolean(getGoogleToken(service));
};

export const disconnectGoogle = (service: GoogleService = 'calendar'): void => {
  const keys = getServiceKeys(service);
  localStorage.removeItem(keys.token);
  localStorage.removeItem(keys.email);
  localStorage.removeItem(keys.expiry);
  localStorage.removeItem(keys.connected);
  localStorage.removeItem(`skillsphere_${service}_email`);

  if (service === 'calendar') {
    localStorage.removeItem("skillsphere_calendar_meetings");
  } else {
    localStorage.removeItem("skillsphere_classroom_courses");
    localStorage.removeItem("skillsphere_classroom_assignments");
  }
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
 * Triggers Google OAuth popup using Google Identity Services (GIS).
 * Using prompt: "select_account" allows selecting between Personal and College accounts!
 */
export const requestGoogleAccess = async (service: GoogleService = 'calendar'): Promise<{ accessToken: string; email: string }> => {
  await loadGsiScript();

  const scopes = service === 'calendar' ? CALENDAR_SCOPES : CLASSROOM_SCOPES;
  const keys = getServiceKeys(service);

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: scopes,
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          const accessToken = tokenResponse.access_token;
          const expiresIn = parseInt(tokenResponse.expires_in || "3600", 10) * 1000;
          localStorage.setItem(keys.token, accessToken);
          localStorage.setItem(keys.expiry, String(Date.now() + expiresIn));
          localStorage.setItem(keys.connected, "true");

          // Fetch user profile email for this specific account
          let email = "";
          try {
            const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const userData = await userRes.json();
            email = userData.email || "";
            if (email) {
              localStorage.setItem(keys.email, email);
              localStorage.setItem(`skillsphere_${service}_email`, email);
            }
          } catch (e) {
            console.warn("Could not fetch Google userinfo:", e);
          }

          resolve({ accessToken, email });
        },
      });

      // Always prompt account selection so users can choose between Personal and College accounts
      tokenClient.requestAccessToken({ prompt: "select_account" });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Fetches upcoming Google Calendar events directly using Access Token
 */
export const fetchGoogleCalendarEvents = async (): Promise<CalendarEvent[]> => {
  const accessToken = getGoogleToken('calendar');
  if (!accessToken) {
    throw new Error("No active Google Calendar session found. Please sign in.");
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
      disconnectGoogle('calendar');
      throw new Error("Google Calendar session expired. Please sign in again.");
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
 * Fetches Google Classroom courses and assignments directly using Access Token.
 * Filters out old assignments from previous semesters / academic years.
 */
export const fetchGoogleClassroomData = async (): Promise<{ courses: ClassroomCourse[]; assignments: ClassroomAssignment[] }> => {
  const accessToken = getGoogleToken('classroom');
  if (!accessToken) {
    throw new Error("No active Google Classroom session found. Please sign in.");
  }

  // Step 1: Fetch active courses
  const coursesRes = await fetch("https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=40", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!coursesRes.ok) {
    if (coursesRes.status === 401) {
      disconnectGoogle('classroom');
      throw new Error("Google Classroom session expired. Please sign in again.");
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
  const now = new Date();
  // Cutoff: filter out assignments older than 60 days in the past (previous years / prior semesters)
  const cutoffDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

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
          let dueDateObj: Date | null = null;
          let dueDateStr = "No due date";

          if (cw.dueDate && cw.dueDate.year && cw.dueDate.month && cw.dueDate.day) {
            const y = cw.dueDate.year;
            const m = String(cw.dueDate.month).padStart(2, "0");
            const d = String(cw.dueDate.day).padStart(2, "0");
            dueDateStr = `${y}-${m}-${d}`;
            dueDateObj = new Date(y, cw.dueDate.month - 1, cw.dueDate.day);
          }

          // Filter out assignments from past semesters / previous years
          if (dueDateObj && dueDateObj < cutoffDate) {
            continue;
          }

          // If no due date, filter out if created more than 60 days ago
          if (!dueDateObj && cw.creationTime) {
            const created = new Date(cw.creationTime);
            if (!isNaN(created.getTime()) && created < cutoffDate) {
              continue;
            }
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

  // Sort: upcoming deadlines first, then no due date
  assignments.sort((a, b) => {
    if (a.dueDate === "No due date") return 1;
    if (b.dueDate === "No due date") return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return { courses, assignments };
};
