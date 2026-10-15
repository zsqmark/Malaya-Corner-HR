import { Request, Response, NextFunction } from 'express';
import { getAdminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    // SECURITY: never trust an unverified token. verifyIdToken validates the
    // signature against Google's public certs for this project — no Admin
    // service-account credentials are required for verification. Any failure
    // (bad signature, wrong aud/exp/iss, or forged token) must be rejected.
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
