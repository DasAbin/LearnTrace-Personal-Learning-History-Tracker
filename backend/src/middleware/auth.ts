import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
}

/**
 * JWT Authentication Middleware
 * 
 * Protects routes by:
 * - Extracting JWT token from Authorization header
 * - Verifying token signature and expiration
 * - Attaching userId to request object for downstream use
 * - Returning 401 if token is missing or invalid
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check for Bearer token in Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);
    
    // Verify token signature and expiration
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string; email: string };
    
    // Attach userId to request for use in controllers
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
