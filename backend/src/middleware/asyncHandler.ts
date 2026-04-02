import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Async Handler Middleware
 * 
 * Wraps async route handlers to catch any errors and pass them to the Express error handler.
 * This eliminates the need for try/catch blocks in controller functions.
 */
export const asyncHandler = (fn: Function): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
