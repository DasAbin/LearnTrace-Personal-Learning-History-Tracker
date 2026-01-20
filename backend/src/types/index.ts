import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}
