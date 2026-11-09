import { Router } from "express";
import { google } from "googleapis";
import GoogleAuthToken from "../models/GoogleAuthToken.js";

const router = Router();

// In-memory token store fallback for environments without MongoDB connection
const memoryTokenStore = new Map<string, {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  email?: string;
}>();

const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/google/callback"
  );
};

const getAuthorizedClient = async (userId: string) => {
  const oauth2Client = getOAuth2Client();

  // Try DB first
  let tokenDoc = null;
  try {
    tokenDoc = await GoogleAuthToken.findOne({ userId });
  } catch (err) {
    console.warn("DB lookup error for Google token, checking memory fallback:", err);
  }

  const tokenData = tokenDoc || memoryTokenStore.get(userId);

  if (!tokenData || !tokenData.accessToken) {
    throw new Error("User has not connected Google Calendar / Classroom yet.");
  }

  oauth2Client.setCredentials({
    access_token: tokenData.accessToken,
    refresh_token: tokenData.refreshToken,
    expiry_date: tokenData.expiryDate,
  });

  // Automatically persist refreshed tokens
  oauth2Client.on("tokens", async (newTokens) => {
    try {
      if (tokenDoc) {
        tokenDoc.accessToken = newTokens.access_token || tokenDoc.accessToken;
        if (newTokens.refresh_token) tokenDoc.refreshToken = newTokens.refresh_token;
        if (newTokens.expiry_date) tokenDoc.expiryDate = newTokens.expiry_date;
        await tokenDoc.save();
      }
    } catch {}
    const mem = memoryTokenStore.get(userId);
    if (mem) {
      mem.accessToken = newTokens.access_token || mem.accessToken;
      if (newTokens.refresh_token) mem.refreshToken = newTokens.refresh_token;
      if (newTokens.expiry_date) mem.expiryDate = newTokens.expiry_date;
    }
  });

  return oauth2Client;
};

/**
 * GET /api/google/auth-url
 * Generates the unified OAuth consent URL for both Google Calendar and Google Classroom.
 */
router.get("/auth-url", (req, res): any => {
  const userId = String(req.query.userId || "default_user");
  const oauth2Client = getOAuth2Client();

  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/calendar.events.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
    "https://www.googleapis.com/auth/classroom.courses.readonly",
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state: userId,
  });

  return res.json({ success: true, url: authUrl });
});

/**
 * GET /api/google/callback
 * Google OAuth redirect endpoint: exchanges authorization code for tokens.
 */
router.get("/callback", async (req, res): Promise<any> => {
  const { code, state: rawState, error } = req.query;
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

  if (error) {
    console.error("Google OAuth error:", error);
    return res.redirect(`${frontendUrl}/dashboard?google_sync=error&message=${encodeURIComponent(String(error))}`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/dashboard?google_sync=error&message=No+code+provided`);
  }

  try {
    const userId = String(rawState || "default_user");
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(String(code));
    oauth2Client.setCredentials(tokens);

    // Fetch user email
    let userEmail = "";
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      userEmail = userInfo.data.email || "";
    } catch (e) {
      console.warn("Could not fetch userinfo email:", e);
    }

    // Persist to MongoDB
    try {
      await GoogleAuthToken.findOneAndUpdate(
        { userId },
        {
          userId,
          email: userEmail,
          accessToken: tokens.access_token || "",
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
          scope: tokens.scope,
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.warn("Could not save token to DB, caching in memory:", dbErr);
    }

    // Always cache in memory
    memoryTokenStore.set(userId, {
      accessToken: tokens.access_token || "",
      refreshToken: tokens.refresh_token || undefined,
      expiryDate: tokens.expiry_date || undefined,
      email: userEmail,
    });

    return res.redirect(
      `${frontendUrl}/dashboard?google_sync=success&email=${encodeURIComponent(userEmail)}&userId=${encodeURIComponent(userId)}`
    );
  } catch (err: any) {
    console.error("Failed to exchange Google OAuth code:", err);
    return res.redirect(
      `${frontendUrl}/dashboard?google_sync=error&message=${encodeURIComponent(err.message || "Token exchange failed")}`
    );
  }
});

/**
 * GET /api/google/status
 * Returns connection state and email for a given user.
 */
router.get("/status", async (req, res): Promise<any> => {
  const userId = String(req.query.userId || "default_user");
  try {
    let tokenDoc = null;
    try {
      tokenDoc = await GoogleAuthToken.findOne({ userId });
    } catch {}

    const mem = memoryTokenStore.get(userId);
    const isConnected = Boolean(tokenDoc?.accessToken || mem?.accessToken);
    const email = tokenDoc?.email || mem?.email || null;

    return res.json({ success: true, isConnected, email });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/google/disconnect
 * Clears stored tokens for a user.
 */
router.post("/disconnect", async (req, res): Promise<any> => {
  const userId = String(req.body.userId || "default_user");
  try {
    try {
      await GoogleAuthToken.deleteOne({ userId });
    } catch {}
    memoryTokenStore.delete(userId);
    return res.json({ success: true, message: "Disconnected successfully" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/google/calendar/events
 * Fetches upcoming events from user's primary Google Calendar.
 */
router.get("/calendar/events", async (req, res): Promise<any> => {
  const userId = String(req.query.userId || "default_user");
  try {
    const oauth2Client = await getAuthorizedClient(userId);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const now = new Date();
    // Default to events from start of today onwards
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const result = await calendar.events.list({
      calendarId: "primary",
      timeMin: startOfToday.toISOString(),
      maxResults: 60,
      singleEvents: true,
      orderBy: "startTime",
    });

    const items = result.data.items || [];
    const events = items.map((item) => {
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
        title: item.summary || "Untitled Meeting",
        date: dateStr,
        startTime,
        endTime,
        meetLink: item.hangoutLink || item.location || undefined,
        category,
        organizer: item.organizer?.displayName || item.organizer?.email || "Google Calendar",
        description: item.description || "",
      };
    });

    return res.json({ success: true, events });
  } catch (err: any) {
    console.error("Error fetching Google Calendar events:", err);
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/google/classroom/assignments
 * Fetches enrolled courses and all active published course assignments from Google Classroom.
 */
router.get("/classroom/assignments", async (req, res): Promise<any> => {
  const userId = String(req.query.userId || "default_user");
  try {
    const oauth2Client = await getAuthorizedClient(userId);
    const classroom = google.classroom({ version: "v1", auth: oauth2Client });

    // Step 1: Fetch active courses
    const coursesRes = await classroom.courses.list({
      courseStates: ["ACTIVE"],
      pageSize: 40,
    });

    const rawCourses = coursesRes.data.courses || [];
    const courses = rawCourses.map((c) => ({
      id: c.id || "",
      name: c.name || "Untitled Course",
      section: c.section || "",
      teacher: "",
      roomCode: c.enrollmentCode || "",
      link: c.alternateLink || "",
    }));

    // Step 2: Fetch coursework for each course
    const assignments: any[] = [];

    await Promise.all(
      rawCourses.map(async (course) => {
        if (!course.id) return;
        try {
          const cwRes = await classroom.courses.courseWork.list({
            courseId: course.id,
            courseWorkStates: ["PUBLISHED"],
            pageSize: 30,
          });

          for (const cw of cwRes.data.courseWork || []) {
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

    return res.json({ success: true, courses, assignments });
  } catch (err: any) {
    console.error("Error fetching Google Classroom data:", err);
    return res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
