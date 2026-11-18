import express, { Response, NextFunction } from 'express';
import admin from '../config/firebase-config.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import * as postController from '../controllers/postController.js';
import * as mediaController from '../controllers/mediaController.js';

const router = express.Router();

/**
 * Optional authentication middleware:
 * Extracts user if token is provided, without blocking requests that don't have a token.
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If dev parameter is present or no auth, provide dev user or guest
    const devHeader = req.headers['x-dev-user'] as string;
    if (devHeader || req.query.dev === 'true') {
      req.user = { uid: 'test-user-123', email: 'agent@test.com', name: 'DevUser' };
    }
    return next();
  }

  const token = authHeader.split(' ')[1];

  // Dev bypass support
  if (token === 'dev-bypass-token') {
    req.user = { uid: 'test-user-123', email: 'agent@test.com', name: 'DevUser' };
    return next();
  }

  if (!admin.apps.length) {
    req.user = { uid: 'test-user-123', email: 'agent@test.com', name: 'DevUser' };
    return next();
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch (err: any) {
    // Fall back to dev user in development if verification fails
    if (process.env.NODE_ENV !== 'production') {
      req.user = { uid: 'test-user-123', email: 'agent@test.com', name: 'DevUser' };
    }
    return next();
  }
};

// 1. Media search endpoint
router.get('/media/search', mediaController.searchMedia as any);

// 2. Feed list endpoint
router.get('/feed', optionalAuth as any, postController.getFeed as any);

// 3. Create post endpoint
router.post('/posts', optionalAuth as any, postController.createPost as any);

// 4. Like / Unlike endpoints
router.post('/posts/:id/like', optionalAuth as any, postController.likePost as any);
router.delete('/posts/:id/like', optionalAuth as any, postController.unlikePost as any);

export default router;

