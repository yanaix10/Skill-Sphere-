import admin from "firebase-admin";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

let serviceAccount: any = null;

// 1. Try environment variable FIREBASE_SERVICE_ACCOUNT (raw JSON or base64)
if (process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT.trim()) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
  try {
    if (raw.startsWith("{")) {
      serviceAccount = JSON.parse(raw);
    } else {
      const decoded = Buffer.from(raw, "base64").toString("utf-8");
      serviceAccount = JSON.parse(decoded);
    }
  } catch (err: any) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", err.message);
  }
}

// 2. Try local file serviceAccountKey.json
if (!serviceAccount) {
  try {
    const fileUrl = new URL("./serviceAccountKey.json", import.meta.url);
    const fileContent = await readFile(fileUrl, "utf8");
    serviceAccount = JSON.parse(fileContent);
  } catch (err) {
    // Local key file not present; normal in development without service account
  }
}

// 3. Try GOOGLE_APPLICATION_CREDENTIALS if set
if (!serviceAccount && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    const filePath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (existsSync(filePath)) {
      const content = await readFile(filePath, "utf8");
      serviceAccount = JSON.parse(content);
    }
  } catch (err: any) {
    console.error("❌ Failed to read GOOGLE_APPLICATION_CREDENTIALS file:", err.message);
  }
}

// Initialize Firebase Admin if credentials are ready
if (serviceAccount && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin successfully initialized for project:", serviceAccount.project_id || "configured");
  } catch (initErr: any) {
    console.error("❌ Error initializing Firebase Admin SDK:", initErr.message);
  }
} else if (!admin.apps.length) {
  console.warn(
    "⚠️ Firebase Admin not initialized (no serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT env var provided). " +
    "Token verification in authMiddleware will be disabled or mocked."
  );
}

export default admin;
