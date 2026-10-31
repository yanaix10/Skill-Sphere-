import { Request, Response, NextFunction } from "express";
import admin from "../config/firebase-config.js";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized: No token provided" });
	}

	const token = authHeader.split(" ")[1];

	// If Firebase Admin has not been initialized (missing service account credentials)
	if (!admin.apps.length) {
		if (process.env.NODE_ENV !== "production" || token === "dev-bypass-token") {
			req.user = { uid: "test-user-123", email: "agent@test.com", name: "DevUser" };
			return next();
		}
		return res.status(503).json({
			error: "Firebase Admin service account is not configured on the server."
		});
	}

	try {
		const decodedToken = await admin.auth().verifyIdToken(token);
		req.user = decodedToken;
		return next();
	} catch (error: any) {
		console.error("Firebase Auth Error:", error.message);
		return res.status(403).json({
			error: "Invalid or expired token",
		});
	}
};
